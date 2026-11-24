import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import childProcess from 'node:child_process';
import { spawnAgent, STOP_GRACE_MS } from '../../../src/lib/process/child-process.spawner.js';

describe('CASE-ENG-04-6 — Délai de grâce STOP_GRACE_MS et escalade temporelle d’arrêt du runner (SPEC-ENG-04 / SPEC-ADPT-03 / SPEC-ARCH-03)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_04_6_runner_stop_grace_period_escalation', () => {
    // 1. Constante STOP_GRACE_MS déterministe égale à 3000 ms
    expect(STOP_GRACE_MS).toBe(3000);

    // 2. Cas nominal : le sous-processus répond et sort spontanément avant expiration du délai (500 ms)
    const childExitListeners: Array<(code: number | null) => void> = [];
    const mockChildFast = {
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn().mockImplementation((ev: string, cb: (code: number | null) => void) => {
        if (ev === 'exit') {
          childExitListeners.push(cb);
        }
      }),
    };

    vi.spyOn(childProcess, 'spawn').mockReturnValueOnce(mockChildFast as any);

    const handleFast = spawnAgent({
      command: 'node',
      args: ['dummy.js'],
      cwd: '/tmp',
      onChunk: vi.fn(),
      onExit: vi.fn(),
    });

    // Déclenchement de l'arrêt
    handleFast.stop();
    // Émission immédiate de SIGTERM
    expect(mockChildFast.kill).toHaveBeenCalledWith('SIGTERM');

    // Le processus se termine au bout de 500 ms
    vi.advanceTimersByTime(500);
    childExitListeners.forEach((fn) => fn(0));

    // On avance au-delà de STOP_GRACE_MS
    vi.advanceTimersByTime(3500);
    // SIGKILL ne doit PAS avoir été appelé puisque le processus a quitté à temps
    expect(mockChildFast.kill).not.toHaveBeenCalledWith('SIGKILL');

    // 3. Cas récalcitrant : le sous-processus ignore SIGTERM et ne quitte pas
    const mockChildSlow = {
      kill: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    };

    vi.spyOn(childProcess, 'spawn').mockReturnValueOnce(mockChildSlow as any);

    const handleSlow = spawnAgent({
      command: 'node',
      args: ['stuck.js'],
      cwd: '/tmp',
      onChunk: vi.fn(),
      onExit: vi.fn(),
    });

    handleSlow.stop();
    expect(mockChildSlow.kill).toHaveBeenCalledWith('SIGTERM');

    // Avancer avant les 3000 ms
    vi.advanceTimersByTime(2999);
    expect(mockChildSlow.kill).not.toHaveBeenCalledWith('SIGKILL');

    // Atteindre les 3000 ms
    vi.advanceTimersByTime(1);
    // Escalade immédiate en SIGKILL
    expect(mockChildSlow.kill).toHaveBeenCalledWith('SIGKILL');
  });
});
