import { vi } from 'vitest';
import type {
  CLIAdapter,
  CommandSpawnOptions,
  ExecutionContext,
} from '../../src/types/contracts/cli-adapter.contract.js';
import type { Connection } from '../../src/types/models/connection.model.js';
import type { ScenarioNode } from '../../src/types/models/node.model.js';

/** Run observé à l'entrée de `buildCommand` (contrat réel de l'adapter). */
export interface RecordedRun {
  readonly agentId: string;
  readonly sessionId: string | undefined;
  readonly prompt: string;
}

/**
 * Adapter simulé : `createSession` retourne "chat-1", "chat-2", ... dans l'ordre d'appel.
 * `buildCommand` enregistre le `sessionId` reçu pour chaque Run.
 */
export class SessionRecordingAdapter implements CLIAdapter {
  readonly cliId = 'cursor-cli';
  readonly createSessionCalls: string[] = [];
  readonly runs: RecordedRun[] = [];

  constructor(private readonly createDelayMs = 0) {}

  async createSession(ctx: ExecutionContext): Promise<string> {
    this.createSessionCalls.push(ctx.agentId);
    const sessionId = `chat-${this.createSessionCalls.length}`;
    if (this.createDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.createDelayMs));
    }
    return sessionId;
  }

  buildCommand(ctx: ExecutionContext): CommandSpawnOptions {
    this.runs.push({ agentId: ctx.agentId, sessionId: ctx.sessionId, prompt: ctx.assembledPrompt });
    return { command: 'mock-agent', args: [], cwd: ctx.workspacePath };
  }

  parseStreamLine(line: string) {
    return { type: 'stdout' as const, chunk: line };
  }

  /** Session reçue par le Run dont le prompt est `promptOf(nodeId)`. */
  sessionOf(nodeId: string): string | undefined {
    return this.runs.find((run) => run.prompt === promptOf(nodeId))?.sessionId;
  }
}

/** Contenu de prompt unique par bloc Run (permet d'identifier le Run côté adapter). */
export function promptOf(nodeId: string): string {
  return `prompt:${nodeId}`;
}

/** Store simulé : tout agent existe, profil sans prompt système, prompt = `promptOf(promptId)`. */
export function createSessionStore() {
  return {
    getAgent: vi.fn(async (id: string) => ({
      id,
      name: `Agent ${id}`,
      profilId: 'p-1',
      cliId: 'cursor-cli',
    })),
    getProfil: vi.fn(async () => ({
      id: 'p-1',
      name: 'Profil',
      systemPrompt: '',
      policy: 'chaque_prompt' as const,
    })),
    getPrompt: vi.fn(async (id: string) => ({ id, name: id, content: promptOf(id) })),
    getExitCondition: vi.fn(async () => null),
  };
}

export function startNode(id = 'start-1'): ScenarioNode {
  return { id, type: 'start', position: { x: 0, y: 0 } };
}

export function runNode(id: string, agentId: string): ScenarioNode {
  return { id, type: 'run', position: { x: 0, y: 0 }, agentId, promptId: id };
}

export function clearNode(id: string, agentId: string): ScenarioNode {
  return { id, type: 'clearContext', position: { x: 0, y: 0 }, agentId };
}

/** Connexion port 0 → port 0 (clé "0"). */
export function link(sourceNodeId: string, targetNodeId: string): Connection {
  return { sourceNodeId, sourcePortIndex: 0, targetNodeId, targetPortIndex: 0, key: '0' };
}

/** Connexions successives d'une chaîne linéaire `a → b → c ...`. */
export function chain(...nodeIds: string[]): Connection[] {
  return nodeIds.slice(1).map((target, index) => link(nodeIds[index]!, target));
}
