/**
 * Définition déclarative du schéma des variables d'environnement de ClientsBox.
 */

import type { EnvSchema } from '../types/contracts/env-schema.contract.js';
import {
  DEFAULT_AGENTS_DIR,
  DEFAULT_CALL_SCENARIO_MAX_DEPTH,
  DEFAULT_PROBE_TIMEOUT_MS,
  DEFAULT_SERVER_HOST,
  DEFAULT_SERVER_PORT,
} from './constants.config.js';

/**
 * Schéma des variables d'environnement validées par ClientsBox au runtime.
 */
export const CLIENTSBOX_ENV_SCHEMA: EnvSchema = {
  PORT: { type: 'number', default: DEFAULT_SERVER_PORT, min: 1, max: 65535 },
  HOST: { type: 'string', default: DEFAULT_SERVER_HOST },
  AGENTS_DIR: { type: 'string', default: DEFAULT_AGENTS_DIR },
  NODE_ENV: {
    type: 'enum',
    allowed: ['development', 'production', 'test'] as const,
    default: 'development',
  },
  LOGS_DISABLED: { type: 'boolean', default: false },
  CALL_SCENARIO_MAX_DEPTH: { type: 'number', default: DEFAULT_CALL_SCENARIO_MAX_DEPTH, min: -1 },
  ANTIGRAVITY_PROBE_TIMEOUT_MS: { type: 'number', default: DEFAULT_PROBE_TIMEOUT_MS, min: 1 },
  CODEX_PROBE_TIMEOUT_MS: { type: 'number', default: DEFAULT_PROBE_TIMEOUT_MS, min: 1 },
  CLAUDE_PROBE_TIMEOUT_MS: { type: 'number', default: DEFAULT_PROBE_TIMEOUT_MS, min: 1 },
  CURSOR_CLI_BIN: {
    type: 'executable',
    isRequired: true,
    label: 'Cursor',
    helpRef: 'env/.env.example',
  },
  ANTIGRAVITY_CLI_BIN: {
    type: 'executable',
    isRequired: true,
    label: 'Antigravity',
    helpRef: 'env/.env.example',
  },
  CODEX_CLI_BIN: {
    type: 'executable',
    isRequired: true,
    label: 'Codex',
    helpRef: 'env/.env.example',
  },
  CLAUDE_CLI_BIN: {
    type: 'executable',
    isRequired: true,
    label: 'Claude',
    helpRef: 'env/.env.example',
  },
};
