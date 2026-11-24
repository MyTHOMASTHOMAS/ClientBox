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

function commandNode(id: string, commandLine: string): ScenarioNode {
  return {
    id,
    type: 'command' as any,
    position: { x: 0, y: 0 },
    commandLine,
  } as ScenarioNode;
}

describe('CASE-ENG-04-12 — Command active process tracking and stop kill (SPEC-ENG-04 / AC-ENG-04-3)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_04_12_command_block_active_process_tracking_and_stop_kill', async () => {
    const adapter = new SessionRecordingAdapter();
    const store = createSessionStore();
    const stopSpy = vi.spyOn(activeProcesses, 'stopAllActiveProcesses');

    // 1. Stop manuel pendant l'exécution d'un bloc Command
    // La commande lance un process shell qui tourne
    const longScenario: Scenario = {
      id: 'sc-cmd-stop',
      name: 'Command Stop',
      nodes: [
        startNode(),
        commandNode('cmd-long', 'node -e "setInterval(() => {}, 1000)"'),
      ],
      connections: [link('start-1', 'cmd-long')],
    };

    const runner = new ScenarioRunnerService({
      scenario: longScenario,
      adapters: [adapter],
      workspacePath: process.cwd(),
      resourceStore: store as never,
    });

    const statuses = new Map<string, BlockStatus>();
    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: BlockStatus };
      statuses.set(event.nodeId, event.status);
    });

    const runPromise = runner.run().catch(() => undefined);
    await new Promise((r) => setTimeout(r, 60));

    // Déclencher le Stop pendant que la commande est censée tourner
    await runner.stop();
    await runPromise;

    // Le statut du bloc ne doit pas être 'completed' et le statut du scénario doit être 'stopped'
    expect(statuses.get('cmd-long')).not.toBe('completed');
    expect(runner.getStatus()).toBe('stopped');
    expect(stopSpy).toHaveBeenCalled();

    // 2. Échec d'une branche concurrente tue le processus Command en cours
    vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(async () => {
      throw new Error('Échec immédiat branche concurrente');
    });

    const parallelScenario: Scenario = {
      id: 'sc-cmd-parallel-fail',
      name: 'Command Parallel Fail',
      nodes: [
        startNode(),
        commandNode('cmd-parallel', 'node -e "setInterval(() => {}, 1000)"'),
        runNode('run-failing', 'agent-dev'),
      ],
      connections: [
        link('start-1', 'cmd-parallel'),
        link('start-1', 'run-failing'),
      ],
    };

    const parallelRunner = new ScenarioRunnerService({
      scenario: parallelScenario,
      adapters: [adapter],
      workspacePath: process.cwd(),
      resourceStore: store as never,
    });

    await expect(parallelRunner.run()).rejects.toThrow();
    expect(parallelRunner.getStatus()).toBe('error');
    expect(stopSpy).toHaveBeenCalled();
  });
});
