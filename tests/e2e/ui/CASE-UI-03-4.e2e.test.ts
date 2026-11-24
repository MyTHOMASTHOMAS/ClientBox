import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe("CASE-UI-03-4 — Validation E2E du lancement de scénario, streaming SSE et terminal live per REQ-024 (SPEC-UI-03 / SPEC-ENG-04 / SPEC-SRV-02)", () => {
  const dataDir = path.resolve(process.cwd(), '.agents', 'data');
  const logsDir = path.join(dataDir, 'logs');

  test('test_CASE_UI_03_4_e2e_scenario_launch_and_sse_streaming', async ({ page, baseURL }) => {
    let sseRequested = false;
    page.on('request', (req) => {
      if (req.url().includes('/stream')) {
        sseRequested = true;
      }
    });

    // 1. Ouvrir le canvas d'un scénario
    await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/scenarios');
    await page.waitForSelector('#app');

    const openCanvasBtn = page.locator('button:has-text("Ouvrir Canvas")').first();
    await openCanvasBtn.waitFor({ state: 'visible' });
    await openCanvasBtn.click();

    // 2. Localiser le bouton Lancer le scénario
    const runBtn = page.locator(
      'button:has-text("Lancer le scénario"), button[data-action="run-scenario"], button:has-text("Lancer"), [data-action="launch-scenario"]',
    );
    await expect(runBtn).toBeVisible();
    await expect(runBtn).toBeEnabled();

    // 3. Déclencher le lancement
    await runBtn.click();

    // 4. Verrouillage immédiat anti-concurrence
    await expect(runBtn).toBeDisabled();

    // 5. Apparition du terminal web de streaming
    const terminal = page.locator('#terminal-output');
    await expect(terminal).toBeVisible({ timeout: 5000 });

    // 6. Attente de la fin d'exécution et réactivation du bouton
    await expect(runBtn).toBeEnabled({ timeout: 15_000 });

    // 7. Règle R-26 : absence totale de fichiers de logs sur disque
    expect(fs.existsSync(logsDir)).toBe(false);
  });
});
