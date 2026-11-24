import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';

import { spawnAgent, STOP_GRACE_MS } from '../../../src/lib/process/child-process.spawner.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { flushPromises } from '../../helpers/flush-promises.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';

describe("CASE-ADPT-03-1 — arrêt manuel sans effet sur les sessions (SPEC-ADPT-03)", () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
    try {
      vi.useRealTimers();
    } catch {
      // timers non activés
    }
  });

  it('test_CASE_ADPT_03_1_manual_stop_kills_process_without_clearing_session', async () => {
    assert.equal(STOP_GRACE_MS, 3000);

    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    const adapter = new CursorCLIAdapter();
    const createSessionSpy = vi.spyOn(adapter, 'createSession');

    spawnCtrl?.setFactory(() => new MockChildProcess(51_001));

    const handle = spawnAgent({
      command: 'cursor-cli',
      args: ['--mock-run'],
      cwd: '/tmp/workspace',
      onChunk: () => undefined,
      onExit: () => undefined,
    });

    await flushPromises();
    const child = spawnCtrl?.getLastProcess();
    assert.ok(child !== undefined);

    // Stop immédiat → SIGTERM ; aucune création/réinitialisation de session (Stop ≠ Clear, R-24)
    handle.stop();
    await flushPromises();
    assert.ok(spawnCtrl?.kills.some((k) => k.signal === 'SIGTERM'));
    assert.equal(createSessionSpy.mock.calls.length, 0);

    // Escalade déterministe après STOP_GRACE_MS si non terminé
    await vi.advanceTimersByTimeAsync(STOP_GRACE_MS);
    await flushPromises();
    assert.ok(spawnCtrl?.kills.some((k) => k.signal === 'SIGKILL'));
    assert.equal(createSessionSpy.mock.calls.length, 0);

    // Seul le processus du Run a été lancé : aucune commande de session (create-chat, reset)
    assert.equal(spawnCtrl?.spawns.length, 1);
    assert.ok(!spawnCtrl?.spawns.some((s) => s.args.includes('create-chat')));

    vi.useRealTimers();
  });
});
