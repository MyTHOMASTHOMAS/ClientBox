import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { AntigravityCLIAdapter } from '../../../src/lib/adapters/antigravity/antigravity-cli.adapter.js';
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

const ENV_KEY = 'ANTIGRAVITY_CLI_BIN';

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

function createStreamInitProcess(conversationId: string): MockChildProcess {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    const initEvent = JSON.stringify({
      event: 'init',
      conversation_id: conversationId,
      init: { cwd: '/var/projects/demo', tools: [] },
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

describe('CASE-ADPT-04-6 — création de session Antigravity stream-json ordonnée et réutilisation multi-runs (SPEC-ADPT-04 / SPEC-ADPT-03)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_04_6_antigravity_extract_session_id_method', () => {
    const adapter = new AntigravityCLIAdapter();
    assert.equal(typeof adapter.extractSessionId, 'function');

    // 1. Ligne init avec conversation_id
    const lineInit = JSON.stringify({
      event: 'init',
      conversation_id: '0192e5a4-9b2c-7b00-8123-abcdef012345',
      init: { cwd: '/var/projects/demo', tools: [] },
    });
    assert.equal(
      adapter.extractSessionId!(lineInit),
      '0192e5a4-9b2c-7b00-8123-abcdef012345',
    );

    // 2. Ligne step_update avec conversation_id
    const lineStep = JSON.stringify({
      event: 'step_update',
      step_update: { conversation_id: '0192e5a4-step-id', step_index: 1 },
    });
    assert.equal(adapter.extractSessionId!(lineStep), '0192e5a4-step-id');

    // 3. Ligne sans conversation_id
    assert.equal(adapter.extractSessionId!(JSON.stringify({ event: 'ping' })), null);

    // 4. Texte brut
    assert.equal(adapter.extractSessionId!('Fetching models...'), null);
  });

  it('test_CASE_ADPT_04_6_antigravity_create_session_orderly_process_termination', async () => {
    const tmp = createTempDir('clientsbox-adpt-04-6-');
    try {
      const binPath = path.join(tmp.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/antigravity-app',
        agentId: 'agent-agy-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();
        let spawnedProc: MockChildProcess | undefined;

        spawnCtrl?.setFactory(() => {
          spawnedProc = createStreamInitProcess('0192e5a4-9b2c-7b00-8123-abcdef012345');
          return spawnedProc;
        });

        const sessionId = await adapter.createSession?.(ctx);

        assert.equal(sessionId, '0192e5a4-9b2c-7b00-8123-abcdef012345');
        const lastSpawn = spawnCtrl?.getLastSpawn();
        assert.ok(lastSpawn !== undefined);
        assert.equal(lastSpawn.command, binPath);
        assert.deepEqual(lastSpawn.args, [
          '--dangerously-skip-permissions',
          '--output-format',
          'stream-json',
          '-p',
          'ping',
        ]);
        assert.equal(lastSpawn.options?.cwd, '/var/projects/antigravity-app');

        // Vérification de la terminaison ordonnée sans kill brusque
        assert.ok(spawnedProc !== undefined);
        assert.equal(spawnedProc.exitCode, 0);
        assert.equal(spawnedProc.killed, false);
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_04_6_antigravity_create_session_error_when_no_uuid', async () => {
    const tmp = createTempDir('clientsbox-adpt-04-6-err-');
    try {
      const binPath = path.join(tmp.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/antigravity-app',
        agentId: 'agent-agy-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();

        spawnCtrl?.setFactory(() => createEmptyExitProcess(0));

        await assert.rejects(
          () => adapter.createSession!(ctx),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(err.message, /Échec de création de session Antigravity|aucun identifiant/i);
            return true;
          },
        );
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_04_6_antigravity_create_session_error_when_exit_code_non_zero', async () => {
    const tmp = createTempDir('clientsbox-adpt-04-6-exitcode-');
    try {
      const binPath = path.join(tmp.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/antigravity-app',
        agentId: 'agent-agy-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();

        spawnCtrl?.setFactory(() => createEmptyExitProcess(2));

        await assert.rejects(
          () => adapter.createSession!(ctx),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(err.message, /Échec d'initialisation de session Antigravity|code d'erreur 2/i);
            return true;
          },
        );
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_04_6_antigravity_create_session_timeout', async () => {
    const tmp = createTempDir('clientsbox-adpt-04-6-timeout-');
    try {
      const binPath = path.join(tmp.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/antigravity-app',
        agentId: 'agent-agy-1',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();
        let spawnedProc: MockChildProcess | undefined;

        spawnCtrl?.setFactory(() => {
          spawnedProc = createHangingProcess();
          return spawnedProc;
        });

        // Configurer un délai court de 50ms pour le test
        const prevTimeout = process.env.ANTIGRAVITY_PROBE_TIMEOUT_MS;
        process.env.ANTIGRAVITY_PROBE_TIMEOUT_MS = '50';

        try {
          await assert.rejects(
            () => adapter.createSession!(ctx),
            (err: unknown) => {
              assert.ok(err instanceof Error);
              assert.match(err.message, /délai d'initialisation de session Antigravity dépassé/i);
              return true;
            },
          );
        } finally {
          if (prevTimeout === undefined) {
            delete process.env.ANTIGRAVITY_PROBE_TIMEOUT_MS;
          } else {
            process.env.ANTIGRAVITY_PROBE_TIMEOUT_MS = prevTimeout;
          }
        }

        assert.ok(spawnedProc !== undefined);
        assert.equal(spawnedProc.killed, true);
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_04_6_scenario_session_reuse_and_clear_for_antigravity_agent', async () => {
    const tmp = createTempDir('clientsbox-adpt-04-6-runner-');
    try {
      const binPath = path.join(tmp.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();
        const createSessionSpy = vi.spyOn(adapter, 'createSession');

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
            cliId: 'antigravity',
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
          const convId = runCount <= 2 ? '0192e5a4-conv-1' : '0192e5a4-conv-2';
          const runProc = new MockChildProcess();
          queueMicrotask(() => {
            runProc.writeStdout(
              JSON.stringify({
                event: 'init',
                conversation_id: convId,
                init: { cwd: tmp.dir, tools: [] },
              }) + '\n',
            );
            runProc.writeStdout(
              JSON.stringify({
                event: 'result',
                result: { conversation_id: convId, status: 'SUCCESS', response: `Reponse-${runCount}` },
              }) + '\n',
            );
            runProc.stdout.end();
            runProc.stderr.end();
            setImmediate(() => runProc.emitExit(0));
          });
          return runProc;
        });

        // Scénario A : Start -> Run-1(a) -> Run-2(a)
        const scenarioA: Scenario = {
          id: 'sc-agy-reuse',
          name: 'Réutilisation session Antigravity',
          nodes: [startNode('start-1'), runNode('run-1', 'agent-agy'), runNode('run-2', 'agent-agy')],
          connections: chain('start-1', 'run-1', 'run-2'),
        };

        const runnerA = new ScenarioRunnerService({
          scenario: scenarioA,
          adapters: [adapter],
          workspacePath: tmp.dir,
          resourceStore: store as never,
        });

        await runnerA.run();

        // createSession ne doit PAS être appelé grâce à l'extraction Lazy Session
        expect(createSessionSpy).not.toHaveBeenCalled();
        expect(commandsBuilt).toHaveLength(2);
        // Run-1 : mode initial sans session
        expect(commandsBuilt[0]).not.toContain('--conversation');
        expect(commandsBuilt[0]).toContain('--output-format');
        expect(commandsBuilt[0]).toContain('stream-json');
        expect(commandsBuilt[0]).toContain('prompt:run-1');

        // Run-2 : reprend la session 0192e5a4-conv-1 capturée lors du Run-1
        expect(commandsBuilt[1]).toContain('--conversation');
        expect(commandsBuilt[1]).toContain('0192e5a4-conv-1');
        expect(commandsBuilt[1]).toContain('prompt:run-2');

        // Scénario B : Start -> Run-1(a) -> ClearContext(a) -> Run-2(a) -> Run-3(a)
        commandsBuilt.length = 0;
        const scenarioB: Scenario = {
          id: 'sc-agy-clear',
          name: 'Clear session Antigravity',
          nodes: [
            startNode('start-1'),
            runNode('run-1', 'agent-agy'),
            clearNode('clear-1', 'agent-agy'),
            runNode('run-2', 'agent-agy'),
            runNode('run-3', 'agent-agy'),
          ],
          connections: chain('start-1', 'run-1', 'clear-1', 'run-2', 'run-3'),
        };

        const runnerB = new ScenarioRunnerService({
          scenario: scenarioB,
          adapters: [adapter],
          workspacePath: tmp.dir,
          resourceStore: store as never,
        });

        await runnerB.run();

        expect(createSessionSpy).not.toHaveBeenCalled();
        expect(commandsBuilt).toHaveLength(3);
        // Run-1 : mode initial
        expect(commandsBuilt[0]).not.toContain('--conversation');
        // Run-2 (après Clear) : réamorce un nouveau fil sans --conversation
        expect(commandsBuilt[1]).not.toContain('--conversation');
        // Run-3 : reprend le nouveau thread 0192e5a4-conv-2
        expect(commandsBuilt[2]).toContain('--conversation');
        expect(commandsBuilt[2]).toContain('0192e5a4-conv-2');
      });
    } finally {
      tmp.cleanup();
    }
  });
});
