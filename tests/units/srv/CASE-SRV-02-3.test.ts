import { describe, it, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import { createLocalHttpServer } from '../../../src/lib/http/loopback-http.server.js';
import { MiniRouter } from '../../../src/lib/http/mini-http.router.js';
import {
  registerGracefulShutdown,
  type GracefulShutdownRegistration,
} from '../../../src/lib/process/graceful-shutdown.manager.js';
import { startEphemeralHttpServer } from '../../helpers/test-server.js';
import { flushPromises } from '../../helpers/flush-promises.js';

function readServerPort(server: { address(): AddressInfo | string | null }): number {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Serveur non lié à un socket TCP.');
  }
  return address.port;
}

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

describe('CASE-SRV-02-3 — arrêt propre du serveur HTTP sur signaux SIGINT/SIGTERM (SPEC-SRV-02)', () => {
  let shutdownRegistration: GracefulShutdownRegistration | undefined;

  afterEach(() => {
    shutdownRegistration?.dispose();
    shutdownRegistration = undefined;
    vi.restoreAllMocks();
  });

  it('test_CASE_SRV_02_3_graceful_http_server_shutdown_on_sigint_sigterm', async () => {
    const port = 9783;
    const handle = await startUiServer(port);
    assert.equal(readServerPort(handle.server), port);

    let exitCode: number | null = null;
    shutdownRegistration = registerGracefulShutdown({
      closeHttpServer: () => handle.close(),
      exit: (code) => {
        exitCode = code;
      },
    });

    await shutdownRegistration.emit('SIGINT');
    await flushPromises();
    assert.equal(exitCode, 0);

    const rebound = await startEphemeralHttpServer(undefined, { port });
    try {
      assert.equal(rebound.port, port);
    } finally {
      await rebound.close();
    }

    const handleTerm = await startUiServer(port);
    let exitCodeTerm: number | null = null;
    const regTerm = registerGracefulShutdown({
      closeHttpServer: () => handleTerm.close(),
      exit: (code) => {
        exitCodeTerm = code;
      },
    });
    await regTerm.emit('SIGTERM');
    await flushPromises();
    regTerm.dispose();
    assert.equal(exitCodeTerm, 0);

    const reboundTerm = await startEphemeralHttpServer(undefined, { port });
    await reboundTerm.close();
  });
});
