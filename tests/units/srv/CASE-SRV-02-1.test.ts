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

describe('CASE-SRV-02-1 — distribution des fichiers statiques UI à la racine HTTP (SPEC-SRV-02)', () => {
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

  it('test_CASE_SRV_02_1_static_ui_files_distribution_on_http_root', async () => {
    const port = 9781;
    const handle = await startUiServer(port);
    activeServers.push(handle);

    const root = await httpGetSnapshot(`http://localhost:${port}/`);
    assert.equal(root.statusCode, 200);
    assert.ok(root.contentType?.includes('text/html'));
    assert.match(root.body, /ClientsBox/);

    const script = await httpGetSnapshot(`http://localhost:${port}/assets/app.js`);
    assert.equal(script.statusCode, 200);
    assert.ok(
      script.contentType?.includes('javascript') ?? script.contentType?.includes('text/javascript'),
    );

    const styles = await httpGetSnapshot(`http://localhost:${port}/styles/app.css`);
    assert.equal(styles.statusCode, 200);
    assert.ok(styles.contentType?.includes('css'));

    const missing = await httpGetSnapshot(`http://localhost:${port}/inexistant.xyz`);
    assert.equal(missing.statusCode, 404);

    const after404 = await httpGetSnapshot(`http://localhost:${port}/`);
    assert.equal(after404.statusCode, 200);
  });
});
