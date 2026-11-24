/**
 * @fileExemption Dépassement du seuil nominal de 150 lignes justifié par la centralisation de la façade CRUD et de la persistance atomique disque pour l'intégralité des 6 ressources déclaratives et scripts.
 * Façade CRUD vers `.agents/data/` (SVC-002) — sous-ensemble DATA-01/02/03/04.
 * I/O déléguée à `lib/fs/*` uniquement (SPEC-ARCH-03).
 */

import type { Agent } from '../../types/models/agent.model.js';
import type { Profile } from '../../types/models/profile.model.js';
import type { Prompt } from '../../types/models/prompt.model.js';
import type { ExitCondition } from '../../types/models/exit-condition.model.js';
import { atomicWriteJson } from '../../lib/fs/json-atomic-writer.fs.js';
import {
  fileExists,
  joinPaths,
  listFiles,
  readJsonFile,
} from '../../lib/fs/json-fresh-reader.fs.js';
import { deleteFile } from '../../lib/fs/file-remover.fs.js';
import {
  logResourceSaved,
  logResourceDeleted,
  logResourceLoaded,
} from '../../utils/logger/events/info/storage-info.event.js';
import {
  listIfScripts as listIfScriptsOnDisk,
  deleteIfScript as deleteIfScriptOnDisk,
  resolveIfScriptPath as resolveIfScriptPathOnDisk,
  readIfScript as readIfScriptOnDisk,
  getIfScriptOrNull,
  type ListIfScriptsOptions,
} from './if-script-storage.helper.js';
import * as scenarioAccess from './scenario-storage.helper.js';
import type { Scenario } from '../../types/models/scenario.model.js';

export type { ListIfScriptsOptions };

/** Options de configuration pour le store de ressources. */
export interface ResourceStoreOptions {
  readonly dataRoot: string;
}

/**
 * Service d'accès et de persistance atomique des ressources déclaratives.
 */
export class ResourceStoreService {
  private readonly dataRoot: string;

  constructor(options: ResourceStoreOptions) {
    this.dataRoot = options.dataRoot;
  }

  private resolveEntityDir(subdir: string) {
    let dir = joinPaths(this.dataRoot, subdir);
    if (!fileExists(dir) && (subdir === 'profils' || subdir === 'profiles')) {
      const altDir = joinPaths(this.dataRoot, subdir === 'profils' ? 'profiles' : 'profils');
      if (fileExists(altDir)) dir = altDir;
    }
    return dir;
  }

  listEntities<T>(subdir: string) {
    const dir = this.resolveEntityDir(subdir);
    return fileExists(dir)
      ? listFiles(dir, '.json').map((f) => readJsonFile<T>(joinPaths(dir, f)))
      : [];
  }

  getEntity<T>(subdir: string, id: string) {
    let filePath = joinPaths(this.dataRoot, subdir, `${id}.json`);
    if (!fileExists(filePath) && (subdir === 'profils' || subdir === 'profiles')) {
      const alt = subdir === 'profils' ? 'profiles' : 'profils';
      const altPath = joinPaths(this.dataRoot, alt, `${id}.json`);
      if (fileExists(altPath)) filePath = altPath;
    }
    const result = fileExists(filePath) ? readJsonFile<T>(filePath) : null;
    if (result) logResourceLoaded(subdir, id);
    return result;
  }

  saveEntity<T extends { id: string }>(subdir: string, item: T) {
    atomicWriteJson(joinPaths(this.dataRoot, subdir, `${item.id}.json`), item);
    logResourceSaved(subdir, item.id);
    return item;
  }

  removeEntity(subdir: string, id: string) {
    deleteFile(joinPaths(this.dataRoot, subdir, `${id}.json`));
    logResourceDeleted(subdir, id);
  }

  async listAgents() {
    return this.listEntities<Agent>('agents');
  }
  async getAgent(id: string) {
    const item = this.getEntity<Agent>('agents', id);
    if (!item) throw new Error(`Agent introuvable : ${id} — fichier absent`);
    return item;
  }
  async createAgent(agent: Agent) {
    return this.saveEntity('agents', agent);
  }
  async updateAgent(id: string, agent: Agent) {
    return this.saveEntity('agents', { ...agent, id });
  }
  async deleteAgent(id: string) {
    this.removeEntity('agents', id);
  }

  async listProfils() {
    return this.listEntities<Profile>('profils');
  }
  async getProfil(id: string) {
    return this.getEntity<Profile>('profils', id);
  }
  async createProfil(profile: Profile) {
    return this.saveEntity('profils', profile);
  }
  async updateProfil(id: string, profile: Profile) {
    return this.saveEntity('profils', { ...profile, id });
  }
  async deleteProfil(id: string) {
    this.removeEntity('profils', id);
  }
  async deleteProfile(id: string) {
    this.removeEntity('profils', id);
  }

  async listPrompts() {
    return this.listEntities<Prompt>('prompts');
  }
  async getPrompt(id: string) {
    return this.getEntity<Prompt>('prompts', id);
  }
  async createPrompt(prompt: Prompt) {
    return this.saveEntity('prompts', prompt);
  }
  async updatePrompt(id: string, prompt: Prompt) {
    return this.saveEntity('prompts', { ...prompt, id });
  }
  async deletePrompt(id: string) {
    this.removeEntity('prompts', id);
  }

  async listExitConditions() {
    return this.listEntities<ExitCondition>('exit');
  }
  async getExitCondition(id: string) {
    return this.getEntity<ExitCondition>('exit', id);
  }
  async createExitCondition(c: ExitCondition) {
    return this.saveEntity('exit', c);
  }
  async updateExitCondition(id: string, c: ExitCondition) {
    return this.saveEntity('exit', { ...c, id });
  }
  async deleteExitCondition(id: string) {
    this.removeEntity('exit', id);
  }

  async listScenarios() {
    return scenarioAccess.listScenarios(this);
  }
  async getScenario(id: string) {
    return scenarioAccess.getScenario(this, id);
  }
  async createScenario(scenario: Scenario) {
    return scenarioAccess.createScenario(this, scenario);
  }
  async updateScenario(idOrScenario: string | Scenario, maybeScenario?: Scenario) {
    return scenarioAccess.updateScenario(this, idOrScenario, maybeScenario);
  }
  async deleteScenario(id: string) {
    scenarioAccess.deleteScenario(this, id);
  }

  listIfScripts(options: ListIfScriptsOptions = {}) {
    return listIfScriptsOnDisk(this.dataRoot, options);
  }
  async deleteIfScript(id: string) {
    deleteIfScriptOnDisk(this.dataRoot, id);
  }
  resolveIfScriptPath(id: string) {
    return resolveIfScriptPathOnDisk(this.dataRoot, id);
  }
  readIfScript(id: string) {
    return readIfScriptOnDisk(this.dataRoot, id);
  }
  async getIfScript(id: string) {
    return getIfScriptOrNull(this.dataRoot, id);
  }
}
