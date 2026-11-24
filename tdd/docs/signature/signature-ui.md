# Signature de Domaine — `src/ui/` (Palier 7 : Interface Utilisateur Web Clean Code)

**Date de signature :** 29/10/2026 *(Alignement Design System Maquettes "ClientsBox IDE System" & Preact TSX)*  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `UI`  
**Couche DAG :** `7-ui` *(Interface Utilisateur Navigateur — Rendu réactif déclaratif, état visuel et canvas de flux)*  
**Peut importer :** `types/`, `utils/`, `domain/` *(logique graphe pure et isomorphe)*  
**Peut être importé par :** *Navigateur Web* *(distribution in-memory via `embedded-assets.generated.ts` per ADR-012 ; aucun import direct par `index.ts`)*  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`, `SPEC-ARCH-08`), [`UI.md`](../specs/UI.md) (`SPEC-UI-01`..`04`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-02`, `SPEC-DATA-03`, `SPEC-DATA-05`), maquettes fonctionnelles (`.local/stitch_maquettes_application_fonctionnelle/`), décisions d'architecture ([`ADR-001`](../adr/ADR-001-socle-applicatif.md), [`ADR-002`](../adr/ADR-002-gestionnaire-de-processus-cli.md), [`ADR-004`](../adr/ADR-004-moteur-de-blocs-en-memoire.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md), [`ADR-012`](../adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md), [`ADR-017`](../adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`ui/`** matérialise le **Palier 7 et l'interface utilisateur web** de ClientsBox v1.  
Cette refonte totale Clean Code structure l'ensemble de l'IHM selon les principes d'ingénierie logicielle les plus rigoureux et s'inspire directement du Design System haute densité **ClientsBox IDE System** (`DESIGN.md` et maquettes `e01` à `e08`) :
- **Séparation stricte des responsabilités (SoC) :** découplage total entre transport réseau (`api/`), dictionnaire linguistique (`i18n/`), typage strict (`types/`), logique réactive et calculs purs (`hooks/`), composants de présentation purs VDOM (`components/`), et écrans de routes applicatives (`pages/`).
- **Composants déclaratifs Preact fonctionnels purs :** abandon définitif des classes de vues et de toute manipulation impérative du DOM (`innerHTML`, `document.getElementById`, `document.querySelector`). Tout état découle du VDOM Preact et des hooks idiomatiques.
- **Design System moderne Tailwind CSS v4 (`ADR-015`) :** palette sombre froide professionnelle (`surface-base: #090d16`, `surface-panel: #111827`, `surface-elevated: #1e293b`, `surface-overlay: #243147`, `border-default: #334155`), typographie duale (`Inter` pour le châssis applicatif, `JetBrains Mono` pour la télémétrie, le code et les flux), bordures nettes 1px et statut sémantique haute visibilité.
- **Cadrage Fonctionnel Strict du Socle v1 :** 
  - Persistance locale exclusivement en fichiers JSON sous `.agents/data/` (zéro SQLite, zéro cloud).
  - Adapter CLI restreint à `cursor-cli` opérationnel en v1 (`REQ-008`, `SPEC-ADPT-01/02`).
  - Streaming et exécutions volatiles en mémoire vive sans persistance disque des logs (`R-26`, `R-37`).

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 7

1. **Zéro Import de `lib/` & Isolation Navigateur (`SPEC-ARCH-01`, `CASE-ARCH-01-4`) :**
   - Le code de `ui/` s'exécute exclusivement dans le contexte du navigateur web.
   - Aucune API Node.js (`fs`, `child_process`, `os`, `path`, etc.) ni aucun module de `lib/` ou `services/` ne peut être importé.
   - Les échanges avec le serveur transitent exclusivement par les contrats typés de `api/client.ts` (HTTP REST) et `api/sse-client.ts` (streaming SSE).
2. **Interface Intégralement en Français (`C-06`, `REQ-007`) :**
   - Tous les libellés, menus, boutons, titres, infobulles et retours d'erreurs sont centralisés dans le référentiel linguistique unique `i18n/fr.ts`.
3. **Volatilité Absolue du Terminal Web (`R-26`) :**
   - Le terminal de streaming gère son flux textuel en mémoire vive volatile dans le composant client via un tampon circulaire à taille bornée (`TERMINAL_MAX_LINES = 5000`). Aucun journal d'exécution n'est persisté sur disque côté serveur sous `.agents/data/`.
4. **Validation Client-Side de l'Unicité Start (`REQ-015`) :**
   - Le hook de gestion d'état du canvas (`hooks/use-canvas-state.ts`) bloque préventivement l'ajout d'un second bloc Start en consommant directement le validateur isomorphe `domain/graph/graph-validator.ts`.
5. **Gestion & Renumérotation des Clés de Câblage (`R-13`, `R-43`) :**
   - Les clés numériques séquentielles (`"0"`, `"1"`, ...) sont attribuées et renumérotées automatiquement lors de suppressions, les clés personnalisées sont conservées, et toute collision de clé sur un même bloc cible est immédiatement bloquée.
6. **Sanctuarisation des Sélecteurs E2E Playwright :**
   - Les attributs sémantiques indispensables aux tests E2E (`[data-section]`, `[data-action]`, `[data-node-id]`, `[data-port-index]`, `#terminal-output`) sont systématiquement préservés dans le balisage TSX.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro par Dossier)

### 2.1 Positionnement dans le DAG Macro (Palier 7 — Interface Navigateur)

Dans le DAG macro de ClientsBox, `ui/` consomme les strates basses et isomorphes (`types/`, `utils/` et `domain/`), en restant strictement isolée des couches serveur :

```text
       ┌───────────────┐                 ┌───────────────┐
       │types/ & utils/│                 │    domain/    │ (Logique pure isomorphe)
       └───────┬───────┘                 └───────┬───────┘
               │                                 │
               └─────────────────┬───────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   ui/ (Palier 7)  │ ◄─── Exécution navigateur
                       │ Preact TSX + TWind│      0 import lib/ ni services/
                       └───────────────────┘
```

### 2.2 Micro-DAG Intra-Couche (DAG Front par Dossier à 5 Niveaux)

L'architecture interne de `src/ui/` obéit à un ordre topologique strict par dossier :

$$\text{Niveau 0 (Fondations pures)} \prec \text{Niveau 1 (Hooks & Calculs)} \prec \text{Niveau 2 (Composants VDOM)} \prec \text{Niveau 3 (Pages de routes)} \prec \text{Niveau 4 (App Root)}$$

```text
       ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
       │  src/ui/api   │     │  src/ui/i18n  │     │ src/ui/types  │  Niveau 0 : Fondations pures
       └───────┬───────┘     └───────┬───────┘     └───────┬───────┘  (Zero JSX, zero dépendance interne)
               │                     │                     │
               └───────────────┬─────┴─────────────────────┘
                               │
                       ┌───────▼───────┐
                       │ src/ui/hooks  │                              Niveau 1 : Logique d'état & calculs
                       └───────┬───────┘                              (Gestion d'état, géométrie Bézier)
                               │
                       ┌───────▼───────┐
                       │src/ui/compon. │                              Niveau 2 : Composants VDOM réutilisables
                       └───────┬───────┘                              (common, layout, canvas, terminal)
                               │
                       ┌───────▼───────┐
                       │ src/ui/pages  │                              Niveau 3 : Écrans de routes applicatives
                       └───────┬───────┘                              (agents, profils, resources, studio)
                               │
                       ┌───────▼───────┐
                       │  src/ui/app   │                              Niveau 4 : Composition Root & Montage
                       └───────────────┘                              (app.tsx)
```

### Règles d'étanchéité inter-dossiers :
1. **`api/`, `i18n/`, `types/` (Niveau 0) :** Aucune dépendance vers les autres dossiers de `src/ui/`.
2. **`hooks/` (Niveau 1) :** Encapsule la logique d'état, les mutations et les calculs. N'importe **aucun composant JSX**.
3. **`components/` (Niveau 2) :** Présentation pure VDOM.
   - `components/common/` (primitives) n'importe aucun sous-dossier frère.
   - `components/` n'importe **jamais** de fichiers depuis `pages/` ni depuis `app.tsx`.
4. **`pages/` (Niveau 3) :** Vues de haut niveau assemblant `components/` et pilotées par les `hooks/`. Aucune page n'en importe une autre (isolation complète des routes).
5. **`app.tsx` (Niveau 4) :** Point d'entrée montant le layout global et le routage déclaratif vers les `pages/`.

---

## 3. Inventaire & Arborescence des Fichiers (`src/ui/`)

### 3.1 Arborescence Complète Clean Code (`src/ui/`)

```text
src/ui/
├── app.tsx                                                  # [UI-001] NIVEAU 4 — Composition Root Frontend & routeur
│
├── api/                                                     # NIVEAU 0 — Transport réseau client (0 JSX)
│   ├── http.client.ts                                       # [UI-002] Client HTTP REST typé (normalisation erreurs FR)
│   └── sse.client.ts                                        # [UI-003] Client EventSource SSE (reconnexion, dispatch)
│
├── i18n/                                                    # NIVEAU 0 — Référentiel linguistique & manifestes statiques
│   ├── fr.i18n.ts                                           # [UI-004] Dictionnaire 100 % français
│   └── user-docs.manifest.ts                                # [UI-053] Manifeste statique des documents Markdown embarqués
│
├── types/                                                   # NIVEAU 0 — Modèles d'état et contrats UI
│   ├── canvas.types.ts                                      # [UI-005] Modèles nodaux (ViewModel, PortAnchor, Viewport)
│   └── ui.types.ts                                          # [UI-006] Contrats de formulaires, filtres terminal et routes
│
├── hooks/                                                   # NIVEAU 1 — Logique réactive, calculs & helpers purs (0 JSX)
│   ├── common/                                              # Hooks transverses et helpers de composants génériques
│   │   ├── use-resources.hook.ts                            # [UI-007] Hook générique CRUD asynchrone
│   │   ├── use-modal.hook.ts                                # [UI-011] Hook de cycle de vie des boîtes modales
│   │   ├── autocomplete.helper.ts                           # [UI-050] Navigation clavier et filtrage pour AutocompleteInput
│   │   └── model-search.helper.ts                           # [UI-051] Découverte et autocomplétion des modèles d'IA par CLI
│   ├── docs/                                                # Logique pure de transformation documentaire (ex-ui/docs/)
│   │   ├── user-docs-markdown.helper.ts                     # [UI-054] Rendu Markdown GFM et réécriture des liens internes
│   │   ├── user-docs-tree.builder.ts                        # [UI-055] Construction de l'arborescence documentaire
│   │   └── user-docs-tree.model.ts                          # [UI-056] État de sélection et d'expansion du sommaire
│   ├── canvas/                                              # État, géométrie et interactions pointeur du graphe
│   │   ├── canvas-document.factory.ts                       # [UI-035] Fabrique, sérialisation et nettoyage no-save
│   │   ├── canvas-mutations.helper.ts                       # [UI-036] Mutations pures (add/remove/wire/move/keys)
│   │   ├── use-canvas-state.hook.ts                         # [UI-008] Hook principal de gestion du graphe nodal
│   │   ├── use-canvas-geometry.hook.ts                      # [UI-009] Calculs géométriques SVG (Bézier, ancrage ports)
│   │   ├── use-canvas-port-hit.hook.ts                      # [UI-046] Hit-test de détection des ports d'entrée
│   │   ├── use-canvas-pointer-manager.hook.ts               # [UI-045] Machine à états pointeur (drag nœud, tirage câble)
│   │   ├── use-canvas-viewport.hook.ts                      # [UI-060] Hook de gestion du viewport et caméra spatiale (Pan & Zoom)
│   │   ├── canvas-pointer-wire.helper.ts                    # [UI-062] Helper modulaire drag-and-drop câblage et repli clic
│   │   └── use-canvas-interactions.hook.ts                  # [UI-044] Point d'entrée des écouteurs pointeur du canvas
│   └── studio/                                              # Orchestration du Studio, hydratation et streaming SSE
│       ├── studio-preact-safe.helper.ts                     # [UI-042] Wrappers d'exécution tolérants hors cycle Preact
│       ├── studio-execution.options.ts                      # [UI-039] Contrats d'options pour chargeur et flux Studio
│       ├── studio-execution.hydrator.ts                     # [UI-038] Hydratation de l'état Studio depuis GET /run
│       ├── studio-loader.helper.ts                          # [UI-040] Chargement initial du scénario et brouillon
│       ├── studio-stream.helper.ts                          # [UI-043] Réception des événements SSE (statuts run & blocs)
│       ├── studio-execution.effects.ts                      # [UI-037] Effets réactifs de chargement et souscription SSE
│       ├── studio-pointer.effects.ts                        # [UI-041] Effet de verrouillage graphe et attache pointeur
│       ├── studio-keyboard.effect.ts                        # [UI-059] Effet clavier Delete/Backspace (suppression nœud)
│       ├── use-execution-stream.hook.ts                     # [UI-010] Contrôle du run et tampon circulaire terminal (5000 l.)
│       ├── use-scenario-save-state.hook.ts                  # [UI-063] Hook de suivi de synchronisation et de persistance
│       └── use-scenario-execution.hook.ts                   # [UI-047] Hook maître d'orchestration du Studio
│
├── components/                                              # NIVEAU 2 — Composants VDOM réutilisables Preact (.tsx)
│   ├── common/                                              # Primitives du Design System Tailwind v4
│   │   ├── button.tsx                                       # [UI-012] Bouton réactif multi-variantes
│   │   ├── input.tsx                                        # [UI-013] Champ de saisie accessible
│   │   ├── select.tsx                                       # [UI-014] Sélecteur déroulant
│   │   ├── autocomplete-input.tsx                           # [UI-049] Champ d'autocomplétion à saisie libre
│   │   ├── badge.tsx                                        # [UI-017] Pastille sémantique de statut
│   │   ├── modal.tsx                                        # [UI-015] Fenêtre modale avec support touche Échap
│   │   └── data-table.tsx                                   # [UI-016] Tableau de données déclaratif
│   ├── layout/                                              # Châssis IDE de l'application
│   │   ├── sidebar.tsx                                      # [UI-019] Rail de navigation latéral compact (48px)
│   │   └── app-layout.tsx                                   # [UI-018] Coque globale (Topbar + Sidebar + Workspace)
│   ├── agents/                                              # Composants métier Agents
│   │   └── agent-form-modal.tsx                             # [UI-032] Modale de création/édition d'agent
│   ├── profiles/                                            # Composants métier Profils
│   │   └── profile-form-modal.tsx                           # [UI-033] Modale de création/édition de profil CLI
│   ├── resources/                                           # Composants métier Ressources
│   │   └── resource-form-modal.tsx                          # [UI-034] Modale Prompts, Conditions Exit et Scripts If
│   ├── docs/                                                # Composants métier Documentation (ex-ui/docs/)
│   │   └── user-docs-tree.tsx                               # [UI-057] Arbre de navigation dossiers/fichiers Markdown
│   ├── canvas/                                              # Composants de l'éditeur nodal
│   │   ├── canvas-cable.tsx                                 # [UI-022] Câble SVG Bézier avec badge clé/power
│   │   ├── canvas-node.tsx                                  # [UI-021] Carte de bloc haute densité (Start, Run, If, Clear)
│   │   ├── canvas-board.tsx                                 # [UI-020] Surface SVG interactive (grille, pan/zoom)
│   │   ├── canvas-toolbar.tsx                               # [UI-023] Barre d'actions flottante du Studio
│   │   ├── inspector-panel.tsx                              # [UI-024] Tiroir latéral d'inspection contextuelle
│   │   ├── inspector-panel.fields.tsx                       # [UI-058] Formulaires d'inspection par type de bloc
│   │   └── inspector-panel.command.tsx                      # [UI-061] Formulaire d'inspection du bloc Command (commande shell)
│   └── terminal/                                            # Composants du dock de télémétrie live
│       ├── terminal-controls.tsx                            # [UI-026] Barre de filtres, recherche et arrêt d'urgence
│       └── terminal-view.tsx                                # [UI-025] Console de streaming SSE en mémoire volatile
│
└── pages/                                                   # NIVEAU 3 — Écrans de routes applicatives (isolés entre eux)
    ├── scenarios-page.tsx                                   # [UI-030] Tableau de bord des scénarios
    ├── scenario-studio-page.tsx                             # [UI-031] Studio d'orchestration (Canvas + Inspecteur + Dock)
    ├── agents-page.tsx                                      # [UI-027] Catalogue et gestion des agents IA
    ├── profiles-page.tsx                                    # [UI-028] Gestion des profils et politiques système
    ├── resources-page.tsx                                   # [UI-029] Bibliothèque de Prompts, Exit et Scripts If
    ├── instructions-page.tsx                                # [UI-052] Lecteur de documentation embarquée et export local
    └── settings-page.tsx                                    # [UI-048] Paramètres système et diagnostic de stockage
```


### 3.2 Tableau Normalisé des Fichiers du Module (`src/ui/`)

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| UI-001 | ui/app.tsx | Point d'entrée UI, composant racine `<App />`, routage déclaratif et montage Preact. |
| UI-002 | ui/api/http.client.ts | Client HTTP REST typé (fetch, normalisation erreurs en français). |
| UI-003 | ui/api/sse.client.ts | Client EventSource streaming SSE (gestion reconnexion, dispatch flux temps réel). |
| UI-004 | ui/i18n/fr.i18n.ts | Dictionnaire linguistique 100% français (libellés, menus, messages). |
| UI-005 | ui/types/canvas.types.ts | Modèles typés du canvas (Node, Connection, Port, Viewport, DragState, Telemetry). |
| UI-006 | ui/types/ui.types.ts | Contrats typés des formulaires, routes, terminaux et filtres UI. |
| UI-007 | ui/hooks/common/use-resources.hook.ts | Hook générique de gestion d'état et opérations CRUD asynchrones. |
| UI-008 | ui/hooks/canvas/use-canvas-state.hook.ts | Hook de gestion du graphe nodal (sélection, ajout/suppression, unicité Start, clés R-13/R-43). |
| UI-009 | ui/hooks/canvas/use-canvas-geometry.hook.ts | Fonctions pures de géométrie SVG (courbes Bézier, ancrage des ports 8px). |
| UI-010 | ui/hooks/studio/use-execution-stream.hook.ts | Hook de contrôle du run scénario (lancement, arrêt Stop, buffer circulaire SSE). |
| UI-011 | ui/hooks/common/use-modal.hook.ts | Hook de contrôle d'affichage et cycle de vie des modales. |
| UI-012 | ui/components/common/button.tsx | Composant bouton réactif avec variantes Tailwind CSS v4. |
| UI-013 | ui/components/common/input.tsx | Champ de saisie texte accessible avec retour d'erreur. |
| UI-014 | ui/components/common/select.tsx | Sélecteur déroulant stylisé (filtrage adapters opérationnels). |
| UI-015 | ui/components/common/modal.tsx | Boîte de dialogue modale accessible avec gestion Échap. |
| UI-016 | ui/components/common/data-table.tsx | Tableau de données réactif (sans innerHTML) avec actions CRUD. |
| UI-017 | ui/components/common/badge.tsx | Pastilles d'état (statut d'exécution, barrières, type de bloc). |
| UI-018 | ui/components/layout/app-layout.tsx | Coque globale IDE (Topbar sticky + Sidebar rail 48px + zone principale). |
| UI-019 | ui/components/layout/sidebar.tsx | Barre latérale de navigation (Scénarios, Agents, Profils, etc.). |
| UI-020 | ui/components/canvas/canvas-board.tsx | Conteneur SVG interactif (grille à points 16px, drop, pan/zoom). |
| UI-021 | ui/components/canvas/canvas-node.tsx | Carte de nœud haute densité (Start, Run, If, ClearContext, ports 8px). |
| UI-022 | ui/components/canvas/canvas-cable.tsx | Câble SVG orienté avec courbe de Bézier et badge clé/puissance. |
| UI-023 | ui/components/canvas/canvas-toolbar.tsx | Barre d'outils flottante du studio (Ajout nœuds, Exécuter, Arrêter). |
| UI-024 | ui/components/canvas/inspector-panel.tsx | Tiroir latéral d'inspection contextuel par type de bloc (Run, If, ClearContext, Start, CallScenario). |
| UI-025 | ui/components/terminal/terminal-view.tsx | Console live streaming SSE (tampon mémoire volatil, autoscroll). |
| UI-026 | ui/components/terminal/terminal-controls.tsx | Barre de commandes du dock (Filtres flux, recherche, Stop, Reset contexte). |
| UI-027 | ui/pages/agents-page.tsx | Catalogue des agents IA (cartes haute densité + modale formulaire). |
| UI-028 | ui/pages/profiles-page.tsx | Page des profils CLI (liste avec badge modèle + modale de configuration). |
| UI-029 | ui/pages/resources-page.tsx | Page unifiée des ressources (Prompts, Exit, consultation scripts If). |
| UI-030 | ui/pages/scenarios-page.tsx | Tableau de bord des workflows locaux (recherche, tri, studio). |
| UI-031 | ui/pages/scenario-studio-page.tsx | Page studio d'orchestration (Canvas + Inspecteur + Terminal live). |
| UI-032 | ui/components/agents/agent-form-modal.tsx | Modale de saisie/édition d'agent (volumétrie agents-page). |
| UI-033 | ui/components/profiles/profile-form-modal.tsx | Modale de saisie/édition de profil avec autocomplétion du modèle d'IA. |
| UI-034 | ui/components/resources/resource-form-modal.tsx | Modale prompts / ordres de sortie exit (`content`) / scripts If. |
| UI-035 | ui/hooks/canvas/canvas-document.factory.ts | Fabrique et sérialisation du document canvas (load/save, strip no-save). |
| UI-036 | ui/hooks/canvas/canvas-mutations.helper.ts | Mutations pures du document canvas (add/remove/wire/move/keys). |
| UI-037 | ui/hooks/studio/studio-execution.effects.ts | Effets Preact du Studio : chargement scénario et flux SSE. |
| UI-038 | ui/hooks/studio/studio-execution.hydrator.ts | Hydratation Studio depuis snapshot GET /run (SPEC-UI-03). |
| UI-039 | ui/hooks/studio/studio-execution.options.ts | Contrats d'options des effets Studio (loader / stream). |
| UI-040 | ui/hooks/studio/studio-loader.helper.ts | Helpers du chargeur Studio (draft + hydratation async). |
| UI-041 | ui/hooks/studio/studio-pointer.effects.ts | Effet pointer Studio : attache interactions canvas et verrou graphe. |
| UI-042 | ui/hooks/studio/studio-preact-safe.helper.ts | Wrappers Preact tolérants hors cycle de rendu (tests / SSR). |
| UI-043 | ui/hooks/studio/studio-stream.helper.ts | Handlers SSE Studio (statusChanged / blockStatus). |
| UI-044 | ui/hooks/canvas/use-canvas-interactions.hook.ts | Point d'entrée interactions pointer, câblage et écouteurs canvas. |
| UI-045 | ui/hooks/canvas/use-canvas-pointer-manager.hook.ts | Gestionnaire d'état pointer (drag nœuds, câblage). |
| UI-046 | ui/hooks/canvas/use-canvas-port-hit.hook.ts | Détection et hit-test des ports nodaux d'entrée. |
| UI-047 | ui/hooks/studio/use-scenario-execution.hook.ts | Orchestration chargement, streaming SSE et interactions pointer Studio. |
| UI-048 | ui/pages/settings-page.tsx | Page des paramètres système et statut de persistance locale. |
| UI-049 | ui/components/common/autocomplete-input.tsx | Champ d'autocomplétion libre à recherche modulaire (SPEC-UI-01 / AC-UI-01-5). |
| UI-050 | ui/hooks/common/autocomplete.helper.ts | Fonctions utilitaires, types et moteur de navigation pour le composant AutocompleteInput. |
| UI-051 | ui/hooks/common/model-search.helper.ts | Découverte et autocomplétion des modèles d'IA pour formulaire agent (SPEC-UI-01 / CR-003). |
| UI-052 | ui/pages/instructions-page.tsx | Page Instructions : lecture doc embarquée (rendu Markdown GFM via `marked`, ADR-017), bouton « Enregistrer dans le dossier local », feedback export (SPEC-UI-04). |
| UI-053 | ui/i18n/user-docs.manifest.ts | Manifeste typé des documents Markdown embarqués depuis docs/instructions/ (ids, titres, contenus). |
| UI-054 | ui/hooks/docs/user-docs-markdown.helper.ts | Rendu Markdown GFM (marked) et réécriture des liens relatifs vers les documents embarqués (ADR-017 / SPEC-UI-04). |
| UI-055 | ui/hooks/docs/user-docs-tree.builder.ts | Construction de l'arborescence documentaire (dossiers = README) pour la page Instructions (ADR-017). |
| UI-056 | ui/hooks/docs/user-docs-tree.model.ts | Sélection et expansion de la navigation dans la documentation Instructions (ADR-017). |
| UI-057 | ui/components/docs/user-docs-tree.tsx | Sommaire arborescent dossiers/fichiers pour la page Instructions (ADR-017 / SPEC-UI-04). |
| UI-058 | ui/components/canvas/inspector-panel.fields.tsx | Formulaires d'édition par type de bloc pour le panneau d'inspection (dont CallScenario). |
| UI-059 | ui/hooks/studio/studio-keyboard.effect.ts | Effet clavier Delete/Backspace pour suppression du nœud sélectionné (hors champs éditables). |
| UI-060 | ui/hooks/canvas/use-canvas-viewport.hook.ts | Hook et fonctions pures de calcul pour la caméra spatiale du canvas (Pan & Zoom) (SPEC-UI-02 / ADR-021). |
| UI-061 | ui/components/canvas/inspector-panel.command.tsx | Formulaire de configuration du bloc Command dans l'InspectorPanel (ADR-019 / SPEC-UI-02). |
| UI-062 | ui/hooks/canvas/canvas-pointer-wire.helper.ts | Helper modulaire pour la gestion du drag-and-drop de câblage et du clic de port. |
| UI-063 | ui/hooks/studio/use-scenario-save-state.hook.ts | Hook dédié au suivi de l'état de synchronisation et de persistance du scénario. |
<!-- SIGNATURE-INVENTORY-END -->

> **Note d'alignement (Assets graphiques et styles statiques) :**  
> Le fichier de style `src/ui/styles/app.css` constitue un asset de présentation statique intégrant le moteur utilitaire Tailwind CSS v4 et les tokens du Design System, compilé et embarqué en mémoire conformément à `ADR-012`, `ADR-013` et `ADR-015`. Il est formellement exclu du décompte des 63 modules TypeScript exécutables de la couche `ui/` (`UI-001`…`UI-063`).  
> **Note ADR-017 :** `UI-001` / `UI-019` exposent l'accès documentation naviguant vers `#/instructions` au sein de l'application ; les libellés FR sont dans `UI-004` ; `UI-052` rend le Markdown via `marked` (GFM), bundlé in-memory via `UI-054`..`UI-057`.

---

## 4. Spécifications Détaillées des Contrats, Interfaces & Rôles

### 4.1 Contrats de Données & Modèles d'État (Niveau 0)

#### `src/ui/types/canvas.types.ts` (`UI-005`)
- `Point` : `{ x: number; y: number }`.
- `ViewportState` : `{ x: number; y: number; zoom: number }`.
- `NodeTelemetry` : métadonnées visuelles affichées sur les cartes de nœuds (`pid`, `durationMs`, `exitCode`, `tokenCount`, `sacSummary`, `barrierReceived`, `barrierRequired`).
- `CanvasNodeViewModel` : extension de `ScenarioNode` enrichie du statut d'exécution (`BlockStatus`), de la télémétrie et du drapeau de sélection visuelle. Le statut et tout champ de `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`) sont volatils : exclus du payload Enregistrer et stripés au load (`AC-UI-02-8`, `AC-DATA-03-6`).
- `CanvasConnectionViewModel` : extension de `ScenarioConnection` enrichie de la puissance d'émission (`power: number`), de la branche If (`branch?: 'true' | 'false'`) et du drapeau actif (`isActive?: boolean`).
- `PortAnchor` : coordonnées et métadonnées d'ancrage SVG des ports d'entrée/sortie (8px).
- `CanvasDocument` : modèle d'état immuable du canvas `{ scenarioId: string; nodes: ScenarioNode[]; connections: ScenarioConnection[]; viewport: ViewportState }`.
- `AddBlockResult` : `{ ok: boolean; document: CanvasDocument; error?: string }`.
- `WireResult` : `{ ok: boolean; document: CanvasDocument; error?: string }`.

#### `src/ui/types/ui.types.ts` (`UI-006`)
- `InspectorTab` : obsolète / supprimé au profit de l'affichage direct et contextuel des propriétés éditables selon le type de bloc sélectionné (Run, If, ClearContext, Start).
- `StreamFilterType` : `'all' | 'engine' | 'stdout' | 'stderr' | string` (filtres du terminal).
- `TerminalFilterState` : `{ activeFilter: StreamFilterType; searchQuery: string; autoScroll: boolean; showTimestamps: boolean }`.
- `SelectOption` : `{ value: string; label: string; disabled?: boolean }`.
- `getCliSelectOptions(registry: AdapterRegistryService): readonly SelectOption[]` : garantit que seul `cursor-cli` est sélectionnable en v1 (`REQ-008`).
- Formulaires typés et validateurs : `AGENT_FORM_FIELDS`, `validateAgentForm`, `PROFILE_FORM_FIELDS`, `validateProfileForm`, `PROMPT_FORM_FIELDS`, `EXIT_FORM_FIELDS`, `SCENARIO_FORM_FIELDS`.

#### `src/ui/i18n/fr.i18n.ts` (`UI-004`)
- Référentiel bilingue étanche : aucun terme anglais interdit (`ENGLISH_DENY_LIST`), allow-list technique autorisée (`TECH_ALLOW_LIST : 'Start', 'Run', 'If', 'cursor-cli', 'JSON', 'CLI'`).
- `UI_FR_CATALOG` : catalogues `nav`, `errors`, `confirms`, `blocks`, `dock`, `inspector`.
- Fonctions d'audit linguistique : `collectChromeStrings()`.

---

### 4.2 Logique Réactive & Calculs Purs (Niveau 1 — `hooks/`)

#### `src/ui/hooks/canvas/use-canvas-geometry.hook.ts` (`UI-009`)
- `calculateCubicBezier(source: Point, target: Point): BezierCurvePath` : calcule la formule cubique `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}` avec poignées tangentes horizontales adaptatives, le point médian pour le badge pill et l'angle d'orientation.
- `calculatePortPosition(nodePos: Point, nodeWidth: number, nodeHeight: number, type: 'input' | 'output', portIndex: number, totalPorts: number): Point` : positionnement précis des ports 8px sur les tranches gauche/droite.

#### `src/ui/hooks/canvas/use-canvas-state.hook.ts` (`UI-008`)
- Réexporte `createCanvasDocument`, `buildScenarioPersistPayload`, `isStudioGraphLocked`, `LAUNCH_BUTTON_LABEL` (`UI-035`).
- Réexporte `addBlock` / `removeBlock` / `moveBlock` / `wireOriented` / `updateConnectionKey` / `updateConnectionPower` (`UI-036`) : unicité Start (`REQ-015`), clés (`R-43`).
- `isStudioGraphLocked({ isRunning?, isLaunchLocked?, isBusy? })` : verrou édition/Enregistrer pendant run (`AC-UI-02-9`).
- `tryLaunchScenario(doc: CanvasDocument, http: HttpClient)` : garde anti-double-clic + POST `/run`.
- `useCanvasState(initialScenarioId, initialDoc?)` : état réactif local du graphe.

#### `src/ui/hooks/studio/use-execution-stream.hook.ts` (`UI-010`)
- `TERMINAL_MAX_LINES` = 5000 (constante du tampon circulaire).
- `createTerminalView(scenarioId: string): TerminalViewState`.
- `appendStreamEvent(state: TerminalViewState, event: AgentStreamEvent): TerminalViewState` : mise à jour volatile en mémoire vive sans persistance disque.
- `clearTerminalView(state: TerminalViewState): TerminalViewState`.
- `filterTerminalLines(state: TerminalViewState, filters: TerminalFilterState): readonly TerminalLine[]`.

---

### 4.3 Composants de Présentation VDOM (Niveau 2 — `components/`)

- **Primitives (`UI-012..017`, `UI-049`) :** `<Button />` (variantes primaire, secondaire, danger, discret, kill), `<Input />`, `<Select />` (options opérationnelles), `<Modal />` (gestion Échap et backdrop blur), `<DataTable />` (rendu tabulaire pur VDOM), `<Badge />` (pastilles de statut d'exécution), `<AutocompleteInput />` (`UI-049`, saisie prédictive à recherche modulaire locale/distante et valeur libre sans blocage, `AC-UI-01-5`).
- **Layout IDE (`UI-018`, `UI-019`) :**
  - `<AppLayout />` : structure globale avec Topbar sticky 44px (logo ClientsBox, breadcrumb, badge `SRV: En ligne :2974`, badge Local-First) et zone principale.
  - `<Sidebar />` : rail compact 48px avec icônes SVG (`account_tree`, `terminal`, `smart_toy`, `settings`) et infobulles au survol.
- **Canvas Nodal (`UI-020..024`) :**
  - `<CanvasBoard />` : grille SVG à points (16px, `#334155`), pan/zoom réactif, zone de drop de blocs.
  - `<CanvasNode />` : carte 240–280px, en-tête 32px avec icône et statut (`SUCCÈS`, `EN COURS`, `EN PAUSE`, `TERMINÉ`, `ERREUR`), corps technique (PID, durée, sortie sac), ports circulaires 8px avec surbrillance au survol.
  - `<CanvasCable />` : tracé SVG en courbe de Bézier cubique avec badge pill `clé: "x" | power: 1` cliquable, distinction vert/rouge pour les branches If (`Vrai` / `Faux`).
  - `<CanvasToolbar />` : barre d'outils flottante supérieure (+ Nœuds, Lancer le scénario `Ctrl+Enter`, Arrêter tout, Enregistrer). Pendant un run actif (`isRunning` / `launchLocked` / snapshot `busy`), Enregistrer et les actions d'ajout de nœuds sont désactivés ; Stop reste actif (`AC-UI-02-9`).
  - `<InspectorPanel />` : tiroir latéral droit coulissant affichant directement et exclusivement les propriétés éditables selon le type de nœud sélectionné (champs agentId/promptId/exitId pour Run, ifScriptId pour If, agentId pour ClearContext, informatif pour Start). Intègre également une action de suppression explicite (`data-action="delete-node"`, callback `onDeleteNode`) verrouillée pendant un run (`AC-UI-02-10`).
- **Dock Terminal (`UI-025`, `UI-026`) :**
  - `<TerminalView />` : console streaming volatile avec coloration syntaxique ANSI (`stdout` blanc `#f8fafc`, `stderr` rouge `#ef4444`), autoscroll automatique et horodatage.
  - `<TerminalControls />` : barre d'en-tête du dock avec onglets de filtres de flux, champ de recherche regex, bascules et bouton d'arrêt d'urgence Stop (`SIGTERM`).

---

### 4.4 Pages & Composition Root (Niveaux 3 & 4)

- **`UI-027` `<AgentsPage />` :** catalogue des agents sous forme de cartes denses avec indicateur de détection de binaire `cursor-cli`, tags de profils et modale CRUD complète.
- **`UI-028` `<ProfilesPage />` :** liste et configuration des profils CLI (politiques d'envoi du prompt système : `chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`, affichage du modèle d'IA).
- **`UI-029` `<ResourcesPage />` :** vue unifiée des ressources déclaratives (Prompts, Exit, consultation scripts If).
- **`UI-030` `<ScenariosPage />` :** tableau de bord des workflows locaux avec recherche `Ctrl+K`, filtrage et accès au studio nodal.
- **`UI-031` `<ScenarioStudioPage />` :** page studio combinant le canvas interactif `<CanvasBoard>`, la barre flottante `<CanvasToolbar>`, le tiroir d'inspection `<InspectorPanel>` et le dock inférieur `<TerminalView>` + `<TerminalControls>`. Propage le verrou d'édition (`graphLocked` dérivé de `isRunning` / `launchLocked` / hydratation `busy`) vers toolbar, board et inspecteur : aucune mutation de graphe (ajout, déplacement, suppression de nœud ou de câble) ni Enregistrer tant que le scénario est actif (`AC-UI-02-9`, `AC-UI-02-10`, `CASE-UI-02-16`, `CASE-UI-02-17`). Gère la suppression de nœud via callback inspecteur et raccourci clavier Suppr/Backspace.
- **`UI-001` `<App />` & `mountApp` / `unmountApp` :** Composition Root et montage DOM Preact.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`ui` (Global)** | `types/`, `utils/`, `domain/` (isomorphe) | Modules Node.js (`fs`, `child_process`), `lib/`, `services/`, `controllers/`, `index.ts` | *Navigateur Web*, compilation in-memory dans `embedded-assets.generated.ts` | Violation bloquante détectée par `CASE-ARCH-01-4` (interdiction formelle de Node.js et de lib dans l'UI). |
| **Niveau 0 (`api/`, `i18n/`, `types/`)** | `domain/` (isomorphe), `utils/` | Tous composants Preact VDOM / JSX, `ui/hooks/`, `ui/components/`, `ui/pages/`, `app.tsx` | Niveaux 1, 2, 3, 4 | Ordre topologique strict (Niveau 0 pur et agnostique au VDOM). |
| **Niveau 1 (`hooks/`)** | Niveau 0, `domain/` (isomorphe), `utils/` | Niveau 2 (composants VDOM), Niveau 3 (pages), Niveau 4 (`app.tsx`) | Niveaux 2, 3, 4 | Logique réactive sans couplage ascendant vers le rendu visuel. |
| **Niveau 2 (`components/`)** | Niveaux 0 et 1, `domain/` (isomorphe) | Niveau 3 (pages applicatives), Niveau 4 (`app.tsx`) | Niveaux 3, 4 | Primitives et composants réutilisables sans couplage aux routes. |
| **Niveau 3 (`pages/`)** | Niveaux 0, 1, 2, `domain/` (isomorphe) | Niveau 4 (`app.tsx`), autres pages de Niveau 3 | Niveau 4 (`app.tsx`) | Structure complète d'écran sans couplage croisé entre routes. |
| **Niveau 4 (`app.tsx`)** | Niveaux 0, 1, 2, 3 | `services/`, `controllers/`, `lib/` | Point d'entrée navigateur in-memory | Composition Root Frontend unique montant l'arbre Preact. |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `UI-001` | `SPEC-UI-01`, `SPEC-UI-03` | `ADR-001`, `ADR-013` | `CASE-UI-01-1`, `CASE-UI-03-1` |
| `UI-002` | *(transversal)* | `ADR-013` | *(tous les CASE UI)* |
| `UI-003` | `SPEC-UI-03` | `ADR-013` | `CASE-UI-03-1` |
| `UI-004` | `SPEC-UI-01`, `SPEC-ARCH-08` | `ADR-013` | `CASE-UI-01-1`, `CASE-ARCH-08-4` |
| `UI-005` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1` |
| `UI-006` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-2` |
| `UI-007` | `SPEC-UI-01` | `ADR-005`, `ADR-013` | `CASE-UI-01-2` |
| `UI-008` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-2`, `CASE-UI-02-5` |
| `UI-009` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-3` |
| `UI-010` | `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-03-1`, `CASE-UI-03-2` |
| `UI-011` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-2` |
| `UI-012` | `SPEC-UI-01` | `ADR-013`, `ADR-015` | `CASE-UI-01-1` |
| `UI-013` | `SPEC-UI-01` | `ADR-013`, `ADR-015` | `CASE-UI-01-2` |
| `UI-014` | `SPEC-UI-01` | `ADR-002`, `ADR-013` | `CASE-UI-01-3` |
| `UI-015` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-2` |
| `UI-016` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-2` |
| `UI-017` | `SPEC-UI-02` | `ADR-013`, `ADR-015` | `CASE-UI-02-4` |
| `UI-018` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-1` |
| `UI-019` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-1` |
| `UI-020` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-6` |
| `UI-021` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-3`, `CASE-UI-02-4` |
| `UI-022` | `SPEC-UI-02`, `SPEC-DATA-03` | `ADR-004`, `ADR-005`, `ADR-013` | `CASE-UI-02-1`, `CASE-DATA-03-2` |
| `UI-023` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-5`, `CASE-UI-02-16` |
| `UI-024` | `SPEC-UI-02` | `ADR-013` | `CASE-UI-02-1` |
| `UI-025` | `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-03-1` |
| `UI-026` | `SPEC-UI-03` | `ADR-002`, `ADR-013` | `CASE-UI-03-2`, `CASE-UI-03-3` |
| `UI-027` | `SPEC-UI-01` | `ADR-002`, `ADR-013` | `CASE-UI-01-2`, `CASE-UI-01-3` |
| `UI-028` | `SPEC-UI-01` | `ADR-005`, `ADR-013` | `CASE-UI-01-2` |
| `UI-029` | `SPEC-UI-01`, `SPEC-DATA-02` | `ADR-005`, `ADR-013` | `CASE-UI-01-2`, `CASE-DATA-02-1` |
| `UI-030` | `SPEC-UI-01` | `ADR-005`, `ADR-013` | `CASE-UI-01-2` |
| `UI-031` | `SPEC-UI-02`, `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-16`, `CASE-UI-03-1`, `CASE-UI-03-9` |
| `UI-032` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-2` |
| `UI-033` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-2` |
| `UI-034` | `SPEC-UI-01`, `SPEC-DATA-02` | `ADR-005`, `ADR-013` | `CASE-UI-01-2`, `CASE-DATA-02-1` |
| `UI-035` | `SPEC-UI-02`, `SPEC-DATA-03` | `ADR-004`, `ADR-005`, `ADR-013` | `CASE-UI-02-1`, `CASE-DATA-03-6` |
| `UI-036` | `SPEC-UI-02`, `SPEC-DATA-03` | `ADR-004`, `ADR-005`, `ADR-013` | `CASE-UI-02-1`, `CASE-DATA-03-2..4` |
| `UI-037` | `SPEC-UI-02`, `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-03-1` |
| `UI-038` | `SPEC-UI-02`, `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-03-1` |
| `UI-039` | `SPEC-UI-02`, `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-03-1` |
| `UI-040` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1` |
| `UI-041` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-16` |
| `UI-042` | `SPEC-UI-02` | `ADR-013` | `CASE-UI-02-1` |
| `UI-043` | `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-03-1` |
| `UI-044` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-6` |
| `UI-045` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-6` |
| `UI-046` | `SPEC-UI-02` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-02-6` |
| `UI-047` | `SPEC-UI-02`, `SPEC-UI-03` | `ADR-004`, `ADR-013` | `CASE-UI-02-1`, `CASE-UI-03-1` |
| `UI-048` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-1` |
| `UI-049` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-5` |
| `UI-050` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-5` |
| `UI-051` | `SPEC-UI-01` | `ADR-013` | `CASE-UI-01-3` |
| `UI-052` | `SPEC-UI-04` | `ADR-013`, `ADR-017` | `CASE-UI-04-1`, `CASE-UI-04-2`, `CASE-UI-04-3` |
| `UI-053` | `SPEC-UI-04`, `SPEC-DATA-05` | `ADR-012`, `ADR-017` | `CASE-UI-04-2` |
| `UI-054` | `SPEC-UI-04` | `ADR-017` | `CASE-UI-04-1` |
| `UI-055` | `SPEC-UI-04` | `ADR-017` | `CASE-UI-04-1` |
| `UI-056` | `SPEC-UI-04` | `ADR-017` | `CASE-UI-04-1` |
| `UI-057` | `SPEC-UI-04` | `ADR-013`, `ADR-017` | `CASE-UI-04-1` |
| `UI-058` | `SPEC-UI-02` | `ADR-013` | `CASE-UI-02-18` |
| `UI-059` | `SPEC-UI-02` | `ADR-013` | `CASE-UI-02-1` |
| `UI-060` | `SPEC-UI-02` | `ADR-021` | `CASE-UI-02-23` |
| `UI-061` | `SPEC-UI-02` | `ADR-019` | `CASE-UI-02-24` |
| `UI-062` | `SPEC-UI-02` | `ADR-013` | `CASE-UI-02-6` |
| `UI-063` | `SPEC-UI-02` | `ADR-013` | `CASE-UI-02-save-state` |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste contractuellement de l'intégrité architecturale de la couche **`src/ui/`** (63 modules cibles `UI-001..063`) :
1. Les 63 modules `UI-001` à `UI-063` sont certifiés sans aucun import d'infrastructure Node.js ni de `lib/` (`CASE-ARCH-01-4`).
2. Tous les affichages et contrats utilisateurs sont scellés en langue française (`REQ-007`).
3. L'architecture obéit strictement au DAG Front par dossier en 5 niveaux, bannissant toute manipulation impérative du DOM au profit de composants déclaratifs réactifs Preact en TSX et de custom hooks étanches.
4. L'implémentation reflète fidèlement la densité et les interactions du Design System des maquettes (`ClientsBox IDE System`), tout en respectant strictement le périmètre backend v1 (persistance locale JSON sous `.agents/data/`, adapter `cursor-cli` exclusif, streaming et runs volatils en mémoire).
5. La couverture sera vérifiée de bout en bout par la suite d'architecture Vitest et les tests E2E Playwright.

*Document validé et scellé pour le Palier 7 (`src/ui/`).*
