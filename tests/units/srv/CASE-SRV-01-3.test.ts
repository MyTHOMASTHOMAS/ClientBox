import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { createLocalHttpServer } from '../../../src/lib/http/loopback-http.server.js';
import { CLIENTSBOX_CLI_SCHEMA } from '../../../src/config/cli-flags.config.js';
import { parseCliArgs, ServerCliParseError } from '../../../src/lib/process/args-parser/index.js';
import { MiniRouter } from '../../../src/lib/http/mini-http.router.js';
import { occupyPort, startEphemeralHttpServer } from '../../helpers/test-server.js';
import { flushPromises } from '../../helpers/flush-promises.js';

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

describe('CASE-SRV-01-3 — arrêt immédiat sur port occupé ou invalide (SPEC-SRV-01)', () => {
  it('test_CASE_SRV_01_3_immediate_exit_on_busy_or_invalid_port', async () => {
    const busy2974 = await occupyPort(2974);
    try {
      await assert.rejects(
        () => startAppServer(2974),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          const code = (err as NodeJS.ErrnoException).code;
          assert.equal(code, 'EADDRINUSE');
          return true;
        },
      );
    } finally {
      await busy2974.release();
    }

    const busy8080 = await occupyPort(8080);
    try {
      const parsed8080 = parseCliArgs(['-p', '8080'], CLIENTSBOX_CLI_SCHEMA);
      const port8080 = Number(parsed8080.values.port);
      assert.equal(port8080, 8080);
      await assert.rejects(
        () => startAppServer(port8080),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.equal((err as NodeJS.ErrnoException).code, 'EADDRINUSE');
          return true;
        },
      );
    } finally {
      await busy8080.release();
    }

    assert.throws(
      () => parseCliArgs(['--port', 'abc'], CLIENTSBOX_CLI_SCHEMA),
      (err: unknown) => {
        assert.ok(err instanceof ServerCliParseError);
        assert.match(String(err), /usage|port|num/i);
        return true;
      },
    );

    for (const argv of [
      ['-p', '0'],
      ['-p', '-1'],
      ['--port', '70000'],
    ] as const) {
      assert.throws(
        () => parseCliArgs(argv, CLIENTSBOX_CLI_SCHEMA),
        (err: unknown) => {
          assert.ok(err instanceof ServerCliParseError);
          assert.match(String(err), /1.*65535|65535|plage/i);
          return true;
        },
      );
    }

    const probe2975 = await startEphemeralHttpServer(undefined, { port: 2975 });
    try {
      assert.equal(probe2975.port, 2975);
    } finally {
      await probe2975.close();
    }
  });
});
