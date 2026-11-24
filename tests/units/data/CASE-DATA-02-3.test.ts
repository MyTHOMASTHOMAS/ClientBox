import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import {
  loadIfScript,
  runIfScript,
  IfScriptLoadError,
  IfScriptRuntimeError,
} from '../../../src/lib/fs/dynamic-module-loader.fs.js';
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

describe('CASE-DATA-02-3 — interception des erreurs de scripts If sans crash (SPEC-DATA-02)', () => {
  it('test_CASE_DATA_02_3_if_script_errors_intercepted_no_crash', async () => {
    const handle = createTempDir('clientsbox-data-02-3-');
    try {
      const scriptsDir = ifDir(handle.dir);

      const badSyntaxPath = path.join(scriptsDir, 'bad-syntax.js');
      writeFile(badSyntaxPath, 'module.exports = function(sac) { return sac.input0.value === ; };');

      let serviceStillAlive = true;
      await assert.rejects(
        () => loadIfScript(badSyntaxPath),
        (err: unknown) => {
          assert.ok(err instanceof IfScriptLoadError);
          assert.match(String(err), /bad-syntax\.js|SyntaxError|syntaxe/i);
          return true;
        },
      );
      assert.equal(serviceStillAlive, true);

      const runtimePath = path.join(scriptsDir, 'runtime-error.js');
      writeFile(
        runtimePath,
        "module.exports = function(sac) { return sac.inexistant.value === 'OK'; };",
      );
      const runtimeFn = await loadIfScript(runtimePath);
      assert.throws(
        () => runIfScript(runtimeFn, {}),
        (err: unknown) => {
          assert.ok(err instanceof IfScriptRuntimeError);
          assert.match(String(err), /TypeError|inexistant|undefined/i);
          return true;
        },
      );
      assert.equal(serviceStillAlive, true);

      const throwingPath = path.join(scriptsDir, 'throwing.js');
      writeFile(
        throwingPath,
        "module.exports = function(sac) { throw new Error('condition impossible'); };",
      );
      const throwingFn = await loadIfScript(throwingPath);
      assert.throws(
        () => runIfScript(throwingFn, sacWithValue('x')),
        (err: unknown) => {
          assert.ok(err instanceof IfScriptRuntimeError);
          assert.match(String(err), /condition impossible/i);
          return true;
        },
      );
      assert.equal(serviceStillAlive, true);
    } finally {
      handle.cleanup();
    }
  });
});
