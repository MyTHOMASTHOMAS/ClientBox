/**
 * @fileExemption Dépassement nominal justifié par l'encapsulation de la capture pointer, des conversions d'espace et du drag-and-drop de blocs.
 * Gestionnaire d'état et d'événements pointer pour le drag de nœuds et le câblage interactif.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type {
  Point,
  CanvasViewport,
  PointerCaptureTarget,
  WireDragState,
  PointerManagerOptions,
} from '../../types/canvas.types.js';
import { buildPreview } from './use-canvas-geometry.hook.js';
import { computeWheelViewport, INITIAL_CANVAS_VIEWPORT } from './use-canvas-viewport.hook.js';
import {
  type DomLike,
  initWireDrag,
  resolveWireDrop,
  isInteractiveElement,
} from './canvas-pointer-wire.helper.js';

export type { PointerCaptureTarget, PointerManagerOptions };
export type { DomLike };

/** Seuil minimum en pixels pour distinguer un clic d'un glisser-déposer de bloc. */
export const DRAG_THRESHOLD_PX = 4;

/** Contrôleur d'événements et de cinématique pointer pour le canvas nodal. */
export class CanvasPointerManager {
  draggedId: string | null = null;
  startClient: Point = { x: 0, y: 0 };
  startPos: Point = { x: 0, y: 0 };
  wireDrag: WireDragState | null = null;
  isInteractionLocked = false;
  viewport: CanvasViewport = INITIAL_CANVAS_VIEWPORT;
  isPanning = false;
  panStartClient: Point = { x: 0, y: 0 };
  panStartViewportPan: Point = { x: 0, y: 0 };
  clickedPortEl: (DomLike & { click?: () => void }) | null = null;
  portStartClient: Point = { x: 0, y: 0 };

  constructor(
    public container: PointerCaptureTarget,
    public scenario: Scenario,
    public options: PointerManagerOptions,
  ) {}

  setViewport(viewport: CanvasViewport) {
    this.viewport = viewport;
  }

  updateDoc(newDoc: Scenario) {
    this.scenario = newDoc;
  }

  clientToCanvas(e: PointerEvent) {
    const rect = this.container.getBoundingClientRect?.() ?? {
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    };
    const zoom = this.viewport.zoom || 1;
    const pan = this.viewport.pan || { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }

  clearWirePreview() {
    this.wireDrag = null;
    this.options.onWirePreview?.(null);
  }

  private handlePortDown(portEl: DomLike, el: DomLike | null, e: PointerEvent) {
    const result = initWireDrag({
      scenario: this.scenario,
      portEl,
      el,
      canvasPoint: this.clientToCanvas(e),
    });
    if (!result) return;
    this.clickedPortEl = result.clickedPortEl;
    this.portStartClient = { x: e.clientX, y: e.clientY };
    this.wireDrag = result.wireDrag;
    this.options.onWirePreview?.(
      buildPreview(result.wireDrag.sourcePos, result.wireDrag.currentPos),
    );
    this.container.setPointerCapture?.(e.pointerId);
  }

  private handleNodeDown(target: DomLike, e: PointerEvent) {
    this.draggedId = target.getAttribute?.('data-node-id') ?? null;
    const node = this.scenario.nodes.find((n) => n.id === this.draggedId);
    if (!node) return;
    this.startClient = { x: e.clientX, y: e.clientY };
    this.startPos = { ...node.position };
    this.container.setPointerCapture?.(e.pointerId);
  }

  onDown = (e: PointerEvent) => {
    const el = e.target as DomLike | null;
    const portEl = el?.closest?.('[data-port-type]');
    if (portEl) {
      if (!this.isInteractionLocked) this.handlePortDown(portEl, el, e);
      return;
    }
    const target = el?.closest?.('[data-node-id]');
    if (target) {
      if (!this.isInteractionLocked) this.handleNodeDown(target, e);
      return;
    }

    if (isInteractiveElement(el)) return;

    if (e.button === 0) {
      this.isPanning = true;
      this.panStartClient = { x: e.clientX, y: e.clientY };
      this.panStartViewportPan = { ...this.viewport.pan };
      if (this.container.style) this.container.style.cursor = 'grabbing';
      this.container.setPointerCapture?.(e.pointerId);
    }
  };

  onMove = (e: PointerEvent) => {
    if (this.isPanning) {
      const deltaX = e.clientX - this.panStartClient.x;
      const deltaY = e.clientY - this.panStartClient.y;
      this.viewport = {
        ...this.viewport,
        pan: { x: this.panStartViewportPan.x + deltaX, y: this.panStartViewportPan.y + deltaY },
      };
      this.options.onViewportChange?.(this.viewport);
      return;
    }
    if (this.isInteractionLocked) return;
    if (this.wireDrag) {
      const currentPos = this.clientToCanvas(e);
      this.wireDrag = { ...this.wireDrag, currentPos };
      this.options.onWirePreview?.(buildPreview(this.wireDrag.sourcePos, currentPos));
      return;
    }
    if (!this.draggedId) return;
    const dist = Math.hypot(e.clientX - this.startClient.x, e.clientY - this.startClient.y);
    if (dist < DRAG_THRESHOLD_PX) return;

    const zoom = this.viewport.zoom || 1;
    const newPos = {
      x: this.startPos.x + (e.clientX - this.startClient.x) / zoom,
      y: this.startPos.y + (e.clientY - this.startClient.y) / zoom,
    };
    this.scenario = {
      ...this.scenario,
      nodes: this.scenario.nodes.map((n) =>
        n.id === this.draggedId ? { ...n, position: newPos } : n,
      ),
    };
    this.options.onMutate(this.scenario);
  };

  onUp = (e: PointerEvent) => {
    if (this.isPanning) {
      this.isPanning = false;
      if (this.container.style) this.container.style.cursor = 'grab';
      this.container.releasePointerCapture?.(e.pointerId);
      return;
    }
    if (this.wireDrag) {
      this.scenario = resolveWireDrop({
        scenario: this.scenario,
        wireDrag: this.wireDrag,
        dropPoint: this.clientToCanvas(e),
        clickedPortEl: this.clickedPortEl,
        portStartClient: this.portStartClient,
        currentClient: { x: e.clientX, y: e.clientY },
        dragThreshold: DRAG_THRESHOLD_PX,
        onMutate: this.options.onMutate,
      });
      this.clickedPortEl = null;
      this.clearWirePreview();
      this.container.releasePointerCapture?.(e.pointerId);
      return;
    }
    if (this.draggedId) {
      const dist = Math.hypot(e.clientX - this.startClient.x, e.clientY - this.startClient.y);
      if (dist < DRAG_THRESHOLD_PX) this.options.onSelectNode?.(this.draggedId);
      this.container.releasePointerCapture?.(e.pointerId);
    }
    this.draggedId = null;
  };

  onWheel = (e: WheelEvent) => {
    e.preventDefault?.();
    const rect = this.container.getBoundingClientRect?.() ?? { left: 0, top: 0 };
    this.viewport = computeWheelViewport(this.viewport, e, rect);
    this.options.onViewportChange?.(this.viewport);
  };
}
