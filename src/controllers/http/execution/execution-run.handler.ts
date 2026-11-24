/**
 * Handlers HTTP GET/POST/DELETE /api/scenarios/:id/run.
 */

import type {
  HttpRequestLike,
  HttpResponseLike,
} from '../../../types/contracts/http-router.contract.js';
import { logHttpInternalError } from '../../../utils/logger/events/errors/server-error.event.js';
import type { RunnerHolder } from '../../shared/execution-runner.types.js';
import { buildExecutionSnapshot, sendError, sendJson } from './execution-http.helper.js';

/**
 * Snapshot GET /run.
 * @param runnerHolder Holder runner
 */
export function handleGetRun(runnerHolder: RunnerHolder) {
  return async (_req: HttpRequestLike, res: HttpResponseLike, params: { id?: string }) => {
    const scenarioId = params.id;
    if (!scenarioId) {
      sendError(res, 400, 'Identifiant de scénario manquant.');
      return;
    }
    try {
      sendJson(res, 200, buildExecutionSnapshot(runnerHolder.activeRunner, scenarioId));
    } catch (err: unknown) {
      logHttpInternalError(`/api/scenarios/${scenarioId}/run`, err);
      sendError(res, 500, err instanceof Error ? err.message : `${err}`);
    }
  };
}

/**
 * Lancement POST /run.
 * @param runnerHolder Holder runner
 */
export function handlePostRun(runnerHolder: RunnerHolder) {
  return async (_req: HttpRequestLike, res: HttpResponseLike, params: { id?: string }) => {
    const scenarioId = params.id;
    if (!scenarioId) {
      sendError(res, 400, 'Identifiant de scénario manquant.');
      return;
    }
    if (!runnerHolder || typeof runnerHolder.startRunner !== 'function') {
      sendError(res, 503, 'Service de runner non initialisé.');
      return;
    }
    if (runnerHolder.activeRunner) {
      sendError(res, 409, 'Une exécution de scénario est déjà en cours.');
      return;
    }
    try {
      await runnerHolder.startRunner(scenarioId);
      sendJson(res, 200, { success: true, message: 'Scénario démarré avec succès.' });
    } catch (err: unknown) {
      logHttpInternalError(`/api/scenarios/${scenarioId}/run`, err);
      sendError(res, 500, err instanceof Error ? err.message : `${err}`);
    }
  };
}

/**
 * Arrêt DELETE /run.
 * @param runnerHolder Holder runner
 */
export function handleDeleteRun(runnerHolder: RunnerHolder) {
  return async (_req: HttpRequestLike, res: HttpResponseLike) => {
    try {
      if (runnerHolder.stopActiveRunner) {
        await runnerHolder.stopActiveRunner();
      } else if (runnerHolder.activeRunner) {
        await runnerHolder.activeRunner.stop();
        runnerHolder.activeRunner = null;
      }
      sendJson(res, 200, { success: true, message: 'Scénario arrêté.' });
    } catch (err: unknown) {
      logHttpInternalError('/api/scenarios/:id/run', err);
      sendError(res, 500, err instanceof Error ? err.message : `${err}`);
    }
  };
}
