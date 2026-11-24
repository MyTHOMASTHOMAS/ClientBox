import { describe, it, expect, vi } from 'vitest';
import { h } from 'preact';
import { CanvasCable } from '../../../src/ui/components/canvas/canvas-cable.js';
import { CanvasBoard } from '../../../src/ui/components/canvas/canvas-board.js';
import {
  createCanvasDocument,
  removeConnection,
} from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';

const sampleConnection = {
  sourceNodeId: 'start-1',
  sourcePortIndex: 0,
  targetNodeId: 'run-1',
  targetPortIndex: 0,
  key: '0',
};

const sampleScenario: Scenario = {
  id: 'sc-delete-cable',
  name: 'Suppression câble',
  nodes: [
    { id: 'start-1', type: 'start', position: { x: 40, y: 80 } },
    { id: 'run-1', type: 'run', position: { x: 320, y: 80 }, agentId: 'a1', promptId: 'p1' },
    { id: 'run-2', type: 'run', position: { x: 320, y: 220 }, agentId: 'a2', promptId: 'p2' },
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
      sourceNodeId: 'start-1',
      sourcePortIndex: 0,
      targetNodeId: 'run-2',
      targetPortIndex: 0,
      key: '1',
    },
  ],
};

describe('CASE-UI-02-14 — Suppression interactive d’un câble en deux clics (SPEC-UI-02 / AC-UI-02-7)', () => {
  it('test_CASE_UI_02_14_cable_two_click_delete', () => {
    const onDelete = vi.fn();
    const onClick = vi.fn();

    // 1er clic : câble sélectionné → option Supprimer visible
    const selectedCable = (CanvasCable as any)({
      connection: sampleConnection,
      sourcePos: { x: 0, y: 0 },
      targetPos: { x: 100, y: 0 },
      isSelected: true,
      onClick,
      onDelete,
    });
    const selectedContent = JSON.stringify(selectedCable);
    expect(selectedContent).toMatch(/data-action":"delete-connection"/);
    expect(selectedContent).toMatch(/Supprimer/);

    // Câble non sélectionné → pas d'option
    const idleCable = (CanvasCable as any)({
      connection: sampleConnection,
      sourcePos: { x: 0, y: 0 },
      targetPos: { x: 100, y: 0 },
      isSelected: false,
      onClick,
      onDelete,
    });
    expect(JSON.stringify(idleCable)).not.toMatch(/delete-connection/);

    // Board : le câble d'index sélectionné reçoit isSelected et onDelete (VDOM imbriqué)
    expect(typeof CanvasBoard).toBe('function');
    const onSelectConnection = vi.fn();
    const onDeleteConnection = vi.fn();
    const onClearConnectionSelection = vi.fn();

    function collectCableProps(
      node: unknown,
      out: Array<Record<string, unknown>> = [],
      seen = new Set<unknown>(),
    ) {
      if (!node || typeof node !== 'object' || seen.has(node)) return out;
      seen.add(node);
      const props = (node as { props?: Record<string, unknown> }).props;
      if (props?.connection && props?.sourcePos) out.push(props);
      for (const value of Object.values(node as Record<string, unknown>)) {
        if (Array.isArray(value)) value.forEach((child) => collectCableProps(child, out, seen));
        else collectCableProps(value, out, seen);
      }
      return out;
    }

    const boardSelected = (CanvasBoard as any)({
      scenario: sampleScenario,
      selectedConnectionIndex: 0,
      onSelectConnection,
      onDeleteConnection,
      onClearConnectionSelection,
    });
    const selectedCables = collectCableProps(boardSelected);
    expect(selectedCables.length).toBe(2);
    expect(selectedCables[0]?.isSelected).toBe(true);
    expect(selectedCables[1]?.isSelected).toBe(false);
    const expandedSelected = (CanvasCable as any)(selectedCables[0]!);
    expect(JSON.stringify(expandedSelected)).toMatch(/delete-connection/);
    expect(JSON.stringify(expandedSelected)).toMatch(/Supprimer/);
    expect(typeof selectedCables[0]?.onClick).toBe('function');
    expect(typeof selectedCables[0]?.onDelete).toBe('function');
    (selectedCables[0]!.onClick as () => void)();
    expect(onSelectConnection).toHaveBeenCalledWith(0);
    (selectedCables[0]!.onDelete as () => void)();
    expect(onDeleteConnection).toHaveBeenCalledWith(0);

    const boardIdle = (CanvasBoard as any)({
      scenario: sampleScenario,
      selectedConnectionIndex: null,
      onSelectConnection,
      onDeleteConnection,
      onClearConnectionSelection,
    });
    const idleCables = collectCableProps(boardIdle);
    expect(idleCables.every((c) => c.isSelected !== true)).toBe(true);
    expect(JSON.stringify((CanvasCable as any)(idleCables[0]!))).not.toMatch(/delete-connection/);

    expect(
      h(CanvasBoard as any, {
        scenario: sampleScenario,
        selectedConnectionIndex: 1,
        onSelectConnection,
        onDeleteConnection,
        onClearConnectionSelection,
      }),
    ).toBeDefined();

    // Mutation modèle : removeConnection retire la liaison
    const doc = createCanvasDocument('sc-delete-cable', sampleScenario);
    expect(doc.connections).toHaveLength(2);
    const after = removeConnection(doc, 0);
    expect(after.connections).toHaveLength(1);
    expect(after.connections[0]?.targetNodeId).toBe('run-2');
    expect(after.connections[0]?.key).toBe('0');
  });
});
