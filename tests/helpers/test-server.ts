import http from 'node:http';
import type { RequestListener } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface EphemeralHttpServer {
  readonly server: http.Server;
  readonly host: string;
  readonly port: number;
  readonly baseUrl: string;
  close(): Promise<void>;
}

const DEFAULT_HOST = '127.0.0.1';

function readListeningPort(server: http.Server): number {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error("Le serveur HTTP de test n'est pas en écoute sur un socket TCP.");
  }
  const info: AddressInfo = address;
  return info.port;
}

/**
 * Démarre un serveur HTTP local éphémère (port 0 = allocation OS, ou port fixe).
 */
export function startEphemeralHttpServer(
  listener?: RequestListener,
  options?: { host?: string; port?: number },
): Promise<EphemeralHttpServer> {
  const host = options?.host ?? DEFAULT_HOST;
  const requestListener: RequestListener =
    listener ??
    ((_req, res) => {
      res.statusCode = 204;
      res.end();
    });

  const server = http.createServer(requestListener);

  return new Promise<EphemeralHttpServer>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options?.port ?? 0, host, () => {
      server.removeAllListeners('error');
      const port = readListeningPort(server);
      const publicHost = host === '127.0.0.1' ? 'localhost' : host;
      resolve({
        server,
        host,
        port,
        baseUrl: `http://${publicHost}:${port}`,
        close(): Promise<void> {
          return new Promise<void>((closeResolve, closeReject) => {
            server.close((err) => {
              if (err !== undefined && err !== null) {
                closeReject(err);
                return;
              }
              closeResolve();
            });
          });
        },
      });
    });
  });
}

/** Occupe un port fixe jusqu'à appel de `release()`. */
export async function occupyPort(
  port: number,
  host = DEFAULT_HOST,
): Promise<{
  readonly holder: EphemeralHttpServer;
  release(): Promise<void>;
}> {
  const holder = await startEphemeralHttpServer(undefined, { host, port });
  return {
    holder,
    release: () => holder.close(),
  };
}

/** Probe HTTP GET simple (sans dépendance fetch externe). */
export function httpGetOk(url: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on('error', reject);
  });
}
