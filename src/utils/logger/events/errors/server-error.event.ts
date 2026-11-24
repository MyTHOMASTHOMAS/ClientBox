/**
 * Événements d'erreurs pour le serveur HTTP et le flux SSE.
 * @module utils/logger/events/errors/server
 */

import { createLogger } from '../../logger.factory.js';

const serverErrorLog = createLogger('server', 'http');

/**
 * Consigne une erreur fatale lors du démarrage ou du fonctionnement du serveur HTTP.
 *
 * @param operation - Nom de l'opération en échec (ex. listen, bind).
 * @param error - Exception ou cause technique interceptée.
 */
export function logServerFatalError(operation: string, error: unknown) {
  serverErrorLog.error(`Échec critique du serveur HTTP lors de l'opération "${operation}"`, {
    tags: ['fatal', 'error'],
    data: error,
  });
}

/**
 * Consigne l'absence de correspondance de route HTTP (404).
 *
 * @param method - Méthode HTTP demandée.
 * @param pathname - Chemin d'accès non trouvé.
 */
export function logRouteNotFoundError(method: string, pathname: string) {
  serverErrorLog.warn(`Route introuvable : ${method} ${pathname}`, {
    tags: ['404', 'not-found'],
    data: { method, pathname },
  });
}

/**
 * Consigne une erreur interne non gérée lors du traitement d'une requête (500).
 *
 * @param pathname - Chemin d'accès ayant généré l'exception.
 * @param error - Exception ou cause d'erreur interceptée.
 */
export function logHttpInternalError(pathname: string, error: unknown) {
  serverErrorLog.error(`Erreur interne 500 sur le chemin "${pathname}"`, {
    tags: ['500', 'error'],
    data: error,
  });
}
