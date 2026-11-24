import { describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { createLocalHttpServer } from '../../../src/lib/http/loopback-http.server.js';
import { MiniRouter } from '../../../src/lib/http/mini-http.router.js';
import { registerGracefulShutdown } from '../../../src/lib/process/graceful-shutdown.manager.js';
import { startEphemeralHttpServer } from '../../helpers/test-server.js';
import { flushPromises } from '../../helpers/flush-promises.js';
import { installSpawnMock } from '../../helpers/mock-spawn.js';

function buildRouterWithLocalApi(): MiniRouter {
  const router = new MiniRouter();
  router.get('/api/health', (_req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true }));
  });
  return router;
}

async function startUiServer(port: number) {
  const handle = await createLocalHttpServer({
    port,
    router: buildRouterWithLocalApi(),
  });
  await flushPromises();
  return handle;
}

describe('CASE-SRV-02-5 — propagation des signaux OS aux sous-processus CLI (SPEC-SRV-02)', () => {
  async function assertSignalCascade(signal: 'SIGINT' | 'SIGTERM', port: number): Promise<void> {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    const spawnCtrl = installSpawnMock();
    try {
      const handle = await startUiServer(port);
      childProcess.spawn('cursor-cli', ['--mock-active-run']);
      await flushPromises();
      const activeChild = spawnCtrl.getLastProcess();
      assert.ok(activeChild !== undefined);

      let runnerStopped = false;
      let exitCode: number | null = null;

      const registration = registerGracefulShutdown({
        closeHttpServer: () => handle.close(),
        stopActiveRunners: async () => {
          runnerStopped = true;
          activeChild.kill('SIGTERM');
          await vi.advanceTimersByTimeAsync(3000);
          activeChild.kill('SIGKILL');
          activeChild.emitExit(0);
        },
        exit: (code) => {
          exitCode = code;
        },
      });

      await registration.emit(signal);
      await flushPromises();
      registration.dispose();

      assert.equal(runnerStopped, true);
      assert.equal(exitCode, 0);
      assert.ok(spawnCtrl.kills.some((k) => k.signal === 'SIGTERM' || k.signal === 'SIGKILL'));

      const rebound = await startEphemeralHttpServer(undefined, { port });
      await rebound.close();
    } finally {
      spawnCtrl.restore();
      vi.useRealTimers();
    }
  }

  it('test_CASE_SRV_02_5_os_signal_cascades_to_cli_subprocess', async () => {
    await assertSignalCascade('SIGINT', 9785);
    await assertSignalCascade('SIGTERM', 9786);
  });
});
