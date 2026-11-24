# Signature de Domaine — `src/controllers/` (Palier 6 : Exposition Réseau & Transport)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `CONTROLLERS`  
**Couche DAG :** `6-controllers` *(Exposition réseau & Transport — HTTP + SSE. Traduit les requêtes HTTP en appels services et relaie les flux vers le client)*  
**Peut importer :** `types/`, `utils/`, `services/`  
**Peut être importé par :** `index.ts`  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`), [`SRV.md`](../specs/SRV.md) (`SPEC-SRV-02`), [`DATA.md`](../specs/DATA.md) (`SPEC-DATA-01`..`04`), [`ENG.md`](../specs/ENG.md) (`SPEC-ENG-04`), [`ADPT.md`](../specs/ADPT.md) (`SPEC-ADPT-03`), [`UI.md`](../specs/UI.md) (`SPEC-UI-01`..`03`), décisions d'architecture ([`ADR-001`](../adr/ADR-001-socle-applicatif.md), [`ADR-002`](../adr/ADR-002-gestionnaire-de-processus-cli.md), [`ADR-004`](../adr/ADR-004-moteur-de-blocs-en-memoire.md), [`ADR-005`](../adr/ADR-005-persistance-donnees-local.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`controllers/`** constitue le **Palier 6 et la passerelle de transport réseau** de ClientsBox.  
Sa responsabilité exclusive est de désérialiser les requêtes entrantes HTTP (REST) et d'alimenter le flux descendant SSE, en déléguant immédiatement l'exécution aux services sans contenir de logique métier.

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 6

1. **Zéro Logique Métier :**
   - Les contrôleurs ne prennent aucune décision algorithmique : ils vérifient les paramètres, sollicitent `services/`, et sérialisent les réponses en JSON.
2. **Étanchéité Vis-à-Vis de `domain/` et `lib/` (`SPEC-ARCH-01`, `CASE-ARCH-01-3`) :**
   - Les contrôleurs n'importent jamais directement ni `domain/` ni `lib/`.
   - Tout accès disque ou algorithme métier transite impérativement par `services/`.
   - Le découplage du routeur HTTP repose sur le contrat pur `types/contracts/http-router.contract.ts`.
3. **Flux Événementiel SSE Volatil & Sans Buffer Disque (`R-26`) :**
   - La distribution SSE vers le client est un flux direct : aucun chunk n'est mis en mémoire serveur persistante ni loggué sur disque.
4. **Réponses Localisées en Français (`REQ-007`, `C-06`) :**
   - Tous les messages d'erreur et corps de retour JSON (`{ "message": "..." }`) sont rédigés en langue française.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 6 — Passerelle Transport)

Dans le DAG macro, `controllers/` consomme `services/` et est uniquement assemblé par la Composition Root racine (`index.ts`) :

```text
       ┌───────────────────────────────┐
       │      services/ (Palier 5)     │
       └───────────────┬───────────────┘
                       │
                       │ (Délégation exclusive)
                       │
       ┌───────────────▼───────────────┐
       │    controllers/ (Palier 6)    │ ◄─── Zéro import de domain/ ni lib/
       │   Routes REST CRUD & flux SSE │
       └───────────────┬───────────────┘
                       │
                       │ (Monté par le bootstrap)
                       │
       ┌───────────────▼───────────────┐
       │           index.ts            │
       └───────────────────────────────┘
```

### 2.2 Micro-DAG Intra-Couche (Organisation Interne des Contrôleurs)

Au sein de `controllers/`, les contrats partagés alimentent indépendamment les modules HTTP REST et le flux SSE :

$$\text{shared} \prec (\text{http} \parallel \text{sse})$$

```text
                       ┌────────────────────────┐
                       │  controllers/shared/   │
                       │ execution-runner.types │
                       │       (CTL-006)        │
                       └───────────┬────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
        ┌──────────▼──────────┐         ┌──────────▼──────────┐
        │  controllers/http/  │         │  controllers/sse/   │
        │ resource, docs,     │         │ stream.controller   │
        │ execution/          │         │      (CTL-003)      │
        │ (CTL-001, 002,      │         └─────────────────────┘
        │  004, 005, 007)     │
        └─────────────────────┘
```

> **Garantie d'acyclicité interne :**  
> `shared/execution-runner.types.ts` (`CTL-006`) fournit les contrats purs `ActiveRunnerLike` et `RunnerHolder` à la fois à `http/execution/` et à `sse/stream.controller.ts`.  
> Il n'existe **aucun couplage transversal** direct entre `controllers/http/` et `controllers/sse/`.  
> Au sein de `http/execution/`, l'ordre topologique interne est acyclique : `helpers (CTL-004) → handlers (CTL-005) → controller (CTL-002)`.

---

## 3. Inventaire & Arborescence des Fichiers (`src/controllers/`)

```text
src/controllers/
├── shared/                                              # Contrats d'état d'exécution partagés entre REST et SSE
│   └── execution-runner.types.ts                        # [CTL-006] Contrats ActiveRunnerLike et RunnerHolder
├── cli/                                                 # Exécution directe en ligne de commande (headless)
│   └── cli-scenario.controller.ts                       # [CTL-008] Contrôleur d'exécution directe CLI sans socket HTTP
├── http/                                                # Endpoints HTTP REST
│   ├── resource.controller.ts                           # [CTL-001] Routes CRUD (/api/agents, profiles, scenarios, etc.)
│   ├── docs.controller.ts                               # [CTL-007] Routes GET /api/docs et POST /api/docs/export
│   └── execution/                                       # Sous-domaine de contrôle d'exécution REST
│       ├── execution-http.helper.ts                     # [CTL-004] Formatage JSON, erreurs HTTP et snapshot d'état
│       ├── execution-run.handler.ts                     # [CTL-005] Handlers GET / POST / DELETE sur /run
│       └── execution.controller.ts                      # [CTL-002] Enregistrement des routes /api/scenarios/:id/run
└── sse/                                                 # Diffusion temps réel Server-Sent Events
    └── stream.controller.ts                             # [CTL-003] Route SSE GET /api/scenarios/:id/stream
```

### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| CTL-001 | controllers/http/resource.controller.ts | Routes REST CRUD (agents, profils, prompts, exit, scenarios, adapters) et consultation sécurisée GET /api/if/:id. |
| CTL-002 | controllers/http/execution/execution.controller.ts | Routes de contrôle d'exécution GET/POST/DELETE /api/scenarios/:id/run (snapshot, démarrage, arrêt ; pas de clear HTTP). |
| CTL-003 | controllers/sse/stream.controller.ts | Route SSE temps réel relayant le streaming des scénarios vers le client. |
| CTL-004 | controllers/http/execution/execution-http.helper.ts | Helpers HTTP d'exécution (JSON, erreurs, snapshot run). |
| CTL-005 | controllers/http/execution/execution-run.handler.ts | Handlers HTTP GET/POST/DELETE /api/scenarios/:id/run. |
| CTL-006 | controllers/shared/execution-runner.types.ts | Contrats runner partagés entre HTTP et SSE (ActiveRunnerLike, RunnerHolder). |
| CTL-007 | controllers/http/docs.controller.ts | Routes documentation utilisateur : GET /api/docs (contenu embarqué) et POST /api/docs/export (miroir .agents/docs/). |
| CTL-008 | controllers/cli/cli-scenario.controller.ts | Contrôleur d'exécution directe de scénario en ligne de commande (CLI Headless) sans socket HTTP (SPEC-SRV-01, ADR-020). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

### 4.1 Matrice des Routes, Méthodes & Codes HTTP

| Verbe | Chemin | Contrôleur | Succès | Erreurs Documentées | Rôle Fonctionnel |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `GET` | `/api/agents` | `CTL-001` | `200 OK` | `500` | Liste tous les agents déclarés |
| `POST` | `/api/agents` | `CTL-001` | `201 Created` | `400` | Création d'un agent (profilId + cliId validés) |
| `GET` | `/api/agents/:id` | `CTL-001` | `200 OK` | `404` | Détail d'un agent |
| `PUT` | `/api/agents/:id` | `CTL-001` | `200 OK` | `400`, `404` | Mise à jour d'un agent |
| `DELETE` | `/api/agents/:id` | `CTL-001` | `204 No Content` | `404` | Suppression d'un agent |
| `GET` | `/api/profiles` | `CTL-001` | `200 OK` | `500` | Liste des profils d'agents |
| `POST` | `/api/profiles` | `CTL-001` | `201 Created` | `400` | Création d'un profil |
| `GET` | `/api/profiles/:id` | `CTL-001` | `200 OK` | `404` | Détail d'un profil |
| `PUT` | `/api/profiles/:id` | `CTL-001` | `200 OK` | `400`, `404` | Mise à jour d'un profil |
| `DELETE` | `/api/profiles/:id` | `CTL-001` | `204 No Content` | `404`, `409` | Suppression profil (intégrité référentielle R-05) |
| `GET` | `/api/scenarios` | `CTL-001` | `200 OK` | `500` | Liste des scénarios |
| `POST` | `/api/scenarios` | `CTL-001` | `201 Created` | `400` | Création d'un scénario |
| `GET` | `/api/scenarios/:id` | `CTL-001` | `200 OK` | `404` | Détail d'un scénario |
| `PUT` | `/api/scenarios/:id` | `CTL-001` | `200 OK` | `400`, `404` | Sauvegarde graphe de scénario |
| `DELETE` | `/api/scenarios/:id` | `CTL-001` | `204 No Content` | `404` | Suppression d'un scénario |
| `GET` | `/api/scenarios/:id/run` | `CTL-002` | `200 OK` | `404` | Snapshot d'exécution en mémoire (statut, scenarioId actif, blocs) pour réhydratation UI — sans replay terminal (`R-26`) |
| `POST` | `/api/scenarios/:id/run` | `CTL-002` | `200 OK` | `404`, `409`, `503` | Démarrage du scénario (gardes 409 si `activeRunner` présent / 503 service) |
| `DELETE` | `/api/scenarios/:id/run` | `CTL-002` | `200 OK` | `404` | Arrêt d'urgence du scénario en cours |
| `GET` | `/api/scenarios/:id/stream` | `CTL-003` | `200 OK` (SSE) | `404` | Flux temps réel Server-Sent Events |
| `GET` | `/api/prompts` | `CTL-001` | `200 OK` | `500` | Liste des ressources Prompts |
| `POST` | `/api/prompts` | `CTL-001` | `201 Created` | `400` | Création d'un prompt |
| `DELETE` | `/api/prompts/:id` | `CTL-001` | `204 No Content` | `404` | Suppression d'un prompt |
| `GET` | `/api/exit` | `CTL-001` | `200 OK` | `500` | Liste des conditions Exit |
| `POST` | `/api/exit` | `CTL-001` | `201 Created` | `400` | Création d'une condition Exit |
| `DELETE` | `/api/exit/:id` | `CTL-001` | `204 No Content` | `404` | Suppression d'une condition Exit |
| `GET` | `/api/if` | `CTL-001` | `200 OK` | `500` | Liste des scripts conditionnels If |
| `GET` | `/api/if/:id` | `CTL-001` | `200 OK` | `400`, `404` | Consultation sécurisée du script If (REQ-011) |
| `DELETE` | `/api/if/:id` | `CTL-001` | `204 No Content` | `404` | Suppression d'un script If |
| `GET` | `/api/adapters` | `CTL-001` | `200 OK` | `500` | Liste des CLI Adapters opérationnels |
| `GET` | `/api/models` | `CTL-001` | `200 OK` | `500` | Énumération des modèles d'IA disponibles pour l'autocomplétion |
| `GET` | `/api/docs` | `CTL-007` | `200 OK` | `500` | Liste / contenu de la documentation utilisateur embarquée (`ADR-017`) |
| `POST` | `/api/docs/export` | `CTL-007` | `200 OK` | `500` | Export miroir Markdown vers `.agents/docs/` |

### 4.2 Principes Contractuels Détaillés

- **Découplage via `HttpRouter` :** les contrôleurs dépendent exclusivement de l'interface `types/contracts/http-router.contract.ts`, sans importer l'implémentation concrète `MiniRouter` de `lib/http/router.ts`.
- **Relais SSE transparent & désabonnement (`CTL-003`) :** `stream.controller.ts` transmet en flux continu les chunks stdout/stderr et les transitions d'états reçus du runner vers le client distant, et désabonne systématiquement ses écouteurs (`runner.off`) lors de la déconnexion client (`req.on('close')`) ou de l'arrêt du runner pour éliminer tout risque de fuite mémoire.
- **Cycle de vie du runner & gardes de statut (`CTL-002`) :** `execution.controller.ts` orchestre les runs via `runnerHolder` avec : `GET /api/scenarios/:id/run` (snapshot RAM : statut global, `scenarioId` actif, statuts de blocs — jamais de chunks terminal, `R-26` / `R-37`) ; `POST` avec `503` si `startRunner` n'est pas initialisé et `409` si `activeRunner != null` (y compris statut `paused`) ; `DELETE` pour l'arrêt d'urgence. Aucune route HTTP de clear manuel d'agent (`SPEC-ADPT-03`).
- **Consultation de scripts ressources (`CTL-001`) :** `resource.controller.ts` expose l'endpoint `GET /api/if/:id` permettant la lecture sécurisée du contenu du script JS par l'IHM (`REQ-011`), avec rejet strict des tentatives de *path traversal* (`400 Requête invalide`).
- **Documentation utilisateur (`CTL-007`, `ADR-017`) :** délègue à `SVC-013` ; `GET /api/docs` lit le manifeste embarqué (jamais un dossier `public/`) ; `POST /api/docs/export` matérialise `.agents/docs/` et renvoie `{ ok, target, files }` ou une erreur en français.

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`controllers`** | `types/`, `utils/`, `services/` | Modules système Node.js direct (`fs`, `child_process`), `domain/`, `lib/`, `ui/`, `index.ts` | `index.ts` | Violation bloquante détectée par `CASE-ARCH-01-3` (étanchéité controllers ↛ domain/lib). |
| **`controllers/shared`** | `types/models/`, `types/messages/` | `controllers/http/`, `controllers/sse/`, `services/`, `lib/`, `domain/` | `controllers/http/`, `controllers/sse/`, `index.ts` | Contrats purs partagés. |
| **`controllers/http`** | `types/`, `services/`, `controllers/shared/` | `controllers/sse/`, `lib/`, `domain/` | `index.ts` | Contrôlé par l'absence de cycles statiques (`CASE-ARCH-01-1`). |
| **`controllers/sse`** | `types/`, `services/`, `controllers/shared/` | `controllers/http/`, `lib/`, `domain/` | `index.ts` | Détecté par l'analyseur de cycles statiques Vitest. |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `CTL-001` | `SPEC-DATA-01..04`, `SPEC-UI-01` | `ADR-005` | `CASE-UI-01-2`, `CASE-UI-01-3` |
| `CTL-002` | `SPEC-ENG-04`, `SPEC-ADPT-03`, `SPEC-UI-02`, `SPEC-UI-03` | `ADR-004`, `ADR-002` | `CASE-UI-02-5`, `CASE-UI-03-2`, `CASE-UI-03-3` |
| `CTL-003` | `SPEC-UI-02`, `SPEC-UI-03` | `ADR-001`, `ADR-004` | `CASE-UI-02-4`, `CASE-UI-03-1` |
| `CTL-004` | `SPEC-SRV-02`, `SPEC-UI-03` | `ADR-001`, `ADR-004` | `CASE-UI-03-2`, `CASE-UI-03-3` |
| `CTL-005` | `SPEC-SRV-02`, `SPEC-ENG-04`, `SPEC-UI-03` | `ADR-001`, `ADR-004` | `CASE-UI-03-2`, `CASE-UI-03-3` |
| `CTL-006` | `SPEC-SRV-02`, `SPEC-UI-02`, `SPEC-UI-03` | `ADR-001`, `ADR-004` | `CASE-UI-02-4`, `CASE-UI-03-1..3` |
| `CTL-007` | `SPEC-SRV-02`, `SPEC-DATA-05`, `SPEC-UI-04` | `ADR-012`, `ADR-017` | `CASE-SRV-02-17`, `CASE-SRV-02-18`, `CASE-UI-04-3` |
| `CTL-008` | `SPEC-SRV-01` | `ADR-020` | `CASE-SRV-01-6`, `CASE-SRV-01-7` |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste contractuellement de l'étanchéité de la couche transport **`src/controllers/`** :
1. Les 8 modules `CTL-001` à `CTL-008` n'importent ni `domain/` ni `lib/` de façon directe (`CASE-ARCH-01-3`).
2. Tous les flux vers l'UI sont formulés en français et reposent sur des contrats découplés.
3. La conformité est vérifiée en continu par `tests/arch/` et les tests d'intégration applicative.

*Document validé et scellé pour le Palier 6 (`src/controllers/`).*
