/**
 * Helper modulaire pour la gestion du drag-and-drop de câblage et du clic de port.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { Point, WireDragState } from '../../types/canvas.types.js';
import { portAnchor } from './use-canvas-geometry.hook.js';
import { findInputPortHit, appendOrientedConnection } from './use-canvas-port-hit.hook.js';

/**
 * Abstraction minimale d'un élément DOM pour le canvas et ses tests headless.
 */
export interface DomLike {
  getAttribute?: (name: string) => string | null;
  closest?: (selector: string) => DomLike | null;
}

/**
 * Paramètres d'initialisation du tirage interactif de câble.
 */
export interface WireInitContext {
  readonly scenario: Scenario;
  readonly portEl: DomLike;
  readonly el: DomLike | null;
  readonly canvasPoint: Point;
}

/**
 * Paramètres de résolution du relâchement de câble ou repli par clic.
 */
export interface WireDropParams {
  readonly scenario: Scenario;
  readonly wireDrag: WireDragState;
  readonly dropPoint: Point;
  readonly clickedPortEl: (DomLike & { click?: () => void }) | null;
  readonly portStartClient: Point;
  readonly currentClient: Point;
  readonly dragThreshold?: number;
  readonly onMutate: (next: Scenario) => void;
}

/**
 * Initialise l'état de tirage de câble depuis un port de sortie de bloc.
 *
 * @param ctx - Contexte contenant l'élément port et le point canvas.
 */
export function initWireDrag(ctx: WireInitContext) {
  const portType = ctx.portEl.getAttribute?.('data-port-type');
  const portIndex = Number.parseInt(ctx.portEl.getAttribute?.('data-port-index') ?? '0', 10) || 0;
  const nodeId = ctx.el?.closest?.('[data-node-id]')?.getAttribute?.('data-node-id');
  if (!nodeId || portType !== 'output') return null;

  const node = ctx.scenario.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const totalPorts = node.type === 'if' ? 2 : 1;
  const sourcePos = portAnchor({ nodePos: node.position, type: 'output', portIndex, totalPorts });
  const wireDrag: WireDragState = {
    sourceNodeId: nodeId,
    sourcePortIndex: portIndex,
    sourcePos,
    currentPos: ctx.canvasPoint,
  };
  return {
    wireDrag,
    clickedPortEl: ctx.portEl as DomLike & { click?: () => void },
  };
}

function triggerPortClickFallback(
  clickedPortEl: (DomLike & { click?: () => void }) | null,
  start: Point,
  current: Point,
) {
  if (!clickedPortEl) return;
  const dist = Math.hypot(current.x - start.x, current.y - start.y);
  if (dist >= 4) return;
  try {
    clickedPortEl.click?.();
  } catch {
    // Ignore headless mock
  }
}

/**
 * Résout le drop d'un câble vers un port d'entrée cible ou déclenche le repli par clic.
 *
 * @param params - Contexte et coordonnées du relâchement de pointeur.
 */
export function resolveWireDrop(params: WireDropParams) {
  const { scenario, wireDrag, dropPoint, clickedPortEl, portStartClient, currentClient, onMutate } =
    params;
  const hit = findInputPortHit(scenario, dropPoint, wireDrag.sourceNodeId);
  if (hit) {
    const updated = appendOrientedConnection({
      scenario,
      sourceNodeId: wireDrag.sourceNodeId,
      sourcePortIndex: wireDrag.sourcePortIndex,
      targetNodeId: hit.nodeId,
      targetPortIndex: hit.portIndex,
    });
    onMutate(updated);
    return updated;
  }
  triggerPortClickFallback(clickedPortEl, portStartClient, currentClient);
  return scenario;
}

/**
 * Détecte si la cible du clic est un élément interactif non déplaçable.
 *
 * @param el - Élément DOM cliqué inspecté.
 */
export function isInteractiveElement(el: DomLike | null) {
  return Boolean(
    el?.closest?.(
      '[data-section="inspector"], [data-action], [data-field], .cable, path.cable, g.cable, button, input, select, textarea, a',
    ),
  );
}
