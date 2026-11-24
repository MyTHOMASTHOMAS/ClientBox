import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import * as blockMessageFactory from '../../../src/domain/messages/block-message.factory.js';
import * as activeProcesses from '../../../src/services/runner/process/runner-active-processes.js';
import {
  SessionRecordingAdapter,
  chain,
  createSessionStore,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

function commandNode(id: string, commandLine: string): ScenarioNode {
  return {
    id,
    type: 'command' as any,
    position: { x: 0, y: 0 },
    commandLine,
  } as ScenarioNode;
}

function createRunner(scenario: Scenario, workspacePath = '/tmp/eng-03-9') {
  const adapter = new SessionRecordingAdapter();
  const store = createSessionStore();
  const runner = new ScenarioRunnerService({
    scenario,
    adapters: [adapter],
    workspacePath,
    resourceStore: store as never,
  });
  const statuses = new Map<string, BlockStatus>();
  const chunks: Array<{ nodeId: string; chunk: string; stream: string }> = [];

  runner.on('blockStatusChanged', (payload: unknown) => {
    const event = payload as { nodeId: string; status: BlockStatus };
    statuses.set(event.nodeId, event.status);
  });

  runner.on('chunkReceived', (payload: unknown) => {
    chunks.push(payload as { nodeId: string; chunk: string; stream: string });
  });

  return { runner, statuses, chunks, adapter };
}

describe('CASE-ENG-03-9 — Command block shell execution and power 1 (SPEC-ENG-03 / AC-ENG-03-7)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_03_9_command_block_shell_execution_await_exit_and_power', async () => {
    vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(async (_bag, node) => {
      return `out:${node.id}`;
    });
    const buildSpy = vi.spyOn(blockMessageFactory, 'buildBlockMessage');

    // 1. Exécution nominale : await exit 0, émission power 1 / value null
    const nominalScenario: Scenario = {
      id: 'sc-cmd-nominal',
      name: 'Command Nominal',
      nodes: [
        startNode(),
        commandNode('cmd-1', 'node -e "console.log(\'hello stdout\'); process.exit(0)"'),
        runNode('run-after', 'agent-dev'),
      ],
      connections: chain('start-1', 'cmd-1', 'run-after'),
    };

    const { runner, statuses, chunks } = createRunner(nominalScenario);
    await runner.run();

    expect(statuses.get('cmd-1')).toBe('completed');
    expect(statuses.get('run-after')).toBe('completed');
    expect(runner.getStatus()).toBe('completed');

    expect(buildSpy).toHaveBeenCalledWith('command', null, 1);
    expect(chunks.some((c) => c.nodeId === 'cmd-1' && c.chunk.includes('hello stdout'))).toBe(true);

    // 2. Échec sur code de sortie non nul (exit 1) => arrêt global racine (R-25)
    const failScenario: Scenario = {
      id: 'sc-cmd-fail',
      name: 'Command Fail',
      nodes: [
        startNode(),
        commandNode('cmd-fail', 'node -e "process.exit(1)"'),
        runNode('run-unreached', 'agent-dev'),
      ],
      connections: chain('start-1', 'cmd-fail', 'run-unreached'),
    };

    const { runner: failRunner, statuses: failStatuses } = createRunner(failScenario);
    await expect(failRunner.run()).rejects.toThrow();

    expect(failStatuses.get('cmd-fail')).toBe('error');
    expect(failStatuses.get('run-unreached')).toBeUndefined();
    expect(failRunner.getStatus()).toBe('error');

    // 3. Échec sur commande inexistante / introuvable => arrêt global (REQ-043)
    const invalidScenario: Scenario = {
      id: 'sc-cmd-invalid',
      name: 'Command Invalid',
      nodes: [
        startNode(),
        commandNode('cmd-invalid', 'non_existent_binary_xyz_12345'),
      ],
      connections: chain('start-1', 'cmd-invalid'),
    };

    const { runner: invalidRunner, statuses: invalidStatuses } = createRunner(invalidScenario);
    await expect(invalidRunner.run()).rejects.toThrow();
    expect(invalidStatuses.get('cmd-invalid')).toBe('error');
    expect(invalidRunner.getStatus()).toBe('error');
  });
});
