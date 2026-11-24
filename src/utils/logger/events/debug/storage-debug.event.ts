/**
 * Traces de diagnostic approfondi pour la couche de persistance.
 * @module utils/logger/events/debug/storage
 */

import { createLogger } from '../../logger.factory.js';

const storageDebugLog = createLogger('storage', 'cache');

/**
 * Consigne l'état du cache mémoire des ressources persistées.
 *
 * @param kind - Type de ressource observée.
 * @param count - Nombre d'éléments actuellement en mémoire.
 */
export function logStorageCacheTrace(kind: string, count: number) {
  storageDebugLog.debug(`État du cache pour "${kind}" : ${count} éléments`, {
    tags: ['debug', 'cache'],
    data: { kind, count },
  });
}
