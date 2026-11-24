import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { h } from 'preact';

import { isStudioGraphLocked } from '../../../src/ui/hooks/canvas/use-canvas-state.hook.js';
import { CanvasToolbar } from '../../../src/ui/components/canvas/canvas-toolbar.js';
import { CanvasPointerManager } from '../../../src/ui/hooks/canvas/use-canvas-pointer-manager.hook.js';
import type { Scenario } from '../../../src/types/models/scenario.model.js';

describe('CASE-UI-02-16 — verrou édition / Enregistrer pendant run (SPEC-UI-02)', () => {
  it('test_CASE_UI_02_16_studio_locks_edit_and_save_while_scenario_running', () => {
    assert.equal(isStudioGraphLocked({}), false);
    assert.equal(isStudioGraphLocked({ isRunning: true }), true);
    assert.equal(isStudioGraphLocked({ isLaunchLocked: true }), true);
    assert.equal(isStudioGraphLocked({ isBusy: true }), true);
    assert.equal(
      isStudioGraphLocked({ isRunning: false, isLaunchLocked: false, isBusy: false }),
      false,
    );

    let saveCalls = 0;
    let addCalls = 0;
    let stopCalls = 0;

    const lockedVNode = h(CanvasToolbar, {
      scenarioName: 'sc-lock',
      isRunning: true,
      isGraphLocked: true,
      canLaunch: false,
      hasStartNode: true,
      onSave: () => {
        saveCalls += 1;
      },
      onAddNode: () => {
        addCalls += 1;
      },
      onStop: () => {
        stopCalls += 1;
      },
    });
    assert.ok(lockedVNode);
    const lockedTree = lockedVNode as {
      props: {
        isGraphLocked?: boolean;
        isRunning?: boolean;
        onSave?: () => void;
        onStop?: () => void;
        onAddNode?: (t: string) => void;
      };
    };
    assert.equal(lockedTree.props.isGraphLocked, true);
    assert.equal(lockedTree.props.isRunning, true);

    const isLocked = isStudioGraphLocked({ isRunning: true, isLaunchLocked: true });
    const handleSave = () => {
      if (isLocked) return;
      saveCalls += 1;
    };
    const handleAdd = () => {
      if (isLocked) return;
      addCalls += 1;
    };
    handleSave();
    handleAdd();
    assert.equal(saveCalls, 0);
    assert.equal(addCalls, 0);

    lockedTree.props.onStop?.();
    assert.equal(stopCalls, 1);

    const scenario: Scenario = {
      id: 'sc-1',
      name: 'sc-1',
      nodes: [{ id: 'run-1', type: 'run', position: { x: 0, y: 0 } }],
      connections: [],
    };
    let mutateCount = 0;
    const container = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    const mgr = new CanvasPointerManager(container as never, scenario, {
      onMutate: () => {
        mutateCount += 1;
      },
    });
    mgr.isInteractionLocked = true;
    const nodeEl = {
      getAttribute: (name: string) => (name === 'data-node-id' ? 'run-1' : null),
      closest: (sel: string) => (sel === '[data-node-id]' ? nodeEl : null),
    };
    mgr.onDown({
      target: nodeEl,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    } as unknown as PointerEvent);
    assert.equal(mgr.draggedId, null);
    assert.equal(mutateCount, 0);

    assert.equal(isStudioGraphLocked({ isRunning: false, isLaunchLocked: false }), false);
  });
});
