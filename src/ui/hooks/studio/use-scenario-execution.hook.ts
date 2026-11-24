/**
 * Hook d'orchestration pour le chargement, le streaming SSE et les interactions pointer du Studio.
 * @fileExemption Orchestration Studio : load/SSE/pointer délégués aux effets dédiés.
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { HttpClient } from '../../api/http.client.js';
import type { CanvasDocument, BooleanFlag } from '../../types/canvas.types.js';
import { createCanvasDocument } from '../canvas/canvas-document.factory.js';
import {
  safeUseState,
  useScenarioLoader,
  useScenarioStream,
  useScenarioPointer,
} from './studio-execution.effects.js';

/** Options du hook d'exécution Studio. */
export interface UseScenarioExecutionOptions {
  readonly scenarioId: string;
  readonly client: HttpClient | undefined;
  readonly doc: CanvasDocument;
  readonly setDoc: (setter: (prev: CanvasDocument) => CanvasDocument) => void;
  readonly setIsRunning: (isRunningState: boolean) => void;
  readonly setLaunchLocked?: (isLocked: boolean) => void;
  readonly setBusyMessage?: (message: string | null) => void;
  readonly onSelectNode?: (nodeId: string) => void;
  readonly isGraphLocked?: BooleanFlag;
  readonly onLoaded?: (scenario: Scenario) => void;
}

/** Résout l'état actif (props externes ou état local). */
function resolveStudioBindings(options: UseScenarioExecutionOptions) {
  const [doc, setDoc] = safeUseState(() => createCanvasDocument(options.scenarioId));
  const [isRunning, setIsRunning] = safeUseState(false);
  const [isLaunchLocked, setLaunchLocked] = safeUseState(false);
  const [busyMessage, setBusyMessage] = safeUseState<string | null>(null);
  return {
    doc: options.doc ?? doc,
    setDoc: options.setDoc ?? setDoc,
    setIsRunning: options.setIsRunning ?? setIsRunning,
    setLaunchLocked: options.setLaunchLocked ?? setLaunchLocked,
    setBusyMessage: options.setBusyMessage ?? setBusyMessage,
    isRunning,
    isLaunchLocked,
    busyMessage,
  };
}

/**
 * Orchestration complète du cycle de vie d'exécution d'un scénario.
 * @param options Options du hook
 */
function useScenarioExecution(options: UseScenarioExecutionOptions) {
  const state = resolveStudioBindings(options);
  useScenarioLoader({
    scenarioId: options.scenarioId,
    client: options.client,
    setDoc: state.setDoc,
    setIsRunning: state.setIsRunning,
    setLaunchLocked: state.setLaunchLocked,
    setBusyMessage: state.setBusyMessage,
    onLoaded: options.onLoaded,
  });
  useScenarioStream({
    scenarioId: options.scenarioId,
    client: options.client,
    doc: state.doc,
    setDoc: state.setDoc,
    setIsRunning: state.setIsRunning,
    setLaunchLocked: state.setLaunchLocked,
  });
  const pointer = useScenarioPointer({
    doc: state.doc,
    setDoc: state.setDoc,
    onSelectNode: options.onSelectNode,
    isGraphLocked: options.isGraphLocked,
  });
  return {
    ...pointer,
    doc: state.doc,
    setDoc: state.setDoc,
    isRunning: state.isRunning,
    isLaunchLocked: state.isLaunchLocked,
    isBusy: Boolean(state.busyMessage),
    busyMessage: state.busyMessage,
  };
}

export { useScenarioExecution };
export {
  attachCanvasInteractions,
  type CanvasInteractionsHandle,
  type WirePreview,
} from '../canvas/use-canvas-interactions.hook.js';
export {
  applyExecutionSnapshot,
  resolveExecutionLaunchLock,
  hydrateStudioExecution,
  EXECUTION_BUSY_OTHER_SCENARIO_MESSAGE,
  type ExecutionSnapshot,
  type ExecutionLaunchLockResult,
} from './studio-execution.hydrator.js';
