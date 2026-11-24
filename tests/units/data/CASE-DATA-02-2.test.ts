import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import { loadIfScript, runIfScript } from '../../../src/lib/fs/dynamic-module-loader.fs.js';
import { createTempDir } from '../../helpers/temp-dir.js';

function ifDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.agents', 'data', 'if');
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function sacWithValue(value: string): BlockInputBag {
  return {
    input0: {
      blockType: 'run',
      value,
      power: 1,
    },
  };
}

describe('CASE-DATA-02-2 — exécution de la fonction If retournant un booléen (SPEC-DATA-02)', () => {
  it('test_CASE_DATA_02_2_if_function_execution_returns_boolean', async () => {
    const handle = createTempDir('clientsbox-data-02-2-');
    try {
      const scriptsDir = ifDir(handle.dir);

      const cjsPath = path.join(scriptsDir, 'check-status.js');
      writeFile(
        cjsPath,
        "module.exports = function(sac) { return sac.input0.value === 'SUCCESS'; };",
      );

      const loaded = await loadIfScript(cjsPath);
      assert.equal(typeof loaded, 'function');

      const trueResult = runIfScript(loaded, sacWithValue('SUCCESS'));
      assert.equal(trueResult, true);
      assert.equal(typeof trueResult, 'boolean');

      const falseResult = runIfScript(loaded, sacWithValue('FAILURE'));
      assert.equal(falseResult, false);

      const coercionCases: Array<{ raw: unknown; expected: boolean }> = [
        { raw: null, expected: false },
        { raw: undefined, expected: false },
        { raw: 0, expected: false },
        { raw: 'false', expected: true },
        { raw: {}, expected: true },
      ];
      for (const { raw, expected } of coercionCases) {
        const coerced = runIfScript(() => raw, {});
        assert.equal(coerced, expected);
        assert.equal(typeof coerced, 'boolean');
      }

      const esmPath = path.join(scriptsDir, 'check-esm.mjs');
      writeFile(esmPath, "export default function(sac) { return sac.input0.value === 'OK'; }\n");
      const esmFn = await loadIfScript(esmPath);
      assert.equal(runIfScript(esmFn, sacWithValue('OK')), true);
      assert.equal(runIfScript(esmFn, sacWithValue('NO')), false);

      // Garde-fou : le chemin file URL doit rester résolvable pour import dynamique ESM
      assert.ok(pathToFileURL(esmPath).href.startsWith('file:'));
    } finally {
      handle.cleanup();
    }
  });
});
