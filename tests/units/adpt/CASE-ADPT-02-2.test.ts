import { describe, it, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import { installSpawnMock, type SpawnMockController } from '../../helpers/mock-spawn.js';

const ENV_KEY = 'CURSOR_CLI_BIN';

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

describe('CASE-ADPT-02-2 — génération de commande -p --resume avec prompt et cwd (SPEC-ADPT-02)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
  });

  it('test_CASE_ADPT_02_2_cursor_cli_command_generation_with_prompt_and_cwd', () => {
    const handle = createTempDir('clientsbox-adpt-02-2-');
    try {
      const binPath = path.join(handle.dir, 'agent');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const prompt = 'Directives système\n\nRefactorise le composant Button';
      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/my-app',
        agentId: 'agent-cursor',
        assembledPrompt: prompt,
        sessionId: 'chat-123',
      };

      withEnv(binPath, () => {
        const adapter = new CursorCLIAdapter();
        const options = adapter.buildCommand(ctx);

        assert.equal(options.command, binPath);
        assert.equal(options.cwd, '/var/projects/my-app');
        // Prompt multi-lignes intact, en dernier argument (R-45)
        assert.deepEqual(options.args, [
          '-p',
          '--output-format',
          'json',
          '--resume',
          'chat-123',
          prompt,
        ]);
        assert.ok(!options.args.includes('--print'));
        assert.ok(!options.args.includes('--clear-context'));

        // Aucun Run hors session : contexte sans sessionId refusé
        const { sessionId: _omitted, ...withoutSession } = ctx;
        assert.throws(
          () => adapter.buildCommand(withoutSession),
          (err: unknown) => err instanceof Error && /session/i.test(err.message),
        );
      });

      assert.equal(spawnCtrl?.spawns.length ?? 0, 0);
    } finally {
      handle.cleanup();
    }
  });
});
