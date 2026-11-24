/**
 * Point d'entrée pour les interactions pointer, le câblage et la gestion des écouteurs canvas.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type {
  CanvasViewport,
  WirePreview,
  PointerCaptureTarget,
} from '../../types/canvas.types.js';
import { CANVAS_NODE_WIDTH, CANVAS_NODE_HEIGHT } from './use-canvas-geometry.hook.js';
import { CanvasPointerManager, DRAG_THRESHOLD_PX } from './use-canvas-pointer-manager.hook.js';
import { findInputPortHit, PORT_HIT_RADIUS_PX } from './use-canvas-port-hit.hook.js';

export { CANVAS_NODE_WIDTH, CANVAS_NODE_HEIGHT, type WirePreview };
export { findInputPortHit, PORT_HIT_RADIUS_PX, DRAG_THRESHOLD_PX };

/** Poignée de contrôle du cycle de vie des écouteurs du canvas interactif. */
export interface CanvasInteractionsHandle {
  readonly detach: () => void;
  readonly updateDoc: (newDoc: Scenario) => void;
  readonly setInteractionLocked: (isLocked: boolean) => void;
  readonly manager: CanvasPointerManager;
}

/** Options de configuration pour l'attachement des interactions du canvas. */
export interface AttachCanvasInteractionsOptions {
  readonly onMutate: (scenario: Scenario) => void;
  readonly onWirePreview?: (preview: WirePreview | null) => void;
  readonly onSelectNode?: (nodeId: string) => void;
  readonly onViewportChange?: (viewport: CanvasViewport) => void;
}

function resolveAttachOptions(
  optionsOrOnMutate: AttachCanvasInteractionsOptions | ((s: Scenario) => void),
  thirdArg?: unknown,
) {
  if (typeof optionsOrOnMutate === 'function') {
    const previewHolder = thirdArg as
      { onWirePreview?: (p: WirePreview | null) => void } | undefined;
    return {
      onMutate: optionsOrOnMutate,
      onWirePreview: previewHolder?.onWirePreview,
    };
  }
  return optionsOrOnMutate;
}

function bindCanvasEventListeners(container: PointerCaptureTarget, mgr: CanvasPointerManager) {
  if (container.style && !container.style.cursor) {
    container.style.cursor = 'grab';
  }
  container.addEventListener('pointerdown', mgr.onDown);
  container.addEventListener('pointermove', mgr.onMove);
  container.addEventListener('pointerup', mgr.onUp);
  container.addEventListener('pointercancel', mgr.onUp);
  container.addEventListener('wheel', mgr.onWheel);
}

function unbindCanvasEventListeners(container: PointerCaptureTarget, mgr: CanvasPointerManager) {
  container.removeEventListener('pointerdown', mgr.onDown);
  container.removeEventListener('pointermove', mgr.onMove);
  container.removeEventListener('pointerup', mgr.onUp);
  container.removeEventListener('pointercancel', mgr.onUp);
  container.removeEventListener('wheel', mgr.onWheel);
}

/**
 * Attache les écouteurs d'événements pointer et molette au conteneur du canvas nodal.
 *
 * @param container - Élément récepteur des événements de pointage.
 * @param initialScenario - Scénario initial à manipuler.
 * @param optionsOrOnMutate - Callback de mutation ou options complètes.
 */
function attachCanvasInteractions(
  container: PointerCaptureTarget,
  initialScenario: Scenario,
  optionsOrOnMutate: AttachCanvasInteractionsOptions | ((s: Scenario) => void),
) {
  const options = resolveAttachOptions(
    optionsOrOnMutate,
    (arguments as unknown as { [3]?: unknown })[3],
  );

  const mgr = new CanvasPointerManager(
    container,
    {
      ...initialScenario,
      nodes: [...initialScenario.nodes],
      connections: [...initialScenario.connections],
    },
    options,
  );

  bindCanvasEventListeners(container, mgr);

  return {
    detach() {
      mgr.clearWirePreview();
      unbindCanvasEventListeners(container, mgr);
    },
    updateDoc(newDoc: Scenario) {
      mgr.scenario = { ...newDoc, nodes: [...newDoc.nodes], connections: [...newDoc.connections] };
    },
    setInteractionLocked(isLocked: boolean) {
      mgr.isInteractionLocked = isLocked;
      if (isLocked) mgr.clearWirePreview();
    },
    manager: mgr,
  };
}

export { attachCanvasInteractions };
