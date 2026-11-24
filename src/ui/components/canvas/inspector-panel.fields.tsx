/**
 * Formulaires d'édition par type de bloc pour le panneau d'inspection.
 */
import { h } from 'preact';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import {
  AutocompleteInput,
  type AutocompleteSuggestion,
  createResourceSearch,
} from '../common/autocomplete-input.js';

/** Option de scénario pour le dropdown CallScenario. */
export interface ScenarioSelectOption {
  readonly id: string;
  readonly label: string;
}

/** Options communes de rendu des champs d'inspection (lecture seule + recherches). */
export interface FieldRenderOptions {
  readonly isReadOnly?: boolean;
  readonly searchAgent?: (
    q: string,
  ) => Promise<readonly AutocompleteSuggestion[]> | readonly AutocompleteSuggestion[];
  readonly searchPrompt?: (
    q: string,
  ) => Promise<readonly AutocompleteSuggestion[]> | readonly AutocompleteSuggestion[];
  readonly searchExit?: (
    q: string,
  ) => Promise<readonly AutocompleteSuggestion[]> | readonly AutocompleteSuggestion[];
  readonly searchIfScript?: (
    q: string,
  ) => Promise<readonly AutocompleteSuggestion[]> | readonly AutocompleteSuggestion[];
}

/**
 * Champs d'inspection du bloc Start.
 * @param node Nœud Start
 * @param onChange Callback de mise à jour d'un champ
 * @param isReadOnly Verrouillage édition pendant un run
 */
export function renderStartFields(
  node: ScenarioNode,
  onChange: (field: string, val: string) => void,
  isReadOnly = false,
) {
  return (
    <div className="space-y-3 font-code-sm text-code-sm">
      <div className="p-3 bg-surface-base rounded border border-border-subtle text-[12px] space-y-1.5 font-sans">
        <div className="flex items-center gap-1.5 text-primary font-semibold">
          <span className="material-symbols-outlined text-[16px]">play_circle</span>
          <span>Point d’entrée du scénario</span>
        </div>
        <p className="text-on-surface-variant text-[11px] leading-relaxed">
          Ce nœud marque l’origine du graphe d’exécution (degré entrant 0). Il s’active
          automatiquement dès le lancement du scénario.
        </p>
      </div>
      <div className="space-y-1">
        <label
          htmlFor="inspector-label"
          className="block text-outline text-[11px] font-mono uppercase"
        >
          Libellé du point d’entrée
        </label>
        <input
          id="inspector-label"
          name="label"
          type="text"
          autoComplete="off"
          disabled={isReadOnly}
          value={node.label || ''}
          onInput={(e) => onChange('label', (e.target as HTMLInputElement).value)}
          className="w-full px-2.5 py-1 bg-surface-base text-on-surface font-code-sm text-code-sm rounded border border-border-default focus:outline-none focus:border-border-focus disabled:opacity-50"
          placeholder="Libellé personnalisé (ex: Démarrage)"
        />
      </div>
    </div>
  );
}

/**
 * Champs d'inspection du bloc Run (agent / prompt / exit).
 * @param node Nœud Run
 * @param onChange Callback de mise à jour d'un champ
 * @param options Options de rendu (lecture seule, recherches)
 */
export function renderRunFields(
  node: ScenarioNode,
  onChange: (field: string, val: string) => void,
  options: FieldRenderOptions = {},
) {
  const { isReadOnly = false, searchAgent, searchPrompt, searchExit } = options;
  return (
    <div className="space-y-3 font-code-sm text-code-sm">
      <AutocompleteInput
        id="inspector-agent"
        name="agentId"
        label="Agent associé"
        disabled={isReadOnly}
        value={node.agentId || ''}
        placeholder="ID de l’agent (ex: ag-1)"
        search={searchAgent || createResourceSearch('/api/agents', 'agent')}
        onChange={(val) => onChange('agentId', val)}
      />
      <AutocompleteInput
        id="inspector-prompt"
        name="promptId"
        label="Template de Prompt"
        disabled={isReadOnly}
        value={node.promptId || ''}
        placeholder="ID du prompt (ex: pr-1)"
        search={searchPrompt || createResourceSearch('/api/prompts', 'prompt')}
        onChange={(val) => onChange('promptId', val)}
      />
      <AutocompleteInput
        id="inspector-exit"
        name="exitId"
        label="Condition de sortie"
        dataAction="inspector-exit"
        disabled={isReadOnly}
        value={node.exitId || ''}
        placeholder="ID condition exit (ex: ex-1)"
        search={searchExit || createResourceSearch('/api/exit', 'exit')}
        onChange={(val) => onChange('exitId', val)}
      />
    </div>
  );
}

/**
 * Champs d'inspection du bloc If (script conditionnel).
 * @param node Nœud If
 * @param onChange Callback de mise à jour d'un champ
 * @param options Options de rendu (lecture seule, recherches)
 */
export function renderIfFields(
  node: ScenarioNode,
  onChange: (field: string, val: string) => void,
  options: FieldRenderOptions = {},
) {
  const { isReadOnly = false, searchIfScript } = options;
  return (
    <div className="space-y-3 font-code-sm text-code-sm">
      <AutocompleteInput
        id="inspector-if-script"
        name="ifScriptId"
        label="Script conditionnel (.agents/data/if/*.js)"
        disabled={isReadOnly}
        value={node.ifScriptId || ''}
        placeholder="Nom du script (ex: check)"
        search={searchIfScript || createResourceSearch('/api/if', 'script')}
        onChange={(val) => onChange('ifScriptId', val)}
      />
      <div className="p-3 bg-surface-base rounded border border-border-subtle text-[11px] space-y-1.5 font-sans">
        <span className="text-primary font-semibold block font-mono uppercase text-[11px]">
          Branches conditionnelles :
        </span>
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>
            Sortie 0 : Branche <strong>Vrai</strong> (script évalue à true)
          </span>
        </div>
        <div className="flex items-center gap-2 text-rose-400">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
          <span>
            Sortie 1 : Branche <strong>Faux</strong> (script évalue à false)
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Champs d'inspection du bloc CallScenario (targetScenarioId).
 * @param node Nœud CallScenario
 * @param onChange Callback de mise à jour d'un champ
 * @param options Options (lecture seule, scénario courant, liste)
 */
export function renderCallScenarioFields(
  node: ScenarioNode,
  onChange: (field: string, val: string) => void,
  options: {
    readonly isReadOnly?: boolean;
    /** Conservé pour compat API inspecteur (auto-appel autorisé : plus de filtre). */
    readonly currentScenarioId?: string;
    readonly scenarioOptions?: readonly ScenarioSelectOption[];
  } = {},
) {
  const { isReadOnly = false, scenarioOptions = [] } = options;
  void options.currentScenarioId;
  return (
    <div className="space-y-3 font-code-sm text-code-sm">
      <label className="block space-y-1.5">
        <span className="text-[11px] font-mono uppercase text-outline tracking-wider">
          Scénario cible (targetScenarioId)
        </span>
        <select
          data-field="targetScenarioId"
          disabled={isReadOnly}
          value={node.targetScenarioId || ''}
          onChange={(e) => onChange('targetScenarioId', (e.target as HTMLSelectElement).value)}
          className="w-full px-2.5 py-2 rounded border border-border-default bg-surface-base text-on-surface text-[12px] disabled:opacity-50"
        >
          <option value="">— Choisir un scénario —</option>
          {scenarioOptions.map((opt) => (
            <option key={opt.id} value={opt.id} data-scenario-option={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-on-surface-variant leading-relaxed font-sans">
        Ports power uniquement : aucun paramètre métier n’est transmis au scénario enfant.
      </p>
    </div>
  );
}

/**
 * Champs d'inspection du bloc ClearContext (agent à réinitialiser).
 * @param node Nœud ClearContext
 * @param onChange Callback de mise à jour d'un champ
 * @param options Options de rendu (lecture seule, recherches)
 */
export function renderClearContextFields(
  node: ScenarioNode,
  onChange: (field: string, val: string) => void,
  options: FieldRenderOptions = {},
) {
  const { isReadOnly = false, searchAgent } = options;
  return (
    <div className="space-y-3 font-code-sm text-code-sm">
      <AutocompleteInput
        id="inspector-agent"
        name="agentId"
        label="Agent à réinitialiser"
        disabled={isReadOnly}
        value={node.agentId || ''}
        placeholder="ID de l’agent cible (ex: ag-1)"
        search={searchAgent || createResourceSearch('/api/agents', 'agent')}
        onChange={(val) => onChange('agentId', val)}
      />
      <div className="p-3 bg-surface-base rounded border border-border-subtle text-[11px] leading-relaxed text-on-surface-variant font-sans">
        À l’activation de ce bloc, l’historique conversationnel et le contexte en mémoire vive de
        l’agent spécifié sont intégralement purgés.
      </div>
    </div>
  );
}
