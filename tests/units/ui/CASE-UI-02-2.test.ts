import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { ScenarioNode, NodeType } from '../../../src/types/models/node.model.js';
import { validateGraph } from '../../../src/domain/graph/graph-integrity.validator.js';
import {
  createCanvasDocument,
  addBlock,
  removeBlock,
  type CanvasDocument,
  type AddBlockResult,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';

function nodeCountByType(doc: CanvasDocument, type: NodeType): number {
  return doc.nodes.filter((n) => n.type === type).length;
}

function assertFrenchWarning(message: string): void {
  assert.ok(message.length > 0);
  assert.match(
    message,
    /[àâäéèêëïîôùûüçœæ]|seul|unique|Start|scénario|bloqué|interdit|veuillez|erreur/i,
  );
  assert.ok(
    !/\b(Submit|Cancel|Error|Delete|Save)\b/.test(message),
    `message non français : ${message}`,
  );
}

describe("CASE-UI-02-2 — contrainte stricte d'unicité du bloc Start (SPEC-UI-02)", () => {
  it('test_CASE_UI_02_2_start_block_strict_uniqueness_enforcement', () => {
    let doc = createCanvasDocument('scen-start');
    const first: AddBlockResult = addBlock(doc, 'start', { x: 10, y: 10 });
    assert.equal(first.ok, true);
    doc = first.document;
    assert.equal(nodeCountByType(doc, 'start'), 1);

    const second = addBlock(doc, 'start', { x: 200, y: 10 });
    assert.equal(second.ok, false);
    assert.equal(nodeCountByType(second.document, 'start'), 1);
    assert.ok(second.error);
    assertFrenchWarning(second.error);
    assert.match(second.error, /un seul|unique|Start/i);

    // Cohérence DOM-008
    const errorsWithOne = validateGraph(doc.nodes, doc.connections);
    assert.deepEqual(errorsWithOne, []);

    const rogueStart: ScenarioNode = {
      id: 'start-rogue',
      type: 'start',
      position: { x: 300, y: 10 },
    };
    const multiErrors = validateGraph([...doc.nodes, rogueStart], doc.connections);
    assert.ok(multiErrors.length > 0);
    assert.ok(multiErrors.some((e) => /Start|unique|un seul/i.test(e)));

    // Suppression puis réinsertion autorisée
    doc = removeBlock(doc, 'start-1');
    assert.equal(nodeCountByType(doc, 'start'), 0);
    const again = addBlock(doc, 'start', { x: 50, y: 50 });
    assert.equal(again.ok, true);
    doc = again.document;
    assert.equal(nodeCountByType(doc, 'start'), 1);
    assert.ok(doc.nodes.some((n) => n.type === 'start' && n.id !== 'start-1'));
  });
});
