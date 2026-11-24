/**
 * Événements d'erreurs de l'interface web et des requêtes client.
 * @module utils/logger/events/errors/ui
 */

import { createLogger } from '../../logger.factory.js';

const uiErrorLog = createLogger('ui', 'client');

/**
 * Consigne l'échec d'une requête HTTP initiée depuis l'interface web.
 *
 * @param method - Méthode HTTP en échec.
 * @param url - URL ayant causé l'échec.
 * @param error - Exception ou objet de rejet intercepté.
 */
export function logClientHttpError(method: string, url: string, error: unknown) {
  uiErrorLog.error(`Échec de la requête HTTP ${method} ${url}`, {
    tags: ['http', 'error'],
    data: { method, url, error },
  });
}

/**
 * Consigne une erreur survenue lors d'une manipulation du canvas.
 *
 * @param action - Action ayant généré l'exception.
 * @param error - Exception interceptée.
 */
export function logCanvasError(action: string, error: unknown) {
  uiErrorLog.error(`Erreur lors de l'action canvas "${action}"`, {
    tags: ['canvas', 'error'],
    data: { action, error },
  });
}
