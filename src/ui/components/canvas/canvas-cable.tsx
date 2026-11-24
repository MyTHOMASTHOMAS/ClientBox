import { h } from 'preact';
import type { ScenarioConnection, Point } from '../../types/canvas.types.js';
import { calculateCubicBezier } from '../../hooks/canvas/use-canvas-geometry.hook.js';
import { IF_BRANCH_VISUALS } from './canvas-node.js';

/**
 * Représentation visuelle calculée pour un câble SVG.
 */
export interface CableVisual {
  readonly connection: ScenarioConnection;
  readonly branch?: 'true' | 'false';
  readonly cssClass: string;
}

/**
 * Détermine les classes CSS et attributs visuels du câble en fonction de la branche conditionnelle.
 * @param connection Modèle de la connexion nodale
 * @param branch Type de branche If éventuelle ('true' | 'false')
 */
export function buildCableVisual(connection: ScenarioConnection, branch?: 'true' | 'false') {
  let cssClass = 'stroke-[#334155]';
  if (branch === 'true') {
    cssClass = IF_BRANCH_VISUALS.true.cssClass;
  } else if (branch === 'false') {
    cssClass = IF_BRANCH_VISUALS.false.cssClass;
  }
  return { connection, branch, cssClass };
}

/**
 * Propriétés du composant VDOM CanvasCable.
 */
export interface CanvasCableProps {
  readonly connection: ScenarioConnection;
  readonly sourcePos: Point;
  readonly targetPos: Point;
  readonly branch?: 'true' | 'false';
  readonly isSelected?: boolean;
  readonly isActive?: boolean;
  readonly onClick?: () => void;
  readonly onDelete?: () => void;
}

/**
 * Rendu SVG d'une courbe de Bézier cubique pour un câble entre deux blocs nodaux.
 * Premier clic (onClick) sélectionne ; si sélectionné, option « Supprimer » (onDelete).
 * @param props Propriétés du composant câble
 */
export function CanvasCable(props: CanvasCableProps) {
  const {
    connection,
    sourcePos,
    targetPos,
    branch,
    isSelected = false,
    isActive = false,
    onClick,
    onDelete,
  } = props;
  const { pathData, midpoint } = calculateCubicBezier(sourcePos, targetPos);
  const visual = buildCableVisual(connection, branch);
  const labelText = `${connection.key} (p=${connection.power ?? 1})`;
  const badgeWidth = Math.max(50, Math.ceil(labelText.length * 6 + 16));

  return (
    <g onClick={onClick} className="cursor-pointer group">
      <path d={pathData} fill="none" stroke="transparent" strokeWidth="14" />
      <path
        d={pathData}
        fill="none"
        strokeWidth={isSelected ? '2.5' : '1.5'}
        strokeDasharray={isActive ? '6,4' : undefined}
        data-branch={branch}
        className={`cable ${branch ? `cable-${branch}` : ''} ${visual.cssClass} transition-all ${
          isActive ? 'animate-pulse' : ''
        } ${isSelected ? 'stroke-border-focus' : 'group-hover:stroke-outline'}`}
      />
      <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
        <rect
          x={-badgeWidth / 2}
          y="-10"
          width={badgeWidth}
          height="20"
          rx="4"
          className="fill-surface-base stroke-border-default shadow-md"
        />
        <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="central"
          className="fill-primary font-mono text-[9px] font-semibold select-none"
        >
          {labelText}
        </text>
      </g>
      {isSelected && (
        <g
          transform={`translate(${midpoint.x}, ${midpoint.y + 22})`}
          data-action="delete-connection"
          onClick={(event: Event) => {
            event.stopPropagation();
            onDelete?.();
          }}
        >
          <rect
            x="-36"
            y="-10"
            width="72"
            height="20"
            rx="4"
            className="fill-status-error/15 stroke-status-error/40"
          />
          <text
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="central"
            className="fill-status-error font-mono text-[9px] font-semibold select-none"
          >
            Supprimer
          </text>
        </g>
      )}
    </g>
  );
}
