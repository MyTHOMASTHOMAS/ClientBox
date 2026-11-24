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

describe('CASE-SRV-01-2 — surcharge dynamique du port via options CLI (SPEC-SRV-01)', () => {
  const activeServers: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    while (activeServers.length > 0) {
      const server = activeServers.pop();
      if (server !== undefined) {
        await server.close();
      }
    }
  });

  it('test_CASE_SRV_01_2_dynamic_port_override_via_cli_options', async () => {
    const cases: Array<{ argv: readonly string[]; expectedPort: number }> = [
      { argv: ['-p', '8080'], expectedPort: 8080 },
      { argv: ['--port', '3000'], expectedPort: 3000 },
      { argv: ['--port=4200'], expectedPort: 4200 },
    ];

    for (const { argv, expectedPort } of cases) {
      const parsed = parseCliArgs(argv, CLIENTSBOX_CLI_SCHEMA);
      const port = Number(parsed.values.port);
      assert.equal(port, expectedPort);

      const handle = await startAppServer(port);
      activeServers.push(handle);
      assert.equal(readServerPort(handle.server), expectedPort);

      const status = await httpGetOk(`http://127.0.0.1:${expectedPort}`);
      assert.ok(status >= 200 && status < 500);
    }
  });
});
