/**
 * Schéma TypeScript de la ressource Profil (TYPES-003 / SPEC-DATA-01 / R-06).
 * Enum `policy` strictement 3 valeurs ; défaut applicatif = `chaque_prompt`.
 */

/**
 * Identifiant unique de ressource Profil.
 */
export type ProfileId = string;

/**
 * Politiques d'injection du prompt système dans les interactions CLI.
 */
export type ProfilePolicy = 'chaque_prompt' | 'debut_scenario' | 'une_fois_jusqu_a_clear';

/**
 * Définition déclarative d'un profil associant prompt système et politique d'injection.
 */
export interface Profile {
  readonly id: ProfileId;
  readonly name: string;
  readonly systemPrompt: string;
  readonly policy: ProfilePolicy;
  /** Identifiant optionnel du modèle d'IA cible (ex: 'gpt-5.3-codex'). */
  readonly model?: string;
}
