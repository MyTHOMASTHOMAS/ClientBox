/**
 * Schéma TypeScript de la ressource Exit / prompt d'ordre de sortie
 * (TYPES-005 / SPEC-DATA-01 / R-07 / CR-012).
 */

/**
 * Identifiant unique d'ordre de sortie.
 */
export type ExitConditionId = string;

/**
 * Ordre de sortie textuel additionné au prompt d'un bloc Run.
 */
export interface ExitCondition {
  readonly id: ExitConditionId;
  readonly name: string;
  readonly content: string;
}
