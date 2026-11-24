import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { h } from 'preact';

import type { NodeType, ScenarioNode } from '../../../src/types/models/node.model.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { assignDefaultKey } from '../../../src/domain/keys/key-assigner.domain.js';
import { hasKeyCollision } from '../../../src/domain/keys/key-collision.validator.js';
import {
  createCanvasDocument,
  addBlock,
  moveBlock,
  wireOriented,
  type CanvasDocument,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import {
  getInspectorFieldsForType,
  applyInspectorParams,
  InspectorPanel,
} from '../../../src/ui/components/canvas/inspector-panel.js';

function nodeCountByType(doc: CanvasDocument, type: NodeType): number {
  return doc.nodes.filter((n) => n.type === type).length;
}

describe('CASE-UI-02-1 — composition nodale du canvas et câblage orienté (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_1_canvas_nodal_composition_and_oriented_wiring', () => {
    let doc = createCanvasDocument('scen-demo');
    assert.deepEqual(doc.nodes, []);
    assert.deepEqual(doc.connections, []);

    const types: readonly NodeType[] = ['start', 'run', 'if', 'clearContext'];
    const positions = [
      { x: 40, y: 80 },
      { x: 220, y: 80 },
      { x: 400, y: 80 },
      { x: 580, y: 80 },
    ];

    for (let i = 0; i < types.length; i += 1) {
      const result = addBlock(doc, types[i]!, positions[i]!);
      assert.equal(result.ok, true);
      doc = result.document;
    }
    assert.equal(doc.nodes.length, 4);
    for (const t of types) {
      assert.equal(nodeCountByType(doc, t), 1, `type manquant : ${t}`);
    }

    // Déplacement libre sur la grille
    doc = moveBlock(doc, 'start-1', { x: 60, y: 120 });
    const moved = doc.nodes.find((n) => n.id === 'start-1');
    assert.ok(moved);
    assert.deepEqual(moved.position, { x: 60, y: 120 });

    // Panneau d'inspection — champs éditables par type
    assert.deepEqual(getInspectorFieldsForType('start'), ['label']);
    assert.deepEqual(getInspectorFieldsForType('run'), ['agentId', 'promptId', 'exitId']);
    assert.deepEqual(getInspectorFieldsForType('if'), ['ifScriptId']);
    assert.deepEqual(getInspectorFieldsForType('clearContext'), ['agentId']);

    const runNode = doc.nodes.find((n) => n.type === 'run');
    assert.ok(runNode);
    const updatedRun = applyInspectorParams(runNode, {
      agentId: 'agent-dev',
      promptId: 'prompt-hello',
      exitId: 'exit-done',
    });
    assert.equal(updatedRun.agentId, 'agent-dev');
    assert.equal(updatedRun.promptId, 'prompt-hello');
    assert.equal(updatedRun.exitId, 'exit-done');

    // Purge des paramètres optionnels effacés (chaîne vide) sans laisser de clé résiduelle orpheline
    const clearedRun = applyInspectorParams(updatedRun, {
      agentId: '',
    });
    assert.equal(clearedRun.agentId, undefined);
    assert.equal('agentId' in clearedRun, false);

    doc = {
      ...doc,
      nodes: doc.nodes.map((n) => (n.id === updatedRun.id ? updatedRun : n)),
    };

    // Vérification du composant VDOM InspectorPanel pour un bloc Run (BUG-08 / REQ-014)
    const runScenarioNode: ScenarioNode = {
      id: 'run-1',
      type: 'run',
      position: { x: 100, y: 100 },
      agentId: 'agent-dev',
      promptId: 'prompt-hello',
      exitId: 'exit-done',
    };
    const mockScenario: Scenario = {
      id: 'scen-demo',
      name: 'Scénario Démo',
      nodes: [runScenarioNode],
      connections: [],
    };
    assert.equal(typeof InspectorPanel, 'function');
    const renderedJson = JSON.stringify(
      (InspectorPanel as any)({ selectedNodeId: 'run-1', scenario: mockScenario }),
    );
    assert.match(renderedJson, /inspector-exit/);
    assert.match(renderedJson, /Condition de sortie/);

    // Câblage orienté Start → Run avec clé auto
    const wired = wireOriented(doc, {
      sourceNodeId: 'start-1',
      sourcePortIndex: 0,
      targetNodeId: 'run-1',
      targetPortIndex: 0,
    });
    assert.equal(wired.ok, true);
    doc = wired.document;
    assert.equal(doc.connections.length, 1);
    const edge = doc.connections[0]!;
    assert.equal(edge.sourceNodeId, 'start-1');
    assert.equal(edge.targetNodeId, 'run-1');
    assert.equal(edge.key, assignDefaultKey([], 'run-1'));
    assert.equal(edge.key, '0');
    assert.equal(hasKeyCollision(doc.connections, 'run-1', edge.key), true);

    // Seconde entrée → clé "1"
    const ifNode = doc.nodes.find((n) => n.type === 'if');
    assert.ok(ifNode);
    const w2 = wireOriented(doc, {
      sourceNodeId: 'start-1',
      sourcePortIndex: 0,
      targetNodeId: ifNode.id,
      targetPortIndex: 0,
    });
    assert.equal(w2.ok, true);
    doc = w2.document;
    const w3 = wireOriented(doc, {
      sourceNodeId: ifNode.id,
      sourcePortIndex: 0,
      targetNodeId: 'run-1',
      targetPortIndex: 0,
    });
    assert.equal(w3.ok, true);
    doc = w3.document;
    const runKeys = doc.connections
      .filter((c) => c.targetNodeId === 'run-1')
      .map((c) => c.key)
      .sort();
    assert.deepEqual(runKeys, ['0', '1']);
    assert.equal(hasKeyCollision(doc.connections, 'run-1', '0'), true);
  });
});
