# Signature de Domaine — Racine `src/` (Palier 8 : Composition Root Unique)

**Date de signature :** 25/09/2026  
**Auteur :** Autrement (`U`)  
**Projet :** ClientsBox (Plateforme d'Orchestration d'Agents IA Locaux)  
**Domaine :** `SRC-ROOT`  
**Couche DAG :** `8-root` *(Point d'entrée / Composition Root — peut importer TOUS les domaines serveur)*  
**Peut importer :** `types`, `utils`, `domain`, `lib`, `services`, `controllers` *(la couche `ui` est servie via les assets statiques in-memory de `lib/http/` per ADR-012/ADR-013/ADR-015)*  
**Peut être importé par :** *(personne — c'est le point d'entrée exécutable)*  
**Référentiel :** [`signature.md`](./signature.md), spécification d'architecture technique [`ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-01`, `SPEC-ARCH-04`), [`SRV.md`](../specs/SRV.md) (`SPEC-SRV-01`, `SPEC-SRV-02`), [`ADPT.md`](../specs/ADPT.md) (`SPEC-ADPT-03`), décisions d'architecture ([`ADR-001`](../adr/ADR-001-socle-applicatif.md), [`ADR-006`](../adr/ADR-006-strategie-et-harnais-de-test.md), [`ADR-012`](../adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md), [`ADR-017`](../adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md)).

---

## 1. Contexte, Rôle & Principes Directeurs

Le module **`src/index.ts`** constitue le **Palier 8 et l'unique Composition Root** de ClientsBox.  
Sa responsabilité exclusive est d'instancier, d'injecter et de lier l'ensemble des dépendances au démarrage du processus Node.js, de parser les arguments de la ligne de commande (`-p`/`--port`), de démarrer le serveur HTTP local et d'intercepter les signaux d'arrêt du système d'exploitation (`SIGINT`/`SIGTERM`) pour libérer les ressources proprement.

### 1.1 Principes d'Ingénierie & Règles d'Or du Palier 8

1. **Composition Root Exclusif (`SPEC-ARCH-04`, `CASE-ARCH-04-1`) :**
   - `index.ts` est l'unique endroit où les instances concrètes des services singleton, contrôleurs et adapters sont assemblées.
   - Aucun autre module de `src/` ne procède à l'assemblage global de l'application.
2. **Zéro Logique Métier en Racine (`CASE-ARCH-04-2`) :**
   - `index.ts` ne contient ni règle métier, ni calcul algorithmique, ni logique de persistance.
   - Il se limite strictly au câblage des dépendances et au démarrage réseau.
3. **Déploiement Centralisé de la Configuration (`SPEC-SRV-01`, `ADR-022`) :**
   - La racine déploie la configuration applicative au boot via `ConfigService.deploy(process.argv.slice(2))` (`src/services/config/`), résout `workspacePath`, valide les 3 binaires d'agents obligatoires et applique les valeurs par défaut.
4. **Gestion Centralisée des Signaux OS & Délégation Process (`SPEC-SRV-01`, `SPEC-SRV-02`) :**
   - L'interception de `SIGINT`/`SIGTERM` pour l'arrêt gracieux 3000 ms et l'affichage de la bannière loopback sont orchestrés au boot par `index.ts` en s'appuyant sur les modules dédiés de `lib/process/` (`graceful-shutdown.manager.ts`, `startup-banner.printer.ts`).
5. **Un Seul Fichier à la Racine :**
   - Aucun autre fichier de code source n'est toléré directement sous `src/` en dehors d'`index.ts`.

---

## 2. Graphes Acycliques de Dépendances (DAG Macro & Micro)

### 2.1 Positionnement dans le DAG Macro (Palier 8 — Sommet Exécutable)

Dans le DAG macro, `index.ts` occupe le sommet absolu de la cascade, pouvant importer toutes les couches sans qu'aucun fichier ne l'importe :

```text
       ┌───────────┐     ┌───────────┐     ┌───────────┐
       │   types   │     │   utils   │     │  domain   │
       └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
             │                 │                 │
             └────────┬────────┴────────┬────────┘
                      │                 │
                ┌─────▼─────┐     ┌─────▼─────┐
                │    lib    │     │ services  │
                └─────┬─────┘     └─────┬─────┘
                      │                 │
                      └────────┬────────┘
                               │
                         ┌─────▼─────┐
                         │controllers│
                         └─────┬─────┘
                               │
                               ▼
       ┌───────────────────────────────────────────────────────────────┐
       │                       src/index.ts                            │
       │     Palier 8 — Composition Root & Point d'Entrée Unique       │
       │                 Importable par AUCUN module                   │
       └───────────────────────────────┬───────────────────────────────┘
                                       │ (Distribution in-memory assets UI)
                                       ▼
                         ┌───────────────────────────┐
                         │            ui             │
                         └───────────────────────────┘
```

### 2.2 Micro-DAG Intra-Couche (Assemblage Unilatéral Unique)

En tant que module singleton racine, `index.ts` ne possède pas de sous-modules : il réalise une instanciation linéaire et séquentielle des couches inférieures :

$$\text{env-layout} \to \text{adapters} \to \text{services} \to \text{controllers} \to \text{router/static} \to \text{http-server}$$

---

## 3. Inventaire & Arborescence des Fichiers (`src/`)

```text
src/
└── index.ts                                    # [ROOT-001] Point d'entrée v1 / Composition Root (démarrage HTTP, parsing CLI, signaux OS, holder runners)
```

### Tableau Normalisé des Fichiers du Module

<!-- SIGNATURE-INVENTORY-START -->
| fileId | filepath | file description |
| :--- | :--- | :--- |
| ROOT-001 | index.ts | Point d'entrée v1 / Composition Root (démarrage HTTP, parsing CLI, signaux OS, holder runners). |
<!-- SIGNATURE-INVENTORY-END -->

---

## 4. Spécifications Extérieures des Contrats & Rôles

- **Immutabilité de `process.cwd()` :** les tests de démarrage (`CASE-SRV-01-4`) injectent `workspacePath` sans altérer le répertoire courant du processus.
- **Échec strict sur port occupé :** si le port 2974 (ou configuré) est déjà utilisé (`EADDRINUSE`), le processus s'arrête immédiatement avec un code d'erreur sans tenter d'autres ports (`REQ-005`, `R-35`).
- **Affichage console épuré :** l'URL locale est imprimée dans la console standard, sans déclencher d'ouverture automatique de navigateur (`REQ-004`).
- **Câblage complet du `RunnerHolder` (`ROOT-001`) :** `index.ts` instancie `ScenarioRunnerService` avec ses dépendances (`agentService`, `resourceStore`, `adapterRegistry`), fournit les fonctions `startRunner` et `stopActiveRunner` au `runnerHolder`, maintient la référence `activeRunner` pour la diffusion SSE, souscrit aux événements d'exécution avant de lancer le run, et assure la désouscription complète (`off`) lors de l'arrêt gracieux pour garantir l'absence de fuite mémoire.
- **Câblage documentation utilisateur (`ADR-017`) :** `index.ts` résout `docsRoot` via `resolveAgentsLayout`, instancie `UserDocsService` (`SVC-013`) et enregistre `docs.controller` (`CTL-007`) sur le routeur HTTP (`GET /api/docs`, `POST /api/docs/export`).

---

## 5. Matrice des Dépendances & Flux d'Imports

| Couche source | Ce qu'elle PEUT importer | Ce qu'elle NE PEUT PAS importer | Qui PEUT l'importer | Sanctions & Contrôles Vitest |
| :--- | :--- | :--- | :--- | :--- |
| **`index.ts`** | **TOUTES LES COUCHES SERVEUR** (`types/`, `utils/`, `domain/`, `lib/`, `services/`, `controllers/` ; `ui/` servie in-memory via `LIB-008` / ADR-012 / ADR-013 / ADR-015) | *Aucune restriction descendante* | **PERSONNE** (aucun fichier ne doit importer `index.ts`) | Violation bloquante détectée par `CASE-ARCH-04-1` (unicité composition root) et `CASE-ARCH-01-1`. |

---

## 6. Attestation de Validation & Conformité

### 6.1 Matrice de Traçabilité

| ID Fichier | Specs couvertes | ADRs liés | CASEs associés |
| :--- | :--- | :--- | :--- |
| `ROOT-001` | `SPEC-SRV-01`, `SPEC-SRV-02`, `SPEC-ADPT-03`, `SPEC-DATA-05` | `ADR-001`, `ADR-017` | `CASE-SRV-01-1..4`, `CASE-SRV-02-1..5`, `CASE-SRV-02-17..18` |

### 6.2 Sceau Formel d'Attestation

Le présent document atteste contractuellement du rôle de Composition Root exclusive de **`src/index.ts`** :
1. `index.ts` est l'unique point d'assemblage du système et n'est importé par aucun autre fichier (`CASE-ARCH-04-1`).
2. La gestion des signaux OS et l'arrêt gracieux 3000 ms sont pleinement effectifs (`CASE-SRV-02-3`).
3. La conformité est vérifiée en continu par la suite `tests/arch/` et `tests/srv/`.

*Document validé et scellé pour le Palier 8 (`src/index.ts`).*
