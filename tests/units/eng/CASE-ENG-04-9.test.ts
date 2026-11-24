import { describe, it, expect, vi, afterEach } from 'vitest';
import type {
  CLIAdapter,
  CommandSpawnOptions,
  ExecutionContext,
} from '../../../src/types/contracts/cli-adapter.contract.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';
import { chain, createSessionStore, runNode, startNode } from '../../helpers/session-runner.js';

async function waitUntil(predicate: () => boolean, maxTicks = 50): Promise<void> {
  for (let tick = 0; tick < maxTicks && !predicate(); tick += 1) {
    await flushPromises();
  }
}

/**
 * Adapter dont `createSession` reste en attente jusqu'à `releaseCreateSession()`.
 * Ouvre la fenêtre prepareRunContext sans handle de spawn encore tracké.
 */
class GatedSessionAdapter implements CLIAdapter {
  readonly cliId = 'cursor-cli';
  readonly createSessionCalls: string[] = [];
  private resolveGate: () => void = () => undefined;
  private readonly gate = new Promise<void>((resolve) => {
    this.resolveGate = resolve;
  });

  releaseCreateSession() {
    this.resolveGate();
  }

  async createSession(ctx: ExecutionContext): Promise<string> {
    this.createSessionCalls.push(ctx.agentId);
    await this.gate;
    return `chat-${String(this.createSessionCalls.length)}`;
  }

  buildCommand(ctx: ExecutionContext): CommandSpawnOptions {
    return { command: 'mock-agent', args: [], cwd: ctx.workspacePath };
  }

  parseStreamLine(line: string) {
    return { type: 'stdout' as const, chunk: line };
  }
}

describe('CASE-ENG-04-9 — Stop pendant prepareRunContext : aucun CLI Run orphelin (SPEC-ENG-04 / SPEC-ADPT-03)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_04_9_stop_during_run_prepare_leaves_no_orphan_cli_process', async () => {
    const adapter = new GatedSessionAdapter();
    // Start → Run("run-prep") → Run("run-downstream")
    const scenario: Scenario = {
      id: 'sc-stop-during-prepare',
      name: 'Stop pendant préparation',
      nodes: [startNode(), runNode('run-prep', 'agent-a'), runNode('run-downstream', 'agent-a')],
      connections: chain('start-1', 'run-prep', 'run-downstream'),
    };

    const runner = new ScenarioRunnerService({
      scenario,
      adapters: [adapter],
      workspacePath: '/tmp/eng-04-9-stop-prepare',
      resourceStore: createSessionStore() as never,
    });

    const spawned: string[] = [];
    const handleStops: Array<ReturnType<typeof vi.fn>> = [];
    let releaseSpawn: () => void = () => undefined;
    const spawnGate = new Promise<void>((resolve) => {
      releaseSpawn = resolve;
    });

    // Comportement actuel simulé : handle ajouté SANS re-check isHalted (anti-faux-vert 04-4).
    vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      spawned.push(node.id);
      const handleStop = vi.fn();
      handleStops.push(handleStop);
      (
        runner as unknown as { activeSpawnHandles: Set<{ stop: () => void }> }
      ).activeSpawnHandles.add({ stop: handleStop });
      await spawnGate;
      return `sortie:${node.id}`;
    });

    const runPromise = runner.run();
    try {
      await waitUntil(() => adapter.createSessionCalls.length === 1);

      const activeHandles = (
        runner as unknown as { activeSpawnHandles: Set<unknown> }
      ).activeSpawnHandles;
      expect(activeHandles.size).toBe(0);
      expect(spawned).toEqual([]);

      await runner.stop();
      expect(runner.getStatus()).toBe('stopped');
      // Stop ≠ Clear : aucun createSession supplémentaire déclenché par le Stop
      expect(adapter.createSessionCalls).toEqual(['agent-a']);

      adapter.releaseCreateSession();
      await flushPromises();
      await flushPromises();

      const noSpawnAfterStop = spawned.length === 0;
      const raceHandlesAllStopped =
        spawned.length > 0 && handleStops.every((stopFn) => stopFn.mock.calls.length > 0);

      // Prédicat case : pas de spawn après Stop, ou handles de course immédiatement stoppés
      expect(noSpawnAfterStop || raceHandlesAllStopped).toBe(true);
      expect(spawned).not.toContain('run-downstream');
      expect(activeHandles.size).toBe(0);
      expect(runner.getStatus()).toBe('stopped');
      expect(adapter.createSessionCalls).toEqual(['agent-a']);

      releaseSpawn();
      await runPromise;
      await flushPromises();

      expect(spawned).not.toContain('run-downstream');
      expect(runner.getStatus()).toBe('stopped');
      expect(activeHandles.size).toBe(0);
    } finally {
      adapter.releaseCreateSession();
      releaseSpawn();
      await runPromise.catch(() => undefined);
      await flushPromises();
    }
  });
});
