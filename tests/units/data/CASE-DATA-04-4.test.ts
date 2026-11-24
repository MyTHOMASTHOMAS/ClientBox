/**
 * CASE-DATA-04-4 — Gestion et rejet robuste d'un fichier JSON corrompu ou tronqué sous .agents/data/
 * (`AC-DATA-04-1`, `AC-DATA-02-1` / `SPEC-DATA-04`, `SPEC-DATA-02`).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';

describe('CASE-DATA-04-4 — Rejet robuste des fichiers JSON corrompus (SPEC-DATA-04 / AC-DATA-04-1)', () => {
  let tempDir: string;
  let agentsDir: string;
  let profilesDir: string;
  let store: ResourceStoreService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clientsbox-data-04-4-'));
    agentsDir = path.join(tempDir, 'agents');
    profilesDir = path.join(tempDir, 'profiles');
    fs.mkdirSync(agentsDir, { recursive: true });
    fs.mkdirSync(profilesDir, { recursive: true });
    store = new ResourceStoreService({ dataRoot: tempDir });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('test_CASE_DATA_04_4_corrupted_truncated_json_file_resilience', async () => {
    // 1. Préparation d'une ressource saine
    const validAgentPath = path.join(agentsDir, 'valid-agent.json');
    fs.writeFileSync(validAgentPath, JSON.stringify({ id: 'valid-agent', name: 'Agent Valide', profileId: 'p-1', cliId: 'cursor-cli' }), 'utf-8');

    // 2. Préparation d'un fichier JSON corrompu (tronqué)
    const corruptedAgentPath = path.join(agentsDir, 'corrupted-agent.json');
    fs.writeFileSync(corruptedAgentPath, '{ "id": "corrupted-agent", "name": "Agent Tronqué', 'utf-8');

    // 3. Préparation d'un fichier vide (0 octet)
    const emptyProfilePath = path.join(profilesDir, 'empty-profile.json');
    fs.writeFileSync(emptyProfilePath, '', 'utf-8');

    // 4. Tentative de lecture du fichier corrompu : doit lever ou rejeter avec diagnostic explicite
    await expect(store.getAgent('corrupted-agent')).rejects.toThrow();

    // 5. Tentative de lecture du fichier vide : doit lever ou rejeter
    await expect(store.getProfil('empty-profile')).rejects.toThrow();

    // 6. Non-régression : l'entité valide reste accessible et saine
    const valid = await store.getAgent('valid-agent');
    expect(valid).not.toBeNull();
    expect(valid?.id).toBe('valid-agent');
  });
});
