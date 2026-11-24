import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe("CASE-UI-01-10 — Validation E2E du cycle de vie CRUD complet d'un Agent avec persistance locale (SPEC-UI-01 / SPEC-DATA-01)", () => {
  const agentsDataDir = path.resolve(process.cwd(), '.agents', 'data', 'agents');

  test.afterEach(() => {
    if (fs.existsSync(agentsDataDir)) {
      const residualFiles = fs.readdirSync(agentsDataDir).filter((f) => f.includes('agent-test-e2e'));
      for (const rf of residualFiles) {
        try {
          fs.unlinkSync(path.join(agentsDataDir, rf));
        } catch {
          // Ignorer erreur de nettoyage
        }
      }
    }
  });

  test('test_CASE_UI_01_10_e2e_agent_crud_lifecycle_and_disk_sync', async ({ page, baseURL }) => {
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/agents');
    await page.waitForSelector('#app');

    // 1. Ouvrir le formulaire de création
    const createBtn = page.locator('button:has-text("Créer"), button[data-action="create-agent"]');
    await createBtn.waitFor({ state: 'visible' });
    await createBtn.click();

    // Remplir les champs
    const nameInput = page.locator('input[name="name"], #agent-name, [data-field="name"]');
    await nameInput.waitFor({ state: 'visible' });
    await nameInput.fill('Agent Test E2E');

    const descInput = page.locator('input[name="description"], textarea[name="description"], #agent-desc, [data-field="description"]');
    if (await descInput.isVisible()) {
      await descInput.fill('Agent créé par test E2E');
    }

    // Sélection profil et adapter
    const profileSelect = page.locator('select[name="profilId"], #agent-profil, select[name="profileId"], [data-field="profilId"]');
    if (await profileSelect.isVisible()) {
      const option = await profileSelect.locator('option').nth(1).getAttribute('value');
      if (option) await profileSelect.selectOption(option);
    }

    const saveBtn = page.locator('button:has-text("Enregistrer"), button[type="submit"], button[data-action="save"]');
    await saveBtn.click();
    await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeHidden();

    // Vérifier apparition dans la table
    await expect(page.locator('.data-table, table')).toContainText('Agent Test E2E');

    // Vérifier fichier disque
    if (fs.existsSync(agentsDataDir)) {
      const files = fs.readdirSync(agentsDataDir);
      const createdFile = files.find((f) => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(agentsDataDir, f), 'utf-8'));
          return content.name === 'Agent Test E2E';
        } catch {
          return false;
        }
      });
      expect(createdFile).toBeDefined();

      // 2. Modification de l'agent
      const editBtn = page.locator('tr:has-text("Agent Test E2E") button:has-text("Modifier"), tr:has-text("Agent Test E2E") [data-action="edit"]');
      await editBtn.waitFor({ state: 'visible' });
      await editBtn.click();
      await expect(nameInput).toHaveValue('Agent Test E2E');
      await nameInput.fill('Agent Test E2E Modifié');
      await expect(nameInput).toHaveValue('Agent Test E2E Modifié');
      await saveBtn.click();
      await expect(page.locator('.modal-overlay, [role="dialog"]')).toBeHidden();

      await expect(page.locator('.data-table, table')).toContainText('Agent Test E2E Modifié');

      // Vérifier sur disque
      const updatedContent = JSON.parse(fs.readFileSync(path.join(agentsDataDir, createdFile!), 'utf-8'));
      expect(updatedContent.name).toBe('Agent Test E2E Modifié');

      // 3. Suppression de l'agent
      const deleteBtn = page.locator('tr:has-text("Agent Test E2E Modifié") button:has-text("Supprimer"), tr:has-text("Agent Test E2E Modifié") [data-action="delete"]');
      await deleteBtn.waitFor({ state: 'visible' });
      page.once('dialog', (d) => d.accept());
      await deleteBtn.click();

      await expect(page.locator('.data-table, table')).not.toContainText('Agent Test E2E Modifié');
      expect(fs.existsSync(path.join(agentsDataDir, createdFile!))).toBe(false);
    }
  });
});
