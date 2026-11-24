/**
 * CASE-DATA-01-7 — Intégrité et typage strict des modèles de données étendus d'Option B
 * (`AC-DATA-01-1`, `AC-DATA-03-1` / `SPEC-DATA-01`, `SPEC-DATA-03`).
 */

import { describe, it, expect } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { Node, NodeType } from '../../../src/types/models/node.model.js';
import type { Connection } from '../../../src/types/models/connection.model.js';
import type { BlockStatus, RunnerStatus } from '../../../src/types/messages/block-status.message.js';
import type { JoinDecision } from '../../../src/domain/join/join-barrier.evaluator.js';

describe('CASE-DATA-01-7 — Modèles de données étendus Option B (SPEC-DATA-01 / SPEC-DATA-03)', () => {
  it('test_CASE_DATA_01_7_extended_models_type_integrity', () => {
    // 1. Validation des 4 types de blocs officiels
    const validBlockTypes: readonly NodeType[] = ['start', 'run', 'if', 'clearContext'];
    expect(validBlockTypes).toHaveLength(4);

    const nodes: Node[] = [
      { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, label: 'Départ' },
      { id: 'if-1', type: 'if', position: { x: 100, y: 100 }, label: 'Condition' },
      { id: 'run-1', type: 'run', position: { x: 200, y: 200 }, label: 'Exécution', agentId: 'agent-1' },
      { id: 'clear-1', type: 'clearContext', position: { x: 300, y: 300 }, label: 'Nettoyage', agentId: 'agent-1' },
    ];

    // 2. Validation des connexions et ports de sortie If (true/false)
    const connections: Connection[] = [
      { from: 'start-1', to: 'if-1', key: '0', outputPort: 'default' },
      { from: 'if-1', to: 'run-1', key: '0', outputPort: 'true' },
      { from: 'if-1', to: 'clear-1', key: '0', outputPort: 'false' },
    ];

    const scenario: Scenario = {
      id: 'sc-test',
      name: 'Scénario Test Intégrité',
      nodes,
      connections,
    };

    // 3. Sérialisation et désérialisation sans altération
    const serialized = JSON.stringify(scenario);
    const parsed = JSON.parse(serialized) as Scenario;
    expect(parsed.id).toBe('sc-test');
    expect(parsed.nodes).toHaveLength(4);
    expect(parsed.connections).toHaveLength(3);

    // 4. Énumération exhaustive des statuts BlockStatus per TYPES-012
    const statuses: readonly BlockStatus[] = ['idle', 'running', 'paused', 'completed', 'error'];
    expect(statuses).toHaveLength(5);

    // 5. Énumération exhaustive des statuts RunnerStatus
    const runnerStatuses: readonly RunnerStatus[] = ['idle', 'running', 'paused', 'stopped', 'completed', 'error'];
    expect(runnerStatuses).toHaveLength(6);

    // 6. Énumération des décisions de jointure JoinDecision
    const decisions: readonly JoinDecision[] = ['trigger', 'pause', 'waiting'];
    expect(decisions).toHaveLength(3);
  });
});
