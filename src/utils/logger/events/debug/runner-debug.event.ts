/**
 * Traces de diagnostic approfondi pour l'orchestrateur de scénarios.
 * @module utils/logger/events/debug/runner
 */

import { createLogger } from '../../logger.factory.js';

const runnerDebugLog = createLogger('runner', 'scenario');

/**
 * Consigne l'état du sac d'entrées d'un bloc de scénario à des fins de diagnostic.
 *
 * @param scenarioId - Identifiant unique du scénario parent.
 * @param nodeId - Identifiant du bloc analysé.
 * @param bag - Contenu du sac de variables d'entrée.
 */
export function logInputBagTrace(scenarioId: string, nodeId: string, bag: Record<string, unknown>) {
  runnerDebugLog.debug(`État du sac d'entrées pour le bloc "${nodeId}"`, {
    tags: ['debug', 'bag'],
    data: { scenarioId, nodeId, bag },
  });
}
