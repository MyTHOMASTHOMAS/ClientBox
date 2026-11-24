/**
 * State machine pure des politiques d'injection profil (DOM-003 / SPEC-ENG-04).
 * Immutable : chaque transition retourne un nouvel état.
 */

import type { ProfilePolicy } from '../../types/models/profile.model.js';

/** État d'injection du prompt système dans le contexte d'exécution. */
export interface PolicyInjectionState {
  readonly hasInjectedOnce: boolean;
  readonly hasInjectedThisScenario: boolean;
}

/** Événements déclencheurs pour la machine à états de politique d'injection. */
export type PolicyEvent = 'run' | 'clearContext';

/**
 * Détermine si le prompt système du profil doit être injecté selon la politique et l'état courant.
 *
 * @param policy Politique d'injection du profil
 * @param state État d'injection actuel
 * @returns Booléen indiquant si l'injection doit avoir lieu
 */
export function shouldInjectSystemPrompt(policy: ProfilePolicy, state: PolicyInjectionState) {
  switch (policy) {
    case 'chaque_prompt':
      return true;
    case 'debut_scenario':
      return !state.hasInjectedThisScenario;
    case 'une_fois_jusqu_a_clear':
      return !state.hasInjectedOnce;
  }
}

/**
 * Met à jour l'état d'injection suite à un événement (exécution ou réinitialisation du contexte).
 *
 * @param policy Politique d'injection du profil
 * @param state État d'injection actuel
 * @param event Événement survenu (run ou clearContext)
 * @returns Nouvel état d'injection mis à jour
 */
export function updatePolicyState(
  policy: ProfilePolicy,
  state: PolicyInjectionState,
  event: PolicyEvent,
) {
  if (event === 'clearContext') {
    return {
      hasInjectedOnce: false,
      hasInjectedThisScenario: state.hasInjectedThisScenario,
    };
  }

  // event === 'run' — marque l'injection effectuée selon la policy
  void policy;
  return {
    hasInjectedOnce: true,
    hasInjectedThisScenario: true,
  };
}
