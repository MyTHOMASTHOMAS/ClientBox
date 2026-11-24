/**
 * Dictionnaire linguistique 100% français de ClientsBox.
 * Centralisation intégrale des libellés du chrome, menus, dialogues et messages d'erreur.
 */

/**
 * Liste des termes anglais génériques proscrits de l'interface graphique.
 */
export const ENGLISH_DENY_LIST = [
  'Submit',
  'Cancel',
  'Save',
  'Delete',
  'Settings',
  'Loading',
  'Error',
] as const;

/**
 * Termes techniques universels et noms d'outils autorisés sans traduction française.
 */
export const TECH_ALLOW_LIST = [
  'Start',
  'Run',
  'If',
  'cursor-cli',
  'antigravity',
  'codex-cli',
  'claude-cli',
  'claude-code',
  'gemini',
  'copilot',
  'qwen-coder',
  'JSON',
  'CLI',
  'DOM',
  'URL',
  'PID',
  'API',
  'HTTP',
  'SSE',
  'DAG',
  'JS',
] as const;

/**
 * Catalogue centralisé des libellés francophones pour le chrome, les menus et les dialogues.
 */
export const UI_FR_CATALOG = {
  nav: [
    'Accueil',
    'Scénarios',
    'Agents',
    'Profils',
    'Prompts',
    'Conditions Exit',
    'Scripts If',
    'Paramètres',
    'Instructions',
  ],
  blocks: {
    start: 'Start',
    run: 'Run',
    if: 'If',
    clearContext: 'ClearContext',
  },
  status: {
    idle: 'Inactif',
    running: 'En cours',
    paused: 'En pause',
    completed: 'Terminé',
    error: 'Erreur',
  },
  branches: {
    true: 'Vrai',
    false: 'Faux',
  },
  actions: {
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    close: 'Fermer',
    launch: 'Lancer le scénario',
    stop: 'Arrêter tout',
    autoScroll: 'Auto-scroll',
    timestamps: 'Horodatage',
    clearLogs: 'Vider le terminal',
  },
  docs: {
    pageTitle: 'Instructions',
    pageSubtitle: "Documentation d'utilisation du binaire ClientsBox",
    exportAction: 'Enregistrer dans le dossier local',
    exporting: 'Enregistrement…',
    exportSuccessPrefix: 'Documentation enregistrée dans',
    exportError: "Impossible d'enregistrer la documentation dans le dossier local.",
    loadError: 'Impossible de charger la documentation.',
    toc: 'Sommaire',
    empty: 'Aucune documentation disponible.',
  },
  confirms: [
    'Êtes-vous certain de vouloir supprimer cette ressource ? Cette action est irréversible.',
    "La ressource a été enregistrée avec succès dans l'espace de données.",
    'Le scénario a été interrompu et le processus a été stoppé avec succès.',
    "Le contexte de l'agent a été effacé avec succès.",
  ],
  errors: [
    'Le champ sélectionné est obligatoire ou incomplet. Veuillez renseigner une valeur valide.',
    "Un seul bloc Start est autorisé par scénario. L'ajout d'un second déclencheur est interdit.",
    "La clé d'entrée demandée est déjà assignée sur ce nœud cible. Les collisions sont rejetées.",
    "L'adaptateur CLI sélectionné n'est pas opérationnel ou introuvable sur le système.",
    "Le service local est temporairement indisponible. Veuillez vérifier l'état du serveur.",
    "Ressource introuvable. L'élément requis n'existe pas dans le répertoire local.",
  ],
} as const;

/**
 * Collecte exhaustive de l'ensemble des chaînes visibles du catalogue pour audit linguistique.
 */
export function collectChromeStrings() {
  const strings: string[] = [];
  strings.push(...UI_FR_CATALOG.nav);
  strings.push(...Object.values(UI_FR_CATALOG.status));
  strings.push(...Object.values(UI_FR_CATALOG.branches));
  strings.push(...Object.values(UI_FR_CATALOG.actions));
  strings.push(...Object.values(UI_FR_CATALOG.docs));
  strings.push(...UI_FR_CATALOG.confirms);
  strings.push(...UI_FR_CATALOG.errors);
  return strings;
}
