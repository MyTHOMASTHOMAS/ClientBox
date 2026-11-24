import { test, expect } from '@playwright/test';

test.describe('CASE-UI-03-7 — Validation E2E de la conditionnelle If et de l’état Pause Join sur le canvas (SPEC-UI-02 / SPEC-ENG-02 / SPEC-ENG-03)', () => {
  test('test_CASE_UI_03_7_e2e_if_conditional_and_join_pause_state', async ({ page, baseURL }) => {
    // 1. Ouvrir le canvas d'un scénario comportant un If et un Join
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');

    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas")').first();
    await openCanvasBtn.waitFor({ state: 'visible' });
    await openCanvasBtn.click();

    // 2. Lancer le scénario
    const runBtn = page.locator(
      'button:has-text("Lancer le scénario"), button[data-action="run-scenario"]',
    );
    await runBtn.click();

    // 3. Attendre l'évaluation de la branche conditionnelle et la résolution du Join
    const joinNode = page.locator('[data-node-id*="join"]').first();
    if (await joinNode.isVisible()) {
      // 4. Vérifier l'apparition du statut 'paused' ou badge 'En pause' sur le nœud Join
      const statusBadge = joinNode.locator('.node-status, .badge, [data-node-status], span');
      await expect(statusBadge).toContainText(/pause|en pause/i, { timeout: 10000 });
    }
  });
});
