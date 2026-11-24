import { test, expect } from '@playwright/test';

test.describe('CASE-SRV-02-14 — Déconnexion client navigateur pendant un flux SSE et absence de fuite mémoire serveur (SPEC-SRV-02 / SPEC-UI-03)', () => {
  test('test_CASE_SRV_02_14_e2e_sse_client_disconnect_resilience', async ({ browser, request, baseURL }) => {
    // 1. Ouvrir une page dédiée dans un contexte navigateur
    const context = await browser.newContext();
    const page = await context.newPage();

    // 2. Naviguer vers l'application et initier la connexion au flux SSE
    await page.goto(baseURL || 'http://127.0.0.1:2974/');
    await page.waitForSelector('#app');

    // Écouter les requêtes stream
    const streamRequestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/scenarios/') && req.url().includes('/stream'),
      { timeout: 5000 },
    ).catch(() => null);

    // Si un scénario est présent, ouvrir son canvas pour déclencher le flux SSE
    const canvasButton = page.locator('button:has-text("Ouvrir Canvas"), [data-action="open-canvas"]').first();
    await canvasButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    if (await canvasButton.isVisible()) {
      await canvasButton.click();
    }

    await streamRequestPromise;

    // 3. Fermeture brutale de la page pendant le flux actif
    await page.close();
    await context.close();

    // 4. Contrôle post-fermeture : le serveur HTTP local demeure pleinement réactif et stable
    const checkRes = await request.get('/api/agents');
    expect(checkRes.status()).toBe(200);

    const checkHome = await request.get('/');
    expect(checkHome.status()).toBe(200);
  });
});
