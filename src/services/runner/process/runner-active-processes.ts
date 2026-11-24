/**
 * Suivi des spawns CLI et des sous-runners CallScenario (arrêt d'urgence).
 */

import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { SpawnAgentHandle } from '../../../lib/process/child-process.spawner.js';
import { logBlockFailed } from '../../../utils/logger/events/errors/runner-error.event.js';
import { executeRunnerSpawn, trackActiveHandle } from './runner-process.spawner.js';
import type { PreparedRunContext } from './runner-process.spawner.js';
import type { NestedScenarioRunner } from '../call-scenario/runner-call-scenario.helper.js';

/** Contexte mutable pour l'arrêt et le spawn. */
export interface ActiveProcessBag {
  readonly scenarioId: string;
  readonly activeSpawnHandles: Set<SpawnAgentHandle>;
  readonly childRunners: Set<NestedScenarioRunner & { stop(): Promise<void> }>;
  readonly isHalted: () => boolean;
  readonly emitChunk: (nodeId: string, chunk: string, stream: string, event: unknown) => void;
  readonly captureSession?: (agentId: string, sessionId: string) => void;
  readonly setBlockError: (nodeId: string, message: string) => void;
  readonly onFirstFailure: (err: unknown) => void;
  getFailure: () => unknown;
}

/**
 * Spawn CLI suivi ; no-op si le runner est déjà arrêté.
 *
 * @param bag Contexte processus actifs
 * @param node Nœud Run
 * @param ctx Contexte préparé
 */
export function executeTrackedSpawn(
  bag: ActiveProcessBag,
  node: ScenarioNode,
  ctx: PreparedRunContext,
) {
  return executeRunnerSpawn({
    node,
    adapter: ctx.adapter,
    commandSpec: ctx.commandSpec,
    isStopped: () => bag.isHalted(),
    onChunk: (chunk, stream, event) => {
      bag.emitChunk(node.id, chunk, stream, event);
    },
    onActiveHandle: trackActiveHandle(bag.activeSpawnHandles, () => bag.isHalted()),
    onSessionCaptured: ctx.agentId
      ? (sessionId) => bag.captureSession?.(ctx.agentId!, sessionId)
      : undefined,
  });
}

/**
 * Arrête tous les sous-runners et handles spawn actifs.
 *
 * @param bag Contexte processus actifs
 */
export function stopAllActiveProcesses(bag: ActiveProcessBag) {
  for (const child of [...bag.childRunners]) {
    void child.stop();
  }
  bag.childRunners.clear();
  for (const handle of bag.activeSpawnHandles) {
    handle.stop();
  }
  bag.activeSpawnHandles.clear();
}

/**
 * Marque un bloc en erreur et déclenche l'arrêt au premier échec.
 *
 * @param bag Contexte processus actifs
 * @param node Nœud en échec
 * @param err Erreur capturée
 */
export function failActiveBlock(bag: ActiveProcessBag, node: ScenarioNode, err: unknown) {
  bag.setBlockError(node.id, err instanceof Error ? err.message : `${err}`);
  logBlockFailed(bag.scenarioId, node.id, err);
  if (bag.getFailure() === null) {
    bag.onFirstFailure(err);
  }
}
