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

describe('CASE-UI-02-19 — Command toolbar + inspector commandLine (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_19_command_block_toolbar_add_and_inspector_command_line', () => {
    // 1. Bouton d'ajout dans la toolbar
    const toolbar = (CanvasToolbar as any)({
      scenarioName: 'parent',
      onAddNode: vi.fn(),
      hasStartNode: true,
    });
    const toolbarJson = JSON.stringify(toolbar);
    expect(toolbarJson).toMatch(/data-action":"add-command"/);

    // 2. Ajout du bloc dans le canvas state hook
    const doc = createCanvasDocument('parent', {
      id: 'parent',
      name: 'Parent',
      nodes: [{ id: 'start-1', type: 'start', position: { x: 0, y: 0 } }],
      connections: [],
    });

    const added = addBlock(doc, 'command' as NodeType, { x: 40, y: 80 });
    expect(added.ok).toBe(true);
    const cmdNode = added.document.nodes.find((n) => n.type === ('command' as NodeType));
    expect(cmdNode).toBeTruthy();

    // 3. Champs inspecteur autorisés et proscrits pour le type command
    const fields = getInspectorFieldsForType('command' as NodeType);
    expect(fields).toContain('commandLine');
    expect(fields).not.toContain('agentId');
    expect(fields).not.toContain('promptId');
    expect(fields).not.toContain('exitId');
    expect(fields).not.toContain('targetScenarioId');

    // 4. Rendu de l'inspecteur pour un bloc Command
    const scenario: Scenario = {
      id: 'parent',
      name: 'Parent',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 } },
        {
          id: 'cmd-1',
          type: 'command' as any,
          position: { x: 40, y: 80 },
          commandLine: 'echo test',
        } as Scenario['nodes'][number],
      ],
      connections: [],
    };

    const onUpdate = vi.fn();
    const rendered = (InspectorPanel as any)({
      scenario,
      selectedNodeId: 'cmd-1',
      isReadOnly: false,
      onUpdate,
    });
    const json = JSON.stringify(rendered);
    expect(json).toMatch(/commandLine/i);
    expect(json).not.toMatch(/Sélectionner un agent/i);
    expect(json).not.toMatch(/Sélectionner un prompt/i);

    // 5. Mise à jour des paramètres du bloc Command (avec préservation des espaces en cours de frappe)
    const withTrailingSpace = applyInspectorParams(scenario.nodes[1]!, {
      commandLine: 'npm run ',
    } as never);
    expect((withTrailingSpace as { commandLine?: string }).commandLine).toBe('npm run ');

    const updated = applyInspectorParams(scenario.nodes[1]!, {
      commandLine: 'npm run build',
    } as never);
    expect((updated as { commandLine?: string }).commandLine).toBe('npm run build');
  });
});
