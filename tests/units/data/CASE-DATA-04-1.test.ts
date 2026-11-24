import { describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { Agent } from '../../../src/types/models/agent.model.js';
import { atomicWriteJson } from '../../../src/lib/fs/json-atomic-writer.fs.js';
import { deleteFile } from '../../../src/lib/fs/file-remover.fs.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import { flushPromises } from '../../helpers/flush-promises.js';

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

describe('CASE-DATA-04-1 — persistance atomique immédiate des modifications UI (SPEC-DATA-04)', () => {
  it('test_CASE_DATA_04_1_ui_changes_immediately_persisted_to_disk', async () => {
    const handle = createTempDir('clientsbox-data-04-1-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      ensureDeclarativeTree(dataRoot);
      const store = new ResourceStoreService({ dataRoot });

      writeJson(path.join(dataRoot, 'profils', 'profil-standard.json'), {
        id: 'profil-standard',
        name: 'Standard',
        systemPrompt: 'Tu es un assistant',
        policy: 'chaque_prompt',
      });

      const agent: Agent = {
        id: 'agent-test',
        name: 'Test Agent',
        profilId: 'profil-standard',
        cliId: 'cursor-cli',
      };

      const renameCalls: string[] = [];
      const writeCalls: string[] = [];
      const originalRename = fs.renameSync;
      const originalWrite = fs.writeFileSync;

      const renameMock = vi.spyOn(fs, 'renameSync').mockImplementation(((
        oldPath: fs.PathLike,
        newPath: fs.PathLike,
      ) => {
        renameCalls.push(String(oldPath));
        return originalRename.call(fs, oldPath, newPath);
      }) as typeof fs.renameSync);

      const writeMock = vi.spyOn(fs, 'writeFileSync').mockImplementation(((
        file: fs.PathOrFileDescriptor,
        data: string | NodeJS.ArrayBufferView,
        options?: fs.WriteFileOptions,
      ) => {
        writeCalls.push(String(file));
        return originalWrite.call(fs, file, data, options);
      }) as typeof fs.writeFileSync);

      try {
        await store.createAgent(agent);
        await flushPromises();

        const agentPath = path.join(dataRoot, 'agents', 'agent-test.json');
        assert.ok(fs.existsSync(agentPath));
        const onDisk = JSON.parse(fs.readFileSync(agentPath, 'utf8')) as Agent;
        assert.equal(onDisk.id, 'agent-test');
        assert.equal(onDisk.name, 'Test Agent');
        assert.equal(onDisk.profilId, 'profil-standard');

        assert.ok(
          writeCalls.some((p) => p.endsWith('.tmp') || p.includes('.tmp')),
          'écriture via fichier temporaire attendue (LIB-001)',
        );
        assert.ok(
          renameCalls.some((p) => p.endsWith('.tmp') || p.includes('.tmp')),
          'renommage atomique attendu (LIB-001)',
        );
        const residualTmp = fs
          .readdirSync(path.join(dataRoot, 'agents'))
          .filter((name) => name.endsWith('.tmp'));
        assert.deepEqual(residualTmp, []);

        await store.updateAgent('agent-test', { ...agent, name: 'Test Agent v2' });
        await flushPromises();
        const updated = JSON.parse(fs.readFileSync(agentPath, 'utf8')) as Agent;
        assert.equal(updated.name, 'Test Agent v2');
        assert.deepEqual(
          fs.readdirSync(path.join(dataRoot, 'agents')).filter((n) => n.endsWith('.tmp')),
          [],
        );

        await store.deleteAgent('agent-test');
        await flushPromises();
        assert.equal(fs.existsSync(agentPath), false);

        // Primitive directe LIB-001 / LIB-011 (oracle mécanisme)
        const probePath = path.join(dataRoot, 'agents', 'probe.json');
        atomicWriteJson(probePath, { id: 'probe' });
        assert.ok(fs.existsSync(probePath));
        assert.deepEqual(
          fs.readdirSync(path.join(dataRoot, 'agents')).filter((n) => n.endsWith('.tmp')),
          [],
        );
        deleteFile(probePath);
        assert.equal(fs.existsSync(probePath), false);
      } finally {
        renameMock.mockRestore();
        writeMock.mockRestore();
      }
    } finally {
      handle.cleanup();
    }
  });
});
