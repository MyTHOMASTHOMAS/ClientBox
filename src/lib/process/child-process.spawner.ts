/**
 * Spawner de sous-processus CLI (LIB-004 / SPEC-ADPT-03 / ADR-003 / ADR-006).
 * Stop = SIGTERM puis SIGKILL après STOP_GRACE_MS — n'agit jamais sur les sessions (R-24).
 *
 * `createRequire` : même référence CJS que le mock TU (spawn ESM non mockable Node 24).
 */

import childProcess from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import {
  STOP_GRACE_MS,
  attachSpawnChunkListeners,
  createSpawnStopHandle,
} from './process-stream.handle.js';

export { STOP_GRACE_MS };

/** Options de spawn d'un sous-processus d'agent. */
export interface SpawnAgentOptions {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly onChunk: (chunk: string, stream: 'stdout' | 'stderr') => void;
  readonly onExit: (code: number | null) => void;
}

/** Poignée de contrôle du sous-processus lancé. */
export interface SpawnAgentHandle {
  stop(): void;
}

function resolveSpawnParameters(command: string, rawArgs: readonly string[]) {
  const isCmd = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
  const args = isCmd
    ? rawArgs.map((arg) => {
        const clean = arg.replace(/\r?\n+/gu, ' ');
        return clean.includes(' ') && !clean.startsWith('"') ? `"${clean}"` : clean;
      })
    : rawArgs;
  return { isCmd, args };
}

/**
 * Exécute une commande CLI courte et résout avec son code de sortie et son stdout complet
 * (attente de `close` : stdout entièrement lu).
 *
 * @param command Binaire à lancer
 * @param rawArgs Arguments
 * @param cwd Répertoire de travail
 */
export function runCliCommand(command: string, rawArgs: readonly string[], cwd: string) {
  const { isCmd, args } = resolveSpawnParameters(command, rawArgs);
  return new Promise<{ code: number | null; stdout: string }>((resolve, reject) => {
    const child: ChildProcess = childProcess.spawn(command, [...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isCmd,
    });
    let stdout = '';
    child.stdout?.on('data', (buf: Buffer | string) => {
      stdout += typeof buf === 'string' ? buf : buf.toString();
    });
    child.on('error', reject);
    child.on('close', (code: number | null) => resolve({ code, stdout }));
  });
}

/**
 * Interrompt de manière sécurisée un sous-processus actif avec nettoyage d'arbre sous Windows (SPEC-ARCH-03).
 *
 * @param child Processus enfant à interrompre
 * @param signal Signal système à transmettre (SIGTERM ou SIGKILL)
 */
export function killProcessSafely(child: ChildProcess, signal: NodeJS.Signals) {
  // Windows : taskkill /T AVANT child.kill — sinon le shell (.cmd) meurt seul et
  // orpheline l'agent Cursor, qui continue d'écrire sur le terminal après le Stop.
  if (process.platform === 'win32' && typeof child.pid === 'number' && child.pid > 0) {
    try {
      childProcess.execFileSync('taskkill', ['/pid', `${child.pid}`, '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } catch {
      // Déjà arrêté, PID de test, ou accès refusé
    }
  }
  // POSIX : si le processus est leader d'un groupe dédié (detached), tuer tout le groupe
  // pour éliminer les sous-processus éventuels (arborescence shell).
  if (process.platform !== 'win32' && typeof child.pid === 'number' && child.pid > 0) {
    try {
      process.kill(-child.pid, signal);
    } catch {
      // Pas leader de groupe de processus, ou déjà terminé
    }
  }
  try {
    child.kill(signal);
  } catch {
    // Processus déjà terminé
  }
}

/**
 * Lance un sous-processus d'agent et retourne une poignée d'arrêt gracieux.
 *
 * @param options Options de lancement du sous-processus
 * @returns Poignée d'arrêt du processus
 */
export function spawnAgent(options: SpawnAgentOptions) {
  const { isCmd, args } = resolveSpawnParameters(options.command, options.args);
  const child: ChildProcess = childProcess.spawn(options.command, [...args], {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isCmd,
    windowsHide: true,
    detached: false,
  });
  const state = {
    isExited: false,
    isStopped: false,
    graceTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  };
  attachSpawnChunkListeners(child, state, options.onChunk);
  return createSpawnStopHandle({
    child,
    state,
    onExit: options.onExit,
    killProcessSafely,
  });
}
