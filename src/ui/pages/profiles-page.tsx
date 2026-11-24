import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Profile, ProfilePolicy } from '../../types/models/profile.model.js';
import type { HttpClient } from '../api/http.client.js';
import { Button } from '../components/common/button.js';
import { Badge } from '../components/common/badge.js';
import { ProfileFormModal } from '../components/profiles/profile-form-modal.js';

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

function slugifyId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Construit le payload de persistance d'un profil en purgeant le modèle si vide ou absent.
 * @param id Identifiant du profil
 * @param data Données du formulaire
 */
export function buildProfilePersistPayload(
  id: string,
  data: {
    name: string;
    systemPrompt: string;
    policy: ProfilePolicy;
    model?: string;
  },
) {
  const model = data.model?.trim();
  return {
    id,
    name: data.name,
    systemPrompt: data.systemPrompt,
    policy: data.policy,
    ...(model ? { model } : {}),
  };
}

/** Propriétés du composant VDOM ProfilesPage. */
export interface ProfilesPageProps {
  readonly profiles?: readonly Profile[];
  readonly client?: HttpClient;
  readonly onSelectProfile?: (profile: Profile) => void;
  readonly onCreate?: () => void;
  readonly onEdit?: (profile: Profile) => void;
  readonly onDelete?: (profileId: string) => void;
}

/**
 * Page de configuration des profils d'agents.
 * @param props Propriétés de la page profils
 */
export function ProfilesPage(props: ProfilesPageProps) {
  const [internalProfiles, setInternalProfiles] = safeUseState<readonly Profile[]>([]);
  const [errorMessage, setErrorMessage] = safeUseState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = safeUseState(false);
  const [editingProfile, setEditingProfile] = safeUseState<Profile | null>(null);

  const reloadData = async () => {
    if (props.client) {
      try {
        const pr = await props.client.get<Profile[]>('/api/profils');
        setInternalProfiles(pr);
      } catch (err: unknown) {
        void err;
      }
    }
  };

  try {
    useEffect(() => {
      if (!props.profiles) void reloadData();
    }, [props.profiles, props.client]);
  } catch (err: unknown) {
    void err;
  }

  const profiles = props.profiles ?? internalProfiles;

  const handleDelete = async (id: string) => {
    if (props.onDelete) return props.onDelete(id);
    const confirmed = typeof window === 'undefined' || window.confirm('Supprimer ce profil ?');
    if (!confirmed) return;
    if (props.client) {
      try {
        await props.client.del(`/api/profils/${id}`);
        setErrorMessage(null);
        void reloadData();
      } catch (err: unknown) {
        void err;
        setErrorMessage(
          'Impossible de supprimer ce profil : il est utilisé par au moins un agent.',
        );
      }
    }
  };

  const handleSave = async (data: {
    id?: string;
    name: string;
    systemPrompt: string;
    policy: ProfilePolicy;
    model?: string;
  }) => {
    if (!props.client) {
      setIsModalOpen(false);
      return;
    }
    try {
      if (editingProfile) {
        const payload = buildProfilePersistPayload(editingProfile.id, data);
        await props.client.put(`/api/profils/${editingProfile.id}`, payload);
      } else {
        const id = data.id || `profil-${slugifyId(data.name)}`;
        const payload = buildProfilePersistPayload(id, data);
        await props.client.post('/api/profils', payload);
      }
      await reloadData();
      setErrorMessage(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-display-sm font-display-sm text-on-surface font-semibold tracking-tight">
            Profils Système
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Définition des consignes maîtresses et politiques d'injection.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingProfile(null);
            setIsModalOpen(true);
            props.onCreate?.();
          }}
          className="flex items-center gap-1.5"
          data-action="create-profile"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Créer un profil</span>
        </Button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="alert-danger p-3 rounded-lg bg-status-error/15 text-status-error border border-status-error/30 text-sm"
        >
          {errorMessage}
        </div>
      )}

      <div className="bg-surface-panel rounded-xl border border-border-default shadow-md overflow-hidden">
        <table className="w-full text-left text-body-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-high/80 border-b border-border-default text-outline uppercase font-mono text-[11px] tracking-wider">
              <th className="px-6 py-3.5 font-medium">Nom du profil</th>
              <th className="px-6 py-3.5 font-medium">Politique</th>
              <th className="px-6 py-3.5 font-medium">Consigne système</th>
              <th className="px-6 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {profiles.length === 0 ? (
              <tr className="empty">
                <td colSpan={4} className="px-6 py-12 text-center text-outline">
                  <span className="material-symbols-outlined text-[32px] text-outline/40 block mb-2">
                    badge
                  </span>
                  <span className="font-mono text-xs">Aucun profil configuré.</span>
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-on-surface">{p.name}</div>
                    <div className="text-[11px] font-mono text-outline">{p.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant={p.policy === 'chaque_prompt' ? 'primary' : 'neutral'}
                        hasDot={true}
                      >
                        {p.policy}
                      </Badge>
                      {p.model && (
                        <span className="text-[11px] font-mono text-outline bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle">
                          {p.model}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-on-surface-variant font-mono text-xs max-w-xs truncate">
                    {p.systemPrompt || 'Aucune consigne'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        icon="edit"
                        onClick={() => {
                          setEditingProfile(p);
                          setIsModalOpen(true);
                          props.onEdit?.(p);
                        }}
                        data-action="edit"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        icon="delete"
                        onClick={() => handleDelete(p.id)}
                        className="text-status-error"
                        data-action="delete"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProfileFormModal
        key={editingProfile ? editingProfile.id : isModalOpen ? 'create' : 'closed'}
        isOpen={isModalOpen}
        profile={editingProfile}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
