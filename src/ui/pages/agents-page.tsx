import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Agent } from '../../types/models/agent.model.js';
import type { Profile } from '../../types/models/profile.model.js';
import type { HttpClient } from '../api/http.client.js';
import { Button } from '../components/common/button.js';
import { Badge } from '../components/common/badge.js';
import { AgentFormModal } from '../components/agents/agent-form-modal.js';

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

/** Propriétés du composant VDOM AgentsPage. */
export interface AgentsPageProps {
  readonly agents?: readonly Agent[];
  readonly profiles?: readonly Profile[];
  readonly client?: HttpClient;
  readonly onSelectAgent?: (agent: Agent) => void;
  readonly onCreate?: () => void;
  readonly onEdit?: (agent: Agent) => void;
  readonly onDelete?: (agentId: string) => void;
}

/**
 * Page de gestion et catalogue des agents IA locaux.
 * @param props Propriétés de la page agents
 */
export function AgentsPage(props: AgentsPageProps) {
  const [internalAgents, setInternalAgents] = safeUseState<readonly Agent[]>([]);
  const [internalProfiles, setInternalProfiles] = safeUseState<readonly Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = safeUseState(false);
  const [editingAgent, setEditingAgent] = safeUseState<Agent | null>(null);
  const [notification, setNotification] = safeUseState<string | null>(null);

  const reloadData = async () => {
    if (props.client) {
      try {
        const ag = await props.client.get<Agent[]>('/api/agents');
        setInternalAgents(ag);
      } catch (err: unknown) {
        void err;
      }
      try {
        const pr = await props.client.get<Profile[]>('/api/profiles');
        setInternalProfiles(pr);
      } catch (err: unknown) {
        void err;
      }
    }
  };

  try {
    useEffect(() => {
      if (!props.agents) void reloadData();
    }, [props.agents, props.client]);
  } catch (err: unknown) {
    void err;
  }

  const agents = props.agents ?? internalAgents;
  const profiles = props.profiles ?? internalProfiles;

  const handleSave = async (data: {
    name: string;
    profilId: string;
    cliId: string;
    model?: string;
  }) => {
    if (props.client) {
      try {
        if (editingAgent) {
          await props.client.put(`/api/agents/${editingAgent.id}`, { ...editingAgent, ...data });
        } else {
          const id = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
          await props.client.post('/api/agents', { id, ...data });
        }
        await reloadData();
        setIsModalOpen(false);
        setEditingAgent(null);
      } catch (err: unknown) {
        setNotification(err instanceof Error ? err.message : String(err));
      }
    } else {
      setEditingAgent(null);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (props.onDelete) return props.onDelete(id);
    const confirmed = typeof window === 'undefined' || window.confirm('Supprimer cet agent ?');
    if (!confirmed) return;
    if (props.client) {
      await props.client.del(`/api/agents/${id}`);
      void reloadData();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-display-sm font-display-sm text-on-surface font-semibold tracking-tight">
            Agents IA
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Gestion, configuration et orchestration des agents.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingAgent(null);
            setIsModalOpen(true);
            props.onCreate?.();
          }}
          className="flex items-center gap-1.5"
          data-action="create-agent"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Créer un agent</span>
        </Button>
      </div>

      {notification && (
        <div
          role="status"
          className="toast alert-success p-3 rounded-lg bg-status-success/20 text-status-success border border-status-success/40 text-sm"
        >
          {notification}
        </div>
      )}

      <div className="bg-surface-panel rounded-xl border border-border-default shadow-md overflow-hidden">
        <table className="w-full text-left text-body-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-high/80 border-b border-border-default text-outline uppercase font-mono text-[11px] tracking-wider">
              <th className="px-6 py-3.5 font-medium">Nom de l'agent</th>
              <th className="px-6 py-3.5 font-medium">Profil associé</th>
              <th className="px-6 py-3.5 font-medium">CLI</th>
              <th className="px-6 py-3.5 font-medium">Modèle</th>
              <th className="px-6 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {agents.length === 0 ? (
              <tr className="empty">
                <td colSpan={5} className="px-6 py-12 text-center text-outline">
                  <span className="material-symbols-outlined text-[32px] text-outline/40 block mb-2">
                    smart_toy
                  </span>
                  <span className="font-mono text-xs">Aucun agent configuré.</span>
                </td>
              </tr>
            ) : (
              agents.map((agent) => {
                const prof = profiles.find((p) => p.id === agent.profilId);
                return (
                  <tr key={agent.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-on-surface">{agent.name}</div>
                      <div className="text-[11px] font-mono text-outline">{agent.id}</div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono text-code-sm">
                      <div>{prof ? prof.name : agent.profilId}</div>
                      <div className="text-[11px] text-outline">{agent.profilId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral" hasDot={true}>
                        {agent.cliId || 'cursor-cli'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {agent.model ? (
                        <Badge variant="primary">{agent.model}</Badge>
                      ) : (
                        <span className="text-outline/60 text-xs font-mono">Défaut</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          icon="edit"
                          onClick={() => {
                            setEditingAgent(agent);
                            setIsModalOpen(true);
                            props.onEdit?.(agent);
                          }}
                          data-action="edit"
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          icon="delete"
                          onClick={() => handleDelete(agent.id)}
                          className="text-status-error hover:bg-status-error/10"
                          data-action="delete"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AgentFormModal
        key={editingAgent ? editingAgent.id : isModalOpen ? 'create' : 'closed'}
        isOpen={isModalOpen}
        agent={editingAgent}
        profiles={profiles}
        onSave={handleSave}
        onClose={() => {
          setEditingAgent(null);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
