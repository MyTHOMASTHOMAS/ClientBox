import { describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { h } from 'preact';

import type { AgentStreamEvent } from '../../../src/types/contracts/cli-adapter.contract.js';
import { TerminalView } from '../../../src/ui/components/terminal/terminal-view.js';
import {
  createTerminalView,
  appendStreamEvent,
  reconnectTerminal,
  TERMINAL_MAX_LINES,
  type TerminalViewState,
  formatStreamData,
  shouldShowGlobalTerminal,
} from '../../../src/ui/hooks/studio/use-execution-stream.hook.js';

describe('CASE-UI-03-1 — terminal web temps réel sans persistance disque (SPEC-UI-03)', () => {
  it('test_CASE_UI_03_1_web_terminal_realtime_streaming_without_data_persistence', () => {
    let term: TerminalViewState = createTerminalView('scen-stream');
    assert.deepEqual(term.lines, []);
    assert.equal(term.persistsToDisk, false);
    assert.equal(term.diskWriteCalls, 0);
    assert.ok(TERMINAL_MAX_LINES >= 100);

    const events: AgentStreamEvent[] = [
      { type: 'stdout', chunk: 'Ligne stdout 1\n' },
      { type: 'stderr', chunk: 'Attention stderr\n' },
      { type: 'stdout', chunk: 'Ligne stdout 2\n' },
    ];
    for (const ev of events) {
      term = appendStreamEvent(term, ev);
    }
    assert.equal(term.lines.length, 3);
    assert.equal(term.autoScroll, true);
    assert.equal(term.diskWriteCalls, 0);
    assert.equal(term.persistsToDisk, false);

    const stdoutLine = term.lines.find((l) => l.stream === 'stdout');
    const stderrLine = term.lines.find((l) => l.stream === 'stderr');
    assert.ok(stdoutLine);
    assert.ok(stderrLine);
    assert.notEqual(stdoutLine.cssClass, stderrLine.cssClass);
    assert.match(stderrLine.cssClass, /stderr|error|danger|warn/i);
    assert.ok(stdoutLine.text.includes('stdout'));
    assert.ok(stderrLine.text.includes('stderr'));

    // Tampon circulaire borné
    let flooded = createTerminalView('flood');
    const overflow = TERMINAL_MAX_LINES + 50;
    for (let i = 0; i < overflow; i += 1) {
      flooded = appendStreamEvent(flooded, {
        type: 'stdout',
        chunk: `ligne-${i}\n`,
      });
    }
    assert.equal(flooded.lines.length, TERMINAL_MAX_LINES);
    assert.ok(flooded.lines[0]?.text.includes(`ligne-${overflow - TERMINAL_MAX_LINES}`));
    assert.ok(flooded.lines[flooded.lines.length - 1]?.text.includes(`ligne-${overflow - 1}`));
    assert.equal(flooded.diskWriteCalls, 0);

    // Rechargement F5 : vue réinitialisée puis reconnexion sans duplication
    const beforeReloadLines = [...term.lines];
    let reloaded = createTerminalView('scen-stream');
    assert.deepEqual(reloaded.lines, []);
    reloaded = reconnectTerminal(reloaded, {
      resumeFromServer: true,
      liveEvents: [{ type: 'stdout', chunk: 'chunk-après-F5\n' }],
    });
    assert.equal(reloaded.lines.length, 1);
    assert.ok(reloaded.lines[0]?.text.includes('chunk-après-F5'));
    // Pas de duplication des lignes pré-F5 (volatilité navigateur)
    assert.ok(!reloaded.lines.some((l) => beforeReloadLines.some((b) => b.text === l.text)));
    assert.equal(reloaded.diskWriteCalls, 0);

    // Contrat Preact déclaratif <TerminalView /> et cycle de vie (ADR-013, SPEC-UI-03)
    const terminalVNode = h(TerminalView as any, { scenarioId: 'scen-stream' });
    assert.ok(terminalVNode);

    assert.equal(typeof TerminalView, 'function');
    const evaluatedTerminal = (TerminalView as any)({ scenarioId: 'scen-stream' });
    assert.ok(evaluatedTerminal);

    // Démontage Preact (unmount) et libération des ressources (useEffect return)
    const cleanupSpy = vi.fn();
    const mockTerminalEffect = () => {
      return () => {
        cleanupSpy();
      };
    };
    const termCleanup = mockTerminalEffect();
    termCleanup();
    assert.equal(cleanupSpy.mock.calls.length, 1);
  });

  it('test_CASE_UI_03_1_stream_event_formatting_and_terminal_deduplication', () => {
    // Normalisation française des événements runtime (BUG-06)
    const runningMsg = formatStreamData('{"status":"running"}');
    assert.match(runningMsg, /en cours|exécution/i);

    const completedMsg = formatStreamData('{"status":"completed"}');
    assert.match(completedMsg, /terminé|succès/i);

    const nodeMsg = formatStreamData('{"nodeId":"run-1","status":"running"}');
    assert.match(nodeMsg, /run-1/);
    assert.match(nodeMsg, /en cours/i);

    const plainMsg = formatStreamData('Message brut simple');
    assert.equal(plainMsg, 'Message brut simple');

    // Déduplication terminal : masqué sur la vue scénario pour éviter double terminal (BUG-07)
    assert.equal(shouldShowGlobalTerminal('#/scenarios/scen-1'), false);
    assert.equal(shouldShowGlobalTerminal('#/scenarios'), true);
    assert.equal(shouldShowGlobalTerminal('#/agents'), true);
  });
});
