import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Scenario } from '../../types/models/scenario.model.js';
import type { HttpClient } from '../api/http.client.js';
import { Button } from '../components/common/button.js';
import { Badge } from '../components/common/badge.js';

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

/** Propriétés du composant VDOM ScenariosPage. */
export interface ScenariosPageProps {
  readonly scenarios?: readonly (Scenario & { readonly description?: string })[];
  readonly client?: HttpClient;
  readonly onSelectScenario?: (scenarioId: string) => void;
  readonly onCreate?: () => void;
  readonly onDelete?: (scenarioId: string) => void;
}

/**
 * Page de listing et gestion des scénarios nodaux déclaratifs.
 * @param props Propriétés de la page scénarios
 */
export function ScenariosPage(props: ScenariosPageProps) {
  const { onSelectScenario, onCreate, onDelete } = props;
  const [internalScenarios, setInternalScenarios] = safeUseState<
    readonly (Scenario & { readonly description?: string })[]
  >([]);
  const [searchTerm, setSearchTerm] = safeUseState<string>('');

  const reloadData = async () => {
    if (props.client) {
      try {
        const sc =
          await props.client.get<(Scenario & { readonly description?: string })[]>(
            '/api/scenarios',
          );
        setInternalScenarios(sc);
      } catch (err: unknown) {
        void err;
      }
    }
  };

  try {
    useEffect(() => {
      if (!props.scenarios) void reloadData();
    }, [props.scenarios, props.client]);
  } catch (err: unknown) {
    void err;
  }

  const allScenarios = props.scenarios ?? internalScenarios;
  const filtered = allScenarios.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreate = async () => {
    if (onCreate) return onCreate();
    if (!props.client) return onSelectScenario?.('scenario-nouveau');
    const stamp = Date.now().toString(36);
    const id = `scenario-${stamp}`;
    try {
      await props.client.post('/api/scenarios', {
        id,
        name: `Nouveau scénario ${stamp}`,
        nodes: [{ id: 'node-start', type: 'start', position: { x: 100, y: 200 } }],
        connections: [],
      });
      await reloadData();
      onSelectScenario?.(id);
    } catch (err: unknown) {
      void err;
      onSelectScenario?.(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-display-sm font-display-sm text-on-surface font-semibold tracking-tight">
            Scénarios Nodiaux
          </h1>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
            Orchestration graphique des flux multi-agents.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          className="flex items-center gap-1.5"
          data-action="new-scenario"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Nouveau scénario</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            placeholder="Filtrer les scénarios..."
            className="w-full pl-10 pr-4 py-2 bg-surface-panel/90 text-on-surface text-body-sm rounded-lg border border-white/10 shadow-xs focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder:text-outline"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge variant="neutral" hasDot={true}>
            {filtered.length} {filtered.length > 1 ? 'scénarios' : 'scénario'}
          </Badge>
        </div>
      </div>

      <div className="bg-surface-panel rounded-xl border border-border-default shadow-md overflow-hidden">
        <table className="w-full text-left text-body-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-high/80 border-b border-border-default text-outline uppercase font-mono text-[11px] tracking-wider">
              <th className="px-6 py-3.5 font-medium">Nom &amp; Description</th>
              <th className="px-6 py-3.5 font-medium">Blocs</th>
              <th className="px-6 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filtered.length === 0 ? (
              <tr className="empty">
                <td colSpan={3} className="px-6 py-12 text-center text-outline">
                  <span className="material-symbols-outlined text-[32px] text-outline/40 block mb-2">
                    account_tree
                  </span>
                  <span className="font-mono text-xs">Aucun scénario disponible.</span>
                </td>
              </tr>
            ) : (
              filtered.map((scen) => (
                <tr key={scen.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-on-surface">{scen.name}</div>
                    {scen.description && (
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {scen.description}
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-outline mt-0.5">{scen.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{scen.nodes?.length ?? 0} bloc(s)</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        icon="hub"
                        onClick={() => onSelectScenario?.(scen.id)}
                        data-action="open-canvas"
                      >
                        Ouvrir Canvas
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          icon="delete"
                          onClick={() => onDelete(scen.id)}
                          data-action="delete"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
