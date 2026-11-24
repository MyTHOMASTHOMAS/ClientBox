import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { BlockStatus, RunnerStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { STOP_GRACE_MS } from '../../../src/lib/process/child-process.spawner.js';
import { flushPromises } from '../../helpers/flush-promises.js';

/**
 * CASE-ENG-04-4 — cycle de vie SVC-001 : validateGraph, Start→Run, stop().
 * Fan-out / bifurcation If → CASE-ENG-04-8.
 */
describe('CASE-ENG-04-4 — Orchestration complète du graphe par ScenarioRunnerService (SPEC-ENG-01..04 / SVC-001)', () => {
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
      getExitCondition: vi.fn().mockResolvedValue({
        id: 'ex-1',
        name: 'Exit',
        content: 'Conclus par TERMINER.',
      }),
    };
  }

  it('test_CASE_ENG_04_4_scenario_runner_service_full_lifecycle_orchestration', async () => {
    const adapter = createAdapter();

    // 1. Refus graphe sans Start
    const invalidRunner = new ScenarioRunnerService({
      scenario: {
        id: 'sc-invalid',
        name: 'Sans Start',
        nodes: [{ id: 'run-1', type: 'run', position: { x: 0, y: 0 }, agentId: 'ag-1', promptId: 'pr-1' }],
        connections: [],
      },
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-4-invalid',
      resourceStore: createStore() as never,
    });
    await expect(invalidRunner.run()).rejects.toThrow(/Start|invalide|unique/i);

    // 2. Nominal Start → Run via connexions
    const linearScenario: Scenario = {
      id: 'sc-valid',
      name: 'Start puis Run',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-1',
          type: 'run',
          position: { x: 120, y: 0 },
          agentId: 'ag-1',
          promptId: 'pr-1',
          exitId: 'ex-1',
        },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-1',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };

    const linearRunner = new ScenarioRunnerService({
      scenario: linearScenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-4-linear',
      resourceStore: createStore() as never,
    });

    const statuses: Array<{ nodeId: string; status: BlockStatus }> = [];
    const runnerStatuses: RunnerStatus[] = [];
    linearRunner.on('blockStatusChanged', (payload: unknown) => {
      statuses.push(payload as { nodeId: string; status: BlockStatus });
    });
    linearRunner.on('statusChanged', (payload: unknown) => {
      const event = payload as { status: RunnerStatus };
      runnerStatuses.push(event.status);
    });

    const spawned: string[] = [];
    vi.spyOn(linearRunner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      spawned.push(node.id);
    });

    await linearRunner.run();
    await flushPromises();

    expect(spawned).toEqual(['run-1']);
    expect(statuses.some((s) => s.nodeId === 'start-1' && s.status === 'completed')).toBe(true);
    expect(statuses.some((s) => s.nodeId === 'run-1' && s.status === 'completed')).toBe(true);
    expect(runnerStatuses).toContain('running');
    expect(linearRunner.getStatus()).toBe('completed');

    // 3. stop() pendant un spawn actif → processus interrompu (escalade 3000 ms : CASE-ENG-04-6), statut stopped
    const stopScenario: Scenario = {
      id: 'sc-stop',
      name: 'Stop en cours',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-slow',
          type: 'run',
          position: { x: 100, y: 0 },
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

    const stopRunner = new ScenarioRunnerService({
      scenario: stopScenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-4-stop',
      resourceStore: createStore() as never,
    });

    const handleStop = vi.fn();
    let releaseSpawn: () => void = () => undefined;
    const spawnGate = new Promise<void>((resolve) => {
      releaseSpawn = resolve;
    });

    const slowSpawned: string[] = [];
    vi.spyOn(stopRunner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      slowSpawned.push((args[0] as { id: string }).id);
      (stopRunner as unknown as { activeSpawnHandles: Set<{ stop: () => void }> }).activeSpawnHandles.add({
        stop: handleStop,
      });
      await spawnGate;
      return 'sortie partielle';
    });

    const runPromise = stopRunner.run();
    await flushPromises();
    await stopRunner.stop();
    releaseSpawn();
    await runPromise;
    await flushPromises();

    expect(slowSpawned).toEqual(['run-slow']);
    expect(handleStop).toHaveBeenCalled();
    expect(stopRunner.getStatus()).toBe('stopped');
    expect(STOP_GRACE_MS).toBe(3000);
  });
});
