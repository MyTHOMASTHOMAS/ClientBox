/**
 * Helpers du chargeur Studio (draft + hydratation async).
 */

import type { Scenario } from '../../../types/models/scenario.model.js';
import type { HttpClient } from '../../api/http.client.js';
import type { CanvasDocument } from '../../types/canvas.types.js';
import { createCanvasDocument } from '../canvas/canvas-document.factory.js';
import { hydrateStudioExecution } from './studio-execution.hydrator.js';
import type { ScenarioLoaderOptions } from './studio-execution.options.js';

/**
 * Charge la liste des scénarios pour le dropdown CallScenario.
 *
 * @param client Client HTTP Studio
 */
export async function fetchScenarioSelectOptions(client: HttpClient) {
  const list = await client.get<readonly Scenario[]>('/api/scenarios');
  return list.map((scenario) => ({
    id: scenario.id,
    label: scenario.name?.trim() || scenario.id,
  }));
}

/**
 * Initialise un brouillon « Nouveau Scénario ».
 * @param options Options du chargeur
 */
export function applyNouveauDraft(options: ScenarioLoaderOptions) {
  const draft: Scenario = {
    id: options.scenarioId,
    name: 'Nouveau Scénario',
    nodes: [],
    connections: [],
  };
  options.setDoc(() => createCanvasDocument(options.scenarioId, draft));
  options.setIsRunning(false);
  options.setLaunchLocked?.(false);
  options.setBusyMessage?.(null);
}

/**
 * Charge un scénario existant et réhydrate l'état d'exécution.
 * @param options Options du chargeur
 * @param isCancelled Guard d'annulation
 */
export async function loadExistingScenario(
  options: ScenarioLoaderOptions,
  isCancelled: () => boolean,
) {
  const { scenarioId, client, setDoc, setIsRunning, setLaunchLocked, setBusyMessage } = options;
  if (!client) return;
  try {
    const data = await client.get<Scenario>(`/api/scenarios/${scenarioId}`);
    if (isCancelled() || !data) return;
    setDoc(() => createCanvasDocument(scenarioId, data));
    options.onLoaded?.(data);
    const hydrated = await hydrateStudioExecution({
      scenarioId,
      client,
      nodes: data.nodes ?? [],
    });
    if (isCancelled()) return;
    setIsRunning(hydrated.isRunning);
    setLaunchLocked?.(hydrated.isLaunchDisabled);
    setBusyMessage?.(hydrated.message);
    if (!hydrated.isForeignRun) {
      setDoc((prev) => ({
        ...prev,
        nodes: hydrated.nodes as CanvasDocument['nodes'],
      }));
    }
  } catch (err: unknown) {
    void err;
  }
}
