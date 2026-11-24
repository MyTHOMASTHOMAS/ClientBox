import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface TempDirHandle {
  readonly dir: string;
  readonly previousCwd: string;
  restoreCwd(): void;
  cleanup(): void;
}

/** Crée un répertoire temporaire sans modifier cwd (usage DATA / fs). */
export function createTempDir(prefix = 'clientsbox-test-'): TempDirHandle {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const previousCwd = process.cwd();
  return {
    dir,
    previousCwd,
    restoreCwd(): void {
      process.chdir(this.previousCwd);
    },
    cleanup(): void {
      fs.rmSync(this.dir, { recursive: true, force: true });
    },
  };
}

/**
 * Exécute `fn` après `chdir` vers un mkdtemp ; restaure cwd et supprime le sandbox en `finally`.
 */
export async function withTempDir<T>(
  fn: (tempDir: string) => Promise<T> | T,
  prefix = 'clientsbox-test-',
): Promise<T> {
  const handle = createTempDir(prefix);
  try {
    process.chdir(handle.dir);
    return await fn(handle.dir);
  } finally {
    handle.restoreCwd();
    handle.cleanup();
  }
}
