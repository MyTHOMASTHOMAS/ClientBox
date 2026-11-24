import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { CodexCLIAdapter } from '../../../src/lib/adapters/codex/codex-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';

const ENV_KEY = 'CODEX_CLI_BIN';

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

describe('CASE-ADPT-05-4 — énumération et parsing des modèles via listModels Codex (SPEC-ADPT-05)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_05_4_list_models_returns_parsed_models_from_codex_cli', async () => {
    const handle = createTempDir('clientsbox-adpt-05-4-list-');
    try {
      const binPath = path.join(handle.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const cliJsonOutput = JSON.stringify({
        models: [
          { slug: 'gpt-reserve', display_name: 'GPT-Reserve' },
          { slug: 'gpt-6-luna', display_name: 'GPT-6 Luna' },
          { slug: 'gpt-5.6-terra', display_name: 'GPT-5.6 Terra' },
        ],
      });

      let spawnCount = 0;
      spawnCtrl?.setFactory((command, args) => {
        assert.ok(args.includes('debug'));
        assert.ok(args.includes('models'));
        spawnCount++;
        return createCliProcess(cliJsonOutput, 0);
      });

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        assert.equal(typeof adapter.listModels, 'function');
        const models = await adapter.listModels!();

        assert.ok(Array.isArray(models));
        assert.deepEqual(models, ['gpt-reserve', 'gpt-6-luna', 'gpt-5.6-terra']);
        assert.equal(spawnCount, 1);

        // Appel subséquent : retour immédiat depuis le cache sans nouveau spawn
        const cachedModels = await adapter.listModels!();
        assert.deepEqual(cachedModels, models);
        assert.equal(spawnCount, 1);
      });
    } finally {
      handle.cleanup();
    }
  });

  it('test_CASE_ADPT_05_4_list_models_deduplicates_and_trims_models', async () => {
    const handle = createTempDir('clientsbox-adpt-05-4-dedup-');
    try {
      const binPath = path.join(handle.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const cliJsonOutput = JSON.stringify({
        models: [
          { slug: '  gpt-reserve  ' },
          { slug: 'gpt-reserve' },
          { slug: '   ' },
          { slug: 'gpt-5.6-luna' },
        ],
      });

      spawnCtrl?.setFactory(() => createCliProcess(cliJsonOutput, 0));

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        const models = await adapter.listModels!();
        assert.deepEqual(models, ['gpt-reserve', 'gpt-5.6-luna']);
      });
    } finally {
      handle.cleanup();
    }
  });

  it('test_CASE_ADPT_05_4_list_models_returns_empty_array_on_failure_or_missing_bin', async () => {
    // 1. Commande qui échoue avec code 1
    spawnCtrl?.setFactory(() => createCliProcess('', 1));

    const handle = createTempDir('clientsbox-adpt-05-4-fail-');
    try {
      const binPath = path.join(handle.dir, 'codex.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      await withEnv(binPath, async () => {
        const adapter = new CodexCLIAdapter();
        const models = await adapter.listModels!();
        assert.deepEqual(models, []);
      });
    } finally {
      handle.cleanup();
    }

    // 2. Binaire manquant
    await withEnv(undefined, async () => {
      const adapter = new CodexCLIAdapter();
      const models = await adapter.listModels!();
      assert.deepEqual(models, []);
    });
  });
});

