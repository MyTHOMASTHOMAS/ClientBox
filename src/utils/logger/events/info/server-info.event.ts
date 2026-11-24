/**
 * Événements opérationnels pour le serveur HTTP et le flux SSE.
 * @module utils/logger/events/info/server
 */

import { createLogger } from '../../logger.factory.js';

const serverLog = createLogger('server', 'http');
const sseLog = createLogger('server', 'sse');

/**
 * Consigne l'écoute active du serveur HTTP local.
 *
 * @param port - Port TCP d'écoute effectif.
 * @param host - Hôte local configuré.
 */
export function logServerListening(port: number, host = 'localhost') {
  serverLog.info(`Serveur HTTP en écoute sur http://${host}:${port}`, {
    tags: ['ready'],
    data: { port, host },
  });
}

/**
 * Consigne l'arrêt propre du serveur HTTP local.
 */
export function logServerClosed() {
  serverLog.info('Serveur HTTP local arrêté avec succès', {
    tags: ['shutdown'],
  });
}

/**
 * Consigne la prise en charge d'une requête entrante par le routeur HTTP.
 *
 * @param method - Méthode HTTP (GET, POST, etc.).
 * @param pathname - Chemin d'accès de la requête.
 */
export function logRequestDispatched(method: string, pathname: string) {
  serverLog.info(`Requête entrante ${method} ${pathname}`, {
    tags: ['route'],
    data: { method, pathname },
  });
}

/**
 * Consigne l'ouverture d'une nouvelle connexion SSE pour un scénario.
 *
 * @param scenarioId - Identifiant du scénario écouté.
 */
export function logSseConnectionOpened(scenarioId: string) {
  sseLog.info(`Connexion du flux SSE ouverte pour le scénario "${scenarioId}"`, {
    tags: ['open'],
    data: { scenarioId },
  });
}

/**
 * Consigne la fermeture d'un flux SSE suite à la déconnexion d'un client.
 *
 * @param scenarioId - Identifiant du scénario écouté.
 */
export function logSseConnectionClosed(scenarioId: string) {
  sseLog.info(`Connexion du flux SSE fermée pour le scénario "${scenarioId}"`, {
    tags: ['close'],
    data: { scenarioId },
  });
}
