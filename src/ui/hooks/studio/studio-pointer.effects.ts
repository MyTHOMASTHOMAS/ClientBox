/**
 * Effet pointer Studio : attache interactions canvas et verrou graphe.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type {
  CanvasDocument,
  ScenarioConnection,
  BooleanFlag,
  CanvasViewport,
} from '../../types/canvas.types.js';
import {
  attachCanvasInteractions,
  type CanvasInteractionsHandle,
  type WirePreview,
} from '../canvas/use-canvas-interactions.hook.js';
import { INITIAL_CANVAS_VIEWPORT } from '../canvas/use-canvas-viewport.hook.js';
import { safeUseEffect, safeUseRef, safeUseState } from './studio-preact-safe.helper.js';

/** Options internes du gestionnaire pointer. */
export interface ScenarioPointerOptions {
  readonly doc: CanvasDocument;
  readonly setDoc: (setter: (prev: CanvasDocument) => CanvasDocument) => void;
  readonly onSelectNode?: (nodeId: string) => void;
  readonly isGraphLocked?: BooleanFlag;
}

function toScenario(doc: CanvasDocument) {
  return {
    id: doc.scenarioId,
    name: doc.name || doc.scenarioId,
    nodes: [...doc.nodes],
    connections: [...doc.connections],
  } as Scenario;
}

/**
 * @functionExemption Corps un peu long justifié par attache pointer, sync doc et verrou interaction.
 * Attache les interactions pointer du canvas Studio.
 * @param options Options pointer
 */
function useScenarioPointer(options: ScenarioPointerOptions) {
  const { doc, setDoc, onSelectNode, isGraphLocked = false } = options;
  const boardContainerRef = safeUseRef<HTMLDivElement | null>(null);
  const handleRef = safeUseRef<CanvasInteractionsHandle | null>(null);
  const [wirePreview, setWirePreview] = safeUseState<WirePreview | null>(null);
  const [viewport, setViewport] = safeUseState<CanvasViewport>(INITIAL_CANVAS_VIEWPORT);

  safeUseEffect(() => {
    if (!boardContainerRef.current) return;
    const handle = attachCanvasInteractions(boardContainerRef.current, toScenario(doc), {
      onMutate: (mutated) => {
        setDoc((prev) => ({
          ...prev,
          nodes: [...mutated.nodes],
          connections: [...mutated.connections] as ScenarioConnection[],
        }));
      },
      onWirePreview: setWirePreview,
      onSelectNode,
      onViewportChange: setViewport,
    });
    handle.setInteractionLocked(Boolean(isGraphLocked));
    handleRef.current = handle;
    return () => {
      handle.detach();
      handleRef.current = null;
      setWirePreview(null);
    };
  }, [doc.scenarioId]);

  safeUseEffect(() => {
    handleRef.current?.updateDoc(toScenario(doc));
  }, [doc]);

  safeUseEffect(() => {
    handleRef.current?.setInteractionLocked(Boolean(isGraphLocked));
  }, [isGraphLocked]);

  return { boardContainerRef, wirePreview, viewport };
}

export { useScenarioPointer };
