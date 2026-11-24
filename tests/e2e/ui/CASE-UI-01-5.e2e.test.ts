import { test, expect } from '@playwright/test';

test.describe("CASE-UI-01-5 — Validation E2E de la restitution visuelle complète du jeu de données seed dans l'IHM (SPEC-UI-01 / AC-UI-01-4)", () => {
  test('test_CASE_UI_01_5_e2e_full_seed_resources_visual_rendering', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (req) => {
      const url = req.url();
      // Ignorer les polices et CDN tiers pour immuniser les tests locaux contre les latences réseau externes
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        return;
      }
      failedRequests.push(`${req.method()} ${url} - ${req.failure()?.errorText}`);
    });

    // 1. Chargement de l'application (vue par défaut Scénarios sur le serveur local dev)
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);

    const appRoot = page.locator('#app');
    await appRoot.waitFor({ state: 'attached' });

    // 2. Vérification de la rubrique Scénarios (seed templates + éventuels scénarios locaux)
    const viewTitle = page.locator('#view-title');
    if (await viewTitle.isVisible()) {
      await expect(viewTitle).toContainText(/Scénarios/i);
    }
    const scenarioTable = page.locator('.data-table, table');
    await scenarioTable.waitFor({ state: 'visible' });

    const scenarioRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(scenarioRows).toHaveCount(7);
    await expect(scenarioRows.filter({ hasText: 'Scénario Démo Pipeline Dev' })).toBeVisible();
    await expect(scenarioRows.filter({ hasText: 'Scénario Démo Pipeline Dev' })).toContainText(
      'Scénario exemple reliant Start -> Agent Codeur -> If Validation -> Agent Validateur',
    );
    await expect(
      scenarioRows.filter({ hasText: 'Scénario Démo Pipeline Dev' }).locator('button, a'),
    ).toContainText('Ouvrir Canvas');
    await expect(scenarioRows.filter({ hasText: 'Test Step 1 — Dialogue Multi-Agents' })).toBeVisible();
    await expect(scenarioRows.filter({ hasText: 'Test Step 2 — Branchement Conditionnel If' })).toBeVisible();
    await expect(
      scenarioRows.filter({ hasText: 'Test Step 3 — Clear Context et Amnésie de Session' }),
    ).toBeVisible();
    await expect(scenarioRows.filter({ hasText: 'Test Step 4 — Commande Shell Native' })).toBeVisible();
    await expect(
      scenarioRows.filter({ hasText: 'Test Step 5 — Récursion Contrôlée CallScenario' }),
    ).toBeVisible();
    await expect(
      scenarioRows.filter({ hasText: 'Suite de Tests Complète — Orchestrateur avec Audit IA' }),
    ).toBeVisible();

    // 3. Navigation vers Agents
    const agentsLink = page.locator(
      '.sidebar-nav a[data-section="agents"], a[data-section="agents"]',
    );
    await agentsLink.click();
    if (await viewTitle.isVisible()) {
      await expect(viewTitle).toContainText(/Agents/i);
    }
    await page.waitForSelector('.data-table tbody tr:not(.empty), table tbody tr:not(.empty)');

    const agentRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(agentRows).toHaveCount(5);

    const codeurRow = agentRows.filter({ hasText: 'Agent Codeur' });
    await expect(codeurRow).toBeVisible();
    await expect(codeurRow).toContainText('profil-developpeur');
    await expect(codeurRow).toContainText('cursor-cli');

    const validateurRow = agentRows.filter({ hasText: 'Agent Validateur' });
    await expect(validateurRow).toBeVisible();
    await expect(validateurRow).toContainText('profil-reviewer');
    await expect(validateurRow).toContainText('cursor-cli');

    const testARow = agentRows.filter({ hasText: 'Agent Test A' });
    await expect(testARow).toBeVisible();
    await expect(testARow).toContainText('profil-test-minimal');
    await expect(testARow).toContainText('cursor-cli');

    const testBRow = agentRows.filter({ hasText: 'Agent Test B' });
    await expect(testBRow).toBeVisible();
    await expect(testBRow).toContainText('profil-test-minimal');
    await expect(testBRow).toContainText('cursor-cli');

    const auditeurRow = agentRows.filter({ hasText: 'Agent Auditeur IA' });
    await expect(auditeurRow).toBeVisible();
    await expect(auditeurRow).toContainText('profil-auditeur');
    await expect(auditeurRow).toContainText('cursor-cli');

    // 4. Navigation vers Profils
    const profilsLink = page.locator(
      '.sidebar-nav a[data-section="profils"], a[data-section="profils"], a[data-section="profiles"]',
    );
    await profilsLink.click();
    if (await viewTitle.isVisible()) {
      await expect(viewTitle).toContainText(/Profils|Profiles/i);
    }
    await page.waitForSelector('.data-table tbody tr:not(.empty), table tbody tr:not(.empty)');

    const profilRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(profilRows).toHaveCount(4);

    const devProfilRow = profilRows.filter({ hasText: 'Profil Développeur TypeScript' });
    await expect(devProfilRow).toBeVisible();
    await expect(devProfilRow).toContainText('chaque_prompt');
    await expect(devProfilRow).toContainText('Tu es un expert développeur TypeScript');

    const reviewerProfilRow = profilRows.filter({ hasText: 'Profil Reviewer de Code' });
    await expect(reviewerProfilRow).toBeVisible();
    await expect(reviewerProfilRow).toContainText('debut_scenario');
    await expect(reviewerProfilRow).toContainText('Tu es un relecteur de code expérimenté');

    const testProfilRow = profilRows.filter({ hasText: 'Profil Test Minimal' });
    await expect(testProfilRow).toBeVisible();
    await expect(testProfilRow).toContainText('une_fois_jusqu_a_clear');
    await expect(testProfilRow).toContainText('Mode test');

    const auditeurProfilRow = profilRows.filter({ hasText: 'Profil Auditeur Qualité IA' });
    await expect(auditeurProfilRow).toBeVisible();
    await expect(auditeurProfilRow).toContainText('chaque_prompt');
    await expect(auditeurProfilRow).toContainText('Tu es un auditeur qualité logiciel');

    // 5. Navigation vers Prompts
    const promptsLink = page.locator(
      '.sidebar-nav a[data-section="prompts"], a[data-section="prompts"], a[data-section="resources"]',
    );
    await promptsLink.click();
    if (await viewTitle.isVisible()) {
      await expect(viewTitle).toContainText(/Prompts|Ressources/i);
    }
    await page.waitForSelector('.data-table tbody tr:not(.empty), table tbody tr:not(.empty)');

    const promptRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(promptRows).toHaveCount(7);

    const genPromptRow = promptRows.filter({ hasText: 'Génération de fonctionnalités' });
    await expect(genPromptRow).toBeVisible();
    await expect(genPromptRow).toContainText('Implémente la fonctionnalité demandée');

    const valPromptRow = promptRows.filter({ hasText: 'Audit et validation' });
    await expect(valPromptRow).toBeVisible();
    await expect(valPromptRow).toContainText('Analyse les modifications de code');

    await expect(promptRows.filter({ hasText: 'Step 1 — Agent A écrit' })).toBeVisible();
    await expect(promptRows.filter({ hasText: 'Step 3 — Retenir le secret' })).toBeVisible();
    await expect(promptRows.filter({ hasText: 'Audit de la suite de tests' })).toBeVisible();

    // 6. Navigation vers Conditions Exit
    const exitLink = page.locator(
      '.sidebar-nav a[data-section="exit"], a[data-section="exit"], a[data-section="resources/exits"]',
    );
    await exitLink.click();
    if (await viewTitle.isVisible()) {
      await expect(viewTitle).toContainText(/Conditions Exit|Exit/i);
    }
    await page.waitForSelector('.data-table tbody tr:not(.empty), table tbody tr:not(.empty)');

    const exitRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(exitRows).toHaveCount(3);
    await expect(exitRows.filter({ hasText: 'Fin TERMINE' })).toContainText('exit-termine');
    await expect(exitRows.filter({ hasText: 'Fin TERMINE' })).toContainText('TERMINE');
    await expect(exitRows.filter({ hasText: 'Clôture audit' })).toContainText('exit-audit');
    await expect(exitRows.filter({ hasText: 'Clôture audit' })).toContainText(/AUDIT/i);
    await expect(exitRows.filter({ hasText: 'Clôture FAIT' })).toContainText('exit-fait');
    await expect(exitRows.filter({ hasText: 'Clôture FAIT' })).toContainText('FAIT');
    await expect(exitRows.filter({ hasText: 'substring' })).toHaveCount(0);
    await expect(exitRows.filter({ hasText: 'regex' })).toHaveCount(0);

    // 7. Navigation vers Scripts If
    const ifLink = page.locator(
      '.sidebar-nav a[data-section="if"], a[data-section="if"], a[data-section="resources/scripts"]',
    );
    await ifLink.click();
    if (await viewTitle.isVisible()) {
      await expect(viewTitle).toContainText(/Scripts If|If|Scripts/i);
    }
    await page.waitForSelector('.data-table tbody tr:not(.empty), table tbody tr:not(.empty)');

    const ifRows = page.locator('.data-table tbody tr, table tbody tr');
    await expect(ifRows).toHaveCount(3);
    await expect(ifRows.filter({ hasText: 'est-valide' })).toContainText('est-valide.js');
    await expect(ifRows.filter({ hasText: 'if-step2-branching' })).toContainText(
      'if-step2-branching.js',
    );
    await expect(ifRows.filter({ hasText: 'if-step5-recursion' })).toContainText(
      'if-step5-recursion.js',
    );

    // 8. Aucune requête réseau en échec
    expect(failedRequests).toEqual([]);
  });
});
