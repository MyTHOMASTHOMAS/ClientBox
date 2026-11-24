import { describe, it, expect, vi } from 'vitest';
import {
  applyExecutionSnapshot,
  resolveExecutionLaunchLock,
  hydrateStudioExecution,
} from '../../../src/ui/hooks/studio/use-scenario-execution.hook.js';
import {
  isStopEnabled,
  triggerEmergencyStop,
} from '../../../src/ui/components/terminal/terminal-controls.js';
import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { HttpClient } from '../../../src/ui/api/http.client.js';

describe('CASE-UI-03-10 — CallScenario non-recovery enfant + Stop racine (SPEC-UI-03)', () => {
  it('test_CASE_UI_03_10_call_scenario_no_child_recovery_and_root_stop', async () => {
    const childNodes: ScenarioNode[] = [
      { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
      { id: 'run-child', type: 'run', position: { x: 100, y: 0 }, agentId: 'a1' },
    ];

    const nestedSnapshot = {
      status: 'running',
      activeScenarioId: 'parent',
      busy: true,
      blocks: [
        { nodeId: 'call-1', status: 'running' },
        { nodeId: 'run-child', status: 'running' },
      ],
    };

    // Studio ouvert sur l'enfant pendant CallScenario parent → foreign run
    const childLock = resolveExecutionLaunchLock({
      scenarioId: 'enfant',
      snapshot: nestedSnapshot,
    });
    expect(childLock.isRunning).toBe(false);
    expect(childLock.isForeignRun).toBe(true);
    expect(childLock.isLaunchDisabled).toBe(true);

    // Hydratation produit : pas de pastilles nested sur le canvas enfant
    const hydrated = await hydrateStudioExecution({
      scenarioId: 'enfant',
      client: {
        get: vi.fn().mockResolvedValue(nestedSnapshot),
      } as never,
      nodes: childNodes,
    });
    expect(hydrated.isForeignRun).toBe(true);
    expect(hydrated.nodes.find((n) => n.id === 'run-child')?.status).toBeUndefined();

    // applyExecutionSnapshot doit aussi refuser d'appliquer un snapshot d'un autre scénario
    // (contrat CR-008 : option scenarioId / activeScenarioId)
    const applied = (
      applyExecutionSnapshot as (
        nodes: readonly ScenarioNode[],
        snapshot: typeof nestedSnapshot,
        options?: { scenarioId: string },
      ) => ScenarioNode[]
    )(childNodes, nestedSnapshot, { scenarioId: 'enfant' });
    expect(applied.find((n) => n.id === 'run-child')?.status).toBeUndefined();

    // Stop racine pendant CallScenario : actif + DELETE sur le parent (pas l'enfant)
    expect(isStopEnabled('running')).toBe(true);
    const dels: string[] = [];
    const http: HttpClient = {
      get: async () => {
        throw new Error('get non attendu');
      },
      put: async () => {
        throw new Error('put non attendu');
      },
      post: vi.fn(async () => ({ ok: true })) as HttpClient['post'],
      del: vi.fn(async (url: string) => {
        dels.push(url);
        return { ok: true };
      }) as HttpClient['del'],
      connectSse: () => ({ close() {} }),
    };
    const stop = await triggerEmergencyStop({
      scenarioId: 'parent',
      runnerStatus: 'running',
      http,
    });
    expect(stop.ok).toBe(true);
    expect(dels).toEqual(['/api/scenarios/parent/run']);
    expect(dels.some((u) => u.includes('/enfant/'))).toBe(false);
  });
});
