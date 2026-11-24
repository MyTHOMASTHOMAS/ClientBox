import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolveClaudeCliBin } from '../../../src/lib/process/env/index.js';
import { ClaudeCLIAdapter } from '../../../src/lib/adapters/claude/claude-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';

const ENV_KEY = 'CLAUDE_CLI_BIN';

function withEnv(value: string | undefined, fn: () => void) {
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

describe('CASE-ADPT-06-2 — validation CLAUDE_CLI_BIN et génération buildCommand (SPEC-ADPT-06)', () => {
  it('test_CASE_ADPT_06_2_claude_cli_bin_validation', () => {
    const handle = createTempDir('clientsbox-adpt-06-2-');
    try {
      const validBin = path.join(handle.dir, 'claude.exe');
      fs.writeFileSync(validBin, '#!/bin/sh\necho ok\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const resolved = resolveClaudeCliBin();
        assert.equal(resolved, validBin);
      });

      withEnv(undefined, () => {
        assert.throws(
          () => resolveClaudeCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /CLAUDE_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv('', () => {
        assert.throws(
          () => resolveClaudeCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /CLAUDE_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv(path.join(handle.dir, 'inexistant.exe'), () => {
        assert.throws(
          () => resolveClaudeCliBin(),
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

  it('test_CASE_ADPT_06_2_build_command_generation_with_model_and_session', () => {
    const handle = createTempDir('clientsbox-adpt-06-2-cmd-');
    try {
      const validBin = path.join(handle.dir, 'claude.exe');
      fs.writeFileSync(validBin, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const adapter = new ClaudeCLIAdapter();
        const prompt = 'Instructions système\n\nCrée le fichier index.ts';

        // 1. Commande initiale sans modèle ni session
        const ctxMin: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'claude-1',
          assembledPrompt: prompt,
        };
        const minCmd = adapter.buildCommand(ctxMin);
        assert.equal(minCmd.command, validBin);
        assert.equal(minCmd.cwd, '/var/projects/demo');
        assert.deepEqual(minCmd.args, [
          '--print',
          '--output-format',
          'stream-json',
          '--verbose',
          '--include-partial-messages',
          '--dangerously-skip-permissions',
          prompt,
        ]);

        // 2. Commande initiale avec modèle
        const ctxModel: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'claude-1',
          assembledPrompt: prompt,
          model: 'sonnet',
        };
        const modelCmd = adapter.buildCommand(ctxModel);
        assert.deepEqual(modelCmd.args, [
          '--print',
          '--output-format',
          'stream-json',
          '--verbose',
          '--include-partial-messages',
          '--dangerously-skip-permissions',
          '--model',
          'sonnet',
          prompt,
        ]);

        // 3. Commande de reprise de session avec modèle
        const ctxResume: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'claude-1',
          assembledPrompt: prompt,
          model: 'opus',
          sessionId: 'session_01j83abc123',
        };
        const resumeCmd = adapter.buildCommand(ctxResume);
        assert.deepEqual(resumeCmd.args, [
          '--resume',
          'session_01j83abc123',
          '--print',
          '--output-format',
          'stream-json',
          '--verbose',
          '--include-partial-messages',
          '--dangerously-skip-permissions',
          '--model',
          'opus',
          prompt,
        ]);

        // 4. Modèle entouré d'espaces nettoyé
        const ctxTrim: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'claude-1',
          assembledPrompt: prompt,
          model: '  haiku  ',
        };
        const trimCmd = adapter.buildCommand(ctxTrim);
        assert.ok(trimCmd.args.includes('haiku'));
        assert.ok(!trimCmd.args.includes('  haiku  '));

        // 5. Modèle vide ignoré et sessionId vide ignoré
        const ctxEmpty: ExecutionContext = {
          workspacePath: '/var/projects/demo',
          agentId: 'claude-1',
          assembledPrompt: prompt,
          model: '   ',
          sessionId: '',
        };
        const emptyCmd = adapter.buildCommand(ctxEmpty);
        assert.ok(!emptyCmd.args.includes('--model'));
        assert.ok(!emptyCmd.args.includes('--resume'));
        assert.equal(emptyCmd.args[emptyCmd.args.length - 1], prompt);
      });
    } finally {
      handle.cleanup();
    }
  });
});

