/**
 * Attache flux stdout/stderr et fabrique la poignée stop d'un spawn.
 */

import type { ChildProcess } from 'node:child_process';

/** Délai de grâce (ms) avant escalade SIGKILL — partagé avec spawner. */
export const STOP_GRACE_MS = 3000;

/** Contexte mutable du cycle de vie spawn. */
export interface SpawnLifecycleState {
  isExited: boolean;
  isStopped: boolean;
  graceTimer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * Relaye les chunks stdout/stderr tant que le stop n'est pas demandé.
 * @param child Processus enfant
 * @param state État mutable
 * @param onChunk Callback chunk
 */
export function attachSpawnChunkListeners(
  child: ChildProcess,
  state: SpawnLifecycleState,
  onChunk: (chunk: string, stream: 'stdout' | 'stderr') => void,
) {
  const emitChunk = (chunk: string, stream: 'stdout' | 'stderr') => {
    if (state.isStopped) return;
    onChunk(chunk, stream);
  };
  child.stdout?.on('data', (buf: Buffer | string) =>
    emitChunk(typeof buf === 'string' ? buf : buf.toString(), 'stdout'),
  );
  child.stderr?.on('data', (buf: Buffer | string) =>
    emitChunk(typeof buf === 'string' ? buf : buf.toString(), 'stderr'),
  );
}

/**
 * Options de fabrication de la poignée stop.
 */
export interface CreateStopHandleOptions {
  readonly child: ChildProcess;
  readonly state: SpawnLifecycleState;
  readonly onExit: (code: number | null) => void;
  readonly killProcessSafely: (child: ChildProcess, signal: NodeJS.Signals) => void;
}

/**
 * Branche l'événement exit et retourne la poignée stop.
 * @param options Options
 */
export function createSpawnStopHandle(options: CreateStopHandleOptions) {
  const { child, state, onExit, killProcessSafely } = options;
  child.on('exit', (code) => {
    state.isExited = true;
    if (state.graceTimer !== undefined) {
      clearTimeout(state.graceTimer);
      state.graceTimer = undefined;
    }
    onExit(code);
  });
  return {
    stop() {
      if (state.isExited || state.isStopped) return;
      state.isStopped = true;
      try {
        child.stdout?.destroy();
        child.stderr?.destroy();
      } catch {
        // Flux déjà fermés
      }
      killProcessSafely(child, 'SIGTERM');
      state.graceTimer = setTimeout(() => {
        if (!state.isExited) killProcessSafely(child, 'SIGKILL');
      }, STOP_GRACE_MS);
    },
  };
}
