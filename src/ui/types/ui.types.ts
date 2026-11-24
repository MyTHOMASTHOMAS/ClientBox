/**
 * @fileExemption Dépassement nominal de 150 lignes justifié par le regroupement des contrats CRUD, types de formulaires et validateurs synchrones UI.
 * Modèles typés des formulaires CRUD, routes et flux du terminal UI.
 */

import type { ProfilePolicy } from '../../types/models/profile.model.js';

/** Alias de drapeau booléen compatible avec les conventions de nommage. */
export type BooleanFlag = true | false;

/** Types de flux filtrables dans le terminal. */
export type StreamFilterType = 'all' | 'engine' | 'stdout' | 'stderr' | string;

/** Option pour les composants de sélection déroulante. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: BooleanFlag;
}

/** Ligne de log dans le terminal d'exécution. */
export interface TerminalLine {
  readonly stream: 'stdout' | 'stderr' | 'engine';
  readonly text: string;
  readonly cssClass: string;
  readonly timestamp?: string;
}

/** État en mémoire du terminal web temps réel. */
export interface TerminalViewState {
  readonly scenarioId: string;
  readonly lines: readonly TerminalLine[];
  readonly persistsToDisk: BooleanFlag;
  readonly diskWriteCalls: number;
  readonly autoScroll: BooleanFlag;
}

/** État des filtres et options du terminal web. */
export interface TerminalFilterState {
  readonly activeFilter: StreamFilterType;
  readonly searchQuery: string;
  readonly autoScroll: BooleanFlag;
  readonly showTimestamps: BooleanFlag;
}

/** Valeurs du formulaire d'agent. */
export interface AgentFormValues {
  readonly id: string;
  readonly name: string;
  readonly profilId: string;
  readonly cliId: string;
}

/** Valeurs du formulaire de profil. */
export interface ProfileFormValues {
  readonly id: string;
  readonly name: string;
  readonly systemPrompt: string;
  readonly policy: ProfilePolicy;
  readonly model?: string;
}

/** Valeurs du formulaire de prompt. */
export interface PromptFormValues {
  readonly id: string;
  readonly name: string;
  readonly contenu: string;
}

/** Valeurs du formulaire d'ordre de sortie. */
export interface ExitFormValues {
  readonly id: string;
  readonly name: string;
  readonly contenu: string;
}

/** Catégories de ressources managées. */
export type ResourceKind = 'prompts' | 'exits' | 'scripts';

/** Élément de ressource générique pour l'affichage en table. */
export interface ResourceItem {
  readonly id: string;
  readonly name?: string;
  readonly content?: string;
  readonly kind: ResourceKind;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Valeurs du formulaire de scénario. */
export interface ScenarioFormValues {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly payload?: unknown;
}

/** Résultat d'une validation synchrone de formulaire. */
export interface FormValidationResult {
  readonly ok: BooleanFlag;
  readonly errors: readonly string[];
  readonly fieldErrors: Readonly<Record<string, string>>;
}

/** Options de validation incluant unicité et liste blanche. */
export interface ValidationOptions {
  readonly existingIds?: readonly string[];
  readonly allowedCliIds?: readonly string[];
}

/** Liste des champs requis pour un agent. */
export const AGENT_FORM_FIELDS = ['id', 'name', 'profilId', 'cliId'] as const;
/** Liste des champs requis pour un profil. */
export const PROFILE_FORM_FIELDS = ['id', 'name', 'systemPrompt', 'policy'] as const;
/** Liste des champs requis pour un prompt. */
export const PROMPT_FORM_FIELDS = ['id', 'name', 'contenu'] as const;
/** Liste des champs requis pour un ordre de sortie. */
export const EXIT_FORM_FIELDS = ['id', 'name', 'contenu'] as const;
/** Liste des champs requis pour un scénario. */
export const SCENARIO_FORM_FIELDS = ['id', 'name', 'description', 'payload'] as const;

/** Politiques d'injection de prompt supportées. */
export const PROFILE_POLICY_OPTIONS: readonly ProfilePolicy[] = [
  'chaque_prompt',
  'debut_scenario',
  'une_fois_jusqu_a_clear',
] as const;

/** Options de sélection pour les politiques de profil. */
export const PROFILE_POLICY_SELECT_OPTIONS: readonly SelectOption[] = [
  { value: 'chaque_prompt', label: 'Chaque prompt' },
  { value: 'debut_scenario', label: 'Début de scénario' },
  { value: 'une_fois_jusqu_a_clear', label: 'Une fois jusqu’à réinitialisation' },
];

/** Contrat minimal d'un registre d'adaptateurs pour la sélection CLI. */
export interface CliAdapterSource {
  readonly listOperationalAdapters: () => readonly {
    readonly cliId: string;
    readonly name?: string;
  }[];
}

function resolveDefaultAdapterLabel(cliId: string) {
  if (cliId === 'cursor-cli') return 'Cursor CLI';
  if (cliId === 'antigravity') return 'Antigravity CLI';
  if (cliId === 'codex-cli') return 'Codex CLI';
  if (cliId === 'claude-cli') return 'Claude CLI';
  return cliId;
}

/**
 * Construit la liste des options pour le sélecteur d'adaptateur CLI.
 * @param registry Registre d'adaptateurs opérationnels
 */
export function getCliSelectOptions(registry: CliAdapterSource) {
  const adapters = registry.listOperationalAdapters();
  return adapters.map((adapter) => ({
    value: adapter.cliId,
    label: adapter.name ?? resolveDefaultAdapterLabel(adapter.cliId),
  }));
}

/**
 * Valide les champs du formulaire d'agent.
 * @param values Valeurs partielles ou complètes du formulaire
 * @param options Options de validation optionnelles
 */
export function validateAgentForm(values: Partial<AgentFormValues>, options?: ValidationOptions) {
  const fieldErrors: Record<string, string> = {};
  if (!values.id?.trim()) fieldErrors.id = "L'identifiant de l'agent est obligatoire.";
  else if (options?.existingIds?.includes(values.id.trim()))
    fieldErrors.id = 'Cet identifiant est déjà utilisé par un autre agent. Collision refusée.';
  if (!values.name?.trim()) fieldErrors.name = "Le nom de l'agent est requis.";
  if (!values.profilId?.trim())
    fieldErrors.profilId = 'Le profil associé est manquant ou invalide.';
  const allowed = options?.allowedCliIds ?? [
    'cursor-cli',
    'antigravity',
    'codex-cli',
    'claude-cli',
  ];
  if (!values.cliId?.trim()) fieldErrors.cliId = "Le choix d'un CLI opérationnel est obligatoire.";
  else if (!allowed.includes(values.cliId))
    fieldErrors.cliId = `L'adaptateur CLI « ${values.cliId} » n'est pas disponible ou non supporté.`;
  const errors = Object.values(fieldErrors);
  return { ok: (errors.length === 0) as BooleanFlag, errors, fieldErrors };
}

/**
 * Valide les champs du formulaire de profil.
 * @param values Valeurs partielles ou complètes du formulaire
 * @param options Options de validation optionnelles
 */
export function validateProfileForm(
  values: Partial<ProfileFormValues>,
  options?: ValidationOptions,
) {
  const fieldErrors: Record<string, string> = {};
  if (!values.id?.trim()) fieldErrors.id = "L'identifiant du profil est obligatoire.";
  else if (options?.existingIds?.includes(values.id.trim()))
    fieldErrors.id = 'Cet identifiant est déjà utilisé par un profil existant.';
  if (!values.name?.trim()) fieldErrors.name = 'Le nom du profil est requis.';
  if (!values.systemPrompt?.trim()) fieldErrors.systemPrompt = 'Le prompt système est obligatoire.';
  const validPolicies: readonly string[] = PROFILE_POLICY_OPTIONS;
  if (!values.policy || !validPolicies.includes(values.policy))
    fieldErrors.policy = 'La politique de prompt sélectionnée est invalide.';
  const errors = Object.values(fieldErrors);
  return { ok: (errors.length === 0) as BooleanFlag, errors, fieldErrors };
}

/**
 * Valide les champs du formulaire de prompt.
 * @param values Valeurs partielles ou complètes du formulaire
 */
export function validatePromptForm(values: Partial<PromptFormValues>) {
  const fieldErrors: Record<string, string> = {};
  if (!values.id?.trim()) fieldErrors.id = "L'identifiant du prompt est obligatoire.";
  if (!values.name?.trim()) fieldErrors.name = 'Le nom du prompt est requis.';
  if (!values.contenu?.trim()) fieldErrors.contenu = 'Le contenu du prompt est obligatoire.';
  const errors = Object.values(fieldErrors);
  return { ok: (errors.length === 0) as BooleanFlag, errors, fieldErrors };
}

/**
 * Valide les champs du formulaire d'ordre de sortie.
 * @param values Valeurs partielles ou complètes du formulaire
 */
export function validateExitForm(values: Partial<ExitFormValues>) {
  const fieldErrors: Record<string, string> = {};
  if (!values.id?.trim()) fieldErrors.id = "L'identifiant de l'ordre de sortie est obligatoire.";
  if (!values.name?.trim()) fieldErrors.name = "Le nom de l'ordre de sortie est requis.";
  if (!values.contenu?.trim())
    fieldErrors.contenu = "Le contenu de l'ordre de sortie est obligatoire.";
  const errors = Object.values(fieldErrors);
  return { ok: (errors.length === 0) as BooleanFlag, errors, fieldErrors };
}

/**
 * Valide les champs du formulaire de scénario.
 * @param values Valeurs partielles ou complètes du formulaire
 */
export function validateScenarioForm(values: Partial<ScenarioFormValues>) {
  const fieldErrors: Record<string, string> = {};
  if (!values.id?.trim()) fieldErrors.id = "L'identifiant du scénario est obligatoire.";
  if (!values.name?.trim()) fieldErrors.name = 'Le nom du scénario est requis.';
  const errors = Object.values(fieldErrors);
  return { ok: (errors.length === 0) as BooleanFlag, errors, fieldErrors };
}
