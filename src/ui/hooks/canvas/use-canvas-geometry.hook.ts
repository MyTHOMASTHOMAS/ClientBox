/**
 * Fonctions pures de calcul géométrique SVG pour le canvas nodal (Bézier cubique, ancrages).
 */

import type { Point } from '../../types/canvas.types.js';

/** Largeur standard d'un nœud sur le canvas en pixels. */
export const CANVAS_NODE_WIDTH = 256;

/** Hauteur standard d'un nœud sur le canvas en pixels. */
export const CANVAS_NODE_HEIGHT = 80;

/** Résultat du calcul d'une courbe de Bézier cubique SVG. */
export interface BezierCurvePath {
  readonly pathData: string;
  readonly midpoint: Point;
  readonly angleDeg: number;
}

/** Données de prévisualisation temporaire d'un câble en cours de tirage. */
export interface WirePreview {
  readonly source: Point;
  readonly target: Point;
  readonly pathData: string;
}

/** Options de calcul du point d'ancrage d'un port nodal. */
export interface PortAnchorOptions {
  readonly nodePos: Point;
  readonly type: 'input' | 'output';
  readonly portIndex: number;
  readonly totalPorts: number;
}

/**
 * Calcule les points de contrôle et le tracé SVG d'une courbe de Bézier cubique.
 * @param source Point d'ancrage de départ
 * @param target Point d'ancrage d'arrivée
 */
export function calculateCubicBezier(source: Point, target: Point) {
  const dx = Math.abs(target.x - source.x);
  const curvature = Math.max(40, dx * 0.45);
  const cx1 = source.x + curvature;
  const cy1 = source.y;
  const cx2 = target.x - curvature;
  const cy2 = target.y;

  const pathData = `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;
  const midpoint: Point = {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2,
  };
  const angleDeg = (Math.atan2(target.y - source.y, target.x - source.x) * 180) / Math.PI;

  return { pathData, midpoint, angleDeg };
}

/** Paramètres géométriques pour le positionnement d'un port sur une carte nodale. */
export interface PortPositionParams {
  readonly nodePos: Point;
  readonly nodeWidth: number;
  readonly nodeHeight: number;
  readonly type: 'input' | 'output';
  readonly portIndex?: number;
  readonly totalPorts?: number;
}

/**
 * Calcule les coordonnées 2D absolues d'un port d'entrée ou de sortie sur un nœud.
 * @param params Paramètres de géométrie et d'index de port
 */
export function calculatePortPosition(params: PortPositionParams) {
  const { nodePos, nodeWidth, nodeHeight, type, portIndex = 0, totalPorts = 1 } = params;
  const x = type === 'input' ? nodePos.x : nodePos.x + nodeWidth;
  if (totalPorts <= 1) {
    return { x, y: nodePos.y + nodeHeight / 2 };
  }
  const spacing = nodeHeight / (totalPorts + 1);
  const y = nodePos.y + spacing * (portIndex + 1);
  return { x, y };
}

/**
 * Détermine les coordonnées absolues d'un port nodal à partir des dimensions standard.
 * @param options Paramètres d'ancrage du port
 */
export function portAnchor(options: PortAnchorOptions) {
  return calculatePortPosition({
    nodePos: options.nodePos,
    nodeWidth: CANVAS_NODE_WIDTH,
    nodeHeight: CANVAS_NODE_HEIGHT,
    type: options.type,
    portIndex: options.portIndex,
    totalPorts: options.totalPorts,
  });
}

/**
 * Construit un objet de prévisualisation de câble reliant deux points 2D.
 * @param source Point d'ancrage source
 * @param target Point d'ancrage cible
 */
export function buildPreview(source: Point, target: Point) {
  const { pathData } = calculateCubicBezier(source, target);
  return { source, target, pathData };
}
