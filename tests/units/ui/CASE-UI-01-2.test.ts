import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { ProfilePolicy } from '../../../src/types/models/profile.model.js';
import { buildProfilePersistPayload } from '../../../src/ui/pages/profiles-page.js';
import {
  AGENT_FORM_FIELDS,
  validateAgentForm,
  type AgentFormValues,
  PROFILE_FORM_FIELDS,
  PROFILE_POLICY_OPTIONS,
  validateProfileForm,
  PROMPT_FORM_FIELDS,
  EXIT_FORM_FIELDS,
  validatePromptForm,
  validateExitForm,
  SCENARIO_FORM_FIELDS,
  validateScenarioForm,
} from '../../../src/ui/types/ui.types.js';
import { buildMutationPayload } from '../../../src/ui/hooks/common/use-resources.hook.js';
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

describe('CASE-UI-01-2 — formulaires CRUD et intégrité de validation (SPEC-UI-01)', () => {
  it('test_CASE_UI_01_2_crud_forms_availability_and_validation_integrity', () => {
    const expectedAgent = ['id', 'name', 'profilId', 'cliId'] as const;
    for (const field of expectedAgent) {
      assert.ok(AGENT_FORM_FIELDS.includes(field), `champ Agent manquant : ${field}`);
    }

    const expectedProfile = ['id', 'name', 'systemPrompt', 'policy'] as const;
    for (const field of expectedProfile) {
      assert.ok(PROFILE_FORM_FIELDS.includes(field), `champ Profil manquant : ${field}`);
    }

    for (const field of ['id', 'name', 'contenu'] as const) {
      assert.ok(PROMPT_FORM_FIELDS.includes(field));
    }
    for (const field of ['id', 'name', 'contenu'] as const) {
      assert.ok(EXIT_FORM_FIELDS.includes(field), `champ Exit manquant : ${field}`);
    }
    assert.deepEqual([...EXIT_FORM_FIELDS], ['id', 'name', 'contenu']);
    for (const field of ['id', 'name', 'description', 'payload'] as const) {
      assert.ok(SCENARIO_FORM_FIELDS.includes(field));
    }

    assert.equal(
      [
        AGENT_FORM_FIELDS,
        PROFILE_FORM_FIELDS,
        PROMPT_FORM_FIELDS,
        EXIT_FORM_FIELDS,
        SCENARIO_FORM_FIELDS,
      ].length,
      5,
    );

    const policies: readonly ProfilePolicy[] = PROFILE_POLICY_OPTIONS;
    assert.deepEqual(
      [...policies].sort(),
      ['chaque_prompt', 'debut_scenario', 'une_fois_jusqu_a_clear'].sort(),
    );
    assert.equal(policies.length, 3);

    const missingProfil = validateAgentForm({
      id: 'agent-1',
      name: 'Dev',
      profilId: '',
      cliId: 'cursor-cli',
    });
    assert.equal(missingProfil.ok, false);
    assert.ok(missingProfil.fieldErrors.profilId);
    assertFrenchMessage(missingProfil.fieldErrors.profilId);

    const validAgent: AgentFormValues = {
      id: 'agent-1',
      name: 'Dev',
      profilId: 'profil-standard',
      cliId: 'cursor-cli',
    };
    assert.equal(validateAgentForm(validAgent).ok, true);

    const collision = validateAgentForm(validAgent, {
      existingIds: ['agent-1'],
    });
    assert.equal(collision.ok, false);
    assert.ok(collision.fieldErrors.id);
    assertFrenchMessage(collision.fieldErrors.id);

    assert.equal(
      validateProfileForm({
        id: 'p1',
        name: 'Std',
        systemPrompt: 'Tu es…',
        policy: 'chaque_prompt',
      }).ok,
      true,
    );
    assert.equal(validatePromptForm({ id: 'pr1', name: 'P', contenu: 'texte' }).ok, true);
    assert.equal(
      validateExitForm({
        id: 'ex1',
        name: 'Done',
        contenu: 'Quand tu as terminé, réponds exactement : TERMINER',
      }).ok,
      true,
    );

    const exitPayload = buildMutationPayload({
      kind: 'exits',
      id: 'ex1',
      name: 'Done',
      content: 'Conclus par TERMINER',
    });
    assert.deepEqual(exitPayload, {
      id: 'ex1',
      name: 'Done',
      content: 'Conclus par TERMINER',
    });
    assert.equal('matchers' in exitPayload, false);
    assert.equal(
      validateScenarioForm({
        id: 'sc1',
        name: 'Demo',
        description: 'desc',
        payload: '{}',
      }).ok,
      true,
    );
  });

  it('test_CASE_UI_01_2_build_profile_persist_payload_clears_model_when_empty', () => {
    // Profil initial avec modèle
    const payloadWithModel = buildProfilePersistPayload('prof-1', {
      name: 'Expert',
      systemPrompt: 'Consigne',
      policy: 'chaque_prompt',
      model: 'gpt-5.3-codex',
    });
    assert.equal(payloadWithModel.model, 'gpt-5.3-codex');

    // Mise à jour avec effacement du modèle (valeur vide ou undefined)
    const payloadClearedEmpty = buildProfilePersistPayload('prof-1', {
      name: 'Expert',
      systemPrompt: 'Consigne',
      policy: 'chaque_prompt',
      model: '',
    });
    assert.equal('model' in payloadClearedEmpty, false);
    assert.equal(payloadClearedEmpty.model, undefined);

    const payloadClearedUndefined = buildProfilePersistPayload('prof-1', {
      name: 'Expert',
      systemPrompt: 'Consigne',
      policy: 'chaque_prompt',
      model: undefined,
    });
    assert.equal('model' in payloadClearedUndefined, false);
    assert.equal(payloadClearedUndefined.model, undefined);
  });
});
