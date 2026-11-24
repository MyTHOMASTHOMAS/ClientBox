/**
 * Hydratation Studio depuis snapshot GET /run (SPEC-UI-03 / CASE-UI-03-9).
 * Séparé de use-scenario-execution pour garder lisibilité et contrats exportés.
 */

import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { BooleanFlag } from '../../types/canvas.types.js';

/** Snapshot d'exécution renvoyé par GET /api/scenarios/:id/run (CASE-SRV-02-16). */
export interface ExecutionSnapshot {
  readonly status: string;
  readonly activeScenarioId: string | null;
  /** Champ filaire API (`busy`) — typé BooleanFlag pour conformité nommage ARCH-07. */
  readonly busy: BooleanFlag;
  readonly blocks: readonly { readonly nodeId: string; readonly status: string }[];
}

/** Message FR lorsque un autre scénario occupe le runner (CASE-UI-03-9). */
export const EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE = 'Une exécution de scénario est déjà en cours.';

/** Résultat du verrou Launch dérivé du snapshot. */
export interface ExecutionLaunchLockResult {
  readonly isRunning: boolean;
  readonly isLaunchDisabled: boolean;
  readonly isForeignRun: boolean;
  readonly message: string | null;
}

/**
 * Détermine le verrouillage Launch / Stop à partir du snapshot serveur.
 * @param options Identifiant scénario courant et snapshot GET /run
 */
export function resolveExecutionLaunchLock(options: {
  readonly scenarioId: string;
  readonly snapshot: ExecutionSnapshot;
}) {
  const { scenarioId, snapshot } = options;
  if (!snapshot.busy) {
    return {
      isRunning: false,
      isLaunchDisabled: false,
      isForeignRun: false,
      message: null,
    } satisfies ExecutionLaunchLockResult;
  }
  const isForeignRun =
    snapshot.activeScenarioId !== null && snapshot.activeScenarioId !== scenarioId;
  if (isForeignRun) {
    return {
      isRunning: false,
      isLaunchDisabled: true,
      isForeignRun: true,
      message: EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE,
    } satisfies ExecutionLaunchLockResult;
  }
  return {
    isRunning: true,
    isLaunchDisabled: true,
    isForeignRun: false,
    message: null,
  } satisfies ExecutionLaunchLockResult;
}

/**
 * Applique les statuts de blocs du snapshot sur les nœuds locaux (ids connus uniquement).
 * Si `options.scenarioId` diffère de `snapshot.activeScenarioId`, aucun statut nested n'est appliqué (REQ-040).
 * @param nodes Nœuds du canvas
 * @param snapshot Snapshot d'exécution serveur
 * @param options Contexte du scénario affiché
 */
export function applyExecutionSnapshot(
  nodes: readonly ScenarioNode[],
  snapshot: ExecutionSnapshot,
  options?: { readonly scenarioId?: string },
) {
  if (
    options?.scenarioId &&
    snapshot.activeScenarioId !== null &&
    snapshot.activeScenarioId !== options.scenarioId
  ) {
    return nodes.map((node) => ({ ...node }));
  }
  const byId = new Map(snapshot.blocks.map((block) => [block.nodeId, block.status]));
  return nodes.map((node) => {
    const status = byId.get(node.id);
    return status !== undefined ? { ...node, status } : { ...node };
  });
}

/**
 * Charge le snapshot d'exécution et dérive l'état Studio.
 * @param options Identifiant, client HTTP et nœuds locaux
 */
export async function hydrateStudioExecution(options: {
  readonly scenarioId: string;
  readonly client: { get<T>(url: string): Promise<T> };
  readonly nodes: readonly ScenarioNode[];
}) {
  const snapshot = await options.client.get<ExecutionSnapshot>(
    `/api/scenarios/${options.scenarioId}/run`,
  );
  const lock = resolveExecutionLaunchLock({
    scenarioId: options.scenarioId,
    snapshot,
  });
  const nodes = lock.isForeignRun
    ? options.nodes.map((node) => ({ ...node }))
    : applyExecutionSnapshot(options.nodes, snapshot);
  return { ...lock, nodes };
}
