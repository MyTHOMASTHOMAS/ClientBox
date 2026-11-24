/**
 * Logique applicative agents / profils (SVC-004).
 * AC-DATA-01-5 / R-05 / REQ-010 : refus de suppression d'un profil référencé.
 */

import type { ResourceStoreService } from '../resources/resource-store.service.js';
import { logStorageDeleteError } from '../../utils/logger/events/errors/storage-error.event.js';

/** Options pour le service de gestion des agents. */
export interface AgentServiceOptions {
  readonly store: ResourceStoreService;
}

/**
 * Service métier de gestion des agents et profils.
 */
export class AgentService {
  private readonly store: ResourceStoreService;

  constructor(options: AgentServiceOptions) {
    this.store = options.store;
  }

  /**
   * Supprime un profil si aucun agent ne le référence.
   *
   * @param profileId Identifiant du profil à supprimer
   */
  async deleteProfile(profileId: string) {
    const agents = await this.store.listAgents();
    const linked = agents.filter((agent) => agent.profilId === profileId);

    if (linked.length > 0) {
      logStorageDeleteError(`profils/${profileId}`, `Profil lié à ${linked.length} agent(s)`);
      const error = new Error(
        `Suppression du profil « ${profileId} » refusée : un ou plusieurs agents y sont référencés.`,
      ) as Error & { httpStatus: number };
      error.httpStatus = 409;
      throw error;
    }

    await this.store.deleteProfile(profileId);
  }
}
