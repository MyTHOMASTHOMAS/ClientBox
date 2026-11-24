/**
 * Contrats du manifeste documentation utilisateur côté UI (UI-051 / ADR-017).
 * Le contenu est fourni par GET /api/docs (embarqué serveur).
 */

/** Entrée documentaire affichable dans la page Instructions. */
export interface UserDocManifestEntry {
  readonly id: string;
  readonly title: string;
  readonly relativePath: string;
  readonly content: string;
  readonly order: number;
}

/** Réponse JSON de GET /api/docs. */
export interface UserDocsListResponse {
  readonly documents: readonly UserDocManifestEntry[];
}

/** Réponse JSON de POST /api/docs/export. */
export interface UserDocsExportResponse {
  readonly ok: true;
  readonly target: string;
  readonly files: readonly string[];
}

/** Nœud dossier : le README du dossier est l'entrée principale (indexDoc). */
export interface DocTreeFolder {
  readonly kind: 'folder';
  readonly name: string;
  readonly folderPath: string;
  readonly indexDoc: UserDocManifestEntry | null;
  readonly children: readonly DocTreeNode[];
}

/** Nœud fichier de l'arborescence sommaire. */
export interface DocTreeFile {
  readonly kind: 'file';
  readonly doc: UserDocManifestEntry;
}

/** Nœud d'arborescence documentation. */
export type DocTreeNode = DocTreeFolder | DocTreeFile;

/**
 * Trie les documents par ordre du manifeste.
 *
 * @param documents Liste brute renvoyée par l'API
 */
export function sortUserDocs(documents: readonly UserDocManifestEntry[]) {
  return [...documents].sort((a, b) => a.order - b.order);
}

/**
 * Normalise un chemin relatif type `../a/b.md` depuis un fichier source.
 *
 * @param fromRelativePath Chemin du document courant
 * @param href Lien relatif
 */
export function normalizeDocHref(fromRelativePath: string, href: string) {
  const clean = href.split('#')[0]?.split('?')[0]?.trim() ?? '';
  if (!clean) return '';

  const fromDir = fromRelativePath.includes('/')
    ? fromRelativePath.slice(0, fromRelativePath.lastIndexOf('/'))
    : '';

  const stacked = [...(fromDir ? fromDir.split('/') : []), ...clean.split('/')];
  const out: string[] = [];

  for (const part of stacked) {
    if (!part || part === '.') continue;
    if (part === '..') {
      out.pop();
      continue;
    }
    out.push(part);
  }

  return out.join('/');
}

/**
 * Résout un href Markdown vers l'id d'un document embarqué, ou null.
 *
 * @param fromRelativePath Document source
 * @param href Cible du lien
 * @param documents Catalogue embarqué
 */
export function resolveInternalDocId(
  fromRelativePath: string,
  href: string,
  documents: readonly UserDocManifestEntry[],
) {
  if (!href || /^(https?:|mailto:|data:)/i.test(href) || href.startsWith('#')) {
    return null;
  }

  const normalized = normalizeDocHref(fromRelativePath, href);
  if (!normalized.toLowerCase().endsWith('.md')) return null;

  const match = documents.find((doc) => doc.relativePath === normalized);
  return match?.id ?? null;
}
