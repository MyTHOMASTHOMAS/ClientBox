/**
 * Écriture atomique JSON (LIB-001 / ADR-005) : .tmp puis renameSync.
 * Seul module autorisé à écrire des JSON sous `.agents/data/`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { logStorageWriteError } from '../../utils/logger/events/errors/storage-error.event.js';

/**
 * Écrit de manière atomique un contenu JSON sur le disque (.tmp puis rename).
 *
 * @param filePath Chemin absolu ou relatif du fichier cible
 * @param data Données à sérialiser en JSON
 */
export function atomicWriteJson(filePath: string, data: unknown) {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err: unknown) {
    logStorageWriteError(filePath, err);
    throw err;
  }
}
