import { describe, it, expect, vi } from 'vitest';
import { registerGracefulShutdown } from '../../../src/lib/process/graceful-shutdown.manager.js';

describe("CASE-ADPT-03-5 — Nettoyage et non-prolifération des sous-processus CLI orphelins en cas d'interruption du serveur (SPEC-ADPT-03 / SPEC-SRV-01)", () => {
  it('test_CASE_ADPT_03_5_server_shutdown_child_process_orphan_cleanup', async () => {
    // 1. Simuler un sous-processus actif supervisé par un runner ou spawner
    const activeChildProcess = {
      pid: 9999,
      killed: false,
      kill: vi.fn().mockImplementation((signal?: string) => {
        activeChildProcess.killed = true;
        return true;
      }),
      stdout: { destroyed: false, destroy: vi.fn().mockImplementation(() => { activeChildProcess.stdout.destroyed = true; }) },
      stderr: { destroyed: false, destroy: vi.fn().mockImplementation(() => { activeChildProcess.stderr.destroyed = true; }) },
    };

    const activeSpawnHandle = {
      stop: vi.fn().mockImplementation(() => {
        activeChildProcess.kill('SIGTERM');
        activeChildProcess.stdout.destroy();
        activeChildProcess.stderr.destroy();
      }),
    };

    const stopActiveRunners = vi.fn().mockImplementation(async () => {
      activeSpawnHandle.stop();
    });

    const closeHttpServer = vi.fn().mockResolvedValue(undefined);
    const exitMock = vi.fn();

    // 2. Enregistrer le gestionnaire d'arrêt gracieux
    const shutdownRegistration = registerGracefulShutdown({
      closeHttpServer,
      exit: exitMock,
      stopActiveRunners,
    });

    try {
      // 3. Déclencher le signal d'interruption du serveur (SIGINT)
      await shutdownRegistration.emit('SIGINT');

      // 4. Vérifier que la terminaison des sous-processus a bien été ordonnée
      expect(stopActiveRunners).toHaveBeenCalled();
      expect(activeSpawnHandle.stop).toHaveBeenCalled();
      expect(activeChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(activeChildProcess.killed).toBe(true);

      // Vérifier que le serveur HTTP et le processus se sont arrêtés proprement
      expect(closeHttpServer).toHaveBeenCalled();
      expect(exitMock).toHaveBeenCalledWith(0);
    } finally {
      shutdownRegistration.dispose();
    }
  });
});
