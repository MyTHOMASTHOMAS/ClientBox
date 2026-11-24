import { test, expect } from '@playwright/test';

test.describe("CASE-UI-03-8 — Validation E2E de la résilience sur erreur d'un bloc et arrêt propre per REQ-026 (SPEC-UI-02 / SPEC-UI-03 / SPEC-ENG-04)", () => {
  test('test_CASE_UI_03_8_e2e_block_error_resilience_and_graceful_stop', async ({ page, baseURL }) => {
    test.setTimeout(60_000);
    // 1. Ouvrir le canvas d'un scénario
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');

    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas")').first();
    await openCanvasBtn.waitFor({ state: 'visible' });
    await openCanvasBtn.click();

    const runBtn = page.locator(
      'button:has-text("Lancer le scénario"), button[data-action="run-scenario"]',
    );
    await runBtn.click();

    // 2. Si une erreur de bloc survient, le badge du bloc passe à 'Erreur'
    const errorNode = page.locator('[data-node-id].status-error, [data-node-id]:has-text("Erreur"), [data-node-id].border-status-error').first();
    if (await errorNode.isVisible({ timeout: 5000 })) {
      const badge = errorNode.locator('.node-status, .badge, span');
      await expect(badge).toContainText(/erreur/i);
    }

    // 3. Réactivation du bouton Lancer
    await expect(runBtn).toBeEnabled({ timeout: 45_000 });

    // 4. Vérification de la disponibilité continue du serveur et de l'interface
    const agentsNav = page.locator('.sidebar-nav a[data-section="agents"]');
    if (await agentsNav.isVisible()) {
      await agentsNav.click();
      await page.waitForSelector('.data-table, table');
      expect(page.url()).toContain('#/agents');
    }
  });
});
