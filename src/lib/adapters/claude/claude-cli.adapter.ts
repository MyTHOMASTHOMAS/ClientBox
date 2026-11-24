/**
 * @fileExemption Dépassement nominal justifié par l'intégration complète des commandes, flux et sessions Claude.
 * Adaptateur CLI Claude (SPEC-ADPT-06 / CR-005) — AC-ADPT-06-*.
 */

import type {
  CLIAdapter,
  ExecutionContext,
} from '../../../types/contracts/cli-adapter.contract.js';
import { resolveClaudeCliBin } from '../../process/env/index.js';
import { probeClaudeSession } from './claude-session.helper.js';
import {
  extractClaudeJsonLineChunk,
  extractClaudeSessionId,
  parseClaudeOutput,
} from './claude-stream.extractor.js';
import { createInternalCache, defineCacheConfig } from '../../../utils/cache/index.js';

const CLAUDE_SUPPORTED_MODELS = [
  'sonnet',
  'opus',
  'haiku',
  'fable',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-5-20251101',
  'claude-haiku-4-5-20251001',
] as const;

const claudeCacheConfig = defineCacheConfig({
  baseConfig: { max: 10 },
  domains: {
    models: {
      ttl: 3_600_000,
      createKey: () => 'list',
      set: (data: readonly string[]) => data,
    },
  },
});

function buildClaudeArgs(ctx: ExecutionContext) {
  const args: string[] = [];
  const hasSession = Boolean(ctx.sessionId && ctx.sessionId.trim() !== '');
  if (hasSession) {
    args.push('--resume', ctx.sessionId!.trim());
  }
  args.push(
    '--print',
    '--output-format',
    'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--dangerously-skip-permissions',
  );
  if (ctx.model && ctx.model.trim() !== '') {
    args.push('--model', ctx.model.trim());
  }
  args.push(ctx.assembledPrompt);
  return args;
}

/**
 * Adaptateur d'exécution pour l'outil Claude Code CLI (claude).
 * Prise en charge des exécutions non interactives (--print --output-format stream-json --verbose --include-partial-messages),
 * de l'auto-approbation (--dangerously-skip-permissions), du modèle (--model)
 * et de la reprise de session conversationnelle (--resume <sessionId>).
 */
export class ClaudeCLIAdapter implements CLIAdapter {
  readonly cliId = 'claude-cli';
  private readonly cache = createInternalCache(claudeCacheConfig);

  /**
   * Construit la commande non interactive d'exécution d'un prompt pour le CLI Claude.
   *
   * @param ctx Contexte d'exécution de l'agent
   */
  buildCommand(ctx: ExecutionContext) {
    let command = 'claude';
    try {
      command = resolveClaudeCliBin();
    } catch {
      command = 'claude';
    }

    return {
      command,
      args: buildClaudeArgs(ctx),
      cwd: ctx.workspacePath,
    };
  }

  /**
   * Parse une ligne de sortie issue du flux stdout/stderr du processus Claude.
   *
   * @param line Ligne brute émise par le processus
   */
  parseStreamLine(line: string) {
    const chunk = extractClaudeJsonLineChunk(line);
    if (chunk !== null) {
      return { type: 'stdout' as const, chunk };
    }
    return { type: 'stdout' as const, chunk: line };
  }

  /**
   * Extrait l'identifiant de session Claude d'une ligne ou fragment de sortie.
   *
   * @param line Ligne de texte candidate
   */
  extractSessionId(line: string) {
    return extractClaudeSessionId(line);
  }

  /**
   * Normalise la sortie brute du processus Claude en extrayant le texte pur de l'agent.
   *
   * @param rawOutput Sortie brute accumulée
   */
  parseOutput(rawOutput: string) {
    return parseClaudeOutput(rawOutput);
  }

  /**
   * Ouvre une nouvelle session conversationnelle native Claude par amorce stream-json rapide (SPEC-ADPT-06).
   *
   * @param ctx Contexte d'exécution de l'agent
   * @returns Identifiant de session (session_id) extrait dès la première ligne
   */
  async createSession(ctx: ExecutionContext) {
    const bin = resolveClaudeCliBin();
    return probeClaudeSession(bin, ctx.workspacePath);
  }

  /**
   * Énumère les modèles d'IA supportés par Claude CLI avec mémoisation LRU.
   * En cas d'inaccessibilité du binaire CLI, renvoie une liste vide `[]`.
   *
   * @returns Liste des identifiants de modèles supportés
   */
  async listModels() {
    const cached = this.cache.models.get([]);
    if (cached) {
      return cached;
    }
    try {
      resolveClaudeCliBin();
      const models = [...CLAUDE_SUPPORTED_MODELS];
      this.cache.models.set([], models);
      return models;
    } catch {
      // Binaire inaccessible ou indisponible
      return [];
    }
  }
}
