/**
 * Sélection / expansion navigation doc Instructions — ADR-017 / UI-056.
 */

import type { DocTreeFolder, UserDocManifestEntry } from '../../i18n/user-docs.manifest.js';

export { buildDocTree, isReadmePath } from './user-docs-tree.builder.js';

/**
 * Premier document ouvrable sous un dossier (fichier enfant direct, sinon README).
 *
 * @param folder Dossier du sommaire
 */
export function firstOpenableDocId(folder: DocTreeFolder) {
  for (const child of folder.children) {
    if (child.kind === 'file') return child.doc.id;
  }
  return folder.indexDoc?.id;
}

/**
 * Chemins de dossiers ancêtres d'un document (pour expansion auto).
 *
 * @param relativePath Chemin relatif du document actif
 */
export function ancestorFolderPaths(relativePath: string) {
  const parts = relativePath.split('/').filter(Boolean);
  parts.pop();
  const paths: string[] = [];
  const walked: string[] = [];
  for (const segment of parts) {
    walked.push(segment);
    paths.push(walked.join('/'));
  }
  return paths;
}

/**
 * Choisit le document initial (README racine par défaut) et les dossiers à ouvrir.
 *
 * @param sorted Documents triés
 * @param preferredId Id initial éventuel
 */
export function pickInitialDocState(
  sorted: readonly UserDocManifestEntry[],
  preferredId: string | undefined,
) {
  const rootReadme = sorted.find((doc) => doc.relativePath === 'README.md');
  const nextId =
    preferredId && sorted.some((doc) => doc.id === preferredId)
      ? preferredId
      : (rootReadme?.id ?? sorted[0]?.id ?? '');

  const active = sorted.find((doc) => doc.id === nextId);

  return {
    nextId,
    folders: active ? ancestorFolderPaths(active.relativePath) : [],
  };
}
