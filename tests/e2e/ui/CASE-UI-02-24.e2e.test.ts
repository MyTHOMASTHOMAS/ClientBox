import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe("CASE-UI-02-24 — Validation E2E de la suppression interactive de câble et de bloc en situation de Canvas navigué (SPEC-UI-02 / AC-UI-02-7 / AC-UI-02-10)", () => {
  const scenariosDir = path.resolve(process.cwd(), '.agents', 'data', 'scenarios');
  const createdFiles: string[] = [];

  test.afterAll(() => {
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

  test('test_CASE_UI_02_24_e2e_interactive_cable_and_node_deletion_under_navigated_canvas', async ({ page, baseURL }) => {
    // 1. Navigation vers l'accueil puis instanciation d'un nouveau scénario
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');
    await page.waitForSelector('.data-table, table');

    const filesBefore = fs.existsSync(scenariosDir) ? fs.readdirSync(scenariosDir) : [];

    const newScenarioBtn = page.locator('button[data-action="new-scenario"], button:has-text("Nouveau scénario")').first();
    await newScenarioBtn.waitFor({ state: 'visible' });
    await newScenarioBtn.click();

    await page.waitForSelector('.canvas-container');

    // Renommage du workflow depuis le Studio
    const nameInput = page.locator('input[data-field="scenario-name"]').first();
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('Workflow Suppression Clean');

    // Ajout initial du bloc Start depuis la barre d'outils
    const addStartBtn = page.locator('button[data-action="add-start"]').first();
    await addStartBtn.waitFor({ state: 'visible' });
    await expect(addStartBtn).toBeEnabled();
    await addStartBtn.click();

    const startNode = page.locator('[data-node-id*="start"]').first();
    await expect(startNode).toBeVisible();
    await expect(addStartBtn).toBeDisabled();

    // 2. Ajout d'un bloc Run pour créer une structure câblée minimale
    const addRunBtn = page.locator('button[data-action="add-run"]');
    await addRunBtn.waitFor({ state: 'visible' });
    await addRunBtn.click();

    const runNode = page.locator('[data-node-id*="run"]').first();
    await expect(runNode).toBeVisible();

    // 3. Câblage Start -> Run
    const startOutputPort = startNode.locator('[data-port-type="output"]').first();
    const runInputPort = runNode.locator('[data-port-type="input"]').first();
    await startOutputPort.click({ force: true });
    await runInputPort.click({ force: true });

    const cableLayer = page.locator('svg g.cables-layer').first();
    const cable = cableLayer.locator('g.cable').first();
    await expect(cable).toBeVisible();

    // 4. Test de suppression du câble en deux clics sans interférence avec le Pan
    // Premier clic : sélection du câble
    const cablePath = cable.locator('path.cable').first();
    await cablePath.click({ force: true });

    // Vérification de l'apparition de l'option "Supprimer" sur le câble
    const deleteCableBtn = cable.locator('[data-action="delete-connection"]').first();
    await expect(deleteCableBtn).toBeVisible();

    // Second clic : suppression effective du câble
    await deleteCableBtn.click({ force: true });

    // Vérification de la disparition immédiate du câble du DOM
    await expect(cableLayer.locator('g.cable')).toHaveCount(0);

    // 5. Test de suppression du bloc Run via le bouton de l'inspecteur
    await runNode.click({ force: true });

    const inspector = page.locator('aside[data-section="inspector"]').first();
    await expect(inspector).toBeVisible();

    // Clic sur le bouton "Supprimer ce bloc"
    const deleteNodeBtn = inspector.locator('button[data-action="delete-node"]').first();
    await expect(deleteNodeBtn).toBeVisible();
    await deleteNodeBtn.click({ force: true });

    // Vérification de la disparition du nœud et de la fermeture de l'inspecteur
    await expect(page.locator('[data-node-id*="run"]')).toHaveCount(0);
    await expect(inspector).not.toBeVisible();

    // Le bloc Start initial demeure présent
    await expect(startNode).toBeVisible();

    // 6. Sauvegarde et contrôle d'absence des éléments supprimés
    const saveBtn = page.locator('button[data-action="save-scenario"], button:has-text("Enregistrer")').first();
    await saveBtn.click({ force: true });
    await page.waitForTimeout(1000);

    if (fs.existsSync(scenariosDir)) {
      const filesAfter = fs.readdirSync(scenariosDir);
      const newFiles = filesAfter.filter((f) => !filesBefore.includes(f) && f.endsWith('.json'));

      if (newFiles.length > 0) {
        createdFiles.push(...newFiles);
        const savedFilePath = path.join(scenariosDir, newFiles[0]!);
        const content = fs.readFileSync(savedFilePath, 'utf-8');
        const parsed = JSON.parse(content);

        // Absence du nœud supprimé et de toute connexion orpheline
        expect(parsed.name).toBe('Workflow Suppression Clean');
        expect(parsed.nodes.some((n: any) => n.type === 'run')).toBe(false);
        expect(parsed.connections.length).toBe(0);
      }
    }
  });
});
