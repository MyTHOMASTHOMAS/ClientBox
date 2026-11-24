import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { attachCanvasInteractions } from '../../../src/ui/hooks/canvas/use-canvas-interactions.hook.js';
import { CanvasPointerManager } from '../../../src/ui/hooks/canvas/use-canvas-pointer-manager.hook.js';

describe('CASE-UI-02-22 — Isomorphisme de projection clientToCanvas et précision du drag et câblage sous Pan & Zoom (SPEC-UI-02)', () => {
  let container: any;
  let listeners: Map<string, Array<(...args: any[]) => void>>;
  let scenarioDoc: Scenario;

  beforeEach(() => {
    listeners = new Map();
    container = {
      style: { cursor: 'grab' },
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
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 50, top: 50, width: 1000, height: 600 }),
    };

    scenarioDoc = {
      id: 'sc-projection-test',
      name: 'Scénario Projection Test',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 100, y: 100 } },
      ],
      connections: [],
    };
  });

  const trigger = (type: string, eventObj: any) => {
    const list = listeners.get(type) ?? [];
    list.forEach((fn) => fn(eventObj));
  };

  it('test_CASE_UI_02_22_canvas_matrix_projection_client_to_canvas_under_viewport', () => {
    const onMutate = vi.fn();
    const onWirePreview = vi.fn();

    const handle = attachCanvasInteractions(container, scenarioDoc, {
      onMutate,
      onWirePreview,
    });

    const mgr: CanvasPointerManager = (handle as any).manager;
    expect(mgr).toBeDefined();

    // 1. Projection pure clientToCanvas avec pan = {x: 100, y: 50} et zoom = 1.5
    (mgr as any).setViewport?.({ pan: { x: 100, y: 50 }, zoom: 1.5 });

    // Client à (275, 200). rect.left = 50, rect.top = 50.
    // X = (275 - 50 - 100) / 1.5 = 125 / 1.5 = 83.333...
    // Y = (200 - 50 - 50) / 1.5 = 100 / 1.5 = 66.666...
    const projected = mgr.clientToCanvas({ clientX: 275, clientY: 200 } as PointerEvent);
    expect(projected.x).toBeCloseTo(83.33, 1);
    expect(projected.y).toBeCloseTo(66.67, 1);

    // 2. Déplacement (drag) d'un bloc sans dérive sous fort zoom (zoom = 2.0)
    (mgr as any).setViewport?.({ pan: { x: 0, y: 0 }, zoom: 2.0 });

    const nodeTarget = {
      closest: (sel: string) => {
        if (sel === '[data-node-id]') return { getAttribute: () => 'start-1' };
        return null;
      },
      getAttribute: (attr: string) => (attr === 'data-node-id' ? 'start-1' : null),
    };

    trigger('pointerdown', {
      clientX: 250, // 50 + 100 * 2
      clientY: 250, // 50 + 100 * 2
      pointerId: 10,
      target: nodeTarget,
      button: 0,
    });

    // Déplacement de +100px client en X, +40px client en Y
    trigger('pointermove', {
      clientX: 350,
      clientY: 290,
      pointerId: 10,
      target: nodeTarget,
    });

    // À zoom 2.0, +100px écran correspond à +50px dans l'espace canvas
    // Position initiale {x: 100, y: 100} -> {x: 150, y: 120}
    expect(onMutate).toHaveBeenCalled();
    const updatedDoc = onMutate.mock.calls[onMutate.mock.calls.length - 1]![0];
    const movedNode = updatedDoc.nodes.find((n: any) => n.id === 'start-1');
    expect(movedNode.position.x).toBe(150);
    expect(movedNode.position.y).toBe(120);

    trigger('pointerup', {
      clientX: 350,
      clientY: 290,
      pointerId: 10,
      target: nodeTarget,
    });

    // 3. Déplacement (drag) d'un bloc sans dérive sous dézoom (zoom = 0.5)
    onMutate.mockClear();
    (mgr as any).updateDoc?.({
      ...scenarioDoc,
      nodes: [{ id: 'start-1', type: 'start', position: { x: 100, y: 100 } }],
    });
    (mgr as any).setViewport?.({ pan: { x: 0, y: 0 }, zoom: 0.5 });

    trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 11,
      target: nodeTarget,
      button: 0,
    });

    // Déplacement de +50px client en X, +30px client en Y
    trigger('pointermove', {
      clientX: 150,
      clientY: 130,
      pointerId: 11,
      target: nodeTarget,
    });

    // À zoom 0.5, +50px écran correspond à +100px dans l'espace canvas (+30px écran -> +60px canvas)
    // Position initiale {x: 100, y: 100} -> {x: 200, y: 160}
    expect(onMutate).toHaveBeenCalled();
    const updatedDocDezoom = onMutate.mock.calls[onMutate.mock.calls.length - 1]![0];
    const movedNodeDezoom = updatedDocDezoom.nodes.find((n: any) => n.id === 'start-1');
    expect(movedNodeDezoom.position.x).toBe(200);
    expect(movedNodeDezoom.position.y).toBe(160);
  });
});
