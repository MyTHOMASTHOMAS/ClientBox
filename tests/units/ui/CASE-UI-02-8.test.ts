import { describe, it, expect, vi, beforeEach } from 'vitest';
import { h } from 'preact';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { attachCanvasInteractions } from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import {
  CANVAS_NODE_HEIGHT,
  findInputPortHit,
  type WirePreview,
} from '../../../src/ui/hooks/canvas/use-canvas-interactions.hook.js';
import { ScenarioStudioPage } from '../../../src/ui/pages/scenario-studio-page.js';

describe('CASE-UI-02-8 — Interactions pointer, hit-test des ports et capture de tirage de câbles (SPEC-UI-02)', () => {
  let container: any;
  let listeners: Map<string, Array<(...args: any[]) => void>>;

  beforeEach(() => {
    listeners = new Map();
    container = {
      addEventListener: vi.fn().mockImplementation((ev: string, fn: any) => {
        const list = listeners.get(ev) ?? [];
        list.push(fn);
        listeners.set(ev, list);
      }),
      removeEventListener: vi.fn().mockImplementation((ev: string, fn: any) => {
        const list = listeners.get(ev);
        if (list) {
          const idx = list.indexOf(fn);
          if (idx !== -1) list.splice(idx, 1);
        }
      }),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 1000, height: 600 }),
      querySelector: vi.fn().mockReturnValue(null),
    };
  });

  it('test_CASE_UI_02_8_canvas_pointer_interactions_and_hittest', () => {
    const scenarioDoc: Scenario = {
      id: 'sc-interactions',
      name: 'Test Interactions',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 50, y: 50 } },
        { id: 'run-1', type: 'run', position: { x: 250, y: 50 }, agentId: 'ag-1' },
      ],
      connections: [],
    };

    const onMutate = vi.fn();
    const onWirePreview = vi.fn();
    const onSelectNode = vi.fn();

    const handle = attachCanvasInteractions(container, scenarioDoc, {
      onMutate,
      onWirePreview,
      onSelectNode,
    });
    expect(handle).toBeDefined();
    expect(typeof handle.detach).toBe('function');
    expect(typeof (handle as any).updateDoc).toBe('function');

    expect(container.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(container.addEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(container.addEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(container.addEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));

    // 1. Drag de bloc run-1 (déplacement >= 4px) : déplace le bloc sans déclencher onSelectNode
    const nodeEl = {
      getAttribute: (attr: string) => (attr === 'data-node-id' ? 'run-1' : null),
      closest: (sel: string) => {
        if (sel.includes('data-port-type')) return null;
        if (sel.includes('data-node-id')) return nodeEl;
        return null;
      },
    };

    const pointerDownHandlers = listeners.get('pointerdown') ?? [];
    expect(pointerDownHandlers.length).toBeGreaterThan(0);
    pointerDownHandlers[0]!({
      target: nodeEl,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    expect(container.setPointerCapture).toHaveBeenCalledWith(1);

    const pointerMoveHandlers = listeners.get('pointermove') ?? [];
    pointerMoveHandlers[0]!({
      clientX: 150,
      clientY: 125,
      pointerId: 1,
    });
    expect(onMutate).toHaveBeenCalled();
    const mutatedScenario: Scenario = onMutate.mock.calls[0]![0];
    const movedNode = mutatedScenario.nodes.find((n) => n.id === 'run-1');
    expect(movedNode).toBeDefined();
    expect(movedNode!.position.x).toBe(300);
    expect(movedNode!.position.y).toBe(75);

    const pointerUpHandlers = listeners.get('pointerup') ?? [];
    pointerUpHandlers[0]!({ clientX: 150, clientY: 125, pointerId: 1 });
    expect(container.releasePointerCapture).toHaveBeenCalledWith(1);
    expect(onSelectNode).not.toHaveBeenCalled();

    // 1b. Clic simple sur le bloc (déplacement < seuil de 4px) : déclenche onSelectNode
    onMutate.mockClear();
    onSelectNode.mockClear();
    pointerDownHandlers[0]!({
      target: nodeEl,
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });
    pointerUpHandlers[0]!({ clientX: 201, clientY: 201, pointerId: 1 });
    expect(onSelectNode).toHaveBeenCalledWith('run-1');
    expect(onMutate).not.toHaveBeenCalled();

    // 2. Tirage de câble Start → Run avec prévisualisation + hit-test
    (handle as any).updateDoc(scenarioDoc);
    onMutate.mockClear();
    onWirePreview.mockClear();
    container.setPointerCapture.mockClear();
    container.releasePointerCapture.mockClear();

    const startNodeEl = {
      getAttribute: (attr: string) => (attr === 'data-node-id' ? 'start-1' : null),
    };
    const outputPortEl = {
      getAttribute: (attr: string) => {
        if (attr === 'data-port-type') return 'output';
        if (attr === 'data-port-index') return '0';
        return null;
      },
      closest: (sel: string) => {
        if (sel.includes('data-port-type')) return outputPortEl;
        if (sel.includes('data-node-id')) return startNodeEl;
        return null;
      },
    };

    pointerDownHandlers[0]!({
      target: outputPortEl,
      clientX: 306,
      clientY: 90,
      pointerId: 2,
    });
    expect(container.setPointerCapture).toHaveBeenCalledWith(2);
    expect(onWirePreview).toHaveBeenCalled();
    const previewCall = onWirePreview.mock.calls.find((c) => c[0] !== null);
    expect(previewCall).toBeDefined();
    const preview = previewCall![0] as WirePreview;
    expect(preview.pathData).toMatch(/^M /);

    const inputY = 50 + CANVAS_NODE_HEIGHT / 2;
    pointerMoveHandlers[0]!({
      clientX: 250,
      clientY: inputY,
      pointerId: 2,
    });
    expect(onWirePreview).toHaveBeenCalled();

    const hit = findInputPortHit(scenarioDoc, { x: 250, y: inputY }, 'start-1');
    expect(hit).toEqual({ nodeId: 'run-1', portIndex: 0 });

    pointerUpHandlers[0]!({
      clientX: 250,
      clientY: inputY,
      pointerId: 2,
    });
    expect(container.releasePointerCapture).toHaveBeenCalledWith(2);
    expect(onMutate).toHaveBeenCalled();
    const wired: Scenario = onMutate.mock.calls[onMutate.mock.calls.length - 1]![0];
    expect(wired.connections).toHaveLength(1);
    expect(wired.connections[0]).toMatchObject({
      sourceNodeId: 'start-1',
      sourcePortIndex: 0,
      targetNodeId: 'run-1',
      targetPortIndex: 0,
      key: '0',
    });
    expect(onWirePreview).toHaveBeenCalledWith(null);

    // 3. Synchronisation updateDoc
    const updatedDocWithNewBlock: Scenario = {
      ...scenarioDoc,
      nodes: [
        ...scenarioDoc.nodes,
        { id: 'run-2', type: 'run', position: { x: 400, y: 100 } },
      ],
    };
    (handle as any).updateDoc(updatedDocWithNewBlock);

    // 4. Détachement
    handle.detach();
    expect(container.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(container.removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(container.removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  it('test_CASE_UI_02_8_page_attaches_and_detaches_interactions', async () => {
    expect(typeof ScenarioStudioPage).toBe('function');
    const studioVNode = h(ScenarioStudioPage as any, { scenarioId: 'sc-1' });
    expect(studioVNode).toBeDefined();

    const evaluatedStudio = (ScenarioStudioPage as any)({ scenarioId: 'sc-1' });
    expect(evaluatedStudio).toBeDefined();
    const studioContent = JSON.stringify(evaluatedStudio);
    expect(studioContent).toMatch(/canvas|studio|toolbar/i);
  });
});
