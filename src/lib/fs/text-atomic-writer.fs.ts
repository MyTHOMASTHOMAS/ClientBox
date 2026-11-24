/**
 * Écriture atomique de fichiers texte/Markdown sous docsRoot (LIB-016 / ADR-017).
 */

import fs from 'node:fs';
import path from 'node:path';
import { logStorageWriteError } from '../../utils/logger/events/errors/storage-error.event.js';

/**
 * Écrit un contenu texte de façon atomique (.tmp + rename) sous un chemin cible.
 *
 * @param filePath Chemin absolu du fichier Markdown/texte
 * @param content Contenu UTF-8 à persister
 */
export function atomicWriteText(filePath: string, content: string) {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch (err: unknown) {
    logStorageWriteError(filePath, err);
    throw err;
  }
}

/**
 * Écrit un fichier relatif sous docsRoot (jointure de chemin encapsulée dans lib/).
 *
 * @param docsRoot Racine `.agents/docs/`
 * @param relativePath Chemin relatif du fichier Markdown
 * @param content Contenu UTF-8
 */
export function atomicWriteDocsRelative(docsRoot: string, relativePath: string, content: string) {
  atomicWriteText(path.join(docsRoot, relativePath), content);
}
