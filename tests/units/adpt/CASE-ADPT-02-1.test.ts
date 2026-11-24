import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolveCursorCliBin } from '../../../src/lib/process/env/index.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import { installSpawnMock, type SpawnMockController } from '../../helpers/mock-spawn.js';

const ENV_KEY = 'CURSOR_CLI_BIN';

function withEnv(value: string | undefined, fn: () => void): void {
  const previous = process.env[ENV_KEY];
  try {
    if (value === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = value;
    }
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = previous;
    }
  }
}

describe("CASE-ADPT-02-1 — validation variable d'environnement CURSOR_CLI_BIN (SPEC-ADPT-02)", () => {
  let spawnCtrl: SpawnMockController | undefined;

  beforeEach(() => {
    spawnCtrl = installSpawnMock();
  });

  afterEach(() => {
    spawnCtrl?.restore();
    spawnCtrl = undefined;
  });

  it('test_CASE_ADPT_02_1_cursor_cli_bin_environment_variable_validation', () => {
    const handle = createTempDir('clientsbox-adpt-02-1-');
    try {
      const validBin = path.join(handle.dir, 'cursor-agent');
      fs.writeFileSync(validBin, '#!/bin/sh\necho ok\n', 'utf8');
      fs.chmodSync(validBin, 0o755);

      withEnv(validBin, () => {
        const resolved = resolveCursorCliBin();
        assert.equal(resolved, validBin);
      });

      withEnv(undefined, () => {
        assert.throws(
          () => resolveCursorCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /CURSOR_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv('', () => {
        assert.throws(
          () => resolveCursorCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /CURSOR_CLI_BIN|obligatoire|manquante|vide/i);
            return true;
          },
        );
      });

      withEnv('/invalid/path/to/cursor', () => {
        assert.throws(
          () => resolveCursorCliBin(),
          (err: unknown) => {
            assert.ok(err instanceof Error);
            assert.match(String(err), /introuvable|exécutable|inexistant|accessible/i);
            return true;
          },
        );
      });

      const nonExec = path.join(handle.dir, 'not-exec');
      fs.writeFileSync(nonExec, '#!/bin/sh\n', 'utf8');
      if (process.platform === 'win32') {
        const accessSpy = vi.spyOn(fs, 'accessSync').mockImplementationOnce(() => {
          throw new Error('EACCES: permission denied');
        });
        withEnv(nonExec, () => {
          assert.throws(
            () => resolveCursorCliBin(),
            (err: unknown) => {
              assert.ok(err instanceof Error);
              assert.match(String(err), /exécutable|permission|accessible/i);
              return true;
            },
          );
        });
        accessSpy.mockRestore();
      } else {
        fs.chmodSync(nonExec, 0o644);
        withEnv(nonExec, () => {
          assert.throws(
            () => resolveCursorCliBin(),
            (err: unknown) => {
              assert.ok(err instanceof Error);
              assert.match(String(err), /exécutable|permission|accessible/i);
              return true;
            },
          );
        });
      }

      // ADR-006 : aucune invocation réelle de spawn pendant la validation
      assert.equal(spawnCtrl?.spawns.length ?? 0, 0);
    } finally {
      handle.cleanup();
    }
  });
});
