/**
 * Spawner de sous-processus shell natif OS dans la couche lib I/O (ADR-019 / LIB-004 / SPEC-ARCH-03).
 */

import childProcess from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import { killProcessSafely, type SpawnAgentHandle } from './child-process.spawner.js';
import { resolveWorkspacePath } from './env/index.js';

/** Options de lancement d'une commande shell native. */
export interface NativeCommandOptions {
  readonly command: string;
  readonly cwd: string;
  readonly onChunk: (chunk: string, stream: 'stdout' | 'stderr') => void;
  readonly onExit: (code: number | null, err?: Error) => void;
}

function resolveCommandCwd(rawCwd: string) {
  if (rawCwd && fs.existsSync(rawCwd)) return rawCwd;
  try {
    if (rawCwd) {
      fs.mkdirSync(rawCwd, { recursive: true });
      return rawCwd;
    }
  } catch {
    // Repli sur le workspace hôte résolu par LIB-005
  }
  return resolveWorkspacePath();
}

function attachOutputStreams(
  child: ChildProcess,
  onChunk: (chunk: string, stream: 'stdout' | 'stderr') => void,
) {
  child.stdout?.on('data', (buf: Buffer | string) => {
    onChunk(typeof buf === 'string' ? buf : buf.toString(), 'stdout');
  });
  child.stderr?.on('data', (buf: Buffer | string) => {
    onChunk(typeof buf === 'string' ? buf : buf.toString(), 'stderr');
  });
}

function createNativeStopHandle(child: ChildProcess) {
  let isDone = false;
  const handle: SpawnAgentHandle = {
    stop: () => {
      if (isDone) return;
      isDone = true;
      try {
        child.stdout?.destroy();
        child.stderr?.destroy();
      } catch {
        // Flux déjà fermés
      }
      killProcessSafely(child, 'SIGTERM');
    },
  };
  return {
    handle,
    markDone: () => {
      isDone = true;
    },
  };
}

/**
 * Lance une commande shell native OS dans le répertoire spécifié.
 *
 * @param options Paramètres de lancement de commande
 */
export function spawnNativeCommand(options: NativeCommandOptions) {
  const cwd = resolveCommandCwd(options.cwd);
  const isPosix = process.platform !== 'win32';
  const child = childProcess.spawn(options.command, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    detached: isPosix,
  });

  attachOutputStreams(child, options.onChunk);
  const { handle, markDone } = createNativeStopHandle(child);

  child.on('error', (err) => {
    markDone();
    options.onExit(null, err);
  });

  child.on('close', (code) => {
    markDone();
    options.onExit(code);
  });

  return handle;
}
