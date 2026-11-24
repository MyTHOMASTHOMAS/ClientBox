/**
 * Lecture fraîche JSON depuis le disque, sans cache (LIB-002 / ADR-005).
 * Erreurs de désérialisation explicites — pas de crash processus non maîtrisé.
 */

import fs from 'node:fs';
import path from 'node:path';
import { logStorageReadError } from '../../utils/logger/events/errors/storage-error.event.js';

/**
 * Combine des segments de chemin sous forme de chemin normalisé.
 *
 * @param paths Segments de chemin à combiner
 * @returns Chemin combiné normalisé
 */
export function joinPaths(...paths: string[]) {
  return path.join(...paths);
}

/**
 * Lit et parse un fichier JSON depuis le disque sans cache.
 *
 * @param filePath Chemin du fichier JSON à lire
 * @returns Données désérialisées
 */
export function readJsonFile<T>(filePath: string) {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (cause: unknown) {
    logStorageReadError(filePath, cause);
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Impossible de lire le fichier JSON ${filePath}: ${detail}`);
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch (cause: unknown) {
    logStorageReadError(filePath, cause);
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Échec du parse JSON pour ${filePath}: ${detail}`);
  }
}

/**
 * Lit le contenu textuel UTF-8 d'un fichier depuis le disque sans cache.
 *
 * @param filePath Chemin du fichier à lire
 * @returns Contenu textuel UTF-8
 */
export function readTextFile(filePath: string) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (cause: unknown) {
    logStorageReadError(filePath, cause);
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Impossible de lire le fichier ${filePath}: ${detail}`);
  }
}

/**
 * Liste les noms de fichiers d'un répertoire filtrés par extension (ex. `.json`).
 *
 * @param dir Répertoire cible
 * @param ext Extension de fichier à filtrer
 * @returns Liste ordonnée des noms de fichiers
 */
export function listFiles(dir: string, ext: string) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(normalizedExt))
    .sort();
}

/**
 * Vérifie l'existence physique d'un fichier ou répertoire.
 *
 * @param filePath Chemin du fichier ou répertoire à vérifier
 * @returns Booléen indiquant si le chemin existe
 */
export function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}
