import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { ProfilePolicy } from '../../../src/types/models/profile.model.js';
import { assemblePrompt } from '../../../src/domain/prompt/prompt.assembler.js';
import {
  shouldInjectSystemPrompt,
  updatePolicyState,
  type PolicyInjectionState,
} from '../../../src/domain/prompt/injection-policy.evaluator.js';
import { flushPromises } from '../../helpers/flush-promises.js';

function initialPolicyState(): PolicyInjectionState {
  return {
    hasInjectedOnce: false,
    hasInjectedThisScenario: false,
  };
}

function assembleWithPolicy(
  policy: ProfilePolicy,
  state: PolicyInjectionState,
  systemPrompt: string,
  userPrompt: string,
): { assembled: string; nextState: PolicyInjectionState } {
  const inject = shouldInjectSystemPrompt(policy, state);
  const assembled = inject
    ? assemblePrompt(systemPrompt, userPrompt)
    : assemblePrompt('', userPrompt);
  const nextState = updatePolicyState(policy, state, 'run');
  return { assembled, nextState };
}

describe("CASE-ENG-04-2 — politiques d'injection de profil et réinitialisation ClearContext (SPEC-ENG-04)", () => {
  it('test_CASE_ENG_04_2_profile_injection_policies_and_clear_context_reset', async () => {
    const systemPrompt = 'Prompt Système Standard';
    const userPrompt = 'Action utilisateur';

    // chaque_prompt : injection systématique
    let stateChaque = initialPolicyState();
    const r1 = assembleWithPolicy('chaque_prompt', stateChaque, systemPrompt, userPrompt);
    stateChaque = r1.nextState;
    assert.ok(r1.assembled.includes(systemPrompt));
    const r2 = assembleWithPolicy('chaque_prompt', stateChaque, systemPrompt, userPrompt);
    await flushPromises();
    assert.ok(r2.assembled.includes(systemPrompt));

    // debut_scenario : 1er oui, 2e non
    let stateDebut = initialPolicyState();
    const r3 = assembleWithPolicy('debut_scenario', stateDebut, systemPrompt, userPrompt);
    stateDebut = r3.nextState;
    assert.ok(r3.assembled.includes(systemPrompt));
    const r4 = assembleWithPolicy('debut_scenario', stateDebut, systemPrompt, userPrompt);
    await flushPromises();
    assert.equal(r4.assembled, userPrompt);
    assert.ok(!r4.assembled.includes(systemPrompt));

    // une_fois_jusqu_a_clear : Run → Run → Clear → Run
    let stateClear = initialPolicyState();
    const r5 = assembleWithPolicy('une_fois_jusqu_a_clear', stateClear, systemPrompt, userPrompt);
    stateClear = r5.nextState;
    assert.ok(r5.assembled.includes(systemPrompt));
    const r6 = assembleWithPolicy('une_fois_jusqu_a_clear', stateClear, systemPrompt, userPrompt);
    stateClear = r6.nextState;
    assert.equal(r6.assembled, userPrompt);
    assert.ok(!r6.assembled.includes(systemPrompt));

    stateClear = updatePolicyState('une_fois_jusqu_a_clear', stateClear, 'clearContext');
    const r7 = assembleWithPolicy('une_fois_jusqu_a_clear', stateClear, systemPrompt, userPrompt);
    await flushPromises();
    assert.ok(r7.assembled.includes(systemPrompt));
  });
});
