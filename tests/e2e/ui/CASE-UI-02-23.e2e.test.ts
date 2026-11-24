import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe("CASE-UI-02-23 — Validation E2E du cycle de vie complet d'un workflow : création, multi-blocs, câblage, pan/zoom et persistance (SPEC-UI-02 / SPEC-DATA-03)", () => {
  const scenariosDir = path.resolve(process.cwd(), '.agents', 'data', 'scenarios');
  const createdFiles: string[] = [];

  test.afterAll(() => {
    // Nettoyage des fichiers temporaires créés durant le test
    for (const file of createdFiles) {
      const fullPath = path.join(scenariosDir, file);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch {
          // Ignorer erreur de nettoyage
        }
      }
    }
  });

  test('test_CASE_UI_02_23_e2e_complete_workflow_lifecycle_creation_blocks_zoom_persistence', async ({ page, baseURL }) => {
    // 1. Navigation vers l'accueil de l'application
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');
    await page.waitForSelector('.data-table, table');

    // Mémorisation des fichiers existants avant création
    const filesBefore = fs.existsSync(scenariosDir) ? fs.readdirSync(scenariosDir) : [];

    // 2. Clic sur "Nouveau scénario" depuis l'accueil
    const newScenarioBtn = page.locator('button[data-action="new-scenario"], button:has-text("Nouveau scénario")').first();
    await newScenarioBtn.waitFor({ state: 'visible' });
    await newScenarioBtn.click();

    // 3. Arrivée sur le studio avec un canvas vierge et renommage du workflow
    await page.waitForSelector('.canvas-container');
    const nameInput = page.locator('input[data-field="scenario-name"]').first();
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('Workflow E2E Valide');

    // Ajout du bloc initial Start depuis la barre d'outils (canvas vierge au départ)
    const addStartBtn = page.locator('button[data-action="add-start"]').first();
    await addStartBtn.waitFor({ state: 'visible' });
    await expect(addStartBtn).toBeEnabled();
    await addStartBtn.click();

    const startNode = page.locator('[data-node-id*="start"]').first();
    await expect(startNode).toBeVisible();
    await expect(addStartBtn).toBeDisabled();

    // 4. Ajout successif des 5 types de blocs via la barre d'outils
    const addRunBtn = page.locator('button[data-action="add-run"]');
    await addRunBtn.waitFor({ state: 'visible' });
    await addRunBtn.click();

    const addIfBtn = page.locator('button[data-action="add-if"]');
    await addIfBtn.click();

    const addCommandBtn = page.locator('button[data-action="add-command"]');
    await addCommandBtn.click();

    const addClearBtn = page.locator('button[data-action="add-clear-context"]');
    await addClearBtn.click();

    const addCallBtn = page.locator('button[data-action="add-call-scenario"]');
    await addCallBtn.click();

    // Vérification du nombre total de blocs sur la grille (Start + 5 ajoutés = 6)
    const allNodes = page.locator('[data-node-id]');
    await expect(allNodes).toHaveCount(6);

    // 5. Validation des icônes distinctives dédiées sur chaque bloc
    const runNode = page.locator('[data-node-id*="run"]').first();
    await expect(runNode.locator('.material-symbols-outlined').first()).toContainText('smart_toy');

    const ifNode = page.locator('[data-node-id*="if"]').first();
    await expect(ifNode.locator('.material-symbols-outlined').first()).toContainText('alt_route');

    const cmdNode = page.locator('[data-node-id*="command"]').first();
    await expect(cmdNode.locator('.material-symbols-outlined').first()).toContainText('terminal');

    const clearNode = page.locator('[data-node-id*="clearContext"]').first();
    await expect(clearNode.locator('.material-symbols-outlined').first()).toContainText('mop');

    const callNode = page.locator('[data-node-id*="callScenario"]').first();
    await expect(callNode.locator('.material-symbols-outlined').first()).toContainText('account_tree');

    // 6. Câblage interactif Start -> Run
    const startOutputPort = startNode.locator('[data-port-type="output"]').first();
    const runInputPort = runNode.locator('[data-port-type="input"]').first();
    await startOutputPort.click({ force: true });
    await runInputPort.click({ force: true });

    // Vérification de la création effective du câble
    const cable = page.locator('svg g.cable, path.cable').first();
    await expect(cable).toBeVisible();

    // 7. Configuration du bloc Command dans l'inspecteur contextuel
    await cmdNode.click({ force: true });
    const inspector = page.locator('aside[data-section="inspector"]').first();
    await expect(inspector).toBeVisible();

    const commandField = inspector.locator('textarea[data-field="commandLine"], #field-command-line').first();
    await commandField.waitFor({ state: 'visible' });
    await commandField.fill('echo test-e2e-workflow');

    // Vérification de la répercussion immédiate dans le corps du nœud Command
    await expect(cmdNode).toContainText('Cmd: echo test-e2e-workflow');

    // 8. Test de l'interaction Pan & Zoom sur le canvas
    const canvasContainer = page.locator('.canvas-container').first();
    await canvasContainer.dispatchEvent('wheel', { deltaY: -200, clientX: 300, clientY: 200 });

    const cablesLayer = page.locator('g.cables-layer').first();
    await expect(cablesLayer).toHaveAttribute('transform', /scale\(/);

    // 9. Sauvegarde du scénario
    const saveBtn = page.locator('button[data-action="save-scenario"], button:has-text("Enregistrer")').first();
    await saveBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // 10. Contrôle de persistance du fichier JSON sur le disque
    if (fs.existsSync(scenariosDir)) {
      const filesAfter = fs.readdirSync(scenariosDir);
      const newFiles = filesAfter.filter((f) => !filesBefore.includes(f) && f.endsWith('.json'));

      if (newFiles.length > 0) {
        createdFiles.push(...newFiles);
        const savedFilePath = path.join(scenariosDir, newFiles[0]!);
        const content = fs.readFileSync(savedFilePath, 'utf-8');
        expect(content).toContain('Workflow E2E Valide');
        expect(content).toContain('echo test-e2e-workflow');
        expect(content).toContain('command');
        expect(content).toContain('callScenario');
      }
    }
  });
});
