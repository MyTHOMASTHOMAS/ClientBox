import { h } from 'preact';
import type { NodeType } from '../../../types/models/node.model.js';
import type { BlockStatus } from '../../../types/messages/block-status.message.js';
import type { CanvasNodeViewModel } from '../../types/canvas.types.js';

/** Définition d'un port de sortie nodal. */
export interface OutputPortDef {
  readonly portIndex: number;
  readonly branch?: 'true' | 'false';
  readonly label?: string;
}

/** Propriétés visuelles associées à l'état d'un bloc. */
export interface BlockStatusVisual {
  readonly status: BlockStatus;
  readonly labelFr: string;
  readonly cssClass: string;
  readonly color: string;
  readonly badge?: string;
  readonly highlight?: true | false;
}

/** Dictionnaire visuel des branches conditionnelles If. */
export const IF_BRANCH_VISUALS: Record<
  'true' | 'false',
  { label: string; color: string; cssClass: string }
> = {
  true: {
    label: 'Vrai',
    color: '#059669',
    cssClass: 'stroke-[#059669] text-[#059669]',
  },
  false: {
    label: 'Faux',
    color: '#ff4444',
    cssClass: 'stroke-[#ff4444] text-[#ff4444]',
  },
};

/** Dictionnaire des styles par statut d'exécution de bloc. */
export const BLOCK_STATUS_VISUALS: Record<BlockStatus, BlockStatusVisual> = {
  idle: {
    status: 'idle',
    labelFr: 'Inactif',
    cssClass: 'border-border-default text-outline',
    color: '#64748b',
  },
  running: {
    status: 'running',
    labelFr: 'En cours',
    cssClass: 'border-status-active text-primary animate-pulse ring-1 ring-border-focus',
    color: '#3b82f6',
  },
  paused: {
    status: 'paused',
    labelFr: 'En pause',
    badge: 'En pause (Join)',
    cssClass: 'border-status-warning text-status-warning pause-status',
    color: '#f59e0b',
  },
  completed: {
    status: 'completed',
    labelFr: 'Terminé',
    cssClass: 'border-status-success text-tertiary',
    color: '#10b981',
  },
  error: {
    status: 'error',
    labelFr: 'Erreur',
    cssClass: 'border-status-error text-status-error ring-1 ring-status-error error-highlight',
    color: '#ef4444',
    highlight: true,
  },
};

/**
 * Retourne la liste des ports de sortie pour un type de nœud donné.
 * @param type Type de nœud
 */
export function getOutputPortsForType(type: NodeType) {
  if (type === 'if') {
    return [
      { portIndex: 0, branch: 'true' as const, label: 'Vrai' },
      { portIndex: 1, branch: 'false' as const, label: 'Faux' },
    ];
  }
  return [{ portIndex: 0, branch: undefined, label: undefined }];
}

/**
 * Associe un statut d'exécution brut à son rendu visuel français.
 * @param status Statut d'exécution du bloc
 */
export function mapBlockStatusToVisual(status: BlockStatus) {
  return BLOCK_STATUS_VISUALS[status] ?? BLOCK_STATUS_VISUALS.idle;
}

/**
 * Retourne l'icône Material Symbols associée à un type de nœud nodal.
 * @param type Type de nœud
 */
export function getNodeIcon(type: NodeType) {
  if (type === 'start') return 'play_circle';
  if (type === 'if') return 'alt_route';
  if (type === 'clearContext') return 'mop';
  if (type === 'callScenario') return 'account_tree';
  if (type === 'command') return 'terminal';
  return 'smart_toy';
}

function getPortColor(branch?: 'true' | 'false') {
  if (branch === 'true') return 'bg-status-success';
  if (branch === 'false') return 'bg-status-error';
  return 'bg-tertiary';
}

function renderNodeBody(node: CanvasNodeViewModel) {
  return (
    <div className="p-2.5 space-y-1.5 font-code-sm text-[11px] text-on-surface-variant">
      {node.agentId && (
        <div className="text-secondary font-mono truncate">Agent: {node.agentId}</div>
      )}
      {node.promptId && <div className="text-outline truncate">Prompt: {node.promptId}</div>}
      {node.exitId && <div className="text-outline truncate">Exit: {node.exitId}</div>}
      {node.ifScriptId && <div className="text-tertiary truncate">Script: {node.ifScriptId}</div>}
      {node.targetScenarioId && (
        <div className="text-tertiary truncate">Scénario: {node.targetScenarioId}</div>
      )}
      {node.commandLine && (
        <div className="text-tertiary font-mono truncate">Cmd: {node.commandLine}</div>
      )}
      {node.telemetry?.pid && <div className="text-outline">PID: {node.telemetry.pid}</div>}
    </div>
  );
}

/** Propriétés du composant de carte nodale CanvasNode. */
export interface CanvasNodeProps {
  readonly node: CanvasNodeViewModel;
  readonly isSelected?: boolean;
  readonly onSelect?: (nodeId: string) => void;
  readonly onPortClick?: (
    nodeId: string,
    type: 'input' | 'output',
    portIndex: number,
    branch?: 'true' | 'false',
  ) => void;
}

/**
 * Carte de bloc nodal Preact affichant statut, badges et points d'ancrage.
 * @param props Propriétés du composant
 */
export function CanvasNode(props: CanvasNodeProps) {
  const { node, isSelected = false, onSelect, onPortClick } = props;
  const statusVisual = mapBlockStatusToVisual(node.status ?? 'idle');
  const outputPorts = getOutputPortsForType(node.type);
  const borderClass = isSelected
    ? 'border-border-focus ring-2 ring-border-focus/50'
    : statusVisual.cssClass;
  const icon = getNodeIcon(node.type);

  return (
    <div
      data-node-status={node.status ?? 'idle'}
      onClick={() => onSelect?.(node.id)}
      className={`w-full bg-surface-panel rounded-lg shadow-xl border cursor-grab select-none transition-all ${borderClass}`}
    >
      {/* Input Port Anchor */}
      {node.type !== 'start' && (
        <div
          data-port-type="input"
          data-port-index="0"
          onClick={(e) => {
            e.stopPropagation();
            onPortClick?.(node.id, 'input', 0);
          }}
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface-elevated border-2 border-border-default hover:scale-125 transition-transform cursor-pointer flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      )}

      {/* Header */}
      <div className="h-8 px-2.5 bg-surface-container flex items-center justify-between rounded-t-lg border-b border-border-subtle">
        <div className="flex items-center gap-1.5 truncate min-w-0 pr-2">
          <span className="material-symbols-outlined text-[15px] text-primary">{icon}</span>
          <span className="font-headline-sm text-[12px] text-on-surface truncate">{node.id}</span>
        </div>
        <span className="font-code-sm text-[10px] uppercase font-semibold shrink-0">
          {statusVisual.labelFr}
        </span>
      </div>

      {/* Body */}
      {renderNodeBody(node)}

      {/* Output Port Anchors */}
      <div className="absolute -right-2 top-0 bottom-0 flex flex-col justify-around py-2">
        {outputPorts.map((port) => (
          <div
            key={port.portIndex}
            data-port-type="output"
            data-port-index={port.portIndex}
            data-branch={port.branch}
            onClick={(e) => {
              e.stopPropagation();
              onPortClick?.(node.id, 'output', port.portIndex, port.branch);
            }}
            title={port.label ?? 'Sortie'}
            className="w-4 h-4 rounded-full bg-surface-elevated border-2 border-border-default hover:scale-125 transition-transform cursor-pointer flex items-center justify-center"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${getPortColor(port.branch)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
