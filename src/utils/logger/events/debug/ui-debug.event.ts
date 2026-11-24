/**
 * Traces de diagnostic approfondi pour les composants UI du navigateur.
 * @module utils/logger/events/debug/ui
 */

import { createLogger } from '../../logger.factory.js';

const uiDebugLog = createLogger('ui', 'trace');

/**
 * Consigne la charge utile d'un composant ou d'une requête client pour analyse.
 *
 * @param url - Identifiant ou URL associée à la trace.
 * @param payload - Données ou état inspecté.
 */
export function logClientPayloadTrace(url: string, payload: unknown) {
  uiDebugLog.debug(`Charge utile analysée pour "${url}"`, {
    tags: ['debug', 'payload'],
    data: { url, payload },
  });
}
