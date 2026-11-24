/**
 * Hook et logique réactive de contrôle du flux d'exécution streaming SSE (SPEC-UI-03).
 * Gestion volatile purement mémoire sans persistance disque.
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import type { AgentStreamEvent } from '../../../types/contracts/cli-adapter.contract.js';
import type {
  TerminalViewState,
  TerminalLine,
  TerminalFilterState,
  BooleanFlag,
} from '../../types/ui.types.js';
import { createHttpClient } from '../../api/http.client.js';

/**
 * Nombre maximal de lignes conservées dans le tampon circulaire volatile.
 */
export const TERMINAL_MAX_LINES = 5000;

export type { TerminalViewState, TerminalLine };

/**
 * Initialise l'état d'affichage d'un terminal pour un scénario donné.
 * @param scenarioId Identifiant du scénario
 */
export function createTerminalView(scenarioId: string) {
  return {
    scenarioId,
    lines: [] as TerminalLine[],
    persistsToDisk: false as BooleanFlag,
    diskWriteCalls: 0,
    autoScroll: true as BooleanFlag,
  } as TerminalViewState;
}

/**
 * Ajoute un chunk d'événement au tampon circulaire du terminal avec horodatage.
 * @param state État actuel du terminal
 * @param event Événement de flux CLI
 */
export function appendStreamEvent(state: TerminalViewState, event: AgentStreamEvent) {
  const stream = event.type === 'stderr' ? 'stderr' : 'stdout';
  const text = event.chunk.replace(/\r?\n$/u, '');
  const cssClass =
    stream === 'stderr' ? 'text-status-error font-mono' : 'text-terminal-text font-mono';
  const now = new Date();
  const timestamp = now.toTimeString().split(' ')[0] ?? '';
  const newLine: TerminalLine = { stream, text, cssClass, timestamp };

  const allLines = [...state.lines, newLine];
  const boundedLines =
    allLines.length > TERMINAL_MAX_LINES
      ? allLines.slice(allLines.length - TERMINAL_MAX_LINES)
      : allLines;

  return {
    ...state,
    lines: boundedLines,
  } as TerminalViewState;
}

/**
 * Reconnecte le terminal en réinjectant une liste d'événements.
 * @param state État initial du terminal
 * @param options Paramètres de reconnexion
 */
export function reconnectTerminal(
  state: TerminalViewState,
  options: { resumeFromServer?: true | false; liveEvents?: readonly AgentStreamEvent[] },
) {
  let updated: TerminalViewState = { ...state, lines: [] };
  if (options.liveEvents) {
    for (const ev of options.liveEvents) {
      updated = appendStreamEvent(updated, ev);
    }
  }
  return updated;
}

/**
 * Normalise les payloads JSON bruts en messages descriptifs français.
 * @param raw Message brut du flux
 */
export function formatStreamData(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.status === 'running') {
      return parsed.nodeId
        ? `Nœud « ${parsed.nodeId} » : exécution en cours...`
        : 'Scénario : exécution en cours...';
    }
    if (parsed.status === 'completed') {
      return 'Scénario : exécution terminée avec succès.';
    }
  } catch {
    // Message brut non JSON
  }
  return raw;
}

/**
 * Détermine si le terminal global doit être affiché selon la route active.
 * @param route Route d'interface actuelle
 */
export function shouldShowGlobalTerminal(route: string) {
  if (route.startsWith('#/instructions')) return false;
  return !/^#\/scenarios\/[a-zA-Z0-9_-]+$/u.test(route);
}

/**
 * Vide le tampon volatile du terminal sans toucher au scénario associé.
 * @param state État terminal courant
 */
export function clearTerminalView(state: TerminalViewState) {
  return { ...state, lines: [] as TerminalLine[] } as TerminalViewState;
}

/**
 * Filtre les lignes du terminal selon le flux et la recherche textuelle.
 * @param state État terminal courant
 * @param filters Filtres actifs
 */
export function filterTerminalLines(state: TerminalViewState, filters: TerminalFilterState) {
  const query = filters.searchQuery.trim().toLowerCase();
  return state.lines.filter((line) => {
    if (filters.activeFilter !== 'all' && line.stream !== filters.activeFilter) return false;
    if (query && !line.text.toLowerCase().includes(query)) return false;
    return true;
  });
}

/**
 * Hook d'abonnement au flux temps réel SSE d'un scénario.
 * @param scenarioId Identifiant du scénario optionnel
 */
export function useExecutionStream(scenarioId?: string) {
  const [terminalState, setTerminalState] = useState<TerminalViewState>(() =>
    createTerminalView(scenarioId ?? ''),
  );
  const [filterState, setFilterState] = useState<TerminalFilterState>({
    activeFilter: 'all',
    searchQuery: '',
    autoScroll: true,
    showTimestamps: true,
  });

  useEffect(() => {
    if (!scenarioId) return;
    const client = createHttpClient();
    const unsubscribe = client.subscribeStream(`/api/scenarios/${scenarioId}/stream`, {
      onStdout: (chunk) => setTerminalState((s) => appendStreamEvent(s, { type: 'stdout', chunk })),
      onStderr: (chunk) => setTerminalState((s) => appendStreamEvent(s, { type: 'stderr', chunk })),
    });
    return () => unsubscribe();
  }, [scenarioId]);

  const onClear = useCallback(() => {
    setTerminalState((s) => ({ ...s, lines: [] }));
  }, []);

  return { terminalState, filterState, setFilterState, onClear };
}
