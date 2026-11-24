/**
 * Page Instructions : lecture doc embarquée + export local (UI-050 / SPEC-UI-04).
 * Rendu Markdown GFM via `marked` (ADR-017).
 */

import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { HttpClient } from '../api/http.client.js';
import { Button } from '../components/common/button.js';
import {
  docIdFromMarkdownClick,
  renderUserDocMarkdown,
} from '../hooks/docs/user-docs-markdown.helper.js';
import { DocTreeNav } from '../components/docs/user-docs-tree.js';
import {
  sortUserDocs,
  type UserDocManifestEntry,
  type UserDocsExportResponse,
  type UserDocsListResponse,
} from '../i18n/user-docs.manifest.js';
import {
  ancestorFolderPaths,
  buildDocTree,
  pickInitialDocState,
} from '../hooks/docs/user-docs-tree.model.js';
import { UI_FR_CATALOG } from '../i18n/fr.i18n.js';

/** Propriétés de la page Instructions. */
export interface InstructionsPageProps {
  readonly client: HttpClient;
  readonly initialDocId?: string;
}

/**
 * Affiche le sommaire arborescent et le contenu Markdown, avec export vers `.agents/docs/`.
 *
 * @complexityExemption Complexité cyclomatique justifiée par le chargement API, l'arbre navigable, les liens marked et l'export local.
 * @param props Client HTTP et id de document initial
 */
function InstructionsPageComponent(props: InstructionsPageProps) {
  const { client, initialDocId } = props;
  const [docs, setDocs] = useState<readonly UserDocManifestEntry[]>([]);
  const [activeId, setActiveId] = useState(initialDocId ?? '');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [loadError, setLoadError] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await client.get<UserDocsListResponse>('/api/docs');
        if (cancelled) return;

        const sorted = sortUserDocs(response.documents ?? []);
        const initial = pickInitialDocState(sorted, initialDocId);

        setDocs(sorted);
        setActiveId(initial.nextId);
        setExpanded(new Set(initial.folders));
        setLoadError('');
      } catch (err: unknown) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : UI_FR_CATALOG.docs.loadError);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [client, initialDocId]);

  const tree = useMemo(() => buildDocTree(docs), [docs]);
  const activeDoc = docs.find((doc) => doc.id === activeId) ?? docs[0];

  const selectDoc = (docId: string) => {
    setActiveId(docId);
    const doc = docs.find((entry) => entry.id === docId);
    if (!doc) return;

    setExpanded((prev) => {
      const next = new Set(prev);
      for (const path of ancestorFolderPaths(doc.relativePath)) {
        next.add(path);
      }
      return next;
    });
  };

  const toggleFolder = (folderPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const onExport = async () => {
    setExporting(true);
    setExportMessage('');
    setExportError('');

    try {
      const result = await client.post<UserDocsExportResponse>('/api/docs/export');
      const target = result.target || '.agents/docs';
      setExportMessage(`${UI_FR_CATALOG.docs.exportSuccessPrefix} ${target}`);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : UI_FR_CATALOG.docs.exportError);
    } finally {
      setExporting(false);
    }
  };

  const onMarkdownClick = (event: MouseEvent) => {
    const docId = docIdFromMarkdownClick(event);
    if (docId) selectDoc(docId);
  };

  const markdownHtml = activeDoc
    ? renderUserDocMarkdown(activeDoc.content, activeDoc.relativePath, docs)
    : '';

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-on-surface">{UI_FR_CATALOG.docs.pageTitle}</h1>
          <p className="text-xs text-on-surface-variant">{UI_FR_CATALOG.docs.pageSubtitle}</p>
        </div>
        <Button variant="primary" onClick={() => void onExport()} disabled={exporting}>
          {exporting ? UI_FR_CATALOG.docs.exporting : UI_FR_CATALOG.docs.exportAction}
        </Button>
      </div>

      {(exportMessage || exportError || loadError) && (
        <div className="shrink-0 space-y-1 border-b border-white/10 px-6 py-2 text-sm">
          {exportMessage && <p className="text-emerald-400">{exportMessage}</p>}
          {exportError && <p className="text-red-400">{exportError}</p>}
          {loadError && <p className="text-red-400">{loadError}</p>}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex min-h-0 w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 p-3">
          <p className="mb-2 shrink-0 px-2 text-[10px] font-mono uppercase tracking-wider text-outline">
            {UI_FR_CATALOG.docs.toc}
          </p>
          <nav className="min-h-0">
            <DocTreeNav
              nodes={tree}
              activeId={activeDoc?.id ?? ''}
              expanded={expanded}
              onToggleFolder={toggleFolder}
              onSelectDoc={selectDoc}
            />
          </nav>
        </aside>

        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-4">
          {activeDoc ? (
            <>
              <p className="mb-3 font-mono text-[10px] text-outline">{activeDoc.relativePath}</p>
              <div
                className="instructions-md max-w-3xl"
                dangerouslySetInnerHTML={{ __html: markdownHtml }}
                onClick={onMarkdownClick}
              />
            </>
          ) : (
            !loadError && (
              <p className="text-sm text-on-surface-variant">{UI_FR_CATALOG.docs.empty}</p>
            )
          )}
        </section>
      </div>
    </div>
  );
}

export { InstructionsPageComponent as InstructionsPage };
