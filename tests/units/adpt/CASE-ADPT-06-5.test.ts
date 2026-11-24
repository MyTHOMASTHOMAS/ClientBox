import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { ClaudeCLIAdapter } from '../../../src/lib/adapters/claude/claude-cli.adapter.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';
import {
  chain,
  clearNode,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

const ENV_KEY = 'CLAUDE_CLI_BIN';

async function withEnv(value: string, fn: () => Promise<void>) {
  const previous = process.env[ENV_KEY];
  process.env[ENV_KEY] = value;
  try {
    await fn();
  } finally {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
  }
}

function createStreamInitProcess(sessionId: string) {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    const initEvent = JSON.stringify({
      type: 'system',
      subtype: 'init',
      session_id: sessionId,
    });
    proc.writeStdout(`${initEvent}\n`);
    proc.stdout.end();
    proc.stderr.end();
    setImmediate(() => proc.emitExit(0));
  });
  return proc;
}

function createEmptyExitProcess(code = 0) {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    proc.stdout.end();
    proc.stderr.end();
    setImmediate(() => proc.emitExit(code));
  });
  return proc;
}

function createHangingProcess() {
  return new MockChildProcess();
}

describe('CASE-ADPT-06-5 — gestion de session conversationnelle Claude au premier Run sans amorce ping et reprise multi-runs (SPEC-ADPT-06 / SPEC-ADPT-03)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_06_5_claude_extract_session_id_method', () => {
    const adapter = new ClaudeCLIAdapter();
    assert.equal(typeof adapter.extractSessionId, 'function');

    // 1. Ligne system init avec session_id
    const lineInit = JSON.stringify({
      type: 'system',
      subtype: 'init',
      session_id: 'session_01j83abc123',
    });
    assert.equal(adapter.extractSessionId!(lineInit), 'session_01j83abc123');

    // 2. Ligne sans session (ex: content_block_delta)
    assert.equal(
      adapter.extractSessionId!(
        JSON.stringify({
          type: 'stream_event',
          event: { type: 'content_block_delta' },
        }),
      ),
      null,
    );

    // 3. Texte brut
    assert.equal(adapter.extractSessionId!('Reading additional input...'), null);
  });

  it('test_CASE_ADPT_06_5_claude_create_session_probe_and_process_lifecycle', async () => {
    const tmp = createTempDir('clientsbox-adpt-06-5-');
    try {
      const binPath = path.join(tmp.dir, 'claude.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/claude-app',
        agentId: 'agent-claude-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new ClaudeCLIAdapter();
        let spawnedProc: MockChildProcess | undefined;

        spawnCtrl?.setFactory(() => {
          spawnedProc = createStreamInitProcess('session_01j83abc123');
          return spawnedProc;
        });

        const sessionIdPromise = adapter.createSession!(ctx);
        const sessionId = await sessionIdPromise;

        assert.equal(sessionId, 'session_01j83abc123');
        assert.ok(spawnedProc);
        assert.equal(spawnedProc.killed, false);
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_06_5_claude_create_session_fails_when_no_session_id_returned', async () => {
    const tmp = createTempDir('clientsbox-adpt-06-5-fail-');
    try {
      const binPath = path.join(tmp.dir, 'claude.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/claude-app',
        agentId: 'agent-claude-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new ClaudeCLIAdapter();
        spawnCtrl?.setFactory(() => createEmptyExitProcess(0));

        await expect(adapter.createSession!(ctx)).rejects.toThrow(
          /Échec de création de session Claude : aucun identifiant retourné/u,
        );
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_06_5_claude_create_session_fails_on_non_zero_exit_code', async () => {
    const tmp = createTempDir('clientsbox-adpt-06-5-exit-');
    try {
      const binPath = path.join(tmp.dir, 'claude.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/claude-app',
        agentId: 'agent-claude-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new ClaudeCLIAdapter();
        spawnCtrl?.setFactory(() => createEmptyExitProcess(1));

        await expect(adapter.createSession!(ctx)).rejects.toThrow(
          /code d'erreur 1/u,
        );
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_06_5_claude_create_session_timeout_rejection', async () => {
    vi.useFakeTimers();
    const tmp = createTempDir('clientsbox-adpt-06-5-timeout-');
    try {
      const binPath = path.join(tmp.dir, 'claude.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/claude-app',
        agentId: 'agent-claude-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new ClaudeCLIAdapter();
        spawnCtrl?.setFactory(() => createHangingProcess());

        const promise = adapter.createSession!(ctx);
        const rejectionAssertion = expect(promise).rejects.toThrow(
          /Délai d'initialisation de session Claude dépassé/u,
        );

        await vi.advanceTimersByTimeAsync(16_000);
        await rejectionAssertion;
      });
    } finally {
      vi.useRealTimers();
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_06_5_scenario_session_lazy_capture_and_reuse_for_claude_agent', async () => {
    const tmp = createTempDir('clientsbox-adpt-06-5-reuse-');
    try {
      const binPath = path.join(tmp.dir, 'claude.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      await withEnv(binPath, async () => {
        const adapter = new ClaudeCLIAdapter();

        const commandsBuilt: string[][] = [];
        const originalBuildCommand = adapter.buildCommand.bind(adapter);
        vi.spyOn(adapter, 'buildCommand').mockImplementation((ctx) => {
          const spec = originalBuildCommand(ctx);
          commandsBuilt.push([...spec.args]);
          return spec;
        });

        const store = {
          getAgent: vi.fn(async (id: string) => ({
            id,
            name: `Agent ${id}`,
            profilId: 'p-1',
            cliId: 'claude-cli',
          })),
          getProfil: vi.fn(async () => ({
            id: 'p-1',
            name: 'Profil',
            systemPrompt: '',
            policy: 'chaque_prompt' as const,
          })),
          getPrompt: vi.fn(async (id: string) => ({ id, name: id, content: `prompt:${id}` })),
          getExitCondition: vi.fn(async () => null),
        };

        let runCount = 0;
        spawnCtrl?.setFactory((cmd, args) => {
          assert.ok(!args.includes('ping'), 'Aucun prompt ping ne doit être exécuté !');
          runCount++;
          const runSessionId = runCount <= 2 ? 'session_01j83abc123' : 'session_01j83xyz789';
          const runProc = new MockChildProcess();
          queueMicrotask(() => {
            runProc.writeStdout(
              JSON.stringify({
                type: 'system',
                subtype: 'init',
                session_id: runSessionId,
              }) + '\n',
            );
            runProc.writeStdout(
              JSON.stringify({
                type: 'stream_event',
                event: {
                  type: 'content_block_delta',
                  delta: { type: 'text_delta', text: `Reponse-${String(runCount)}` },
                },
              }) + '\n',
            );
            runProc.stdout.end();
            runProc.stderr.end();
            setImmediate(() => runProc.emitExit(0));
          });
          return runProc;
        });

        // 1. Scénario avec réutilisation : Start -> Run-1 -> Run-2
        const scenarioReuse: Scenario = {
          id: 'sc-claude-reuse',
          name: 'Scénario Claude Réutilisation',
          nodes: [
            startNode('start-1'),
            runNode('run-1', 'agent-claude'),
            runNode('run-2', 'agent-claude'),
          ],
          connections: chain('start-1', 'run-1', 'run-2'),
        };

        const runner1 = new ScenarioRunnerService({
          scenario: scenarioReuse,
          adapters: [adapter],
          workspacePath: tmp.dir,
          resourceStore: store as never,
        });

        await runner1.run();

        expect(commandsBuilt).toHaveLength(2);
        // Run-1 : mode initial sans session (sans --resume), avec vrai prompt
        expect(commandsBuilt[0]).not.toContain('--resume');
        expect(commandsBuilt[0]).toContain('prompt:run-1');

        // Run-2 : reprise automatique avec le session_id capturé dynamiquement lors du Run-1 !
        expect(commandsBuilt[1]).toContain('--resume');
        expect(commandsBuilt[1]).toContain('session_01j83abc123');
        expect(commandsBuilt[1]).toContain('prompt:run-2');

        // 2. Scénario avec ClearContext : Start -> Run-1 -> Clear -> Run-2 -> Run-3
        commandsBuilt.length = 0;
        const scenarioClear: Scenario = {
          id: 'sc-claude-clear',
          name: 'Scénario Claude Clear',
          nodes: [
            startNode('start-1'),
            runNode('run-1', 'agent-claude'),
            clearNode('clear-1', 'agent-claude'),
            runNode('run-2', 'agent-claude'),
            runNode('run-3', 'agent-claude'),
          ],
          connections: chain('start-1', 'run-1', 'clear-1', 'run-2', 'run-3'),
        };

        const runner2 = new ScenarioRunnerService({
          scenario: scenarioClear,
          adapters: [adapter],
          workspacePath: tmp.dir,
          resourceStore: store as never,
        });

        await runner2.run();

        expect(commandsBuilt).toHaveLength(3);
        // Run-1 : mode initial avant clear
        expect(commandsBuilt[0]).not.toContain('--resume');

        // Run-2 après clear : réamorçage en mode initial (nouveau fil) et capture du nouveau session_id
        expect(commandsBuilt[1]).not.toContain('--resume');

        // Run-3 : reprend le nouveau session_id capturé lors du Run-2
        expect(commandsBuilt[2]).toContain('--resume');
        expect(commandsBuilt[2]).toContain('session_01j83xyz789');
      });
    } finally {
      tmp.cleanup();
    }
  });
});

