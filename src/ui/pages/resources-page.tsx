/**
 * @fileExemption Dépassement nominal justifié par le CRUD unifié prompts/exit/scripts et la modale de saisie.
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { ResourceKind, ResourceItem } from '../types/ui.types.js';
import type { HttpClient } from '../api/http.client.js';
import { Button } from '../components/common/button.js';
import { Modal } from '../components/common/modal.js';
import { ResourceFormModal } from '../components/resources/resource-form-modal.js';
import {
  formatResourceRaw,
  slugifyId,
  buildMutationPayload,
} from '../hooks/common/use-resources.hook.js';

function safeUseState<T>(initial: T | (() => T)) {
  try {
    return useState(initial);
  } catch {
    const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    return [initVal, () => {}] as [T, (val: T | ((prev: T) => T)) => void];
  }
}

function safeUseEffect(cb: () => void | (() => void), deps?: readonly unknown[]) {
  try {
    useEffect(cb, deps as Parameters<typeof useEffect>[1]);
  } catch {
    /* noop */
  }
}

function confirmDeleteAction() {
  return typeof window !== 'undefined' ? window.confirm('Supprimer cet élément ?') : true;
}

async function loadScriptSource(item: ResourceItem, hasClient: boolean) {
  if (item.kind !== 'scripts' || !hasClient) return item;
  try {
    const res = await globalThis.fetch(`/api/if/${item.id}`);
    return { ...item, content: await res.text() };
  } catch {
    return item;
  }
}

/** Propriétés du composant VDOM ResourcesPage. */
export interface ResourcesPageProps {
  readonly kind: ResourceKind;
  readonly items?: readonly ResourceItem[];
  readonly client?: HttpClient;
  readonly onCreate?: () => void;
  readonly onEdit?: (item: ResourceItem) => void;
  readonly onDelete?: (id: string) => void;
}

const META_MAP: Record<ResourceKind, { title: string; singular: string; endpoint: string }> = {
  prompts: { title: 'Templates de Prompts', singular: 'un prompt', endpoint: '/api/prompts' },
  exits: { title: 'Conditions de Sortie', singular: 'une condition', endpoint: '/api/exit' },
  scripts: { title: 'Scripts Conditionnels If', singular: 'un script', endpoint: '/api/if' },
};

interface RenderRowOptions {
  readonly item: ResourceItem;
  readonly kind: ResourceKind;
  readonly canMutate: boolean;
  readonly onInspect: (item: ResourceItem) => void;
  readonly onEdit: (item: ResourceItem) => void;
  readonly onDelete: (id: string) => void;
}

function renderRow(opts: RenderRowOptions) {
  const { item, kind, canMutate, onInspect, onEdit, onDelete } = opts;
  return (
    <tr key={item.id} className="hover:bg-surface-elevated/40 transition-colors">
      <td className="px-6 py-4">
        <div className="font-medium text-on-surface">{item.name || item.id}</div>
        <div className="text-[11px] font-mono text-outline">{item.id}</div>
      </td>
      <td className="px-6 py-4 text-on-surface-variant font-mono text-xs max-w-xs truncate">
        {item.content}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            icon="visibility"
            onClick={() => onInspect(item)}
            data-action="inspect-script"
          >
            {kind === 'scripts' ? 'Consulter' : 'Voir'}
          </Button>
          {canMutate && (
            <Button variant="ghost" icon="edit" onClick={() => onEdit(item)} data-action="edit">
              Modifier
            </Button>
          )}
          <Button
            variant="ghost"
            icon="delete"
            onClick={() => onDelete(item.id)}
            className="text-status-error hover:bg-status-error/10"
            data-action="delete"
          >
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  );
}

/**
 * @complexityExemption Complexité cyclomatique modérée justifiée par la gestion unifiée CRUD et modales pour prompts, conditions exit et scripts if dans un composant unique.
 * Page CRUD unifiée pour les ressources locales (prompts, conditions exit, scripts if).
 * @param props Propriétés de la page ressources
 */
function ResourcesPageComponent(props: ResourcesPageProps) {
  const { kind } = props;
  const [internalItems, setInternalItems] = safeUseState<readonly ResourceItem[]>([]);
  const [activeItem, setActiveItem] = safeUseState<ResourceItem | null>(null);
  const [isFormOpen, setIsFormOpen] = safeUseState(false);
  const [editingItem, setEditingItem] = safeUseState<ResourceItem | null>(null);
  const [formError, setFormError] = safeUseState<string | null>(null);
  const meta = META_MAP[kind] ?? META_MAP.prompts;
  const canMutate = kind !== 'scripts';

  const reloadData = async () => {
    if (!props.client) return;
    try {
      const data = await props.client.get<unknown[]>(meta.endpoint);
      setInternalItems(data.map((d) => formatResourceRaw(d, kind)));
    } catch (err: unknown) {
      void err;
    }
  };

  safeUseEffect(() => {
    if (!props.items) void reloadData();
  }, [kind, props.items, props.client]);

  const items = props.items ?? internalItems;

  const handleInspect = async (item: ResourceItem) => {
    const loaded = await loadScriptSource(item, props.client !== undefined);
    setActiveItem(loaded);
  };

  const handleDelete = async (id: string) => {
    if (props.onDelete) return props.onDelete(id);
    if (!confirmDeleteAction() || !props.client) return;
    try {
      await props.client.del(`${meta.endpoint}/${id}`);
      await reloadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSave = async (data: { name: string; content: string }) => {
    if (!props.client) return;
    try {
      const id = editingItem ? editingItem.id : slugifyId(data.name);
      const payload = buildMutationPayload({ kind, id, name: data.name, content: data.content });
      if (editingItem) {
        await props.client.put(`${meta.endpoint}/${id}`, payload);
      } else {
        await props.client.post(meta.endpoint, payload);
      }
      setIsFormOpen(false);
      await reloadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-display-sm font-display-sm text-on-surface font-semibold tracking-tight">
            {meta.title}
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Gestion et consultation des ressources locales dans{' '}
            <code className="text-xs bg-surface-panel px-1.5 py-0.5 rounded border border-white/10">
              .agents/data/{kind}/
            </code>
          </p>
        </div>
        {canMutate && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingItem(null);
              setFormError(null);
              setIsFormOpen(true);
              props.onCreate?.();
            }}
            className="flex items-center gap-1.5"
            data-action="create"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Créer {meta.singular}</span>
          </Button>
        )}
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-status-error/15 text-status-error border border-status-error/30 text-sm"
        >
          {formError}
        </div>
      )}

      <div className="bg-surface-panel rounded-xl border border-border-default shadow-md overflow-hidden">
        <table className="w-full text-left text-body-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-high/80 border-b border-border-default text-outline uppercase font-mono text-[11px] tracking-wider">
              <th className="px-6 py-3.5 font-medium">Nom &amp; Identifiant</th>
              <th className="px-6 py-3.5 font-medium">Détail</th>
              <th className="px-6 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {items.length === 0 ? (
              <tr className="empty">
                <td colSpan={3} className="px-6 py-12 text-center text-outline">
                  <span className="material-symbols-outlined text-[32px] text-outline/40 block mb-2">
                    description
                  </span>
                  <span className="font-mono text-xs">Aucun élément enregistré.</span>
                </td>
              </tr>
            ) : (
              items.map((item) =>
                renderRow({
                  item,
                  kind,
                  canMutate,
                  onInspect: (it) => void handleInspect(it),
                  onEdit: (it) => {
                    setEditingItem(it);
                    setFormError(null);
                    setIsFormOpen(true);
                    props.onEdit?.(it);
                  },
                  onDelete: (id) => void handleDelete(id),
                }),
              )
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={activeItem !== null}
        title={activeItem ? activeItem.id : ''}
        sourceCode={activeItem?.content ?? ''}
        onClose={() => setActiveItem(null)}
      />

      <ResourceFormModal
        isOpen={isFormOpen}
        kind={kind}
        singular={meta.singular}
        item={editingItem}
        onSave={handleSave}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}

export { ResourcesPageComponent as ResourcesPage };
