/**
 * Effets Preact du Studio : chargement scénario et flux SSE.
 */

import { safeUseEffect } from './studio-preact-safe.helper.js';
import { applyNouveauDraft, loadExistingScenario } from './studio-loader.helper.js';
import { applyStreamStatus, applyStreamBlockStatus } from './studio-stream.helper.js';
import type { ScenarioLoaderOptions, ScenarioStreamOptions } from './studio-execution.options.js';

export type { ScenarioLoaderOptions, ScenarioStreamOptions } from './studio-execution.options.js';
export { safeUseEffect, safeUseRef, safeUseState } from './studio-preact-safe.helper.js';
export { useScenarioPointer, type ScenarioPointerOptions } from './studio-pointer.effects.js';

/**
 * Charge le scénario et réhydrate l'état d'exécution.
 * @param options Options du chargeur
 */
export function useScenarioLoader(options: ScenarioLoaderOptions) {
  const { scenarioId, client } = options;
  safeUseEffect(() => {
    if (!client) return;
    if (scenarioId === 'scenario-nouveau') {
      applyNouveauDraft(options);
      return;
    }
    let isCancelled = false;
    void loadExistingScenario(options, () => isCancelled);
    return () => {
      isCancelled = true;
    };
  }, [client, scenarioId]);
}

/**
 * Abonne le Studio au flux SSE d'exécution.
 * @param options Options d'exécution Studio
 */
export function useScenarioStream(options: ScenarioStreamOptions) {
  const { scenarioId, client, setDoc } = options;
  safeUseEffect(() => {
    if (!client || !client.subscribeStream || scenarioId === 'scenario-nouveau') return undefined;
    const unsubscribe = client.subscribeStream(`/api/scenarios/${scenarioId}/stream`, {
      onStatusChange: (status: string) => applyStreamStatus(options, status),
      onBlockStatus: (raw: unknown) => applyStreamBlockStatus(setDoc, raw),
    });
    return () => {
      unsubscribe();
    };
  }, [client, scenarioId]);
}
