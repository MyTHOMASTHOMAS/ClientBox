import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import { prepareRunContext } from '../../../src/services/runner/process/runner-process.spawner.js';
import { createRunnerSpawnHandlers } from '../../../src/services/runner/process/runner-process.handlers.js';
import { ScenarioSessionRegistry } from '../../../src/services/runner/session/runner-session.registry.js';

/**
 * CASE-ENG-04-13 — Run + exitId : assemblage additif et fin naturelle du CLI (CR-012).
 */
describe('CASE-ENG-04-13 — assemblage Run+exit et fin naturelle CLI (SPEC-ENG-04 / SPEC-ENG-03)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createAdapter(): CLIAdapter {
    return {
      cliId: 'cursor-cli',
      buildCommand: vi.fn().mockReturnValue({ command: 'mock', args: [], cwd: '/tmp' }),
      parseStreamLine: vi.fn().mockImplementation((line: string) => ({ type: 'stdout', chunk: line })),
    };
  }

  function createStore(opts?: { withExit?: boolean }) {
    return {
      getAgent: vi.fn().mockResolvedValue({
        id: 'ag-1',
        name: 'Agent',
        profilId: 'p-1',
        cliId: 'cursor-cli',
      }),
      getProfil: vi.fn().mockResolvedValue({
        id: 'p-1',
        name: 'Profil',
        systemPrompt: 'Expert',
        policy: 'chaque_prompt' as const,
      }),
      getPrompt: vi.fn().mockResolvedValue({
        id: 'p-mission',
        name: 'Mission',
        content: 'Rédige le rapport',
      }),
      getExitCondition: vi.fn().mockResolvedValue(
        opts?.withExit === false
          ? null
          : {
              id: 'e-boucle',
              name: 'Boucle',
              content: 'Si complet renvoie TERMINER, sinon CONTINUE',
            },
      ),
    };
  }

  it('test_CASE_ENG_04_13_run_exit_prompt_assembly_and_natural_cli_completion', async () => {
    const adapter = createAdapter();
    const store = createStore();
    const sessions = new ScenarioSessionRegistry();
    const nodeWithExit: ScenarioNode = {
      id: 'run-1',
      type: 'run',
      position: { x: 0, y: 0 },
      agentId: 'ag-1',
      promptId: 'p-mission',
      exitId: 'e-boucle',
    };

    const prepared = await prepareRunContext({
      node: nodeWithExit,
      resourceStore: store as never,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-13',
      policyInjectionState: new Map(),
      sessions,
    });

    expect(adapter.buildCommand).toHaveBeenCalled();
    const buildArg = vi.mocked(adapter.buildCommand).mock.calls[0]?.[0];
    expect(buildArg?.assembledPrompt).toBe(
      'Expert\n\nRédige le rapport\n\nSi complet renvoie TERMINER, sinon CONTINUE',
    );

    // Fin naturelle : mot-clé dans un chunk intermédiaire → aucun stop() anticipé
    const handleStop = vi.fn();
    let resolveOutput: (value: string) => void = () => undefined;
    let rejectOutput: (err: Error) => void = () => undefined;
    const outputPromise = new Promise<string>((resolve, reject) => {
      resolveOutput = resolve;
      rejectOutput = reject;
    });

    const { onChunk, onExit } = createRunnerSpawnHandlers({
      params: {
        node: nodeWithExit,
        adapter,
        commandSpec: prepared.commandSpec,
        isStopped: () => false,
        onChunk: vi.fn(),
        onActiveHandle: vi.fn(),
      },
      spawnStartMs: Date.now(),
      resolve: resolveOutput,
      reject: rejectOutput,
    });

    onChunk('Préambule... TERMINER ...', 'stdout');
    onChunk(' suite finale', 'stdout');
    expect(handleStop).not.toHaveBeenCalled();

    onExit(0);
    const value = await outputPromise;
    expect(value).toBe('Préambule... TERMINER ... suite finale');
    expect(handleStop).not.toHaveBeenCalled();

    // Sans exitId : aucun suffixe d'ordre de sortie
    const adapterNoExit = createAdapter();
    const storeNoExit = createStore({ withExit: false });
    storeNoExit.getExitCondition = vi.fn().mockResolvedValue(null);
    const nodeNoExit: ScenarioNode = {
      id: 'run-2',
      type: 'run',
      position: { x: 0, y: 0 },
      agentId: 'ag-1',
      promptId: 'p-mission',
    };
    await prepareRunContext({
      node: nodeNoExit,
      resourceStore: storeNoExit as never,
      adapters: [adapterNoExit],
      workspacePath: '/tmp/eng-04-13-b',
      policyInjectionState: new Map(),
      sessions: new ScenarioSessionRegistry(),
    });
    const noExitArg = vi.mocked(adapterNoExit.buildCommand).mock.calls[0]?.[0];
    expect(noExitArg?.assembledPrompt).toBe('Expert\n\nRédige le rapport');
  });
});
