/**
 * @fileExemption Dépassement du seuil TSX (250) justifié par le panneau d'inspection (sélection, lecture seule, suppression) et le câblage des formulaires par type de bloc.
 */
import { h } from 'preact';
import type { NodeType, ScenarioNode } from '../../../types/models/node.model.js';
import type { Scenario } from '../../../types/models/scenario.model.js';
import type { AutocompleteSuggestion } from '../common/autocomplete-input.js';
import {
  renderCallScenarioFields,
  renderClearContextFields,
  renderIfFields,
  renderRunFields,
  renderStartFields,
  type ScenarioSelectOption,
} from './inspector-panel.fields.js';
import { renderCommandFields } from './inspector-panel.command.js';

/**
 * Retourne la liste des clés de champs configurables pour un type de bloc donné.
 * @param type Type de nœud inspecté
 */
export function getInspectorFieldsForType(type: NodeType) {
  if (type === 'start') return ['label'];
  if (type === 'run') return ['agentId', 'promptId', 'exitId'];
  if (type === 'if') return ['ifScriptId'];
  if (type === 'clearContext') return ['agentId'];
  if (type === 'callScenario') return ['targetScenarioId'];
  if (type === 'command') return ['commandLine'];
  return [];
}

const INSPECTOR_MUTABLE_KEYS = [
  'label',
  'agentId',
  'promptId',
  'exitId',
  'ifScriptId',
  'targetScenarioId',
  'commandLine',
] as const;

/**
 * Applique les modifications de paramètres inspectés sur une copie immuable du nœud.
 * @param node Nœud à mettre à jour
 * @param params Dictionnaire des nouveaux paramètres saisis
 */
export function applyInspectorParams(node: ScenarioNode, params: Record<string, string>) {
  const result: Record<string, unknown> = { ...node };
  for (const key of INSPECTOR_MUTABLE_KEYS) {
    if (key in params) {
      const val = params[key];
      if (val !== undefined && val !== '') {
        result[key] = val;
      } else {
        delete result[key];
      }
    }
  }
  return result as unknown as ScenarioNode;
}

export type { ScenarioSelectOption };

/** Propriétés du panneau d'inspection latéral. */
export interface InspectorPanelProps {
  readonly scenario: Scenario;
  readonly selectedNodeId?: string | null;
  /** Lecture seule pendant un run (AC-UI-02-9). */
  readonly isReadOnly?: boolean;
  readonly onUpdate?: (updatedNode: ScenarioNode) => void;
  readonly onClose?: () => void;
  readonly onDeleteNode?: (nodeId: string) => void;
  /** Scénario ouvert dans le Studio (exclu du dropdown CallScenario). */
  readonly currentScenarioId?: string;
  /** Liste des scénarios proposés pour targetScenarioId. */
  readonly scenarioOptions?: readonly ScenarioSelectOption[];
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

function renderNodeFields(
  node: ScenarioNode,
  handleChange: (field: string, val: string) => void,
  props: InspectorPanelProps,
) {
  if (node.type === 'start') return renderStartFields(node, handleChange, props.isReadOnly);
  if (node.type === 'run') return renderRunFields(node, handleChange, props);
  if (node.type === 'if') return renderIfFields(node, handleChange, props);
  if (node.type === 'clearContext') return renderClearContextFields(node, handleChange, props);
  if (node.type === 'callScenario') {
    return renderCallScenarioFields(node, handleChange, {
      isReadOnly: props.isReadOnly,
      currentScenarioId: props.currentScenarioId ?? props.scenario.id,
      scenarioOptions: props.scenarioOptions,
    });
  }
  if (node.type === 'command') return renderCommandFields(node, handleChange, props.isReadOnly);
  return null;
}

/**
 * Panneau d'inspection latéral contextuel affichant directement les champs éditables selon le type de nœud sélectionné.
 * @param props Propriétés du composant
 */
export function InspectorPanel(props: InspectorPanelProps) {
  const { scenario, selectedNodeId, isReadOnly = false, onUpdate, onClose, onDeleteNode } = props;
  if (!selectedNodeId) return null;

  const node = scenario.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const handleChange = (field: string, val: string) => {
    if (isReadOnly) return;
    onUpdate?.(applyInspectorParams(node, { [field]: val }));
  };

  const handleDelete = () => {
    if (isReadOnly) return;
    onDeleteNode?.(node.id);
  };

  return (
    <aside
      data-section="inspector"
      data-readonly={isReadOnly ? 'true' : 'false'}
      className="absolute right-0 top-0 bottom-0 w-80 md:w-96 max-w-full bg-surface-panel/95 backdrop-blur border-l border-border-default z-40 flex flex-col shadow-2xl select-none"
    >
      <div className="px-4 py-3 bg-surface-container-high border-b border-border-subtle flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
            Configuration du bloc : {node.type}
          </span>
          <h3 className="font-headline-sm text-[13px] text-on-surface font-semibold truncate">
            {node.id}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-elevated transition-colors"
          aria-label="Fermer l’inspecteur"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 font-body-sm text-body-sm">
        {renderNodeFields(node, handleChange, props)}
      </div>

      <div className="p-4 border-t border-border-subtle bg-surface-container/50">
        <button
          type="button"
          data-action="delete-node"
          disabled={isReadOnly}
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded bg-status-error/10 text-status-error hover:bg-status-error/20 border border-status-error/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          <span>Supprimer ce bloc</span>
        </button>
      </div>
    </aside>
  );
}
