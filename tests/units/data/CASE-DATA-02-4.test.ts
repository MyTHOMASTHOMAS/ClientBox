/**
 * CASE-DATA-02-4 — Lecture fraîche et résolution sécurisée des scripts If par ResourceStoreService
 * (`AC-DATA-02-1`, `AC-DATA-04-2` / `SPEC-DATA-02`, `SPEC-DATA-04`).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';

describe('CASE-DATA-02-4 — Lecture fraîche et résolution des scripts If (SPEC-DATA-02 / SPEC-DATA-04)', () => {
  let tempDir: string;
  let ifDir: string;
  let store: ResourceStoreService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clientsbox-data-02-4-'));
    ifDir = path.join(tempDir, 'if');
    fs.mkdirSync(ifDir, { recursive: true });
    store = new ResourceStoreService({ dataRoot: tempDir });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('test_CASE_DATA_02_4_resource_store_read_if_script_secure', async () => {
    const scriptId = 'check-balance';
    const scriptFile = path.join(ifDir, `${scriptId}.js`);
    fs.writeFileSync(scriptFile, 'return sac["0"] > 10;', 'utf-8');

    // 1. Lecture nominale du contenu
    const content1 = (store as unknown as { readIfScript(id: string): string }).readIfScript(scriptId);
    expect(content1).toBe('return sac["0"] > 10;');

    // 2. Fraîcheur : modification directe sur le disque
    fs.writeFileSync(scriptFile, 'return sac["0"] > 20;', 'utf-8');
    const content2 = (store as unknown as { readIfScript(id: string): string }).readIfScript(scriptId);
    expect(content2).toBe('return sac["0"] > 20;');

    // 3. Résolution sécurisée du chemin
    const resolvedPath = (store as unknown as { resolveIfScriptPath(id: string): string }).resolveIfScriptPath(scriptId);
    expect(resolvedPath).toBe(scriptFile);

    // 4. Rejet strict des tentatives de traversée de répertoire
    expect(() => {
      (store as unknown as { resolveIfScriptPath(id: string): string }).resolveIfScriptPath('../../../etc/passwd');
    }).toThrow();
  });
});
