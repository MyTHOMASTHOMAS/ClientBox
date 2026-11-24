import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { getOutputPortsForType, IF_BRANCH_VISUALS } from '../../../src/ui/components/canvas/canvas-node.js';
import { buildCableVisual, type CableVisual } from '../../../src/ui/components/canvas/canvas-cable.js';

describe('CASE-UI-02-3 — différenciation visuelle des branches de sortie If (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_3_if_block_output_branches_visual_differentiation', () => {
    const ports = getOutputPortsForType('if');
    assert.equal(ports.length, 2);
    const truePort = ports.find((p) => p.branch === 'true');
    const falsePort = ports.find((p) => p.branch === 'false');
    assert.ok(truePort);
    assert.ok(falsePort);
    assert.equal(truePort.portIndex, 0);
    assert.equal(falsePort.portIndex, 1);

    assert.equal(IF_BRANCH_VISUALS.true.label, 'Vrai');
    assert.equal(IF_BRANCH_VISUALS.false.label, 'Faux');
    assert.ok(IF_BRANCH_VISUALS.true.cssClass !== IF_BRANCH_VISUALS.false.cssClass);
    assert.ok(IF_BRANCH_VISUALS.true.color !== IF_BRANCH_VISUALS.false.color);
    assert.match(IF_BRANCH_VISUALS.true.color, /green|vert|#0/i);
    assert.match(IF_BRANCH_VISUALS.false.color, /red|rouge|#[fF]/i);

    // Autres types : une seule famille de sortie (pas de branch)
    for (const t of ['start', 'run', 'clearContext'] as const) {
      const out = getOutputPortsForType(t);
      assert.ok(out.length >= 1);
      assert.ok(out.every((p) => p.branch === undefined));
    }

    const cableTrue: CableVisual = buildCableVisual(
      {
        sourceNodeId: 'if-1',
        sourcePortIndex: 0,
        targetNodeId: 'run-success',
        targetPortIndex: 0,
        key: '0',
      },
      'true',
    );
    const cableFalse: CableVisual = buildCableVisual(
      {
        sourceNodeId: 'if-1',
        sourcePortIndex: 1,
        targetNodeId: 'run-fallback',
        targetPortIndex: 0,
        key: '0',
      },
      'false',
    );
    assert.equal(cableTrue.branch, 'true');
    assert.equal(cableFalse.branch, 'false');
    assert.equal(cableTrue.cssClass, IF_BRANCH_VISUALS.true.cssClass);
    assert.equal(cableFalse.cssClass, IF_BRANCH_VISUALS.false.cssClass);
    assert.notEqual(cableTrue.cssClass, cableFalse.cssClass);
  });
});
