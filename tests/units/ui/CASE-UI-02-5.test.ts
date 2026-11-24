import { describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';

import {
  createCanvasDocument,
  addBlock,
  wireOriented,
  tryLaunchScenario,
  LAUNCH_BUTTON_LABEL,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import type { HttpClient } from '../../../src/ui/api/http.client.js';

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

describe('CASE-UI-02-5 — contrôle de lancement du scénario transmis au moteur (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_5_canvas_scenario_launch_control_transmitting_to_engine', async () => {
    assert.equal(LAUNCH_BUTTON_LABEL, 'Lancer le scénario');
    assert.match(LAUNCH_BUTTON_LABEL, /Lancer|scénario/i);
    assert.ok(!/\b(Run|Submit|Start)\b/.test(LAUNCH_BUTTON_LABEL));

    let doc = createCanvasDocument('flux-1');
    const s = addBlock(doc, 'start', { x: 0, y: 0 });
    assert.equal(s.ok, true);
    doc = s.document;
    const r = addBlock(doc, 'run', { x: 200, y: 0 });
    assert.equal(r.ok, true);
    doc = r.document;
    const w = wireOriented(doc, {
      sourceNodeId: 'start-1',
      sourcePortIndex: 0,
      targetNodeId: 'run-1',
      targetPortIndex: 0,
    });
    assert.equal(w.ok, true);
    doc = w.document;

    const postCalls: Array<{ url: string; body: unknown }> = [];
    const http: HttpClient = {
      get: async () => {
        throw new Error('get non attendu');
      },
      put: async () => {
        throw new Error('put non attendu');
      },
      del: async () => {
        throw new Error('del non attendu');
      },
      post: vi.fn(async (url: string, body?: unknown) => {
        postCalls.push({ url, body });
        return { ok: true };
      }) as HttpClient['post'],
      connectSse: () => ({ close() {} }),
    };

    const launched = await tryLaunchScenario(doc, http);
    assert.equal(launched.ok, true);
    assert.equal(postCalls.length, 1);
    assert.match(postCalls[0]!.url, /\/api\/scenarios\/flux-1\/run$/);
    assert.equal(launched.launchButtonDisabled, true);
    assert.equal(launched.startNodeStatus, 'running');

    // Anti double-clic : second lancement refusé tant que running
    const again = await tryLaunchScenario({ ...doc, runnerStatus: 'running' }, http);
    assert.equal(again.ok, false);
    assert.equal(postCalls.length, 1);

    // Scénario sans Start → refus FR
    const empty = createCanvasDocument('vide');
    const refused = await tryLaunchScenario(empty, http);
    assert.equal(refused.ok, false);
    assert.ok(refused.error);
    assertFrenchWarning(refused.error);
  });
});
