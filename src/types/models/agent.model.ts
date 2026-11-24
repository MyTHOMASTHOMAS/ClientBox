/**
 * Schéma TypeScript de la ressource Agent (TYPES-002 / SPEC-DATA-01).
 * Cardinalité profil 1-1 via `profilId` ; rattachement CLI via `cliId` (R-03, REQ-009).
 */

/**
 * Identifiant unique de ressource Agent.
 */
export type AgentId = string;

/**
 * Définition déclarative d'un agent avec son profil et son CLI associé.
 */
export interface Agent {
  readonly id: AgentId;
  readonly name: string;
  readonly profilId: string;
  readonly cliId: string;
  /** Identifiant optionnel du modèle d'IA cible (ex: 'gpt-5.3-codex', 'gemini-2.5-pro'). */
  readonly model?: string;
}
