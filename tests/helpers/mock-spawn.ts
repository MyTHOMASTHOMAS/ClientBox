import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { vi } from 'vitest';
import { PassThrough } from 'node:stream';
import type { ChildProcess, SpawnOptions } from 'node:child_process';
import * as childProcessEsm from 'node:child_process';
import type * as ChildProcessModule from 'node:child_process';

// Les sources chargent `node:child_process` via `createRequire` (CJS) ou ESM.
const childProcessCjs = createRequire(import.meta.url)(
  'node:child_process',
) as typeof ChildProcessModule;

export interface MockSpawnRecord {
  readonly command: string;
  readonly args: readonly string[];
  readonly options: SpawnOptions | undefined;
  readonly pid: number;
}

export interface MockKillRecord {
  readonly pid: number;
  readonly signal: NodeJS.Signals | number;
}

export class MockChildProcess extends EventEmitter {
  public pid: number;
  public killed = false;
  public exitCode: number | null = null;
  public signalCode: NodeJS.Signals | null = null;
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly stdio: [typeof this.stdin, typeof this.stdout, typeof this.stderr, null, null] = [
    this.stdin,
    this.stdout,
    this.stderr,
    null,
    null,
  ];

  private static nextPid = 42001;

  constructor(pid?: number) {
    super();
    this.pid = pid ?? MockChildProcess.nextPid++;
  }

  kill(signal: NodeJS.Signals | number = 'SIGTERM'): boolean {
    this.killed = true;
    this.emit('mock-kill', signal);
    return true;
  }

  emitExit(code: number | null, signal: NodeJS.Signals | null = null): void {
    this.exitCode = code;
    this.signalCode = signal;
    this.emit('exit', code, signal);
    this.emit('close', code, signal);
  }

  emitError(error: Error): void {
    this.emit('error', error);
  }

  writeStdout(chunk: string | Buffer): void {
    this.stdout.write(chunk);
  }

  writeStderr(chunk: string | Buffer): void {
    this.stderr.write(chunk);
  }
}

export type SpawnFactory = (
  command: string,
  args: readonly string[],
  options?: SpawnOptions,
) => MockChildProcess;

export interface SpawnMockController {
  readonly spawns: readonly MockSpawnRecord[];
  readonly kills: readonly MockKillRecord[];
  setFactory(factory: SpawnFactory): void;
  getLastSpawn(): MockSpawnRecord | undefined;
  getLastProcess(): MockChildProcess | undefined;
  restore(): void;
}

/**
 * Installe un mock sur `child_process.spawn`. Appeler `restore()` en afterEach.
 */
export function installSpawnMock(initialFactory?: SpawnFactory): SpawnMockController {
  const spawns: MockSpawnRecord[] = [];
  const kills: MockKillRecord[] = [];
  const processesOrdered: MockChildProcess[] = [];

  let factory: SpawnFactory =
    initialFactory ??
    (() => {
      return new MockChildProcess();
    });

  const spawnMock = vi.fn(
    (command: string, args: readonly string[], options?: SpawnOptions): ChildProcess => {
      const proc = factory(command, args, options);
      spawns.push({ command, args, options, pid: proc.pid });
      processesOrdered.push(proc);
      proc.on('mock-kill', (signal: NodeJS.Signals | number) => {
        kills.push({ pid: proc.pid, signal });
      });
      return proc as unknown as ChildProcess;
    },
  );

  const spawnSpyCjs = vi
    .spyOn(childProcessCjs, 'spawn')
    .mockImplementation(spawnMock as unknown as typeof childProcessCjs.spawn);

  let spawnSpyEsm: ReturnType<typeof vi.spyOn> | undefined;
  try {
    spawnSpyEsm = vi
      .spyOn(childProcessEsm, 'spawn')
      .mockImplementation(spawnMock as unknown as typeof childProcessEsm.spawn);
  } catch {
    // Dans certains environnements ESM figés
  }

  return {
    get spawns(): readonly MockSpawnRecord[] {
      return spawns;
    },
    get kills(): readonly MockKillRecord[] {
      return kills;
    },
    setFactory(next: SpawnFactory): void {
      factory = next;
    },
    getLastSpawn(): MockSpawnRecord | undefined {
      return spawns.at(-1);
    },
    getLastProcess(): MockChildProcess | undefined {
      return processesOrdered.at(-1);
    },
    restore(): void {
      spawnSpyCjs.mockRestore();
      spawnSpyEsm?.mockRestore();
    },
  };
}
