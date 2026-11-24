import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { attachCanvasInteractions } from '../../../src/ui/hooks/canvas/use-canvas-interactions.hook.js';

describe('CASE-UI-02-20 — Déplacement de la caméra (Pan) sur le canvas par clic-glissé sur le fond vide (SPEC-UI-02)', () => {
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
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 1000, height: 600 }),
      querySelector: vi.fn().mockReturnValue(null),
    };

    scenarioDoc = {
      id: 'sc-pan-test',
      name: 'Scénario Pan Test',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 100, y: 100 } },
        { id: 'run-1', type: 'run', position: { x: 300, y: 100 }, agentId: 'ag-1' },
      ],
      connections: [],
    };
  });

  const trigger = (type: string, eventObj: any) => {
    const list = listeners.get(type) ?? [];
    list.forEach((fn) => fn(eventObj));
  };

  it('test_CASE_UI_02_20_canvas_background_pan_interaction', () => {
    const onMutate = vi.fn();
    const onViewportChange = vi.fn();

    const handle = attachCanvasInteractions(container, scenarioDoc, {
      onMutate,
      onViewportChange,
    } as any);

    expect(handle).toBeDefined();

    // 1. Clic sur fond vide : déclenche le pan
    const emptyBackgroundTarget = {
      closest: (sel: string) => null,
      getAttribute: () => null,
    };

    trigger('pointerdown', {
      clientX: 150,
      clientY: 150,
      pointerId: 1,
      target: emptyBackgroundTarget,
      button: 0,
    });

    // Curseur passe à grabbing
    expect(container.style.cursor).toBe('grabbing');

    // Déplacement de la souris de +100px en X et +50px en Y
    trigger('pointermove', {
      clientX: 250,
      clientY: 200,
      pointerId: 1,
      target: emptyBackgroundTarget,
    });

    // onViewportChange a été notifié de la translation
    expect(onViewportChange).toHaveBeenCalledWith(
      expect.objectContaining({
        pan: { x: 100, y: 50 },
      }),
    );

    // Invariance R-49 : aucune mutation sur la position des nœuds
    expect(scenarioDoc.nodes[0]!.position).toEqual({ x: 100, y: 100 });
    expect(scenarioDoc.nodes[1]!.position).toEqual({ x: 300, y: 100 });
    expect(onMutate).not.toHaveBeenCalled();

    // Relâchement : fin du pan et retour du curseur à grab
    trigger('pointerup', {
      clientX: 250,
      clientY: 200,
      pointerId: 1,
      target: emptyBackgroundTarget,
    });

    expect(container.style.cursor).toBe('grab');

    // 2. Clic sur un nœud : n'enclenche PAS le pan
    onViewportChange.mockClear();
    const nodeTarget = {
      closest: (sel: string) => {
        if (sel === '[data-node-id]') return { getAttribute: () => 'start-1' };
        return null;
      },
      getAttribute: (attr: string) => (attr === 'data-node-id' ? 'start-1' : null),
    };

    trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 2,
      target: nodeTarget,
      button: 0,
    });

    trigger('pointermove', {
      clientX: 120,
      clientY: 120,
      pointerId: 2,
      target: nodeTarget,
    });

    // Le viewport ne doit PAS bouger
    expect(onViewportChange).not.toHaveBeenCalled();

    // 3. Pan disponible même si interactionLocked vaut true
    handle.setInteractionLocked(true);
    trigger('pointerdown', {
      clientX: 50,
      clientY: 50,
      pointerId: 3,
      target: emptyBackgroundTarget,
      button: 0,
    });

    trigger('pointermove', {
      clientX: 80,
      clientY: 70,
      pointerId: 3,
      target: emptyBackgroundTarget,
    });

    expect(onViewportChange).toHaveBeenCalled();
  });
});
