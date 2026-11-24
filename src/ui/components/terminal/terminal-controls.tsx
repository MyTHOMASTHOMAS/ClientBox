import { h } from 'preact';
import type { RunnerStatus } from '../../../types/messages/block-status.message.js';
import type { HttpClient } from '../../api/http.client.js';
import type { TerminalFilterState, BooleanFlag } from '../../types/ui.types.js';

/** Libellé officiel du bouton d'arrêt d'urgence. */
export const STOP_BUTTON_LABEL = 'Arrêter tout (Stop)';
/**
 * Détermine si le bouton d'arrêt d'urgence est actif selon l'état du moteur.
 * @param status État du runner (running, paused, etc.)
 */
export function isStopEnabled(status: RunnerStatus) {
  return status === 'running' || status === 'paused';
}

/**
 * Déclenche l'arrêt d'urgence d'un scénario en cours d'exécution via DELETE.
 * @param options Options d'arrêt d'urgence
 */
export async function triggerEmergencyStop(options: {
  scenarioId: string;
  runnerStatus: RunnerStatus;
  http: HttpClient;
}) {
  if (!isStopEnabled(options.runnerStatus)) {
    return {
      ok: false as BooleanFlag,
      error: "L'arrêt d'urgence n'est disponible que pendant l'exécution ou en pause.",
    };
  }
  try {
    await options.http.del(`/api/scenarios/${options.scenarioId}/run`);
    return {
      ok: true as BooleanFlag,
      runnerStatus: 'stopped' as RunnerStatus,
      confirmationMessage: 'Le scénario a été interrompu et le processus a été stoppé avec succès.',
    };
  } catch (err: unknown) {
    return { ok: false as BooleanFlag, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Propriétés de la barre de contrôle du terminal. */
export interface TerminalControlsProps {
  readonly runnerStatus?: RunnerStatus;
  readonly filterState?: TerminalFilterState;
  readonly onFilterChange?: (filters: Partial<TerminalFilterState>) => void;
  readonly onClear?: () => void;
  readonly onStop?: () => void;
}

/**
 * Barre de commandes et filtres pour le terminal d'exécution temps réel.
 * @param props Propriétés du composant
 */
export function TerminalControls(props: TerminalControlsProps) {
  const { runnerStatus = 'idle', filterState, onFilterChange, onClear, onStop } = props;
  const stopActive = isStopEnabled(runnerStatus);

  return (
    <div className="h-10 bg-surface-elevated px-3 flex items-center justify-between gap-3 text-on-surface border-b border-border-subtle select-none">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-outline font-semibold">Terminal Live SSE</span>
        <div className="h-4 w-px bg-border-default" />
        <button
          type="button"
          onClick={() => onFilterChange?.({ activeFilter: 'all' })}
          className={`px-2 py-0.5 rounded text-code-sm font-code-sm transition-colors ${
            filterState?.activeFilter === 'all'
              ? 'bg-surface-variant text-on-surface font-semibold'
              : 'bg-surface-base text-outline hover:text-on-surface'
          }`}
        >
          Tous les flux
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onFilterChange?.({ autoScroll: !filterState?.autoScroll as BooleanFlag })}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-base text-tertiary text-code-sm font-code-sm"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${filterState?.autoScroll ? 'bg-status-success' : 'bg-outline'}`}
          />
          <span>Auto-scroll</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Vider le terminal"
          className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-base transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
        </button>

        <button
          type="button"
          disabled={!stopActive}
          onClick={onStop}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-status-error hover:bg-error-container text-white text-code-sm font-code-sm font-bold shadow transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[14px]">stop_circle</span>
          <span>{STOP_BUTTON_LABEL}</span>
        </button>
      </div>
    </div>
  );
}
