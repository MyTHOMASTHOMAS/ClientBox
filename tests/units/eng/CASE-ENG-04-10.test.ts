import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';

describe('CASE-ENG-04-10 — Stop reset statuts blocs running/paused → idle (SPEC-ENG-04)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createAdapter(): CLIAdapter {
    return {
      cliId: 'cursor-cli',
      buildCommand: vi.fn().mockReturnValue({ command: 'mock', args: ['run'], cwd: '/tmp' }),
      parseStreamLine: vi.fn().mockReturnValue({ type: 'stdout', chunk: 'done' }),
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
        content: `content-${id}`,
      })),
      getExitCondition: vi.fn().mockResolvedValue(null),
    };
  }

  it('test_CASE_ENG_04_10_stop_resets_running_and_paused_block_statuses_to_idle', async () => {
    const scenario: Scenario = {
      id: 'sc-stop-block-status',
      name: 'Stop reset badges',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-slow',
          type: 'run',
          position: { x: 100, y: 0 },
          agentId: 'ag-1',
          promptId: 'pr-1',
        },
        {
          id: 'run-paused',
          type: 'run',
          position: { x: 200, y: 0 },
          agentId: 'ag-1',
          promptId: 'pr-1',
        },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-slow',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };

    const runner = new ScenarioRunnerService({
      scenario,
      adapters: [createAdapter()],
      workspacePath: '/tmp/eng-04-10',
      resourceStore: createStore() as never,
    });

    const blockEvents: Array<{ nodeId: string; status: BlockStatus }> = [];
    runner.on('blockStatusChanged', (payload: unknown) => {
      blockEvents.push(payload as { nodeId: string; status: BlockStatus });
    });

    let releaseSpawn: () => void = () => undefined;
    const spawnGate = new Promise<void>((resolve) => {
      releaseSpawn = resolve;
    });

    vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async () => {
      (runner as unknown as { activeSpawnHandles: Set<{ stop: () => void }> }).activeSpawnHandles.add({
        stop: vi.fn(),
      });
      await spawnGate;
      return 'partiel';
    });

    const runPromise = runner.run();
    await flushPromises();

    // start-1 completed ; run-slow running (via processBlock) ; forcer run-paused en pause
    expect(runner.getBlockStatuses().get('start-1')).toBe('completed');
    expect(runner.getBlockStatuses().get('run-slow')).toBe('running');
    (runner as any).setBlockStatus('run-paused', 'paused');

    await runner.stop();
    releaseSpawn();
    await runPromise.catch(() => undefined);
    await flushPromises();

    expect(runner.getStatus()).toBe('stopped');

    const statuses = [...runner.getBlockStatuses().values()];
    expect(statuses.some((s) => s === 'running' || s === 'paused')).toBe(false);
    expect(runner.getBlockStatuses().get('run-slow')).toBe('idle');
    expect(runner.getBlockStatuses().get('run-paused')).toBe('idle');
    expect(runner.getBlockStatuses().get('start-1')).toBe('completed');

    expect(
      blockEvents.some((event) => event.nodeId === 'run-slow' && event.status === 'idle'),
    ).toBe(true);
    expect(
      blockEvents.some((event) => event.nodeId === 'run-paused' && event.status === 'idle'),
    ).toBe(true);
  });
});
