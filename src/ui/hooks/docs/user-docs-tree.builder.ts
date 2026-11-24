/**
 * Construction arborescence doc Instructions (dossiers = README) — ADR-017 / UI-055.
 */

import {
  sortUserDocs,
  type DocTreeFile,
  type DocTreeFolder,
  type DocTreeNode,
  type UserDocManifestEntry,
} from '../../i18n/user-docs.manifest.js';

type MutableFolder = {
  kind: 'folder';
  name: string;
  folderPath: string;
  folders: Map<string, MutableFolder>;
  files: DocTreeFile[];
};

/**
 * Indique si le chemin pointe vers un README.md.
 *
 * @param relativePath Chemin relatif
 */
export function isReadmePath(relativePath: string) {
  const base = relativePath.split('/').pop() ?? relativePath;
  return /^readme\.md$/i.test(base);
}

function compareTreeNodes(a: DocTreeNode, b: DocTreeNode) {
  if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
  if (a.kind === 'folder' && b.kind === 'folder') {
    return a.name.localeCompare(b.name, 'fr');
  }
  if (a.kind === 'file' && b.kind === 'file') {
    return a.doc.relativePath.localeCompare(b.doc.relativePath, 'fr');
  }
  return 0;
}

function freezeFolder(node: MutableFolder) {
  const readme = node.files.find((file) => isReadmePath(file.doc.relativePath));
  const otherFiles = node.files.filter((file) => !isReadmePath(file.doc.relativePath));
  const frozen: DocTreeFolder = {
    kind: 'folder',
    name: node.name,
    folderPath: node.folderPath,
    indexDoc: readme?.doc ?? null,
    children: [...[...node.folders.values()].map(freezeFolder), ...otherFiles].sort(
      compareTreeNodes,
    ),
  };
  return frozen;
}

function ensureChildFolder(parent: MutableFolder, segment: string, folderPath: string) {
  let next = parent.folders.get(segment);
  if (!next) {
    next = {
      kind: 'folder',
      name: segment,
      folderPath,
      folders: new Map(),
      files: [],
    };
    parent.folders.set(segment, next);
  }
  return next;
}

function insertDocIntoTree(root: MutableFolder, doc: UserDocManifestEntry) {
  const parts = doc.relativePath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return;

  let cursor = root;
  const walked: string[] = [];
  for (const segment of parts) {
    walked.push(segment);
    cursor = ensureChildFolder(cursor, segment, walked.join('/'));
  }
  cursor.files.push({ kind: 'file', doc });
}

function orderRootNodes(frozen: DocTreeFolder) {
  const nodes: DocTreeNode[] = [];
  if (frozen.indexDoc) nodes.push({ kind: 'file', doc: frozen.indexDoc });

  const folders = frozen.children
    .filter((node): node is DocTreeFolder => node.kind === 'folder')
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const otherRootFiles = frozen.children
    .filter((node): node is DocTreeFile => node.kind === 'file')
    .sort((a, b) => a.doc.relativePath.localeCompare(b.doc.relativePath, 'fr'));

  nodes.push(...folders, ...otherRootFiles);
  return nodes;
}

/**
 * Construit l'arborescence : README racine en tête, dossiers = leur README.
 *
 * @param documents Documents embarqués
 */
export function buildDocTree(documents: readonly UserDocManifestEntry[]) {
  const root: MutableFolder = {
    kind: 'folder',
    name: '',
    folderPath: '',
    folders: new Map(),
    files: [],
  };

  for (const doc of sortUserDocs(documents)) {
    insertDocIntoTree(root, doc);
  }

  return orderRootNodes(freezeFolder(root));
}
