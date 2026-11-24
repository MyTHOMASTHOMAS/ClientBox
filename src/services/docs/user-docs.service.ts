/**
 * Service documentation utilisateur (SVC-013 / ADR-017) :
 * lecture du manifeste embarqué et export vers docsRoot.
 */

import { atomicWriteDocsRelative } from '../../lib/fs/text-atomic-writer.fs.js';
import { EMBEDDED_USER_DOCS, type EmbeddedDocFile } from './user-docs.embedded.generated.js';

/** Options d'injection du service docs. */
export interface UserDocsServiceOptions {
  readonly docsRoot: string;
}

/** Document exposé à l'API / UI (métadonnées + contenu). */
export interface UserDocEntry {
  readonly id: string;
  readonly title: string;
  readonly relativePath: string;
  readonly content: string;
  readonly order: number;
}

/** Résultat d'un export local réussi. */
export interface UserDocsExportResult {
  readonly ok: true;
  readonly target: string;
  readonly files: readonly string[];
}

/**
 * Catalogue embarqué et matérialisation disque sous `.agents/docs/`.
 */
export class UserDocsService {
  private readonly docsRoot: string;

  constructor(options: UserDocsServiceOptions) {
    this.docsRoot = options.docsRoot;
  }

  /**
   * Liste la documentation opérateur embarquée (triée).
   */
  listDocs() {
    return EMBEDDED_USER_DOCS.map((doc: EmbeddedDocFile) => ({
      id: doc.id,
      title: doc.title,
      relativePath: doc.relativePath,
      content: doc.content,
      order: doc.order,
    })).sort((a, b) => a.order - b.order);
  }

  /**
   * Écrit le miroir Markdown sous docsRoot.
   *
   * @throws Error message français si l'écriture échoue
   */
  exportDocs() {
    const files: string[] = [];
    try {
      for (const doc of this.listDocs()) {
        atomicWriteDocsRelative(this.docsRoot, doc.relativePath, doc.content);
        files.push(doc.relativePath);
      }
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Impossible d'enregistrer la documentation locale : ${detail}`);
    }
    return {
      ok: true as const,
      target: this.docsRoot,
      files,
    };
  }
}
