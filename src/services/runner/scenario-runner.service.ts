/** @fileExemption Orchestration runner (Join, stop, CallScenario nested, SSE) — seuil nominal 150. */

import type { Scenario } from '../../types/models/scenario.model.js';
import type { ScenarioNode } from '../../types/models/node.model.js';
import type { CLIAdapter } from '../../types/contracts/cli-adapter.contract.js';
import type { BlockStatus, RunnerStatus } from '../../types/messages/block-status.message.js';
import type { ResourceStoreService } from '../resources/resource-store.service.js';
import type { SpawnAgentHandle } from '../../lib/process/child-process.spawner.js';
import { broadcastMessage } from '../../domain/graph/graph-topology.resolver.js';
import { buildBlockMessage } from '../../domain/messages/block-message.factory.js';
import { GraphScheduler } from './graph/runner-graph.scheduler.js';
import { ScenarioSessionRegistry } from './session/runner-session.registry.js';
import * as runnerLog from '../../utils/logger/events/info/runner-info.event.js';
import {
  validateRunnerTopology,
  finalizeRunner,
  stopRunnerLifecycle,
} from './graph/runner-lifecycle.manager.js';
import { runCallScenarioFromHost } from './call-scenario/runner-call-scenario.host.js';
import { processHostRunnerBlock } from './blocks/runner-block.processor.js';
import { executeTrackedSpawn } from './process/runner-active-processes.js';
import type { PreparedRunContext } from './process/runner-process.spawner.js';
import {
  bindRunnerHostState,
  buildActiveProcessBag,
  buildLifecycleDeps,
  emitRunnerEvent,
  setRunnerBlockStatus,
} from './host/runner-host.bindings.js';
import type { ScenarioRunnerEventHandler, ScenarioRunnerOptions } from './scenario-runner.types.js';
import type { NestedChildRunner } from './call-scenario/runner-nested-child.factory.js';

export type { ScenarioRunnerEventHandler, ScenarioRunnerOptions };

/** Orchestrateur scénario (SVC-001 / R-25) + CallScenario nested (ADR-018). */
export class ScenarioRunnerService {
  private readonly scenario: Scenario;
  private readonly adapters: readonly CLIAdapter[];
  private readonly workspacePath: string;
  private readonly resourceStore: ResourceStoreService;
  private readonly nestingDepth: number;
  private readonly maxCallScenarioDepth: number;
  private readonly scheduler: GraphScheduler;
  private runnerStatus: RunnerStatus = 'idle';
  private readonly blockStatuses = new Map<string, BlockStatus>();
  private readonly eventListeners = new Map<string, Set<ScenarioRunnerEventHandler>>();
  private readonly policyInjectionState = new Map<string, boolean>();
  private readonly sessions = new ScenarioSessionRegistry();
  private readonly activeSpawnHandles = new Set<SpawnAgentHandle>();
  private readonly childRunners = new Set<NestedChildRunner>();
  private failure: unknown = null;
  private isStopped = false;

  constructor(options: ScenarioRunnerOptions) {
    this.scenario = options.scenario;
    this.adapters = options.adapters;
    this.workspacePath = options.workspacePath;
    this.resourceStore = options.resourceStore;
    this.nestingDepth = options.nestingDepth ?? 0;
    this.maxCallScenarioDepth = options.maxCallScenarioDepth ?? -1;
    this.scheduler = new GraphScheduler(this.scenario, {
      processBlock: (node) => this.processBlock(node),
      onBlockPaused: (nodeId) => this.setBlockStatus(nodeId, 'paused'),
      isHalted: () => this.isHalted(),
    });
    for (const node of this.scenario.nodes) {
      this.blockStatuses.set(node.id, 'idle');
    }
  }

  on(event: string, handler: ScenarioRunnerEventHandler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(handler);
  }
  off(event: string, handler: ScenarioRunnerEventHandler) {
    this.eventListeners.get(event)?.delete(handler);
  }
  getStatus() {
    return this.runnerStatus;
  }
  getScenarioId() {
    return this.scenario.id;
  }
  getBlockStatuses() {
    return new Map(this.blockStatuses);
  }
  async stop() {
    stopRunnerLifecycle(this.lifecycleDeps());
  }
  async run() {
    validateRunnerTopology(this.lifecycleDeps());
    this.runnerStatus = 'running';
    emitRunnerEvent(this.eventListeners, 'statusChanged', { status: this.runnerStatus });
    runnerLog.logScenarioStarted(this.scenario.id, this.scenario.nodes.length);
    const startMs = Date.now();
    const start = this.scenario.nodes.find((node) => node.type === 'start') as ScenarioNode;
    this.setBlockStatus(start.id, 'completed');
    const startMessage = buildBlockMessage('start', null, 1);
    this.scheduler.deliver(broadcastMessage(this.scheduler.outgoing(start.id), startMessage));
    await this.scheduler.drain();
    finalizeRunner(this.lifecycleDeps(), startMs);
  }

  private asHost() {
    return bindRunnerHostState({
      scenario: this.scenario,
      blockStatuses: this.blockStatuses,
      eventListeners: this.eventListeners,
      activeSpawnHandles: this.activeSpawnHandles,
      childRunners: this.childRunners,
      getFailure: () => this.failure,
      setFailure: (err: unknown) => {
        this.failure = err;
      },
      getStopped: () => this.isStopped,
      setStopped: (isStopped: boolean) => {
        this.isStopped = isStopped;
      },
      setRunnerStatus: (status: RunnerStatus) => {
        this.runnerStatus = status;
      },
      isHalted: () => this.isHalted(),
      captureSession: (agentId: string, sessionId: string) =>
        this.sessions.setSession(agentId, sessionId),
      setBlockStatus: (nodeId: string, status: BlockStatus, message?: string) =>
        this.setBlockStatus(nodeId, status, message),
    });
  }

  private processBag() {
    return buildActiveProcessBag(this.asHost());
  }
  private lifecycleDeps() {
    return buildLifecycleDeps(this.asHost(), () => this.processBag());
  }
  private isHalted() {
    return this.isStopped || this.failure !== null;
  }
  private executeSpawn(node: ScenarioNode, ctx: PreparedRunContext) {
    return executeTrackedSpawn(this.processBag(), node, ctx);
  }
  private async processBlock(node: ScenarioNode) {
    await processHostRunnerBlock(
      {
        scenarioId: this.scenario.id,
        resourceStore: this.resourceStore,
        adapters: this.adapters,
        workspacePath: this.workspacePath,
        policyInjectionState: this.policyInjectionState,
        sessions: this.sessions,
        inputBag: (nodeId) => this.scheduler.inputBag(nodeId),
        outgoing: (nodeId) => this.scheduler.outgoing(nodeId),
        isHalted: () => this.isHalted(),
        runCallScenario: (targetId) => this.runCallScenario(targetId),
        processBag: () => this.processBag(),
        executeSpawn: (runNode, ctx) => this.executeSpawn(runNode, ctx),
        setBlockStatus: (nodeId, status, message) => this.setBlockStatus(nodeId, status, message),
        deliver: (emissions) => this.scheduler.deliver(emissions),
      },
      node,
    );
  }

  private async runCallScenario(targetScenarioId: string) {
    await runCallScenarioFromHost(
      {
        nestingDepth: this.nestingDepth,
        maxCallScenarioDepth: this.maxCallScenarioDepth,
        adapters: this.adapters,
        workspacePath: this.workspacePath,
        resourceStore: this.resourceStore,
        eventListeners: this.eventListeners,
        childRunners: this.childRunners,
        isHalted: () => this.isHalted(),
        spawnChildRunner: (scenario, nextDepth) =>
          new ScenarioRunnerService({
            scenario,
            adapters: this.adapters,
            workspacePath: this.workspacePath,
            resourceStore: this.resourceStore,
            nestingDepth: nextDepth,
            maxCallScenarioDepth: this.maxCallScenarioDepth,
          }),
      },
      targetScenarioId,
    );
  }

  private setBlockStatus(nodeId: string, status: BlockStatus, message?: string) {
    setRunnerBlockStatus({
      blockStatuses: this.blockStatuses,
      listeners: this.eventListeners,
      nodeId,
      status,
      message,
    });
  }
}
