import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { flushPromises } from '../../helpers/flush-promises.js';
import {
  SessionRecordingAdapter,
  chain,
  clearNode,
  createSessionStore,
  link,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

async function waitUntil(predicate: () => boolean, maxTicks = 50): Promise<void> {
  for (let tick = 0; tick < maxTicks && !predicate(); tick += 1) {
    await flushPromises();
  }
}

describe("CASE-ADPT-03-4 — ClearContext n'interrompt pas un Run en cours du même agent (SPEC-ADPT-03 / SPEC-ENG-03)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_03_4_clear_context_decoupled_from_process_termination', async () => {
    const adapter = new SessionRecordingAdapter();
    // Start → Run-long(a)  ||  Start → Run-init(a) → Clear(a) → Run-after(a)
    const scenario: Scenario = {
      id: 'sc-clear-during-run',
      name: 'Clear pendant un Run',
      nodes: [
        startNode(),
        runNode('run-long', 'agent-a'),
        runNode('run-init', 'agent-a'),
        clearNode('clear-a', 'agent-a'),
        runNode('run-after', 'agent-a'),
      ],
      connections: [link('start-1', 'run-long'), ...chain('start-1', 'run-init', 'clear-a', 'run-after')],
    };

    const runner = new ScenarioRunnerService({
      scenario,
      adapters: [adapter],
      workspacePath: '/tmp/adpt-03-4',
      resourceStore: createSessionStore() as never,
    });

    const statuses = new Map<string, BlockStatus>();
    runner.on('blockStatusChanged', (payload: unknown) => {
      const event = payload as { nodeId: string; status: BlockStatus };
      statuses.set(event.nodeId, event.status);
    });

    let releaseLong: () => void = () => undefined;
    const longGate = new Promise<void>((resolve) => {
      releaseLong = resolve;
    });
    const longHandle = { stop: vi.fn() };
    const spawned: string[] = [];

    vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
      const node = args[0] as { id: string };
      spawned.push(node.id);
      if (node.id !== 'run-long') return '';
      const handles = (runner as any).activeSpawnHandles as Set<unknown>;
      handles.add(longHandle);
      await longGate;
      handles.delete(longHandle);
      return 'sortie longue';
    });

    const runPromise = runner.run();
    await waitUntil(() => spawned.includes('run-after'));

    // Clear exécuté pendant Run-long : aucun processus tué, Run-long toujours en cours
    expect(statuses.get('clear-a')).toBe('completed');
    expect(statuses.get('run-long')).toBe('running');
    expect(longHandle.stop).not.toHaveBeenCalled();

    releaseLong();
    await runPromise;

    expect(longHandle.stop).not.toHaveBeenCalled();
    expect(statuses.get('run-long')).toBe('completed');
    expect(runner.getStatus()).toBe('completed');

    expect(adapter.createSessionCalls).toEqual(['agent-a', 'agent-a']);
    expect(adapter.sessionOf('run-long')).toBe('chat-1');
    expect(adapter.sessionOf('run-init')).toBe('chat-1');
    expect(adapter.sessionOf('run-after')).toBe('chat-2');
  });
});
