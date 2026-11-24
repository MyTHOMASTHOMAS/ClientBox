/**
 * CASE-ARCH-03-4 — Spawner LIB-004 : escalade SIGTERM → SIGKILL
 * après STOP_GRACE_MS = 3000 ms (`AC-ARCH-03-4` / `SPEC-ARCH-03`).
 *
 * Module cible : `src/lib/process/spawner.ts` (`spawnAgent`, `STOP_GRACE_MS`).
 * Harnais : `installSpawnMock` + `vi.useFakeTimers` (ADR-006 / checklist CASE).
 *
 * Nom de test : contrat fiche CASE (= prompt §1, alignés).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { spawnAgent, STOP_GRACE_MS } from '../../../src/lib/process/child-process.spawner.js';
import { flushPromises } from '../../helpers/flush-promises.js';
import {
  installSpawnMock,
  MockChildProcess,
  type SpawnMockController,
} from '../../helpers/mock-spawn.js';

/** Oracles table CASE — signaux d'arrêt. */
const EXPECTED_INITIAL_SIGNAL = 'SIGTERM';
const EXPECTED_ESCALATION_SIGNAL = 'SIGKILL';

describe('CASE-ARCH-03-4 — escalade SIGTERM / SIGKILL spawner (SPEC-ARCH-03)', () => {
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

  it('test_CASE_ARCH_03_4_spawner_sigterm_sigkill_escalation', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    spawnCtrl?.setFactory(() => new MockChildProcess(52_004));

    const handle = spawnAgent({
      command: 'cursor-cli',
      args: ['--arch-03-4'],
      cwd: '/tmp/workspace-arch-03-4',
      onChunk: () => undefined,
      onExit: () => undefined,
    });

    await flushPromises();

    handle.stop();
    await flushPromises();

    const killsAfterStop = spawnCtrl?.kills ?? [];
    const initialSignal = killsAfterStop.some((k) => k.signal === 'SIGTERM')
      ? EXPECTED_INITIAL_SIGNAL
      : 'AUCUN_SIGTERM';
    const sigkillPremature = killsAfterStop.some((k) => k.signal === 'SIGKILL');

    // Alors le signal SIGTERM est immédiatement transmis au processus
    expect(initialSignal).toBe(EXPECTED_INITIAL_SIGNAL);

    // Pas d'escalade avant STOP_GRACE_MS (Données CASE = 3000)
    await vi.advanceTimersByTimeAsync(STOP_GRACE_MS - 1);
    await flushPromises();
    const killsBeforeGrace = spawnCtrl?.kills ?? [];
    const sigkillBeforeGrace = killsBeforeGrace.some((k) => k.signal === 'SIGKILL');

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    const killsAfterGrace = spawnCtrl?.kills ?? [];
    const sigkillAfterGrace = killsAfterGrace.some((k) => k.signal === 'SIGKILL');

    const escalationSignal =
      !sigkillPremature && !sigkillBeforeGrace && sigkillAfterGrace && STOP_GRACE_MS === 3000
        ? EXPECTED_ESCALATION_SIGNAL
        : 'ESCALADE_INCORRECTE';

    // Et si le processus ne s'est pas terminé après 3000 ms, un signal SIGKILL est envoyé
    expect(escalationSignal).toBe(EXPECTED_ESCALATION_SIGNAL);

    vi.useRealTimers();
  });
});
