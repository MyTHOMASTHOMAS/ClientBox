/**
 * Helpers HTTP d'exécution (JSON, erreurs, snapshot run).
 */

import type { HttpResponseLike } from '../../../types/contracts/http-router.contract.js';
import type { ActiveRunnerLike } from '../../shared/execution-runner.types.js';

/**
 * Envoie une réponse JSON.
 * @param res Réponse HTTP
 * @param statusCode Code
 * @param data Corps
 */
export function sendJson(res: HttpResponseLike, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/**
 * Envoie une erreur JSON `{ message }`.
 * @param res Réponse HTTP
 * @param statusCode Code
 * @param message Message
 */
export function sendError(res: HttpResponseLike, statusCode: number, message: string) {
  sendJson(res, statusCode, { message });
}

/**
 * Construit le snapshot d'exécution pour GET /run.
 * @param active Runner actif
 * @param requestedId Id scénario demandé
 */
export function buildExecutionSnapshot(
  active: ActiveRunnerLike | null | undefined,
  requestedId: string,
) {
  if (!active) {
    return {
      status: 'idle',
      activeScenarioId: null as string | null,
      busy: false,
      blocks: [] as { nodeId: string; status: string }[],
    };
  }
  const activeScenarioId =
    typeof active.getScenarioId === 'function' ? active.getScenarioId() : null;
  const status = typeof active.getStatus === 'function' ? active.getStatus() : 'running';
  const blockMap = typeof active.getBlockStatuses === 'function' ? active.getBlockStatuses() : null;
  const blocks =
    activeScenarioId === requestedId && blockMap
      ? [...blockMap.entries()].map(([nodeId, blockStatus]) => ({
          nodeId,
          status: blockStatus,
        }))
      : [];
  return {
    status,
    activeScenarioId,
    busy: true,
    blocks,
  };
}
