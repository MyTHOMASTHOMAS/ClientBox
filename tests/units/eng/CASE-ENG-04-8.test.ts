import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';

/**
 * CASE-ENG-04-8 — schéma canvas réel :
 * - plusieurs connexions sortantes (fan-out)
 * - If → deux flux exclusifs selon true / false
 */
describe('CASE-ENG-04-8 — Fan-out multi-sorties et bifurcation If oui/non (SPEC-ENG-01/03/04 / SVC-001)', () => {
  let tmpDir: string;
  let ifTruePath: string;
  let ifFalsePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eng-04-8-'));
    ifTruePath = path.join(tmpDir, 'cond-true.js');
    ifFalsePath = path.join(tmpDir, 'cond-false.js');
    await fs.writeFile(
      ifTruePath,
      'module.exports = function condTrue() { return true; };\n',
      'utf8',
    );
    await fs.writeFile(
      ifFalsePath,
      'module.exports = function condFalse() { return false; };\n',
      'utf8',
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  function createAdapter(): CLIAdapter {
    return {
      cliId: 'cursor-cli',
      buildCommand: vi.fn().mockReturnValue({ command: 'mock', args: [], cwd: '/tmp' }),
      parseStreamLine: vi.fn().mockReturnValue({ type: 'stdout', chunk: 'ok' }),
    };
  }

  function createStore(ifScriptPath: string) {
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
      resolveIfScriptPath: vi.fn().mockReturnValue(ifScriptPath),
    };
  }

  async function runScenario(
    scenario: Scenario,
    ifScriptPath: string,
  ): Promise<{ spawned: string[]; statuses: Map<string, BlockStatus> }> {
    const adapter = createAdapter();
    const runner = new ScenarioRunnerService({
      scenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-8',
      resourceStore: createStore(ifScriptPath) as never,
    });

    const spawned: string[] = [];
    const statuses = new Map<string, BlockStatus>();
    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: BlockStatus };
      statuses.set(event.nodeId, event.status);
    });
    vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      spawned.push(node.id);
    });

    await runner.run();
    await flushPromises();
    return { spawned, statuses };
  }

  function ifBranchScenario(ifScriptId: string): Scenario {
    return {
      id: `sc-if-${ifScriptId}`,
      name: `Bifurcation If ${ifScriptId}`,
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'run-feed',
          type: 'run',
          position: { x: 120, y: 40 },
          agentId: 'ag-feed',
          promptId: 'pr-feed',
        },
        { id: 'if-1', type: 'if', position: { x: 260, y: 40 }, ifScriptId },
        {
          id: 'run-oui',
          type: 'run',
          position: { x: 420, y: 0 },
          agentId: 'ag-oui',
          promptId: 'pr-oui',
        },
        {
          id: 'run-non',
          type: 'run',
          position: { x: 420, y: 100 },
          agentId: 'ag-non',
          promptId: 'pr-non',
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
        // port 0 = branche vraie
        {
          sourceNodeId: 'if-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-oui',
          targetPortIndex: 0,
          key: '0',
        },
        // port 1 = branche fausse
        {
          sourceNodeId: 'if-1',
          sourcePortIndex: 1,
          targetNodeId: 'run-non',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };
  }

  it('test_CASE_ENG_04_8_fanout_and_if_branch_exclusive_flows', async () => {
    // --- 1. Fan-out : Start a 2 connexions sortantes → RunA et RunB s'exécutent tous les deux ---
    const fanOutScenario: Scenario = {
      id: 'sc-fanout',
      name: 'Start multi-sorties',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 40 } },
        {
          id: 'run-a',
          type: 'run',
          position: { x: 180, y: 0 },
          agentId: 'ag-a',
          promptId: 'pr-a',
        },
        {
          id: 'run-b',
          type: 'run',
          position: { x: 180, y: 100 },
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
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-b',
          targetPortIndex: 0,
          key: '0',
        },
      ],
    };

    const fan = await runScenario(fanOutScenario, ifTruePath);
    expect(fan.spawned).toEqual(expect.arrayContaining(['run-a', 'run-b']));
    expect(fan.spawned).toHaveLength(2);
    expect(fan.statuses.get('run-a')).toBe('completed');
    expect(fan.statuses.get('run-b')).toBe('completed');

    // --- 2. If true : seul le flux "oui" (port 0) s'exécute ---
    const whenTrue = await runScenario(ifBranchScenario('cond-true'), ifTruePath);
    expect(whenTrue.spawned).toContain('run-feed');
    expect(whenTrue.spawned).toContain('run-oui');
    expect(whenTrue.spawned).not.toContain('run-non');
    expect(whenTrue.statuses.get('if-1')).toBe('completed');
    expect(whenTrue.statuses.get('run-oui')).toBe('completed');
    expect(['paused', 'idle']).toContain(whenTrue.statuses.get('run-non') ?? 'idle');

    // --- 3. If false : seul le flux "non" (port 1) s'exécute ---
    const whenFalse = await runScenario(ifBranchScenario('cond-false'), ifFalsePath);
    expect(whenFalse.spawned).toContain('run-feed');
    expect(whenFalse.spawned).toContain('run-non');
    expect(whenFalse.spawned).not.toContain('run-oui');
    expect(whenFalse.statuses.get('if-1')).toBe('completed');
    expect(whenFalse.statuses.get('run-non')).toBe('completed');
    expect(['paused', 'idle']).toContain(whenFalse.statuses.get('run-oui') ?? 'idle');
  });
});
