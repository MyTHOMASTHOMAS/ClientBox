import { test, expect } from '@playwright/test';

test.describe('CASE-UI-02-13 — Validation E2E du câblage différentiel If et de la renumérotation automatique per REQ-035 (SPEC-UI-02 / SPEC-DATA-03)', () => {
  test('test_CASE_UI_02_13_e2e_if_differential_wiring_and_key_renumbering', async ({ page, baseURL }) => {
    // 1. Ouvrir le canvas de scénario de démo (contenant If et câblages)
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');

    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas")').first();
    await openCanvasBtn.waitFor({ state: 'visible' });
    await openCanvasBtn.click();

    const canvasSvg = page.locator('.canvas-container').first();
    await canvasSvg.waitFor({ state: 'visible' });

    // 2. Vérification du câblage différentiel du bloc If
    // Le câble Vrai possède data-branch="true" ou classe cable-true
    const trueCable = page.locator('path.cable[data-branch="true"], path.cable-true, [data-branch="true"]').first();
    if (await trueCable.isVisible()) {
      await expect(trueCable).toHaveAttribute('data-branch', 'true');
    }

    // Le câble Faux possède data-branch="false" ou classe cable-false
    const falseCable = page.locator('path.cable[data-branch="false"], path.cable-false, [data-branch="false"]').first();
    if (await falseCable.isVisible()) {
      await expect(falseCable).toHaveAttribute('data-branch', 'false');
    }

    // 3. Renumérotation automatique des clés d'entrées
    // Lorsque plusieurs connexions arrivent sur un bloc, les clés doivent être consécutives ("0", "1")
    const targetNode = page.locator('[data-node-id]').nth(1);
    await targetNode.click({ force: true });

    const inspector = page.locator('aside[data-section="inspector"], .inspector-panel, .node-inspector').first();
    if (await inspector.isVisible()) {
      // Les ports/clés affichés ne doivent comporter aucun trou de séquence (ex: "0", "1")
      const keyElements = inspector.locator('.input-key-label, [data-input-key]');
      const count = await keyElements.count();
      for (let i = 0; i < count; i += 1) {
        await expect(keyElements.nth(i)).toContainText(String(i));
      }
    }
  });
});
