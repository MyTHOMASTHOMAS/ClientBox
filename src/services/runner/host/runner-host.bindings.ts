/**
 * Câblage processBag, lifecycleDeps et pont d'événements du ScenarioRunnerService.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { BlockStatus, RunnerStatus } from '../../../types/messages/block-status.message.js';
import type { SpawnAgentHandle } from '../../../lib/process/child-process.spawner.js';
import {
  stopAllActiveProcesses,
  type ActiveProcessBag,
} from '../process/runner-active-processes.js';
import type { NestedScenarioRunner } from '../call-scenario/runner-call-scenario.helper.js';

/** Handler d'événement runner. */
export type RunnerEventHandler = (...args: readonly unknown[]) => void;

/** Accès mutable aux champs d'état du runner hôte. */
export interface RunnerHostState {
  readonly scenario: Scenario;
  readonly blockStatuses: Map<string, BlockStatus>;
  readonly eventListeners: Map<string, Set<RunnerEventHandler>>;
  readonly activeSpawnHandles: Set<SpawnAgentHandle>;
  readonly childRunners: Set<NestedScenarioRunner & { stop(): Promise<void> }>;
  getFailure(): unknown;
  setFailure(err: unknown): void;
  getStopped(): boolean;
  setStopped(isStopped: boolean): void;
  setRunnerStatus(status: RunnerStatus): void;
  isHalted(): boolean;
  captureSession(agentId: string, sessionId: string): void;
  setBlockStatus(nodeId: string, status: BlockStatus, message?: string): void;
}

/**
 * Lie l'état mutable du ScenarioRunnerService au contrat RunnerHostState.
 *
 * @param host Champs et callbacks d'état du runner
 */
export function bindRunnerHostState(host: RunnerHostState) {
  return host;
}

/**
 * Émet un événement vers tous les listeners enregistrés.
 *
 * @param listeners Table événement → handlers
 * @param event Nom d'événement
 * @param payload Charge utile
 */
export function emitRunnerEvent(
  listeners: Map<string, Set<RunnerEventHandler>>,
  event: string,
  payload: unknown,
) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      // Les handlers SSE/UI ne doivent pas faire échouer le runner.
    }
  });
}

/**
 * Met à jour le statut d'un bloc et notifie les listeners.
 *
 * @param options Contexte de statut
 */
export function setRunnerBlockStatus(options: {
  readonly blockStatuses: Map<string, BlockStatus>;
  readonly listeners: Map<string, Set<RunnerEventHandler>>;
  readonly nodeId: string;
  readonly status: BlockStatus;
  readonly message?: string;
}) {
  options.blockStatuses.set(options.nodeId, options.status);
  emitRunnerEvent(
    options.listeners,
    'blockStatusChanged',
    options.message
      ? { nodeId: options.nodeId, status: options.status, message: options.message }
      : { nodeId: options.nodeId, status: options.status },
  );
}

/**
 * Construit le sac processus actifs lié à l'hôte.
 *
 * @param host État mutable du runner
 */
export function buildActiveProcessBag(host: RunnerHostState) {
  const bag: ActiveProcessBag = {
    scenarioId: host.scenario.id,
    activeSpawnHandles: host.activeSpawnHandles,
    childRunners: host.childRunners,
    isHalted: () => host.isHalted(),
    emitChunk: (nodeId, chunk, stream, event) => {
      emitRunnerEvent(host.eventListeners, 'chunkReceived', { nodeId, stream, chunk, event });
    },
    captureSession: (agentId, sessionId) => host.captureSession(agentId, sessionId),
    setBlockError: (nodeId, message) => host.setBlockStatus(nodeId, 'error', message),
    onFirstFailure: (err) => {
      host.setFailure(err);
      stopAllActiveProcesses(bag);
    },
    getFailure: () => host.getFailure(),
  };
  return bag;
}

/**
 * Construit les deps du cycle de vie runner.
 *
 * @param host État mutable du runner
 * @param processBag Factory du sac processus
 */
export function buildLifecycleDeps(host: RunnerHostState, processBag: () => ActiveProcessBag) {
  return {
    scenario: host.scenario,
    getFailure: () => host.getFailure(),
    isStopped: () => host.getStopped(),
    setRunnerStatus: (status: RunnerStatus) => host.setRunnerStatus(status),
    setStopped: () => host.setStopped(true),
    emitEvent: (event: string, payload: unknown) =>
      emitRunnerEvent(host.eventListeners, event, payload),
    setBlockStatus: (nodeId: string, status: BlockStatus, message?: string) =>
      host.setBlockStatus(nodeId, status, message),
    listBlockStatuses: () => host.blockStatuses.entries(),
    stopActiveProcesses: () => stopAllActiveProcesses(processBag()),
  };
}
