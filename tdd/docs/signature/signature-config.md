# Signature de Domaine — `src/config/` (Palier Configuration : Schémas Déclaratifs & Constantes)

**Date de signature :** 17/11/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `CONFIG`  
**Couche DAG :** `config` *(Schémas déclaratifs d'environnement et de flags CLI, constantes nominales — zéro I/O)*  
**Peut importer :**  
- `src/types/` : types purs uniquement (`import type`)  
- `src/utils/` : tout (valeurs et types purs)  
- `src/lib/` : **STRICTEMENT INTERDIT** (aucun import, ni runtime ni types)  
**Peut être importé par :** `src/services/config/config.service.ts` (`ConfigService`) **EXCLUSIVEMENT**  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`), spécification serveur [`SRV.md`](../specs/SRV.md) (`SPEC-SRV-01`), cahier des charges [`cahier-des-charges-v2.2.md`](../cdc/cahier-des-charges-v2.2.md) (`REQ-046`, `R-50`, `REQ-031`, `REQ-112`), décision d'architecture [`ADR-022`](../adr/ADR-022-chargement-dynamique-environnement.md).

---

## 1. Contexte, Rôle & Principes Directeurs

La couche **`src/config/`** constitue le réceptacle centralisé des schémas déclaratifs et des valeurs constantes de configuration de ClientsBox.  
Sa responsabilité exclusive est de formaliser de manière déclarative les contrats des options de la ligne de commande (`CLIENTSBOX_CLI_SCHEMA`), les règles et prérequis des variables d'environnement (`CLIENTSBOX_ENV_SCHEMA`), et les constantes scalaires par défaut (port HTTP, adresse de liaison, répertoire de travail, timeouts).

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier Config

1. **Déclaratif Pur & Zéro I/O (`SPEC-ARCH-01`) :**
   - Les fichiers de `src/config/` ne réalisent aucune lecture disque, aucun accès réseau et aucun appel à des APIs natives Node.js (`fs`, `process.env`, `process.cwd()`, etc.).
   - Ils définissent des constantes pures et des structures descriptives destinées à être interprétées par les moteurs d'exécution.
2. **Étanchéité des Imports Entrants :**
   - `src/config/` n'importe que des **types purs de `types/`** (`import type`, ex: `CliParserSchema` per `TYPES-014` et `EnvSchema` per `TYPES-015` sous `src/types/contracts/`).
   - Il a le droit d'importer tout élément issu de `utils/` (fonctions utilitaires pures, helpers).
   - Tout import depuis `src/lib/` (y compris `import type`) est **strictement interdit** : `config/` ne connaît aucun module d'infrastructure.
3. **Consommation Exclusive par `ConfigService` :**
   - Aucun module applicatif (`src/index.ts`, contrôleurs, adaptateurs, lib, ui) n'a le droit d'importer directement `src/config/`.
   - Seul `src/services/config/config.service.ts` déploie et instancie la configuration.
4. **Hermétisme Vis-à-Vis du Domaine (`domain/`) :**
   - `src/domain/` ne doit jamais importer `src/config/`.
   - Cela préserve l'isomorphisme sans I/O du domaine et empêche toute fuite de configuration serveur/OS vers le frontend navigateur `ui/`.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro Global

Dans le DAG macro, `src/config/` se positionne sous la strate déclarative `types/` et alimente exclusivement la couche `services/` :

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

### 2.2 Micro-DAG Intra-Couche (Ordre Topologique Strict)

Au sein de `src/config/`, les constantes constituent la feuille fondamentale consommée par les schémas :

$$\text{constants.config.ts} \prec (\text{cli-flags.config.ts} \parallel \text{env.config.ts})$$

```text
       ┌───────────────────────────────────────────────────────────────┐
       │                   config/constants.config.ts                  │
       │      DEFAULT_SERVER_PORT, DEFAULT_SERVER_HOST, etc.           │
       │             (Feuille de constantes scalaires)                 │
       └───────────────────────────────▲───────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │                                 │
       ┌──────────────┴────────────────┐ ┌──────────────┴──────────────┐
       │   config/cli-flags.config.ts  │ │    config/env.config.ts     │
       │     CLIENTSBOX_CLI_SCHEMA     │ │    CLIENTSBOX_ENV_SCHEMA    │
       └───────────────────────────────┘ └─────────────────────────────┘
```

---

## 3. Inventaire & Arborescence des Fichiers (`src/config/`)

```text
src/config/
├── constants.config.ts                         # [CONFIG-001] Constantes et valeurs par défaut nominales
├── cli-flags.config.ts                         # [CONFIG-002] Schéma déclaratif des options de ligne de commande
├── env.config.ts                               # [CONFIG-003] Schéma déclaratif des variables d'environnement
└── index.ts                                    # [CONFIG-004] Point de réexport interne pour ConfigService
```

### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| CONFIG-001 | config/constants.config.ts | Constantes scalaires et valeurs par défaut (ports, hôtes, répertoires, timeouts). |
| CONFIG-002 | config/cli-flags.config.ts | Schéma déclaratif des options de démarrage CLI (port, envFile, execScene). |
| CONFIG-003 | config/env.config.ts | Schéma déclaratif des variables d'environnement runtime et prérequis de binaires. |
| CONFIG-004 | config/index.ts | Point d'entrée consolidé et réexport des schémas et constantes du palier config. |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

- **`DEFAULT_SERVER_PORT = 2974` :** Valeur nominale du port d'écoute HTTP local loopback (`C-04`, `REQ-005`).
- **`DEFAULT_SERVER_HOST = '127.0.0.1'` :** Adresse loopback exclusive de liaison réseau locale (`C-11`, `SPEC-SRV-02`).
- **`DEFAULT_AGENTS_DIR = '.agents'` :** Répertoire standard de travail local sous le workspace hôte (`C-03`, `ADR-005`).
- **Prérequis stricts des 3 binaires CLI d'agents :** Les variables `CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN` et `CODEX_CLI_BIN` sont déclarées obligatoires (`REQ-031`, `REQ-112`, `R-40`, `ADR-022`).

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`config`** | `types/` (types purs `import type`), `utils/` (tout : valeurs et types) | `lib/` (**strictement interdit**, y compris `import type`), modules Node.js I/O directs, `domain/`, `services/`, `controllers/`, `ui/`, `index.ts` | **`services/config/` (`ConfigService`) EXCLUSIVEMENT** (interdit formellement à `domain`, `index.ts`, `controllers`, `lib`, `ui`) | Violation bloquante détectée par `CASE-ARCH-01-1`. |

---

## 6. Attestation de Validation & Conformité

Le présent document atteste que la couche `src/config/` de ClientsBox v1 :
1. Contient 4 modules officiels signés (`CONFIG-001` à `CONFIG-004`).
2. Est exempte de tout effet de bord d'I/O direct ou accès système Node.js.
3. Est strictement consommée par `src/services/config/` pour instancier la configuration applicative.
