/**
 * Accès disque aux scripts conditionnels If (répertoire data/if).
 */

import {
  fileExists,
  joinPaths,
  listFiles,
  readTextFile,
} from '../../lib/fs/json-fresh-reader.fs.js';
import { deleteFile } from '../../lib/fs/file-remover.fs.js';

/** Options de listage des scripts If. */
export interface ListIfScriptsOptions {
  readonly onWarning?: (message: string) => void;
}

/**
 * Liste les identifiants de scripts If présents sous data/if.
 * @param dataRoot Racine `.agents/data`
 * @param options Options de listage
 */
export function listIfScripts(dataRoot: string, options: ListIfScriptsOptions = {}) {
  const dir = joinPaths(dataRoot, 'if');
  if (!fileExists(dir)) {
    options.onWarning?.(`Répertoire if absent ou inexistant : ${dir}`);
    return [];
  }
  return listFiles(dir, '.js').map((f) => f.replace(/\.js$/iu, ''));
}

/**
 * Supprime un script If du disque.
 * @param dataRoot Racine `.agents/data`
 * @param id Identifiant du script
 */
export function deleteIfScript(dataRoot: string, id: string) {
  deleteFile(joinPaths(dataRoot, 'if', `${id}.js`));
}

/**
 * Résout le chemin absolu d'un script If (anti path-traversal).
 * @param dataRoot Racine `.agents/data`
 * @param id Identifiant du script
 */
export function resolveIfScriptPath(dataRoot: string, id: string) {
  if (!id || id.includes('..') || id.includes('/') || id.includes('\\')) {
    throw new Error(`Identifiant de script invalide (traversée de répertoire interdite) : ${id}`);
  }
  const cleanId = id.endsWith('.js') ? id.slice(0, -3) : id;
  return joinPaths(dataRoot, 'if', `${cleanId}.js`);
}

/**
 * Lit le contenu texte d'un script If.
 * @param dataRoot Racine `.agents/data`
 * @param id Identifiant du script
 */
export function readIfScript(dataRoot: string, id: string) {
  const scriptPath = resolveIfScriptPath(dataRoot, id);
  if (!fileExists(scriptPath)) {
    throw new Error(`Script conditionnel If introuvable : ${id}`);
  }
  return readTextFile(scriptPath);
}

/**
 * Lit un script If ou retourne null s'il est absent.
 * @param dataRoot Racine `.agents/data`
 * @param id Identifiant du script
 */
export function getIfScriptOrNull(dataRoot: string, id: string) {
  try {
    return readIfScript(dataRoot, id);
  } catch {
    return null;
  }
}
