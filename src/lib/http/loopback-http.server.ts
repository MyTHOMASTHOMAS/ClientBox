import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { HttpRouter } from '../../types/contracts/http-router.contract.js';
import { serveStatic } from './in-memory-static.handler.js';
import { parseJsonBody } from './json-body.parser.js';
import {
  logServerListening,
  logServerClosed,
} from '../../utils/logger/events/info/server-info.event.js';
import {
  logHttpInternalError,
  logServerFatalError,
} from '../../utils/logger/events/errors/server-error.event.js';

/** Hôte d'écoute local exclusif (SPEC-SRV-02 / LIB-010). */
const LISTEN_HOST = '127.0.0.1';

/** Options de configuration pour la création du serveur HTTP local. */
export interface CreateLocalHttpServerOptions {
  readonly port: number;
  readonly router: HttpRouter;
  readonly host?: string;
}

/** Poignée de contrôle du serveur HTTP local permettant son arrêt gracieux. */
export interface LocalHttpServerHandle {
  readonly server: http.Server;
  close(): Promise<void>;
}

/**
 * Crée et démarre le serveur HTTP local ClientsBox (LIB-010).
 * Écoute exclusivement sur `127.0.0.1` au port fourni.
 *
 * @param options Options du serveur HTTP local (port, routeur)
 * @returns Poignée du serveur démarré
 */
export const createLocalHttpServer = async (options: CreateLocalHttpServerOptions) => {
  const { port, router, host = LISTEN_HOST } = options;

  const server = http.createServer((req, res) => {
    void dispatchRequest(req, res, { router });
  });

  await listenOnLocalhost(server, port, host);
  logServerListening(port, host);

  return {
    server,
    close() {
      return new Promise<void>((resolve, reject) => {
        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }
        server.close((err) => {
          if (err !== undefined && err !== null) {
            reject(err);
            return;
          }
          logServerClosed();
          resolve();
        });
      });
    },
  };
};

async function dispatchRequest(
  req: IncomingMessage,
  res: ServerResponse,
  context: { router: HttpRouter },
) {
  try {
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const parsed = await parseJsonBody(req);
        (req as IncomingMessage & { body?: unknown }).body = parsed;
      } catch (err: unknown) {
        void err;
      }
    }
    const handled = await Promise.resolve(context.router.handle(req, res));
    if (!handled) {
      serveStatic(req, res);
    }
  } catch (err: unknown) {
    logHttpInternalError(req.url ?? '/', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: 'Erreur interne du serveur.' }));
    }
  }
}

function listenOnLocalhost(server: http.Server, port: number, host = LISTEN_HOST) {
  return new Promise<void>((resolve, reject) => {
    const onError = (err: Error) => {
      server.off('listening', onListening);
      logServerFatalError('listen', err);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}
