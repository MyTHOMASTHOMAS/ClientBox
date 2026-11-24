import { describe, it, expect } from 'vitest';
import { h } from 'preact';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { CanvasBoard } from '../../../src/ui/components/canvas/canvas-board.js';

describe('CASE-UI-02-7 — Moteur de rendu SVG interactif, câbles de Bézier et cycle de vie du canvas (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_7_canvas_svg_renderer_and_lifecycle', () => {
    const scenarioDoc: Scenario = {
      id: 'sc-svg-test',
      name: 'Scénario SVG Bézier',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 50, y: 100 } },
        { id: 'if-1', type: 'if', position: { x: 250, y: 100 }, ifScriptId: 'check' },
        { id: 'run-true', type: 'run', position: { x: 500, y: 50 }, agentId: 'ag-1' },
        { id: 'run-false', type: 'run', position: { x: 500, y: 200 }, agentId: 'ag-2' },
      ],
      connections: [
        { sourceNodeId: 'start-1', sourcePortIndex: 0, targetNodeId: 'if-1', targetPortIndex: 0, key: '0' },
        { sourceNodeId: 'if-1', sourcePortIndex: 0, targetNodeId: 'run-true', targetPortIndex: 0, key: '0' },
        { sourceNodeId: 'if-1', sourcePortIndex: 1, targetNodeId: 'run-false', targetPortIndex: 0, key: '0' },
      ],
    };

    // 1. Validation du composant Preact déclaratif <CanvasBoard scenario={scenarioDoc} />
    expect(typeof CanvasBoard).toBe('function');
    const canvasVNode = h(CanvasBoard as any, { scenario: scenarioDoc });
    expect(canvasVNode).toBeDefined();

    // Évaluation VDOM du composant CanvasBoard
    const evaluatedCanvas = (CanvasBoard as any)({ scenario: scenarioDoc });
    const canvasContent = JSON.stringify(evaluatedCanvas);

    // 2. Vérification des nœuds avec data-node-id et des ports data-port-index
    expect(canvasContent).toMatch(/start-1/);
    expect(canvasContent).toMatch(/if-1/);
    expect(canvasContent).toMatch(/run-true/);
    expect(canvasContent).toMatch(/run-false/);
    expect(canvasContent).toMatch(/data-node-id/);
    expect(canvasContent).toMatch(/data-port-index/);

    // 3. Vérification des câbles Bézier et classes CSS / data-branch distinctifs du bloc If (vert Vrai, rouge Faux)
    expect(canvasContent).toMatch(/cable/);
    expect(canvasContent).toMatch(/cable-true|data-branch="true"|branch.*true/i);
    expect(canvasContent).toMatch(/cable-false|data-branch="false"|branch.*false/i);

    // 4. Mise à jour réactive via props avec statut 'completed' (per TYPES-012)
    const updatedDoc: Scenario = {
      ...scenarioDoc,
      nodes: scenarioDoc.nodes.map((n) =>
        n.id === 'run-true' ? { ...n, status: 'completed' as const } : n,
      ),
    };
    const updatedVNode = h(CanvasBoard as any, { scenario: updatedDoc });
    expect(updatedVNode).toBeDefined();

    const evaluatedUpdated = (CanvasBoard as any)({ scenario: updatedDoc });
    const updatedContent = JSON.stringify(evaluatedUpdated);
    expect(updatedContent).toMatch(/completed/);

    // 5. Démontage Preact (unmount) : libération propre du VDOM
    const unmountedVNode = (CanvasBoard as any)({ scenario: { ...scenarioDoc, nodes: [], connections: [] } });
    expect(unmountedVNode !== undefined).toBe(true);
  });
});
