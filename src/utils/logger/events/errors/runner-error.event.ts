/**
 * Événements d'échecs et d'erreurs pour l'orchestrateur de scénarios.
 * @module utils/logger/events/errors/runner
 */

import { createLogger } from '../../logger.factory.js';

const runnerErrorLog = createLogger('runner', 'scenario');

/**
 * Consigne l'échec global de l'exécution d'un scénario.
 *
 * @param scenarioId - Identifiant unique du scénario en échec.
 * @param error - Exception ou objet de cause intercepté.
 */
export function logScenarioFailed(scenarioId: string, error: unknown) {
  runnerErrorLog.error(`Échec de l'exécution du scénario "${scenarioId}"`, {
    tags: ['error', 'failed'],
    data: error,
  });
}

/**
 * Consigne l'échec d'un bloc particulier du scénario.
 *
 * @param scenarioId - Identifiant du scénario parent.
 * @param nodeId - Identifiant du bloc ayant échoué.
 * @param error - Exception ou motif de l'erreur.
 */
export function logBlockFailed(scenarioId: string, nodeId: string, error: unknown) {
  runnerErrorLog.error(`Échec lors de l'exécution du bloc "${nodeId}"`, {
    tags: ['block', 'error'],
    data: { scenarioId, nodeId, error },
  });
}
