import { describe, it, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import { createLocalHttpServer } from '../../../src/lib/http/loopback-http.server.js';
import { CLIENTSBOX_CLI_SCHEMA } from '../../../src/config/cli-flags.config.js';
import { parseCliArgs } from '../../../src/lib/process/args-parser/index.js';
import { MiniRouter } from '../../../src/lib/http/mini-http.router.js';
import { httpGetOk } from '../../helpers/test-server.js';
import { flushPromises } from '../../helpers/flush-promises.js';

function readServerPort(server: { address(): AddressInfo | string | null }): number {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Serveur non lié à un socket TCP.');
  }
  return address.port;
}

function minimalRouter(): MiniRouter {
  return new MiniRouter();
}

async function startAppServer(port: number) {
  const handle = await createLocalHttpServer({
    port,
    router: minimalRouter(),
  });
  await flushPromises();
  return handle;
}

describe('CASE-SRV-01-1 — démarrage sur le port par défaut 2974 (SPEC-SRV-01)', () => {
  const activeServers: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    while (activeServers.length > 0) {
      const server = activeServers.pop();
      if (server !== undefined) {
        await server.close();
      }
    }
  });

  it('test_CASE_SRV_01_1_default_port_startup_on_2974', async () => {
    const parsed = parseCliArgs([], CLIENTSBOX_CLI_SCHEMA);
    const port = Number(parsed.values.port);
    assert.equal(port, 2974);

    const handle = await startAppServer(port);
    activeServers.push(handle);

    assert.equal(readServerPort(handle.server), 2974);
    const status = await httpGetOk('http://localhost:2974');
    assert.ok(status >= 200 && status < 500);
  });
});
