# Signature de Domaine — `src/utils/` (Palier 2 : Primitives Techniques Pures)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `UTILS`  
**Couche DAG :** `2-utils` *(Fonctions techniques génériques — agnostiques au domaine métier)*  
**Peut importer :** `types/` *(uniquement pour les types purs)*  
**Peut être importé par :** `config`, `domain`, `lib`, `services`, `controllers`, `ui`, `index.ts`  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`, `SPEC-ARCH-07`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-01`, `SPEC-DATA-03`), [`ENG.md`](../specs/ENG.md) (`SPEC-ENG-04`), décisions d'architecture ([`ADR-004`](../adr/ADR-004-moteur-de-blocs-en-memoire.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`utils/`** constitue le **Palier 2 et la boîte à outils générique** de ClientsBox.
Elle regroupe des fonctions pures de manipulation de chaînes, de tableaux et de génération/validation d'identifiants, strictement agnostiques aux concepts applicatifs du projet.

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 2

1. **Zéro Concept Métier ClientsBox (`SPEC-ARCH-01`) :**
   - Aucun fichier de `utils/` ne connaît ni `Agent`, ni `Scenario`, ni `BlockMessage`, ni aucune entité du domaine.
   - Si une fonction manipule des structures métier, elle appartient à `domain/`, jamais à `utils/`.
2. **Fonctions Pures & Stateless :**
   - Toutes les fonctions exportées sont sans état (pas de singleton, pas de closure sur un état mutable).
   - Un même appel avec les mêmes arguments retourne de manière garantie le même résultat (idempotence).
3. **Zéro Effet de Bord (Zéro I/O) :**
   - Aucun accès à `fs`, `child_process`, `http`, `net`, ni à aucune API système.
   - Pas d'appel direct non injecté à `Date.now()` ni à `Math.random()` : les sources d'entropie sont injectables en paramètre (`randomFn`) pour garantir le déterminisme des tests.
4. **Isomorphisme Absolu :**
   - Tous les utilitaires s'exécutent indifféremment dans Node.js ≥ 24 et dans le navigateur moderne sans le moindre polyfill.
5. **Zéro Dépendance npm Externe :**
   - Les utilitaires n'ajoutent aucune dépendance tierce — uniquement du TypeScript/JavaScript natif standard.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 2 — Primitives Utilitaires)

Dans le DAG macro, `utils/` ne dépend que de `types/` et est consommable par l'ensemble des couches amont :

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                       types/ (Palier 1)                       │
       └───────────────────────────────▲───────────────────────────────┘
                                       │
                                       │ (Import facultatif de types purs)
                                       │
       ┌───────────────────────────────┴───────────────────────────────┐
       │                       utils/ (Palier 2)                       │
       │    primitives/ , cache/ , logger/                             │
       │        0 I/O — 0 concept métier — Fonctions pures             │
       └───▲───────────▲───────────────▲───────────────▲───────────▲───┘
           │           │               │               │           │
       ┌───┴────┐ ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐ ┌───┴────┐
       │ config/│ │ domain/ │    │   lib/    │   │ services/ │ │  ui/   │
       └────────┘ └─────────┘    └───────────┘   └───────────┘ └────────┘
```

### 2.2 Micro-DAG Intra-Couche (Orthogonalité & 3 Sous-Domaines)

Au sein de `utils/`, les modules sont regroupés en 3 sous-domaines étanches et orthogonaux :

$$\text{primitives} \parallel \text{cache} \parallel \text{logger}$$

```text
       ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
       │      primitives/       │    │         cache/         │    │        logger/         │
       │ string, array, id      │    │ types, factory, index  │    │ types, config, utils,  │
       │ Fonctions stateless    │    │ Cache LRU avec TTL     │    │ factory, events, index │
       │     (UTILS-001..003)   │    │     (UTILS-029..031)   │    │     (UTILS-004..028)   │
       └────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

> **Garantie d'acyclicité :**  
> 1. Absence totale d'import inter-sous-domaines au sein de `src/utils/` (`primitives/`, `cache/`, et `logger/` ne s'importent jamais mutuellement).  
> 2. Au sein de `primitives/`, orthogonalité pure ($\text{id.utils} \parallel \text{string.utils} \parallel \text{array.utils}$).  
> 3. Au sein de `cache/`, flux unilatéral $\text{types} \prec \text{factory} \prec \text{index}$.  
> 4. Au sein de `logger/`, flux unilatéral $\text{types/config/utils} \prec \text{factory/events} \prec \text{index}$.

---

## 3. Inventaire & Arborescence des Fichiers (`src/utils/`)

```text
src/utils/
├── primitives/                                          # Micro-DAG 2.1 : Fonctions pures stateless
│   ├── string.utils.ts                                  # [UTILS-001] sanitizeName, isNonEmptyString, joinPromptParts
│   ├── array.utils.ts                                   # [UTILS-002] reindex séquentiel immuable
│   └── id.utils.ts                                      # [UTILS-003] generateId, isValidResourceId, parseResourceFilename
├── cache/                                               # Micro-DAG 2.2 : Cache interne LRU générique (ADR-016)
│   ├── internal-cache.types.ts                          # [UTILS-029] Types génériques du cache LRU multi-domaines
│   ├── internal-cache.factory.ts                        # [UTILS-030] Fabrique de cache LRU avec TTL
│   └── index.ts                                         # [UTILS-031] Façade publique du module de cache
└── logger/                                              # Micro-DAG 2.3 : Journalisation structurée isomorphe
    ├── logger.types.ts                                  # [UTILS-010] Interfaces et types du logger structuré
    ├── logger.config.ts                                 # [UTILS-004] Niveaux de log, icônes et styles ANSI
    ├── logger-runtime.utils.ts                          # [UTILS-008] Détection d'environnement (Node.js vs Browser)
    ├── logger-state.utils.ts                            # [UTILS-007] Horodatage et contexte de corrélation
    ├── logger-filter.utils.ts                           # [UTILS-009] Filtrage des seuils et kill-switch LOGS_DISABLED
    ├── logger-formatter.utils.ts                        # [UTILS-006] Formatage ANSI et alignement textuel
    ├── logger-writer.utils.ts                           # [UTILS-011] Émission vers stdout/stderr ou console navigateur
    ├── logger.factory.ts                                # [UTILS-005] Usine d'instanciation de loggers structurés
    ├── index.ts                                         # [UTILS-012] Façade principale du service de journalisation
    └── events/                                          # Catalogue sémantique d'événements de journalisation
        ├── index.ts                                     # [UTILS-013] Export consolidé du catalogue d'événements
        ├── info/
        │   ├── runner-info.event.ts                     # [UTILS-014] Événements INFO orchestrateur
        │   ├── server-info.event.ts                     # [UTILS-015] Événements INFO serveur HTTP/SSE
        │   ├── storage-info.event.ts                    # [UTILS-016] Événements INFO persistance
        │   ├── agent-info.event.ts                      # [UTILS-017] Événements INFO processus CLI
        │   └── ui-info.event.ts                         # [UTILS-018] Événements INFO interface client
        ├── errors/
        │   ├── runner-error.event.ts                    # [UTILS-019] Événements ERROR orchestrateur
        │   ├── server-error.event.ts                    # [UTILS-020] Événements ERROR serveur HTTP/SSE
        │   ├── storage-error.event.ts                   # [UTILS-021] Événements ERROR persistance
        │   ├── agent-error.event.ts                     # [UTILS-022] Événements ERROR processus CLI
        │   └── ui-error.event.ts                        # [UTILS-023] Événements ERROR interface client
        └── debug/
            ├── runner-debug.event.ts                    # [UTILS-024] Traces DEBUG orchestrateur
            ├── server-debug.event.ts                    # [UTILS-025] Traces DEBUG serveur HTTP/SSE
            ├── storage-debug.event.ts                   # [UTILS-026] Traces DEBUG persistance
            ├── agent-debug.event.ts                     # [UTILS-027] Traces DEBUG processus CLI
            └── ui-debug.event.ts                        # [UTILS-028] Traces DEBUG interface client
```

### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| UTILS-001 | utils/primitives/string.utils.ts | Fonctions de manipulation de chaînes (sanitizeName, isNonEmptyString, joinPromptParts). |
| UTILS-002 | utils/primitives/array.utils.ts | Fonctions de manipulation de tableaux et d'objets indexés (reindex). |
| UTILS-003 | utils/primitives/id.utils.ts | Génération et validation d'identifiants de ressources (generateId, isValidResourceId, parseResourceFilename). |
| UTILS-004 | utils/logger/logger.config.ts | Configuration globale du logger (niveaux, libellés, icônes, styles ANSI). |
| UTILS-005 | utils/logger/logger.factory.ts | Usine de création des instances de logger structuré avec formatage et écriture. |
| UTILS-006 | utils/logger/logger-formatter.utils.ts | Moteur de formatage ANSI et alignement textuel des messages de logs. |
| UTILS-007 | utils/logger/logger-state.utils.ts | Gestion d'état interne du logger, horodatage et contextes de corrélation. |
| UTILS-008 | utils/logger/logger-runtime.utils.ts | Détection de l'environnement d'exécution (Node.js vs Browser) et adaptateurs console. |
| UTILS-009 | utils/logger/logger-filter.utils.ts | Filtrage des niveaux de log et évaluation du kill-switch LOGS_DISABLED. |
| UTILS-010 | utils/logger/logger.types.ts | Définitions de types et interfaces pour le système de journalisation structurée. |
| UTILS-011 | utils/logger/logger-writer.utils.ts | Primitives d'émission de logs vers stdout/stderr ou console navigateur. |
| UTILS-012 | utils/logger/index.ts | Façade principale d'accès et point d'entrée du service de journalisation. |
| UTILS-013 | utils/logger/events/index.ts | Point d'entrée consolidé du catalogue d'événements sémantiques. |
| UTILS-014 | utils/logger/events/info/runner-info.event.ts | Événements opérationnels et succès d'exécution pour l'orchestrateur de scénarios. |
| UTILS-015 | utils/logger/events/info/server-info.event.ts | Événements opérationnels pour le serveur HTTP et le flux SSE. |
| UTILS-016 | utils/logger/events/info/storage-info.event.ts | Événements opérationnels de persistance et de stockage. |
| UTILS-017 | utils/logger/events/info/agent-info.event.ts | Événements opérationnels liés aux agents et sous-processus CLI. |
| UTILS-018 | utils/logger/events/info/ui-info.event.ts | Événements opérationnels de l'interface utilisateur web et du client HTTP. |
| UTILS-019 | utils/logger/events/errors/runner-error.event.ts | Événements d'échecs et d'erreurs pour l'orchestrateur de scénarios. |
| UTILS-020 | utils/logger/events/errors/server-error.event.ts | Événements d'erreurs pour le serveur HTTP et le flux SSE. |
| UTILS-021 | utils/logger/events/errors/storage-error.event.ts | Événements d'erreurs de persistance et de manipulation du système de fichiers. |
| UTILS-022 | utils/logger/events/errors/agent-error.event.ts | Événements d'erreurs d'exécution des agents et sous-processus CLI. |
| UTILS-023 | utils/logger/events/errors/ui-error.event.ts | Événements d'erreurs de l'interface web et des requêtes client. |
| UTILS-024 | utils/logger/events/debug/runner-debug.event.ts | Traces de diagnostic approfondi pour l'orchestrateur de scénarios. |
| UTILS-025 | utils/logger/events/debug/server-debug.event.ts | Traces de diagnostic approfondi pour le serveur HTTP et le routage. |
| UTILS-026 | utils/logger/events/debug/storage-debug.event.ts | Traces de diagnostic approfondi pour la couche de persistance. |
| UTILS-027 | utils/logger/events/debug/agent-debug.event.ts | Traces de diagnostic approfondi pour les flux d'entrées/sorties des agents. |
| UTILS-028 | utils/logger/events/debug/ui-debug.event.ts | Traces de diagnostic approfondi pour les composants UI du navigateur. |
| UTILS-029 | utils/cache/internal-cache.types.ts | Types génériques du cache interne LRU multi-domaines (portage MedialogApi / ADR-016). |
| UTILS-030 | utils/cache/internal-cache.factory.ts | Fabrique de cache interne LRU multi-domaines avec TTL (portage MedialogApi / ADR-016). |
| UTILS-031 | utils/cache/index.ts | Point d'entrée public du module de cache interne LRU multi-domaines (portage MedialogApi / ADR-016). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

Les utilitaires exposent des contrats stricts répondant aux exigences suivantes :

- **`sanitizeName` vs `isValidResourceId` :** deux fonctions à responsabilités distinctes — `sanitizeName` transforme et assainit (nettoyage de présentation), tandis que `isValidResourceId` valide formellement la conformité du format sans altération.
- **`reindex` et clés numériques :** la renumérotation après suppression (`CASE-DATA-03-2`) opère uniquement sur les clés numériques séquentielles (`"0"`, `"1"`, `"2"`). Les clés personnalisées sont préservées intactes par le domaine appelant (`DOM-006`).
- **`generateId` avec entropie injectable :** injection optionnelle `randomFn?: () => number` permettant des tests 100 % déterministes sans dépendance à l'horloge système (`ADR-006`).
- **Journalisation structurée & Catalogue sémantique (`UTILS-004..028`) :** service de journalisation isomorphique offrant des appels mono-lignes, un kill-switch universel `LOGS_DISABLED=true`, et une arité $\le 3$.
- **Cache interne LRU multi-domaines (`UTILS-029..031`) :** implémentation générique avec TTL, éviction LRU, métriques d'efficacité (hits/misses) et réinitialisation atomique (`ADR-016`), strictement pure et sans I/O.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`utils`** | `types/` (déclaratif pur) | Tout concept métier ClientsBox, modules Node.js I/O (`fs`, `child_process`), `domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts` | `domain`, `lib`, `services`, `controllers`, `ui`, `index.ts` | Violation bloquante détectée par `CASE-ARCH-01-1` (DAG unilatéral sans dépendance ascendante). |
| **`utils/*` interne** | *(aucun import relatif interne)* | Autres modules de `utils/` (pas de dépendance croisée) | Modules applicatifs amont | Contrôlé par l'absence de cycles statiques (`CASE-ARCH-01-1`). |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `UTILS-001` | `SPEC-ENG-04` (jointure prompt via `joinPromptParts`), primitives génériques | — | — |
| `UTILS-002` | `SPEC-DATA-03` (renum keys) | `ADR-005` | — (primitive générique consommée par DOM-006) |
| `UTILS-003` | `SPEC-DATA-01` (IDs ressources) | `ADR-005` | `CASE-DATA-01-4` (primitives de soutien) |
| `UTILS-004..012` | `SPEC-UTILS-01` (journalisation structurée isomorphique) | `ADR-001` | `CASE-UTILS-01-1`, `CASE-UTILS-01-2`, `CASE-UTILS-01-3` |
| `UTILS-013..028` | `SPEC-UTILS-02` (catalogue sémantique 5 domaines) | `ADR-001` | `CASE-UTILS-02-1` |
| `UTILS-029..031` | `SPEC-UTILS-03` (cache interne LRU multi-domaines) | `ADR-016` | `CASE-UTILS-03-1`, `CASE-UTILS-03-2` |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste contractuellement de l'orthogonalité et de la pureté technique du module **`utils/`** :
1. Les 31 fichiers `UTILS-001` à `UTILS-031` sont formellement exempts de tout effet de bord système non sollicité et respectent l'étanchéité du Palier 2.
2. L'isomorphisme Node.js / Navigateur est garanti à 100 %.
3. Les tests unitaires dédiés (`tests/utils/string.utils.test.ts`, `tests/units/utils/`) et les tests d'architecture (`tests/arch/`) valident en continu cette conformité.

*Document validé et scellé pour le Palier 2 (`src/utils/`).*
