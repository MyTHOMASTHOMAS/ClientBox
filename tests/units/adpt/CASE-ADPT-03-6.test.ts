import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import {
  SessionRecordingAdapter,
  chain,
  createSessionStore,
  link,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

function callScenarioNode(id: string, targetScenarioId: string): ScenarioNode {
  return {
    id,
    type: 'callScenario',
    position: { x: 0, y: 0 },
    targetScenarioId,
  } as ScenarioNode;
}

/**
 * CASE-ADPT-03-6 — isolation table de sessions sous-runner CallScenario.
 */
describe('CASE-ADPT-03-6 — CallScenario sessions isolées (SPEC-ADPT-03 / AC-ADPT-03-4)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_03_6_call_scenario_isolated_session_registry', async () => {
    const adapter = new SessionRecordingAdapter();
    const child: Scenario = {
      id: 'enfant',
      name: 'Enfant',
      nodes: [startNode(), runNode('run-child', 'agent-dev')],
      connections: [link('start-1', 'run-child')],
    };
    const parent: Scenario = {
      id: 'parent',
      name: 'Parent',
      nodes: [
        startNode(),
        runNode('run-parent', 'agent-dev'),
        callScenarioNode('call-1', 'enfant'),
      ],
      connections: chain('start-1', 'run-parent', 'call-1'),
    };
    const store = {
      ...createSessionStore(),
      getScenario: vi.fn(async (id: string) => {
        if (id === 'enfant') return child;
        throw new Error(`Scénario introuvable : ${id}`);
      }),
    };

    vi.spyOn(ScenarioRunnerService.prototype as any, 'executeSpawn').mockImplementation(
      async (...args: unknown[]) => {
        const ctx = args[1] as {
          assembledPrompt: string;
          sessionId?: string;
          agentId?: string;
          workspacePath: string;
        };
        adapter.buildCommand({
          agentId: ctx.agentId ?? 'agent-dev',
          assembledPrompt: ctx.assembledPrompt,
          sessionId: ctx.sessionId,
          workspacePath: ctx.workspacePath,
        } as never);
        return '';
      },
    );

    const runner = new ScenarioRunnerService({
      scenario: parent,
      adapters: [adapter],
      workspacePath: '/tmp/adpt-03-6',
      resourceStore: store as never,
    });

    await runner.run();

    const Sp = adapter.sessionOf('run-parent');
    const Sc = adapter.sessionOf('run-child');
    expect(Sp).toBeTruthy();
    expect(Sc).toBeTruthy();
    expect(Sp).not.toBe(Sc);
  });
});
