/**
 * Mutations pures du document canvas (add/remove/wire/move/keys).
 */

import type { NodeType, ScenarioNode } from '../../../types/models/node.model.js';
import { assignDefaultKey } from '../../../domain/keys/key-assigner.domain.js';
import { hasKeyCollision } from '../../../domain/keys/key-collision.validator.js';
import { renumberDefaultKeys } from '../../../domain/keys/key-renumberer.domain.js';
import type {
  Point,
  CanvasDocument,
  BooleanFlag,
  ScenarioConnection,
} from '../../types/canvas.types.js';

/**
 * Ajoute un nouveau bloc sur le canvas en respectant l'unicité de Start.
 * @param doc Document canvas cible
 * @param type Type de nœud à ajouter
 * @param position Coordonnées 2D initiales
 */
export function addBlock(doc: CanvasDocument, type: NodeType, position: Point) {
  if (type === 'start' && doc.nodes.some((n) => n.type === 'start')) {
    return {
      ok: false as BooleanFlag,
      document: doc,
      error:
        "Un seul bloc Start est autorisé par scénario. L'ajout d'un second déclencheur est interdit.",
    };
  }
  const counters: Record<string, number> = {
    ...((doc as { _counters?: Record<string, number> })._counters ?? {}),
  };
  const next = (counters[type] ?? 0) + 1;
  counters[type] = next;
  const newNode: ScenarioNode = { id: `${type}-${next}`, type, position: { ...position } };
  return {
    ok: true as BooleanFlag,
    document: { ...doc, nodes: [...doc.nodes, newNode], _counters: counters } as CanvasDocument,
  };
}

/**
 * Supprime un bloc et ses câbles connectés du canvas.
 * @param doc Document canvas cible
 * @param nodeId Identifiant du bloc à retirer
 */
export function removeBlock(doc: CanvasDocument, nodeId: string) {
  const nodes = doc.nodes.filter((n) => n.id !== nodeId);
  const remaining = doc.connections.filter(
    (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId,
  );
  return { ...doc, nodes, connections: renumberDefaultKeys(remaining, '0') };
}

/**
 * Supprime une connexion et renumérote les clés numériques restantes.
 * @param doc Document canvas cible
 * @param connectionIndex Index de la connexion à retirer
 */
export function removeConnection(doc: CanvasDocument, connectionIndex: number) {
  const removed = doc.connections[connectionIndex];
  if (!removed) return doc;
  const remaining = doc.connections.filter((_, idx) => idx !== connectionIndex);
  return { ...doc, connections: renumberDefaultKeys(remaining, removed.key) };
}

/**
 * Déplace un bloc sur la grille canvas.
 * @param doc Document canvas cible
 * @param nodeId Identifiant du nœud
 * @param newPos Nouvelles coordonnées
 */
export function moveBlock(doc: CanvasDocument, nodeId: string, newPos: Point) {
  const nodes = doc.nodes.map((n) => (n.id === nodeId ? { ...n, position: { ...newPos } } : n));
  return { ...doc, nodes };
}

/**
 * Câble deux ports orientés en assignant une clé auto-incrémentée.
 * @param doc Document canvas cible
 * @param options Paramètres de connexion source et cible
 */
export function wireOriented(
  doc: CanvasDocument,
  options: {
    sourceNodeId: string;
    sourcePortIndex: number;
    targetNodeId: string;
    targetPortIndex: number;
    power?: number;
  },
) {
  const newConnection: ScenarioConnection = {
    sourceNodeId: options.sourceNodeId,
    sourcePortIndex: options.sourcePortIndex,
    targetNodeId: options.targetNodeId,
    targetPortIndex: options.targetPortIndex,
    key: assignDefaultKey(doc.connections, options.targetNodeId),
    power: options.power ?? 1,
  };
  return {
    ok: true as BooleanFlag,
    document: { ...doc, connections: [...doc.connections, newConnection] },
  };
}

/**
 * Met à jour la clé d'une entrée avec détection de collision.
 * @param doc Document canvas
 * @param connectionIndex Index de la connexion
 * @param newKey Nouvelle clé d'accès
 */
export function updateConnectionKey(doc: CanvasDocument, connectionIndex: number, newKey: string) {
  const conn = doc.connections[connectionIndex];
  if (!conn) return { ok: false as BooleanFlag, document: doc, error: 'Connexion introuvable.' };
  const others = doc.connections.filter((_, idx) => idx !== connectionIndex);
  if (hasKeyCollision(others, conn.targetNodeId || '', newKey)) {
    return {
      ok: false as BooleanFlag,
      document: doc,
      error: "Cette clé d'entrée entre en collision sur ce nœud.",
    };
  }
  const connections = doc.connections.map((c, i) =>
    i === connectionIndex ? { ...c, key: newKey } : c,
  );
  return { ok: true as BooleanFlag, document: { ...doc, connections } };
}

/**
 * Met à jour la puissance requise d'un câble Join.
 * @param doc Document canvas
 * @param connectionIndex Index de la connexion
 * @param newPower Valeur minimale de puissance (min 1)
 */
export function updateConnectionPower(
  doc: CanvasDocument,
  connectionIndex: number,
  newPower: number,
) {
  const connections = doc.connections.map((c, i) =>
    i === connectionIndex ? { ...c, power: Math.max(1, newPower) } : c,
  );
  return { ...doc, connections };
}
