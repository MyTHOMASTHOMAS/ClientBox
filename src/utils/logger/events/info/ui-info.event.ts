/**
 * Événements opérationnels de l'interface utilisateur web et du client HTTP.
 * @module utils/logger/events/info/ui
 */

import { createLogger } from '../../logger.factory.js';

const uiLog = createLogger('ui', 'client');

/**
 * Consigne l'émission d'une requête HTTP par le client navigateur.
 *
 * @param method - Méthode HTTP (GET, POST, etc.).
 * @param url - URL ou chemin cible de la requête.
 */
export function logClientRequest(method: string, url: string) {
  uiLog.info(`Requête HTTP émise : ${method} ${url}`, {
    tags: ['http', 'request'],
    data: { method, url },
  });
}

/**
 * Consigne la réception d'une réponse HTTP avec son code de statut.
 *
 * @param method - Méthode HTTP exécutée.
 * @param url - URL cible appelée.
 * @param status - Code de statut HTTP renvoyé (200, 201, etc.).
 */
export function logClientResponse(method: string, url: string, status: number) {
  uiLog.info(`Réponse HTTP reçue (${status}) pour ${method} ${url}`, {
    tags: ['http', 'response'],
    data: { method, url, status },
  });
}

/**
 * Consigne une interaction utilisateur clé sur le canvas de scénario.
 *
 * @param action - Action effectuée (ex. addBlock, saveScenario, selectNode).
 * @param scenarioId - Identifiant du scénario concerné.
 */
export function logCanvasAction(action: string, scenarioId: string) {
  uiLog.info(`Action canvas effectuée : "${action}" sur "${scenarioId}"`, {
    tags: ['canvas', 'interaction'],
    data: { action, scenarioId },
  });
}
