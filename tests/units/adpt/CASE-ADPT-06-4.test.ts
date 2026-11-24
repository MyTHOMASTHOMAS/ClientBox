import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ClaudeCLIAdapter } from '../../../src/lib/adapters/claude/claude-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';

const ENV_KEY = 'CLAUDE_CLI_BIN';

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

describe('CASE-ADPT-06-4 — énumération des modèles supportés via listModels Claude avec cache LRU (SPEC-ADPT-06)', () => {
  it('test_CASE_ADPT_06_4_list_models_returns_supported_models_with_lru_cache', async () => {
    const handle = createTempDir('clientsbox-adpt-06-4-list-');
    try {
      const binPath = path.join(handle.dir, 'claude.exe');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      await withEnv(binPath, async () => {
        const adapter = new ClaudeCLIAdapter();
        assert.equal(typeof adapter.listModels, 'function');
        const models = await adapter.listModels!();

        assert.ok(Array.isArray(models));
        assert.ok(models.includes('sonnet'));
        assert.ok(models.includes('opus'));
        assert.ok(models.includes('haiku'));
        assert.ok(models.includes('claude-sonnet-4-5-20250929'));

        // Appel subséquent : retour immédiat depuis le cache LRU
        const cachedModels = await adapter.listModels!();
        assert.deepEqual(cachedModels, models);
      });
    } finally {
      handle.cleanup();
    }
  });

  it('test_CASE_ADPT_06_4_list_models_returns_empty_array_on_missing_bin_or_failure', async () => {
    await withEnv(undefined, async () => {
      const adapter = new ClaudeCLIAdapter();
      const models = await adapter.listModels!();
      assert.deepEqual(models, []);
    });
  });
});

