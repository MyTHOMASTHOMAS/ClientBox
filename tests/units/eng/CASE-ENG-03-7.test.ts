import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import * as activeProcesses from '../../../src/services/runner/process/runner-active-processes.js';
import * as blockMessageFactory from '../../../src/domain/messages/block-message.factory.js';
import { resolveCallScenarioMaxDepth } from '../../../src/lib/process/env/index.js';
import {
  SessionRecordingAdapter,
  chain,
  createSessionStore,
  link,
  promptOf,
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

function installSpawnRecorder(
  _adapter: SessionRecordingAdapter,
  failNodeIds: Set<string> = new Set(),
) {
  return vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(
    async (_bag, node) => {
      if (failNodeIds.has(node.id)) {
        throw new Error(`exit 1 ${node.id}`);
      }
      return `out:${node.id}`;
    },
  );
}

function createRunner(
  scenario: Scenario,
  adapter: SessionRecordingAdapter,
  resourceStore: ReturnType<typeof createSessionStore> & {
    getScenario: (id: string) => Promise<Scenario>;
  },
) {
  const runner = new ScenarioRunnerService({
    scenario,
    adapters: [adapter],
    workspacePath: '/tmp/eng-03-7',
    resourceStore: resourceStore as never,
    maxCallScenarioDepth: resolveCallScenarioMaxDepth(),
  });
  const statuses = new Map<string, BlockStatus>();
  runner.on('blockStatusChanged', (payload: unknown) => {
    const event = payload as { nodeId: string; status: BlockStatus };
    statuses.set(event.nodeId, event.status);
  });
  return { runner, statuses };
}

/**
 * CASE-ENG-03-7 — CallScenario : await, émission power 1, self-call OK, borne env.
 */
describe('CASE-ENG-03-7 — CallScenario await + émission power 1 (SPEC-ENG-03 / AC-ENG-03-5)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.CALL_SCENARIO_MAX_DEPTH;
  });

  it('test_CASE_ENG_03_7_call_scenario_await_emit_power_and_depth_limit', async () => {
    const buildSpy = vi.spyOn(blockMessageFactory, 'buildBlockMessage');
    const adapter = new SessionRecordingAdapter();
    installSpawnRecorder(adapter);

    const child: Scenario = {
      id: 'enfant',
      name: 'Enfant',
      nodes: [startNode(), runNode('run-child', 'agent-dev')],
      connections: [link('start-1', 'run-child')],
    };
    const parent: Scenario = {
      id: 'parent',
      name: 'Parent',
      nodes: [
        startNode(),
        callScenarioNode('call-1', 'enfant'),
        runNode('run-after', 'agent-dev'),
      ],
      connections: chain('start-1', 'call-1', 'run-after'),
    };
    const store = {
      ...createSessionStore(),
      getScenario: vi.fn(async (id: string) => {
        if (id === 'enfant') return child;
        throw new Error(`Scénario introuvable : ${id}`);
      }),
    };
    const { runner, statuses } = createRunner(parent, adapter, store);
    await runner.run();

    const childIdx = adapter.runs.findIndex((r) => r.prompt === promptOf('run-child'));
    const afterIdx = adapter.runs.findIndex((r) => r.prompt === promptOf('run-after'));
    expect(childIdx).toBeGreaterThanOrEqual(0);
    expect(afterIdx).toBeGreaterThan(childIdx);

    expect(statuses.get('call-1')).toBe('completed');
    expect(statuses.get('run-after')).toBe('completed');
    expect(runner.getStatus()).toBe('completed');
    expect(runner.getScenarioId()).toBe('parent');
    expect(buildSpy).toHaveBeenCalledWith('callScenario', null, 1);

    // Auto-appel autorisé : cible = id courant ; enfant stub sans re-appel
    const selfAdapter = new SessionRecordingAdapter();
    installSpawnRecorder(selfAdapter);
    const selfLeaf: Scenario = {
      id: 'parent',
      name: 'Self leaf',
      nodes: [startNode(), runNode('run-self-leaf', 'agent-dev')],
      connections: [link('start-1', 'run-self-leaf')],
    };
    const selfScenario: Scenario = {
      id: 'parent',
      name: 'Self',
      nodes: [startNode(), callScenarioNode('call-self', 'parent')],
      connections: [link('start-1', 'call-self')],
    };
    const selfStore = {
      ...createSessionStore(),
      getScenario: vi.fn(async () => selfLeaf),
    };
    const self = createRunner(selfScenario, selfAdapter, selfStore);
    await self.runner.run();
    expect(self.statuses.get('call-self')).toBe('completed');
    expect(self.runner.getStatus()).toBe('completed');
    expect(selfAdapter.runs.some((r) => r.prompt === promptOf('run-self-leaf'))).toBe(true);

    // Échec enfant → halt racine
    const failAdapter = new SessionRecordingAdapter();
    installSpawnRecorder(failAdapter, new Set(['run-fail']));
    const failChild: Scenario = {
      id: 'enfant-fail',
      name: 'Enfant fail',
      nodes: [startNode(), runNode('run-fail', 'agent-dev')],
      connections: [link('start-1', 'run-fail')],
    };
    const failParent: Scenario = {
      id: 'parent-fail',
      name: 'Parent fail',
      nodes: [startNode(), callScenarioNode('call-fail', 'enfant-fail')],
      connections: [link('start-1', 'call-fail')],
    };
    const failStore = {
      ...createSessionStore(),
      getScenario: vi.fn(async (id: string) => {
        if (id === 'enfant-fail') return failChild;
        throw new Error(`Scénario introuvable : ${id}`);
      }),
    };
    const failing = createRunner(failParent, failAdapter, failStore);
    await failing.runner.run().catch(() => undefined);
    expect(failing.statuses.get('call-fail')).toBe('error');
    expect(failing.runner.getStatus()).toBe('error');

    // Dépassement CALL_SCENARIO_MAX_DEPTH=2 (chaîne profondeur 3)
    process.env.CALL_SCENARIO_MAX_DEPTH = '2';
    const depthAdapter = new SessionRecordingAdapter();
    installSpawnRecorder(depthAdapter);
    const depthStoreScenarios = new Map<string, Scenario>();
    for (let i = 0; i <= 3; i += 1) {
      const id = `d${i}`;
      const next = `d${i + 1}`;
      depthStoreScenarios.set(id, {
        id,
        name: id,
        nodes: [
          startNode(),
          i < 3
            ? callScenarioNode(`call-${i}`, next)
            : runNode(`run-leaf`, 'agent-dev'),
        ],
        connections: [link('start-1', i < 3 ? `call-${i}` : 'run-leaf')],
      });
    }
    const depthStore = {
      ...createSessionStore(),
      getScenario: vi.fn(async (id: string) => {
        const sc = depthStoreScenarios.get(id);
        if (!sc) throw new Error(`Scénario introuvable : ${id}`);
        return sc;
      }),
    };
    const depth = createRunner(depthStoreScenarios.get('d0')!, depthAdapter, depthStore);
    await depth.runner.run().catch(() => undefined);
    expect(depth.runner.getStatus()).toBe('error');
  });
});
