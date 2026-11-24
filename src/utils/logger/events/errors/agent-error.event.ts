/**
 * Événements d'erreurs d'exécution des agents et sous-processus CLI.
 * @module utils/logger/events/errors/agent
 */

import { createLogger } from '../../logger.factory.js';

const agentErrorLog = createLogger('agent', 'cli');

/**
 * Consigne l'échec de démarrage d'un sous-processus agent.
 *
 * @param nodeId - Identifiant du bloc ayant échoué.
 * @param error - Exception ou objet d'erreur système.
 */
export function logAgentSpawnFailed(nodeId: string, error: unknown) {
  agentErrorLog.error(`Échec du lancement de l'agent pour le bloc "${nodeId}"`, {
    tags: ['spawn', 'error'],
    data: { nodeId, error },
  });
}

/**
 * Consigne une défaillance ou un code de sortie d'erreur d'un agent.
 *
 * @param nodeId - Identifiant du bloc exécuté.
 * @param error - Motif de l'échec ou exception.
 */
export function logAgentExecutionFailed(nodeId: string, error: unknown) {
  agentErrorLog.error(`Échec d'exécution de l'agent sur le bloc "${nodeId}"`, {
    tags: ['execution', 'error'],
    data: { nodeId, error },
  });
}
