import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { ScenarioNode } from '../../../src/types/models/node.model.js';
import type { Connection } from '../../../src/types/models/connection.model.js';
import { validateGraph } from '../../../src/domain/graph/graph-integrity.validator.js';

function conn(
  partial: Partial<Connection> & { sourceNodeId: string; targetNodeId: string; key: string },
): Connection {
  return {
    sourceNodeId: partial.sourceNodeId,
    sourcePortIndex: partial.sourcePortIndex ?? 0,
    targetNodeId: partial.targetNodeId,
    targetPortIndex: partial.targetPortIndex ?? 0,
    key: partial.key,
  };
}

function node(
  id: string,
  type: ScenarioNode['type'],
  position: { x: number; y: number },
  extras: Partial<ScenarioNode> = {},
): ScenarioNode {
  return {
    id,
    type,
    position,
    ...extras,
  } as ScenarioNode;
}

describe('CASE-DATA-03-5 — validation topologique du graphe (Start unique, 0 entrée) (SPEC-DATA-03)', () => {
  it('test_CASE_DATA_03_5_graph_topology_start_unique_and_no_inbound', () => {
    const runOnly: ScenarioNode[] = [node('run-1', 'run', { x: 0, y: 0 })];
    const noStartErrors = validateGraph(runOnly, []);
    assert.ok(noStartErrors.length >= 1);
    assert.match(noStartErrors.join('\n'), /Start|absent|manquant/i);

    const twoStarts: ScenarioNode[] = [
      node('start-1', 'start', { x: 0, y: 0 }),
      node('start-2', 'start', { x: 10, y: 0 }),
    ];
    const multiStartErrors = validateGraph(twoStarts, []);
    assert.ok(multiStartErrors.length >= 1);
    assert.match(multiStartErrors.join('\n'), /unique|plusieurs|deux/i);

    const startWithInbound: ScenarioNode[] = [
      node('start-1', 'start', { x: 0, y: 0 }),
      node('run-1', 'run', { x: 100, y: 0 }),
    ];
    const inboundErrors = validateGraph(startWithInbound, [
      conn({ sourceNodeId: 'run-1', targetNodeId: 'start-1', key: '0' }),
    ]);
    assert.ok(inboundErrors.length >= 1);
    assert.match(inboundErrors.join('\n'), /Start|entr[ée]e|R-20|interdit/i);

    const ghostErrors = validateGraph(
      [node('start-1', 'start', { x: 0, y: 0 }), node('run-1', 'run', { x: 100, y: 0 })],
      [conn({ sourceNodeId: 'ghost', targetNodeId: 'run-1', key: '0' })],
    );
    assert.ok(ghostErrors.length >= 1);
    assert.match(ghostErrors.join('\n'), /référence|inexistant|invalide|nœud|noeud/i);

    const validNodes: ScenarioNode[] = [
      node('start-1', 'start', { x: 0, y: 0 }),
      node('run-1', 'run', { x: 100, y: 0 }),
    ];
    const validConnections: Connection[] = [
      conn({ sourceNodeId: 'start-1', targetNodeId: 'run-1', key: '0' }),
    ];
    assert.deepEqual(validateGraph(validNodes, validConnections), []);
  });
});
