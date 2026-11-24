import { describe, it, expect, vi } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';

describe('CASE-ENG-04-5 — Gestion runtime de PolicyInjectionState et réinitialisation par ClearContext (SPEC-ENG-04 / SPEC-DATA-01)', () => {
  it('test_CASE_ENG_04_5_policy_injection_state_runtime_management', async () => {
    const executedPrompts: string[] = [];

    const mockAdapter: CLIAdapter = {
      cliId: 'cursor-cli',
      buildCommand: vi.fn().mockImplementation((ctx) => {
        executedPrompts.push(ctx.assembledPrompt);
        return { command: 'mock', args: [], cwd: '/tmp' };
      }),
      parseStreamLine: vi.fn().mockReturnValue({ type: 'stdout', chunk: 'ok' }),
    };

    // Scénario : Start -> Run1 (ag-1) -> Run2 (ag-1) -> ClearContext (ag-1) -> Run3 (ag-1)
    const scenario: Scenario = {
      id: 'sc-policy-test',
      name: 'Test Politique Injection',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        { id: 'run-1', type: 'run', position: { x: 100, y: 0 }, agentId: 'ag-1', promptId: 'pr-1' },
        { id: 'run-2', type: 'run', position: { x: 200, y: 0 }, agentId: 'ag-1', promptId: 'pr-2' },
        { id: 'clear-1', type: 'clearContext', position: { x: 300, y: 0 }, agentId: 'ag-1' },
        { id: 'run-3', type: 'run', position: { x: 400, y: 0 }, agentId: 'ag-1', promptId: 'pr-3' },
      ],
      connections: [
        { sourceNodeId: 'start-1', sourcePortIndex: 0, targetNodeId: 'run-1', targetPortIndex: 0, key: '0' },
        { sourceNodeId: 'run-1', sourcePortIndex: 0, targetNodeId: 'run-2', targetPortIndex: 0, key: '0' },
        { sourceNodeId: 'run-2', sourcePortIndex: 0, targetNodeId: 'clear-1', targetPortIndex: 0, key: '0' },
        { sourceNodeId: 'clear-1', sourcePortIndex: 0, targetNodeId: 'run-3', targetPortIndex: 0, key: '0' },
      ],
    };

    const mockResourceStore = {
      getAgent: vi.fn().mockResolvedValue({
        id: 'ag-1',
        name: 'Agent A',
        profilId: 'p-clear',
        cliId: 'cursor-cli',
      }),
      getProfil: vi.fn().mockResolvedValue({
        id: 'p-clear',
        name: 'Profil Une Fois Jusqu’à Clear',
        systemPrompt: 'Directives Système Secrètes',
        policy: 'une_fois_jusqu_a_clear',
      }),
      getPrompt: vi.fn().mockImplementation(async (id: string) => ({
        id,
        name: `Prompt ${id}`,
        content: `Contenu utilisateur ${id}`,
      })),
      getExitCondition: vi.fn().mockResolvedValue(null),
    };

    const runner = new ScenarioRunnerService({
      scenario,
      adapters: [mockAdapter],
      workspacePath: '/tmp/workspace-policy',
      resourceStore: mockResourceStore as any,
    });

    // Espionner ou simuler executeSpawn pour ne pas exécuter de vrai process OS
    vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async () => {});

    await runner.run();

    // Vérification des 3 prompts exécutés :
    // 1er Run : Prompt système injecté
    expect(executedPrompts[0]).toContain('Directives Système Secrètes');
    expect(executedPrompts[0]).toContain('Contenu utilisateur pr-1');

    // 2e Run : Même agent, pas de ClearContext intermédiaire -> Prompt système NON réinjecté
    expect(executedPrompts[1]).not.toContain('Directives Système Secrètes');
    expect(executedPrompts[1]).toContain('Contenu utilisateur pr-2');

    // 3e Run : Après ClearContext pour ag-1 -> Prompt système DOIT être réinjecté à nouveau
    expect(executedPrompts[2]).toContain('Directives Système Secrètes');
    expect(executedPrompts[2]).toContain('Contenu utilisateur pr-3');
  });
});
