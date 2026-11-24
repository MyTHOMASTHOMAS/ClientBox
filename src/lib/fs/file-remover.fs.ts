/**
 * Suppression physique de fichier (LIB-011 / ADR-005).
 * Idempotent si le fichier est déjà absent.
 */

import fs from 'node:fs';

/**
 * Supprime un fichier du système de fichiers de manière idempotente si absent.
 *
 * @param filePath Chemin du fichier à supprimer
 */
export function deleteFile(filePath: string) {
  try {
    fs.unlinkSync(filePath);
  } catch (cause: unknown) {
    const code =
      cause !== null && typeof cause === 'object' && 'code' in cause
        ? String((cause as { code: unknown }).code)
        : '';
    if (code === 'ENOENT') {
      return;
    }
    throw cause;
  }
}
