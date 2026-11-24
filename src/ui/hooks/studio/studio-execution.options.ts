/**
 * Contrats d'options des effets Studio (loader / stream).
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { HttpClient } from '../../api/http.client.js';
import type { CanvasDocument } from '../../types/canvas.types.js';

/** Options internes du chargeur de scénario. */
export interface ScenarioLoaderOptions {
  readonly scenarioId: string;
  readonly client: HttpClient | undefined;
  readonly setDoc: (setter: (prev: CanvasDocument) => CanvasDocument) => void;
  readonly setIsRunning: (isRunningState: boolean) => void;
  readonly setLaunchLocked?: (isLocked: boolean) => void;
  readonly setBusyMessage?: (message: string | null) => void;
  readonly onLoaded?: (scenario: Scenario) => void;
}

/** Options SSE partagées avec le hook Studio. */
export interface ScenarioStreamOptions {
  readonly scenarioId: string;
  readonly client: HttpClient | undefined;
  readonly doc: CanvasDocument;
  readonly setDoc: (setter: (prev: CanvasDocument) => CanvasDocument) => void;
  readonly setIsRunning: (isRunningState: boolean) => void;
  readonly setLaunchLocked?: (isLocked: boolean) => void;
}
