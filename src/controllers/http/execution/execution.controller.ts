/**
 * Enregistrement des routes HTTP d'exécution de scénarios.
 * Aucune route de reset manuel du contexte : la mémoire d'un agent est propre à l'exécution.
 */

import type { HttpRouter } from '../../../types/contracts/http-router.contract.js';
import { handleGetRun, handlePostRun, handleDeleteRun } from './execution-run.handler.js';
import type { RunnerHolder } from '../../shared/execution-runner.types.js';

export type { ActiveRunnerLike, RunnerHolder } from '../../shared/execution-runner.types.js';

function registerRunRoutes(router: HttpRouter, runnerHolder: RunnerHolder) {
  router.get('/api/scenarios/:id/run', handleGetRun(runnerHolder));
  router.post('/api/scenarios/:id/run', handlePostRun(runnerHolder));
  router.delete('/api/scenarios/:id/run', handleDeleteRun(runnerHolder));
}

/**
 * Enregistre les routes HTTP d'exécution de scénarios (snapshot, lancement et arrêt d'urgence).
 *
 * @param router - Instance de routeur HTTP.
 * @param runnerHolder - Gestionnaire de l'instance d'exécution active.
 */
export function registerExecutionRoutes(router: HttpRouter, runnerHolder: RunnerHolder) {
  registerRunRoutes(router, runnerHolder);
}
