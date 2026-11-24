import { describe, it, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createLocalHttpServer } from '../../../src/lib/http/loopback-http.server.js';
import { MiniRouter } from '../../../src/lib/http/mini-http.router.js';
import { flushPromises } from '../../helpers/flush-promises.js';

interface HttpResponseSnapshot {
  readonly statusCode: number;
  readonly contentType: string | undefined;
  readonly body: string;
  readonly location: string | undefined;
}

function httpGetSnapshot(url: string): Promise<HttpResponseSnapshot> {
  return new Promise<HttpResponseSnapshot>((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode ?? 0,
          contentType: res.headers['content-type'],
          body: Buffer.concat(chunks).toString('utf8'),
          location: res.headers.location,
        });
      });
    });
    req.on('error', reject);
  });
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

describe('CASE-SRV-02-4 — fonctionnement local mono-utilisateur sans authentification ni sandbox (SPEC-SRV-02)', () => {
  const activeServers: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    while (activeServers.length > 0) {
      const server = activeServers.pop();
      if (server !== undefined) {
        await server.close();
      }
    }
    vi.restoreAllMocks();
  });

  it('test_CASE_SRV_02_4_local_single_user_operation_without_auth_or_sandbox', async () => {
    const port = 9784;
    const handle = await startUiServer(port);
    activeServers.push(handle);

    const routes = [`http://localhost:${port}/`, `http://localhost:${port}/api/health`];
    for (const url of routes) {
      const res = await httpGetSnapshot(url);
      assert.equal(res.statusCode, 200);
      assert.notEqual(res.statusCode, 401);
      assert.notEqual(res.statusCode, 403);
      if (res.location !== undefined) {
        assert.doesNotMatch(res.location, /login/i);
      }
    }
  });
});
