import { describe, it, expect, vi } from 'vitest';
import {
  applyExecutionSnapshot,
  resolveExecutionLaunchLock,
  EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE,
  hydrateStudioExecution,
} from '../../../src/ui/hooks/studio/use-scenario-execution.hook.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';

describe('CASE-UI-03-9 — Réhydratation Studio snapshot exécution (SPEC-UI-03 / SPEC-SRV-02)', () => {
  it('test_CASE_UI_03_9_studio_rehydrates_execution_snapshot_and_locks_launch', async () => {
    expect(EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE).toMatch(
      /exécution|déjà en cours|scénario/i,
    );
    expect(EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE).not.toMatch(
      /\b(Error|Loading|Submit|Cancel)\b/,
    );

    const nodes: ScenarioNode[] = [
      { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
      { id: 'run-1', type: 'run', position: { x: 100, y: 0 }, agentId: 'a1' },
      { id: 'run-2', type: 'run', position: { x: 200, y: 0 }, agentId: 'a2' },
    ];

    // 1. Busy sur le même scénario → running + badges + Launch lock
    const sameLock = resolveExecutionLaunchLock({
      scenarioId: 'sc-1',
      snapshot: {
        status: 'running',
        activeScenarioId: 'sc-1',
        busy: true,
        blocks: [
          { nodeId: 'run-1', status: 'running' },
          { nodeId: 'start-1', status: 'completed' },
        ],
      },
    });
    expect(sameLock.isRunning).toBe(true);
    expect(sameLock.isLaunchDisabled).toBe(true);
    expect(sameLock.isForeignRun).toBe(false);
    expect(sameLock.message).toBeNull();

    const hydratedNodes = applyExecutionSnapshot(nodes, {
      status: 'running',
      activeScenarioId: 'sc-1',
      busy: true,
      blocks: [
        { nodeId: 'run-1', status: 'running' },
        { nodeId: 'start-1', status: 'completed' },
      ],
    });
    expect(hydratedNodes.find((n) => n.id === 'run-1')?.status).toBe('running');
    expect(hydratedNodes.find((n) => n.id === 'start-1')?.status).toBe('completed');
    expect(hydratedNodes.find((n) => n.id === 'run-2')?.status).toBeUndefined();

    // 2. Busy sur un autre scénario → Launch lock + message FR, pas d'écrasement des blocks
    const foreignLock = resolveExecutionLaunchLock({
      scenarioId: 'sc-2',
      snapshot: {
        status: 'running',
        activeScenarioId: 'sc-1',
        busy: true,
        blocks: [{ nodeId: 'run-foreign', status: 'running' }],
      },
    });
    expect(foreignLock.isRunning).toBe(false);
    expect(foreignLock.isLaunchDisabled).toBe(true);
    expect(foreignLock.isForeignRun).toBe(true);
    expect(foreignLock.message).toBe(EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE);

    const untouched = applyExecutionSnapshot(nodes, {
      status: 'running',
      activeScenarioId: 'sc-1',
      busy: true,
      blocks: [{ nodeId: 'run-foreign', status: 'running' }],
    });
    // blocks d'un autre scénario : nœuds locaux non mutés avec des ids inconnus
    expect(untouched.find((n) => n.id === 'run-1')?.status).toBeUndefined();
    expect(untouched.every((n) => n.id !== 'run-foreign')).toBe(true);

    // 3. Idle → pas de lock artificiel
    const idleLock = resolveExecutionLaunchLock({
      scenarioId: 'sc-1',
      snapshot: { status: 'idle', activeScenarioId: null, busy: false, blocks: [] },
    });
    expect(idleLock.isRunning).toBe(false);
    expect(idleLock.isLaunchDisabled).toBe(false);
    expect(idleLock.isForeignRun).toBe(false);
    expect(idleLock.message).toBeNull();

    // 4. hydrateStudioExecution appelle GET /api/scenarios/:id/run
    const get = vi.fn().mockResolvedValue({
      status: 'running',
      activeScenarioId: 'sc-1',
      busy: true,
      blocks: [{ nodeId: 'run-1', status: 'running' }],
    });
    const result = await hydrateStudioExecution({
      scenarioId: 'sc-1',
      client: { get } as never,
      nodes,
    });
    expect(get).toHaveBeenCalledWith('/api/scenarios/sc-1/run');
    expect(result.isRunning).toBe(true);
    expect(result.isLaunchDisabled).toBe(true);
    expect(result.nodes.find((n) => n.id === 'run-1')?.status).toBe('running');
  });
});
