import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { createLocalHttpServer } from '../../../src/lib/http/loopback-http.server.js';
import { MiniRouter } from '../../../src/lib/http/mini-http.router.js';
import { registerResourceRoutes } from '../../../src/controllers/http/resource.controller.js';
import { resolveAgentsLayout } from '../../../src/lib/process/env/index.js';
import { AdapterRegistryService } from '../../../src/services/adapters/adapter-registry.service.js';
import { AgentService } from '../../../src/services/agents/agent.service.js';
import { ResourceStoreService } from '../../../src/services/resources/resource-store.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';

test.describe('CASE-SRV-02-10 — Validation E2E du chargement des fichiers depuis AGENTS_DIR (SPEC-SRV-02 / AC-SRV-02-9)', () => {
  const activeServers: Array<{ close(): Promise<void> }> = [];
  let tempWorkspace: string = '';

  test.beforeEach(async () => {
    tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-test-agents-dir-'));
  });

  test.afterEach(async () => {
    while (activeServers.length > 0) {
      const s = activeServers.pop();
      if (s) {
        await s.close();
      }
    }
    if (tempWorkspace && fs.existsSync(tempWorkspace)) {
      try {
        fs.rmSync(tempWorkspace, { recursive: true, force: true });
      } catch {
        // Ignoré sur Windows si verrou temporaire
      }
    }
  });

  test('test_CASE_SRV_02_10_e2e_agents_dir_custom_path_resolution', async ({ page }) => {

    // 1. Initialisation du dossier .agents par défaut
    const defaultDataDir = path.join(tempWorkspace, '.agents', 'data', 'agents');
    fs.mkdirSync(defaultDataDir, { recursive: true });
    fs.writeFileSync(
      path.join(defaultDataDir, 'agent-default.json'),
      JSON.stringify({
        id: 'agent-default',
        name: 'Agent Répertoire Défaut',
        profilId: 'profil-test',
        cliId: 'cursor-cli',
      }),
      'utf-8',
    );

    // 2. Initialisation d'un dossier personnalisé via AGENTS_DIR
    const customDataDir = path.join(tempWorkspace, 'custom-agents-folder', 'data', 'agents');
    fs.mkdirSync(customDataDir, { recursive: true });
    fs.writeFileSync(
      path.join(customDataDir, 'agent-custom.json'),
      JSON.stringify({
        id: 'agent-custom',
        name: 'Agent Dossier Personnalisé AGENTS_DIR',
        profilId: 'profil-test',
        cliId: 'cursor-cli',
      }),
      'utf-8',
    );

    // --- Serveur 1 : Résolution par défaut (sans variable AGENTS_DIR) ---
    const portDefault = 9795;
    const defaultLayout = resolveAgentsLayout(tempWorkspace, {});
    expect(defaultLayout.agentsDir).toBe(path.join(tempWorkspace, '.agents'));

    const defaultStore = new ResourceStoreService({ dataRoot: defaultLayout.dataRoot });
    const defaultAgentService = new AgentService({ store: defaultStore });
    const defaultRouter = new MiniRouter();
    registerResourceRoutes({
      router: defaultRouter,
      resourceStore: defaultStore,
      agentService: defaultAgentService,
      adapterRegistry: new AdapterRegistryService([new CursorCLIAdapter()]),
    });

    const defaultServer = await createLocalHttpServer({
      port: portDefault,
      router: defaultRouter,
    });
    activeServers.push(defaultServer);
    await flushPromises();

    // Consultation IHM Serveur 1
    await page.goto(`http://127.0.0.1:${portDefault}/#/agents`);
    await page.waitForSelector('.data-table tbody tr, table tbody tr');
    const defaultRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(defaultRows).toHaveCount(1);
    await expect(defaultRows.first()).toContainText('Agent Répertoire Défaut');
    await expect(defaultRows.first()).not.toContainText('Agent Dossier Personnalisé');

    // --- Serveur 2 : Résolution avec variable AGENTS_DIR pointant vers le dossier personnalisé ---
    const portCustom = 9796;
    const customLayout = resolveAgentsLayout(tempWorkspace, { AGENTS_DIR: 'custom-agents-folder' });
    expect(customLayout.agentsDir).toBe(path.join(tempWorkspace, 'custom-agents-folder'));
    expect(customLayout.dataRoot).toBe(path.join(tempWorkspace, 'custom-agents-folder', 'data'));

    const customStore = new ResourceStoreService({ dataRoot: customLayout.dataRoot });
    const customAgentService = new AgentService({ store: customStore });
    const customRouter = new MiniRouter();
    registerResourceRoutes({
      router: customRouter,
      resourceStore: customStore,
      agentService: customAgentService,
      adapterRegistry: new AdapterRegistryService([new CursorCLIAdapter()]),
    });

    const customServer = await createLocalHttpServer({
      port: portCustom,
      router: customRouter,
    });
    activeServers.push(customServer);
    await flushPromises();

    // Consultation IHM Serveur 2
    await page.goto(`http://127.0.0.1:${portCustom}/#/agents`);
    await page.waitForSelector('.data-table tbody tr, table tbody tr');
    const customRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(customRows).toHaveCount(1);
    await expect(customRows.first()).toContainText('Agent Dossier Personnalisé AGENTS_DIR');
    await expect(customRows.first()).not.toContainText('Agent Répertoire Défaut');
  });
});
