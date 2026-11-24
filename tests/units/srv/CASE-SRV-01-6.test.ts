import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { runCliScenario } from '../../../src/controllers/cli/cli-scenario.controller.js';
import * as activeProcesses from '../../../src/services/runner/process/runner-active-processes.js';

describe('CASE-SRV-01-6 — Exécution nominale headless d\'un scénario en terminal sans serveur HTTP (SPEC-SRV-01)', () => {
  const scenarioFixture: Scenario = {
    id: 'test-step4-command',
    name: 'Test Step 4 — Commande Shell Native',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
      {
        id: 'cmd-1',
        type: 'command' as any,
        position: { x: 200, y: 0 },
        commandLine: 'echo Hello from command block',
      } as any,
    ],
    connections: [
      {
        sourceNodeId: 'start-1',
        sourcePortIndex: 0,
        targetNodeId: 'cmd-1',
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
      listScenarios: vi.fn().mockResolvedValue([scenarioFixture]),
      getScenario: vi.fn().mockImplementation(async (id: string) => {
        if (id === scenarioFixture.id) return scenarioFixture;
        return null;
      }),
    };

    vi.spyOn(activeProcesses, 'executeTrackedSpawn').mockImplementation(async (bag: any, node) => {
      bag.chunkReceived?.({
        nodeId: node.id,
        chunk: 'Output from cmd-1\n',
        stream: 'stdout',
      });
      return 'Output from cmd-1\n';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_SRV_01_6_headless_scenario_execution_and_terminal_streaming', async () => {
    const services = {
      store: mockStore,
      agentService: {} as any,
      adapterRegistry: {
        listOperationalAdapters: () => [],
      } as any,
      userDocs: {} as any,
    };

    // 1. Exécution par ID technique exact
    const exitCodeId = await runCliScenario({
      target: 'test-step4-command',
      services,
      workspacePath: '/fake/workspace',
      stdout: mockStdout as any,
      stderr: mockStderr as any,
    });

    expect(exitCodeId).toBe(0);
    const fullStdoutId = stdoutBuffer.join('');
    expect(fullStdoutId).toContain('[ClientsBox] Démarrage');
    expect(fullStdoutId).toContain('test-step4-command');
    expect(fullStdoutId).toContain('Hello from command block');
    expect(fullStdoutId).toContain('[ClientsBox] Exécution terminée avec succès');
    expect(stderrBuffer).toHaveLength(0);

    // 2. Exécution par libellé (name) insensible à la casse
    stdoutBuffer.length = 0;
    stderrBuffer.length = 0;

    const exitCodeName = await runCliScenario({
      target: 'test step 4 — commande shell native',
      services,
      workspacePath: '/fake/workspace',
      stdout: mockStdout as any,
      stderr: mockStderr as any,
    });

    expect(exitCodeName).toBe(0);
    const fullStdoutName = stdoutBuffer.join('');
    expect(fullStdoutName).toContain('[ClientsBox] Démarrage');
    expect(fullStdoutName).toContain('Test Step 4 — Commande Shell Native');
    expect(fullStdoutName).toContain('[ClientsBox] Exécution terminée avec succès');
  });
});
