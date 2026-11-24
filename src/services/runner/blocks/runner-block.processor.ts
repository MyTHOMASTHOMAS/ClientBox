/**
 * Traitement d'un nœud de graphe dans le runner (exécution + statut).
 */

import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { CLIAdapter } from '../../../types/contracts/cli-adapter.contract.js';
import type { ResourceStoreService } from '../../resources/resource-store.service.js';
import type { BlockStatus } from '../../../types/messages/block-status.message.js';
import type { Connection } from '../../../types/models/connection.model.js';
import type { BlockInputBag } from '../../../types/models/input-bag.model.js';
import type { GraphEmission } from '../../../domain/graph/graph-topology.resolver.js';
import * as runnerLog from '../../../utils/logger/events/info/runner-info.event.js';
import { executeGraphBlock } from './runner-block.executors.js';
import { executeCommandBlock } from '../command/runner-command.executor.js';
import type { ScenarioSessionRegistry } from '../session/runner-session.registry.js';
import type { PreparedRunContext } from '../process/runner-process.spawner.js';
import { failActiveBlock, type ActiveProcessBag } from '../process/runner-active-processes.js';

/** Dépendances pour processRunnerBlock. */
export interface ProcessRunnerBlockInput {
  readonly node: ScenarioNode;
  readonly scenarioId: string;
  readonly resourceStore: ResourceStoreService;
  readonly adapters: readonly CLIAdapter[];
  readonly workspacePath: string;
  readonly policyInjectionState: Map<string, boolean>;
  readonly sessions: ScenarioSessionRegistry;
  readonly sac: BlockInputBag;
  readonly outgoing: readonly Connection[];
  readonly isHalted: () => boolean;
  readonly runCallScenario: (targetId: string) => Promise<void>;
  readonly processBag: () => ActiveProcessBag;
  readonly executeSpawn: (node: ScenarioNode, ctx: PreparedRunContext) => Promise<string> | string;
  readonly setBlockStatus: (nodeId: string, status: BlockStatus, message?: string) => void;
  readonly deliver: (emissions: readonly GraphEmission[]) => void;
}

/** Hôte runner pour câbler processRunnerBlock sans objet inline dans le service. */
export interface ProcessRunnerBlockHost {
  readonly scenarioId: string;
  readonly resourceStore: ResourceStoreService;
  readonly adapters: readonly CLIAdapter[];
  readonly workspacePath: string;
  readonly policyInjectionState: Map<string, boolean>;
  readonly sessions: ScenarioSessionRegistry;
  inputBag(nodeId: string): BlockInputBag;
  outgoing(nodeId: string): readonly Connection[];
  isHalted(): boolean;
  runCallScenario(targetId: string): Promise<void>;
  processBag(): ActiveProcessBag;
  executeSpawn(node: ScenarioNode, ctx: PreparedRunContext): Promise<string> | string;
  setBlockStatus(nodeId: string, status: BlockStatus, message?: string): void;
  deliver(emissions: readonly GraphEmission[]): void;
}

/**
 * Exécute un nœud via l'hôte runner.
 *
 * @param host Hôte d'exécution
 * @param node Nœud à traiter
 */
export async function processHostRunnerBlock(host: ProcessRunnerBlockHost, node: ScenarioNode) {
  await processRunnerBlock({
    node,
    scenarioId: host.scenarioId,
    resourceStore: host.resourceStore,
    adapters: host.adapters,
    workspacePath: host.workspacePath,
    policyInjectionState: host.policyInjectionState,
    sessions: host.sessions,
    sac: host.inputBag(node.id),
    outgoing: host.outgoing(node.id),
    isHalted: () => host.isHalted(),
    runCallScenario: (targetId) => host.runCallScenario(targetId),
    processBag: () => host.processBag(),
    executeSpawn: (runNode, ctx) => host.executeSpawn(runNode, ctx),
    setBlockStatus: (nodeId, status, message) => host.setBlockStatus(nodeId, status, message),
    deliver: (emissions) => host.deliver(emissions),
  });
}

async function dispatchRunnerBlock(input: ProcessRunnerBlockInput) {
  if (input.node.type === 'command') {
    return executeCommandBlock(input.node, {
      workspacePath: input.workspacePath,
      outgoing: input.outgoing,
      isHalted: input.isHalted,
      processBag: input.processBag(),
    });
  }
  return executeGraphBlock(input.node, {
    resourceStore: input.resourceStore,
    adapters: input.adapters,
    workspacePath: input.workspacePath,
    policyInjectionState: input.policyInjectionState,
    sessions: input.sessions,
    sac: input.sac,
    outgoing: input.outgoing,
    scenarioId: input.scenarioId,
    runCallScenario: input.runCallScenario,
    spawn: async (runNode: ScenarioNode, ctx: PreparedRunContext) =>
      input.isHalted() ? '' : input.executeSpawn(runNode, ctx),
  });
}

/**
 * Exécute un bloc du graphe et met à jour son statut.
 *
 * @param input Contexte d'exécution du nœud
 */
export async function processRunnerBlock(input: ProcessRunnerBlockInput) {
  const { node } = input;
  input.setBlockStatus(node.id, 'running');
  const startMs = Date.now();
  try {
    const emissions = await dispatchRunnerBlock(input);
    if (input.isHalted()) return;
    input.setBlockStatus(node.id, 'completed');
    runnerLog.logBlockExecuted(input.scenarioId, node.id, Date.now() - startMs);
    input.deliver(emissions);
  } catch (err: unknown) {
    failActiveBlock(input.processBag(), node, err);
  }
}
