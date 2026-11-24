/**
 * Service de déploiement et validation de la configuration applicative.
 * Consommateur unique et exclusif du dossier déclaratif src/config/.
 */

import {
  CLIENTSBOX_CLI_SCHEMA,
  CLIENTSBOX_ENV_SCHEMA,
  DEFAULT_SERVER_PORT,
} from '../../config/index.js';
import { parseCliArgs } from '../../lib/process/args-parser/index.js';
import {
  initializeAndConfirmEnvironment,
  resolveAgentsLayout,
  resolveWorkspacePath,
} from '../../lib/process/env/index.js';
import type { AppConfig, DeployConfigOptions } from './config.types.js';

/**
 * Service central déployant et validant la configuration de ClientsBox.
 */
export class ConfigService {
  /**
   * @functionExemption Centralisation de la consolidation des flags CLI, des layouts et de l'environnement runtime.
   * @returnTypeExemption Typage contractuel de l'AppConfig consolidée.
   * Déploie et valide la configuration complète (flags CLI + environnement).
   *
   * @param argv - Arguments CLI (défaut : process.argv.slice(2))
   * @param options - Options de déploiement personnalisées
   * @returns Configuration consolidée, typée et immuable
   */
  deploy(
    argv: readonly string[] = process.argv.slice(2),
    options?: DeployConfigOptions,
  ): AppConfig {
    const { values, envOverrides } = parseCliArgs(argv, CLIENTSBOX_CLI_SCHEMA);

    const workspacePath = options?.workspacePath ?? resolveWorkspacePath();
    const envFile = (options?.envFile ?? (values.envFile as string | undefined)) || undefined;
    const execScene = (values.execScene as string | undefined) || undefined;

    const { config } = initializeAndConfirmEnvironment(CLIENTSBOX_ENV_SCHEMA, {
      envFile,
      workspacePath,
      overrides: envOverrides,
    });

    const explicitPort = envOverrides.PORT !== undefined ? Number(envOverrides.PORT) : undefined;
    const effectivePort = explicitPort ?? (Number(config.PORT) || DEFAULT_SERVER_PORT);
    const { agentsDir, dataRoot, docsRoot } = resolveAgentsLayout(workspacePath);

    return {
      port: effectivePort,
      explicitPort,
      host: String(config.HOST),
      nodeEnv: config.NODE_ENV as AppConfig['nodeEnv'],
      isLogsDisabled: Boolean(config.LOGS_DISABLED),
      workspacePath,
      agentsDir,
      dataRoot,
      docsRoot,
      maxCallScenarioDepth: Number(config.CALL_SCENARIO_MAX_DEPTH),
      cursorCliBin: String(config.CURSOR_CLI_BIN),
      antigravityCliBin: String(config.ANTIGRAVITY_CLI_BIN),
      codexCliBin: String(config.CODEX_CLI_BIN),
      antigravityProbeTimeoutMs: Number(config.ANTIGRAVITY_PROBE_TIMEOUT_MS),
      codexProbeTimeoutMs: Number(config.CODEX_PROBE_TIMEOUT_MS),
      execScene,
      envFile,
    };
  }
}
