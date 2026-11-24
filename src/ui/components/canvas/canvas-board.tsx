/**
 * Surface SVG du graphe nodal : nœuds, câbles, sélection et suppression de liaison.
 * @fileExemption Dépassement nominal justifié par le rendu SVG (grille, câbles sélectionnables, nœuds) et les callbacks de suppression.
 */

import { h } from 'preact';
import type { Scenario } from '../../../types/models/scenario.model.js';
import type { ScenarioNode } from '../../../types/models/node.model.js';
import type {
  CanvasDocument,
  ScenarioConnection,
  CanvasNodeViewModel,
  CanvasViewport,
} from '../../types/canvas.types.js';
import type { WirePreview } from '../../hooks/canvas/use-canvas-interactions.hook.js';
import { CanvasNode } from './canvas-node.js';
import { CanvasCable } from './canvas-cable.js';
import { calculatePortPosition } from '../../hooks/canvas/use-canvas-geometry.hook.js';

/** Propriétés du plateau de travail canvas. */
export interface CanvasBoardProps {
  readonly scenario?: Scenario;
  readonly document?: CanvasDocument;
  readonly selectedNodeId?: string | null;
  readonly selectedConnectionIndex?: number | null;
  readonly wirePreview?: WirePreview | null;
  readonly onSelectNode?: (nodeId: string) => void;
  readonly onSelectConnection?: (connectionIndex: number) => void;
  readonly onDeleteConnection?: (connectionIndex: number) => void;
  readonly onClearConnectionSelection?: () => void;
  /** Bloque câblage UI / suppression de liaison pendant un run (AC-UI-02-9). */
  readonly isInteractionLocked?: boolean;
  readonly onPortClick?: (
    nodeId: string,
    type: 'input' | 'output',
    portIndex: number,
    branch?: 'true' | 'false',
  ) => void;
  readonly viewport?: CanvasViewport;
}

function resolveBranch(nodeType?: string, portIndex?: number) {
  if (nodeType !== 'if') return undefined;
  if (portIndex === 0) return 'true' as const;
  return 'false' as const;
}

function cableEndpoints(conn: ScenarioConnection, nodes: readonly ScenarioNode[]) {
  const sourceNode = nodes.find((n) => n.id === conn.sourceNodeId);
  const targetNode = nodes.find((n) => n.id === conn.targetNodeId);
  const sPos = sourceNode ? sourceNode.position : { x: 0, y: 0 };
  const tPos = targetNode ? targetNode.position : { x: 0, y: 0 };
  const totalPorts = sourceNode?.type === 'if' ? 2 : 1;
  const sourcePos = calculatePortPosition({
    nodePos: sPos,
    nodeWidth: 256,
    nodeHeight: 80,
    type: 'output',
    portIndex: conn.sourcePortIndex,
    totalPorts,
  });
  const targetPos = calculatePortPosition({
    nodePos: tPos,
    nodeWidth: 256,
    nodeHeight: 80,
    type: 'input',
    portIndex: conn.targetPortIndex,
    totalPorts: 1,
  });
  return {
    sourceNode,
    sourcePos,
    targetPos,
    branch: resolveBranch(sourceNode?.type, conn.sourcePortIndex),
  };
}

/**
 * @complexityExemption Complexité cyclomatique modérée justifiée par le rendu conditionnel SVG (câbles, preview, ports, verrou interaction).
 * Surface principale de rendu SVG et VDOM du graphe nodal avec grille et câbles.
 * @param props Propriétés du composant
 */
function CanvasBoard(props: CanvasBoardProps) {
  const {
    scenario,
    document,
    selectedNodeId,
    selectedConnectionIndex = null,
    wirePreview,
    onSelectNode,
    onSelectConnection,
    onDeleteConnection,
    onClearConnectionSelection,
    isInteractionLocked = false,
    onPortClick,
    viewport = { pan: { x: 0, y: 0 }, zoom: 1.0 },
  } = props;
  const nodes = (scenario && scenario.nodes) || (document && document.nodes) || [];
  const connections =
    (scenario && scenario.connections) || (document && document.connections) || [];
  const renderNode = CanvasNode;
  const lockedPortClick = isInteractionLocked ? undefined : onPortClick;

  return (
    <div
      className="canvas-container relative w-full h-full overflow-hidden bg-surface-base select-none cursor-grab"
      data-interaction-locked={isInteractionLocked ? 'true' : 'false'}
    >
      <svg
        className="canvas-root absolute inset-0 w-full h-full pointer-events-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dot-grid"
            patternUnits="userSpaceOnUse"
            width={16 * viewport.zoom}
            height={16 * viewport.zoom}
            patternTransform={`translate(${viewport.pan.x}, ${viewport.pan.y})`}
          >
            <circle
              cx={1.5 * viewport.zoom}
              cy={1.5 * viewport.zoom}
              r={1 * viewport.zoom}
              className="fill-canvas-dot opacity-40"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#dot-grid)"
          onClick={() => onClearConnectionSelection?.()}
        />
        <g
          className="cables-layer"
          transform={`translate(${viewport.pan.x}, ${viewport.pan.y}) scale(${viewport.zoom})`}
        >
          {connections.map((conn: ScenarioConnection, idx: number) => {
            const { sourcePos, targetPos, branch } = cableEndpoints(conn, nodes);
            const cableClass = branch ? `cable cable-${branch}` : 'cable';
            return (
              <g
                key={`${conn.sourceNodeId}-${conn.targetNodeId}-${idx}`}
                data-branch={branch}
                className={cableClass}
              >
                <CanvasCable
                  connection={conn}
                  sourcePos={sourcePos}
                  targetPos={targetPos}
                  branch={branch}
                  isSelected={selectedConnectionIndex === idx}
                  onClick={() => {
                    if (isInteractionLocked) return;
                    onSelectConnection?.(idx);
                  }}
                  onDelete={() => {
                    if (isInteractionLocked) return;
                    onDeleteConnection?.(idx);
                  }}
                />
              </g>
            );
          })}
          {wirePreview && (
            <path
              d={wirePreview.pathData}
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="6,4"
              className="cable cable-preview pointer-events-none stroke-outline"
              data-cable-preview="true"
            />
          )}
        </g>
      </svg>
      <div
        className="relative w-full h-full pointer-events-none"
        style={{
          transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => (
          <div
            key={node.id}
            data-node-id={node.id}
            style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
            className="absolute w-64 pointer-events-auto"
          >
            {renderNode({
              node: node as unknown as CanvasNodeViewModel,
              isSelected: selectedNodeId === node.id,
              onSelect: onSelectNode,
              onPortClick: lockedPortClick,
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export { CanvasBoard };
