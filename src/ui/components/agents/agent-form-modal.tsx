/**
 * Composant modal extrait de agents-page pour gouvernance de volumétrie.
 * Modale de saisie et d'édition d'un agent local.
 */

import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import type { Agent } from '../../../types/models/agent.model.js';
import type { Profile } from '../../../types/models/profile.model.js';
import { Modal } from '../common/modal.js';
import { Button } from '../common/button.js';
import { AutocompleteInput } from '../common/autocomplete-input.js';
import { createModelSearch } from '../../hooks/common/model-search.helper.js';

function safeUseState<T>(initial: T | (() => T)) {
  try {
    return useState(initial);
  } catch (err: unknown) {
    void err;
    const initVal = typeof initial === 'function' ? (initial as () => T)() : initial;
    const noop = () => {};
    return [initVal, noop] as [T, (val: T | ((prev: T) => T)) => void];
  }
}

function safeUseEffect(cb: () => void | (() => void), deps?: readonly unknown[]) {
  try {
    useEffect(cb, deps as Parameters<typeof useEffect>[1]);
  } catch (err: unknown) {
    void err;
  }
}

function safeUseRef<T>(initial: T) {
  try {
    return useRef(initial);
  } catch (err: unknown) {
    void err;
    return { current: initial };
  }
}

/** Propriétés du formulaire modal d'agent. */
export interface AgentFormModalProps {
  readonly isOpen: boolean;
  readonly agent?: Agent | null;
  readonly profiles?: readonly Profile[];
  readonly onSave: (data: {
    name: string;
    profilId: string;
    cliId: string;
    model?: string;
  }) => void;
  readonly onClose: () => void;
}

function resolveAgentFormValues(agent?: Agent | null, defaultProfileId = 'profil-developpeur') {
  return {
    name: agent?.name ?? '',
    profilId: agent?.profilId ?? defaultProfileId,
    cliId: agent?.cliId ?? 'cursor-cli',
    model: agent?.model ?? '',
  };
}

function resolveField(form: HTMLFormElement | null, name: string, fallback: string) {
  const el = form?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
  const val = el?.value?.trim();
  return val ? val : fallback;
}

function resolveInputValue(form: HTMLFormElement | null, name: string, fallback: string) {
  if (typeof document !== 'undefined') {
    const el = document.getElementById(`agent-${name}`) as HTMLInputElement | null;
    const val = el?.value?.trim();
    if (val) return val;
  }
  return resolveField(form, name, fallback);
}

function resolveSubmitForm(e: Event) {
  if (e.currentTarget) return e.currentTarget as HTMLFormElement;
  const target = e.target as HTMLElement | null;
  return (target?.closest('form') as HTMLFormElement | null) ?? null;
}

/**
 * Modale de saisie et d'édition d'un agent local.
 * @param props Propriétés du composant modal
 */
export function AgentFormModal(props: AgentFormModalProps) {
  const { isOpen, agent, profiles = [], onSave, onClose } = props;
  const defaultProfileId = profiles[0]?.id ?? 'profil-developpeur';
  const initial = resolveAgentFormValues(agent, defaultProfileId);
  const [name, setName] = safeUseState(initial.name);
  const [profilId, setProfilId] = safeUseState(initial.profilId);
  const [cliId, setCliId] = safeUseState(initial.cliId);
  const [model, setModel] = safeUseState(initial.model);

  const lastAgentIdRef = safeUseRef(agent?.id);

  safeUseEffect(() => {
    if (agent?.id !== lastAgentIdRef.current) {
      lastAgentIdRef.current = agent?.id;
      const next = resolveAgentFormValues(agent, defaultProfileId);
      setName(next.name);
      setProfilId(next.profilId);
      setCliId(next.cliId);
      setModel(next.model);
    }
  }, [agent?.id]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = resolveSubmitForm(e);
    const finalName = resolveInputValue(form, 'name', name);
    const finalProfilId = resolveField(form, 'profilId', profilId);
    const finalCliId = resolveField(form, 'cliId', cliId);
    const finalModel = resolveInputValue(form, 'model', model);
    onSave({
      name: finalName,
      profilId: finalProfilId,
      cliId: finalCliId,
      ...(finalModel ? { model: finalModel } : {}),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={agent ? "Modifier l'agent" : 'Créer un agent'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="agent-name"
            className="block text-xs font-mono text-outline uppercase mb-1"
          >
            Nom
          </label>
          <input
            id="agent-name"
            name="name"
            type="text"
            autoComplete="off"
            required
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="agent-profil"
              className="block text-xs font-mono text-outline uppercase mb-1"
            >
              Profil
            </label>
            <select
              id="agent-profil"
              name="profilId"
              value={profilId}
              onChange={(e) => setProfilId((e.target as HTMLSelectElement).value)}
              className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="agent-cli"
              className="block text-xs font-mono text-outline uppercase mb-1"
            >
              Adapter CLI
            </label>
            <select
              id="agent-cli"
              name="cliId"
              value={cliId}
              onChange={(e) => setCliId((e.target as HTMLSelectElement).value)}
              className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none"
            >
              <option value="cursor-cli">Cursor CLI</option>
              <option value="antigravity">Antigravity CLI</option>
              <option value="codex-cli">Codex CLI</option>
              <option value="claude-cli">Claude CLI</option>
            </select>
          </div>
        </div>
        <div>
          <AutocompleteInput
            id="agent-model"
            name="model"
            label="Modèle d’IA (optionnel)"
            placeholder="Ex: gpt-5.3-codex, claude-3-5-sonnet, gemini-2.5-pro..."
            value={model}
            onChange={(val) => setModel(val)}
            search={createModelSearch(() => cliId)}
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" dataAction="save">
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
