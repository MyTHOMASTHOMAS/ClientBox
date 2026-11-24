import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolveCodexCliBin } from '../../../src/lib/process/env/index.js';
import { CodexCLIAdapter } from '../../../src/lib/adapters/codex/codex-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';

const ENV_KEY = 'CODEX_CLI_BIN';

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

describe('CASE-ADPT-05-2 — validation CODEX_CLI_BIN et génération buildCommand (SPEC-ADPT-05)', () => {
  it('test_CASE_ADPT_05_2_codex_cli_bin_validation', () => {
    const handle = createTempDir('clientsbox-adpt-05-2-');
    try {
      const validBin = path.join(handle.dir, 'codex.exe');
      fs.writeFileSync(validBin, '#!/bin/sh\necho ok\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const resolved = resolveCodexCliBin();
        assert.equal(resolved, validBin);
      });

      withEnv(undefined, () => {
        assert.throws(
          () => resolveCodexCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /CODEX_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv('', () => {
        assert.throws(
          () => resolveCodexCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /CODEX_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv(path.join(handle.dir, 'inexistant.exe'), () => {
        assert.throws(
          () => resolveCodexCliBin(),
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

  it('test_CASE_ADPT_05_2_build_command_generation_with_model_and_session', () => {
    const handle = createTempDir('clientsbox-adpt-05-2-cmd-');
    try {
      const validBin = path.join(handle.dir, 'codex.exe');
      fs.writeFileSync(validBin, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const adapter = new CodexCLIAdapter();
        const prompt = 'Instructions système\n\nCrée le fichier index.ts';

        // 1. Commande initiale sans modèle ni session
        const ctxMin: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'codex-1',
          assembledPrompt: prompt,
        };
        const minCmd = adapter.buildCommand(ctxMin);
        assert.equal(minCmd.command, validBin);
        assert.equal(minCmd.cwd, '/var/projects/demo');
        assert.deepEqual(minCmd.args, [
          'exec',
          '--json',
          '--dangerously-bypass-approvals-and-sandbox',
          prompt,
        ]);

        // 2. Commande initiale avec modèle
        const ctxModel: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'codex-1',
          assembledPrompt: prompt,
          model: 'gpt-5.6-luna',
        };
        const modelCmd = adapter.buildCommand(ctxModel);
        assert.deepEqual(modelCmd.args, [
          'exec',
          '--json',
          '--dangerously-bypass-approvals-and-sandbox',
          '--model',
          'gpt-5.6-luna',
          prompt,
        ]);

        // 3. Commande de reprise de session avec modèle
        const ctxResume: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'codex-1',
          assembledPrompt: prompt,
          model: 'gpt-reserve',
          sessionId: '01a1c467-d234-7020-9cff-1d6cbdfeb8ca',
        };
        const resumeCmd = adapter.buildCommand(ctxResume);
        assert.deepEqual(resumeCmd.args, [
          'exec',
          'resume',
          '--json',
          '--dangerously-bypass-approvals-and-sandbox',
          '--model',
          'gpt-reserve',
          '01a1c467-d234-7020-9cff-1d6cbdfeb8ca',
          prompt,
        ]);

        // 4. Modèle entouré d'espaces nettoyé
        const ctxTrim: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'codex-1',
          assembledPrompt: prompt,
          model: '  gpt-5.6-terra  ',
        };
        const trimCmd = adapter.buildCommand(ctxTrim);
        assert.ok(trimCmd.args.includes('gpt-5.6-terra'));
        assert.ok(!trimCmd.args.includes('  gpt-5.6-terra  '));

        // 5. Modèle vide ignoré
        const ctxEmpty: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'codex-1',
          assembledPrompt: prompt,
          model: '   ',
          sessionId: '',
        };
        const emptyCmd = adapter.buildCommand(ctxEmpty);
        assert.ok(!emptyCmd.args.includes('--model'));
        assert.ok(emptyCmd.args.includes('exec'));
        assert.ok(!emptyCmd.args.includes('resume'));
      });
    } finally {
      handle.cleanup();
    }
  });
});

