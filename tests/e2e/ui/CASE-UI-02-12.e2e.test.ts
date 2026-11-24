import { test, expect } from '@playwright/test';

test.describe("CASE-UI-02-12 — Validation E2E du blocage préventif d'insertion d'un second bloc Start per REQ-015 (SPEC-UI-02 / SPEC-ARCH-02)", () => {
  test('test_CASE_UI_02_12_e2e_single_start_block_prevention', async ({ page, baseURL }) => {
    // Intercepter toute requête d'erreur
    const serverErrors: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 400) {
        serverErrors.push(`${res.request().method()} ${res.url()} -> ${res.status()}`);
      }
    });

    // 1. Ouvrir le canvas d'un scénario existant
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');

    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas")').first();
    await openCanvasBtn.waitFor({ state: 'visible' });
    await openCanvasBtn.click();

    const canvasSvg = page.locator('.canvas-container').first();
    await canvasSvg.waitFor({ state: 'visible' });

    // 2. Compter le bloc Start initial
    const startNodes = page.locator('[data-node-id*="start"]');
    await expect(startNodes).toHaveCount(1);

    // 3. Tenter d'insérer un second bloc Start depuis la palette
    const addStartBtn = page.locator(
      '.palette button[data-block-type="start"], button:has-text("Ajouter Start"), button:has-text("Start"), [data-action="add-start"]',
    );

    if (await addStartBtn.isVisible()) {
      // Soit le bouton est désactivé
      const isDisabled = await addStartBtn.isDisabled();
      if (!isDisabled) {
        // Soit le clic déclenche une alerte de validation immédiate en français
        await addStartBtn.click();
        const alert = page.locator('.alert-warning, .toast-warning, [role="alert"]');
        if (await alert.isVisible()) {
          await expect(alert).toContainText(/un seul bloc start/i);
        }
      }
    }

    // 4. Vérification de l'unicité stricte : toujours exactement 1 bloc Start
    await expect(startNodes).toHaveCount(1);

    // Aucune requête réseau invalide n'a été transmise
    expect(serverErrors.length).toBe(0);
  });
});
