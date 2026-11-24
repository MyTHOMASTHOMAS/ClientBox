import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import {
  SessionRecordingAdapter,
  chain,
  clearNode,
  createSessionStore,
  link,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

function createRunner(scenario: Scenario, adapter: SessionRecordingAdapter) {
  const runner = new ScenarioRunnerService({
    scenario,
    adapters: [adapter],
    workspacePath: '/tmp/eng-03-4',
    resourceStore: createSessionStore() as never,
  });
  const statuses = new Map<string, BlockStatus>();
  runner.on('blockStatusChanged', (payload: unknown) => {
    const event = payload as { nodeId: string; status: BlockStatus };
    statuses.set(event.nodeId, event.status);
  });
  const spawned: string[] = [];
  vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
    spawned.push((args[0] as { id: string }).id);
    return '';
  });
  return { runner, statuses, spawned };
}

/**
 * CASE-ENG-03-4 — ClearContext oublie la session de l'agent (nouvelle session au Run suivant)
 * et propage power:1. Un réarmement de PolicyInjectionState seul doit faire échouer ce test.
 */
describe('CASE-ENG-03-4 — ClearContext : nouvelle session + propagation power 1 (SPEC-ENG-03 / SVC-001)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ENG_03_4_clear_context_block_reset_and_power_propagation', async () => {
    // Start → Run-before(agent-dev) → Clear-1(agent-dev) → Run-next(agent-dev)
    const adapter = new SessionRecordingAdapter();
    const scenario: Scenario = {
      id: 'sc-clear',
      name: 'Run, Clear puis Run',
      nodes: [
        startNode(),
        runNode('run-before', 'agent-dev'),
        clearNode('clear-1', 'agent-dev'),
        runNode('run-next', 'agent-dev'),
      ],
      connections: chain('start-1', 'run-before', 'clear-1', 'run-next'),
    };
    const main = createRunner(scenario, adapter);
    await main.runner.run();

    expect(adapter.sessionOf('run-before')).toBe('chat-1');
    expect(adapter.sessionOf('run-next')).toBe('chat-2');
    expect(main.statuses.get('clear-1')).toBe('completed');

    // Propagation power 1 : Run-next exécuté après Clear-1 ; aucun spawn pour le bloc Clear
    expect(main.spawned).toEqual(['run-before', 'run-next']);
    expect(main.statuses.get('run-next')).toBe('completed');

    // ClearContext isolé (0 sortie), agent sans session : no-op, terminaison sans erreur
    const isolatedAdapter = new SessionRecordingAdapter();
    const isolatedScenario: Scenario = {
      id: 'sc-clear-isolated',
      name: 'Clear isolé',
      nodes: [startNode(), clearNode('clear-isolated', 'agent-dev')],
      connections: [link('start-1', 'clear-isolated')],
    };
    const isolated = createRunner(isolatedScenario, isolatedAdapter);

    await expect(isolated.runner.run()).resolves.toBeUndefined();
    expect(isolated.statuses.get('clear-isolated')).toBe('completed');
    expect(isolatedAdapter.createSessionCalls).toEqual([]);
    expect(isolated.spawned).toEqual([]);
    expect(isolated.runner.getStatus()).toBe('completed');
  });
});
