import { describe, it, expect, vi } from 'vitest';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import type { NodeType } from '../../../src/types/models/node.model.js';
import {
  createCanvasDocument,
  addBlock,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import {
  getInspectorFieldsForType,
  applyInspectorParams,
  InspectorPanel,
} from '../../../src/ui/components/canvas/inspector-panel.js';
import { CanvasToolbar } from '../../../src/ui/components/canvas/canvas-toolbar.js';

describe('CASE-UI-02-18 — CallScenario toolbar + dropdown targetScenarioId (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_18_call_scenario_toolbar_and_target_dropdown', () => {
    const toolbar = (CanvasToolbar as any)({
      scenarioName: 'parent',
      onAddNode: vi.fn(),
      hasStartNode: true,
    });
    const toolbarJson = JSON.stringify(toolbar);
    expect(toolbarJson).toMatch(/data-action":"add-call-scenario"/);

    const doc = createCanvasDocument('parent', {
      id: 'parent',
      name: 'Parent',
      nodes: [{ id: 'start-1', type: 'start', position: { x: 0, y: 0 } }],
      connections: [],
    });

    const added = addBlock(doc, 'callScenario' as NodeType, { x: 40, y: 80 });
    expect(added.ok).toBe(true);
    const callNode = added.document.nodes.find((n) => n.type === ('callScenario' as NodeType));
    expect(callNode).toBeTruthy();

    const fields = getInspectorFieldsForType('callScenario' as NodeType);
    expect(fields).toContain('targetScenarioId');
    expect(fields).not.toContain('agentId');
    expect(fields).not.toContain('promptId');

    const scenario: Scenario = {
      id: 'parent',
      name: 'Parent',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'callScenario-1',
          type: 'callScenario',
          position: { x: 40, y: 80 },
        } as Scenario['nodes'][number],
      ],
      connections: [],
    };

    const onUpdate = vi.fn();
    const rendered = (InspectorPanel as any)({
      scenario,
      selectedNodeId: 'callScenario-1',
      isReadOnly: false,
      onUpdate,
      scenarioOptions: [
        { id: 'parent', label: 'parent' },
        { id: 'enfant-a', label: 'enfant-a' },
        { id: 'enfant-b', label: 'enfant-b' },
      ],
      currentScenarioId: 'parent',
    });
    const json = JSON.stringify(rendered);
    // Dropdown : options enfants + scénario courant inclus (auto-appel)
    expect(json).toMatch(/enfant-a/);
    expect(json).toMatch(/enfant-b/);
    expect(json).toMatch(/data-scenario-option":"parent"/);

    const updated = applyInspectorParams(scenario.nodes[1]!, {
      targetScenarioId: 'enfant-a',
    } as never);
    expect((updated as { targetScenarioId?: string }).targetScenarioId).toBe('enfant-a');
  });
});


