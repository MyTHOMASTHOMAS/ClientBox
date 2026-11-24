# Signature de Domaine — `src/domain/` (Palier 3 : Cœur Métier Pur & Isomorphe)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `DOMAIN`  
**Couche DAG :** `3-domain` *(Logique métier pure — 100 % isomorphe Node.js/navigateur, zéro I/O)*  
**Peut importer :** `types/`, `utils/`  
**Peut être importé par :** `services`, `ui`, `index.ts`  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`, `SPEC-ARCH-02`), [`ENG.md`](../specs/ENG.md) (`SPEC-ENG-01`..`04`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-01`, `SPEC-DATA-03`), [`UI.md`](../specs/UI.md) (`SPEC-UI-02`), décisions d'architecture ([`ADR-004`](../adr/ADR-004-moteur-de-blocs-en-memoire.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`domain/`** incarne le **Palier 3 et le cœur décisionnel métier pur** de ClientsBox.  
Sa responsabilité exclusive est de matérialiser les règles algorithmiques du canvas nodale (synchronisation Join, garde d'orphelins, politiques d'injection et assemblage de prompt — y compris l'ordre de sortie `exit` optionnel —, validation structurelle du graphe).

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 3

1. **Zéro I/O & Étanchéité Système Absolue (`SPEC-ARCH-02`, `CASE-ARCH-02-1`) :**
   - Interdiction totale et absolue d'importer `fs`, `child_process`, `net`, `http`, `url`, `vm`, `os`, `path` ni aucune autre API système Node.js.
   - Tout accès physique au monde extérieur est formellement délégué à `lib/`.
2. **Isomorphisme Garanti à 100 % :**
   - Tout le code de `domain/` s'exécute de façon strictement identique dans Node.js ≥ 24 et dans un navigateur web standard.
   - Il est directement importable par l'UI (`ui/`) pour valider les règles en temps réel côté client sans aller-retour réseau.
3. **Pureté Algorithmique & Absence d'État Partagé :**
   - Toutes les fonctions sont pures ou idempotentes.
   - L'état runtime d'un scénario (sacs d'entrées, politique courante) est passé sous forme de structure immutable en paramètre et retourné mis à jour, sans mutation d'état global ni singleton.
4. **Indépendance vis-à-vis de l'Infrastructure & des Adapters :**
   - `domain/` ne connaît ni `lib/`, ni `services/`, ni `controllers/`, ni `index.ts`.
   - Il interagit avec les contrats déclaratifs de `types/` mais n'instancie jamais de binaire CLI ni d'adapter concret.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 3 — Cœur Métier)

Dans le DAG macro, `domain/` est isolé de `lib/` (aucun couplage mutuel) et alimente `services/` et `ui/` :

```text
       ┌───────────────────────────────┐
       │       types/ & utils/         │
       └───────────────▲───────────────┘
                       │
                       │ (Imports autorisés)
                       │
       ┌───────────────┴───────────────┐                 ┌───────────────┐
       │       domain/ (Palier 3)      │                 │     lib/      │
       │    Logique métier isomorphe   │                 │ Effets I/O OS │
       │    Zéro I/O — 100% pur        │                 └───────▲───────┘
       └───────▲───────────────▲───────┘                         │
               │               │                                 │
               │               └─────────────────┬───────────────┘
               │                                 │
       ┌───────┴───────┐                 ┌───────┴───────┐
       │      ui/      │                 │   services/   │
       └───────────────┘                 └───────────────┘
```

### 2.2 Micro-DAG Intra-Couche (Ordre Topologique Strict des 6 Sous-Domaines)

Au sein des 6 sous-domaines officiels (`DOM-001..008`, `DOM-010..020` — `DOM-009` abrogé per CR-012), le flux de dépendances est strictement unilatéral et acyclique :

$$\text{schemas} \parallel \text{keys} \parallel \text{messages} \parallel \text{join} \parallel \text{prompt} \prec \text{graph}$$

```text
       ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
       │    domain/schemas/     │    │      domain/keys/      │    │    domain/messages/    │
       │ validation.error.ts    │    │ key-assigner.domain.ts │    │ block-message.factory  │
       │ agent, profile, prompt │    │ key-renumberer.domain  │    │ input-bag.domain.ts    │
       │ exit-condition.schema  │    │ key-collision.valid.   │    │ if-branch-power.disp.  │
       │    (DOM-013..017)      │    │    (DOM-005..007)      │    │    (DOM-010..012)      │
       └────────────────────────┘    └───────────┬────────────┘    └────────────────────────┘
                                                 │
       ┌────────────────────────┐                │                 ┌────────────────────────┐
       │      domain/join/      │                │                 │     domain/prompt/     │
       │ orphan-node.guard.ts   │                │                 │ injection-policy.eval. │
       │ join-barrier.evaluator │                │                 │ prompt.assembler.ts    │
       │    (DOM-001..002)      │                │                 │    (DOM-003..004)      │
       └────────────────────────┘                │                 └───────────┬────────────┘
                                                 │                             │
                                                 │ (Consommé par graph-integrity)
                                                 │                             │
                                     ┌───────────▼─────────────────────────────▼────────────┐
                                     │                    domain/graph/                     │
                                     │ node-transient-keys / graph-topology.res.            │
                                     │ graph-integrity.valid. / command-node.validator      │
                                     │              (DOM-008, 018..020)                     │
                                     └──────────────────────────────────────────────────────┘
```

> **Garantie d'acyclicité :**  
> `schemas/`, `keys/`, `messages/`, `join/` et `prompt/` sont des sous-domaines fonctionnellement orthogonaux sans import croisé direct.  
> `graph/` se situe au sommet du DAG intra-couche : il consomme les modèles et les primitives de clés (`keys/`), sans jamais réexporter ni créer de boucle descendante.  
> Le sous-domaine `domain/exit/` (`DOM-009` / `evaluateExitMatchers`) est **abrogé** (CR-012) : l'ordre de sortie `exit` est un texte assemblé via `DOM-004`, sans matching temps réel.

---

## 3. Inventaire & Arborescence des Fichiers (`src/domain/`)

```text
src/domain/
├── schemas/                                             # Micro-DAG 3.1 : Validation déclarative des ressources
│   ├── validation.error.ts                              # [DOM-017] Erreur typée de validation de schéma
│   ├── agent.schema.ts                                  # [DOM-013] Validation du schéma Agent
│   ├── profile.schema.ts                                # [DOM-015] Validation du schéma Profile
│   ├── prompt.schema.ts                                 # [DOM-016] Validation du schéma Prompt
│   └── exit-condition.schema.ts                         # [DOM-014] Validation du schéma ExitCondition
├── keys/                                                # Micro-DAG 3.2 : Primitives de clés de câblage
│   ├── key-assigner.domain.ts                           # [DOM-005] Assignation clé numérique séquentielle ("0", "1"...)
│   ├── key-renumberer.domain.ts                         # [DOM-006] Renumérotation immuable après suppression
│   └── key-collision.validator.ts                       # [DOM-007] Détection de collision et non-vacuité de clé
├── messages/                                            # Micro-DAG 3.3 : Fabrique & manipulation des sacs d'entrées
│   ├── block-message.factory.ts                         # [DOM-010] Fabrique pure de messages inter-blocs
│   ├── input-bag.domain.ts                              # [DOM-012] Opérations pures sur les sacs d'entrées N>=1
│   └── if-branch-power.dispatcher.ts                    # [DOM-011] Calcul binaire de puissance if(sac) (1 / 0)
├── join/                                                # Micro-DAG 3.4 : Synchronisation & barrières d'entrée
│   ├── orphan-node.guard.ts                             # [DOM-002] Garde d'inactivité des blocs orphelins (N=0)
│   └── join-barrier.evaluator.ts                        # [DOM-001] Algorithme join N>=1 (trigger | pause | waiting)
├── prompt/                                              # Micro-DAG 3.5 : Politiques d'injection & assemblage
│   ├── injection-policy.evaluator.ts                    # [DOM-003] Machine à états pure des 3 politiques d'injection
│   └── prompt.assembler.ts                              # [DOM-004] Concaténation systemPrompt + userPrompt + exitPrompt optionnel (\n\n)
└── graph/                                               # Micro-DAG 3.6 : Topologie & intégrité globale du graphe
    ├── node-transient-keys.constant.ts                  # [DOM-018] SCENARIO_NODE_NO_SAVE_KEYS (attributs volatils exclus)
    ├── graph-topology.resolver.ts                       # [DOM-019] Résolution des arcs entrants / sortants d'un nœud
    ├── graph-integrity.validator.ts                     # [DOM-008] Validation topologique (unicité Start, degré 0, clés)
    └── command-node.validator.ts                        # [DOM-020] Validation des nœuds Command (commandLine non vide)
```

### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| DOM-001 | domain/join/join-barrier.evaluator.ts | Algorithme de join N>=1 (trigger, pause, waiting) selon CDC R-08..15 et sum(power) === N. |
| DOM-002 | domain/join/orphan-node.guard.ts | Règle N=0 : inactivité absolue des blocs orphelins hors bloc Start (R-42d). |
| DOM-003 | domain/prompt/injection-policy.evaluator.ts | Logique des 3 politiques d'injection du profil (chaque_prompt, debut_scenario, une_fois_jusqu_a_clear). |
| DOM-004 | domain/prompt/prompt.assembler.ts | Concaténation systemPrompt, userPrompt et exitPrompt optionnel en un assembledPrompt unique (double saut de ligne, R-07 / R-45 / CR-012). |
| DOM-005 | domain/keys/key-assigner.domain.ts | Assignation automatique de la clé numérique séquentielle suivante ("0", "1", "2"...). |
| DOM-006 | domain/keys/key-renumberer.domain.ts | Renumérotation automatique des clés numériques après suppression d'une connexion (immutable). |
| DOM-007 | domain/keys/key-collision.validator.ts | Détection et rejet strict des collisions de clés sur un bloc cible et validation de non-vacuité. |
| DOM-008 | domain/graph/graph-integrity.validator.ts | Validation de l'intégrité structurelle du graphe (unicité Start, degré entrant 0, intégrité clés). |
| DOM-010 | domain/messages/block-message.factory.ts | Fabrique pure de construction de messages de bloc. |
| DOM-011 | domain/messages/if-branch-power.dispatcher.ts | Distribution unilatérale et calcul binaire de puissance if(sac). |
| DOM-012 | domain/messages/input-bag.domain.ts | Opérations pures de manipulation des sacs d'entrées N>=1. |
| DOM-013 | domain/schemas/agent.schema.ts | Validation déclarative et intégrité structurelle du schéma Agent (profilId, cliId, model optionnel). |
| DOM-014 | domain/schemas/exit-condition.schema.ts | Validation déclarative du schéma ExitCondition (`{ id, name, content }`, R-07 / CR-012). |
| DOM-015 | domain/schemas/profile.schema.ts | Validation déclarative et intégrité structurelle du schéma Profile (systemPrompt, policy). |
| DOM-016 | domain/schemas/prompt.schema.ts | Validation déclarative et intégrité structurelle du schéma Prompt. |
| DOM-017 | domain/schemas/validation.error.ts | Classe d'erreur typée de validation de schéma de ressource. |
| DOM-018 | domain/graph/node-transient-keys.constant.ts | Constante `SCENARIO_NODE_NO_SAVE_KEYS` : champs de nœud exclus de la persistance scénario (ex. `status`) ; strip écriture/lecture (`SPEC-DATA-03`, `AC-DATA-03-6`). |
| DOM-019 | domain/graph/graph-topology.resolver.ts | Résolution pure des connexions entrantes / sortantes d'un nœud pour le scheduler SVC-001. |
| DOM-020 | domain/graph/command-node.validator.ts | Validation des nœuds Command (présence et non-vacuité de commandLine, ADR-019, REQ-043). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

- **`evaluateJoin` est synchrone et pur :** l'algorithme ne gère pas d'attente temporelle. L'état `'waiting'` signifie simplement que l'intégralité des $N$ messages attendus n'a pas encore atteint le sac d'entrées (`SPEC-ENG-02`).
- **Distribution de puissance If (`R-15`) :** la fonction de script `if(sac)` retourne un booléen pur (`SPEC-DATA-02`). L'assignation de `power = 1` sur la branche active et `power = 0` sur la branche opposée relève de l'orchestration du runner (`SVC-001`), guidée par `NodeOutputPort.branch` de `TYPES-007`.
- **`policy-checker` comme automate pur :** l'état d'injection (`hasInjectedOnce: boolean`, `hasInjectedThisScenario: boolean`) est une structure retournée sans mutation en place.
- **Renumérotation sélective des clés (`DOM-006`) :** seules les clés numériques (`"0"`, `"1"`, etc.) sont réordonnées lors de la suppression d'une connexion ; les clés custom (`"promptData"`) sont préservées intactes.
- **Validation topologique stricte (`DOM-008`) :** vérifie l'existence exacte d'un seul bloc Start, le degré entrant nul sur ce Start (`R-20`), la validité des cibles et l'absence de collisions de clés.
- **Liste no-save des nœuds (`DOM-018`) :** exporte `SCENARIO_NODE_NO_SAVE_KEYS` (readonly, au minimum `"status"` en v1). UI et services de sérialisation **doivent** retirer ces clés à l'écriture et à la lecture du document scénario ; l'état runtime reste en mémoire / snapshot run (`SPEC-DATA-03`, `R-37`).
- **Topologie de connexions (`DOM-019`) :** résout les arcs entrants/sortants d'un nœud pour l'ordonnanceur (`SVC-001` / `SVC-009`).
- **Assemblage additif de l'ordre de sortie (`DOM-004` / R-07) :** lorsque le bloc Run porte un `exitId`, `assemblePrompt` concatène `exit.content` après le prompt de mission ; aucun matching temps réel ni arrêt anticipé du CLI.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`domain`** | `types/`, `utils/`, bibliothèques pures isomorphes | Modules Node.js (`fs`, `child_process`, `net`, `http`, `url`, `vm`, `os`, `path`), `lib/`, `services/`, `controllers/`, `ui/`, `index.ts` | `services/`, `ui/` (calculs partagés), `index.ts` | Violation bloquante détectée par `CASE-ARCH-02-1` (zéro I/O dans domain), `CASE-ARCH-02-2` (pureté imports) et `CASE-ARCH-01-1` (DAG unilatéral). |
| **`domain/keys`** | `types/models/connection.model.ts`, `utils/array.utils.ts` | Autres sous-domaines (`join/`, `prompt/`, `graph/`) | `services/`, `ui/`, `domain/graph/` (autorisé) | Ordre topologique strict $\text{keys} \prec \text{graph}$. |
| **`domain/graph`** | `types/models/` | Modules d'effets de bord ou d'orchestration | `services/`, `ui/`, `index.ts` | Détecté par l'analyseur de cycles statiques Vitest. |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `DOM-001` | `SPEC-ENG-02` | `ADR-004` | `CASE-ENG-02-1`, `CASE-ENG-02-2` |
| `DOM-002` | `SPEC-ENG-02` | `ADR-004` | `CASE-ENG-02-3` |
| `DOM-003` | `SPEC-ENG-04` | `ADR-004` | `CASE-ENG-04-2` |
| `DOM-004` | `SPEC-ENG-04`, `R-07`, `R-45` | `ADR-004` | `CASE-ENG-04-1`, `CASE-ENG-04-13` |
| `DOM-005` | `SPEC-DATA-03` | `ADR-005` | `CASE-UI-02-1` (assignation clé par défaut à la création) |
| `DOM-006` | `SPEC-DATA-03` | `ADR-004`, `ADR-005` | `CASE-DATA-03-2`, `CASE-DATA-03-3` |
| `DOM-007` | `SPEC-DATA-03` (collision, non-vacuité) | `ADR-004`, `ADR-005` | `CASE-DATA-03-4` |
| `DOM-008` | `SPEC-DATA-03` (topologie, cas limite 4), `REQ-015`, `R-20` | `ADR-004`, `ADR-005` | `CASE-DATA-03-5` |
| `DOM-010` | `SPEC-ENG-01` | `ADR-004` | `CASE-ENG-01-1`, `CASE-ENG-01-2` |
| `DOM-011` | `SPEC-ENG-01`, `SPEC-ENG-02` | `ADR-004` | `CASE-ENG-01-2`, `CASE-ENG-02-4` |
| `DOM-012` | `SPEC-ENG-01`, `SPEC-ENG-02` | `ADR-004` | `CASE-ENG-01-2`, `CASE-ENG-02-1`, `CASE-ENG-02-2` |
| `DOM-013` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-1` |
| `DOM-014` | `SPEC-DATA-01`, `R-07` | `ADR-005` | `CASE-DATA-01-3` |
| `DOM-015` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-2` |
| `DOM-016` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-3` |
| `DOM-017` | `SPEC-DATA-01` | `ADR-005` | `CASE-DATA-01-1..5` |
| `DOM-018` | `SPEC-DATA-03` (no-save), `SPEC-UI-02`, `R-37`, `REQ-111` | `ADR-004`, `ADR-005` | `CASE-DATA-03-6`, `CASE-UI-02-15` |
| `DOM-019` | `SPEC-ENG-01`, `SPEC-ENG-03` | `ADR-004` | `CASE-ENG-01-1`, `CASE-ENG-03-1` |
| `DOM-020` | `SPEC-DATA-03` | `ADR-019` | `CASE-DATA-03-8` |

### 6.2 Sceau Formel d'Attestation

Le présent document engage contractuellement l'étanchéité et l'isomorphisme du cœur de domaine **`src/domain/`** :
1. Les 19 modules `DOM-001..008` et `DOM-010..020` sont certifiés sans aucun import d'API I/O système Node.js (`CASE-ARCH-02-1`). Le module `DOM-009` est abrogé (CR-012).
2. Le Micro-DAG interne respecte la hiérarchie acyclique $\text{schemas} \parallel \text{keys} \parallel \text{messages} \parallel \text{join} \parallel \text{prompt} \prec \text{graph}$.
3. La couverture est vérifiée en continu par les suites de tests d'architecture et de moteur (`tests/arch/`, `tests/units/`).

*Document validé et scellé pour le Palier 3 (`src/domain/`).*
