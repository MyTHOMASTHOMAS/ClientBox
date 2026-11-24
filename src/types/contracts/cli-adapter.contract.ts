/**
 * Contrat d'adapter CLI embarqué (TYPES-001 / ADR-002 / SPEC-ADPT-01).
 * Déclaratif pur — zéro logique runtime.
 */

/**
 * Contexte d'exécution fourni à l'adaptateur pour construire la commande CLI.
 */
export interface ExecutionContext {
  readonly workspacePath: string;
  readonly agentId: string;
  readonly assembledPrompt: string;
  /** Session conversationnelle de scénario à reprendre (SPEC-ADPT-03). */
  readonly sessionId?: string;
  /** Identifiant optionnel du modèle d'IA cible configuré sur le profil. */
  readonly model?: string;
  readonly cliOpaque?: Readonly<Record<string, unknown>>;
}

/**
 * Types d'événements de flux générés par les adaptateurs CLI.
 */
export type AgentStreamEventType = 'stdout' | 'stderr' | 'exit' | 'error';

/**
 * Événement normalisé extrait du flux de sortie du processus CLI.
 */
export interface AgentStreamEvent {
  readonly type: AgentStreamEventType;
  readonly chunk: string;
}

/**
 * Options complètes nécessaires pour instancier un processus CLI.
 */
export interface CommandSpawnOptions {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string>>;
}

/**
 * Contrat d'adaptation pour un outil d'assistance CLI spécifique (Cursor, Claude, Copilot, etc.).
 */
export interface CLIAdapter {
  readonly cliId: string;
  buildCommand(ctx: ExecutionContext): CommandSpawnOptions;
  parseStreamLine(line: string): AgentStreamEvent;
  /** Normalise la sortie brute du processus CLI pour restituer uniquement la réponse de l'agent. */
  parseOutput?(rawOutput: string): string;
  /** Extrait l'identifiant de session conversationnelle depuis une ligne de sortie du processus. */
  extractSessionId?(line: string): string | null;
  /** Ouvre une nouvelle session conversationnelle native et retourne son identifiant. */
  createSession?(ctx: ExecutionContext): Promise<string>;
  /** Énumère les modèles d'IA disponibles ou supportés. */
  listModels?(): Promise<readonly string[]>;
}
