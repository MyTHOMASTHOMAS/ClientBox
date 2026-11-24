/**
 * Schéma TypeScript de la ressource Prompt (TYPES-004 / SPEC-DATA-01).
 */

/**
 * Identifiant unique de ressource Prompt.
 */
export type PromptId = string;

/**
 * Définition déclarative d'un modèle de prompt réutilisable.
 */
export interface Prompt {
  readonly id: PromptId;
  readonly name: string;
  readonly content: string;
}
