import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveAgentsDir,
  resolveWorkspacePath,
} from '../../../src/lib/process/env/index.js';
import { withTempDir } from '../../helpers/temp-dir.js';

describe('CASE-SRV-01-4 — résolution stricte du workspacePath depuis CWD (SPEC-SRV-01)', () => {
  it('test_CASE_SRV_01_4_workspace_path_strict_resolution_from_cwd', async () => {
    await withTempDir(async (rootDir) => {
      const resolvedRoot = resolveWorkspacePath();
      assert.equal(resolvedRoot, path.resolve(rootDir));
      assert.equal(resolvedRoot, process.cwd());
      assert.notEqual(resolvedRoot, path.dirname(fileURLToPath(import.meta.url)));
    });

    await withTempDir(async (rootDir) => {
      const nested = path.join(rootDir, 'packages', 'core');
      fs.mkdirSync(nested, { recursive: true });
      const previous = process.cwd();
      process.chdir(nested);
      try {
        const resolved = resolveWorkspacePath();
        assert.equal(resolved, path.resolve(nested));
        assert.notEqual(resolved, previous);
      } finally {
        process.chdir(previous);
      }
    });

    await withTempDir(async (rootDir) => {
      const defaultAgents = resolveAgentsDir(rootDir);
      assert.equal(defaultAgents, path.join(rootDir, '.agents'));

      const customAgents = resolveAgentsDir(rootDir, { AGENTS_DIR: 'custom-agents' });
      assert.equal(customAgents, path.join(rootDir, 'custom-agents'));
    });
  });
});
