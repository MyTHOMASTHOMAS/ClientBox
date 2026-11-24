/**
 * Événements opérationnels et succès d'exécution pour l'orchestrateur de scénarios.
 * @module utils/logger/events/info/runner
 */

import { createLogger } from '../../logger.factory.js';

const runnerLog = createLogger('runner', 'scenario');

/**
 * Consigne le démarrage d'un scénario et le nombre de nœuds à orchestrer.
 *
 * @param scenarioId - Identifiant unique du scénario lancé.
 * @param nodeCount - Nombre total de nœuds composant le graphe.
 */
export function logScenarioStarted(scenarioId: string, nodeCount: number) {
  runnerLog.info(`Démarrage du scénario "${scenarioId}" (${nodeCount} blocs)`, {
    tags: ['start'],
    data: { scenarioId, nodeCount },
  });
}

/**
 * Consigne le succès d'exécution d'un bloc de scénario avec sa durée.
 *
 * @param scenarioId - Identifiant du scénario parent.
 * @param nodeId - Identifiant du bloc exécuté.
 * @param durationMs - Durée d'exécution du bloc en millisecondes.
 */
export function logBlockExecuted(scenarioId: string, nodeId: string, durationMs: number) {
  runnerLog.info(`Exécution du bloc "${nodeId}" réussie`, {
    tags: ['block', 'success'],
    ms: durationMs,
    data: { scenarioId, nodeId },
  });
}

/**
 * Consigne l'achèvement complet et réussi d'un scénario.
 *
 * @param scenarioId - Identifiant du scénario terminé.
 * @param durationMs - Durée totale d'exécution en millisecondes.
 */
export function logScenarioCompleted(scenarioId: string, durationMs: number) {
  runnerLog.success(`Scénario "${scenarioId}" terminé avec succès`, {
    tags: ['completed'],
    ms: durationMs,
    data: { scenarioId },
  });
}
