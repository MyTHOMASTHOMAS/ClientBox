import { describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { h } from 'preact';

import type { RunnerStatus } from '../../../src/types/messages/block-status.message.js';
import {
  STOP_BUTTON_LABEL,
  isStopEnabled,
  triggerEmergencyStop,
} from '../../../src/ui/components/terminal/terminal-controls.js';
import type { HttpClient } from '../../../src/ui/api/http.client.js';

function createMockHttp(overrides: Partial<HttpClient> = {}): {
  http: HttpClient;
  posts: Array<{ url: string; body: unknown }>;
  dels: string[];
  clears: string[];
} {
  const posts: Array<{ url: string; body: unknown }> = [];
  const dels: string[] = [];
  const clears: string[] = [];
  const http: HttpClient = {
    get: async () => {
      throw new Error('get non attendu');
    },
    put: async () => {
      throw new Error('put non attendu');
    },
    post: vi.fn(async (url: string, body?: unknown) => {
      posts.push({ url, body });
      if (url.includes('/clear')) clears.push(url);
      return { ok: true };
    }) as HttpClient['post'],
    del: vi.fn(async (url: string) => {
      dels.push(url);
      return { ok: true };
    }) as HttpClient['del'],
    connectSse: () => ({ close() {} }),
    ...overrides,
  };
  return { http, posts, dels, clears };
}

function assertFrenchUi(message: string): void {
  assert.ok(message.length > 0);
  assert.match(
    message,
    /[àâäéèêëïîôùûüçœæ]|arrêt|interrompu|contexte|effacé|réinitialis|succès|erreur|veuillez|confirm/i,
  );
  assert.ok(!/\b(Submit|Cancel|Error|Delete|Save|Loading)\b/.test(message));
}

describe("CASE-UI-03-2 — bouton Stop d'urgence actif en états Run et Pause (SPEC-UI-03)", () => {
  it('test_CASE_UI_03_2_emergency_stop_button_action_in_run_and_pause_states', async () => {
    assert.match(STOP_BUTTON_LABEL, /Stop|Arrêt/i);

    const running: RunnerStatus = 'running';
    const paused: RunnerStatus = 'paused';
    const idle: RunnerStatus = 'idle';
    assert.equal(isStopEnabled(running), true);
    assert.equal(isStopEnabled(paused), true);
    assert.equal(isStopEnabled(idle), false);
    assert.equal(isStopEnabled('completed'), false);
    assert.equal(isStopEnabled('stopped'), false);

    const { http, dels, clears, posts } = createMockHttp();

    const stopRun = await triggerEmergencyStop({
      scenarioId: 'scen-run',
      runnerStatus: 'running',
      http,
    });
    assert.equal(stopRun.ok, true);
    assert.equal(dels.length, 1);
    assert.match(dels[0]!, /\/api\/scenarios\/scen-run\/run$/);
    assert.equal(stopRun.runnerStatus, 'stopped');
    assert.ok(stopRun.confirmationMessage);
    assertFrenchUi(stopRun.confirmationMessage);
    assert.equal(clears.length, 0);
    assert.equal(posts.filter((p) => p.url.includes('/clear')).length, 0);

    const stopPause = await triggerEmergencyStop({
      scenarioId: 'scen-pause',
      runnerStatus: 'paused',
      http,
    });
    assert.equal(stopPause.ok, true);
    assert.equal(dels.length, 2);
    assert.match(dels[1]!, /\/api\/scenarios\/scen-pause\/run$/);
    assert.equal(stopPause.runnerStatus, 'stopped');
    assertFrenchUi(stopPause.confirmationMessage!);
    assert.equal(clears.length, 0);

    // Stop inactif hors run/pause
    const refused = await triggerEmergencyStop({
      scenarioId: 'scen-idle',
      runnerStatus: 'idle',
      http,
    });
    assert.equal(refused.ok, false);
    assert.equal(dels.length, 2);

    // Contrat Preact déclaratif pour le bouton d'arrêt d'urgence (data-action="stop-scenario", ADR-013)
    const activeStopVNode = h('button', {
      'data-action': 'stop-scenario',
      disabled: !isStopEnabled(running),
    }, STOP_BUTTON_LABEL);
    assert.ok(activeStopVNode);
    assert.equal(activeStopVNode.props['data-action'], 'stop-scenario');
    assert.equal(activeStopVNode.props.disabled, false);

    const disabledStopVNode = h('button', {
      'data-action': 'stop-scenario',
      disabled: !isStopEnabled(idle),
    }, STOP_BUTTON_LABEL);
    assert.equal(disabledStopVNode.props.disabled, true);
  });
});
