import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  UI_FR_CATALOG,
  ENGLISH_DENY_LIST,
  TECH_ALLOW_LIST,
  collectChromeStrings,
} from '../../../src/ui/i18n/fr.i18n.js';

function findDenyListHits(texts: readonly string[]): string[] {
  const hits: string[] = [];
  const allowExact = new Set(TECH_ALLOW_LIST.map((t) => t.toLowerCase()));
  for (const raw of texts) {
    for (const denied of ENGLISH_DENY_LIST) {
      const re = new RegExp(`\\b${denied}\\b`, 'i');
      if (!re.test(raw)) continue;
      const tokens = raw.split(/\s+/).map((t) => t.replace(/[^\w-]/g, ''));
      const onlyAllowedTech = tokens.every(
        (t) => t.length === 0 || allowExact.has(t.toLowerCase()),
      );
      if (onlyAllowedTech && allowExact.has(denied.toLowerCase())) continue;
      hits.push(`${denied} ← « ${raw} »`);
    }
  }
  return hits;
}

function assertFrenchMessage(message: string): void {
  assert.ok(message.length > 0, "message d'erreur vide");
  const hits = findDenyListHits([message]);
  assert.equal(hits.length, 0, `message non français / deny-list : ${hits.join('; ')}`);
  assert.match(
    message,
    /[àâäéèêëïîôùûüçœæ]|obligatoire|requis|invalide|manquant|disponible|erreur|veuillez|champ/i,
  );
}

describe("CASE-UI-01-1 — couverture intégrale de la langue française sur l'UI (SPEC-UI-01)", () => {
  it('test_CASE_UI_01_1_full_french_language_coverage_on_ui', () => {
    assert.ok(Array.isArray(UI_FR_CATALOG.nav));
    assert.ok(UI_FR_CATALOG.nav.length >= 6);
    for (const label of UI_FR_CATALOG.nav) {
      assert.match(
        label,
        /Scénarios|Agents|Profils|Prompts|Conditions Exit|Scripts If|Paramètres|Accueil|Instructions/i,
      );
    }

    const chrome = collectChromeStrings();
    assert.ok(chrome.length > 0);

    const denyHits = findDenyListHits(chrome);
    assert.equal(denyHits.length, 0, `libellés chrome anglais interdits : ${denyHits.join('; ')}`);

    // Allow-list technique : présence tolérée sans déclencher deny
    for (const tech of ['Start', 'Run', 'If', 'cursor-cli', 'JSON', 'CLI']) {
      assert.ok((TECH_ALLOW_LIST as readonly string[]).includes(tech));
    }
    assert.equal(findDenyListHits(['Start', 'Run', 'cursor-cli', 'JSON']).length, 0);

    // Deny-list explicite absente du catalog
    for (const banned of ENGLISH_DENY_LIST) {
      assert.ok(
        !chrome.some((s) => new RegExp(`\\b${banned}\\b`).test(s)),
        `deny-list « ${banned} » trouvée dans le chrome`,
      );
    }

    assert.ok(UI_FR_CATALOG.errors.length > 0);
    for (const msg of UI_FR_CATALOG.errors) {
      assertFrenchMessage(msg);
    }
    assert.ok(UI_FR_CATALOG.confirms.length > 0);
    for (const msg of UI_FR_CATALOG.confirms) {
      assertFrenchMessage(msg);
    }
  });
});
