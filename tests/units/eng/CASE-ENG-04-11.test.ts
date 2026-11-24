import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import * as activeProcesses from '../../../src/services/runner/process/runner-active-processes.js';
import {
  SessionRecordingAdapter,
  createSessionStore,
  link,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

function callScenarioNode(id: string, targetScenarioId: string): ScenarioNode {
  return {
    id,
    type: 'callScenario',
    position: { x: 0, y: 0 },
    targetScenarioId,
  } as ScenarioNode;
}

/**
 * CASE-ENG-04-11 — halt récursif CallScenario (spawns + Stop).
 */
describe('CASE-ENG-04-11 — CallScenario halt récursif spawns / Stop (SPEC-ENG-04 / AC-ENG-04-3)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_04_11_call_scenario_child_failure_and_stop_halt_root', async () => {
    const adapter = new SessionRecordingAdapter();
    const child: Scenario = {
      id: 'enfant',
      name: 'Enfant',
      nodes: [startNode(), runNode('run-child', 'agent-dev')],
      connections: [link('start-1', 'run-child')],
    };
    const parent: Scenario = {
      id: 'parent',
      name: 'Parent parallèle',
      nodes: [
        startNode(),
        callScenarioNode('call-1', 'enfant'),
        runNode('run-B', 'agent-dev'),
      ],
      connections: [link('start-1', 'call-1'), link('start-1', 'run-B')],
    };
    const store = {
      ...createSessionStore(),
      getScenario: vi.fn(async (id: string) => {
        if (id === 'enfant') return child;
        throw new Error(`Scénario introuvable : ${id}`);
      }),
    };

    const runner = new ScenarioRunnerService({
      scenario: parent,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-11',
      resourceStore: store as never,
    });
    const statuses = new Map<string, BlockStatus>();
    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: BlockStatus };
      statuses.set(event.nodeId, event.status);
    });

    const stoppedHandles: Array<ReturnType<typeof vi.fn>> = [];
    let releaseRunB: (() => void) | undefined;
    const runBGate = new Promise<void>((resolve) => {
      releaseRunB = resolve;
    });

    vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(
      async (bag, node) => {
        if (node.id === 'run-child') {
          throw new Error('exit 1 enfant');
        }
        const stop = vi.fn(() => {
          releaseRunB?.();
        });
        stoppedHandles.push(stop);
        bag.activeSpawnHandles.add({ stop } as never);
        await runBGate;
        return '';
      },
    );

    const runPromise = runner.run().catch(() => undefined);
    await Promise.race([runPromise, new Promise((r) => setTimeout(r, 200))]);
    expect(statuses.get('call-1')).toBe('error');
    expect(runner.getStatus()).toBe('error');
    expect(stoppedHandles.some((s) => s.mock.calls.length > 0)).toBe(true);
    releaseRunB?.();
    await runPromise;

    // Stop manuel pendant CallScenario
    const stopAdapter = new SessionRecordingAdapter();
    const slowChild: Scenario = {
      id: 'enfant-slow',
      name: 'Enfant slow',
      nodes: [startNode(), runNode('run-slow', 'agent-dev')],
      connections: [link('start-1', 'run-slow')],
    };
    const stopParent: Scenario = {
      id: 'parent-stop',
      name: 'Parent stop',
      nodes: [startNode(), callScenarioNode('call-stop', 'enfant-slow')],
      connections: [link('start-1', 'call-stop')],
    };
    const stopStore = {
      ...createSessionStore(),
      getScenario: vi.fn(async (id: string) => {
        if (id === 'enfant-slow') return slowChild;
        throw new Error(`Scénario introuvable : ${id}`);
      }),
    };
    const stopRunner = new ScenarioRunnerService({
      scenario: stopParent,
      adapters: [stopAdapter],
      workspacePath: '/tmp/eng-04-11-stop',
      resourceStore: stopStore as never,
    });
    const childStops: Array<ReturnType<typeof vi.fn>> = [];
    let releaseSlow: (() => void) | undefined;
    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(async (bag) => {
      const stop = vi.fn(() => {
        releaseSlow?.();
      });
      childStops.push(stop);
      bag.activeSpawnHandles.add({ stop } as never);
      await slowGate;
      return '';
    });

    const stopRunPromise = stopRunner.run().catch(() => undefined);
    await new Promise((r) => setTimeout(r, 30));
    await stopRunner.stop();
    releaseSlow?.();
    await stopRunPromise;

    expect(childStops.length).toBeGreaterThanOrEqual(1);
    expect(childStops.some((s) => s.mock.calls.length > 0)).toBe(true);
  });
});
