import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { BlockStatus } from '../../../src/types/messages/block-status.message.js';
import {
  mapBlockStatusToVisual,
  BLOCK_STATUS_VISUALS,
  type BlockStatusVisual,
} from '../../../src/ui/components/canvas/canvas-node.js';

describe("CASE-UI-02-4 — affichage temps réel des statuts d'exécution des blocs (SPEC-UI-02)", () => {
  it('test_CASE_UI_02_4_canvas_node_execution_status_realtime_display', () => {
    const expected: readonly BlockStatus[] = ['idle', 'running', 'paused', 'completed', 'error'];
    assert.equal(Object.keys(BLOCK_STATUS_VISUALS).length, 5);

    const seenLabels = new Set<string>();
    for (const status of expected) {
      const visual: BlockStatusVisual = mapBlockStatusToVisual(status);
      assert.equal(visual.status, status);
      assert.ok(visual.cssClass.length > 0);
      assert.ok(visual.labelFr.length > 0);
      seenLabels.add(visual.labelFr);
    }

    assert.equal(mapBlockStatusToVisual('idle').labelFr, 'Inactif');
    assert.match(mapBlockStatusToVisual('running').labelFr, /en cours/i);
    assert.match(mapBlockStatusToVisual('paused').labelFr, /pause/i);
    assert.match(mapBlockStatusToVisual('completed').labelFr, /termin/i);
    assert.match(mapBlockStatusToVisual('error').labelFr, /erreur/i);

    // Pause join : badge explicite
    const pauseVisual = mapBlockStatusToVisual('paused');
    assert.ok(
      /pause/i.test(pauseVisual.badge ?? pauseVisual.labelFr),
      'badge « En pause » attendu',
    );
    assert.ok(pauseVisual.cssClass.includes('pause'));

    // Erreur : surbrillance rouge
    const errVisual = mapBlockStatusToVisual('error');
    assert.ok(
      /error|erreur|danger|red/i.test(errVisual.cssClass) ||
        /rouge|red|#/i.test(errVisual.color ?? ''),
    );
    assert.ok(errVisual.highlight === true || /error/i.test(errVisual.cssClass));

    assert.equal(seenLabels.size, 5);
  });
});
