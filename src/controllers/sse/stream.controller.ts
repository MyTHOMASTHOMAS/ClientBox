import type { HttpRouter } from '../../types/contracts/http-router.contract.js';
import type {
  HttpRequestLike,
  HttpResponseLike,
} from '../../types/contracts/http-router.contract.js';
import type { RunnerHolder } from '../shared/execution-runner.types.js';
import {
  logSseConnectionOpened,
  logSseConnectionClosed,
} from '../../utils/logger/events/info/server-info.event.js';

function resolveEventBus(runnerHolder: RunnerHolder) {
  if (typeof (runnerHolder as unknown as { on?: unknown }).on === 'function') {
    return runnerHolder as unknown as {
      on(ev: string, fn: (d: unknown) => void): void;
      off(ev: string, fn: (d: unknown) => void): void;
    };
  }
  return runnerHolder.activeRunner as unknown as
    | {
        on(ev: string, fn: (d: unknown) => void): void;
        off(ev: string, fn: (d: unknown) => void): void;
      }
    | undefined;
}

function resolveActiveScenarioId(runnerHolder: RunnerHolder) {
  const active = runnerHolder.activeRunner;
  if (!active) return null;
  if (typeof active.getScenarioId === 'function') {
    return active.getScenarioId();
  }
  return null;
}

/** Options d'ouverture d'une connexion SSE scénario. */
interface StreamConnectionOptions {
  readonly req: HttpRequestLike;
  readonly res: HttpResponseLike;
  readonly runnerHolder: RunnerHolder;
  readonly requestedScenarioId?: string;
}

function handleStreamConnection(options: StreamConnectionOptions) {
  const { req, res, runnerHolder, requestedScenarioId } = options;
  logSseConnectionOpened(req.url ?? 'stream');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  (res as unknown as { flushHeaders?: () => void }).flushHeaders?.();

  const activeScenarioId = resolveActiveScenarioId(runnerHolder);
  // REQ-040 / ADR-018 : le canal d'un id ≠ racine active ne publie pas le sous-run
  const shouldSubscribe =
    !requestedScenarioId || !activeScenarioId || requestedScenarioId === activeScenarioId;

  const bus = shouldSubscribe ? resolveEventBus(runnerHolder) : undefined;
  const onData = (data: unknown) => {
    res.write?.(`data: ${JSON.stringify(data)}\n\n`);
  };

  if (bus?.on) {
    bus.on('chunkReceived', onData);
    bus.on('statusChanged', onData);
    bus.on('blockStatusChanged', onData);
  }

  if (typeof (req as { on?: (ev: string, fn: () => void) => void }).on === 'function') {
    (req as { on: (ev: string, fn: () => void) => void }).on('close', () => {
      logSseConnectionClosed(req.url ?? 'stream');
      if (bus?.off) {
        bus.off('chunkReceived', onData);
        bus.off('statusChanged', onData);
        bus.off('blockStatusChanged', onData);
      }
    });
  }
}

/**
 * Enregistre la route de streaming temps réel Server-Sent Events (SSE).
 *
 * @param router - Instance de routeur HTTP.
 * @param runnerHolder - Gestionnaire de l'instance d'exécution active.
 */
export function registerStreamRoute(router: HttpRouter, runnerHolder: RunnerHolder) {
  const handler = (req: HttpRequestLike, res: HttpResponseLike, params?: { id?: string }) =>
    handleStreamConnection({
      req,
      res,
      runnerHolder,
      requestedScenarioId: params?.id,
    });
  router.get('/api/scenarios/:id/stream', handler);
  router.get('/api/stream', handler);
}
