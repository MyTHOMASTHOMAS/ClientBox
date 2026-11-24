/**
 * Sommaire arborescent dossiers/fichiers pour la page Instructions (ADR-017 / UI-057).
 */

import { h } from 'preact';
import type {
  DocTreeFolder,
  DocTreeNode,
  UserDocManifestEntry,
} from '../../i18n/user-docs.manifest.js';
import { firstOpenableDocId, isReadmePath } from '../../hooks/docs/user-docs-tree.model.js';

/**
 * Libellé d'affichage d'un fichier (README racine → Instructions).
 *
 * @param doc Entrée manifeste
 */
export function fileLabel(doc: UserDocManifestEntry) {
  if (doc.relativePath === 'README.md') return 'Instructions';
  return doc.title;
}

function depthStyle(depth: number) {
  return { paddingLeft: `${0.5 + depth * 0.25}rem` };
}

/** Propriétés d'une ligne dossier (= README du dossier). */
interface FolderRowProps {
  readonly node: DocTreeFolder;
  readonly depth: number;
  readonly isOpen: boolean;
  readonly isActive: boolean;
  readonly onToggle: (folderPath: string) => void;
  readonly onSelectDoc: (docId: string) => void;
}

/**
 * Ligne dossier (= index) : clic → ouvre le README et déplie ; flèche → déplie seulement.
 *
 * @param props Dossier et interactions
 */
function FolderRow(props: FolderRowProps) {
  const { node, depth, isOpen, isActive, onToggle, onSelectDoc } = props;
  const hasChildren = node.children.length > 0;

  return (
    <div
      className={`flex w-full items-center gap-0.5 rounded-md text-xs transition-colors ${
        isActive
          ? 'bg-white/10 text-on-surface'
          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
      }`}
      style={depthStyle(depth)}
    >
      <button
        type="button"
        aria-label={isOpen ? 'Replier' : 'Déplier'}
        disabled={!hasChildren}
        onClick={(event) => {
          event.stopPropagation();
          if (hasChildren) onToggle(node.folderPath);
        }}
        className={`flex h-8 w-7 shrink-0 items-center justify-center rounded-md ${
          hasChildren ? 'hover:bg-white/10' : 'opacity-30'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {hasChildren ? (isOpen ? 'expand_more' : 'chevron_right') : 'description'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          const docId = node.indexDoc?.id ?? firstOpenableDocId(node);
          if (docId) onSelectDoc(docId);
        }}
        className="flex min-w-0 flex-1 items-center gap-1 py-1.5 pr-2 text-left"
      >
        <span className="material-symbols-outlined shrink-0 text-[16px] opacity-70">
          description
        </span>
        <span className="truncate font-medium">{node.name}</span>
      </button>
    </div>
  );
}

/** Propriétés d'une ligne fichier. */
interface FileRowProps {
  readonly doc: UserDocManifestEntry;
  readonly depth: number;
  readonly isActive: boolean;
  readonly onSelect: (docId: string) => void;
}

/**
 * Ligne fichier du sommaire.
 *
 * @param props Document et sélection
 */
function FileRow(props: FileRowProps) {
  const { doc, depth, isActive, onSelect } = props;

  return (
    <button
      type="button"
      onClick={() => onSelect(doc.id)}
      className={`flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
        isActive
          ? 'bg-white/10 text-on-surface'
          : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
      }`}
      style={depthStyle(depth)}
    >
      <span className="material-symbols-outlined shrink-0 text-[16px] opacity-70">description</span>
      <span className="truncate">{fileLabel(doc)}</span>
    </button>
  );
}

/** Propriétés du sommaire arborescent. */
export interface DocTreeNavProps {
  readonly nodes: readonly DocTreeNode[];
  readonly activeId: string;
  readonly expanded: ReadonlySet<string>;
  readonly onToggleFolder: (folderPath: string) => void;
  readonly onSelectDoc: (docId: string) => void;
  readonly depth?: number;
}

/**
 * Sommaire : README racine = « Instructions » ; dossiers = README nommé comme le dossier.
 *
 * @complexityExemption Complexité cyclomatique justifiée par le rendu récursif dossiers/fichiers.
 * @param props Nœuds, sélection et expansion
 */
export function DocTreeNav(props: DocTreeNavProps) {
  const { nodes, activeId, expanded, onToggleFolder, onSelectDoc, depth = 0 } = props;
  const listClass =
    depth === 0 ? 'space-y-0.5' : 'mt-0.5 ml-2 space-y-0.5 border-l border-white/10';

  return (
    <ul className={listClass}>
      {nodes.map((node) => {
        if (node.kind === 'folder') {
          const isOpen = expanded.has(node.folderPath);
          return (
            <li key={`folder:${node.folderPath}`}>
              <FolderRow
                node={node}
                depth={depth}
                isOpen={isOpen}
                isActive={node.indexDoc?.id === activeId}
                onToggle={onToggleFolder}
                onSelectDoc={onSelectDoc}
              />
              {isOpen ? (
                <DocTreeNav
                  nodes={node.children}
                  activeId={activeId}
                  expanded={expanded}
                  onToggleFolder={onToggleFolder}
                  onSelectDoc={onSelectDoc}
                  depth={depth + 1}
                />
              ) : null}
            </li>
          );
        }

        // README de sous-dossiers déjà représentés par la ligne dossier
        if (isReadmePath(node.doc.relativePath) && node.doc.relativePath !== 'README.md') {
          return null;
        }

        return (
          <li key={node.doc.id}>
            <FileRow
              doc={node.doc}
              depth={depth}
              isActive={node.doc.id === activeId}
              onSelect={onSelectDoc}
            />
          </li>
        );
      })}
    </ul>
  );
}
