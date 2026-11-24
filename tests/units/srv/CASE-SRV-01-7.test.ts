import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { runCliScenario } from '../../../src/controllers/cli/cli-scenario.controller.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';

describe('CASE-SRV-01-7 — Résilience d\'exécution headless : scénario introuvable, échec de bloc et arrêt SIGINT (SPEC-SRV-01)', () => {
  const failingScenario: Scenario = {
    id: 'sc-fail',
    name: 'Scénario Défaillant',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
      {
        id: 'cmd-fail',
        type: 'command' as any,
        position: { x: 200, y: 0 },
        commandLine: 'exit 42',
      } as any,
    ],
    connections: [
      {
        sourceNodeId: 'start-1',
        sourcePortIndex: 0,
        targetNodeId: 'cmd-fail',
        targetPortIndex: 0,
        key: '0',
      } as any,
    ],
  };

  let stdoutBuffer: string[];
  let stderrBuffer: string[];
  let mockStdout: { write: (chunk: string) => boolean };
  let mockStderr: { write: (chunk: string) => boolean };
  let mockStore: any;

  beforeEach(() => {
    stdoutBuffer = [];
    stderrBuffer = [];
    mockStdout = {
      write: (chunk: string) => {
        stdoutBuffer.push(chunk);
        return true;
      },
    };
    mockStderr = {
      write: (chunk: string) => {
        stderrBuffer.push(chunk);
        return true;
      },
    };

    mockStore = {
      listScenarios: vi.fn().mockResolvedValue([failingScenario]),
      getScenario: vi.fn().mockImplementation(async (id: string) => {
        if (id === failingScenario.id) return failingScenario;
        return null;
      }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_SRV_01_7_headless_resilience_missing_scenario_block_error_and_sigint', async () => {
    const services = {
      store: mockStore,
      agentService: {} as any,
      adapterRegistry: {
        listOperationalAdapters: () => [],
      } as any,
      userDocs: {} as any,
    };

    // 1. Scénario introuvable : sortie code 1 + message sur stderr
    const exitCodeNotFound = await runCliScenario({
      target: 'scenario-inexistant-404',
      services,
      workspacePath: '/fake/workspace',
      stdout: mockStdout as any,
      stderr: mockStderr as any,
    });

    expect(exitCodeNotFound).toBe(1);
    expect(stderrBuffer.join('')).toMatch(/introuvable/i);

    // 2. Échec de bloc : émission stderr + sortie code 1
    stdoutBuffer.length = 0;
    stderrBuffer.length = 0;

    const exitCodeFailed = await runCliScenario({
      target: 'sc-fail',
      services,
      workspacePath: '/fake/workspace',
      stdout: mockStdout as any,
      stderr: mockStderr as any,
    });

    expect(exitCodeFailed).toBe(1);
    expect(stderrBuffer.join('')).toMatch(/échec/i);

    // 3. Interruption par SIGINT : signal reçu, stop() invoqué, code 130
    stdoutBuffer.length = 0;
    stderrBuffer.length = 0;

    const stopSpy = vi.spyOn(ScenarioRunnerService.prototype, 'stop');
    const abortController = new AbortController();

    vi.spyOn(ScenarioRunnerService.prototype, 'run').mockImplementationOnce(async () => {
      return new Promise<void>((_, reject) => {
        abortController.signal.addEventListener('abort', () => {
          reject(new Error('Interrompu par SIGINT'));
        });
      });
    });

    const runPromise = runCliScenario({
      target: 'sc-fail',
      services,
      workspacePath: '/fake/workspace',
      stdout: mockStdout as any,
      stderr: mockStderr as any,
      signal: abortController.signal,
    });

    // Déclenche l'interruption
    abortController.abort();

    const exitCodeSigint = await runPromise;
    expect(exitCodeSigint).toBe(130);
    expect(stopSpy).toHaveBeenCalled();
    const allOutput = stdoutBuffer.join('') + stderrBuffer.join('');
    expect(allOutput).toMatch(/interrompu/i);
  });
});
