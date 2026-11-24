import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { listFiles, fileExists } from '../../../src/lib/fs/json-fresh-reader.fs.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

function ifDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.agents', 'data', 'if');
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

describe('CASE-DATA-02-1 — détection et listing des scripts conditionnels If (SPEC-DATA-02)', () => {
  it('test_CASE_DATA_02_1_if_scripts_detection_and_listing', () => {
    const handle = createTempDir('clientsbox-data-02-1-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      const scriptsDir = ifDir(handle.dir);
      writeFile(path.join(scriptsDir, 'check-status.js'), 'module.exports = () => true;');
      writeFile(path.join(scriptsDir, 'check-role.js'), 'module.exports = () => false;');
      writeFile(path.join(scriptsDir, 'readme.txt'), 'not a script');

      const listedFiles = listFiles(scriptsDir, '.js');
      assert.equal(listedFiles.length, 2);
      assert.ok(listedFiles.every((name) => name.endsWith('.js')));
      assert.ok(!listedFiles.some((name) => name.includes('readme')));

      const store = new ResourceStoreService({ dataRoot });
      const warnings: string[] = [];
      const ids = store.listIfScripts({ onWarning: (msg) => warnings.push(msg) });
      assert.deepEqual([...ids].sort(), ['check-role', 'check-status']);
      assert.equal(warnings.length, 0);

      const emptyDir = path.join(handle.dir, 'empty-if');
      fs.mkdirSync(emptyDir, { recursive: true });
      assert.deepEqual(listFiles(emptyDir, '.js'), []);

      const missingDir = path.join(handle.dir, 'missing-if');
      assert.equal(fileExists(missingDir), false);
      const missingWarnings: string[] = [];
      const missingStore = new ResourceStoreService({
        dataRoot: path.join(handle.dir, 'ghost', 'data'),
      });
      const missingIds = missingStore.listIfScripts({
        onWarning: (msg) => missingWarnings.push(msg),
      });
      assert.deepEqual(missingIds, []);
      assert.ok(missingWarnings.length >= 1);
      assert.match(missingWarnings.join('\n'), /absent|inexistant|manquant/i);
    } finally {
      handle.cleanup();
    }
  });
});
