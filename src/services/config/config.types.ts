/**
 * Types et contrats de configuration applicative déployée.
 */

/**
 * Configuration consolidée et validée de l'application ClientsBox.
 */
export interface AppConfig {
  /** Port HTTP effectif du serveur local. */
  readonly port: number;
  /** Port explicite passé en ligne de commande si fourni. */
  readonly explicitPort?: number;
  /** Adresse IP ou nom d'hôte d'écoute du serveur HTTP. */
  readonly host: string;
  /** Environnement d'exécution Node.js. */
  readonly nodeEnv: 'development' | 'production' | 'test';
  /** Indique si les journaux console sont totalement désactivés. */
  readonly isLogsDisabled: boolean;
  /** Répertoire absolu du workspace hôte. */
  readonly workspacePath: string;
  /** Répertoire absolu des agents (.agents). */
  readonly agentsDir: string;
  /** Répertoire absolu des données persistées (.agents/data). */
  readonly dataRoot: string;
  /** Répertoire absolu d'export de la documentation (.agents/docs). */
  readonly docsRoot: string;
  /** Profondeur maximale d'imbrication pour l'appel de scénarios (-1 = illimité). */
  readonly maxCallScenarioDepth: number;
  /** Chemin absolu validé du binaire Cursor CLI. */
  readonly cursorCliBin: string;
  /** Chemin absolu validé du binaire Antigravity CLI. */
  readonly antigravityCliBin: string;
  /** Chemin absolu validé du binaire Codex CLI. */
  readonly codexCliBin: string;
  /** Délai d'expiration de l'amorce de session Antigravity en millisecondes. */
  readonly antigravityProbeTimeoutMs: number;
  /** Délai d'expiration de l'amorce de session Codex en millisecondes. */
  readonly codexProbeTimeoutMs: number;
  /** Identifiant du scénario cible pour l'exécution directe headless, le cas échéant. */
  readonly execScene?: string;
  /** Chemin du fichier d'environnement explicite utilisé, le cas échéant. */
  readonly envFile?: string;
}

/** Options pour le déploiement de la configuration. */
export interface DeployConfigOptions {
  /** Répertoire de travail personnalisé (pour tests). */
  readonly workspacePath?: string;
  /** Chemin explicite vers un fichier .env cible. */
  readonly envFile?: string;
}
