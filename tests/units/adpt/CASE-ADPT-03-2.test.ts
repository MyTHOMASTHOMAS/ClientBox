import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import {
  SessionRecordingAdapter,
  chain,
  clearNode,
  createSessionStore,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

function createRunner(scenario: Scenario, adapter: SessionRecordingAdapter) {
  const runner = new ScenarioRunnerService({
    scenario,
    adapters: [adapter],
    workspacePath: '/tmp/adpt-03-2',
    resourceStore: createSessionStore() as never,
  });
  const spawned: string[] = [];
  vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
    spawned.push((args[0] as { id: string }).id);
    return '';
  });
  return { runner, spawned };
}

describe('CASE-ADPT-03-2 — session de scénario réutilisée puis renouvelée après ClearContext (SPEC-ADPT-03)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_03_2_scenario_session_reuse_and_renewal_after_clear', async () => {
    // Scénario A : Start → Run-1(a) → Run-2(a) → Run-3(b)
    const adapterA = new SessionRecordingAdapter();
    const scenarioA: Scenario = {
      id: 'sc-session-reuse',
      name: 'Réutilisation de session',
      nodes: [startNode(), runNode('run-1', 'agent-a'), runNode('run-2', 'agent-a'), runNode('run-3', 'agent-b')],
      connections: chain('start-1', 'run-1', 'run-2', 'run-3'),
    };
    const a = createRunner(scenarioA, adapterA);
    await a.runner.run();

    expect(a.spawned).toEqual(['run-1', 'run-2', 'run-3']);
    expect(adapterA.createSessionCalls).toEqual(['agent-a', 'agent-b']);
    expect(adapterA.sessionOf('run-1')).toBe('chat-1');
    expect(adapterA.sessionOf('run-2')).toBe('chat-1');
    expect(adapterA.sessionOf('run-3')).toBe('chat-2');

    // Scénario B : Start → Run-1(a) → Run-b(b) → Clear(a) → Run-2(a) → Run-b2(b)
    const adapterB = new SessionRecordingAdapter();
    const scenarioB: Scenario = {
      id: 'sc-session-renew',
      name: 'Renouvellement après Clear',
      nodes: [
        startNode(),
        runNode('run-1', 'agent-a'),
        runNode('run-b', 'agent-b'),
        clearNode('clear-a', 'agent-a'),
        runNode('run-2', 'agent-a'),
        runNode('run-b2', 'agent-b'),
      ],
      connections: chain('start-1', 'run-1', 'run-b', 'clear-a', 'run-2', 'run-b2'),
    };
    const b = createRunner(scenarioB, adapterB);
    await b.runner.run();

    expect(b.runner.getStatus()).toBe('completed');
    expect(adapterB.createSessionCalls).toEqual(['agent-a', 'agent-b', 'agent-a']);
    expect(adapterB.sessionOf('run-1')).toBe('chat-1');
    expect(adapterB.sessionOf('run-b')).toBe('chat-2');
    expect(adapterB.sessionOf('run-2')).toBe('chat-3');
    expect(adapterB.sessionOf('run-b2')).toBe('chat-2');

    // Le bloc Clear ne lance aucune commande CLI
    expect(b.spawned).toEqual(['run-1', 'run-b', 'run-2', 'run-b2']);
    expect(adapterB.runs).toHaveLength(4);
  });
});
