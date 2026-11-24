/**
 * Événements opérationnels de persistance et de stockage.
 * @module utils/logger/events/info/storage
 */

import { createLogger } from '../../logger.factory.js';

const storageLog = createLogger('storage', 'fs');

/**
 * Consigne la sauvegarde réussie d'une ressource sur le disque.
 *
 * @param kind - Type de ressource (scenarios, agents, prompts, etc.).
 * @param id - Identifiant unique de la ressource enregistrée.
 */
export function logResourceSaved(kind: string, id: string) {
  storageLog.info(`Ressource "${kind}" enregistrée : ${id}`, {
    tags: ['save', 'success'],
    data: { kind, id },
  });
}

/**
 * Consigne la suppression réussie d'une ressource du disque.
 *
 * @param kind - Type de ressource supprimée.
 * @param id - Identifiant de la ressource supprimée.
 */
export function logResourceDeleted(kind: string, id: string) {
  storageLog.info(`Ressource "${kind}" supprimée : ${id}`, {
    tags: ['delete', 'success'],
    data: { kind, id },
  });
}

/**
 * Consigne le chargement réussi d'une ressource depuis le disque.
 *
 * @param kind - Type de ressource lue.
 * @param id - Identifiant de la ressource lue.
 */
export function logResourceLoaded(kind: string, id: string) {
  storageLog.info(`Ressource "${kind}" chargée : ${id}`, {
    tags: ['load'],
    data: { kind, id },
  });
}
