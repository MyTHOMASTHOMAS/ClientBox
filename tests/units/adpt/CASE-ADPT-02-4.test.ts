import { describe, it, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionContext } from '../../../src/types/contracts/cli-adapter.contract.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';

const ENV_KEY = 'CURSOR_CLI_BIN';

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

/** Processus simulé : imprime `stdout`, ferme le flux, puis sort avec `code`. */
function createChatProcess(stdout: string, code: number): MockChildProcess {
  const proc = new MockChildProcess();
  queueMicrotask(() => {
    if (stdout !== '') proc.writeStdout(stdout);
    proc.stdout.end();
    proc.stderr.end();
    setImmediate(() => proc.emitExit(code));
  });
  return proc;
}

describe('CASE-ADPT-02-4 — createSession via create-chat (SPEC-ADPT-02)', () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
  });

  it('test_CASE_ADPT_02_4_cursor_cli_create_session_via_create_chat', async () => {
    const tmp = createTempDir('clientsbox-adpt-02-4-');
    try {
      const binPath = path.join(tmp.dir, 'agent');
      fs.writeFileSync(binPath, '#!/bin/sh\n', 'utf8');
      fs.chmodSync(binPath, 0o755);

      const ctx: ExecutionContext = {
        workspacePath: '/var/projects/my-app',
        agentId: 'agent-cursor',
        assembledPrompt: '',
      };

      await withEnv(binPath, async () => {
        const adapter = new CursorCLIAdapter();

        spawnCtrl?.setFactory(() => createChatProcess('chat-123\n', 0));
        assert.equal(await adapter.createSession(ctx), 'chat-123');
        const spawn = spawnCtrl?.getLastSpawn();
        assert.ok(spawn !== undefined);
        assert.equal(spawn.command, binPath);
        assert.deepEqual(spawn.args, ['create-chat']);
        assert.equal(spawn.options?.cwd, '/var/projects/my-app');

        spawnCtrl?.setFactory(() => createChatProcess('  \n chat-456 \n', 0));
        assert.equal(await adapter.createSession(ctx), 'chat-456');

        spawnCtrl?.setFactory(() => createChatProcess('', 1));
        await assert.rejects(
          () => adapter.createSession(ctx),
          (err: unknown) => err instanceof Error && /session|create-chat|échec/i.test(err.message),
        );

        spawnCtrl?.setFactory(() => createChatProcess('', 0));
        await assert.rejects(
          () => adapter.createSession(ctx),
          (err: unknown) => err instanceof Error && /session|identifiant|create-chat/i.test(err.message),
        );
      });
    } finally {
      tmp.cleanup();
    }
  });
});
