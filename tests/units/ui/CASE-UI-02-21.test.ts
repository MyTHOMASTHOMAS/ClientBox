import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Scenario } from '../../../src/types/models/scenario.model.js';
import { attachCanvasInteractions } from '../../../src/ui/hooks/canvas/use-canvas-interactions.hook.js';

describe('CASE-UI-02-21 — Zoom continu à la molette centré sur le curseur avec bornes [0.25, 2.0] (SPEC-UI-02)', () => {
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
      getBoundingClientRect: vi.fn().mockReturnValue({ left: 0, top: 0, width: 1000, height: 600 }),
    };

    scenarioDoc = {
      id: 'sc-zoom-test',
      name: 'Scénario Zoom Test',
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 200, y: 150 } },
      ],
      connections: [],
    };
  });

  const trigger = (type: string, eventObj: any) => {
    const list = listeners.get(type) ?? [];
    list.forEach((fn) => fn(eventObj));
  };

  it('test_CASE_UI_02_21_canvas_wheel_zoom_centered_at_cursor', () => {
    const onMutate = vi.fn();
    const onViewportChange = vi.fn();

    const handle = attachCanvasInteractions(container, scenarioDoc, {
      onMutate,
      onViewportChange,
    } as any);

    expect(handle).toBeDefined();

    // 1. Zoom avant à la molette centré en (200, 100)
    trigger('wheel', {
      clientX: 200,
      clientY: 100,
      deltaY: -100, // Zoom avant
      preventDefault: vi.fn(),
    });

    expect(onViewportChange).toHaveBeenCalled();
    const lastViewport = onViewportChange.mock.calls[onViewportChange.mock.calls.length - 1]![0];
    expect(lastViewport.zoom).toBeGreaterThan(1.0);
    // Le pan doit être négatif pour compenser l'agrandissement vers le point (200, 100)
    expect(lastViewport.pan.x).toBeLessThan(0);
    expect(lastViewport.pan.y).toBeLessThan(0);

    // 2. Clamp maximal à 2.0x
    for (let i = 0; i < 20; i++) {
      trigger('wheel', {
        clientX: 200,
        clientY: 100,
        deltaY: -300,
        preventDefault: vi.fn(),
      });
    }

    const maxViewport = onViewportChange.mock.calls[onViewportChange.mock.calls.length - 1]![0];
    expect(maxViewport.zoom).toBe(2.0);

    // 3. Clamp minimal à 0.25x
    for (let i = 0; i < 40; i++) {
      trigger('wheel', {
        clientX: 200,
        clientY: 100,
        deltaY: 300,
        preventDefault: vi.fn(),
      });
    }

    const minViewport = onViewportChange.mock.calls[onViewportChange.mock.calls.length - 1]![0];
    expect(minViewport.zoom).toBe(0.25);

    // 4. Invariance modèle R-49
    expect(scenarioDoc.nodes[0]!.position).toEqual({ x: 200, y: 150 });
    expect(onMutate).not.toHaveBeenCalled();
  });
});
