import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolveAntigravityCliBin } from '../../../src/lib/process/env/index.js';
import { AntigravityCLIAdapter } from '../../../src/lib/adapters/antigravity/antigravity-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';

const ENV_KEY = 'ANTIGRAVITY_CLI_BIN';

function withEnv(value: string | undefined, fn: () => void): void {
  const previous = process.env[ENV_KEY];
  try {
    if (value === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = value;
    }
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
  }
}

describe('CASE-ADPT-04-2 — validation ANTIGRAVITY_CLI_BIN et génération buildCommand (SPEC-ADPT-04)', () => {
  it('test_CASE_ADPT_04_2_antigravity_cli_bin_validation', () => {
    const handle = createTempDir('clientsbox-adpt-04-2-');
    try {
      const validBin = path.join(handle.dir, 'agy.exe');
      fs.writeFileSync(validBin, '#!/bin/sh\necho ok\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const resolved = resolveAntigravityCliBin();
        assert.equal(resolved, validBin);
      });

      withEnv(undefined, () => {
        assert.throws(
          () => resolveAntigravityCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /ANTIGRAVITY_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv('', () => {
        assert.throws(
          () => resolveAntigravityCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /ANTIGRAVITY_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv(path.join(handle.dir, 'inexistant.exe'), () => {
        assert.throws(
          () => resolveAntigravityCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /introuvable|inexistant/i);
            return true;
          },
        );
      });
    } finally {
      handle.cleanup();
    }
  });

  it('test_CASE_ADPT_04_2_build_command_generation_with_model_and_session', () => {
    const handle = createTempDir('clientsbox-adpt-04-2-cmd-');
    try {
      const validBin = path.join(handle.dir, 'agy.exe');
      fs.writeFileSync(validBin, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const adapter = new AntigravityCLIAdapter();
        const prompt = 'Instructions système\n\nCrée le fichier index.ts';

        // 1. Commande minimale sans modèle ni session
        const ctxMin: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'agy-1',
          assembledPrompt: prompt,
        };
        const minCmd = adapter.buildCommand(ctxMin);
        assert.equal(minCmd.command, validBin);
        assert.equal(minCmd.cwd, '/var/projects/demo');
        assert.deepEqual(minCmd.args, [
          '--dangerously-skip-permissions',
          '--output-format',
          'stream-json',
          '--print',
          prompt,
        ]);

        // 2. Commande avec modèle nominal
        const ctxModel: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'agy-1',
          assembledPrompt: prompt,
          model: 'test-model-custom',
        };
        const modelCmd = adapter.buildCommand(ctxModel);
        assert.deepEqual(modelCmd.args, [
          '--dangerously-skip-permissions',
          '--output-format',
          'stream-json',
          '--model',
          'test-model-custom',
          '--print',
          prompt,
        ]);

        // 3. Commande avec modèle et session conversationnelle
        const ctxFull: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'agy-1',
          assembledPrompt: prompt,
          model: 'test-model-custom',
          sessionId: 'conv-abc-123',
        };
        const fullCmd = adapter.buildCommand(ctxFull);
        assert.deepEqual(fullCmd.args, [
          '--dangerously-skip-permissions',
          '--output-format',
          'stream-json',
          '--model',
          'test-model-custom',
          '--conversation',
          'conv-abc-123',
          '--print',
          prompt,
        ]);

        // 4. Modèle entouré d'espaces (nettoyage trim)
        const ctxTrim: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'agy-1',
          assembledPrompt: prompt,
          model: '  test-model-spaced  ',
        };
        const trimCmd = adapter.buildCommand(ctxTrim);
        assert.deepEqual(trimCmd.args, [
          '--dangerously-skip-permissions',
          '--output-format',
          'stream-json',
          '--model',
          'test-model-spaced',
          '--print',
          prompt,
        ]);

        // 5. Modèle et session vides ou composés d'espaces
        const ctxEmpty: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'agy-1',
          assembledPrompt: prompt,
          model: '   ',
          sessionId: '',
        };
        const emptyCmd = adapter.buildCommand(ctxEmpty);
        assert.deepEqual(emptyCmd.args, [
          '--dangerously-skip-permissions',
          '--output-format',
          'stream-json',
          '--print',
          prompt,
        ]);
      });
    } finally {
      handle.cleanup();
    }
  });
});

