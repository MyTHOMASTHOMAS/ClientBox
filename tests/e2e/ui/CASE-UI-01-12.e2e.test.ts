import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('CASE-UI-01-12 — Validation E2E de la consultation de script If via la modale de lecture seule (SPEC-UI-01 / SPEC-DATA-02)', () => {
  const ifDir = path.resolve(process.cwd(), '.agents', 'data', 'if');
  const scriptPath = path.join(ifDir, 'check-status.js');
  const scriptContent = "return sac['0'] === 'OK';";

  test.beforeAll(() => {
    fs.mkdirSync(ifDir, { recursive: true });
    fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
  });

  test.afterAll(() => {
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
  });

  test('test_CASE_UI_01_12_e2e_if_script_viewer_modal_consultation', async ({ page, baseURL }) => {
    // 1. Navigation vers la liste des scripts conditionnels If
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/if');
    await page.waitForSelector('#app');

    // 2. Clic sur l'action Consulter / Inspecter en face du script check-status
    const inspectBtn = page.locator(
      'tr:has-text("check-status") button:has-text("Consulter"), tr:has-text("check-status") button:has-text("Inspecter"), tr:has-text("check-status") [data-action="inspect-script"]',
    );
    await inspectBtn.waitFor({ state: 'visible' });
    await inspectBtn.click();

    // 3. Vérification de l'ouverture de la modale en lecture seule
    const modal = page.locator('.modal-overlay, .script-viewer-modal, [role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('check-status');

    // Le contenu source affiché doit être exactement celui du fichier
    const codeElement = modal.locator('pre');
    await expect(codeElement).toContainText("return sac['0'] === 'OK';");

    // L'élément ne doit pas être un champ d'édition modifiable
    const inputField = modal.locator('input[type="text"], textarea');
    expect(await inputField.count()).toBe(0);

    // 4. Fermeture de la modale via la touche Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });
});
