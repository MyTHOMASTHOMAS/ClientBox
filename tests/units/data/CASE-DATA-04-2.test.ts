import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Prompt } from '../../../src/types/models/prompt.model.js';
import { readJsonFile } from '../../../src/lib/fs/json-fresh-reader.fs.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';

const ALLOWED_DATA_DIRS = ['agents', 'profils', 'prompts', 'exit', 'if', 'scenarios'] as const;

function ensureDeclarativeTree(dataRoot: string): void {
  for (const dir of ALLOWED_DATA_DIRS) {
    fs.mkdirSync(path.join(dataRoot, dir), { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

describe('CASE-DATA-04-2 — disque comme unique source de vérité (SPEC-DATA-04)', () => {
  it('test_CASE_DATA_04_2_disk_as_single_source_of_truth', async () => {
    const handle = createTempDir('clientsbox-data-04-2-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      ensureDeclarativeTree(dataRoot);
      const store = new ResourceStoreService({ dataRoot });

      const promptPath = path.join(dataRoot, 'prompts', 'p-dev.json');
      const initialPrompt: Prompt = {
        id: 'p-dev',
        name: 'Dev',
        content: 'Analyse le code',
      };
      writeJson(promptPath, initialPrompt);

      const first = await store.getPrompt('p-dev');
      assert.ok(first !== null);
      if (!first) throw new Error('First prompt not found');
      assert.equal(first.content, 'Analyse le code');

      writeJson(promptPath, { ...initialPrompt, content: 'Optimise le code' });
      const second = await store.getPrompt('p-dev');
      assert.ok(second !== null);
      if (!second) throw new Error('Second prompt not found');
      assert.equal(second.content, 'Optimise le code');
      assert.equal(readJsonFile<Prompt>(promptPath).content, 'Optimise le code');

      const agentPath = path.join(dataRoot, 'agents', 'agent-dev.json');
      writeJson(agentPath, {
        id: 'agent-dev',
        name: 'Dev',
        profilId: 'profil-standard',
        cliId: 'cursor-cli',
      });
      await store.getAgent('agent-dev');
      fs.unlinkSync(agentPath);

      await assert.rejects(
        () => store.getAgent('agent-dev'),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match(String(err), /NOT_FOUND|introuvable|n'existe|absent/i);
          return true;
        },
      );

      writeJson(path.join(dataRoot, 'agents', 'agent-nouveau.json'), {
        id: 'agent-nouveau',
        name: 'Nouveau',
        profilId: 'profil-standard',
        cliId: 'cursor-cli',
      });
      const listed = await store.listAgents();
      assert.ok(listed.some((a) => a.id === 'agent-nouveau'));
    } finally {
      handle.cleanup();
    }
  });
});
