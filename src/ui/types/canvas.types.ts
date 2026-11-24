/**
 * Contrats typés du canvas graphique nodal ClientsBox (style N8N).
 * Pureté déclarative (zéro logique runtime).
 */

import type { ScenarioNode } from '../../types/models/node.model.js';
import type { Scenario } from '../../types/models/scenario.model.js';
import type { Connection } from '../../types/models/connection.model.js';
import type { BlockStatus } from '../../types/messages/block-status.message.js';

/** Contrat d'une connexion nodale au sein du canvas. */
export interface ScenarioConnection extends Connection {
  readonly sourceNodeId?: string;
  readonly targetNodeId?: string;
  readonly sourcePortIndex?: number;
  readonly targetPortIndex?: number;
  readonly power?: number;
}

/** Alias de drapeau booléen conforme aux règles de convention. */
export type BooleanFlag = true | false;

/** Coordonnées cartésiennes 2D dans l'espace canvas. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** État du viewport et de la caméra de navigation canvas. */
export interface ViewportState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

/** Configuration géométrique du viewport pour le Pan & Zoom (REQ-045 / ADR-021). */
export interface CanvasViewport {
  readonly pan: Point;
  readonly zoom: number;
}

/** Télémétrie d'exécution attachée à un nœud. */
export interface NodeTelemetry {
  readonly pid?: number;
  readonly durationMs?: number;
  readonly exitCode?: number;
  readonly tokenCount?: number;
  readonly sacSummary?: string;
  readonly barrierReceived?: number;
  readonly barrierRequired?: number;
}

/** Vue-modèle enrichie d'un nœud pour le rendu. */
export interface CanvasNodeViewModel extends ScenarioNode {
  readonly status?: BlockStatus;
  readonly telemetry?: NodeTelemetry;
  readonly isSelected?: boolean;
}

/** Vue-modèle enrichie d'une connexion nodale. */
export interface CanvasConnectionViewModel extends ScenarioConnection {
  readonly power: number;
  readonly branch?: 'true' | 'false';
  readonly isSelected?: boolean;
  readonly isActive?: boolean;
}

/** Point d'ancrage d'un port d'entrée ou de sortie. */
export interface PortAnchor {
  readonly nodeId: string;
  readonly portIndex: number;
  readonly type: 'input' | 'output';
  readonly branch?: 'true' | 'false';
  readonly position: Point;
}

/** Document de travail représentant l'état du canvas. */
export interface CanvasDocument {
  readonly scenarioId: string;
  readonly name?: string;
  readonly description?: string;
  readonly nodes: readonly ScenarioNode[];
  readonly connections: readonly ScenarioConnection[];
  readonly viewport?: ViewportState;
  readonly runnerStatus?: string;
}

/** Résultat de l'ajout d'un bloc nodal dans le document. */
export interface AddBlockResult {
  readonly ok: BooleanFlag;
  readonly document: CanvasDocument;
  readonly error?: string;
}

/** Résultat de l'opération de câblage orienté entre deux blocs. */
export interface WireResult {
  readonly ok: BooleanFlag;
  readonly document: CanvasDocument;
  readonly error?: string;
}

/** État d'une interaction de glisser-déposer sur le canvas. */
export interface DragState {
  readonly isDragging: boolean;
  readonly nodeId?: string;
  readonly startPointer: Point;
  readonly startNodePos: Point;
}

/** Aperçu géométrique du fil en cours de tracé. */
export interface WirePreview {
  readonly source: Point;
  readonly target: Point;
  readonly pathData: string;
}

/** Cible DOM minimale supportant la capture de pointeur et l'écoute d'événements. */
export interface PointerCaptureTarget {
  setPointerCapture?: (id: number) => void;
  releasePointerCapture?: (id: number) => void;
  addEventListener: {
    (type: 'wheel', listener: (e: WheelEvent) => void): void;
    (type: string, listener: (e: PointerEvent) => void): void;
  };
  removeEventListener: {
    (type: 'wheel', listener: (e: WheelEvent) => void): void;
    (type: string, listener: (e: PointerEvent) => void): void;
  };
  getBoundingClientRect?: () => { left: number; top: number; width: number; height: number };
  querySelector?: (sel: string) => unknown;
  style?: { cursor?: string };
}

/** État du tracé de fil en cours de drag depuis un port. */
export interface WireDragState {
  readonly sourceNodeId: string;
  readonly sourcePortIndex: number;
  readonly sourcePos: Point;
  readonly currentPos: Point;
}

/** Options de gestion des callbacks de mutation et prévisualisation pointer. */
export interface PointerManagerOptions {
  readonly onMutate: (scenario: Scenario) => void;
  readonly onWirePreview?: (preview: WirePreview | null) => void;
  readonly onSelectNode?: (nodeId: string) => void;
  readonly onViewportChange?: (viewport: CanvasViewport) => void;
}
