import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
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

type ChunkPayload = {
  readonly nodeId?: string;
  readonly chunk?: string;
  readonly stream?: string;
  readonly nestedScenarioId?: string;
};

/**
 * CASE-ENG-03-8 — CallScenario : relay chunks CLI enfant → parent.
 */
describe('CASE-ENG-03-8 — CallScenario chunks enfant relayés au parent (SPEC-ENG-03 / AC-ENG-03-6)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_03_8_call_scenario_child_chunks_relayed_to_parent', async () => {
    const adapter = new SessionRecordingAdapter();
    const child: Scenario = {
      id: 'enfant',
      name: 'Enfant',
      nodes: [startNode(), runNode('run-child', 'agent-dev')],
      connections: [link('start-1', 'run-child')],
    };
    const parent: Scenario = {
      id: 'parent',
      name: 'Parent',
      nodes: [startNode(), callScenarioNode('call-1', 'enfant')],
      connections: [link('start-1', 'call-1')],
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
      workspacePath: '/tmp/eng-03-8',
      resourceStore: store as never,
    });

    const chunks: ChunkPayload[] = [];
    runner.on('chunkReceived', (payload: unknown) => {
      chunks.push(payload as ChunkPayload);
    });

    const parentBlockStatuses: string[] = [];
    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: string };
      parentBlockStatuses.push(`${event.nodeId}:${event.status}`);
    });

    vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(async (bag, node) => {
      if (node.id === 'run-child') {
        bag.emitChunk('run-child', 'hello-enfant', 'stdout', { type: 'text' });
        return 'out:run-child';
      }
      return `out:${node.id}`;
    });

    await runner.run();

    const childChunk = chunks.find((c) => c.chunk === 'hello-enfant');
    expect(childChunk).toBeTruthy();
    expect(childChunk?.nestedScenarioId).toBe('enfant');
    expect(childChunk?.stream).toBe('stdout');

    // Pas de pastille appliquée pour un nœud qui n'existe que chez l'enfant
    expect(parentBlockStatuses.some((s) => s.startsWith('run-child:'))).toBe(false);
    expect(runner.getStatus()).toBe('completed');
  });
});
