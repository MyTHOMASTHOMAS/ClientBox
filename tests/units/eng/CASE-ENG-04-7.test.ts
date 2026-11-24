import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';

/**
 * CASE-ENG-04-7 — l'ordre d'exécution suit les connexions, pas l'ordre de `nodes[]`.
 * Un runner qui fait `for (const node of scenario.nodes)` doit faire échouer ce test.
 */
describe('CASE-ENG-04-7 — Ordre d’exécution = connexions, indépendant de nodes[] (SPEC-ENG-01/03/04 / SVC-001)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createAdapter(): CLIAdapter {
    return {
      cliId: 'cursor-cli',
      buildCommand: vi.fn().mockReturnValue({ command: 'mock', args: [], cwd: '/tmp' }),
      parseStreamLine: vi.fn().mockReturnValue({ type: 'stdout', chunk: 'ok' }),
    };
  }

  function createStore() {
    return {
      getAgent: vi.fn().mockImplementation(async (id: string) => ({
        id,
        name: id,
        profilId: 'p-1',
        cliId: 'cursor-cli',
      })),
      getProfil: vi.fn().mockResolvedValue({
        id: 'p-1',
        name: 'Profil',
        systemPrompt: 'sys',
        policy: 'chaque_prompt',
      }),
      getPrompt: vi.fn().mockImplementation(async (id: string) => ({
        id,
        name: id,
        content: `prompt-${id}`,
      })),
      getExitCondition: vi.fn().mockResolvedValue(null),
    };
  }

  async function runAndCaptureOrder(scenario: Scenario): Promise<string[]> {
    const adapter = createAdapter();
    const runner = new ScenarioRunnerService({
      scenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-7',
      resourceStore: createStore() as never,
    });

    const executionOrder: string[] = [];

    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: BlockStatus };
      // Start : activation = completed ; Run : première transition running
      if (event.nodeId === 'start-1' && event.status === 'completed' && !executionOrder.includes('start-1')) {
        executionOrder.push('start-1');
      }
      if (
        (event.nodeId === 'run-a' || event.nodeId === 'run-b') &&
        event.status === 'running' &&
        !executionOrder.includes(event.nodeId)
      ) {
        executionOrder.push(event.nodeId);
      }
    });

    // Filet de sécurité : un runner graphe correct spawn RunA puis RunB dans cet ordre
    vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      if (!executionOrder.includes(node.id)) {
        executionOrder.push(node.id);
      }
    });

    await runner.run();
    await flushPromises();
    return executionOrder;
  }

  it('test_CASE_ENG_04_7_runner_execution_order_follows_connections_not_nodes_array', async () => {
    // Graphe logique : Start → RunA → RunB
    // Piège : nodes[] volontairement inversé [RunB, RunA, Start]
    const scrambledNodesScenario: Scenario = {
      id: 'sc-order-scrambled',
      name: 'Ordre nodes inversé',
      nodes: [
        {
          id: 'run-b',
          type: 'run',
          position: { x: 280, y: 0 },
          agentId: 'ag-b',
          promptId: 'pr-b',
        },
        {
          id: 'run-a',
          type: 'run',
          position: { x: 140, y: 0 },
          agentId: 'ag-a',
          promptId: 'pr-a',
        },
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-a',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'run-a',
          sourcePortIndex: 0,
          targetNodeId: 'run-b',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };

    const orderScrambled = await runAndCaptureOrder(scrambledNodesScenario);
    expect(orderScrambled).toEqual(['start-1', 'run-a', 'run-b']);

    // Second désordre : [RunA, Start, RunB] — même ordre d'exécution attendu
    const alternateScramble: Scenario = {
      id: 'sc-order-alt',
      name: 'Autre désordre nodes',
      nodes: [
        {
          id: 'run-a',
          type: 'run',
          position: { x: 140, y: 0 },
          agentId: 'ag-a',
          promptId: 'pr-a',
        },
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-b',
          type: 'run',
          position: { x: 280, y: 0 },
          agentId: 'ag-b',
          promptId: 'pr-b',
        },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-a',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'run-a',
          sourcePortIndex: 0,
          targetNodeId: 'run-b',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };

    const orderAlt = await runAndCaptureOrder(alternateScramble);
    expect(orderAlt).toEqual(['start-1', 'run-a', 'run-b']);
  });
});
