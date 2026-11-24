/**
 * Gestionnaires d'écouteurs de flux et de fin d'exécution du spawner de runner.
 */

import type {
  CLIAdapter,
  CommandSpawnOptions,
} from '../../../types/contracts/cli-adapter.contract.js';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import type { SpawnAgentHandle } from '../../../lib/process/child-process.spawner.js';
import { logAgentProcessExited } from '../../../utils/logger/events/info/agent-info.event.js';
import { logAgentExecutionFailed } from '../../../utils/logger/events/errors/agent-error.event.js';
import { logAgentStreamChunkTrace } from '../../../utils/logger/events/debug/agent-debug.event.js';

/**
 * Paramètres d'exécution et de supervision du processus sous-jacent.
 */
export interface ExecuteSpawnParams {
  readonly node: ScenarioNode;
  readonly adapter: CLIAdapter;
  readonly commandSpec: CommandSpawnOptions;
  readonly isStopped: () => boolean;
  readonly onChunk: (chunk: string, stream: 'stdout' | 'stderr', event: unknown) => void;
  readonly onActiveHandle: (handle: SpawnAgentHandle | null) => void;
  readonly onSessionCaptured?: (sessionId: string) => void;
}

/** Options pour la création des callbacks de spawn. */
export interface CreateSpawnHandlersOptions {
  readonly params: ExecuteSpawnParams;
  readonly spawnStartMs: number;
  readonly resolve: (output: string) => void;
  readonly reject: (err: Error) => void;
}

function tryCaptureSession(params: ExecuteSpawnParams, chunk: string) {
  if (params.adapter.extractSessionId && params.onSessionCaptured) {
    const sessionId = params.adapter.extractSessionId(chunk);
    if (sessionId) {
      params.onSessionCaptured(sessionId);
    }
  }
}

function resolveProcessOutput(adapter: CLIAdapter, rawOutput: string) {
  return adapter.parseOutput ? adapter.parseOutput(rawOutput) : rawOutput;
}

/**
 * Construit les gestionnaires de streaming chunk et de sortie de processus.
 * Le CLI n'est pas interrompu sur un mot-clé : la fin est naturelle (CR-012).
 *
 * @param options Options des callbacks d'exécution
 */
export function createRunnerSpawnHandlers(options: CreateSpawnHandlersOptions) {
  let accumulatedOutput = '';

  const onChunk = (chunk: string, stream: 'stdout' | 'stderr') => {
    if (options.params.isStopped()) return;
    accumulatedOutput += chunk;
    tryCaptureSession(options.params, chunk);
    options.params.onChunk(chunk, stream, options.params.adapter.parseStreamLine(chunk));
    logAgentStreamChunkTrace(options.params.node.id, stream, chunk.length);
  };

  const onExit = (code: number | null) => {
    options.params.onActiveHandle(null);
    logAgentProcessExited(options.params.node.id, code ?? 0, Date.now() - options.spawnStartMs);
    if (options.params.isStopped() || code === 0 || code === null) {
      options.resolve(resolveProcessOutput(options.params.adapter, accumulatedOutput));
    } else {
      logAgentExecutionFailed(options.params.node.id, `code ${code}`);
      options.reject(
        new Error(`Le processus CLI s'est terminé avec le code d'erreur ${String(code)}.`),
      );
    }
  };

  return { onChunk, onExit };
}
