/**
 * @fileExemption Dépassement nominal justifié par l'intégration complète des commandes, flux et sessions Antigravity.
 * Adaptateur CLI Antigravity (SPEC-ADPT-04 / CR-004) — AC-ADPT-04-*.
 */

import type {
  CLIAdapter,
  ExecutionContext,
} from '../../../types/contracts/cli-adapter.contract.js';
import { resolveAntigravityCliBin, resolveWorkspacePath } from '../../process/env/index.js';
import { runCliCommand } from '../../process/child-process.spawner.js';
import { probeAntigravitySession } from './antigravity-session.helper.js';
import {
  extractAntigravitySessionId,
  extractStreamChunk,
  parseAntigravityOutput,
} from './antigravity-stream.extractor.js';
import { createInternalCache, defineCacheConfig } from '../../../utils/cache/index.js';

const antigravityCacheConfig = defineCacheConfig({
  baseConfig: {
    max: 10,
  },
  domains: {
    models: {
      ttl: 3_600_000,
      createKey: () => 'list',
      set: (data: readonly string[]) => data,
    },
  },
});

function parseModelLine(line: string) {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('Fetching available models')) {
    return null;
  }
  if (trimmed.includes('\t')) {
    const parts = trimmed.split('\t');
    const id = parts[0]?.trim();
    return id && id !== '' ? id : null;
  }
  const parts = trimmed.split(' ');
  const id = parts[0]?.trim();
  return id && id !== '' ? id : null;
}

function parseAntigravityModelList(stdout: string) {
  const lines = stdout.split(/\r?\n/u);
  const models: string[] = [];
  for (const line of lines) {
    const modelId = parseModelLine(line);
    if (modelId && !models.includes(modelId)) {
      models.push(modelId);
    }
  }
  return models;
}

/**
 * Adaptateur d'exécution pour l'outil CLI Antigravity (agy).
 * Prise en charge des exécutions non interactives (--print), de l'auto-approbation
 * des permissions headless (--dangerously-skip-permissions), du modèle (--model)
 * et de la reprise de conversation (--conversation).
 */
export class AntigravityCLIAdapter implements CLIAdapter {
  readonly cliId = 'antigravity';
  private readonly cache = createInternalCache(antigravityCacheConfig);

  /**
   * Construit la commande non interactive d'exécution d'un prompt pour le CLI Antigravity.
   *
   * @param ctx - Contexte d'exécution de l'agent
   */
  buildCommand(ctx: ExecutionContext) {
    let command = 'agy';
    try {
      command = resolveAntigravityCliBin();
    } catch {
      command = 'agy';
    }

    const args: string[] = ['--dangerously-skip-permissions', '--output-format', 'stream-json'];
    if (ctx.model && ctx.model.trim() !== '') {
      args.push('--model', ctx.model.trim());
    }
    if (ctx.sessionId && ctx.sessionId.trim() !== '') {
      args.push('--conversation', ctx.sessionId.trim());
    }
    args.push('--print', ctx.assembledPrompt);

    return {
      command,
      args,
      cwd: ctx.workspacePath,
    };
  }

  /**
   * Parse une ligne de sortie issue du flux stdout/stderr du processus Antigravity.
   *
   * @param line - Ligne brute émise par le processus
   */
  parseStreamLine(line: string) {
    try {
      const parsed: unknown = JSON.parse(line);
      const chunk = extractStreamChunk(parsed);
      if (chunk !== null) {
        return { type: 'stdout' as const, chunk };
      }
    } catch {
      // JSON malformé ou texte brut — fallback
    }
    return { type: 'stdout' as const, chunk: line };
  }

  /**
   * Extrait la réponse textuelle finale produite par l'agent depuis le flux stream-json global.
   *
   * @param rawOutput - Sortie brute accumulée
   */
  parseOutput(rawOutput: string) {
    return parseAntigravityOutput(rawOutput);
  }

  /**
   * Extrait dynamiquement l'identifiant de session conversationnelle au vol (SPEC-ADPT-04 / CR-007).
   *
   * @param line - Ligne brute émise sur stdout
   */
  extractSessionId(line: string) {
    return extractAntigravitySessionId(line);
  }

  /**
   * Ouvre une nouvelle session conversationnelle native Antigravity par amorce stream-json rapide (SPEC-ADPT-04 / SPEC-ADPT-03).
   *
   * @param ctx - Contexte d'exécution de l'agent
   * @returns Identifiant UUID de conversation extrait dès la première ligne
   */
  async createSession(ctx: ExecutionContext) {
    const bin = resolveAntigravityCliBin();
    return probeAntigravitySession(bin, ctx.workspacePath);
  }

  /**
   * Énumère les modèles d'IA supportés en interrogeant agy models avec mémoisation LRU.
   * En cas d'échec ou d'absence de CLI, renvoie une liste vide `[]`.
   *
   * @returns Liste des identifiants de modèles supportés
   */
  async listModels() {
    const cached = this.cache.models.get([]);
    if (cached) {
      return cached;
    }
    try {
      const bin = resolveAntigravityCliBin();
      const { code, stdout } = await runCliCommand(bin, ['models'], resolveWorkspacePath());
      if (code === 0 && stdout) {
        const parsed = parseAntigravityModelList(stdout);
        if (parsed.length > 0) {
          this.cache.models.set([], parsed);
          return parsed;
        }
      }
    } catch {
      // Binaire inaccessible ou indisponible
    }
    return [];
  }
}
