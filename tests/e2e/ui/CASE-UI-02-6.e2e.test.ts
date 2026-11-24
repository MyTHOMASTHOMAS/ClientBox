import { test, expect } from '@playwright/test';

test.describe("CASE-UI-02-6 — Validation E2E de l'interaction graphique sur le Canvas (SPEC-UI-02 / AC-UI-02-6)", () => {
  test('test_CASE_UI_02_6_canvas_container_and_navigation_e2e', async ({ page }) => {
    // 1. Navigation vers l'application sur le serveur local dev
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);

    // 2. Accès à la rubrique "Scénarios"
    const scenarioLink = page.locator('.sidebar-nav a[data-section="scenarios"], a[data-section="scenarios"]');
    await scenarioLink.waitFor({ state: 'visible' });
    await expect(scenarioLink).toBeVisible();
    await scenarioLink.click();

    // Ouvrir le premier canvas si présent sur la vue de liste
    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas"), [data-action="open-canvas"]').first();
    if (await openCanvasBtn.isVisible()) {
      await openCanvasBtn.click();
    }

    // 3. Vérification du conteneur de canvas
    const canvasContainer = page.locator('.canvas-container').first();
    await canvasContainer.waitFor({ state: 'visible' });
    await expect(canvasContainer).toBeVisible();

    // 4. Vérification de la vue de terminal
    const terminalOutput = page.locator('#terminal-output');
    await terminalOutput.waitFor({ state: 'visible' });
    await expect(terminalOutput).toBeVisible();
    await expect(terminalOutput).toContainText(/ClientsBox/i);
  });
});
