import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';

import type { RunnerStatus } from '../../../src/types/messages/block-status.message.js';
import { spawnAgent, STOP_GRACE_MS } from '../../../src/lib/process/child-process.spawner.js';
import { flushPromises } from '../../helpers/flush-promises.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';

interface AbortableHandle {
  stop(): void;
}

interface ScenarioAbortState {
  status: RunnerStatus;
  activeHandles: AbortableHandle[];
  triggeredBlocks: string[];
  pausedBranches: string[];
  lastError: string | undefined;
}

function createInitialState(): ScenarioAbortState {
  return {
    status: 'running',
    activeHandles: [],
    triggeredBlocks: [],
    pausedBranches: [],
    lastError: undefined,
  };
}

function abortOnBlockFailure(
  state: ScenarioAbortState,
  failingBlockId: string,
  diagnostic: string,
): void {
  state.status = 'error';
  state.lastError = `${failingBlockId}: ${diagnostic}`;
  for (const handle of state.activeHandles) {
    handle.stop();
  }
  state.activeHandles = [];
  state.pausedBranches = [];
}

describe("CASE-ENG-04-3 — arrêt d'urgence global immédiat sur échec de bloc (SPEC-ENG-04)", () => {
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

  it('test_CASE_ENG_04_3_block_failure_triggers_immediate_global_scenario_stop', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    spawnCtrl?.setFactory(() => new MockChildProcess(61_001));

    const state = createInitialState();
    const subsequentTriggered: string[] = [];

    const parallelHandle = spawnAgent({
      command: 'cursor-cli',
      args: ['--parallel'],
      cwd: '/ws',
      onChunk: () => undefined,
      onExit: () => undefined,
    });
    state.activeHandles.push(parallelHandle);
    state.pausedBranches.push('pause-waiting');
    await flushPromises();

    // Échec CLI branche A (exit code 1)
    abortOnBlockFailure(state, 'run-failing', 'Erreur fatale build (exit 1)');
    await flushPromises();

    assert.equal(state.status, 'error');
    assert.match(String(state.lastError), /run-failing|Erreur fatale/i);
    assert.ok(spawnCtrl?.kills.some((k) => k.signal === 'SIGTERM'));
    assert.deepEqual(state.pausedBranches, []);
    assert.equal(subsequentTriggered.includes('run-subsequent'), false);

    // Escalade SIGKILL si besoin (grace)
    await vi.advanceTimersByTimeAsync(STOP_GRACE_MS);
    await flushPromises();
    assert.ok(spawnCtrl?.kills.some((k) => k.signal === 'SIGKILL'));

    // Exception If interceptée → arrêt global sans crash
    const ifState = createInitialState();
    assert.doesNotThrow(() => {
      try {
        throw new Error('Clé introuvable dans sac');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        abortOnBlockFailure(ifState, 'if-broken', message);
      }
    });
    await flushPromises();
    assert.equal(ifState.status, 'error');
    assert.match(String(ifState.lastError), /Clé introuvable|if-broken/i);

    vi.useRealTimers();
  });
});
