/**
 * Événements d'erreurs de persistance et de manipulation du système de fichiers.
 * @module utils/logger/events/errors/storage
 */

import { createLogger } from '../../logger.factory.js';

const storageErrorLog = createLogger('storage', 'fs');

/**
 * Consigne une erreur survenue lors de la lecture d'un fichier de données.
 *
 * @param filePath - Chemin absolu ou relatif du fichier en lecture.
 * @param error - Exception interceptée.
 */
export function logStorageReadError(filePath: string, error: unknown) {
  storageErrorLog.error(`Échec de lecture du fichier "${filePath}"`, {
    tags: ['read', 'error'],
    data: { filePath, error },
  });
}

/**
 * Consigne une erreur survenue lors de l'écriture atomique d'un fichier.
 *
 * @param filePath - Chemin cible du fichier en écriture.
 * @param error - Exception interceptée.
 */
export function logStorageWriteError(filePath: string, error: unknown) {
  storageErrorLog.error(`Échec d'écriture atomique sur "${filePath}"`, {
    tags: ['write', 'error'],
    data: { filePath, error },
  });
}

/**
 * Consigne une erreur lors de la suppression d'une ressource sur le disque.
 *
 * @param filePath - Chemin du fichier dont la suppression a échoué.
 * @param error - Exception interceptée.
 */
export function logStorageDeleteError(filePath: string, error: unknown) {
  storageErrorLog.error(`Échec de suppression du fichier "${filePath}"`, {
    tags: ['delete', 'error'],
    data: { filePath, error },
  });
}
