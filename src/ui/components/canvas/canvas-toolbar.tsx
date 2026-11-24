import { h } from 'preact';
import type { NodeType } from '../../../types/models/node.model.js';
import { LAUNCH_BUTTON_LABEL } from '../../hooks/canvas/use-canvas-state.hook.js';
/**
 * Propriétés du composant VDOM CanvasToolbar.
 */
export interface CanvasToolbarProps {
  readonly scenarioName?: string;
  readonly onRenameScenario?: (newName: string) => void;
  readonly onAddNode?: (type: NodeType) => void;
  readonly onLaunch?: () => void;
  readonly onStop?: () => void;
  readonly onSave?: () => void;
  readonly isRunning?: boolean;
  /** Verrouille ajout de blocs + Enregistrer (AC-UI-02-9). */
  readonly isGraphLocked?: boolean;
  readonly hasStartNode?: boolean;
  readonly canLaunch?: boolean;
  readonly isSaved?: boolean;
  readonly isSavePrompted?: boolean;
}

const MUTED_BUTTON_CLASS =
  'flex items-center gap-1 px-2.5 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated rounded transition-colors text-body-sm disabled:opacity-40 disabled:cursor-not-allowed';

const PULSE_BUTTON_CLASS =
  'flex items-center gap-1 px-2.5 py-1 rounded text-body-sm border transition-all animate-save-pulse cursor-pointer';

interface SaveUrgentOptions {
  readonly isSavePrompted?: boolean;
  readonly canLaunch?: boolean;
  readonly isSaved?: boolean;
  readonly isGraphLocked?: boolean;
}

function isSaveUrgentState(options: SaveUrgentOptions) {
  if (options.isSavePrompted !== undefined) return options.isSavePrompted;
  return !options.canLaunch && options.isSaved === false && !options.isGraphLocked;
}

function resolveRunTooltip(canLaunch: boolean, isSaved?: boolean) {
  if (!canLaunch && isSaved === false) {
    return 'Veuillez enregistrer le scénario avant de le lancer.';
  }
  return undefined;
}

/**
 * Barre d'outils flottante du canvas scenario pour l'ajout de blocs et le contrôle d'exécution.
 * @param props Propriétés du composant toolbar
 */
export function CanvasToolbar(props: CanvasToolbarProps) {
  const {
    scenarioName,
    onRenameScenario,
    onAddNode,
    onLaunch,
    onStop,
    onSave,
    isRunning = false,
    isGraphLocked = false,
    hasStartNode = false,
    canLaunch = true,
    isSaved,
    isSavePrompted,
  } = props;

  const isAddDisabled = isGraphLocked;
  const isSaveUrgent = isSaveUrgentState({ isSavePrompted, canLaunch, isSaved, isGraphLocked });
  const saveButtonClass = isSaveUrgent ? PULSE_BUTTON_CLASS : MUTED_BUTTON_CLASS;
  const saveTitle = isSaveUrgent
    ? 'Veuillez enregistrer le scénario pour pouvoir le lancer.'
    : undefined;
  const runTitle = resolveRunTooltip(canLaunch, isSaved);

  return (
    <div className="absolute top-3 left-6 z-50 flex items-center gap-2 select-none">
      <div className="flex items-center gap-1.5 p-1 bg-surface-panel/95 backdrop-blur shadow-xl rounded-lg border border-border-default">
        <input
          type="text"
          data-field="scenario-name"
          disabled={isGraphLocked}
          value={scenarioName ?? ''}
          placeholder="Nom du scénario"
          onInput={(e) => onRenameScenario?.((e.target as HTMLInputElement).value)}
          className="px-2 py-0.5 font-semibold text-body-sm text-on-surface bg-surface-elevated/60 hover:bg-surface-elevated focus:bg-surface-elevated rounded border border-border-default/60 focus:border-border-focus focus:outline-none transition-all max-w-[200px]"
        />

        {/* Add Node Actions */}
        <button
          type="button"
          data-action="add-start"
          disabled={isAddDisabled || hasStartNode}
          onClick={() => onAddNode?.('start')}
          className={MUTED_BUTTON_CLASS}
        >
          <span className="material-symbols-outlined text-[15px] text-tertiary">bolt</span>
          <span>Start</span>
        </button>

        <button
          type="button"
          data-action="add-run"
          disabled={isAddDisabled}
          onClick={() => onAddNode?.('run')}
          className={MUTED_BUTTON_CLASS}
        >
          <span className="material-symbols-outlined text-[15px] text-accent-agent">smart_toy</span>
          <span>Run</span>
        </button>

        <button
          type="button"
          data-action="add-if"
          disabled={isAddDisabled}
          onClick={() => onAddNode?.('if')}
          className={MUTED_BUTTON_CLASS}
        >
          <span className="material-symbols-outlined text-[15px] text-primary">alt_route</span>
          <span>If</span>
        </button>

        <button
          type="button"
          data-action="add-clear-context"
          disabled={isAddDisabled}
          onClick={() => onAddNode?.('clearContext')}
          className={MUTED_BUTTON_CLASS}
        >
          <span className="material-symbols-outlined text-[15px] text-outline">mop</span>
          <span>ClearContext</span>
        </button>

        <button
          type="button"
          data-action="add-call-scenario"
          disabled={isAddDisabled}
          onClick={() => onAddNode?.('callScenario')}
          className={MUTED_BUTTON_CLASS}
        >
          <span className="material-symbols-outlined text-[15px] text-tertiary">account_tree</span>
          <span>CallScenario</span>
        </button>

        <button
          type="button"
          data-action="add-command"
          disabled={isAddDisabled}
          onClick={() => onAddNode?.('command')}
          className={MUTED_BUTTON_CLASS}
        >
          <span className="material-symbols-outlined text-[15px] text-tertiary">terminal</span>
          <span>Command</span>
        </button>

        <div className="w-px h-5 bg-border-subtle mx-1" />

        {onSave && (
          <button
            type="button"
            data-action="save-scenario"
            disabled={isGraphLocked}
            onClick={onSave}
            title={saveTitle}
            className={saveButtonClass}
          >
            <span className="material-symbols-outlined text-[15px]">save</span>
            <span>Enregistrer</span>
          </button>
        )}

        {/* Execution Controls */}
        <button
          type="button"
          data-action="run-scenario"
          disabled={isRunning || !canLaunch}
          onClick={onLaunch}
          title={runTitle}
          className="flex items-center gap-1.5 px-3 py-1 bg-border-focus hover:bg-primary text-white rounded font-medium text-body-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[15px]">play_arrow</span>
          <span>{LAUNCH_BUTTON_LABEL}</span>
        </button>

        <button
          type="button"
          data-action="stop-scenario"
          disabled={!isRunning}
          onClick={onStop}
          className="flex items-center gap-1 px-2.5 py-1 bg-status-error/15 hover:bg-status-error/25 text-status-error border border-status-error/30 rounded text-body-sm transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[14px]">stop</span>
          <span>Arrêter tout</span>
        </button>
      </div>
    </div>
  );
}
