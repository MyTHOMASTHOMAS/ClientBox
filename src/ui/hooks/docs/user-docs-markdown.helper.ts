/**
 * Rendu Markdown GFM (marked) et réécriture des liens relatifs vers les documents embarqués (ADR-017 / UI-054).
 */

import { marked, Renderer } from 'marked';
import { resolveInternalDocId, type UserDocManifestEntry } from '../../i18n/user-docs.manifest.js';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Échappe les guillemets dans un attribut HTML.
 *
 * @param value Texte brut
 */
function escapeAttr(value: string) {
  return value.split('"').join('&quot;');
}

/**
 * Convertit le Markdown embarqué en HTML avec liens internes résolus.
 *
 * @param markdown Source Markdown
 * @param relativePath Chemin du document courant
 * @param documents Catalogue pour résolution des liens
 */
export function renderUserDocMarkdown(
  markdown: string,
  relativePath: string,
  documents: readonly UserDocManifestEntry[],
) {
  const renderer = new Renderer();

  renderer.link = ({ href, title, text }) => {
    const safeHref = href ?? '';
    const docId = resolveInternalDocId(relativePath, safeHref, documents);
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';

    if (docId) {
      return `<a href="#doc/${encodeURIComponent(docId)}" data-doc-id="${docId}"${titleAttr}>${text}</a>`;
    }

    if (/^https?:/i.test(safeHref)) {
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    }

    return `<span class="instructions-md-dead-link" title="Lien hors documentation embarquée"${titleAttr}>${text}</span>`;
  };

  return marked.parse(markdown, { async: false, renderer }) as string;
}

/**
 * Intercepte un clic sur un lien interne `data-doc-id` et renvoie l'id cible.
 *
 * @param event Événement clic dans la zone Markdown
 */
export function docIdFromMarkdownClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const anchor = target.closest('a[data-doc-id]');
  if (!anchor) return null;
  event.preventDefault();
  return anchor.getAttribute('data-doc-id');
}
