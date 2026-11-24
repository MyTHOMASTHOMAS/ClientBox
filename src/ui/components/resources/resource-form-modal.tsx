/**
 * Modale de saisie et d'édition pour les templates de prompts et conditions de sortie.
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { ResourceKind, ResourceItem } from '../../types/ui.types.js';
import { Modal } from '../common/modal.js';
import { Button } from '../common/button.js';

function safeUseState<T>(initial: T | (() => T)) {
  try {
    return useState(initial);
  } catch {
    const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    const noop = () => {};
    return [initVal, noop] as [T, (val: T | ((prev: T) => T)) => void];
  }
}

/** Propriétés de la modale de formulaire de ressource. */
export interface ResourceFormModalProps {
  readonly isOpen: boolean;
  readonly kind: ResourceKind;
  readonly singular: string;
  readonly item: ResourceItem | null;
  readonly onSave: (data: { name: string; content: string }) => void;
  readonly onClose: () => void;
}

/**
 * Modale de saisie unifiée pour les prompts et conditions de sortie.
 * @param props Propriétés du formulaire
 */
export function ResourceFormModal(props: ResourceFormModalProps) {
  const { isOpen, singular, item, onSave, onClose } = props;
  const [name, setName] = safeUseState('');
  const [content, setContent] = safeUseState('');

  try {
    useEffect(() => {
      setName(item ? item.name || item.id : '');
      setContent(item ? item.content || '' : '');
    }, [item, isOpen]);
  } catch {
    // Hors contexte de rendu
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSave({ name, content });
  };

  const title = item ? `Modifier ${singular}` : `Créer ${singular}`;
  const labelText = 'Contenu';

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="resource-name"
            className="block text-xs font-mono text-outline uppercase mb-1"
          >
            Nom
          </label>
          <input
            id="resource-name"
            name="name"
            type="text"
            autoComplete="off"
            required
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="resource-content"
            className="block text-xs font-mono text-outline uppercase mb-1"
          >
            {labelText}
          </label>
          <textarea
            id="resource-content"
            name="content"
            rows={5}
            required
            value={content}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none font-mono"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" data-action="save">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
