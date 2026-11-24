# Analyse d'impact — CR-009 (Exécution Headless en Ligne de Commande via `--exec-scene`)

**Demande du client :** Pouvoir démarrer et exécuter un scénario directement depuis la ligne de commande (`node clientsbox.js --exec-scene <nom du scenario>`) en direct dans le terminal, sans passer par l'interface web (mode headless).  
**Reçue le :** 16/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Entretien source :** [`tdd/docs/cr/CR-002.md`](../cr/CR-002.md) (Questions CR-02/Q01 à Q05)  
**Branche Git dédiée :** `feat/cli-exec-scene`  
**Cible documentaire :** **CDC v2.2** (amendement versionné étendant [`cahier-des-charges-v2.1.md`](../cdc/cahier-des-charges-v2.1.md))  

---

> **Règle fondamentale TDD :**  
> Interdiction formelle de modifier le code de production avant la ratification de cette analyse, l’amendement du CDC **v2.2**, la mise à jour des spécifications / cas de test, et la vérification des tests unitaires rouges.  
> La chaîne descend impérativement : CDC $\rightarrow$ ADR $\rightarrow$ Specs $\rightarrow$ Signatures & Architecture $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.

---

## 1. Ce que le client demande, reformulé

ClientsBox nécessite aujourd'hui le démarrage du serveur HTTP local sur le port 2974 et l'interaction via l'IHM web ou l'API SSE `/api/execution/run` pour déclencher l'exécution d'un scénario.  
Le client souhaite désormais pouvoir exécuter un scénario en ligne de commande directe via :
```bash
node clientsbox.js --exec-scene <nom du scenario>
```

1. **Mode 100 % Headless sans serveur web :** Aucun serveur HTTP ne doit être démarré ; aucun port TCP n'est lié. Cela élimine tout risque de conflit de port (`EADDRINUSE`) et permet des exécutions concurrentes ou des lancements dans des pipelines CI/CD.
2. **Résolution tolérante du scénario :** L'argument cible `<cible>` doit être résolu en priorité par identifiant technique exact (`id`, ex: `test-step1-dialogue`), puis par repli insensible à la casse sur le libellé utilisateur (`name`, ex: `Test Step 1 — Dialogue Multi-Agents`).
3. **Visibilité console en temps réel (Option B validée) :** Le terminal retransmet en streaming continu les sorties des agents et commandes (`stdout`/`stderr`), balisées par des marqueurs textuels explicites de cycle de vie émis par ClientsBox (`[ClientsBox] Démarrage...`, `[Bloc: <id>] Début/Terminé`, `[ClientsBox] Succès global`).
4. **Normalisation des codes de sortie système :**
   - Exit code `0` : exécution menée à terme avec statut `completed` (succès).
   - Exit code `1` : scénario introuvable ou échec d'un bloc (`status: error`).
   - Exit code `130` : interruption manuelle par l'utilisateur (`Ctrl+C` / `SIGINT`), déclenchant l'arrêt d'urgence propre de tous les processus fils actifs (escalade SIGTERM/SIGKILL).

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision actée (CR-002) |
|---|---|---|
| 1 | Doit-on ouvrir un port HTTP lors de `--exec-scene` ? | **Non.** Aucun serveur HTTP, aucune interface graphique. Mode 100 % console. |
| 2 | Quel format de sortie adopter en console ? | **Option B.** Flux bruts des agents et commandes enrichis de marqueurs textuels de cycle de vie. |
| 3 | Comment résoudre le scénario fourni en argument ? | Recherche prioritaire par `id`, puis par `name` (insensible à la casse). |
| 4 | Que faire sur interruption manuelle `Ctrl+C` ? | Arrêt propre coordonné des processus fils (SIGTERM/SIGKILL), message d'arrêt, exit code `130`. |
| 5 | Codes de sortie en cas d'erreur de bloc ? | Exit code `1` avec message sur `stderr`. |

---

## 3. Impact — Cahier des charges (**CDC v2.1 → v2.2**)

| Exigence | Impact | Action (v2.2) |
|---|---|---|
| Section 1.2 — Objectifs opérationnels | **Complétée** | Ajout de l'objectif d'exécution autonome en console sans serveur web (mode batch / CI). |
| **REQ-001** / **REQ-002** (Serveur HTTP) | **Nuancées** | Le démarrage du serveur HTTP sur le port configuré ne s'applique qu'en mode serveur par défaut (en l'absence de `--exec-scene`). |
| **REQ-004** (URL dans le terminal) | **Nuancée** | L'URL `http://localhost:PORT` n'est affichée qu'en mode serveur ; en mode `--exec-scene`, le terminal diffuse le log d'exécution du scénario. |
| **REQ-044** *(nouvelle)* | **Ajoutée** | **Mode CLI Headless autonome** : support de l'option `--exec-scene <cible>` (et `--exec-scene=<cible>`). Résolution par `id` puis `name`. Streaming temps réel dans la console. |
| **R-48** *(nouvelle)* | **Ajoutée** | Règle de cycle de vie et codes d'arrêt CLI : exit 0 en succès, exit 1 en erreur / scénario introuvable, exit 130 sur SIGINT avec arrêt propre des sous-processus actifs. |

---

## 4. Impact — Spécifications Fonctionnelles

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| **`SPEC-SRV-01`** (Démarrage CLI & configuration) | **Modifiée** | - Extension du parser d'arguments CLI (`parseServerCliArgs`) pour capturer `execScene?: string`.<br/>- Ajout du critère `AC-SRV-01-5` : Détection et validation du token `--exec-scene <val>` / `--exec-scene=<val>`.<br/>- Ajout du critère `AC-SRV-01-6` : Exécution autonome du scénario en direct dans le terminal sans serveur HTTP, avec streaming des logs et exit code 0.<br/>- Ajout du critère `AC-SRV-01-7` : Signalement sur `stderr` et arrêt exit 1 si scénario introuvable ou échec de bloc ; exit 130 sur SIGINT. |
| **`SPEC-SRV-02`** (Serveur HTTP, API & SSE) | **Inchangée** | Spécification active uniquement en mode serveur web (non instanciée en mode `--exec-scene`). |
| **`SPEC-ENG-03`** / **`SPEC-ENG-04`** (Moteur de blocs) | **Inchangées** | Le moteur `ScenarioRunnerService` est déjà découplé du protocole HTTP : il expose les événements `chunkReceived`, `blockStatusChanged` et `statusChanged` exploitables en direct. |
| **`SPEC-ARCH-03`** (Isolation processus) | **Inchangée** | La cascade d'escalade SIGTERM $\rightarrow$ SIGKILL de `child-process.spawner.ts` est réutilisée à l'identique pour l'interruption `Ctrl+C`. |

---

## 5. Impact — Conception & Architecture

| Artefact | Impact | Ce qui change |
|---|---|---|
| **`ADR-020`** *(nouveau)* | **Créé** | Formalisation de l'architecture d'exécution CLI directe : bifurcation précoce dans le Composition Root `src/index.ts` (ROOT-001) évitant l'instanciation de `createLocalHttpServer`. |
| Architecture `src/index.ts` | **Modifiée** | Si `execScene` est présent : instanciation des services de stockage et des adapters, résolution du scénario, exécution via un runner console headless, puis `process.exit()`. |
| Module contrôleur console | **Ajouté** | Nouveau contrôleur `src/controllers/cli/cli-scenario.controller.ts` (CTL-004) assurant la liaison entre les événements du runner et les flux `process.stdout` / `process.stderr`. |
| Schéma de signatures | **Modifié** | `tdd/docs/signature/signature-lib.md` : mise à jour de `ParsedServerCliArgs` avec `execScene?: string`. |

---

## 6. Impact — Cas de Test (TDD)

| Fiche de Test | Impact | Description |
|---|---|---|
| **`CASE-SRV-01-5`** *(nouvelle)* | **À créer** | Test unitaire du parsing de l'argument `--exec-scene` (formes avec espace, avec `=`, valeur manquante, etc.). |
| **`CASE-SRV-01-6`** *(nouvelle)* | **À créer** | Test d'intégration de l'exécution headless : streaming des chunks, émission des marqueurs de bloc, terminaison avec exit code 0. |
| **`CASE-SRV-01-7`** *(nouvelle)* | **À créer** | Test de résilience d'exécution headless : scénario inexistant (erreur `stderr`, exit 1), échec d'un bloc (exit 1), et interruption SIGINT (exit 130). |

---

## 7. Impact — Code de Production

| Composant | Rôle & Modification |
|---|---|
| `src/lib/process/cli-args.parser.ts` | Ajout du parsing de `--exec-scene` dans `parseServerCliArgs()`, retournant `{ port, execScene?: string }`. |
| `src/controllers/cli/cli-scenario.controller.ts` | Nouveau composant encapsulant l'exécution directe en console, le formatage des sorties temps réel (Option B) et la capture des signaux `SIGINT`/`SIGTERM`. |
| `src/index.ts` | Bifurcation d'amorçage : si `parsedArgs.execScene` est défini, exécuter `runHeadlessScenario(...)` et sortir avec le code approprié au lieu de lancer le serveur HTTP. |

---

## 8. Effets de bord identifiés & Maîtrise des risques

1. **Risque de conflit de port en CI/CD :**  
   *Maîtrise :* En mode `--exec-scene`, aucun serveur HTTP n'est démarré ; aucun socket TCP n'est lié. Aucun conflit `EADDRINUSE` possible.
2. **Processus orphelins sur `Ctrl+C` :**  
   *Maîtrise :* Branchement direct de l'écouteur `SIGINT` sur `runner.stop()`, garantissant l'escalade `SIGTERM` puis `SIGKILL` sur les processus agents et commandes shell actifs avant l'arrêt du processus Node.
3. **Cas d'ambiguïté sur le libellé du scénario :**  
   *Maîtrise :* La recherche par `id` technique exact prime toujours. Si deux scénarios partagent le même libellé `name`, le premier trouvé est retenu de manière déterministe.

---

## 9. Ce que nous ne ferons pas dans cette étape

- Passage de variables dynamiques ou paramètres d'entrée de scénario en CLI (le sac d'entrées initial reste conforme à la v2.1).
- Mode interactif en ligne de commande demandant une saisie utilisateur dans `stdin`.

---

## 10. Ordre d'exécution retenu

| # | Étape | Livrables associés |
|---|---|---|
| 1 | Amendement du Cahier des charges | `tdd/docs/cdc/cahier-des-charges-v2.1.md` mis à jour vers v2.2 (R-48, REQ-044). |
| 2 | Décision d'Architecture | `tdd/docs/adr/ADR-020-cli-exec-scene.md` rédigé et ratifié. |
| 3 | Spécifications fonctionnelles | `tdd/specs/SRV.md` mis à jour avec `SPEC-SRV-01` (`AC-SRV-01-5..7`) et `sommaire.md`. |
| 4 | Fiches de Test TDD | `tdd/tests/srv/CASE-SRV-01-5.md`, `CASE-SRV-01-6.md`, `CASE-SRV-01-7.md`. |
| 5 | Tests unitaires Vitest (ROUGE) | Écriture des tests unitaires `tests/units/srv/CASE-SRV-01-5.test.ts`... |
| 6 | Implémentation du code (VERT) | `cli-args.parser.ts`, `cli-scenario-runner.ts`, `src/index.ts`. |
| 7 | Refactoring & Contrôle Qualité | `npm run quality` (typecheck, lint, prettier) et suite de tests complète. |
