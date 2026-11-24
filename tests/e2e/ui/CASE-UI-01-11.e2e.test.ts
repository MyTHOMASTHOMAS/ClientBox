import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe("CASE-UI-01-11 — Validation E2E de l'intégrité référentielle et du rejet 409 de suppression de profil (SPEC-UI-01 / SPEC-DATA-01)", () => {
  const profilesDir = path.resolve(process.cwd(), '.agents', 'data', 'profils');
  const agentsDir = path.resolve(process.cwd(), '.agents', 'data', 'agents');

  test('test_CASE_UI_01_11_e2e_profile_referential_integrity_and_409_rejection', async ({ page, baseURL }) => {
    // 1. Initialiser un profil et un agent lié sur disque pour le test E2E si nécessaire
    const profileId = 'profil-protege-e2e';
    const agentId = 'agent-lie-e2e';

    fs.mkdirSync(profilesDir, { recursive: true });
    fs.mkdirSync(agentsDir, { recursive: true });

    const profileFile = path.join(profilesDir, `${profileId}.json`);
    const agentFile = path.join(agentsDir, `${agentId}.json`);

    fs.writeFileSync(
      profileFile,
      JSON.stringify({
        id: profileId,
        name: 'Profil Protégé E2E',
        systemPrompt: 'Directive test',
        policy: 'chaque_prompt',
      }),
      'utf-8',
    );

    fs.writeFileSync(
      agentFile,
      JSON.stringify({
        id: agentId,
        name: 'Agent Lié E2E',
        profilId: profileId,
        cliId: 'cursor-cli',
      }),
      'utf-8',
    );

    try {
      // 2. Ouvrir la vue des profils
      await page.goto((baseURL || 'http://127.0.0.1:2974/') + '#/profils');
      await page.waitForSelector('#app');

      // 3. Tenter de supprimer le profil lié
      const deleteProfileBtn = page.locator(
        `tr:has-text("Profil Protégé E2E") button:has-text("Supprimer"), tr:has-text("Profil Protégé E2E") [data-action="delete"]`,
      );
      await deleteProfileBtn.waitFor({ state: 'visible' });
      page.once('dialog', (d) => d.accept());
      await deleteProfileBtn.click();

      // 4. Vérifier l'apparition d'un message d'erreur bloquant en français (409)
      const errorAlert = page.locator('.alert-danger, .toast-error, .error-message, [role="alert"]');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/impossible|utilisé|agent/i);

      // Le profil doit demeurer présent dans la liste et sur le disque
      await expect(page.locator('.data-table, table')).toContainText('Profil Protégé E2E');
      expect(fs.existsSync(profileFile)).toBe(true);

      // 5. Supprimer l'agent lié
      if (fs.existsSync(agentFile)) {
        fs.unlinkSync(agentFile);
      }

      // 6. Retenter la suppression du profil désormais libre
      await page.reload();
      await page.waitForSelector('#app');
      const deleteProfileBtn2 = page.locator(
        `tr:has-text("Profil Protégé E2E") button:has-text("Supprimer"), tr:has-text("Profil Protégé E2E") [data-action="delete"]`,
      );
      await deleteProfileBtn2.waitFor({ state: 'visible' });
      page.once('dialog', (d) => d.accept());
      await deleteProfileBtn2.click();
      await page.waitForTimeout(500);

      // La suppression doit réussir
      expect(fs.existsSync(profileFile)).toBe(false);
    } finally {
      // Nettoyage de sécurité
      if (fs.existsSync(agentFile)) fs.unlinkSync(agentFile);
      if (fs.existsSync(profileFile)) fs.unlinkSync(profileFile);
    }
  });
});
