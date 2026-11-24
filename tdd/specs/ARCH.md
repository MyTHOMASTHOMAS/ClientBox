# Spécifications — Architecture Technique & Intégrité Modulaire

**Domaine :** `ARCH`  
**Document maître :** `tdd/specs/sommaire.md`  
**ADR d'ancrage :** [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md), [`ADR-002`](../docs/adr/ADR-002-contrat-adapter.md), [`ADR-003`](../docs/adr/ADR-003-adapter-cursor-cli.md), [`ADR-004`](../docs/adr/ADR-004-moteur-blocs.md), [`ADR-005`](../docs/adr/ADR-005-persistance-data.md), [`ADR-006`](../docs/adr/ADR-006-strategie-et-harnais-de-test.md), [`ADR-012`](../docs/adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../docs/adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../docs/adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md)  
**Signatures de référence :** [`signature.md`](../docs/signature/signature.md), [`signature-src.md`](../docs/signature/signature-src.md), [`signature-types.md`](../docs/signature/signature-types.md), [`signature-utils.md`](../docs/signature/signature-utils.md), [`signature-domain.md`](../docs/signature/signature-domain.md), [`signature-lib.md`](../docs/signature/signature-lib.md), [`signature-services.md`](../docs/signature/signature-services.md), [`signature-controllers.md`](../docs/signature/signature-controllers.md), [`signature-ui.md`](../docs/signature/signature-ui.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v1.md` (statut §12 verrouillé)

### Périmètre d'application

Les spécifications d'architecture (`SPEC-ARCH-01` à `SPEC-ARCH-09`) et les tests d'architecture automatisés associés régissent exclusivement la base de code applicative sous `src/` ainsi que la conformité et le déterminisme de l'outillage partagé du harnais de test sous `tests/helpers/`. Ils n'imposent aucune contrainte de scan syntaxique prescriptive ou intrusive sur les suites de tests unitaires/d'intégration sous `tests/` afin de préserver l'intégrité et l'autonomie des tests de domaine, d'adapters et de services.

---

## SPEC-ARCH-01 — Graphe acyclique de dépendances (DAG) et étanchéité des couches logicielles

**Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, `ADR-022`, signatures `ROOT-001`, `TYPES-001..015`, `CONFIG-001..004`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..028`, `SVC-001..023`, `CTL-001..007`, `UI-001..059`  
**Statut :** proposé  
**Version :** v1.6 (2026-11-17 — Étanchéité absolue de src/config/ sans import de lib/, contrats purs sous types/contracts/ TYPES-014..015)

### Règle

> L'organisation du code source sous `src/` obéit strictement à un Graphe Acyclique Direct (DAG) unilatéral.
> Aucune dépendance cyclique n'est permise et chaque couche dispose d'un périmètre d'importation strictement délimité.
> La couche `types/` est déclarative pure (zéro logique runtime).
> La couche `src/config/` regroupe les constantes et schémas déclaratifs d'environnement et d'options CLI. Ses imports entrants sont strictement régis ainsi : elle a le droit d'importer des **types purs de `types/`** (`import type`, ex: `CliParserSchema` per `TYPES-014` et `EnvSchema` per `TYPES-015`) et **tout ce qui provient d'`utils/`** (valeurs et types purs). Tout import depuis `src/lib/` (y compris `import type`) est formellement interdit, garantissant que `src/config/` ne connaît aucun composant d'infrastructure. Elle ne peut être importée **exclusivement que par `src/services/config/` (`ConfigService`)**. Tout import de `src/config/` est strictement interdit depuis `src/domain/` (afin de préserver l'isomorphisme sans I/O et empêcher toute fuite de configuration serveur vers l'IHM web `ui/`), depuis `src/index.ts` (obligation de passer par `ConfigService`), ainsi que depuis `src/lib/`, `src/controllers/` ou `src/ui/`.
> Les `controllers/` n'ont aucun accès direct à `domain/` ni à `lib/`. La couche `ui/` s'exécute dans le navigateur et n'accède à aucun module Node.js ni à `lib/` ou `services/` ; son architecture interne suit un Micro-DAG par dossier à 5 niveaux ($\text{api} \parallel \text{i18n} \parallel \text{types} \prec \text{hooks} \prec \text{components} \prec \text{pages} \prec \text{app.tsx}$) en composants déclaratifs Preact TSX. Le fichier racine `src/index.ts` est l'unique Composition Root autorisée à orchestrer l'assemblage complet du serveur en déployant préalablement `ConfigService`.

#### 1. Schéma du DAG Macro Global

```text
                     ┌───────────┐
                     │   types   │ ◄─────────────────────────────────────────┐ (Importable par TOUS)
                     └─────┬─────┘                                           │
                           │                                                 │
                     ┌─────▼─────┐                                           │
                     │   utils   │ (Utilitaires purs sans état)              │
                     └─────┬─────┘                                           │
         ┌─────────────────┼─────────────────┐                               │
         │ (Tout utils)    │ (Tout utils)    │ (Tout utils)                  │
   ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐                         │
   │  domain   │     │  config   │     │    lib    │                         │
   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘                         │
         │ (Métier pur)    │ (Import         │ (I/O)                         │
         │                 │  exclusif)      │                               │
         │           ┌─────▼─────────────────▼┐                              │
         ├──────────►│        services        │ (Dont ConfigService)         │
         │           └─────────────┬──────────┘                              │
         │                         │                                         │
         │                  ┌──────▼──────┐                                  │
         │                  │ controllers │ (HTTP / SSE)                     │
         │                  └──────┬──────┘                                  │
         │                         │                                         │
         │                  ┌──────▼──────┐                                  │
         │                  │  index.ts   │ (Composition Root serveur)       │
         │                  └──────┬──────┘                                  │
         │                         │ (distribution in-memory)                │
         ▼                         ▼                                         │
   ┌───────────────────────────────────────────┐                             │
   │                    ui                     │ (Navigateur — Preact TSX) ──┘
   └───────────────────────────────────────────┘
```

> **Ordre topologique macro :**  
> $\text{types} \prec \text{utils} \prec \text{config} \prec (\text{domain} \parallel \text{lib}) \prec \text{services} \prec \text{controllers} \prec (\text{ui} \parallel \text{index.ts})$  
> *(avec $\text{utils} \prec \text{config}$ car `config` peut importer tout `utils`, et restriction d'importation sortante de $\text{config}$ confinée strictement à $\text{services/config/}$)*

#### 2. Schéma du Micro-DAG Front par dossier (`src/ui/` — 5 Niveaux)

L'architecture interne de la couche `src/ui/` est régie par un Micro-DAG par dossier à 5 niveaux topologiques unilatéraux stricts, garantissant le découpage Clean Code entre le transport réseau, les dictionnaires linguistiques, les types d'interface, les hooks réactifs, les composants de présentation VDOM et les pages de routes applicatives :

$$\text{Niveau 0 (api } \parallel \text{i18n } \parallel \text{types)} \prec \text{Niveau 1 (hooks)} \prec \text{Niveau 2 (components)} \prec \text{Niveau 3 (pages)} \prec \text{Niveau 4 (app.tsx)}$$

```text
       ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
       │  src/ui/api   │     │  src/ui/i18n  │     │ src/ui/types  │  Niveau 0 : Fondations pures
       └───────┬───────┘     └───────┬───────┘     └───────┬───────┘  (Zéro JSX, zéro dépendance interne UI)
               │                     │                     │
               └───────────────┬─────┴─────────────────────┘
                               │
                       ┌───────▼───────┐
                       │ src/ui/hooks  │                              Niveau 1 : Logique d'état & calculs
                       └───────┬───────┘                              (Gestion d'état, SSE, géométrie Bézier — Zéro JSX)
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

#### 3. Matrice d'admissibilité des imports intra-UI (Micro-DAG Front)

| Niveau | Sous-dossier / Cible | Peut importer (intra-UI) | Interdictions absolues (violations bloquantes) |
|:---|:---|:---|:---|
| **0** | `src/ui/api/` (`http.client.ts`, `sse.client.ts`) | *(aucun autre dossier de `ui/`)* | `hooks/`, `components/`, `pages/`, `app.tsx`, tout JSX/VDOM |
| **0** | `src/ui/i18n/` (`fr.i18n.ts`, `user-docs.manifest.ts`) | *(aucun autre dossier de `ui/`)* | `api/`, `types/`, `hooks/`, `components/`, `pages/`, `app.tsx` |
| **0** | `src/ui/types/` (`canvas.types.ts`, `ui.types.ts`) | `types/` *(imports relatifs intra-types)* | `api/`, `i18n/`, `hooks/`, `components/`, `pages/`, `app.tsx` |
| **1** | `src/ui/hooks/` (`common/`, `docs/`, `canvas/`, `studio/`) | `api/`, `i18n/`, `types/`, `hooks/` *(frères)* | `components/`, `pages/`, `app.tsx`, balisage VDOM ou composants TSX |
| **2** | `src/ui/components/` (`common/`, `layout/`, `canvas/`, `terminal/`, `docs/`) | `api/`, `i18n/`, `types/`, `hooks/`, sous-composants `common/` (sauf depuis `common/` lui-même) | `pages/`, `app.tsx` *(interdiction formelle de dépendance ascendante)* |
| **3** | `src/ui/pages/` (`*-page.tsx`) | `api/`, `i18n/`, `types/`, `hooks/`, `components/` | Autres pages `pages/*.tsx` *(isolation stricte des routes applicatives)*, `app.tsx` |
| **4** | `src/ui/app.tsx` | `api/`, `i18n/`, `types/`, `hooks/`, `components/`, `pages/` | *(Composition Root UI — point terminal de montage)* |

### Portée

- Couvre l'absence absolue de dépendances circulaires dans l'arborescence complète de `src/`.
- Couvre la pureté déclarative de la couche `types/` (interdiction d'instructions exécutées, corps de fonctions, boucles, instanciations ou imports applicatifs).
- Couvre l'étanchéité de la couche `controllers/` vis-à-vis de `domain/` et `lib/` (passage exclusif par `services/`, `types/` et `utils/`).
- Couvre l'étanchéité de la couche `ui/` vis-à-vis des modules runtime Node.js (`fs`, `child_process`, `net`, `http`, `path`, etc.) et des couches serveur (`lib/`, `services/`).
- Couvre l'autorisation d'import de `domain/` depuis `ui/` pour les calculs purs isomorphes (validation topologique, clés de connexion).
- Couvre l'organisation interne de la couche `src/ui/` selon un Micro-DAG par dossier à 5 niveaux topologiques unilatéraux : `api/` & `i18n/` & `types/` (Niveau 0) ≺ `hooks/` (Niveau 1) ≺ `components/` (Niveau 2) ≺ `pages/` (Niveau 3) ≺ `app.tsx` (Niveau 4).
- Couvre l'interdiction stricte des dépendances ascendantes ou cycliques intra-UI (interdiction pour `components/` d'importer `pages/`, interdiction pour `hooks/` d'importer du JSX, interdiction d'imports croisés entre pages).
- Ne couvre pas la pureté interne et l'absence d'I/O de `domain/` → `SPEC-ARCH-02`.
- Ne couvre pas l'isolation des effets de bord dans `lib/` → `SPEC-ARCH-03`.
- Ne couvre pas le découplage par interfaces et la Composition Root → `SPEC-ARCH-04`.

### Scénarios nominaux

```gherkin
Scénario : Validation de l'acyclicité du graphe des modules de src/
  Étant donné l'ensemble des fichiers TypeScript du projet sous "src/"
  Quand on analyse la totalité des imports statiques inter-fichiers
  Alors aucun cycle de dépendance direct ou indirect n'existe
  Et le graphe d'importation forme un DAG strict à 8 niveaux

Scénario : Conformité à la matrice d'imports unilatérale des signatures
  Étant donné la matrice d'imports de "tdd/docs/signature/signature.md" section 5
  Quand on analyse la totalité des imports statiques inter-couches sous "src/"
  Alors chaque import inter-couches est autorisé par la cellule "Ce qu'elle PEUT importer" de la couche source
  Et aucun import n'emprunte une direction interdite (ex: domain/ → lib/, services/ → ui/, controllers/ → ui/)

Scénario : Pureté déclarative de la couche types/
  Étant donné les fichiers situés dans "src/types/"
  Quand on inspecte leur syntaxe et leurs instructions
  Alors ils ne contiennent aucun corps de fonction, classe instanciable, boucle ou conditionnelle
  Et ils n'importent aucun fichier provenant de "src/utils/", "src/domain/", "src/lib/", "src/services/", "src/controllers/", "src/ui/" ou "src/index.ts"
  Et les seuls imports internes autorisés sous "src/" sont des chemins relatifs restant dans "src/types/"

Scénario : Étanchéité stricte des contrôleurs
  Étant donné les fichiers situés dans "src/controllers/"
  Quand on inspecte l'ensemble de leurs déclarations d'import
  Alors aucun fichier de "src/controllers/" n'importe de chemin situé dans "src/domain/"
  Et aucun fichier de "src/controllers/" n'importe de chemin situé dans "src/lib/"
  Et toutes les interactions métier ou I/O passent exclusivement par "src/services/"

Scénario : Isolation de la couche UI navigateur
  Étant donné les fichiers situés dans "src/ui/"
  Quand on inspecte l'ensemble de leurs déclarations d'import
  Alors aucun fichier n'importe de module natif Node.js ("node:fs", "node:child_process", "node:http", etc.)
  Et aucun fichier n'importe de module provenant de "src/lib/" ou "src/services/"
  Et les seuls modules internes importés proviennent de "src/types/", "src/utils/" ou "src/domain/"

Scénario : Validation du Micro-DAG par dossier au sein de la couche src/ui/
  Étant donné les fichiers TypeScript et TSX situés sous "src/ui/"
  Quand on analyse les imports statiques entre les répertoires internes de "src/ui/"
  Alors le graphe interne obéit strictement à l'ordre topologique : (api/ || i18n/ || types/) ≺ hooks/ ≺ components/ ≺ pages/ ≺ app.tsx
  Et aucun fichier de "src/ui/components/" n'importe de module depuis "src/ui/pages/" ou "src/ui/app.tsx"
  Et aucun fichier de "src/ui/hooks/" n'importe de composant JSX issu de "src/ui/components/" ou "src/ui/pages/"
  Et aucun fichier de "src/ui/api/" ou "src/ui/i18n/" ne dépend d'un autre sous-dossier de "src/ui/"
  Et aucune dépendance circulaire n'existe entre les pages de "src/ui/pages/"
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Dépendance circulaire indirecte (ex: `services/a` → `services/b` → `services/a`) | Détectée comme violation d'architecture et refusée à l'analyse statique. |
| 2 | Déclaration de `class` ou fonction avec logique runtime dans `src/types/` | Rejetée : la couche types ne tolère que `interface`, `type alias`, `const enum` ou types structuraux purs. |
| 3 | Import depuis `src/utils/` ou toute autre couche applicative (`domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts`) dans `src/types/` | Interdit. Les imports relatifs **intra-`src/types/`** restent autorisés (cf. inventaire signé, ex. `TYPES-010`). |
| 4 | Import direct d'un modèle `domain/` par un contrôleur pour formater une réponse | Interdit : les contrôleurs manipulent exclusivement les contrats de `types/` et les retours des services de `services/`. |
| 5 | Import d'un module Node.js déguisé sans préfixe `node:` dans `src/ui/` (ex: `import * as fs from 'fs'`) | Détecté et rejeté comme violation d'étanchéité navigateur. |
| 6 | Import d'un composant de page (ex: `pages/agents-page.tsx`) à l'intérieur d'un composant générique (ex: `components/common/button.tsx`) | Interdit : violation de la hiérarchie du Micro-DAG front. |
| 7 | Import de balisage VDOM ou de composant JSX à l'intérieur d'un custom hook de `src/ui/hooks/` | Interdit : séparation stricte de la logique réactive et du rendu visuel. |
| 8 | Import croisé entre deux pages applicatives de `src/ui/pages/` (ex: `agents-page.tsx` importe `profiles-page.tsx`) | Interdit : chaque page est une unité de route autonome et étanche. |

### Ce qui n'est pas défini

- *2026-10-01* — Outil d'analyse statique automatisé (ex: `madge` ou `eslint-plugin-import`) : les règles s'appliquent contractuellement et sont vérifiables par les suites de tests `CASE-ARCH-*`.

### Critères d'acceptation

- [ ] `AC-ARCH-01-1` — Le graphe de dépendances statique de l'ensemble de `src/` est strictement acyclique (DAG) sans dépendances circulaires directes ou indirectes (`CASE-ARCH-01-1`).
- [ ] `AC-ARCH-01-2` — La couche `src/types/` n'admet que des déclarations `interface`, `type` (alias), `const enum` ou types structuraux purs ; aucun statement exécutable, aucune initialisation runtime (`export const` valeur, `enum` non-const, fonction avec corps, `class`) ; n'importe ni `src/utils/` ni aucune couche applicative (`domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts`) ; les imports relatifs intra-`src/types/` et les dépendances externes de types pures sont autorisés (`CASE-ARCH-01-2`).
- [ ] `AC-ARCH-01-3` — La couche `src/controllers/` n'importe aucun fichier issu de `src/domain/` ni de `src/lib/`, consommant exclusivement `types/`, `utils/` et `services/` (`CASE-ARCH-01-3`).
- [ ] `AC-ARCH-01-4` — La couche `src/ui/` n'importe aucun fichier issu de `src/lib/`, `src/services/` ni aucun module natif Node.js (`fs`, `child_process`, `net`, `http`, `path`, etc.) (`CASE-ARCH-01-4`).
- [ ] `AC-ARCH-01-5` — Tout import inter-couches sous `src/` est conforme à la matrice d'imports unilatérale `signature.md` §5 (allow-list par couche) ; l'acyclicité seule ne suffit pas (`CASE-ARCH-01-5`).
- [ ] `AC-ARCH-01-6` — L'architecture interne de la couche `src/ui/` respecte strictement l'ordre topologique du Micro-DAG par dossier en 5 niveaux ((api/ || i18n/ || types/) ≺ hooks/ ≺ components/ ≺ pages/ ≺ app.tsx) sans aucune dépendance ascendante ou circulaire intra-front (`CASE-ARCH-01-6`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la légitimité de l'import de `domain/` depuis `ui/` | Acceptée | Conforme aux signatures : `DOM-005`, `DOM-006`, `DOM-007` et `DOM-008` sont 100% purs et isomorphes, permettant à l'UI de valider le graphe et les clés sans latence réseau. |
| Sanctuariser l'interdiction de `lib/` dans `controllers/` | Acceptée | Maintient la frontière de responsabilité : le contrôleur n'accède ni au disque, ni aux processus, ni à l'implémentation du routeur. |
| Formalisation du Micro-DAG par dossier pour la couche UI | Acceptée | Conforme à `signature-ui.md` : garantit un frontend Clean Code, empêche le couplage fort entre composants et pages, et simplifie la testabilité unitaire en VDOM. |

---

## SPEC-ARCH-02 — Pureté, zéro-I/O et isomorphisme de la couche Domaine (`domain/`)

**Exigences :** `REQ-014` à `REQ-020`, `REQ-026`, `REQ-033` à `REQ-038`, `R-06` à `R-17`, `R-20`, `R-42` à `R-45`, `C-09`, `C-10`, `C-14`, `C-15`, `ADR-004`, `ADR-005`, signatures `DOM-001..008`, `DOM-010..020`  
**Statut :** proposé  
**Version :** v1.1 (2026-11-20, CR-012 — abrogation de DOM-009 / matchers exit)

### Règle

> Les modules de la couche `src/domain/` (`DOM-001..008`, `DOM-010..020`) constituent le cœur logique métier de ClientsBox.
> Ils sont 100 % isomorphes (exécutables à l'identique dans Node.js ≥ 24 et dans tout navigateur moderne) et strictement exempts d'I/O (zéro import de `fs`, `child_process`, `net`, `http`, `url`, `os`, `vm`, `path`).
> Tous les modules du domaine exposent des fonctions pures synchrones ou des machines à états pures, déterministes, sans état global partagé ni mutation de structures externes.

### Portée

- Couvre l'absence absolue d'appels ou d'imports d'APIs système Node.js dans `src/domain/`.
- Couvre le déterminisme pur de l'évaluation de join (`DOM-001 evaluateJoin`), calculant l'état `'trigger'`, `'pause'` ou `'waiting'`.
- Couvre la détection des blocs orphelins (`DOM-002 isOrphanBlock`) appliquant la règle $N=0$ stricte (`R-42d`) et l'exception Start (`R-42c`).
- Couvre la machine à états des 3 politiques de profil (`DOM-003 policy-checker`) sans mutation d'état global.
- Couvre l'assemblage de prompt sans effet de bord (`DOM-004 prompt.assembler`, incluant l'ordre de sortie `exit` optionnel).
- Couvre les algorithmes de gestion des clés (`DOM-005 default-assigner`, `DOM-006 key-renumberer`, `DOM-007 key-collision`) garantissant l'immutabilité des connexions et la préservation stricte des clés personnalisées (`R-43`).
- Couvre la validation structurelle du graphe (`DOM-008 graph-validator`) imposant l'unicité de Start (`REQ-015`) et le degré entrant nul (`R-20`).
- Ne couvre pas la persistance des graphes sur disque → `SPEC-DATA-03` / `SPEC-ARCH-03`.
- Ne couvre pas l'exécution physique du processus CLI ni la temporisation → `SPEC-ADPT-03` / `SPEC-ARCH-03`.

### Scénarios nominaux

```gherkin
Scénario : Absence totale d'I/O et de modules système dans domain/
  Étant donné l'ensemble des fichiers situés sous "src/domain/"
  Quand on analyse l'arbre d'importation et les symboles référencés
  Alors aucun module système ("node:fs", "node:child_process", "node:net", "node:http", "node:os", "node:path", "node:url", "node:vm") n'est importé
  Et aucun appel direct à "process.cwd()", "process.env", "fetch" ou "WebSocket" n'est effectué

Scénario : Évaluation pure et synchrone du Join (DOM-001)
  Étant donné un sac d'entrées "BlockInputBag" et une liste de "Connection"
  Quand la fonction "evaluateJoin" est invoquée
  Alors elle retourne de manière pure et synchrone "trigger", "pause" ou "waiting"
  Et aucune variable globale ni structure passée en argument n'est mutée

Scénario : Préservation immutable des clés custom lors du renumérotage (DOM-006)
  Étant donné une liste de connexions contenant des clés numériques ("0", "1", "2") et une clé custom ("monInput")
  Quand la fonction "renumberDefaultKeys" est exécutée suite à la suppression d'une clé
  Alors un nouveau tableau de connexions est retourné sans modifier le tableau initial
  Et la clé custom "monInput" conserve strictement sa valeur sans altération

Scénario : Validation topologique pure du graphe (DOM-008)
  Étant donné un ensemble de nœuds et connexions d'un scénario
  Quand "validateGraph" est invoquée
  Alors elle valide l'unicité de Start, l'absence de connexion entrante sur Start (degré entrant = 0) et l'absence de collisions
  Et elle retourne un tableau d'erreurs en français sans effectuer aucun accès disque
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Présence d'un import de `path` ou `url` dans un module de `domain/` | Détectée comme violation d'isomorphisme et rejetée : les calculs de chaînes doivent utiliser `utils/primitives/string.utils.ts` ou les API standard JS. |
| 2 | Utilisation d'une variable globale mutable ou closure d'état dans `DOM-003` | Rejetée : l'état d'injection de politique doit être passé en paramètre et retourné dans une nouvelle structure (`state`). |
| 3 | Clé de connexion vide ou composée d'espaces soumise à `isValidConnectionKey` (`DOM-007`) | Retourne `false` immédiatement sans lever d'exception non gérée. |
| 4 | Bloc Start recevant une connexion entrante dans `validateGraph` (`DOM-008`) | Détecté immédiatement et sanctionné par un message d'erreur en français per règle `R-20`. |

### Ce qui n'est pas défini

- *2026-10-01* — Moteurs d'inférence de graphe asynchrones ou parallélisés : hors périmètre v1, les fonctions de `domain/` sont strictement synchrones.

### Critères d'acceptation

- [ ] `AC-ARCH-02-1` — Aucun module de `src/domain/` n'importe de package ou module système Node.js effectuant des I/O ou dépendant de l'OS (`fs`, `child_process`, `net`, `http`, `os`, `vm`, `path`, `url`) ni n'effectue d'accès direct à `process.env` / `process.cwd()` ni d'appel à `fetch` / `WebSocket` (`CASE-ARCH-02-1`).
- [ ] `AC-ARCH-02-2` — Les fonctions de calcul et de validation métier exportées (`evaluateJoin`, `isOrphanBlock`, `shouldInjectSystemPrompt`, `updatePolicyState`, `assemblePrompt`, `assignDefaultKey`, `renumberDefaultKeys`, `hasKeyCollision`, `isValidConnectionKey`, `validateGraph`) sont des fonctions pures déterministes sans état global partagé ni mutation externe (`CASE-ARCH-02-2`).
- [ ] `AC-ARCH-02-3` — Les modules de `src/domain/` sont directement exécutables et testables en environnement navigateur ou sandboxed sans polyfills Node.js (`CASE-ARCH-02-3`).
- [ ] `AC-ARCH-02-4` — La règle topologique `R-20` et `REQ-015` (unicité Start et degré entrant 0) est validée exclusivement par `DOM-008` sans accès au système de fichiers (`CASE-ARCH-02-4`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Distinguer la validation topologique de la validation d'existence disque | Précisée | `DOM-008` valide la structure du graphe en mémoire ; la vérification que les fichiers `agentId` ou `promptId` existent sur disque relève de `SVC-002`. |

---

## SPEC-ARCH-03 — Isolation des effets de bord et connecteurs techniques aveugles (`lib/`)

**Exigences :** `REQ-001` à `REQ-006`, `REQ-008`, `REQ-013`, `REQ-021` à `REQ-023`, `REQ-025`, `REQ-027` à `REQ-032`, `REQ-101` à `REQ-104`, `REQ-112`, `R-04`, `R-18`, `R-23` à `R-24`, `R-27` à `R-35`, `R-36` à `R-40`, `C-01` à `C-05`, `C-07`, `C-08`, `C-11` à `C-13`, `ADR-001` à `ADR-003`, `ADR-005`, `ADR-006`, `ADR-022`, signatures `LIB-001..022`  
**Statut :** proposé  
**Version :** v1.1 (2026-11-17 — Monopole process.env dévolu au moteur src/lib/process/env/, ADR-022)

### Règle

> La couche `src/lib/` détient le monopole absolu de toutes les interactions avec le système d'exploitation, le système de fichiers (`fs`), les processus (`child_process`), les variables d'environnement (`process.env`), le répertoire courant (`process.cwd()`), le chargement dynamique de modules (`module`) et le serveur HTTP (`node:http`).
> Ces modules sont aveugles au domaine métier : ils ne connaissent ni la structure des blocs, ni les scénarios, ni les règles d'évaluation du graphe.
> Toute persistance JSON s'effectue obligatoirement via écriture atomique (`LIB-001`), toute lecture est fraîche sans cache opaque (`LIB-002`), tout processus est lancé via `LIB-004` avec escalade `SIGTERM` vers `SIGKILL` (délai de grâce nommé `STOP_GRACE_MS = 3000 ms`), et l'écoute HTTP locale est strictement liée à `127.0.0.1` (`LIB-010`).

### Portée

- Couvre le confinement exclusif des imports de modules Node.js natifs d'I/O (`node:fs`|`fs`, `node:child_process`|`child_process`, `node:os`|`os`, `node:path`|`path`, `node:net`|`net`, `node:http`|`http`, `node:url`|`url`, `node:vm`|`vm`, `node:module`|`module`, `node:process`|`process`) à `src/lib/` ; le bootstrap `src/index.ts` n'importe pas ces modules I/O et peut enregistrer les handlers de signaux OS (`SIGINT`/`SIGTERM`) via l'API globale `process.on` ; les accès `process.env`/`process.cwd()` restent exclusifs au sous-package `src/lib/process/env/` (`env.engine.ts`, `env.layout.ts`) (`AC-ARCH-03-5`) ; le parsing CLI (`process.argv`), l'affichage console et les messages d'erreur opérateur stdout/stderr restent du ressort de `ROOT-001` (`SPEC-ARCH-04`, `SPEC-SRV-01`/`02`).
- Couvre l'écriture atomique anti-corruption des données JSON (`LIB-001 json-atomic-writer.fs.ts` via fichier `.tmp` adjacent et renommage atomique).
- Couvre l'absence totale d'écriture de journaux d'exécution ou chunks streamés sur disque sous `.agents/data/` (`R-37`).
- Couvre la lecture fraîche sans cache opaque (`LIB-002 json-fresh-reader.fs.ts`) garantissant le disque comme unique source de vérité.
- Couvre la suppression physique sécurisée et idempotente de fichiers pour les opérations CRUD (`LIB-011 file-remover.fs.ts`).
- Couvre l'isolation du chargement dynamique des scripts conditionnels JS (`LIB-003 dynamic-module-loader.fs.ts`) sans exécution préalable.
- Couvre le spawner de sous-processus (`LIB-004 child-process.spawner.ts`) et l'escalade temporelle déterministe `SIGTERM` (délai 3000 ms) → `SIGKILL`.
- Couvre la résolution d'environnement et de workspace (`src/lib/process/env/`) comme unique passerelle vers `process.env` et `process.cwd()`.
- Couvre l'infrastructure HTTP locale sur-mesure zéro dépendance (`LIB-007 mini-http.router.ts`, `LIB-008 in-memory-static.handler.ts`, `LIB-009 json-body.parser.ts`, `LIB-010 loopback-http.server.ts`).
- Ne couvre pas la validation métier des schémas JSON → `SPEC-DATA-01` / `SVC-002`.
- Ne couvre pas l'orchestration applicative reliant la lib au domaine → `SPEC-ARCH-04` / `services/`.

### Scénarios nominaux

```gherkin
Scénario : Monopole absolu des I/O système dans lib/
  Étant donné l'arborescence complète du code source "src/"
  Quand on recherche les occurrences des imports de "node:fs"|"fs", "node:child_process"|"child_process", "node:os"|"os", "node:path"|"path", "node:net"|"net", "node:http"|"http", "node:url"|"url", "node:vm"|"vm", "node:module"|"module", "node:process"|"process"
  Alors aucun de ces imports n'apparaît dans "src/types/", "src/config/", "src/utils/", "src/domain/", "src/services/", "src/controllers/" ou "src/ui/"
  Et ils sont strictement cantonnés à "src/lib/" (avec les signaux OS dans "src/index.ts")

Scénario : Monopole de process.env et process.cwd via src/lib/process/env/
  Étant donné l'arborescence complète du code source "src/"
  Quand on recherche les accès directs à "process.env" et "process.cwd()"
  Alors ces accès n'apparaissent que dans "src/lib/process/env/env.engine.ts" et "src/lib/process/env/env.layout.ts"
  Et le bootstrap "src/index.ts" ne contient aucun accès direct à "process.env" ni "process.cwd()" et reçoit ces valeurs exclusivement via l'orchestration de "ConfigService.deploy()"
  Et aucune autre couche n'y accède directement

Scénario : Neutralité et cécité métier de la couche lib/
  Étant donné les fichiers situés dans "src/lib/"
  Quand on inspecte leurs imports et références de types
  Alors aucun fichier de "src/lib/" n'importe de composant de "src/domain/"
  Et ils ne manipulent ni le graphe des scénarios, ni l'algorithme de Join, ni la sémantique des blocs

Scénario : Persistance atomique anti-corruption (LIB-001)
  Étant donné une écriture de ressource JSON demandée sous ".agents/data/"
  Quand "atomicWriteJson" est exécutée
  Alors un fichier temporaire adjacent ".tmp" est d'abord créé et écrit
  Puis un renommage atomique "renameSync" remplace la cible
  Et aucun fichier partiellement écrit ou corrompu ne peut subsister en cas d'interruption

Scénario : Arrêt d'urgence et escalade SIGTERM vers SIGKILL (LIB-004)
  Étant donné un sous-processus agent lancé par "spawnAgent"
  Quand une commande d'arrêt est déclenchée
  Alors un signal SIGTERM est immédiatement transmis au processus enfant
  Et si le processus ne s'est pas terminé après 3000 ms ("STOP_GRACE_MS"), un signal SIGKILL est envoyé
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Échec d'écriture lors de la création du fichier temporaire dans `atomicWriteJson` | L'erreur est propagée sans altérer le fichier cible existant (intégrité préservée). |
| 2 | Tentative de suppression d'un fichier déjà inexistant dans `deleteFile` (`LIB-011`) | L'opération reste idempotente et n'émet pas d'erreur non maîtrisée. |
| 3 | Processus enfant qui se termine avant la fin des 3000 ms de délai de grâce | La minuterie d'escalade vers `SIGKILL` est immédiatement annulée pour éviter les signaux fantômes. |
| 4 | Flux HTTP entrant dépassant le garde-fou de taille dans `json-body.parser.ts` (`LIB-009`) | La requête est immédiatement interrompue avec un code HTTP 400 ou 413, protégeant le serveur contre la saturation mémoire. |
| 5 | L'un des quatre binaires obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`) manquant ou non exécutable | Une exception explicite en français est levée dès la validation au démarrage per règles `R-40`, `R-50`, `REQ-031` et `REQ-112`. |
| 6 | Import nu sans préfixe `node:` hors `src/lib/` (ex: `import * as fs from 'fs'` ou `from 'process'` dans `services/`, `controllers/`, `utils/`, `config/` ou `types/`) | Détecté et rejeté comme violation de monopole I/O — équivalence stricte `node:X` ≡ `X` pour toute la liste de `AC-ARCH-03-1`. |

### Ce qui n'est pas défini

- *2026-10-01* — Gestion de pool de processus préchauffés : hors périmètre v1, les sous-processus sont créés à la demande.

### Critères d'acceptation

- [ ] `AC-ARCH-03-1` — Aucun import des modules I/O listés (`node:fs`|`fs`, `node:child_process`|`child_process`, `node:os`|`os`, `node:path`|`path`, `node:net`|`net`, `node:http`|`http`, `node:url`|`url`, `node:vm`|`vm`, `node:module`|`module`, `node:process`|`process`) n'apparaît hors de `src/lib/` ; `src/index.ts` n'importe aucun de ces modules et peut utiliser `process.on` pour `SIGINT`/`SIGTERM` ; les devoirs Composition Root (parsing CLI, affichage URL, erreurs FR stdout/stderr) restent autorisés sous `ROOT-001` / `SPEC-ARCH-04` / `SPEC-SRV-*` ; les accès `process.env`/`process.cwd()` restent régis par `AC-ARCH-03-5` (`CASE-ARCH-03-1`).
- [ ] `AC-ARCH-03-2` — Les modules de `src/lib/` n'importent aucun élément de `src/domain/`, garantissant qu'ils restent aveugles au modèle métier (`CASE-ARCH-03-2`).
- [ ] `AC-ARCH-03-3` — Toute persistance JSON s'effectue via écriture atomique (.tmp + renameSync) sans laisser de fichiers corrompus en cas d'interruption (`CASE-ARCH-03-3`).
- [ ] `AC-ARCH-03-4` — Le lancement de processus sous-jacent et le cycle de vie d'interruption (escalade SIGTERM → SIGKILL avec temporisation 3000 ms) sont isolés dans `LIB-004` et testables déterministement par mock (`CASE-ARCH-03-4`).
- [ ] `AC-ARCH-03-5` — Hors `src/lib/process/env/` (`env.engine.ts`, `env.layout.ts`), aucun module de `src/` n'accède directement à `process.env` ni à `process.cwd()` ; le bootstrap `src/index.ts` reçoit ces valeurs par injection via `ConfigService` (`CASE-ARCH-03-5`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la constante `STOP_GRACE_MS` | Acceptée | Doit être une constante exportée de `LIB-004` égale à 3000 ms (conforme à ADR-006 et SPEC-ADPT-03). |
| Assurer l'étanchéité de `body-parser` | Acceptée | Câblé exclusivement au niveau du serveur/routeur ; les contrôleurs reçoivent le corps déjà extrait. |

---

## SPEC-ARCH-04 — Découplage par interfaces, Composition Root et conformité des erreurs

**Exigences :** `REQ-001`, `REQ-003`, `REQ-005`, `REQ-007`, `REQ-021`, `REQ-025`, `R-03` à `R-05`, `R-28`, `R-30`, `R-35`, `C-06`, `C-11`, `ADR-001`, `ADR-002`, `ADR-006`, signatures `ROOT-001`, `TYPES-001`, `TYPES-011`, `TYPES-012`, `SVC-001..013`, `CTL-001..007`  
**Statut :** proposé  
**Version :** v1 (2026-10-01)

### Règle

> Le système applique une inversion de contrôle stricte et une composition centralisée.
> Les contrôleurs dépendent de l'interface abstraite `HttpRouter` (`TYPES-011`) et ignorent l'implémentation concrète `MiniRouter` (`LIB-007`).
> Les adapters CLI implémentent le contrat `CLIAdapter` (`TYPES-001`) et sont découplés de l'orchestrateur de scénario via injection de dépendance.
> Le point d'entrée `src/index.ts` (`ROOT-001`) est l'unique Composition Root de l'application : il instancie les singletons, câble la factory de runners éphémères, injecte l'immuable `workspacePath` et intercepte `SIGINT`/`SIGTERM` pour orchestrer l'arrêt gracieux du serveur HTTP et des runners actifs.
> Tous les messages d'erreur exposés à l'utilisateur (réponses HTTP JSON `{ message }`, messages d'erreur opérateur émis sur stdout/stderr par le Composition Root `ROOT-001`, exceptions applicatives des services) sont obligatoirement formulés en français (`REQ-007`, `C-06`). Les traces techniques internes de `src/lib/` non destinées à l'opérateur sont hors de ce prédicat.
> Le harnais de test respecte les principes de testabilité déterministe d'ADR-006 (mock stdio, timers virtuels, isolation de `workspacePath`, purge `flushPromises()`). Les tests d'architecture auditent la base de code applicative `src/` et l'outillage partagé du harnais `tests/helpers/`, sans imposer de contraintes de scan syntaxique intrusives sur les tests unitaires sous `tests/` afin de préserver leur intégrité et autonomie.

### Portée

- Couvre le découplage des contrôleurs via l'interface `HttpRouter` (`TYPES-011`).
- Couvre le rôle exclusif de Composition Root de `src/index.ts` (`ROOT-001`).
- Couvre l'immutabilité du `workspacePath` résolu une seule fois au lancement sans altération permanente de l'environnement global.
- Couvre la fermeture ordonnée du serveur HTTP et la transmission de l'arrêt aux sous-processus actifs lors de signaux OS (`SIGINT`, `SIGTERM`).
- Couvre la conformité linguistique en français des messages d'erreur HTTP JSON, des exceptions services et des messages d'erreur opérateur stdout/stderr de `ROOT-001` (`REQ-007`, `C-06`) ; hors traces techniques internes `lib/`.
- Couvre les garanties de déterminisme pour les suites de tests unitaires et d'intégration (`ADR-006`) via l'outillage partagé `tests/helpers/` (interdiction du réseau distant réel, isolation des processus enfants et disponibilité de `flushPromises()`).
- Ne couvre pas l'obligation d'appels superflus à `flushPromises()` dans des tests unitaires purement synchrones ou isolés (`tests/adpt/`, `tests/srv/`).
- Ne couvre pas l'IHM web de présentation → `SPEC-UI-01` / `SPEC-UI-03`.

### Scénarios nominaux

```gherkin
Scénario : Enregistrement des routes de contrôleurs via l'interface HttpRouter
  Étant donné les fonctions d'enregistrement dans "src/controllers/"
  Quand elles reçoivent une instance satisfaisant l'interface "HttpRouter"
  Alors elles enregistrent les routes sans importer ni instancier directement "MiniRouter" de "lib/"
  Et le typage statique TypeScript interdit toute dépendance à l'implémentation d'infrastructure

Scénario : Rôle de Composition Root unique de src/index.ts
  Étant donné le démarrage de l'application ClientsBox
  Quand "src/index.ts" est exécuté
  Alors il résout "workspacePath" une seule fois via "resolveWorkspacePath"
  Et il instancie les services, enregistre les contrôleurs, configure l'écoute réseau locale
  Et aucun autre fichier du projet n'effectue de composition de dépendances de haut niveau

Scénario : Conformité des messages d'erreur en français
  Étant donné une requête HTTP invalide ou une ressource non trouvée
  Quand le contrôleur ou le routeur retourne une réponse d'erreur HTTP (400, 404, 409, 500)
  Alors le corps JSON contient un champ "message" rédigé intégralement en langue française
  Et aucun message d'erreur technique brut non traduit n'est renvoyé au client

Scénario : Conformité des messages d'erreur opérateur console (ROOT-001)
  Étant donné un échec de démarrage ou une erreur fatale exposée par "src/index.ts"
  Quand le Composition Root émet un message d'erreur sur stdout ou stderr
  Alors le texte destiné à l'opérateur est rédigé intégralement en langue française
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Signal `SIGINT` reçu pendant qu'un scénario et un processus enfant sont actifs | `index.ts` intercepte le signal, déclenche la fermeture du serveur HTTP et invoque `stop()` sur le runner actif pour terminer les processus enfants. |
| 2 | Tentative d'appel à `process.chdir()` dans le code applicatif | Proscrite : `workspacePath` est injecté en lecture seule et ne dépend pas d'une mutation globale de l'état du processus. |
| 3 | Référence à une ressource introuvable lors d'un `GET /api/:resource/:id` | Retourne immédiatement un code 404 avec un message explicite en français (ex: `"Ressource non trouvée"`). |
| 4 | Erreur de validation de conflit lors de la suppression d'un profil lié (`DELETE /api/profils/:id`) | `AgentService` lève une exception métier et le contrôleur retourne un code 409 Conflict avec explication en français (`REQ-010`, `R-05`). |

### Ce qui n'est pas défini

- *2026-10-01* — Mécanisme de traduction i18n multilingue : hors périmètre v1, la langue unique de ClientsBox est le français per exigence `REQ-007` et `C-06`.

### Critères d'acceptation

- [ ] `AC-ARCH-04-1` — Les routes des contrôleurs (`CTL-001`, `CTL-002`, `CTL-003`) sont enregistrées contre l'interface `HttpRouter` (`TYPES-011`) sans référence directe à la classe concrète `MiniRouter` (`CASE-ARCH-04-1`).
- [ ] `AC-ARCH-04-2` — Le fichier `src/index.ts` est l'unique Composition Root instanciant les dépendances concrètes et gérant les signaux système `SIGINT`/`SIGTERM` pour libérer le port et arrêter les sous-processus actifs (`CASE-ARCH-04-2`).
- [ ] `AC-ARCH-04-3` — Tous les messages d'erreur exposés à l'utilisateur sont formulés en français : réponses HTTP JSON `{ message }` émises par les contrôleurs **et** par l'implémentation `HttpRouter` / `LIB-007` (`MiniRouter`, y compris fallback 404/500), exceptions des services applicatifs, et messages d'erreur opérateur stdout/stderr de `ROOT-001` ; les traces techniques internes de `src/lib/` non destinées à l'opérateur restent hors prédicat (`CASE-ARCH-04-3`).
- [ ] `AC-ARCH-04-4` — Le harnais de test garantit le déterminisme complet selon `ADR-006` (aucun accès réseau externe, mock des processus enfants, isolation de `workspacePath`, purge `flushPromises` disponible ; l'audit d'architecture cible `src/` et l'outillage `tests/helpers/` sans contraindre indûment les tests unitaires) (`CASE-ARCH-04-4`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la gestion de la factory de runners dans `index.ts` | Acceptée | Conforme aux signatures : les runners étant instanciés par run, la Composition Root injecte un holder/factory dans `CTL-002`. |
| Garantir le respect strict de `REQ-007` sur les erreurs | Acceptée | Tous les payloads d'erreur JSON exposent `{ message: string }` en français sans exception. |

---

## SPEC-ARCH-05 — Volumétrie de code, compacité et exemptions TSDoc

**Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`  
**Statut :** proposé  
**Version :** v1 (2026-10-01)

### Règle

> La base de code sous `src/` applique des plafonds stricts de dimensionnement physique pour garantir la lisibilité et la responsabilité unique de chaque module :
> - **Taille des fichiers :** Prédicat déterministe (hors commentaires TSDoc **uniquement** ; les commentaires non-TSDoc `//` et `/* */` **sont inclus** dans le comptage ; **séquence** de lignes blanches consécutives comptée comme **0** ; chaque ligne blanche **isolée** comptée comme **1**) :
>   - **Fichiers standards (.ts hors TSX) :** **≤ 150** → conforme sans exemption ; **151–200** → conforme **uniquement** si le **premier bloc commentaire TSDoc** du fichier **démarre à la ligne physique 1** et **contient** la balise `@fileExemption <motif>` (quelle que soit la ligne interne du bloc) ; **> 200** → non-conforme **même avec** exemption, **sauf** Composition Root `ROOT-001` (`src/index.ts`) qui peut dépasser 200 uniquement avec le même locus d'en-tête justifiant l'indivisibilité.
>   - **Fichiers déclaratifs Preact TSX (*.tsx) :** Règle spécifique se substituant à la règle de base pour tenir compte de la verbosité du balisage VDOM et de Tailwind CSS : **≤ 250** → conforme sans exemption ; **251–300** → conforme **uniquement** si le **premier bloc commentaire TSDoc** du fichier démarre en ligne physique 1 et contient la balise `@fileExemption <motif>` ; **> 300** → non-conforme **même avec** exemption.
> - **Taille des fonctions et méthodes :** Prédicat déterministe appliqué au **corps** avec les **mêmes règles de lignes physiques** que les fichiers (hors commentaires TSDoc uniquement ; commentaires non-TSDoc `//` et `/* */` inclus ; séquence de blancs = 0 ; blanc isolé = 1) : (a) si le corps est un `BlockStatement` : lignes physiques du span du corps entre les accolades ouvrante et fermante (lignes ne contenant **que** `{` ou `}` exclues) ; (b) si le corps est une `Expression` (fonction fléchée sans bloc) : lignes physiques couvertes par le nœud `Expression`.
>   - **Fonctions et méthodes standards (fichiers .ts hors TSX) :** **≤ 35** → conforme sans exemption ; **36–40** → conforme **uniquement** si le **bloc TSDoc immédiatement précédent** la déclaration contient `@functionExemption <motif>` ; **> 40** → non-conforme **même avec** exemption.
>   - **Fonctions et composants déclarés dans des fichiers Preact TSX (*.tsx) :** Règle spécifique se substituant à la règle de base : **≤ 200** → conforme sans exemption ; **201–250** → conforme **uniquement** si le **bloc TSDoc immédiatement précédent** contient `@functionExemption <motif>` ; **> 250** → non-conforme **même avec** exemption.
> - **Arité maximale :** Toute fonction ou méthode accepte au maximum **3 paramètres positionnels**. Au-delà, les arguments doivent être regroupés dans une interface d'options typée. Les exports documentés dans les signatures officielles sont soumis à cette règle.

### Portée

- Couvre le prédicat fichier : standard ≤150 / 151–200+`@fileExemption` L1 / >200 FAIL (sauf `ROOT-001` documenté) ; fichiers Preact TSX (`*.tsx`) ≤250 / >250+`@fileExemption` L1 ; commentaires non-TSDoc inclus ; séquence de lignes blanches consécutives = 0 ; ligne blanche isolée = 1.
- Couvre le prédicat fonction : standard ≤35 / 36–40+`@functionExemption` dans le TSDoc précédent / >40 FAIL ; fonctions et composants Preact TSX (`*.tsx`) ≤200 / >200+`@functionExemption` dans le TSDoc précédent (BlockStatement et Expression : lignes physiques du corps selon la Règle).
- Couvre le plafonnement de l'arité (≤ 3 paramètres positionnels) et l'encapsulation obligatoire au-delà dans un objet d'options typé, y compris pour les exports des signatures officielles.
- Ne couvre pas l'inférence des types de retour ni le bannissement de `any` → `SPEC-ARCH-06`.
- Ne couvre pas la complexité cyclomatique, le nommage et la documentation générale → `SPEC-ARCH-07`.

### Scénarios nominaux

```gherkin
Scénario : Contrôle du plafond de lignes par fichier (prédicat déterministe)
  Étant donné un fichier TypeScript situé sous "src/"
  Quand on mesure son nombre de lignes physiques (hors commentaires TSDoc uniquement ; commentaires non-TSDoc inclus ; séquences de lignes blanches consécutives ignorées ; lignes blanches isolées comptées)
  Alors si le fichier est un composant TSX (*.tsx) de taille ≤ 250 il passe sans exemption (ou > 250 ssi premier bloc TSDoc en L1 porte "@fileExemption")
  Et si le fichier est un module standard (.ts) de taille ≤ 150 il passe sans exemption
  Et si le fichier standard est entre 151 et 200 il passe uniquement si le premier bloc TSDoc démarre en ligne 1 et contient "@fileExemption"
  Et si le total standard est > 200 le test échoue sauf pour "src/index.ts" (ROOT-001) muni du même locus d'en-tête "@fileExemption"

Scénario : Contrôle du plafond de lignes par fonction (prédicat déterministe)
  Étant donné une fonction ou méthode définie dans "src/"
  Quand on mesure le nombre de lignes physiques de son corps (BlockStatement : span entre accolades hors lignes `{`/`}` seules ; Expression fléchée : lignes du nœud Expression ; hors TSDoc ; non-TSDoc inclus ; séquences de blancs ignorées ; blancs isolés comptés)
  Alors si la fonction est déclarée dans un fichier TSX (*.tsx) et de taille ≤ 200 elle passe sans exemption (ou > 200 ssi TSDoc précédent porte "@functionExemption")
  Et si la fonction est standard (.ts) et de taille ≤ 35 elle passe sans exemption
  Et si la fonction standard est entre 36 et 40 elle passe uniquement si le TSDoc immédiatement précédent contient "@functionExemption"
  Et si la fonction standard est > 40 le test échoue même avec exemption

Scénario : Respect de l'arité maximale et passage par objet d'options
  Étant donné une fonction ou méthode déclarée dans "src/"
  Quand on compte le nombre de paramètres de sa signature
  Alors elle accepte au maximum 3 paramètres positionnels
  Et toute fonction nécessitant 4 entrées ou plus encapsule ses arguments dans un objet d'options typé
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Fichier `.ts` standard de 151–200 lignes sans `@fileExemption` dans le premier bloc TSDoc démarrant en L1 | FAIL — violation de compacité de fichier standard. |
| 2 | Fichier `.ts` standard > 200 lignes (hors `ROOT-001`) même avec `@fileExemption` | FAIL — plafond absolu standard dépassé. |
| 3 | Fichier `.tsx` Preact ≤ 250 lignes physiques | PASS — conforme sans besoin d'exemption. |
| 4 | Fichier `.tsx` Preact de 251–300 lignes avec `@fileExemption` dans le premier bloc TSDoc démarrant en L1 | PASS — exemption documentée en L1. |
| 5 | Fichier `.tsx` Preact de 251–300 lignes sans `@fileExemption` en L1 | FAIL — violation de compacité fichier TSX. |
| 6 | Fichier `.tsx` Preact > 300 lignes même avec `@fileExemption` | FAIL — plafond absolu fichier TSX dépassé. |
| 7 | Fonction standard de 36–40 lignes sans `@functionExemption` dans le TSDoc précédent | FAIL — violation de compacité de fonction standard. |
| 8 | Fonction standard > 40 lignes même avec `@functionExemption` | FAIL — plafond absolu fonction standard dépassé. |
| 9 | Fonction ou composant dans un fichier `.tsx` ≤ 200 lignes physiques | PASS — conforme sans besoin d'exemption. |
| 10 | Fonction ou composant dans un fichier `.tsx` de 201–250 lignes avec `@functionExemption` dans le TSDoc précédent | PASS — exemption de composant dense documentée. |
| 11 | Fonction ou composant dans un fichier `.tsx` de 201–250 lignes sans `@functionExemption` | FAIL — violation de compacité fonction TSX. |
| 12 | Fonction ou composant dans un fichier `.tsx` > 250 lignes même avec `@functionExemption` | FAIL — plafond absolu fonction TSX dépassé. |
| 13 | `src/index.ts` (`ROOT-001`) > 200 lignes avec `@fileExemption` dans le premier bloc TSDoc démarrant en L1 | PASS — exception Composition Root documentée. |
| 14 | Fonction acceptant 4 paramètres positionnels (ex: `fn(a, b, c, d)`) | Rejetée : obligation de refactoriser vers `fn(options: { a, b, c, d })`. |

### Ce qui n'est pas défini

- *(néant — seuils spécifiques `.tsx` scellés le 2026-10-28 : fichiers 250L, fonctions 200L).*

### Critères d'acceptation

- [ ] `AC-ARCH-05-1` — Prédicat fichier respecté : fichiers `.ts` standards ≤150 PASS, 151–200 PASS ssi premier bloc TSDoc démarrant en L1 contenant `@fileExemption`, >200 FAIL sauf `ROOT-001` avec le même locus ; fichiers Preact TSX (`*.tsx`) ≤250 PASS, >250 PASS ssi premier bloc TSDoc démarrant en L1 contenant `@fileExemption` ; commentaires non-TSDoc inclus ; séquence de lignes blanches consécutives comptée comme 0 ; chaque ligne blanche isolée comptée comme 1 (`CASE-ARCH-05-1`).
- [ ] `AC-ARCH-05-2` — Prédicat fonction respecté : fonctions `.ts` standards ≤35 PASS, 36–40 PASS ssi `@functionExemption` dans le TSDoc immédiatement précédent, >40 FAIL ; fonctions et composants Preact TSX (`*.tsx`) ≤200 PASS, >200 PASS ssi `@functionExemption` dans le TSDoc immédiatement précédent (`CASE-ARCH-05-2`).
- [ ] `AC-ARCH-05-3` — Arité des fonctions bornée (≤ 3 paramètres positionnels) ou passage obligatoire par un objet d'options typé (`CASE-ARCH-05-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Locus `@fileExemption` = premier bloc TSDoc démarrant en L1 (balise interne autorisée) | Acceptée | Compatible TSDoc multiligne ; parsing déterministe ; lecture immédiate de l'en-tête. |
| Seuil d'alerte vs seuil maximal | Précisée | 150 = seuil d'exemption ; 200 = plafond absolu FAIL (exception documentée `ROOT-001` seule) ; symétrie fonctions 35 / 40. |

---

## SPEC-ARCH-06 — Inférence automatique de typage, pureté des retours et bannissement de any

**Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`  
**Statut :** proposé  
**Version :** v1 (2026-10-01)

### Règle

> Le code source sous `src/` maximise l'inférence de types native de TypeScript et applique un typage statique strict :
> - **Inférence automatique des retours :** Il est strictement interdit d'annoter explicitement le type de retour d'une fonction ou méthode implémentée (ex: `function foo(): Type` est proscrit). Le compilateur TypeScript doit inférer le retour automatiquement à partir des instructions d'exécution.
> - **Dérogation de retour encadrée :** Si le typage explicite d'un retour est inévitable (ex: conformité stricte à une interface tierce, type récursif complexe, discriminant non déductible), le **bloc TSDoc immédiatement précédent** la déclaration doit comporter la balise `@returnTypeExemption <motif>` explicitant le motif technique.
> - **Bannissement absolu de `any` (`no-explicit-any`) :** Le mot-clé `any` est formellement interdit (en déclaration, argument, variable ou cast). Si un type est dynamique ou inconnu à la compilation, le type `unknown` est obligatoire avec un rétrécissement de type (*type guard* / *narrowing*).
> - **Immutabilité des entrées :** Les arguments passés en entrée d'une fonction ne doivent jamais être mutés en place (*in-place mutation* interdite).

### Portée

- Couvre l'interdiction des annotations explicites de type de retour sur les fonctions, méthodes et fonctions fléchées avec corps d'implémentation.
- Couvre l'obligation de la balise `@returnTypeExemption <motif>` dans le TSDoc immédiatement précédent en cas de retour explicite inévitable.
- Couvre l'exclusion de toute déclaration sans corps d'implémentation sous `src/types/**` (`contracts/`, `models/`, `messages/`, etc. : `interface`, `type`, `const enum`) qui déclare naturellement des signatures abstraites.
- Couvre l'interdiction formelle du type `any` dans l'ensemble de la base de code `src/`.
- Couvre l'obligation d'utiliser `unknown` avec des gardes de type pour les données dynamiques ou non sérialisées.
- Couvre l'immutabilité des arguments de fonctions (retour de nouvelles structures ou utilisation de `readonly`).
- Ne couvre pas la volumétrie des fichiers et fonctions → `SPEC-ARCH-05`.
- Ne couvre pas la complexité cyclomatique, le nommage et la documentation générale → `SPEC-ARCH-07`.

### Scénarios nominaux

```gherkin
Scénario : Inférence automatique du type de retour sans annotation explicite
  Étant donné une fonction ou méthode concrète implémentée dans "src/"
  Quand on inspecte sa signature
  Alors aucun type de retour explicite (ex: ": string", ": Promise<void>", ": boolean") n'est déclaré
  Et le compilateur TypeScript infère automatiquement le type de retour exact

Scénario : Typage explicite de retour avec balise d'exemption obligatoire
  Étant donné une fonction implémentant une signature récursive ou une contrainte externe inévitable
  Quand elle déclare explicitement son type de retour
  Alors le bloc TSDoc immédiatement précédent comporte obligatoirement la balise "@returnTypeExemption <justification>"

Scénario : Bannissement absolu du type any
  Étant donné l'ensemble des fichiers TypeScript sous "src/"
  Quand on analyse l'arbre syntaxique (AST) à la recherche du mot-clé "any"
  Alors aucune déclaration de variable, paramètre, type générique ou cast n'utilise "any"
  Et toutes les valeurs de type indéterminé exploitent "unknown" avec rétrécissement de type

Scénario : Immutabilité des paramètres de fonctions
  Étant donné une fonction pure recevant un objet ou un tableau en argument
  Quand la fonction est exécutée
  Alors la structure passée en entrée n'est jamais altérée ni mutée
  Et un nouvel objet ou tableau est retourné
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Fonction annotée d'un type de retour explicite sans `@returnTypeExemption` dans le TSDoc immédiatement précédent | Détectée et sanctionnée : obligation de supprimer l'annotation ou de justifier l'exemption via ce TSDoc. |
| 2 | Présence de `any` dans une signature de fonction ou un cast (ex: `(data as any)`) | Rejetée sans exception : obligation d'utiliser `unknown`, un type générique ou une interface discriminée. |
| 3 | Fonction mutant une propriété d'un objet reçu en paramètre (ex: `bag[key] = msg`) | Sanctionnée comme violation d'immutabilité : obligation de retourner une copie mise à jour. |
| 4 | Déclaration d'interface ou de type sous `src/types/**` sans corps d'implémentation | Autorisée : les méthodes abstraites / signatures de type déclarent leurs retours sans constituer une violation d'inférence. |

### Ce qui n'est pas défini

- *2026-10-01* — Utilisation de assertions de type `satisfies` : autorisée lorsqu'elle préserve l'inférence native du compilateur sans forcer de cast destructif.

### Critères d'acceptation

- [ ] `AC-ARCH-06-1` — Inférence automatique native des types de retour de fonction sans typage explicite sur les fonctions concrètes (`CASE-ARCH-06-1`).
- [ ] `AC-ARCH-06-2` — Exemption documentée obligatoire via `@returnTypeExemption` dans le TSDoc immédiatement précédent en cas d'annotation de retour explicite inévitable (`CASE-ARCH-06-2`).
- [ ] `AC-ARCH-06-3` — Bannissement strict de `any` au profit d'`unknown` avec rétrécissement de type (*type guard*) (`CASE-ARCH-06-3`).
- [ ] `AC-ARCH-06-4` — Immutabilité des arguments reçus en entrée et absence de mutation *in-place* (`CASE-ARCH-06-4`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Distinction interfaces pures vs fonctions concrètes | Acceptée | L'interdiction d'annotation de retour ne s'applique qu'aux corps de fonctions exécutables, pas aux contrats `*.contract.ts`. |
| Tolérance de `@returnTypeExemption` | Acceptée | Permet de gérer les cas exceptionnels (ex: types récursifs ou retours de génériques complexes) sans bloquer le compilateur. |

---

## SPEC-ARCH-07 — Complexité algorithmique, conventions de nommage et documentation

**Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`  
**Statut :** proposé  
**Version :** v1 (2026-10-01)

### Règle

> Le code source sous `src/` obéit à des normes strictes de simplicité de flux de contrôle, d'uniformité de nommage et de documentation :
> - **Complexité cyclomatique :** Bornée à **CC ≤ 10** par fonction (au-delà, dérogation obligatoire via `@complexityExemption <motif>` dans le **bloc TSDoc immédiatement précédent** la déclaration). Formule scellée : **CC = 1 + Σ contributions** sur le corps de la fonction/méthode/flèche (chaque fonction imbriquée = CC indépendant recalculé à 1). Contributeurs (+1 chacun) : `IfStatement`, `ForStatement`, `ForInStatement`, `ForOfStatement`, `WhileStatement`, `DoWhileStatement`, `CatchClause`, `ConditionalExpression`, `LogicalExpression` (`&&` / `||` uniquement), `SwitchCase` (y compris `default`). Non-contributeurs : `SwitchStatement`, `TryStatement`, `BlockStatement`, `finalizer` de `TryStatement`.
> - **Profondeur d'imbrication :** Bornée à **3 niveaux maximum** (non exemptable). Compteur incrémenté uniquement par les nœuds AST : `IfStatement`, `SwitchStatement`, `ForStatement`, `ForInStatement`, `ForOfStatement`, `WhileStatement`, `DoWhileStatement`, `TryStatement`, `ConditionalExpression`. Le `handler` (`CatchClause`) et le `finalizer` (`BlockStatement | null`) d'un `TryStatement` **n'incrémentent pas** la profondeur (ils prolongent le même niveau que le `TryStatement` parent ; seul le contenu interne des blocs `block` / `handler` / `finalizer` peut ré-incrémenter via les autres kinds de l'allow-list). Tout corps de fonction/méthode/flèche imbriquée **réinitialise** la profondeur à 0 (nouveau frame). `BlockStatement` nu non compté. Impose les *early returns* / clauses de garde.
> - **Conventions de nommage des fichiers :** Format `kebab-case.suffixe.ts` normalisé selon la couche (`*.contract.ts`, `*.model.ts`, `*.utils.ts`, `*.service.ts`, `*.controller.ts`, `*.adapter.ts`, `index.ts`), et format `kebab-case.tsx` ou `app.tsx` pour les composants et pages de l'UI navigateur (`src/ui/`).
> - **Conventions de nommage des identifiants :**
>   - Fonctions & méthodes : `camelCase` avec verbe d'action (`evaluateJoin`, `assemblePrompt`).
>   - Composants déclaratifs Preact (fichiers `.tsx`) : `PascalCase` strict (`AppLayout`, `Button`, `TerminalPanel`), conformément à la spécification JSX / React qui requiert une majuscule initiale pour instancier un composant virtuel. Les custom hooks (`use*`) et fonctions helpers de `ui/` restent en `camelCase`.
>   - Variables & propriétés : `camelCase` descriptif sans abréviations cryptiques.
>   - Booléens : Préfixes obligatoires exprimant l'état (`is*`, `has*`, `should*`, `can*`).
>   - Constantes globales & primitives : `UPPER_SNAKE_CASE` (ex: `STOP_GRACE_MS = 3000`).
>   - Classes, interfaces, types & const enums : `PascalCase` strict.
> - **Documentation TSDoc :** Obligatoire sur tous les symboles exportés, avec prédicat par kind AST : (a) `function`/`method`/`constructor` : description + `@param` (si arity > 0) + description sémantique de retour + `@throws` si le corps peut lever ; (b) `class` : description (membres selon leur kind) ; (c) `interface`/`type`/`const enum` : description (+ `@property` optionnel) — pas de `@param`/`@throws` obligatoires ; (d) `const` : description ; si la valeur est une fonction, appliquer (a), sinon pas de `@throws` obligatoire.
> - **Zéro effet de bord à l'import :** Aucun module ne doit exécuter d'instructions à son chargement (seul `index.ts` orchestre les démarrages).

### Portée

- Couvre le calcul de la complexité cyclomatique de chaque fonction selon la formule scellée de la Règle (seuil CC ≤ 10) et l'exemption `@complexityExemption` (locus = TSDoc immédiatement précédent).
- Couvre la vérification de la profondeur maximale d'imbrication (≤ 3 niveaux) selon l'allow-list AST de la Règle (reset à 0 dans chaque corps de fonction imbriquée).
- Couvre la nomenclature normalisée de l'ensemble des fichiers de `src/` (fichiers `.ts` et `.tsx`).
- Couvre les conventions de nommage de tous les symboles TypeScript (fonctions, variables, booléens, constantes, types, classes, et composants Preact en `.tsx`).
- Couvre la présence et la complétude des blocs de documentation TSDoc sur l'ensemble des exports publics.
- Couvre l'absence totale d'effets de bord lors de l'importation d'un module.
- Ne couvre pas la volumétrie des fichiers et fonctions → `SPEC-ARCH-05`.
- Ne couvre pas l'inférence des types de retour ni le bannissement de `any` → `SPEC-ARCH-06`.

### Scénarios nominaux

```gherkin
Scénario : Contrôle de la complexité cyclomatique et de l'imbrication
  Étant donné une fonction définie dans "src/"
  Quand on analyse son graphe de flot de contrôle et sa profondeur d'arborescence
  Alors sa complexité cyclomatique selon la formule scellée de la Règle est inférieure ou égale à 10 (ou le TSDoc immédiatement précédent porte "@complexityExemption")
  Et la profondeur d'imbrication selon l'allow-list AST ne dépasse jamais 3 niveaux dans le frame courant

Scénario : Respect des conventions de nommage des fichiers et symboles
  Étant donné l'ensemble des fichiers et déclarations sous "src/"
  Quand on analyse la nomenclature globale
  Alors les fichiers respectent le format "kebab-case.suffixe.ts", "kebab-case.tsx", "app.tsx" ou "index.ts"
  Et les fonctions/variables sont en camelCase, les booléens préfixés par is/has/should/can, les constantes en UPPER_SNAKE_CASE et les types/classes en PascalCase
  Et les composants déclarés dans les fichiers TSX (*.tsx) sont en PascalCase

Scénario : Présence de documentation TSDoc sur tous les exports publics
  Étant donné une entité exportée ("export function", "export class", "export interface", "export type", "export const")
  Quand on inspecte sa déclaration
  Alors elle est immédiatement précédée d'un bloc TSDoc valide dont les balises obligatoires respectent le prédicat par kind AST de la Règle
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Fonction avec complexité CC = 12 sans `@complexityExemption` dans le TSDoc immédiatement précédent | Rejetée : obligation de découper la fonction ou de documenter la balise d'exemption dans ce TSDoc. |
| 2 | Fonction comportant 4 niveaux d'imbrication selon l'allow-list (ex: `if` ⊂ `if` ⊂ `for` ⊂ `try`, ou `while` ⊂ `if` ⊂ ternaire ⊂ `switch`) | Rejetée : obligation de refactoriser avec des clauses de garde (*early returns*) ou extraction de sous-fonctions. |
| 3 | Fichier nommé `AgentService.ts` ou `agent_service.ts` | Rejeté : obligation d'adopter `agent.service.ts` (kebab-case strict avec suffixe de couche). |
| 4 | Composant déclaré dans un fichier `.tsx` nommé en `PascalCase` (ex: `export function AppLayout()`) | PASS : convention standard JSX/React respectée. |
| 5 | Variable booléenne nommée `valid` au lieu de `isValid` | Rejetée : obligation d'adopter un préfixe d'état conforme (`is*`, `has*`, `should*`, `can*`). |
| 6 | Fonction publique exportée sans bloc TSDoc | Rejetée : tout export public requiert sa documentation TSDoc. |
| 7 | Module exécutant un appel d'I/O ou un timer lors de son `import` | Rejeté : les modules doivent être exempts d'effets de bord au chargement. |
| 8 | Fonction imbriquée dont le corps local dépasse 3 niveaux alors que le frame parent est conforme | Rejetée sur le frame enfant uniquement (profondeur remise à 0 à l'entrée du corps imbriqué). |

### Ce qui n'est pas défini

- *2026-10-01* — Style des commentaires internes (inline comments) : libres à l'intérieur des corps de fonctions tant que le code reste clair.

### Critères d'acceptation

- [ ] `AC-ARCH-07-1` — Complexité cyclomatique bornée selon la formule scellée de la Règle (CC ≤ 10 **ou** `@complexityExemption` dans le TSDoc immédiatement précédent) **et** profondeur d'imbrication ≤ 3 selon allow-list AST de la Règle **sans** exemption (`CASE-ARCH-07-1`).
- [ ] `AC-ARCH-07-2` — Conventions de nommage des fichiers (`kebab-case.suffixe.ts`, `kebab-case.tsx`, `app.tsx`) et des identifiants (`camelCase` standard, `PascalCase` pour types, classes et composants `.tsx`, `UPPER_SNAKE_CASE`, préfixes booléens) strictement respectées (`CASE-ARCH-07-2`).
- [ ] `AC-ARCH-07-3` — Documentation TSDoc obligatoire sur tous les exports publics selon le prédicat par kind AST de la Règle, et zéro effet de bord à l'importation (`CASE-ARCH-07-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la pertinence du seuil CC ≤ 10 | Acceptée | Standard de l'industrie pour les fonctions unitaires faciles à tester et à maintenir. |
| Règles de nommage des booléens | Acceptée | Évite les ambiguïtés sémantiques dans les structures de données et les conditions. |

---

## SPEC-ARCH-08 — Conformité d'inventaire, gouvernance des transitions (@pendingAudit) et extraction machine-lisible

**Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, `ADR-022`, signatures `ROOT-001`, `TYPES-001..015`, `CONFIG-001..004`, `UTILS-001..031`, `DOM-001..008`, `DOM-010..020`, `LIB-001..035`, `SVC-001..024`, `CTL-001..008`, `UI-001..063`  
**Statut :** proposé  
**Version :** v2.8 (2026-11-23 — Inventaire scellé à 200 modules canoniques après ajout des adaptateurs Claude CLI LIB-033..035 per CR-013 / CR-005)

### Règle

> L'intégrité de la base de code repose sur un contrôle d'inventaire déterministe et une gouvernance stricte des évolutions, assurés par la réconciliation automatique entre l'arborescence réelle des fichiers sources sous `src/` ($L_{code}$) et les tableaux d'inventaire officiels des signatures d'architecture ($L_{doc}$) :
> 
> 1. **Extraction automatique des signatures contractuelles ($L_{doc}$) :**
>    - Les tableaux de signature de référence sont délimités dans la documentation par les balises machine-lisibles `<!-- SIGNATURE-INVENTORY-START -->` et `<!-- SIGNATURE-INVENTORY-END -->`.
>    - Tout fichier officiel de code de production fait l'objet d'une ligne normalisée `| fileId | filepath | file description |`.
>    - Dans les signatures, `filepath` est exprimé en chemin relatif pur sans préfixe (`index.ts`, `lib/fs/json-atomic-writer.fs.ts`, etc.).
>    - Les artefacts et dossiers générés dynamiquement (`out/`, `dist/`, `node_modules/`) sont strictement exclus de la collecte.
> 
> 2. **Conditions de rejet bloquant (ÉCHEC DU TEST / BUILD EN ÉCHEC) :**
>    - **Fichiers manquants dans le code :** Tout fichier répertorié dans les signatures ($filepath \in L_{doc}$) mais introuvable sur le disque dans `src/` ($filepath \notin L_{code}$).
>    - **Fichiers supplémentaires non autorisés :** Tout fichier source présent sur le disque ($filepath \in L_{code}$) mais absent des signatures ($filepath \notin L_{doc}$) qui ne porte **PAS** la balise TSDoc d'ajout préliminaire (`@pendingAudit <motif>`).
>    - **Fichiers dépréciés interdits dans les signatures :** Tout fichier portant l'attribut d'obsolescence `@deprecated` qui figure dans la liste officielle des signatures $L_{doc}$. La documentation de signature est réservée à l'architecture cible et ne tolère aucun code déprécié.
> 
> 3. **Conditions de succès avec avertissement (SUCCÈS TOLÉRÉ / WARNING AU RAPPORT) :**
>    - **Fichier portant la balise `@pendingAudit` :**
>      - *Sous-cas 3a (Fichier `@pendingAudit` présent dans les signatures $L_{doc}$) :* Composant préliminaire documenté en phase de stabilisation. Le test passe avec un avertissement (`WARNING: composant sous @pendingAudit documenté dans la signature en cours d'homologation`).
>      - *Sous-cas 3b (Fichier `@pendingAudit` absent des signatures $L_{doc}$) :* Nouveau composant transitoire en incubation non encore officialisé. Le test passe avec un avertissement (`WARNING: composant transitoire sous @pendingAudit détecté hors signature`).
>    - **Fichier déprécié exclu des signatures :**
>      - Fichier présent sur le disque avec l'attribut `@deprecated` et absent de la liste des signatures $L_{doc}$. Le test passe avec un avertissement de maintenance (`WARNING: dette technique résiduelle à purger`).
> 
> 4. **Interdiction des renommages destructeurs :**
>    - L'usage de suffixes de fichiers modifiant le nom de module (`*.del.ts`, `*.del.tsx`, `*.added.ts`, `*.added.tsx`) est formellement banni en raison de la casse des résolutions de modules TypeScript/ESM. Toute dépréciation ou transition s'effectue exclusivement par balises TSDoc d'en-tête (une clause de tolérance temporaire de secours est toutefois maintenue dans le harnais pendant la phase de transition).
> 
> 5. **Artefacts de compilation volatile (*.generated.ts) :**
>    - Tout fichier portant l'extension `*.generated.ts` est un artefact de compilation volatile exclu de l'inventaire des 163 signatures canoniques et exempté des audits de code statique.
>    - Il est produit dynamiquement par les scripts de build en amont de l'exécution et n'est pas versionné dans le dépôt Git.

### Portée

- Couvre le contrôle d'alignement bidirectionnel strict entre l'inventaire physique des fichiers sous `src/` ($L_{code}$) et le catalogue officiel des signatures ($L_{doc}$) délimité par `<!-- SIGNATURE-INVENTORY-START -->` et `<!-- SIGNATURE-INVENTORY-END -->`.
- Couvre l'exclusion formelle des artefacts de compilation volatile (`*.generated.ts`) de l'inventaire officiel et des audits statiques.
- Couvre la détection et la tolérance encadrée des composants en transition annotés par `@pendingAudit` ou `@deprecated` (sans échec de test, avec émission de Warning).
- Couvre le maintien transitoire des motifs de secours `*.added.ts` et `*.del.ts` jusqu'à achèvement complet de la migration du code source.
- Couvre l'échec bloquant en cas de fichier officiel absent de `src/`.
- Couvre l'échec bloquant en cas de fichier non référencé présent dans `src/` sans balise `@pendingAudit`.
- Couvre l'échec bloquant en cas de fichier déprécié répertorié dans les signatures $L_{doc}$.
- Ne couvre pas la mise en forme du rapport d'audit sous `out/` → `SPEC-ARCH-09`.

### Scénarios nominaux

```gherkin
Scénario : Conformité intégrale de l'inventaire physique avec les signatures
  Étant donné le registre des modules issus des tables de signature délimitées par "<!-- SIGNATURE-INVENTORY-START -->" et "<!-- SIGNATURE-INVENTORY-END -->"
  Quand on scanne l'arborescence des fichiers sous "src/"
  Alors chaque chemin relatif déclaré dans les signatures existe sur le disque sous son nommage canonique
  Et aucun fichier non répertorié n'est présent dans "src/" (hors composants sous @pendingAudit)
  Et aucun fichier déprécié (@deprecated) ne figure dans les signatures
  Et le test d'inventaire est validé avec succès (statut SUCCÈS)

Scénario : Tolérance d'un composant préliminaire sous @pendingAudit documenté dans la signature
  Étant donné un fichier répertorié dans la signature et présent sur le disque
  Et portant la balise TSDoc "@pendingAudit <motif>"
  Quand le test de conformité d'inventaire est exécuté
  Alors le test ne produit aucun échec bloquant
  Et un avertissement formel (WARNING) "Composant préliminaire documenté sous @pendingAudit" est émis avec le chemin du fichier

Scénario : Tolérance d'un composant transitoire sous @pendingAudit hors signature
  Étant donné un nouveau fichier créé sous "src/" portant la balise TSDoc "@pendingAudit <motif>" non encore présent dans les signatures
  Quand le test de conformité d'inventaire est exécuté
  Alors le test ne produit aucun échec bloquant
  Et un avertissement formel (WARNING) "Composant transitoire sous @pendingAudit détecté hors signature" est émis avec le chemin du fichier

Scénario : Tolérance d'un composant déprécié sous @deprecated exclu de la signature
  Étant donné un fichier présent sur le disque portant la balise TSDoc "@deprecated"
  Et absent de la liste des signatures officielles
  Quand le test de conformité d'inventaire est exécuté
  Alors le test ne produit aucun échec bloquant
  Et un avertissement formel (WARNING) de maintenance "Dette technique résiduelle à purger" est émis avec le chemin du fichier

Scénario : Échec bloquant sur fichier officiel manquant
  Étant donné un fichier déclaré dans les signatures délimitées mais introuvable dans "src/"
  Quand le test de conformité d'inventaire est exécuté
  Alors le test échoue immédiatement avec une erreur bloquante spécifiant le fichier manquant

Scénario : Échec bloquant sur fichier intrus non répertorié sans @pendingAudit
  Étant donné un fichier présent sous "src/" qui ne figure pas dans les signatures
  Et ce fichier ne porte pas la balise "@pendingAudit"
  Quand le test de conformité d'inventaire est exécuté
  Alors le test échoue immédiatement avec une erreur bloquante spécifiant le fichier non autorisé

Scénario : Échec bloquant sur fichier déprécié répertorié dans la signature
  Étant donné un fichier portant la balise "@deprecated"
  Et figurant dans le tableau de signature du module
  Quand le test de conformité d'inventaire est exécuté
  Alors le test échoue avec une erreur bloquante interdisant la présence de code déprécié dans la signature
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Fichier de signature officiel supprimé physiquement du disque | Échec bloquant du test d'inventaire (`FAIL`) avec notification du module manquant. |
| 2 | Fichier créé sous `src/` hors signature sans balise `@pendingAudit` | Échec bloquant du test d'inventaire (`FAIL`) avec notification du fichier intrus. |
| 3 | Fichier présent dans les signatures et annoté à la fois `@pendingAudit` et `@deprecated` | Priorité à la règle d'interdiction de dépréciation : rejet bloquant immédiat (incohérence de statut). |
| 4 | Balise `@pendingAudit` sans motif explicite | Rejetée ou signalée : la balise exige une justification textuelle de la phase de transition. |
| 5 | Répertoire de build dynamique (`out/`, `dist/`, `node_modules/`) | Totalement ignoré par le scanner de fichiers (sanctuarisation du périmètre source `src/`). |
| 6 | Fichier généré de build (`*.generated.ts`) | Exclu de l'inventaire officiel et exempté des contrôles d'intrus et de code statique. |

### Ce qui est défini / Ce qui n'est pas défini

- *2026-10-14* — **Défini :** L'inventaire machine-lisible repose sur l'extraction des blocs délimités par `<!-- SIGNATURE-INVENTORY-START -->` et `<!-- SIGNATURE-INVENTORY-END -->` dans les documents de signature.
- *2026-10-14* — **Défini :** Matrice stricte des 3 cas d'échec bloquant (FAIL 1, FAIL 2, FAIL 3) et des 3 cas d'avertissement toléré (WARN 1, WARN 2, WARN 3) pour la réconciliation $L_{code} \leftrightarrow L_{doc}$.
- *2026-10-14* — **Défini :** Période transitoire où `*.added.ts` et `*.del.ts` sont acceptés par le harnais à titre de compatibilité descendante (Soft 008) jusqu'à suppression finale à l'Étape 5.
- *2026-10-16* — **Défini :** Tout fichier portant l'extension `*.generated.ts` est un artefact de compilation volatile exclu de l'inventaire des 163 signatures canoniques et exempté des audits de code statique.
- *2026-10-28* — **Défini :** L'extension `.tsx` est formellement autorisée et requise pour les composants déclaratifs Preact de la couche `src/ui/` (`UI-001` et composants/pages de `UI-012..057`), l'extension `.ts` restant la règle pour les modules de logique pure (`api/`, `i18n/`, `types/`, `hooks/`). L'inventaire de référence $L_{doc}$ extrait indifféremment les fichiers `.(ts|tsx)`.

### Critères d'acceptation

- [ ] `AC-ARCH-08-1` — Le harnais d'audit extrait automatiquement l'ensemble des fichiers répertoriés dans les tableaux délimités par `<!-- SIGNATURE-INVENTORY-START -->` et `<!-- SIGNATURE-INVENTORY-END -->` pour constituer la liste de référence $L_{doc}$ (`CASE-ARCH-08-1`).
- [ ] `AC-ARCH-08-2` — Le test d'inventaire échoue de manière bloquante si au moins un fichier présent dans $L_{doc}$ est absent du code source $L_{code}$, ou si au moins un fichier présent dans $L_{code}$ n'est pas répertorié dans $L_{doc}$, ne porte pas le tag `@pendingAudit` et n'est pas un fichier `*.generated.ts` (`CASE-ARCH-08-2`).
- [ ] `AC-ARCH-08-3` — Le test d'inventaire tolère tout composant portant le tag `@pendingAudit` ou `@deprecated` hors signature en émettant un avertissement (WARNING) au rapport d'architecture sans bloquer le build (`CASE-ARCH-08-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Balisage machine-lisible des signatures | Acceptée | L'utilisation de balises HTML discrètes `<!-- SIGNATURE-INVENTORY-START/END -->` garantit une extraction déterministe sans dépendre de titres fragiles. |
| Remplacement des suffixes destructeurs par @pendingAudit | Acceptée | Les suffixes `*.added.ts` et `*.del.ts` cassaient les imports TypeScript/ESM. Les balises TSDoc préservent la validité syntaxique des chemins. |
| Éviction absolue du déprécié des signatures | Acceptée | Les signatures définissent l'architecture pérenne cible ; toute tolérance de dépréciation dans la doc brouillerait la compréhension. |

---

## SPEC-ARCH-09 — Génération du rapport d'audit et de conformité d'architecture (dossier out/arch/)

**Exigences :** `R-01` à `R-45`, `C-01` à `C-15`, `REQ-001` à `REQ-112`, `ADR-001` à `ADR-015`, signatures `ROOT-001`, `TYPES-001..013`, `UTILS-001..031`, `DOM-001..019`, `LIB-001..022`, `SVC-001..013`, `CTL-001..007`, `UI-001..057`  
**Statut :** proposé  
**Version :** v1.2 (2026-10-15 — Confinement des rapports dans le sous-dossier out/arch/)

### Règle

> À l'issue de chaque exécution des tests et vérifications d'architecture (`ARCH`), un rapport d'audit exhaustif et structuré est automatiquement généré dans le répertoire **`out/arch/`** à la racine du projet (`out/arch/rapport-arch.md` et `out/arch/arch-report.json`).
> Ce rapport constitue le compte-rendu opposable d'audit et doit obligatoirement consigner :
> 1. **Synthèse exécutive :** Horodatage, statut global (`SUCCÈS`, `AVERTISSEMENTS`, `ÉCHEC`), nombre total de tests exécutés, réussis, échoués et nombre d'avertissements.
> 2. **Bilan de l'inventaire des signatures :** Décompte des fichiers conformes, liste détaillée des fichiers en transition (`@pendingAudit`, `@deprecated` ou drapeaux temporaires) avec avertissement.
> 3. **Bilan d'étanchéité du DAG :** Matrice de conformité des flux d'imports pour chacune des 8 couches du système.
> 4. **Registre exhaustif des exemptions TSDoc :** Tableau listant la totalité des exemptions actives trouvées dans le code (`@fileExemption`, `@functionExemption`, `@returnTypeExemption`, `@complexityExemption`), en précisant pour chacune : le chemin du fichier, la ligne, le symbole concerné et la justification textuelle exacte extraite du code.
> 5. **Bilan des erreurs et métriques de qualité :** Liste ordonnée de toutes les erreurs bloquantes identifiées (si présentes), complexité cyclomatique maximale observée, et vérification du bannissement de `any`.

### Portée

- Couvre la création automatique du répertoire `out/arch/` s'il est absent.
- Couvre la rédaction automatisée du fichier Markdown `out/arch/rapport-arch.md` formaté pour revue humaine.
- Couvre la génération du fichier JSON `out/arch/arch-report.json` structuré pour exploitation automatisée en CI.
- Couvre l'extraction statique et la restitution intégrale de toutes les balises d'exemption TSDoc et de leurs justifications.
- Couvre la consignation explicite de l'ensemble des erreurs et des avertissements de transition (`@pendingAudit`, `@deprecated`, `*.added.*`, `*.del.*`).
- Ne couvre pas la validation unitaire des règles de domaine individuelles → `SPEC-ARCH-01` à `SPEC-ARCH-08`.

### Scénarios nominaux

```gherkin
Scénario : Génération automatique du rapport à la racine du projet sous out/arch/
  Étant donné l'exécution complète de la suite de tests d'architecture
  Quand tous les contrôles d'architecture sont terminés
  Alors le dossier "out/arch/" contient obligatoirement le fichier "out/arch/rapport-arch.md"
  Et le dossier "out/arch/" contient obligatoirement le fichier "out/arch/arch-report.json"
  Et le rapport contient l'horodatage, le statut global et le résumé des vérifications

Scénario : Consignation intégrale du registre des exemptions TSDoc dans le rapport
  Étant donné des fichiers sources contenant des balises "@fileExemption", "@functionExemption", "@returnTypeExemption" ou "@complexityExemption"
  Quand le rapport d'architecture est généré
  Alors il comporte une section dédiée listant chacune des exemptions trouvées
  Et chaque entrée mentionne le chemin du fichier, le symbole, le type d'exemption et la justification exacte

Scénario : Restitution des avertissements de transition dans le rapport
  Étant donné la présence de fichiers avec balises de transition ("@pendingAudit", "@deprecated" ou drapeaux de transition) dans la base de code
  Quand le rapport est généré
  Alors la section des avertissements détaille la liste complète de ces fichiers
  Et le statut global du rapport indique "AVERTISSEMENTS" (en l'absence d'erreurs bloquantes)
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Répertoire `out/arch/` absent avant le lancement des tests | Créé automatiquement sans lever d'erreur système. |
| 2 | Échec d'un ou plusieurs tests d'architecture | Le rapport est tout de même généré avec le statut global `ÉCHEC` et la liste exhaustive des non-conformités. |
| 3 | Aucune exemption déclarée dans l'ensemble de la base de code | La section des exemptions affiche un tableau vide avec la mention explicite *"Aucune exemption active requise"*. |
| 4 | Caractères spéciaux ou sauts de ligne dans la justification d'une balise TSDoc | Correctement échappés et mis en forme dans le tableau Markdown du rapport. |

### Ce qui n'est pas défini

- *2026-10-01* — Historisation des anciens rapports : chaque exécution écrase `out/arch/rapport-arch.md` avec l'état le plus récent. L'archivage historique est délégué au gestionnaire de rapports du projet.

### Critères d'acceptation

- [ ] `AC-ARCH-09-1` — Le fichier de rapport d'audit d'architecture `out/arch/rapport-arch.md` est automatiquement généré à l'issue de l'exécution des tests d'architecture (`CASE-ARCH-09-1`).
- [ ] `AC-ARCH-09-2` — Le rapport d'audit synthétise exhaustivement le statut global, le décompte des tests, les erreurs bloquantes et l'ensemble des avertissements (`CASE-ARCH-09-2`).
- [ ] `AC-ARCH-09-3` — Le rapport dresse le registre complet de la totalité des exemptions TSDoc (`@fileExemption`, `@functionExemption`, `@returnTypeExemption`, `@complexityExemption`) avec fichier, ligne, symbole et justification (`CASE-ARCH-09-3`).
- [ ] `AC-ARCH-09-4` — Le fichier JSON structuré `out/arch/arch-report.json` est généré concomitamment et expose a minima le statut global, les décomptes, les avertissements de transition (`@pendingAudit`, `@deprecated`, `*.added`/`*.del`), le registre des exemptions **et la matrice d'étanchéité des 8 couches** (`CASE-ARCH-09-4`).
- [ ] `AC-ARCH-09-5` — Le rapport Markdown `out/arch/rapport-arch.md` comporte obligatoirement le bilan d'étanchéité du DAG : matrice de conformité des flux d'imports pour chacune des 8 couches, alignée sur `signature.md` §5 (`CASE-ARCH-09-5`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Inclusion du format JSON aux côtés du Markdown | Acceptée | Permet une double exploitation : revue humaine immédiate via `rapport-arch.md` et parsing automatisé via `arch-report.json`. |
| Isolation du dossier `out/` | Acceptée | Le dossier `out/` est un répertoire d'artéfacts de sortie dédié aux résultats d'exécution. |



