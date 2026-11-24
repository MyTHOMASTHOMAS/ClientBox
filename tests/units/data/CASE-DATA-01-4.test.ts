import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Agent } from '../../../src/types/models/agent.model.js';
import type { Profile } from '../../../src/types/models/profile.model.js';
import { parseAgent } from '../../../src/domain/schemas/agent.schema.js';
import { parseProfile } from '../../../src/domain/schemas/profile.schema.js';
import { ResourceValidationError } from '../../../src/domain/schemas/validation.error.js';
import { readJsonFile } from '../../../src/lib/fs/json-fresh-reader.fs.js';
import { isValidResourceId } from '../../../src/utils/primitives/id.utils.js';
import { createTempDir } from '../../helpers/temp-dir.js';

function agentsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.agents', 'data', 'agents');
}

function profilsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, '.agents', 'data', 'profils');
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

describe('CASE-DATA-01-4 — rejet des JSON corrompus et traversée sans crash (SPEC-DATA-01)', () => {
  it('test_CASE_DATA_01_4_reject_corrupt_json_without_crash', () => {
    const handle = createTempDir('clientsbox-data-01-4-');
    try {
      const corruptPath = path.join(agentsDir(handle.dir), 'agent-bad.json');
      fs.mkdirSync(path.dirname(corruptPath), { recursive: true });
      fs.writeFileSync(corruptPath, "{ id: 'agent-bad', profilId: ", 'utf8');

      assert.throws(
        () => readJsonFile<Agent>(corruptPath),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match(String(err), /agent-bad\.json|JSON|parse/i);
          return true;
        },
      );

      const incompletePath = path.join(profilsDir(handle.dir), 'profil-bad.json');
      writeJson(incompletePath, { id: 'profil-bad' });

      assert.throws(
        () => parseProfile(readJsonFile<Profile>(incompletePath)),
        (err: unknown) => {
          assert.ok(err instanceof ResourceValidationError);
          assert.match(String(err), /profil-bad|systemPrompt|policy|name/i);
          return true;
        },
      );

      const traversalId = '../etc/passwd';
      assert.equal(isValidResourceId(traversalId), false);
      assert.throws(
        () =>
          parseAgent({
            id: traversalId,
            name: 'Bad',
            profilId: 'p',
            cliId: 'cursor-cli',
          }),
        (err: unknown) => {
          assert.ok(err instanceof ResourceValidationError);
          assert.match(String(err), /id|interdit|\.\./i);
          return true;
        },
      );
    } finally {
      handle.cleanup();
    }
  });
});
