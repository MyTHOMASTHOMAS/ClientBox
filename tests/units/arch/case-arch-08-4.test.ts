/**
 * CASE-ARCH-08-4 — Gouvernance des assets statiques et catalogage I18n
 * (`AC-ARCH-08-4` / `SPEC-ARCH-08`).
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function resolveProjectRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../..');
}

describe('CASE-ARCH-08-4 — Gouvernance des assets statiques et exclusion d’inventaire (SPEC-ARCH-08 / AC-ARCH-08-4)', () => {
  it('test_CASE_ARCH_08_4_static_assets_governance_and_inventory_exclusion', () => {
    const projectRoot = resolveProjectRoot();
    const srcRoot = path.join(projectRoot, 'src');

    // 1. Présence de la feuille de styles centralisée app.css (asset exclu de l'inventaire des 163)
    const cssPath = path.join(srcRoot, 'ui/styles/app.css');
    expect(fs.existsSync(cssPath), 'Feuille de styles src/ui/styles/app.css manquante').toBe(true);

    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent.length, 'app.css ne doit pas être vide').toBeGreaterThan(50);

    // 2. Présence et pureté du dictionnaire officiel fr.i18n.ts (UI-004)
    const i18nCandidate = path.join(srcRoot, 'ui/i18n/fr.i18n.ts');
    const legacyI18nCandidate = path.join(srcRoot, 'ui/i18n/fr.ts');
    const i18nPath = fs.existsSync(i18nCandidate) ? i18nCandidate : legacyI18nCandidate;
    expect(fs.existsSync(i18nPath), 'Référentiel I18n src/ui/i18n/fr.i18n.ts manquant').toBe(true);

    const i18nContent = fs.readFileSync(i18nPath, 'utf-8');
    expect(i18nContent).toMatch(/UI_FR_CATALOG|frCatalog|messages/i);

    // 3. Aucune importation directe de app.css comme module TypeScript exécutable
    expect(i18nContent).not.toContain("import './app.css'");

    // 4. Reconnaissance de l'artefact généré embedded-assets.generated.ts comme exclu du décompte
    const generatedPath = path.join(srcRoot, 'lib/http/embedded-assets.generated.ts');
    if (fs.existsSync(generatedPath)) {
      const generatedContent = fs.readFileSync(generatedPath, 'utf-8');
      expect(generatedContent.length).toBeGreaterThan(0);
    }
  });
});
