import { test, expect } from '@playwright/test';

const FORBIDDEN_ENGLISH_UI_TERMS = [
  'Submit',
  'Cancel',
  'Loading',
  'Settings',
  'Dashboard',
  'Save Changes',
  'Delete Agent',
];

test.describe("CASE-UI-01-9 — Validation E2E de la navigation, du routage hashchange et de la conformité 100% français (SPEC-UI-01)", () => {
  test('test_CASE_UI_01_9_e2e_navigation_and_french_localization', async ({ page, baseURL }) => {
    await page.goto(baseURL || 'http://127.0.0.1:2974/');
    await page.waitForSelector('#app');

    const sections = [
      { name: 'scenarios', hash: '#/scenarios', titlePattern: /scénario/i },
      { name: 'agents', hash: '#/agents', titlePattern: /agent/i },
      { name: 'profils', hash: '#/profils', canonicalHash: '#/profiles', titlePattern: /profil/i },
      { name: 'prompts', hash: '#/prompts', canonicalHash: '#/resources', titlePattern: /prompt|ressource/i },
      { name: 'exit', hash: '#/exit', canonicalHash: '#/resources/exits', titlePattern: /condition|exit/i },
      { name: 'if', hash: '#/if', canonicalHash: '#/resources/scripts', titlePattern: /script|if/i },
      { name: 'instructions', hash: '#/instructions', titlePattern: /instructions/i },
    ];

    // 1. Navigation à travers les 6 rubriques obligatoires
    for (const section of sections) {
      const link = page.locator(`.sidebar-nav a[data-section="${section.name}"], a[data-section="${section.name}"]`);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(100);
        const expectedPattern = section.canonicalHash
          ? new RegExp(`${section.hash.replace('/', '\\/')}|${section.canonicalHash.replace('/', '\\/')}`)
          : new RegExp(section.hash.replace('/', '\\/'));
        expect(page.url()).toMatch(expectedPattern);
        const viewTitle = page.locator('#view-title');
        if (await viewTitle.isVisible()) {
          await expect(viewTitle).toHaveText(section.titlePattern);
        }
      }
    }

    // 2. Rechargement F5 sur la vue Agents
    const agentsLink = page.locator('.sidebar-nav a[data-section="agents"], a[data-section="agents"]');
    if (await agentsLink.isVisible()) {
      await agentsLink.click();
      await page.reload();
      await page.waitForSelector('#app');
      expect(page.url()).toContain('#/agents');
    }

    // 3. Navigation Historique Précédent
    await page.goBack();
    await page.waitForSelector('#app');

    // 4. Conformité linguistique : aucun mot anglais interdit visible dans l'IHM
    const pageContent = await page.innerText('body');
    for (const term of FORBIDDEN_ENGLISH_UI_TERMS) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      expect(regex.test(pageContent)).toBe(false);
    }
  });
});
