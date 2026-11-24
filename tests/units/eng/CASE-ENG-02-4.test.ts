import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';

/**
 * CASE-ENG-02-4 — le scheduler SVC-001 doit suspendre l'exécution d'un bloc
 * dont le join est `waiting` ou `pause`. Cible : ScenarioRunnerService (pas evaluateJoin seul).
 */
describe('CASE-ENG-02-4 — Suspension d’avancement du scheduler sur Join waiting/pause (SPEC-ENG-02 / SPEC-ENG-04 / SVC-001)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createAdapter(cliId = 'cursor-cli'): CLIAdapter {
    return {
      cliId,
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
      resolveIfScriptPath: vi.fn(),
    };
  }

  function trackBlockStatuses(runner: ScenarioRunnerService) {
    const statuses = new Map<string, BlockStatus>();
    const order: string[] = [];
    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: BlockStatus };
      statuses.set(event.nodeId, event.status);
      if (event.status === 'running' || event.status === 'completed') {
        order.push(`${event.nodeId}:${event.status}`);
      }
    });
    return { statuses, order };
  }

  it('test_CASE_ENG_02_4_scheduler_join_waiting_pause_suspension', async () => {
    const adapter = createAdapter();
    const store = createStore();

    // --- Partie Waiting : RunJoin a 2 entrées, une seule message arrive ---
    // Start → RunA → RunJoin[key=0]
    // RunOrphan (N=0) → RunJoin[key=1]  → jamais exécuté → join waiting
    const waitingScenario: Scenario = {
      id: 'sc-join-waiting',
      name: 'Join waiting',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-a',
          type: 'run',
          position: { x: 100, y: 0 },
          agentId: 'ag-a',
          promptId: 'pr-a',
        },
        {
          id: 'run-orphan',
          type: 'run',
          position: { x: 100, y: 100 },
          agentId: 'ag-a',
          promptId: 'pr-orphan',
        },
        {
          id: 'run-join',
          type: 'run',
          position: { x: 220, y: 0 },
          agentId: 'ag-join',
          promptId: 'pr-join',
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
          targetNodeId: 'run-join',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'run-orphan',
          sourcePortIndex: 0,
          targetNodeId: 'run-join',
          targetPortIndex: 1,
          key: '1',
        },
      ],
    };

    const waitingRunner = new ScenarioRunnerService({
      scenario: waitingScenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-02-4-waiting',
      resourceStore: store as never,
    });

    const spawnedNodeIds: string[] = [];
    vi.spyOn(waitingRunner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      spawnedNodeIds.push(node.id);
    });

    const waitingTrack = trackBlockStatuses(waitingRunner);
    await waitingRunner.run();
    await flushPromises();

    expect(spawnedNodeIds).toContain('run-a');
    expect(spawnedNodeIds).not.toContain('run-join');
    expect(spawnedNodeIds).not.toContain('run-orphan');
    expect(waitingTrack.statuses.get('run-join')).toBe('paused');
    expect(waitingTrack.order.some((e) => e.startsWith('run-join:'))).toBe(false);

    // --- Partie Pause : If true alimente RunJoin avec power 1 et power 0 ---
    // Start → RunFeed → If(true) ─port0(power1)→ RunJoin key0
    //                              ─port1(power0)→ RunJoin key1
    // sum(power)=1 < N=2 → pause → pas d'exécution de RunJoin
    const fs = await import('node:fs/promises');
    const os = await import('node:os');
    const path = await import('node:path');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-02-4-if-'));
    const ifScriptPath = path.join(tmpDir, 'toujours-vrai.js');
    await fs.writeFile(
      ifScriptPath,
      'module.exports = function toujoursVrai() { return true; };\n',
      'utf8',
    );

    const pauseStore = {
      ...createStore(),
      resolveIfScriptPath: vi.fn().mockReturnValue(ifScriptPath),
    };

    const pauseScenario: Scenario = {
      id: 'sc-join-pause',
      name: 'Join pause via If',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-feed',
          type: 'run',
          position: { x: 100, y: 0 },
          agentId: 'ag-feed',
          promptId: 'pr-feed',
        },
        {
          id: 'if-1',
          type: 'if',
          position: { x: 220, y: 0 },
          ifScriptId: 'toujours-vrai',
        },
        {
          id: 'run-join',
          type: 'run',
          position: { x: 360, y: 0 },
          agentId: 'ag-join',
          promptId: 'pr-join',
        },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-feed',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'run-feed',
          sourcePortIndex: 0,
          targetNodeId: 'if-1',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'if-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-join',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'if-1',
          sourcePortIndex: 1,
          targetNodeId: 'run-join',
          targetPortIndex: 1,
          key: '1',
        },
      ],
    };

    const pauseRunner = new ScenarioRunnerService({
      scenario: pauseScenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-02-4-pause',
      resourceStore: pauseStore as never,
    });

    const pauseSpawned: string[] = [];
    vi.spyOn(pauseRunner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      pauseSpawned.push(node.id);
    });

    const pauseTrack = trackBlockStatuses(pauseRunner);
    await pauseRunner.run();
    await flushPromises();

    expect(pauseSpawned).toContain('run-feed');
    expect(pauseSpawned).not.toContain('run-join');
    expect(pauseTrack.statuses.get('run-join')).toBe('paused');
    expect(pauseTrack.statuses.get('if-1')).toBe('completed');

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
