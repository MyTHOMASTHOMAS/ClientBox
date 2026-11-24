/**
 * Cycle de vie d'un run : validation topologie, finalisation et arrêt blocs.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { BlockStatus, RunnerStatus } from '../../../types/messages/block-status.message.js';
import { validateGraph } from '../../../domain/graph/graph-integrity.validator.js';
import * as runnerLog from '../../../utils/logger/events/info/runner-info.event.js';
import { logScenarioFailed } from '../../../utils/logger/events/errors/runner-error.event.js';

/** Dépendances injectées pour le cycle de vie (pas de mutation de paramètre). */
export interface RunnerLifecycleDeps {
  readonly scenario: Scenario;
  readonly getFailure: () => unknown;
  readonly isStopped: () => boolean;
  readonly setRunnerStatus: (status: RunnerStatus) => void;
  readonly setStopped: () => void;
  readonly emitEvent: (event: string, payload: unknown) => void;
  readonly setBlockStatus: (nodeId: string, status: BlockStatus, message?: string) => void;
  readonly listBlockStatuses: () => Iterable<[string, BlockStatus]>;
  readonly stopActiveProcesses: () => void;
}

/**
 * Valide la topologie du graphe avant démarrage.
 * @param deps Dépendances runner
 */
export function validateRunnerTopology(deps: RunnerLifecycleDeps) {
  const errors = validateGraph(deps.scenario.nodes, deps.scenario.connections);
  if (errors.length > 0) {
    deps.setRunnerStatus('error');
    const message = `Graphe de scénario invalide : ${errors.join(' ; ')}`;
    deps.emitEvent('statusChanged', { status: 'error', error: message });
    throw new Error(message);
  }
}

/**
 * Finalise le run (erreur, stop ou succès).
 * @param deps Dépendances runner
 * @param startMs Horodatage de démarrage
 */
export function finalizeRunner(deps: RunnerLifecycleDeps, startMs: number) {
  const failure = deps.getFailure();
  if (failure !== null) {
    deps.setRunnerStatus('error');
    const error = failure instanceof Error ? failure.message : `${failure}`;
    deps.emitEvent('statusChanged', { status: 'error', error });
    logScenarioFailed(deps.scenario.id, failure);
    throw failure;
  }
  if (deps.isStopped()) {
    return;
  }
  deps.setRunnerStatus('completed');
  deps.emitEvent('statusChanged', { status: 'completed' });
  runnerLog.logScenarioCompleted(deps.scenario.id, Date.now() - startMs);
}

/**
 * Interrompt le run et remet les blocs actifs à idle.
 * @param deps Dépendances runner
 */
export function stopRunnerLifecycle(deps: RunnerLifecycleDeps) {
  deps.setStopped();
  deps.setRunnerStatus('stopped');
  deps.stopActiveProcesses();
  for (const [nodeId, status] of deps.listBlockStatuses()) {
    if (status === 'running' || status === 'paused') {
      deps.setBlockStatus(nodeId, 'idle');
    }
  }
  deps.emitEvent('statusChanged', { status: 'stopped' });
}
