/**
 * Hook et fonctions pures de calcul pour la caméra spatiale du canvas (Pan & Zoom) (SPEC-UI-02 / ADR-021).
 * [UI-060] Gestion du viewport, bornes [0.25, 2.0] et centrage dynamique au curseur.
 */

import { useState, useCallback } from 'preact/hooks';
import type { Point, CanvasViewport } from '../../types/canvas.types.js';

/** Facteur d'échelle minimal autorisé (25%). */
export const MIN_CANVAS_ZOOM = 0.25;

/** Facteur d'échelle maximal autorisé (200%). */
export const MAX_CANVAS_ZOOM = 2.0;

/** Facteur d'échelle par défaut à l'ouverture (100%). */
export const DEFAULT_CANVAS_ZOOM = 1.0;

/** Viewport initial nominal. */
export const INITIAL_CANVAS_VIEWPORT: CanvasViewport = {
  pan: { x: 0, y: 0 },
  zoom: DEFAULT_CANVAS_ZOOM,
};

/**
 * Borne la valeur de zoom dans la plage ergonomique valide [0.25, 2.0].
 *
 * @param zoom - Facteur d'échelle brut à borner.
 */
export function clampZoom(zoom: number) {
  return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, zoom));
}

/** Paramètres d'entrée pour le calcul affine du zoom centré sur le curseur. */
export interface ZoomComputationOptions {
  readonly oldZoom: number;
  readonly oldPan: Point;
  readonly cursorClient: Point;
  readonly deltaY: number;
}

/**
 * Calcule le nouveau viewport avec zoom exponentiel continu centré sur la position de la souris.
 *
 * @param options - Paramètres géométriques pour le calcul du nouveau zoom et pan.
 */
export function computeZoomAtCursor(options: ZoomComputationOptions) {
  const { oldZoom, oldPan, cursorClient, deltaY } = options;
  const zoomFactor = Math.exp(-deltaY * 0.0015);
  const newZoom = clampZoom(oldZoom * zoomFactor);

  if (newZoom === oldZoom) {
    return { pan: oldPan, zoom: oldZoom };
  }

  // Compensation affine pour garder le point sous curseur fixe :
  // panNew = cursor - (cursor - panOld) * (zoomNew / zoomOld)
  const ratio = newZoom / oldZoom;
  const newPan: Point = {
    x: cursorClient.x - (cursorClient.x - oldPan.x) * ratio,
    y: cursorClient.y - (cursorClient.y - oldPan.y) * ratio,
  };

  return { pan: newPan, zoom: newZoom };
}

/**
 * Calcule le viewport résultant d'une action molette au-dessus d'un conteneur.
 *
 * @param viewport - Viewport courant.
 * @param event - Événement molette contenant la position et le delta.
 * @param containerRect - Coordonnées écran du conteneur.
 */
export function computeWheelViewport(
  viewport: CanvasViewport,
  event: { clientX: number; clientY: number; deltaY: number },
  containerRect: { left: number; top: number },
) {
  const cursorClient = {
    x: event.clientX - containerRect.left,
    y: event.clientY - containerRect.top,
  };
  return computeZoomAtCursor({
    oldZoom: viewport.zoom,
    oldPan: viewport.pan,
    cursorClient,
    deltaY: event.deltaY,
  });
}

/**
 * Applique un déplacement de translation au viewport.
 */
function applyPanDelta(prev: CanvasViewport, delta: Point) {
  return {
    ...prev,
    pan: {
      x: prev.pan.x + delta.x,
      y: prev.pan.y + delta.y,
    },
  };
}

/**
 * Hook Preact pour la gestion réactive du viewport de navigation dans ScenarioStudioPage.
 *
 * @param initial - Configuration initiale partielle du viewport.
 */
export function useCanvasViewport(initial?: Partial<CanvasViewport>) {
  const [viewport, setViewport] = useState<CanvasViewport>({
    pan: initial?.pan ?? INITIAL_CANVAS_VIEWPORT.pan,
    zoom: initial?.zoom ?? INITIAL_CANVAS_VIEWPORT.zoom,
  });

  const handlePan = useCallback((delta: Point) => {
    setViewport((prev) => applyPanDelta(prev, delta));
  }, []);

  const handleWheel = useCallback((e: WheelEvent, containerRect: { left: number; top: number }) => {
    e.preventDefault();
    setViewport((prev) => computeWheelViewport(prev, e, containerRect));
  }, []);

  const resetViewport = useCallback(() => {
    setViewport(INITIAL_CANVAS_VIEWPORT);
  }, []);

  return {
    viewport,
    setViewport,
    handlePan,
    handleWheel,
    resetViewport,
  };
}
