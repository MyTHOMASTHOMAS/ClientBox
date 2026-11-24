import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { AntigravityCLIAdapter } from '../../../src/lib/adapters/antigravity/antigravity-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';

const ENV_KEY = 'ANTIGRAVITY_CLI_BIN';

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

describe('CASE-ADPT-04-4 — énumération et parsing des modèles via listModels (SPEC-ADPT-04)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_04_4_list_models_returns_parsed_models_from_antigravity_cli', async () => {
    const handle = createTempDir('clientsbox-adpt-04-4-list-');
    try {
      const binPath = path.join(handle.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const cliOutput = [
        'Fetching available models...',
        'test-model-alpha\tTest Model Alpha (High)',
        'test-model-beta\tTest Model Beta (Low)',
        'test-model-gamma\tTest Model Gamma (Thinking)',
      ].join('\n');

      let spawnCount = 0;
      spawnCtrl?.setFactory(() => {
        spawnCount++;
        return createCliProcess(cliOutput, 0);
      });

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();
        assert.equal(typeof adapter.listModels, 'function');
        const models = await adapter.listModels!();

        assert.ok(Array.isArray(models));
        assert.deepEqual(models, [
          'test-model-alpha',
          'test-model-beta',
          'test-model-gamma',
        ]);
        assert.equal(spawnCount, 1);

        // Appel subséquent : retour immédiat depuis le cache sans nouveau spawn
        const cachedModels = await adapter.listModels!();
        assert.deepEqual(cachedModels, [
          'test-model-alpha',
          'test-model-beta',
          'test-model-gamma',
        ]);
        assert.equal(spawnCount, 1);
      });
    } finally {
      handle.cleanup();
    }
  });

  it('test_CASE_ADPT_04_4_list_models_deduplicates_and_ignores_empty_lines', async () => {
    const handle = createTempDir('clientsbox-adpt-04-4-dedup-');
    try {
      const binPath = path.join(handle.dir, 'agy.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const cliOutput = [
        'Fetching available models...',
        'test-model-alpha\tTest Model Alpha (High)',
        '',
        'test-model-alpha\tTest Model Alpha (High)',
        '   ',
      ].join('\n');

      spawnCtrl?.setFactory(() => createCliProcess(cliOutput, 0));

      await withEnv(binPath, async () => {
        const adapter = new AntigravityCLIAdapter();
        const models = await adapter.listModels!();
        assert.deepEqual(models, ['test-model-alpha']);
      });
    } finally {
      handle.cleanup();
    }
  });

  it('test_CASE_ADPT_04_4_list_models_fallback_on_cli_failure_or_missing', async () => {
    spawnCtrl?.setFactory(() => createCliProcess('Erreur commande', 1));

    const adapter = new AntigravityCLIAdapter();
    assert.equal(typeof adapter.listModels, 'function');
    const models = await adapter.listModels!();

    assert.ok(Array.isArray(models));
    assert.deepEqual(models, []);
  });
});

