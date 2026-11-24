/**
 * Helper d'amorce et capture de session Codex (LIB-021 / SPEC-ADPT-05 / CR-006).
 */

import childProcess, { type ChildProcess } from 'node:child_process';
import { killProcessSafely } from '../../process/child-process.spawner.js';
import { resolveCodexProbeTimeout } from '../../process/env/index.js';
import { extractCodexSessionId } from './codex-stream.extractor.js';

export { extractCodexSessionId };

function resolveProbeSpawnArgs(command: string) {
  const isCmd = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
  const rawArgs = ['exec', '--json', '--dangerously-bypass-approvals-and-sandbox', 'ping'];
  const args = isCmd
    ? rawArgs.map((arg) => (arg.includes(' ') && !arg.startsWith('"') ? `"${arg}"` : arg))
    : rawArgs;
  return { isCmd, args };
}

interface ProbeExecutionState {
  isSettled: boolean;
  capturedSessionId: string | null;
  buffer: string;
}

interface ProbeCallbacks {
  resolve: (id: string) => void;
  reject: (err: Error) => void;
}

interface SetupProbeListenersOptions {
  state: ProbeExecutionState;
  timeoutMs: number;
  callbacks: ProbeCallbacks;
}

function attachProbeStreamHandlers(child: ChildProcess, state: ProbeExecutionState) {
  child.stdout?.on('data', (buf: Buffer | string) => {
    if (state.isSettled) return;
    state.buffer += typeof buf === 'string' ? buf : buf.toString();
    const lines = state.buffer.split(/\r?\n/u);
    for (const line of lines) {
      const sessionId = extractCodexSessionId(line);
      if (sessionId) {
        state.capturedSessionId = sessionId;
      }
    }
  });
}

function handleProbeClose(
  code: number | null,
  state: ProbeExecutionState,
  callbacks: ProbeCallbacks,
) {
  if (state.capturedSessionId && (code === 0 || code === null)) {
    callbacks.resolve(state.capturedSessionId);
    return;
  }
  if (code !== 0 && code !== null) {
    callbacks.reject(
      new Error(`Échec d'initialisation de session Codex (code d'erreur ${String(code)}).`),
    );
    return;
  }
  callbacks.reject(
    new Error(
      "Échec de création de session Codex : aucun identifiant retourné par l'amorce stream-json.",
    ),
  );
}

function setupProbeListeners(child: ChildProcess, options: SetupProbeListenersOptions) {
  const { state, timeoutMs, callbacks } = options;
  const timer = setTimeout(() => {
    if (!state.isSettled) {
      state.isSettled = true;
      killProcessSafely(child, 'SIGTERM');
      callbacks.reject(
        new Error(`Délai d'initialisation de session Codex dépassé (${String(timeoutMs)} ms).`),
      );
    }
  }, timeoutMs);
  attachProbeStreamHandlers(child, state);
  child.on('error', (err) => {
    if (!state.isSettled) {
      state.isSettled = true;
      clearTimeout(timer);
      callbacks.reject(err);
    }
  });
  child.on('close', (code: number | null) => {
    if (!state.isSettled) {
      state.isSettled = true;
      clearTimeout(timer);
      handleProbeClose(code, state, callbacks);
    }
  });
}

/**
 * Exécute une amorce stream-json rapide pour initialiser la session et capturer le thread_id
 * généré par codex, en attendant la terminaison ordonnée du sous-processus.
 *
 * @param command Chemin d'accès au binaire codex
 * @param cwd Répertoire de travail du scénario
 * @param timeoutMs Délai de garde optionnel en millisecondes
 * @returns Identifiant de session thread_id capturé
 */
export function probeCodexSession(
  command: string,
  cwd: string,
  timeoutMs = resolveCodexProbeTimeout(),
) {
  const { isCmd, args } = resolveProbeSpawnArgs(command);
  return new Promise<string>((resolve, reject) => {
    const child: ChildProcess = childProcess.spawn(command, [...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isCmd,
    });
    const state: ProbeExecutionState = { isSettled: false, capturedSessionId: null, buffer: '' };
    setupProbeListeners(child, { state, timeoutMs, callbacks: { resolve, reject } });
  });
}
