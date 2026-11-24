import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { CLIAdapter, ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';
import { prepareRunContext } from '../../../src/services/runner/process/runner-process.spawner.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import type { ScenarioSessionRegistry } from '../../../src/services/runner/session/runner-session.registry.js';

const ENV_KEY = 'CURSOR_CLI_BIN';

function withEnv<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env[ENV_KEY];
  if (value === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = value;
  }
  const restore = () => {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
  };
  try {
    const result = fn();
    if (result && typeof (result as unknown as Promise<unknown>).then === 'function') {
      return (result as unknown as Promise<unknown>).finally(restore) as T;
    }
    restore();
    return result;
  } catch (err) {
    restore();
    throw err;
  }
}

function createCliProcess(stdout: string, code: number) {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    if (stdout !== '') proc.writeStdout(stdout);
    proc.stdout.end();
    proc.stderr.end();
    setImmediate(() => proc.emitExit(code));
  });
  return proc;
}

describe('CASE-ADPT-02-5 — injection de --model <id> et découverte listModels (SPEC-ADPT-02)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_02_5_build_command_injects_model_when_provided', () => {
    const tmp = createTempDir('clientsbox-adpt-02-5-model-');
    try {
      const binPath = path.join(tmp.dir, 'agent');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const prompt = 'Instructions système\n\nRefactorise le composant';
      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/my-app',
        agentId: 'agent-cursor',
        assembledPrompt: prompt,
        sessionId: 'chat-123',
        model: 'test-model-custom',
      };

      withEnv(binPath, () => {
        const adapter = new CursorCLIAdapter();
        const options = adapter.buildCommand(ctx);

        assert.equal(options.command, binPath);
        assert.equal(options.cwd, '/var/projects/my-app');
        assert.deepEqual(options.args, [
          '-p',
          '--output-format',
          'json',
          '--model',
          'test-model-custom',
          '--resume',
          'chat-123',
          prompt,
        ]);
      });

      // Avec espaces superflus autour du modèle
      const ctxWithSpaces: ExecutionContext = {
        ...ctx,
        model: '  test-model-spaced  ',
      };

      withEnv(binPath, () => {
        const adapter = new CursorCLIAdapter();
        const options = adapter.buildCommand(ctxWithSpaces);

        assert.deepEqual(options.args, [
          '-p',
          '--output-format',
          'json',
          '--model',
          'test-model-spaced',
          '--resume',
          'chat-123',
          prompt,
        ]);
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_02_5_build_command_omits_model_when_missing_or_whitespace', () => {
    const tmp = createTempDir('clientsbox-adpt-02-5-nomodel-');
    try {
      const binPath = path.join(tmp.dir, 'agent');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const prompt = 'Consigne de test';
      const baseCtx: ExecutionContext = {
        workspacePath: '/var/projects/my-app',
        agentId: 'agent-cursor',
        assembledPrompt: prompt,
        sessionId: 'chat-123',
      };

      withEnv(binPath, () => {
        const adapter = new CursorCLIAdapter();

        // 1. model indéfini
        const optsUndefined = adapter.buildCommand(baseCtx);
        assert.deepEqual(optsUndefined.args, [
          '-p',
          '--output-format',
          'json',
          '--resume',
          'chat-123',
          prompt,
        ]);
        assert.ok(!optsUndefined.args.includes('--model'));

        // 2. model = chaîne vide
        const optsEmpty = adapter.buildCommand({ ...baseCtx, model: '' });
        assert.deepEqual(optsEmpty.args, [
          '-p',
          '--output-format',
          'json',
          '--resume',
          'chat-123',
          prompt,
        ]);
        assert.ok(!optsEmpty.args.includes('--model'));

        // 3. model = espaces uniquement
        const optsWhitespace = adapter.buildCommand({ ...baseCtx, model: '    ' });
        assert.deepEqual(optsWhitespace.args, [
          '-p',
          '--output-format',
          'json',
          '--resume',
          'chat-123',
          prompt,
        ]);
        assert.ok(!optsWhitespace.args.includes('--model'));
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_02_5_list_models_returns_parsed_models_from_cli', async () => {
    const tmp = createTempDir('clientsbox-adpt-02-5-list-');
    try {
      const binPath = path.join(tmp.dir, 'agent');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const cliOutput = [
        'Available models',
        '',
        'test-model-a - Test Model A (default)',
        'test-model-b - Test Model B',
        'test-model-c - Test Model C',
        '',
        'Tip: use --model <id> to switch.',
      ].join('\n');

      let spawnCount = 0;
      spawnCtrl?.setFactory(() => {
        spawnCount++;
        return createCliProcess(cliOutput, 0);
      });

      await withEnv(binPath, async () => {
        const adapter = new CursorCLIAdapter();
        assert.equal(typeof adapter.listModels, 'function');
        const models = await adapter.listModels!();

        assert.ok(Array.isArray(models));
        assert.deepEqual(models, ['test-model-a', 'test-model-b', 'test-model-c']);
        assert.equal(spawnCount, 1);

        // Appel subséquent : retour immédiat depuis le cache sans nouveau spawn
        const cachedModels = await adapter.listModels!();
        assert.deepEqual(cachedModels, ['test-model-a', 'test-model-b', 'test-model-c']);
        assert.equal(spawnCount, 1);
      });
    } finally {
      tmp.cleanup();
    }
  });

  it('test_CASE_ADPT_02_5_list_models_fallback_on_cli_failure_or_missing', async () => {
    spawnCtrl?.setFactory(() => createCliProcess('Erreur interne', 1));

    const adapter = new CursorCLIAdapter();
    assert.equal(typeof adapter.listModels, 'function');
    const models = await adapter.listModels!();

    assert.ok(Array.isArray(models));
    assert.deepEqual(models, []);
  });

  it('test_CASE_ADPT_02_5_prepare_run_context_forwards_profile_model', async () => {
    const mockAdapter: CLIAdapter = {
      cliId: 'cursor-cli',
      buildCommand: vi.fn().mockImplementation((ctx: ExecutionContext) => ({
        command: 'cursor',
        args: ctx.model ? ['-p', '--model', ctx.model, '--resume', ctx.sessionId ?? '', ctx.assembledPrompt] : ['-p', '--resume', ctx.sessionId ?? '', ctx.assembledPrompt],
        cwd: ctx.workspacePath,
      })),
      parseStreamLine: (line: string) => ({ type: 'stdout', chunk: line }),
    };

    const mockStore: Partial<ResourceStoreService> = {
      getAgent: vi.fn().mockResolvedValue({
        id: 'ag-1',
        name: 'Agent Test',
        profilId: 'prof-model',
        cliId: 'cursor-cli',
      }),
      getProfil: vi.fn().mockResolvedValue({
        id: 'prof-model',
        name: 'Profil avec modèle',
        systemPrompt: 'Consigne',
        policy: 'chaque_prompt',
        model: 'test-profile-model',
      }),
      getPrompt: vi.fn().mockResolvedValue({
        id: 'pr-1',
        name: 'Prompt',
        content: 'Fais un test',
      }),
      getExitCondition: vi.fn().mockResolvedValue(null),
    };

    const mockSessions = {
      resolve: vi.fn().mockResolvedValue('sess-456'),
      clear: vi.fn(),
      clearAll: vi.fn(),
    } as unknown as ScenarioSessionRegistry;

    const node: ScenarioNode = {
      id: 'run-1',
      type: 'run',
      agentId: 'ag-1',
      promptId: 'pr-1',
      position: { x: 0, y: 0 },
    };

    const runContext = await prepareRunContext({
      node,
      resourceStore: mockStore as ResourceStoreService,
      adapters: [mockAdapter],
      policyInjectionState: new Map(),
      sessions: mockSessions,
      workspacePath: '/app',
    });

    expect(mockAdapter.buildCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'ag-1',
        sessionId: 'sess-456',
        model: 'test-profile-model',
      }),
    );
    expect(runContext.commandSpec.args).toContain('--model');
    expect(runContext.commandSpec.args).toContain('test-profile-model');
  });

  it('test_CASE_ADPT_02_5_prepare_run_context_prioritizes_agent_model_over_profile_model', async () => {
    const mockAdapter = new CursorCLIAdapter();
    vi.spyOn(mockAdapter, 'buildCommand');

    const mockStore: Partial<ResourceStoreService> = {
      getAgent: vi.fn().mockResolvedValue({
        id: 'ag-priority',
        name: 'Agent Prioritaire',
        profilId: 'prof-fallback',
        cliId: 'cursor-cli',
        model: 'agent-specific-model',
      }),
      getProfil: vi.fn().mockResolvedValue({
        id: 'prof-fallback',
        name: 'Profil Fallback',
        systemPrompt: 'Consigne',
        policy: 'chaque_prompt',
        model: 'profile-fallback-model',
      }),
      getPrompt: vi.fn().mockResolvedValue({
        id: 'pr-1',
        name: 'Prompt',
        content: 'Action',
      }),
      getExitCondition: vi.fn().mockResolvedValue(null),
    };

    const mockSessions = {
      resolve: vi.fn().mockResolvedValue('sess-999'),
      clear: vi.fn(),
      clearAll: vi.fn(),
    } as unknown as ScenarioSessionRegistry;

    const node: ScenarioNode = {
      id: 'run-priority',
      type: 'run',
      agentId: 'ag-priority',
      promptId: 'pr-1',
      position: { x: 0, y: 0 },
    };

    const runContext = await prepareRunContext({
      node,
      resourceStore: mockStore as ResourceStoreService,
      adapters: [mockAdapter],
      policyInjectionState: new Map(),
      sessions: mockSessions,
      workspacePath: '/app',
    });

    expect(mockAdapter.buildCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'ag-priority',
        sessionId: 'sess-999',
        model: 'agent-specific-model',
      }),
    );
    expect(runContext.commandSpec.args).toContain('--model');
    expect(runContext.commandSpec.args).toContain('agent-specific-model');
    expect(runContext.commandSpec.args).not.toContain('profile-fallback-model');
  });
});

