/**
 * Événements opérationnels liés aux agents et sous-processus CLI.
 * @module utils/logger/events/info/agent
 */

import { createLogger } from '../../logger.factory.js';

const agentLog = createLogger('agent', 'cli');

/**
 * Consigne le lancement d'un processus agent avec son identifiant système.
 *
 * @param nodeId - Identifiant du bloc de scénario associé.
 * @param pid - Identifiant de processus système (PID).
 */
export function logAgentProcessStarted(nodeId: string, pid: number) {
  agentLog.info(`Processus agent lancé pour le bloc "${nodeId}" (PID ${pid})`, {
    tags: ['spawn', 'start'],
    data: { nodeId, pid },
  });
}

/**
 * Consigne l'arrêt ou la complétion d'un processus agent avec son code de sortie.
 *
 * @param nodeId - Identifiant du bloc de scénario.
 * @param exitCode - Code de retour du processus.
 * @param durationMs - Durée d'exécution en millisecondes.
 */
export function logAgentProcessExited(nodeId: string, exitCode: number, durationMs: number) {
  agentLog.info(`Processus agent achevé pour le bloc "${nodeId}" (code ${exitCode})`, {
    tags: ['exit'],
    ms: durationMs,
    data: { nodeId, exitCode },
  });
}

/**
 * Consigne l'assemblage réussi d'un prompt pour un agent.
 *
 * @param agentId - Identifiant de l'agent destinataire.
 * @param promptName - Nom du prompt injecté.
 */
export function logAgentPromptGenerated(agentId: string, promptName: string) {
  agentLog.info(`Prompt "${promptName}" généré avec succès pour l'agent "${agentId}"`, {
    tags: ['prompt'],
    data: { agentId, promptName },
  });
}

/**
 * Consigne la réception d'un signal système d'arrêt gracieux.
 *
 * @param signal - Nom du signal reçu (ex. SIGINT, SIGTERM).
 */
export function logShutdownSignalReceived(signal: string) {
  agentLog.info(`Signal d'arrêt système reçu : ${signal}`, {
    tags: ['shutdown', 'signal'],
    data: { signal },
  });
}
