import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { ScenarioRunnerService } from '../../../src/services/runner/scenario-runner.service.js';
import { createTempDir } from '../../helpers/temp-dir.js';
import {
  SessionRecordingAdapter,
  chain,
  createSessionStore,
  link,
  runNode,
  startNode,
} from '../../helpers/session-runner.js';

function createRunner(scenario: Scenario, adapter: SessionRecordingAdapter, workspacePath: string) {
  const runner = new ScenarioRunnerService({
    scenario,
    adapters: [adapter],
    workspacePath,
    resourceStore: createSessionStore() as never,
  });
  const spawned: string[] = [];
  vi.spyOn(runner as any, 'executeSpawn').mockImplementation(async (...args: unknown[]) => {
    spawned.push((args[0] as { id: string }).id);
    return '';
  });
  return { runner, spawned };
}

function filesContaining(root: string, needles: readonly string[]): string[] {
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const content = fs.readFileSync(full, 'utf8');
      if (needles.some((needle) => content.includes(needle) || entry.name.includes(needle))) {
        found.push(path.relative(root, full));
      }
    }
  };
  walk(root);
  return found;
}

describe("CASE-ADPT-03-3 — sessions propres à l'exécution, non persistées (SPEC-ADPT-03)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('test_CASE_ADPT_03_3_sessions_scoped_to_execution_and_not_persisted', async () => {
    const tmp = createTempDir('clientsbox-adpt-03-3-');
    try {
      fs.mkdirSync(path.join(tmp.dir, '.agents', 'data', 'agents'), { recursive: true });

      // Deux exécutions successives (deux runners) du même scénario : sessions différentes
      const adapter = new SessionRecordingAdapter();
      const scenario: Scenario = {
        id: 'sc-scoped',
        name: 'Sessions par exécution',
        nodes: [startNode(), runNode('run-1', 'agent-a')],
        connections: chain('start-1', 'run-1'),
      };

      const first = createRunner(scenario, adapter, tmp.dir);
      await first.runner.run();
      const second = createRunner(scenario, adapter, tmp.dir);
      await second.runner.run();

      expect(adapter.createSessionCalls).toEqual(['agent-a', 'agent-a']);
      expect(adapter.runs.map((run) => run.sessionId)).toEqual(['chat-1', 'chat-2']);

      // Aucune trace de session écrite sur disque par ClientsBox
      expect(filesContaining(tmp.dir, ['chat-1', 'chat-2'])).toEqual([]);

      // Fan-out : deux premiers Runs parallèles du même agent → une seule session partagée
      const slowAdapter = new SessionRecordingAdapter(5);
      const fanOut: Scenario = {
        id: 'sc-fanout-session',
        name: 'Fan-out même agent',
        nodes: [startNode(), runNode('run-a', 'agent-a'), runNode('run-b', 'agent-a')],
        connections: [link('start-1', 'run-a'), link('start-1', 'run-b')],
      };
      const parallel = createRunner(fanOut, slowAdapter, tmp.dir);
      await parallel.runner.run();

      expect(slowAdapter.createSessionCalls).toEqual(['agent-a']);
      expect(slowAdapter.sessionOf('run-a')).toBe('chat-1');
      expect(slowAdapter.sessionOf('run-b')).toBe('chat-1');
      expect([...parallel.spawned].sort()).toEqual(['run-a', 'run-b']);
      expect(parallel.runner.getStatus()).toBe('completed');
    } finally {
      tmp.cleanup();
    }
  });
});
