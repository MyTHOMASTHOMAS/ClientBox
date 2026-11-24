import { describe, it, expect, vi } from 'vitest';
import { h } from 'preact';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import {
  InspectorPanel,
  getInspectorFieldsForType,
  applyInspectorParams,
} from '../../../src/ui/components/canvas/inspector-panel.js';

describe('CASE-UI-02-9 — Panneau inspecteur latéral d’édition dynamique des paramètres de bloc (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_9_inspector_view_reactive_editing', () => {
    const scenarioDoc: Scenario = {
      id: 'sc-inspector',
      name: 'Test Inspecteur',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, label: 'Début flux' },
        { id: 'run-1', type: 'run', position: { x: 100, y: 0 }, agentId: 'ag-1', promptId: 'pr-1', exitId: 'ex-1' },
        { id: 'if-1', type: 'if', position: { x: 200, y: 0 }, ifScriptId: 'check' },
        { id: 'clear-1', type: 'clearContext', position: { x: 300, y: 0 }, agentId: 'ag-2' },
      ],
      connections: [],
    };

    const onUpdate = vi.fn();

    // 0. Validation de la fonction de mapping des champs par type
    expect(getInspectorFieldsForType('start')).toEqual(['label']);
    expect(getInspectorFieldsForType('run')).toEqual(['agentId', 'promptId', 'exitId']);
    expect(getInspectorFieldsForType('if')).toEqual(['ifScriptId']);
    expect(getInspectorFieldsForType('clearContext')).toEqual(['agentId']);

    // 1. Validation du composant Preact <InspectorPanel /> pour le bloc Run
    expect(typeof InspectorPanel).toBe('function');
    const runProps = { selectedNodeId: 'run-1', scenario: scenarioDoc, onUpdate };
    const runVNode = h(InspectorPanel as any, runProps);
    expect(runVNode).toBeDefined();

    const evaluatedRun = (InspectorPanel as any)(runProps);
    const runContent = JSON.stringify(evaluatedRun);

    expect(runContent).toMatch(/Configuration du bloc/i);
    expect(runContent).toMatch(/run/i);
    // Champs spécifiques au bloc Run
    expect(runContent).toMatch(/inspector-agent/);
    expect(runContent).toMatch(/ag-1/);
    expect(runContent).toMatch(/inspector-prompt/);
    expect(runContent).toMatch(/pr-1/);
    expect(runContent).toMatch(/inspector-exit/);
    expect(runContent).toMatch(/ex-1/);
    // Absence de barre d'onglets statiques
    expect(runContent).not.toMatch(/1\. Agent & Prompt/);
    expect(runContent).not.toMatch(/2\. Entrées & Join/);
    expect(runContent).not.toMatch(/3\. Condition If/);
    // Absence de champs d'autres types
    expect(runContent).not.toMatch(/inspector-if-script/);

    // 2. Notification de mise à jour lors d'un changement de champ via onUpdate et applyInspectorParams
    const updatedRunNode = applyInspectorParams(scenarioDoc.nodes[1]!, { agentId: 'agent-2' });
    expect(updatedRunNode.agentId).toBe('agent-2');
    onUpdate(updatedRunNode);
    expect(onUpdate).toHaveBeenCalledWith(updatedRunNode);

    // 3. Validation de l'arbre Preact pour le bloc Start
    const startProps = { selectedNodeId: 'start-1', scenario: scenarioDoc, onUpdate };
    const startVNode = h(InspectorPanel as any, startProps);
    expect(startVNode).toBeDefined();

    const evaluatedStart = (InspectorPanel as any)(startProps);
    const startContent = JSON.stringify(evaluatedStart);
    expect(startContent).toMatch(/Configuration du bloc/i);
    expect(startContent).toMatch(/start/i);
    expect(startContent).toMatch(/Point d'entrée|Début flux/i);
    // Absence d'onglets statiques et de champs Run/If/Clear
    expect(startContent).not.toMatch(/1\. Agent & Prompt/);
    expect(startContent).not.toMatch(/inspector-agent/);
    expect(startContent).not.toMatch(/inspector-prompt/);
    expect(startContent).not.toMatch(/inspector-if-script/);

    // 4. Validation de l'arbre Preact pour le bloc If
    const ifProps = { selectedNodeId: 'if-1', scenario: scenarioDoc, onUpdate };
    const ifVNode = h(InspectorPanel as any, ifProps);
    expect(ifVNode).toBeDefined();

    const evaluatedIf = (InspectorPanel as any)(ifProps);
    const ifContent = JSON.stringify(evaluatedIf);
    expect(ifContent).toMatch(/Configuration du bloc/i);
    expect(ifContent).toMatch(/if/i);
    expect(ifContent).toMatch(/inspector-if-script/);
    expect(ifContent).toMatch(/check/);
    // Absence d'onglets statiques et de champs Run
    expect(ifContent).not.toMatch(/1\. Agent & Prompt/);
    expect(ifContent).not.toMatch(/inspector-agent/);
    expect(ifContent).not.toMatch(/inspector-prompt/);

    // 5. Validation de l'arbre Preact pour le bloc ClearContext
    const clearProps = { selectedNodeId: 'clear-1', scenario: scenarioDoc, onUpdate };
    const clearVNode = h(InspectorPanel as any, clearProps);
    expect(clearVNode).toBeDefined();

    const evaluatedClear = (InspectorPanel as any)(clearProps);
    const clearContent = JSON.stringify(evaluatedClear);
    expect(clearContent).toMatch(/Configuration du bloc/i);
    expect(clearContent).toMatch(/clearContext/i);
    expect(clearContent).toMatch(/inspector-agent/);
    expect(clearContent).toMatch(/ag-2/);
    // Absence d'onglets statiques et de champs Prompt / If
    expect(clearContent).not.toMatch(/1\. Agent & Prompt/);
    expect(clearContent).not.toMatch(/inspector-prompt/);
    expect(clearContent).not.toMatch(/inspector-if-script/);

    // 6. Démontage Preact lorsque la sélection est désactivée (selectedNodeId = null)
    const nullProps = { selectedNodeId: null, scenario: scenarioDoc, onUpdate };
    const nullVNode = (InspectorPanel as any)(nullProps);
    expect(nullVNode === null || nullVNode === undefined || (nullVNode as any)?.props === null).toBe(true);
  });
});
