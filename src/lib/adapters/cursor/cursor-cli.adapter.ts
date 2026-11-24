/**
 * @fileExemption Dépassement nominal justifié par l'intégration complète des commandes, flux et sessions Cursor.
 * Adapter cursor-cli (LIB-006 / ADR-003) — AC-ADPT-01-* / AC-ADPT-02-*.
 */

import type {
  CLIAdapter,
  ExecutionContext,
} from '../../../types/contracts/cli-adapter.contract.js';
import { resolveCursorCliBin, resolveWorkspacePath } from '../../process/env/index.js';
import { runCliCommand } from '../../process/child-process.spawner.js';
import { createInternalCache, defineCacheConfig } from '../../../utils/cache/index.js';

const cursorCacheConfig = defineCacheConfig({
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

function parseCursorModelList(stdout: string) {
  const lines = stdout.split(/\r?\n/u);
  const models: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(' - ')) continue;
    const modelId = trimmed.split(' - ')[0]?.trim();
    if (modelId && !models.includes(modelId)) {
      models.push(modelId);
    }
  }
  return models;
}

function extractRecordText(record: Record<string, unknown>) {
  if (record.type === 'text' && typeof record.content === 'string') {
    return record.content;
  }
  return null;
}

function extractCursorChunk(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return extractRecordText(parsed as Record<string, unknown>);
    }
  } catch {
    // Non JSON
  }
  return null;
}

function parseCursorOutput(rawOutput: string) {
  const lines = rawOutput.split(/\r?\n/u);
  const chunks: string[] = [];
  for (const line of lines) {
    const chunk = extractCursorChunk(line);
    if (chunk !== null) chunks.push(chunk);
  }
  return chunks.length > 0 ? chunks.join('') : rawOutput;
}

/**
 * Adaptateur d'exécution pour l'outil CLI Cursor Agent.
 * Chaque Run reprend la session de scénario de l'agent (`-p --resume <sessionId>`).
 */
export class CursorCLIAdapter implements CLIAdapter {
  readonly cliId = 'cursor-cli';
  private readonly cache = createInternalCache(cursorCacheConfig);

  /**
   * Construit la commande non interactive reprenant la session de l'agent.
   *
   * @param ctx - Contexte d'exécution de l'agent (`sessionId` obligatoire).
   */
  buildCommand(ctx: ExecutionContext) {
    if (!ctx.sessionId) {
      throw new Error(
        `Session conversationnelle absente pour l'agent "${ctx.agentId}" : exécution cursor-cli refusée.`,
      );
    }
    let command = 'cursor';
    try {
      command = resolveCursorCliBin();
    } catch {
      command = 'cursor';
    }

    const args = ['-p', '--output-format', 'json'];
    if (ctx.model && ctx.model.trim() !== '') {
      args.push('--model', ctx.model.trim());
    }
    args.push('--resume', ctx.sessionId, ctx.assembledPrompt);

    return {
      command,
      args,
      cwd: ctx.workspacePath,
    };
  }

  /**
   * Parse une ligne de sortie du flux de l'agent.
   *
   * @param line Ligne de texte brute issue de stdout
   * @returns Événement de flux typé
   */
  parseStreamLine(line: string) {
    const chunk = extractCursorChunk(line);
    return { type: 'stdout' as const, chunk: chunk !== null ? chunk : line };
  }

  /**
   * Normalise la sortie brute du processus Cursor CLI (identique au texte brut émis).
   *
   * @param rawOutput Sortie brute accumulée
   */
  parseOutput(rawOutput: string) {
    return parseCursorOutput(rawOutput);
  }

  /**
   * Ouvre une nouvelle session native via `create-chat` (SPEC-ADPT-02 / SPEC-ADPT-03).
   *
   * @param ctx Contexte d'exécution (workspace de lancement)
   * @returns Identifiant de chat imprimé par le CLI
   */
  async createSession(ctx: ExecutionContext) {
    const { code, stdout } = await runCliCommand(
      resolveCursorCliBin(),
      ['create-chat'],
      ctx.workspacePath,
    );
    if (code !== 0) {
      throw new Error(
        `Échec de création de session cursor-cli (create-chat, code ${String(code)}).`,
      );
    }
    const sessionId = stdout
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find((line) => line !== '');
    if (!sessionId) {
      throw new Error(
        'Échec de création de session cursor-cli : aucun identifiant retourné par create-chat.',
      );
    }
    return sessionId;
  }

  /**
   * Énumère les modèles d'IA disponibles en interrogeant cursor-cli avec mémoisation LRU.
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
      const bin = resolveCursorCliBin();
      const { code, stdout } = await runCliCommand(bin, ['--list-models'], resolveWorkspacePath());
      if (code === 0 && stdout) {
        const parsed = parseCursorModelList(stdout);
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
