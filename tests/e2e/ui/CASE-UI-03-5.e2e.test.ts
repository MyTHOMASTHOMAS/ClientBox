import { test, expect } from '@playwright/test';

test.describe("CASE-UI-03-5 — Validation E2E de l'arrêt d'urgence Stop et libération des ressources per REQ-025 (SPEC-UI-03 / SPEC-ENG-04 / SPEC-ADPT-03)", () => {
  test.beforeEach(async ({ request, baseURL }) => {
    try {
      await request.delete((baseURL || 'http://127.0.0.1:2974') + '/api/scenarios/scenario-demo/run');
    } catch {
      // Ignorer si aucun runner n'était actif
    }
  });

  test('test_CASE_UI_03_5_e2e_stop_button_emergency_interruption', async ({ page, baseURL }) => {
    // 1. Ouvrir le canvas d'un scénario
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');

    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas")').first();
    await openCanvasBtn.waitFor({ state: 'visible' });
    await openCanvasBtn.click();

    const runBtn = page.locator(
      'button:has-text("Lancer le scénario"), button[data-action="run-scenario"], button:has-text("Lancer"), [data-action="launch-scenario"]',
    );
    const stopBtn = page.locator(
      'button:has-text("Arrêter"), button[data-action="stop-scenario"]',
    );

    await expect(runBtn).toBeVisible();
    await expect(runBtn).toBeEnabled();

    // 2. Déclencher le run
    await runBtn.click();
    await expect(runBtn).toBeDisabled();

    // 3. Attendre l'activation du bouton Stop et cliquer dessus
    await expect(stopBtn).toBeVisible({ timeout: 5000 });
    await expect(stopBtn).toBeEnabled({ timeout: 5000 });

    const stopRequestPromise = page.waitForRequest(
      (req) => req.method() === 'DELETE' && req.url().includes('/run'),
    );
    await stopBtn.click();
    await stopRequestPromise;

    // 4. Vérifier le message d'interruption en français dans le terminal
    const terminal = page.locator('#terminal-output');
    if (await terminal.isVisible()) {
      await expect(terminal).toContainText(/interrompu|arrêt/i);
    }

    // 5. Réactivation du bouton Lancer
    await expect(runBtn).toBeEnabled({ timeout: 10_000 });
  });
});
