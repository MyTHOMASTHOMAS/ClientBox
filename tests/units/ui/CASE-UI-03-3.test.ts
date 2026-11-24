import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import * as terminalControls from '../../../src/ui/components/terminal/terminal-controls.js';
import { CanvasToolbar } from '../../../src/ui/components/canvas/canvas-toolbar.js';
import { AgentsPage } from '../../../src/ui/pages/agents-page.js';

const FORBIDDEN_ACTION = /"data-action":"clear-context"/;
const FORBIDDEN_LABEL = /Effacer le contexte/;

function assertNoManualClear(rendered: unknown, where: string): void {
  const json = JSON.stringify(rendered);
  assert.doesNotMatch(json, FORBIDDEN_ACTION, `${where} : bouton clear-context interdit`);
  assert.doesNotMatch(json, FORBIDDEN_LABEL, `${where} : libellé « Effacer le contexte » interdit`);
}

describe('CASE-UI-03-3 — absence de bouton de reset manuel du contexte (SPEC-UI-03)', () => {
  it('test_CASE_UI_03_3_no_manual_clear_context_button', () => {
    // Vue Agents
    const agents = [{ id: 'agent-architect', name: 'Architecte', profilId: 'p-1', cliId: 'cursor-cli' }];
    const agentsPage = (AgentsPage as any)({ agents });
    assert.match(JSON.stringify(agentsPage), /Architecte/);
    assertNoManualClear(agentsPage, 'AgentsPage');

    // Barre d'outils du canvas : ajout de bloc ClearContext conservé, reset manuel absent
    const toolbar = (CanvasToolbar as any)({
      scenarioName: 'Scénario Démo',
      isRunning: false,
      hasStartNode: true,
      onAddNode: () => undefined,
      onLaunch: () => undefined,
      onStop: () => undefined,
      onSave: () => undefined,
    });
    assertNoManualClear(toolbar, 'CanvasToolbar');
    assert.match(JSON.stringify(toolbar), /"data-action":"add-clear-context"/);

    // Contrôles du terminal
    const controls = (terminalControls.TerminalControls as any)({ runnerStatus: 'running' });
    assertNoManualClear(controls, 'TerminalControls');

    // Plus aucune API UI de reset manuel exportée
    for (const name of ['ContextResetButton', 'requestClearContext', 'CLEAR_CONTEXT_BUTTON_LABEL']) {
      assert.equal(name in terminalControls, false, `export ${name} interdit`);
    }
  });
});
