/**
 * Table des sessions conversationnelles d'une exécution de scénario (SPEC-ADPT-03).
 * Vit en mémoire le temps d'une exécution : jamais persistée, jamais partagée entre exécutions.
 */

import type { CLIAdapter } from '../../../types/contracts/cli-adapter.contract.js';

/**
 * Associe chaque agent à sa session de scénario, créée au premier Run de l'agent.
 */
export class ScenarioSessionRegistry {
  private readonly sessions = new Map<string, Promise<string>>();

  /**
   * Retourne la session de l'agent, en la créant via l'adapter si elle n'existe pas.
   * Des Runs parallèles du même agent partagent la même création.
   * Pour les adaptateurs à extraction paresseuse (`extractSessionId`), la session est capturée
   * dynamiquement au premier Run sans amorce préalable.
   *
   * @param agentId Identifiant de l'agent
   * @param adapter Adapter CLI de l'agent
   * @param workspacePath Répertoire de travail du scénario
   * @returns Identifiant de session, ou `undefined` si l'adapter ne gère pas les sessions
   */
  async resolve(agentId: string, adapter: CLIAdapter, workspacePath: string) {
    const existing = this.sessions.get(agentId);
    if (existing) {
      return existing;
    }
    if (adapter.extractSessionId) {
      return undefined;
    }
    if (!adapter.createSession) {
      return undefined;
    }
    let pending = this.sessions.get(agentId);
    if (!pending) {
      pending = adapter.createSession({ agentId, workspacePath, assembledPrompt: '' });
      this.sessions.set(agentId, pending);
      const created = pending;
      void created.then(undefined, () => {
        if (this.sessions.get(agentId) === created) this.sessions.delete(agentId);
      });
    }
    return pending;
  }

  /**
   * Enregistre dynamiquement une session capturée en cours d'exécution.
   *
   * @param agentId Identifiant de l'agent
   * @param sessionId Identifiant de session capturé
   */
  setSession(agentId: string, sessionId: string) {
    if (!this.sessions.has(agentId)) {
      this.sessions.set(agentId, Promise.resolve(sessionId));
    }
  }

  /**
   * Oublie la session de l'agent : son prochain Run ouvrira une nouvelle session (ClearContext).
   *
   * @param agentId Identifiant de l'agent
   */
  forget(agentId: string) {
    this.sessions.delete(agentId);
  }
}
