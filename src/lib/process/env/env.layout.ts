/**
 * Résolution des répertoires du workspace hôte et accesseurs de configuration d'environnement.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Dossiers ClientsBox sous `.agents/` du workspace hôte. */
export interface AgentsLayout {
  /** Répertoire racine des agents et configurations. */
  readonly agentsDir: string;
  /** Données persistées. */
  readonly dataRoot: string;
  /** Documentation utilisateur exportée. */
  readonly docsRoot: string;
}

/**
 * Résout le chemin absolu du workspace hôte.
 *
 * @param cwd - Répertoire de travail optionnel
 */
export function resolveWorkspacePath(cwd?: string) {
  return path.resolve(cwd ?? process.cwd());
}

/**
 * Résout le répertoire racine des configurations et données ClientsBox.
 *
 * @param workspacePath - Chemin du workspace hôte
 * @param env - Environnement optionnel
 */
export function resolveAgentsDir(workspacePath: string, env?: Record<string, string | undefined>) {
  const custom = env?.AGENTS_DIR ?? process.env.AGENTS_DIR;
  const target = custom !== undefined && custom.trim() !== '' ? custom.trim() : '.agents';
  return path.resolve(workspacePath, target);
}

/**
 * Résout l'arborescence des données ClientsBox.
 *
 * @param workspacePath - Chemin du workspace hôte
 * @param env - Environnement optionnel
 */
export function resolveAgentsLayout(
  workspacePath: string,
  env?: Record<string, string | undefined>,
) {
  const agentsDir = resolveAgentsDir(workspacePath, env);
  const layout: AgentsLayout = {
    agentsDir,
    dataRoot: path.join(agentsDir, 'data'),
    docsRoot: path.join(agentsDir, 'docs'),
  };
  return layout;
}

function validateBin(bin: string | undefined, envVarName: string, label: string) {
  if (bin === undefined || bin === '') {
    throw new Error(`${envVarName} est obligatoire et manquante ou vide`);
  }
  if (!fs.existsSync(bin)) {
    throw new Error(`Binaire ${label} introuvable ou inexistant : ${bin}`);
  }
  try {
    fs.accessSync(bin, fs.constants.X_OK);
  } catch {
    throw new Error(`Binaire ${label} non exécutable (permission) : ${bin}`);
  }
  return bin;
}

function resolveTimeout(val: string | undefined, defaultMs = 15_000) {
  if (val !== undefined && val.trim() !== '') {
    const parsed = Number(val.trim());
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultMs;
}

/** Résout et valide le binaire cursor-cli. */
export function resolveCursorCliBin() {
  return validateBin(process.env.CURSOR_CLI_BIN, 'CURSOR_CLI_BIN', 'Cursor');
}

/** Résout et valide le binaire antigravity. */
export function resolveAntigravityCliBin() {
  return validateBin(process.env.ANTIGRAVITY_CLI_BIN, 'ANTIGRAVITY_CLI_BIN', 'Antigravity');
}

/** Résout et valide le binaire codex-cli. */
export function resolveCodexCliBin() {
  return validateBin(process.env.CODEX_CLI_BIN, 'CODEX_CLI_BIN', 'Codex');
}

/** Résout et valide le binaire claude-cli. */
export function resolveClaudeCliBin() {
  return validateBin(process.env.CLAUDE_CLI_BIN, 'CLAUDE_CLI_BIN', 'Claude');
}

/** Résout le délai d'expiration Antigravity. */
export function resolveAntigravityProbeTimeout() {
  return resolveTimeout(process.env.ANTIGRAVITY_PROBE_TIMEOUT_MS);
}

/** Résout le délai d'expiration Codex. */
export function resolveCodexProbeTimeout() {
  return resolveTimeout(process.env.CODEX_PROBE_TIMEOUT_MS);
}

/** Résout le délai d'expiration Claude. */
export function resolveClaudeProbeTimeout() {
  return resolveTimeout(process.env.CLAUDE_PROBE_TIMEOUT_MS);
}

/**
 * Résout la profondeur max d'imbrication CallScenario.
 *
 * @param env - Environnement optionnel
 */
export function resolveCallScenarioMaxDepth(env?: Record<string, string | undefined>) {
  const raw = env?.CALL_SCENARIO_MAX_DEPTH ?? process.env.CALL_SCENARIO_MAX_DEPTH;
  if (raw === undefined || raw.trim() === '') {
    return -1;
  }
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < -1) {
    return -1;
  }
  return parsed;
}
