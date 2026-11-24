/**
 * Modale de saisie/édition de profil pour gouvernance de volumétrie des pages.
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Profile, ProfilePolicy } from '../../../types/models/profile.model.js';
import { PROFILE_POLICY_SELECT_OPTIONS } from '../../types/ui.types.js';
import { Modal } from '../common/modal.js';
import { Button } from '../common/button.js';

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

/** Propriétés de la modale de formulaire profil. */
export interface ProfileFormModalProps {
  readonly isOpen: boolean;
  readonly profile?: Profile | null;
  readonly onSave: (data: {
    id?: string;
    name: string;
    systemPrompt: string;
    policy: ProfilePolicy;
    model?: string;
  }) => void;
  readonly onClose: () => void;
}

/**
 * Modale de création et d'édition d'un profil système.
 * @param props Propriétés du composant modal
 */
export function ProfileFormModal(props: ProfileFormModalProps) {
  const { isOpen, profile, onSave, onClose } = props;
  const [name, setName] = safeUseState((profile && profile.name) || '');
  const [systemPrompt, setSystemPrompt] = safeUseState((profile && profile.systemPrompt) || '');
  const [policy, setPolicy] = safeUseState<ProfilePolicy>(
    (profile && profile.policy) || 'chaque_prompt',
  );

  safeUseEffect(() => {
    setName((profile && profile.name) || '');
    setSystemPrompt((profile && profile.systemPrompt) || '');
    setPolicy((profile && profile.policy) || 'chaque_prompt');
  }, [profile]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onSave({
      id: profile?.id,
      name,
      systemPrompt,
      policy,
      ...(profile?.model ? { model: profile.model } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? 'Modifier le profil' : 'Créer un profil'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="profile-name"
            className="block text-xs font-mono text-outline uppercase mb-1"
          >
            Nom
          </label>
          <input
            id="profile-name"
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
            htmlFor="profile-policy"
            className="block text-xs font-mono text-outline uppercase mb-1"
          >
            Politique
          </label>
          <select
            id="profile-policy"
            name="policy"
            value={policy}
            onChange={(e) => setPolicy((e.target as HTMLSelectElement).value as ProfilePolicy)}
            className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none"
          >
            {PROFILE_POLICY_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="profile-system"
            className="block text-xs font-mono text-outline uppercase mb-1"
          >
            Prompt système
          </label>
          <textarea
            id="profile-system"
            name="systemPrompt"
            rows={5}
            required
            value={systemPrompt}
            onInput={(e) => setSystemPrompt((e.target as HTMLTextAreaElement).value)}
            className="w-full px-3 py-2 bg-surface-panel rounded border border-border-default text-on-surface text-body-sm focus:border-border-focus focus:outline-none font-mono"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" data-action="save" onClick={handleSubmit}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
