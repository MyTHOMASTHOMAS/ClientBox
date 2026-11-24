import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import { flushPromises } from '../../helpers/flush-promises.js';

const ALLOWED_DATA_DIRS = ['agents', 'profils', 'prompts', 'exit', 'if', 'scenarios'] as const;

const FORBIDDEN_DIR_NAMES = ['logs', 'history', 'sessions', 'stream', 'cache'] as const;

function ensureDeclarativeTree(dataRoot: string): void {
  for (const dir of ALLOWED_DATA_DIRS) {
    fs.mkdirSync(path.join(dataRoot, dir), { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function listTopLevelDirs(dataRoot: string): string[] {
  if (!fs.existsSync(dataRoot)) {
    return [];
  }
  return fs
    .readdirSync(dataRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function collectForbiddenArtifacts(dataRoot: string): string[] {
  const found: string[] = [];
  if (!fs.existsSync(dataRoot)) {
    return found;
  }

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(dataRoot, full);
      if (entry.isDirectory()) {
        if ((FORBIDDEN_DIR_NAMES as readonly string[]).includes(entry.name)) {
          found.push(rel);
        }
        walk(full);
        continue;
      }
      if (
        /\.log$/i.test(entry.name) ||
        /\.trace$/i.test(entry.name) ||
        /-history\.json$/i.test(entry.name)
      ) {
        found.push(rel);
      }
    }
  };

  walk(dataRoot);
  return found;
}

describe("CASE-DATA-04-3 — absence totale de logs ou d'historique sous le dossier data (SPEC-DATA-04)", () => {
  it('test_CASE_DATA_04_3_no_logs_or_history_under_data_dir', async () => {
    const handle = createTempDir('clientsbox-data-04-3-');
    try {
      const dataRoot = path.join(handle.dir, '.agents', 'data');
      ensureDeclarativeTree(dataRoot);
      const store = new ResourceStoreService({ dataRoot });

      assert.deepEqual(listTopLevelDirs(dataRoot), [...ALLOWED_DATA_DIRS].sort());
      for (const forbidden of FORBIDDEN_DIR_NAMES) {
        assert.equal(fs.existsSync(path.join(dataRoot, forbidden)), false);
      }

      writeJson(path.join(dataRoot, 'profils', 'profil-standard.json'), {
        id: 'profil-standard',
        name: 'Standard',
        systemPrompt: 'Prompt',
        policy: 'chaque_prompt',
      });
      writeJson(path.join(dataRoot, 'agents', 'agent-1.json'), {
        id: 'agent-1',
        name: 'A1',
        profilId: 'profil-standard',
        cliId: 'cursor-cli',
      });
      writeJson(path.join(dataRoot, 'scenarios', 's1.json'), {
        id: 's1',
        name: 'S1',
        nodes: [{ id: 'start-1', type: 'start', position: { x: 0, y: 0 } }],
        connections: [],
      });

      // Simulation de 3 succès + 1 erreur côté persistance : CRUD déclaratif uniquement
      // (le runner ne doit pas écrire sous data/ — R-37 / REQ-111).
      for (let i = 0; i < 3; i += 1) {
        await store.getScenario('s1');
        await flushPromises();
      }
      await assert.rejects(() => store.getScenario('missing-scenario'));
      await flushPromises();

      // Tentative d'écriture « mauvaise » hors contrat — absente du store
      const artifactsAfterRuns = collectForbiddenArtifacts(dataRoot);
      assert.deepEqual(artifactsAfterRuns, []);

      const topLevel = listTopLevelDirs(dataRoot);
      for (const name of topLevel) {
        assert.ok(
          (ALLOWED_DATA_DIRS as readonly string[]).includes(name),
          `dossier non autorisé sous data/: ${name}`,
        );
      }
      for (const forbidden of FORBIDDEN_DIR_NAMES) {
        assert.ok(!topLevel.includes(forbidden));
      }
    } finally {
      handle.cleanup();
    }
  });
});
