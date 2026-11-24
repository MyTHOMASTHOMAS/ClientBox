import { describe, it, expect, vi } from 'vitest';
import { h } from 'preact';

import type { Scenario } from '../../../src/types/models/scenario.model.js';
import {
  createCanvasDocument,
  addBlock,
  removeBlock,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import { InspectorPanel } from '../../../src/ui/components/canvas/inspector-panel.js';
import { ScenarioStudioPage } from '../../../src/ui/pages/scenario-studio-page.js';

describe('CASE-UI-02-17 — Suppression interactive d’un bloc sélectionné (SPEC-UI-02 / AC-UI-02-10)', () => {
  it('test_CASE_UI_02_17_node_deletion_inspector_and_keyboard', () => {
    const sampleScenario: Scenario = {
      id: 'sc-test-delete',
      name: 'Scénario Test Suppression',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 40, y: 80 } },
        { id: 'run-1', type: 'run', position: { x: 300, y: 80 }, agentId: 'ag-1', promptId: 'pr-1' },
        { id: 'if-1', type: 'if', position: { x: 600, y: 80 }, ifScriptId: 'check' },
      ],
      connections: [
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'run-1',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'run-1',
          sourcePortIndex: 0,
          targetNodeId: 'if-1',
          targetPortIndex: 0,
          key: '0',
        },
        {
          sourceNodeId: 'start-1',
          sourcePortIndex: 0,
          targetNodeId: 'if-1',
          targetPortIndex: 1,
          key: '1',
        },
      ],
    };

    const onDeleteNode = vi.fn();
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    // 1. Bouton "Supprimer ce bloc" dans InspectorPanel
    const renderedInspector = (InspectorPanel as any)({
      scenario: sampleScenario,
      selectedNodeId: 'run-1',
      isReadOnly: false,
      onUpdate,
      onClose,
      onDeleteNode,
    });
    const inspectorJson = JSON.stringify(renderedInspector);
    expect(inspectorJson).toMatch(/data-action":"delete-node"/);
    expect(inspectorJson).toMatch(/Supprimer ce bloc/i);

    // Fonction d'extraction récursive d'un VNode par attribut data-action
    function findVNodeByAction(vnode: any, action: string): any {
      if (!vnode || typeof vnode !== 'object') return null;
      if (vnode.props?.['data-action'] === action) return vnode;
      const children = Array.isArray(vnode.props?.children)
        ? vnode.props.children
        : vnode.props?.children
          ? [vnode.props.children]
          : [];
      for (const child of children) {
        const found = findVNodeByAction(child, action);
        if (found) return found;
      }
      return null;
    }

    const deleteBtnVNode = findVNodeByAction(renderedInspector, 'delete-node');
    expect(deleteBtnVNode).toBeDefined();
    expect(deleteBtnVNode).not.toBeNull();
    expect(deleteBtnVNode.props?.disabled).toBeFalsy();

    // 2. Déclenchement du callback onDeleteNode au clic
    deleteBtnVNode.props.onClick();
    expect(onDeleteNode).toHaveBeenCalledWith('run-1');

    // 3. Verrouillage du bouton en mode lecture seule (isReadOnly=true)
    const readOnlyInspector = (InspectorPanel as any)({
      scenario: sampleScenario,
      selectedNodeId: 'run-1',
      isReadOnly: true,
      onUpdate,
      onClose,
      onDeleteNode,
    });
    const readOnlyBtn = findVNodeByAction(readOnlyInspector, 'delete-node');
    expect(readOnlyBtn).toBeDefined();
    expect(readOnlyBtn.props.disabled).toBe(true);

    // 4. Suppression en cascade des nœuds et des câbles reliés via removeBlock
    let doc = createCanvasDocument('sc-test-delete');
    doc = {
      ...doc,
      nodes: [...sampleScenario.nodes],
      connections: [...sampleScenario.connections],
    };

    expect(doc.nodes.length).toBe(3);
    expect(doc.connections.length).toBe(3);

    // Retrait de 'run-1'
    const docAfterRunDelete = removeBlock(doc, 'run-1');
    expect(docAfterRunDelete.nodes.find((n) => n.id === 'run-1')).toBeUndefined();
    expect(docAfterRunDelete.nodes.length).toBe(2);

    // Les 2 câbles connectés à 'run-1' doivent avoir disparu
    expect(
      docAfterRunDelete.connections.some(
        (c) => c.sourceNodeId === 'run-1' || c.targetNodeId === 'run-1',
      ),
    ).toBe(false);
    // Seul le câble direct start-1 -> if-1 doit subsister
    expect(docAfterRunDelete.connections.length).toBe(1);
    expect(docAfterRunDelete.connections[0]!.sourceNodeId).toBe('start-1');
    expect(docAfterRunDelete.connections[0]!.targetNodeId).toBe('if-1');

    // 5. Réautorisation de l'insertion de Start après suppression de Start
    const docWithStart = removeBlock(doc, 'run-1');
    const cannotAddStart = addBlock(docWithStart, 'start', { x: 10, y: 10 });
    expect(cannotAddStart.ok).toBe(false);

    const docWithoutStart = removeBlock(docWithStart, 'start-1');
    expect(docWithoutStart.nodes.some((n) => n.type === 'start')).toBe(false);

    const canAddStartNow = addBlock(docWithoutStart, 'start', { x: 10, y: 10 });
    expect(canAddStartNow.ok).toBe(true);
    expect(canAddStartNow.document.nodes.some((n) => n.type === 'start')).toBe(true);

    // 6. Intégration dans ScenarioStudioPage (onDeleteNode câblé à l'InspectorPanel)
    const studioElement = (ScenarioStudioPage as any)({ scenarioId: 'sc-test-delete' });
    expect(studioElement).toBeDefined();

    function findVNodeByType(vnode: any, targetType: any): any {
      if (!vnode || typeof vnode !== 'object') return null;
      if (vnode.type === targetType) return vnode;
      const children = Array.isArray(vnode.props?.children)
        ? vnode.props.children
        : vnode.props?.children
          ? [vnode.props.children]
          : [];
      for (const child of children) {
        const found = findVNodeByType(child, targetType);
        if (found) return found;
      }
      return null;
    }

    const inspectorInStudio = findVNodeByType(studioElement, InspectorPanel);
    expect(inspectorInStudio).toBeDefined();
    expect(inspectorInStudio).not.toBeNull();
    expect(typeof inspectorInStudio.props?.onDeleteNode).toBe('function');
  });
});

