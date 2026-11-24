/**
 * Registre des adapters CLI opérationnels embarqués (SVC-003 / R-04 / R-28).
 */

import type { CLIAdapter } from '../../types/contracts/cli-adapter.contract.js';

async function fetchAdapterModels(adapter: CLIAdapter) {
  if (typeof adapter.listModels !== 'function') return [];
  return adapter.listModels();
}

function mergeUniqueModels(existing: readonly string[], additions: readonly string[]) {
  const merged = [...existing];
  for (const m of additions) {
    if (!merged.includes(m)) {
      merged.push(m);
    }
  }
  return merged;
}

/**
 * Registre des adapters CLI opérationnels embarqués (SVC-003 / R-04 / R-28).
 */
export class AdapterRegistryService {
  private readonly adapters: readonly CLIAdapter[];

  constructor(adapters: readonly CLIAdapter[]) {
    this.adapters = [...adapters];
  }

  /**
   * Liste l'ensemble des adapters CLI opérationnels disponibles.
   *
   * @returns Liste des adapters
   */
  listOperationalAdapters() {
    return this.adapters;
  }

  /**
   * Récupère un adaptateur CLI par son identifiant.
   *
   * @param cliId Identifiant de l'outil CLI
   * @returns Adaptateur trouvé ou undefined
   */
  getAdapter(cliId: string) {
    return this.adapters.find((adapter) => adapter.cliId === cliId);
  }

  /**
   * Énumère l'ensemble des modèles supportés par l'adaptateur ciblé ou par l'ensemble des adaptateurs.
   *
   * @param cliId Identifiant optionnel de l'adaptateur CLI ciblé
   * @returns Liste des identifiants de modèles supportés
   */
  async listOperationalModels(cliId?: string) {
    if (cliId) {
      const target = this.adapters.find((a) => a.cliId === cliId);
      if (target && typeof target.listModels === 'function') {
        return target.listModels();
      }
    }
    let allModels: readonly string[] = [];
    for (const adapter of this.adapters) {
      const models = await fetchAdapterModels(adapter);
      allModels = mergeUniqueModels(allModels, models);
    }
    return allModels;
  }
}
