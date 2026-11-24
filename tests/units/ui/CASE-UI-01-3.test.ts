import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { CLIAdapter } from '../../../src/types/contracts/cli-adapter.contract.js';
import { validateAgentForm, getCliSelectOptions } from '../../../src/ui/types/ui.types.js';
import { AdapterRegistryService } from '../../../src/services/adapters/adapter-registry.service.js';
import { CursorCLIAdapter } from '../../../src/lib/adapters/cursor/cursor-cli.adapter.js';
import { ENGLISH_DENY_LIST, TECH_ALLOW_LIST } from '../../../src/ui/i18n/fr.i18n.js';

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

describe("CASE-UI-01-3 — sélecteur CLI d'agent restreint aux adaptateurs embarqués (SPEC-UI-01)", () => {
  it('test_CASE_UI_01_3_agent_cli_selector_filtered_to_embedded_adapters', () => {
    const registry = new AdapterRegistryService([new CursorCLIAdapter()]);
    const operational = registry.listOperationalAdapters();
    assert.equal(operational.length, 1);
    assert.equal(operational[0]?.cliId, 'cursor-cli');

    const options = getCliSelectOptions(registry);
    assert.deepEqual(
      options.map((o) => o.value),
      ['cursor-cli'],
    );
    assert.equal(options.length, 1);

    // Aucun adapter fictif / non embarqué
    const forbidden = ['unsupported-cli', 'claude-code', 'aider', 'gemini'];
    for (const bad of forbidden) {
      assert.ok(!options.some((o) => o.value === bad));
    }

    const rejected = validateAgentForm(
      {
        id: 'a1',
        name: 'X',
        profilId: 'p1',
        cliId: 'unsupported-cli',
      },
      { allowedCliIds: options.map((o) => o.value) },
    );
    assert.equal(rejected.ok, false);
    assert.ok(rejected.fieldErrors.cliId);
    assertFrenchMessage(rejected.fieldErrors.cliId);
    assert.match(rejected.fieldErrors.cliId, /CLI|disponible|supporté|adaptateur/i);

    const accepted = validateAgentForm(
      {
        id: 'a1',
        name: 'X',
        profilId: 'p1',
        cliId: 'cursor-cli',
      },
      { allowedCliIds: ['cursor-cli'] },
    );
    assert.equal(accepted.ok, true);

    // Registre vide → aucune option sélectionnable
    const emptyRegistry = new AdapterRegistryService([] as CLIAdapter[]);
    assert.deepEqual(getCliSelectOptions(emptyRegistry), []);
  });
});
