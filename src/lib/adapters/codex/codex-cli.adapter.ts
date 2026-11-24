/**
 * @fileExemption Dépassement nominal justifié par l'intégration complète des commandes, flux et sessions Codex.
 * Adaptateur CLI Codex (SPEC-ADPT-05 / CR-006) — AC-ADPT-05-*.
 */

import type {
  CLIAdapter,
  ExecutionContext,
} from '../../../types/contracts/cli-adapter.contract.js';
import { resolveCodexCliBin, resolveWorkspacePath } from '../../process/env/index.js';
import { runCliCommand } from '../../process/child-process.spawner.js';
import { probeCodexSession } from './codex-session.helper.js';
import { extractCodexSessionId } from './codex-stream.extractor.js';
import { createInternalCache, defineCacheConfig } from '../../../utils/cache/index.js';

const codexCacheConfig = defineCacheConfig({
  baseConfig: { max: 10 },
  domains: {
    models: {
      ttl: 3_600_000,
      createKey: () => 'list',
      set: (data: readonly string[]) => data,
    },
  },
});

function extractItemText(record: Record<string, unknown>) {
  if (record.type === 'item.completed' && typeof record.item === 'object' && record.item) {
    const item = record.item as Record<string, unknown>;
    if (item.type === 'agent_message' && typeof item.text === 'string') {
      return item.text;
    }
  }
  return null;
}

function extractChunkFromRecord(record: Record<string, unknown>) {
  const itemText = extractItemText(record);
  if (itemText !== null) return itemText;
  if (record.type === 'text' && typeof record.content === 'string') return record.content;
  if (typeof record.response === 'string') return record.response;
  return null;
}

function extractJsonLineChunk(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return extractChunkFromRecord(parsed as Record<string, unknown>);
    }
  } catch {
    // Ligne JSON tronquée ou invalide
  }
  return null;
}

function parseCodexOutput(rawOutput: string) {
  const lines = rawOutput.split(/\r?\n/u);
  const chunks: string[] = [];
  for (const line of lines) {
    const chunk = extractJsonLineChunk(line);
    if (chunk !== null) {
      chunks.push(chunk);
    }
  }
  return chunks.length > 0 ? chunks.join('') : rawOutput;
}

function extractModelSlug(item: unknown) {
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'object' && item !== null) {
    const slug = (item as { slug?: unknown }).slug;
    if (typeof slug === 'string') return slug.trim();
  }
  return null;
}

function parseCodexModelList(stdout: string) {
  try {
    const parsed: unknown = JSON.parse(stdout);
    if (typeof parsed !== 'object' || parsed === null) return [];
    const rawModels = (parsed as { models?: unknown[] }).models;
    if (!Array.isArray(rawModels)) return [];
    const models: string[] = [];
    for (const item of rawModels) {
      const slug = extractModelSlug(item);
      if (slug && !models.includes(slug)) {
        models.push(slug);
      }
    }
    return models;
  } catch {
    return [];
  }
}

function buildCodexArgs(ctx: ExecutionContext) {
  const args = ['exec'];
  const hasSession = Boolean(ctx.sessionId && ctx.sessionId.trim() !== '');
  if (hasSession) {
    args.push('resume');
  }
  args.push('--json', '--dangerously-bypass-approvals-and-sandbox');
  if (ctx.model && ctx.model.trim() !== '') {
    args.push('--model', ctx.model.trim());
  }
  if (hasSession) {
    args.push(ctx.sessionId!.trim());
  }
  args.push(ctx.assembledPrompt);
  return args;
}

/**
 * Adaptateur d'exécution pour l'outil CLI Codex (codex).
 * Prise en charge des exécutions non interactives (--json), de l'auto-approbation
 * (--dangerously-bypass-approvals-and-sandbox), du modèle (--model)
 * et de la reprise de session conversationnelle (exec resume <sessionId>).
 */
export class CodexCLIAdapter implements CLIAdapter {
  readonly cliId = 'codex-cli';
  private readonly cache = createInternalCache(codexCacheConfig);

  /**
   * Construit la commande non interactive d'exécution d'un prompt pour le CLI Codex.
   *
   * @param ctx Contexte d'exécution de l'agent
   */
  buildCommand(ctx: ExecutionContext) {
    let command = 'codex';
    try {
      command = resolveCodexCliBin();
    } catch {
      command = 'codex';
    }

    return {
      command,
      args: buildCodexArgs(ctx),
      cwd: ctx.workspacePath,
    };
  }

  /**
   * Parse une ligne de sortie issue du flux stdout/stderr du processus Codex.
   *
   * @param line Ligne brute émise par le processus
   */
  parseStreamLine(line: string) {
    const chunk = extractJsonLineChunk(line);
    if (chunk !== null) {
      return { type: 'stdout' as const, chunk };
    }
    return { type: 'stdout' as const, chunk: line };
  }

  /**
   * Extrait l'identifiant de session (thread_id) Codex d'une ligne ou fragment de sortie.
   *
   * @param line Ligne de texte candidate
   */
  extractSessionId(line: string) {
    return extractCodexSessionId(line);
  }

  /**
   * Normalise la sortie brute du processus Codex en extrayant le texte pur de l'agent.
   *
   * @param rawOutput Sortie brute accumulée
   */
  parseOutput(rawOutput: string) {
    return parseCodexOutput(rawOutput);
  }

  /**
   * Ouvre une nouvelle session conversationnelle native Codex par amorce stream-json rapide (SPEC-ADPT-05).
   *
   * @param ctx Contexte d'exécution de l'agent
   * @returns Identifiant UUID de session (thread_id) extrait dès la première ligne
   */
  async createSession(ctx: ExecutionContext) {
    const bin = resolveCodexCliBin();
    return probeCodexSession(bin, ctx.workspacePath);
  }

  /**
   * Énumère les modèles d'IA supportés en interrogeant codex debug models avec mémoisation LRU.
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
      const bin = resolveCodexCliBin();
      const { code, stdout } = await runCliCommand(
        bin,
        ['debug', 'models'],
        resolveWorkspacePath(),
      );
      if (code === 0 && stdout) {
        const parsed = parseCodexModelList(stdout);
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
