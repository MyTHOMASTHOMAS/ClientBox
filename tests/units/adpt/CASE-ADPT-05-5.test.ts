import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { CodexCLIAdapter } from '../../../src/lib/adapters/codex/codex-cli.adapter.js';
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

const ENV_KEY = 'CODEX_CLI_BIN';

async function withEnv(value: string, fn: () => Promise<void>): Promise<void> {
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

function createStreamInitProcess(threadId: string): MockChildProcess {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    const initEvent = JSON.stringify({
      type: 'thread.started',
      thread_id: threadId,
    });
    proc.writeStdout(`${initEvent}\n`);
    proc.stdout.end();
    proc.stderr.end();
    setImmediate(() => proc.emitExit(0));
  });
  return proc;
}

function createEmptyExitProcess(code = 0): MockChildProcess {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    proc.stdout.end();
    proc.stderr.end();
    setImmediate(() => proc.emitExit(code));
  });
  return proc;
}

function createHangingProcess(): MockChildProcess {
  return new MockChildProcess();
}

describe('CASE-ADPT-05-5 — création de session Codex stream-json ordonnée et réutilisation multi-runs (SPEC-ADPT-05 / SPEC-ADPT-03)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_05_5_codex_extract_session_id_method', () => {
    const adapter = new CodexCLIAdapter();
    assert.equal(typeof adapter.extractSessionId, 'function');

    // 1. Ligne thread.started avec thread_id
    const lineStarted = JSON.stringify({
      type: 'thread.started',
      thread_id: '01a1c505-6055-7893-a918-21c4e1a722e1',
    });
    assert.equal(
      adapter.extractSessionId!(lineStarted),
      '01a1c505-6055-7893-a918-21c4e1a722e1',
    );

    // 2. Ligne sans session (ex: turn.started)
    assert.equal(adapter.extractSessionId!(JSON.stringify({ type: 'turn.started' })), null);

    // 3. Texte brut
    assert.equal(adapter.extractSessionId!('Reading additional input...'), null);
  });

  it('test_CASE_ADPT_05_5_codex_create_session_orderly_process_termination', async () => {
    const tmp = createTempDir('clientsbox-adpt-05-5-');
    try {
      const binPath = path.join(tmp.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/codex-app',
        agentId: 'agent-codex-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        let spawnedProc: MockChildProcess | undefined;

        spawnCtrl?.setFactory(() => {
          spawnedProc = createStreamInitProcess('01a1c467-d234-7020-9cff-1d6cbdfeb8ca');
          return spawnedProc;
        });

        const sessionIdPromise = adapter.createSession!(ctx);
        const sessionId = await sessionIdPromise;

        assert.equal(sessionId, '01a1c467-d234-7020-9cff-1d6cbdfeb8ca');
        assert.ok(spawnedProc);
        assert.equal(spawnedProc.killed, false);
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_05_5_codex_create_session_fails_when_no_thread_id_returned', async () => {
    const tmp = createTempDir('clientsbox-adpt-05-5-fail-');
    try {
      const binPath = path.join(tmp.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/codex-app',
        agentId: 'agent-codex-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        spawnCtrl?.setFactory(() => createEmptyExitProcess(0));

        await expect(adapter.createSession!(ctx)).rejects.toThrow(
          /Échec de création de session Codex : aucun identifiant retourné/u,
        );
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_05_5_codex_create_session_fails_on_non_zero_exit_code', async () => {
    const tmp = createTempDir('clientsbox-adpt-05-5-exit-');
    try {
      const binPath = path.join(tmp.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/codex-app',
        agentId: 'agent-codex-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        spawnCtrl?.setFactory(() => createEmptyExitProcess(1));

        await expect(adapter.createSession!(ctx)).rejects.toThrow(
          /code d'erreur 1/u,
        );
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_05_5_codex_create_session_timeout_rejection', async () => {
    vi.useFakeTimers();
    const tmp = createTempDir('clientsbox-adpt-05-5-timeout-');
    try {
      const binPath = path.join(tmp.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/codex-app',
        agentId: 'agent-codex-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        spawnCtrl?.setFactory(() => createHangingProcess());

        const promise = adapter.createSession!(ctx);
        const rejectionAssertion = expect(promise).rejects.toThrow(
          /Délai d'initialisation de session Codex dépassé/u,
        );

        await vi.advanceTimersByTimeAsync(16_000);
        await rejectionAssertion;
      });
    } finally {
      vi.useRealTimers();
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_05_5_scenario_session_reuse_and_clear_for_codex_agent', async () => {
    const tmp = createTempDir('clientsbox-adpt-05-5-reuse-');
    try {
      const binPath = path.join(tmp.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();

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
            cliId: 'codex-cli',
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
          const runThreadId = runCount <= 2 ? '01a1c505-thread-1' : '01a1c505-thread-2';
          const runProc = new MockChildProcess();
          queueMicrotask(() => {
            runProc.writeStdout(
              JSON.stringify({
                type: 'thread.started',
                thread_id: runThreadId,
              }) + '\n',
            );
            runProc.writeStdout(
              JSON.stringify({
                type: 'item.completed',
                item: { id: 'item_0', type: 'agent_message', text: `Reponse-${String(runCount)}` },
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
          id: 'sc-codex-reuse',
          name: 'Scénario Codex Réutilisation',
          nodes: [
            startNode('start-1'),
            runNode('run-1', 'agent-codex'),
            runNode('run-2', 'agent-codex'),
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
        // Run-1 : mode initial sans session (exec), avec vrai prompt
        expect(commandsBuilt[0]).toContain('exec');
        expect(commandsBuilt[0]).not.toContain('resume');
        expect(commandsBuilt[0]).toContain('prompt:run-1');

        // Run-2 : reprise automatique avec le thread_id capturé dynamiquement lors du Run-1 !
        expect(commandsBuilt[1]).toContain('resume');
        expect(commandsBuilt[1]).toContain('01a1c505-thread-1');
        expect(commandsBuilt[1]).toContain('prompt:run-2');

        // 2. Scénario avec ClearContext : Start -> Run-1 -> Clear -> Run-2 -> Run-3
        commandsBuilt.length = 0;
        const scenarioClear: Scenario = {
          id: 'sc-codex-clear',
          name: 'Scénario Codex Clear',
          nodes: [
            startNode('start-1'),
            runNode('run-1', 'agent-codex'),
            clearNode('clear-1', 'agent-codex'),
            runNode('run-2', 'agent-codex'),
            runNode('run-3', 'agent-codex'),
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
        expect(commandsBuilt[0]).toContain('exec');
        expect(commandsBuilt[0]).not.toContain('resume');

        // Run-2 après clear : réamorçage en mode initial (nouveau fil) et capture du nouveau thread_id
        expect(commandsBuilt[1]).toContain('exec');
        expect(commandsBuilt[1]).not.toContain('resume');

        // Run-3 : reprend le nouveau thread_id capturé lors du Run-2
        expect(commandsBuilt[2]).toContain('resume');
        expect(commandsBuilt[2]).toContain('01a1c505-thread-2');
      });
    } finally {
      tmp.cleanup();
    }
  });
});
