/**
 * Traces de diagnostic approfondi pour le serveur HTTP et le routage.
 * @module utils/logger/events/debug/server
 */

import { createLogger } from '../../logger.factory.js';

const serverDebugLog = createLogger('server', 'routing');

/**
 * Consigne la correspondance entre une requête et un motif de route enregistré.
 *
 * @param method - Méthode HTTP de la requête.
 * @param pattern - Motif d'URL ayant correspondu.
 */
export function logRouteMatched(method: string, pattern: string) {
  serverDebugLog.debug(`Route sélectionnée : ${method} ${pattern}`, {
    tags: ['debug', 'match'],
    data: { method, pattern },
  });
}

/**
 * Consigne l'intégralité des en-têtes HTTP reçus pour diagnostic.
 *
 * @param method - Méthode HTTP de la requête.
 * @param pathname - Chemin d'accès demandé.
 * @param headers - Dictionnaire des en-têtes HTTP reçus.
 */
export function logRequestHeadersTrace(
  method: string,
  pathname: string,
  headers: Record<string, string>,
) {
  serverDebugLog.debug(`En-têtes reçus pour ${method} ${pathname}`, {
    tags: ['debug', 'headers'],
    data: { method, pathname, headers },
  });
}
