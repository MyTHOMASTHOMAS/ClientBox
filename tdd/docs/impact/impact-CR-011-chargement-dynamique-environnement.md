# Analyse d'impact — CR-011 (Chargement Dynamique d'Environnement au Runtime)

**Demande du client :** Rendre la configuration des variables d'environnement 100 % dynamique au runtime dans Node.js, charger par défaut `env/.env` sans erreur si absent, supporter le flag CLI `-e` / `--env` avec échec fatal si le fichier spécifié est introuvable, valider impérativement les 3 binaires CLI d'agents obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) au démarrage, appliquer les valeurs par défaut via un service dédié, et supprimer l'injection statique au build dans Vite.  
**Reçue le :** 17/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Entretien source :** [`tdd/docs/cr/CR-003.md`](../cr/CR-003.md) (Questions CR-03/Q01 à Q08)  
**Branche Git dédiée :** `feat/cli-exec-scene`  
**Cible documentaire :** **CDC v2.2** ([`cahier-des-charges-v2.2.md`](../cdc/cahier-des-charges-v2.2.md)), [`ADR-022`](../adr/ADR-022-chargement-dynamique-environnement.md)  

---

> **Règle fondamentale TDD :**  
> Interdiction formelle de modifier le code de production avant la ratification de cette analyse, l’amendement de l'ADR dédié, la mise à jour des spécifications / cas de test, et la vérification des tests unitaires rouges.  
> La chaîne descend impérativement : CR $\rightarrow$ Impact $\rightarrow$ ADR $\rightarrow$ Specs $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.

---

## 1. Ce que le client demande, reformulé

ClientsBox utilisait jusqu'à présent l'injection statique des variables d'environnement au moment de la compilation par Vite (`define` dans `vite.config.ts`, selon l'ADR-008).  
Cette approche présentait trois limitations critiques :
1. **Livrable non portable :** `dist/clientsbox.js` contenait les chemins en dur de la machine de build, interdisant le partage direct du binaire sans recompilation.
2. **Accès dynamiques inopérants :** L'évaluation indexée `process.env['LOGS_DISABLED']` dans le sous-système de logging n'était pas substituée par Vite, affichant des logs même lorsque `LOGS_DISABLED=true` était configuré.
3. **Rigidité opérationnelle :** Obligation d'avoir un `.env` valide sur la machine de compilation pour que `npm run build` réussisse.

Le client acte une refonte complète vers un chargement **100 % dynamique au runtime** :
1. **Suppression du baking Vite :** Retrait de toute injection `define` de `process.env.*` au build.
2. **Chargement par défaut depuis `env/.env` :** À l'exécution, recherche automatique de `env/.env`. Si ce fichier est absent, **ce n'est pas une erreur** : l'application démarre et utilise directement `process.env`.
3. **Spécification explicite via flag CLI (`-e` ou `--env <chemin>`) :** L'opérateur peut indiquer un fichier d'environnement spécifique (`-e`, `--env`, `--env=`). Si le fichier spécifié est **inexistant**, l'application s'arrête **immédiatement avec une erreur fatale explicite en français**.
4. **Validation stricte des 3 binaires CLI d'agents obligatoires :** `CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN` et `CODEX_CLI_BIN` sont tous obligatoires au démarrage de ClientsBox. Leur existence physique et exécutabilité sont vérifiées au lancement.
5. **Service de déploiement et d'orchestration (`ConfigService`) :** Séparation étanche entre les moteurs d'exécution (`lib/process/`), les schémas déclaratifs (`src/config/`) et le déploiement applicatif (`src/services/config/`). Application des valeurs par défaut (`PORT=2974`, `HOST=127.0.0.1`, `AGENTS_DIR=.agents`, `LOGS_DISABLED=false`, etc.) avant tout démarrage de service ou du logger.

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision actée (CR-003) |
|---|---|---|
| 1 | Quelle est la source d'environnement par défaut ? | Le fichier **`env/.env`** relatif au répertoire de travail (`workspacePath`). |
| 2 | Quel comportement si `env/.env` est absent ? | **Tolérance totale :** aucune erreur de fichier. L'application utilise `process.env` existant. |
| 3 | Comment spécifier un fichier personnalisé ? | Flags CLI **`-e <chemin>`**, **`--env <chemin>`**, ou **`--env=<chemin>`**. |
| 4 | Quel comportement si le fichier spécifié via `-e` / `--env` n'existe pas ? | **Échec fatal immédiat :** arrêt avec message d'erreur clair en français (`EnvLoadError`). |
| 5 | Faut-il implémenter une cascade multi-fichiers (`.env.local`, `.env.test`) ? | **Non.** Chargement d'un fichier unique (soit `-e`, soit `env/.env`, soit rien) fusionné avec `process.env`. |
| 6 | Quels binaires CLI d'agents sont obligatoires ? | Les 3 binaires CLI d'agents (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**) sont tous obligatoires au démarrage (vérifiés comme exécutables valides). |
| 7 | Quel est le rôle du service d'initialisation de configuration ? | Valider les 3 binaires obligatoires, appliquer les valeurs par défaut, injecter dans `process.env` et retourner l'objet immuable `AppConfig`. |
| 8 | Quel impact sur le build Vite (`ADR-008`) ? | Suppression de l'inlining statique `define` et suppression du blocage au build si `.env` est absent. |
| 9 | Comment le problème de `LOGS_DISABLED` est-il réglé ? | L'environnement est chargé et injecté au tout début de `main()`, avant le logger, rendant `LOGS_DISABLED=true` opérationnel. |

---

## 3. Impact — Cahier des charges (**CDC v2.2**)

| Exigence | Impact | Action (CDC v2.2) |
|---|---|---|
| **REQ-031** / **REQ-112** / **REQ-013** / **R-40** (Binaires CLI d'agents obligatoires) | **Modifiée** | L'exigence de présence de **`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`** et **`CODEX_CLI_BIN`** n'est plus contrôlée au build, mais **exclusivement au runtime** lors du démarrage de ClientsBox (serveur ou `--exec-scene`). Les 3 sont obligatoires. |
| **REQ-003** / **REQ-108** (Livrable standalone) | **Renforcée** | Le fichier unique `dist/clientsbox.js` devient véritablement portable : il s'exécute sur n'importe quel environnement sans nécessiter de rebuild. |
| **REQ-046** *(nouvelle)* | **Ajoutée** | **Chargement dynamique d'environnement** : Support du chargement runtime depuis `env/.env` (tolérant à l'absence) ou via `-e` / `--env <path>` (strict, erreur fatale si absent). |
| **R-50** *(nouvelle)* | **Ajoutée** | **Règle de validation et d'initialisation de configuration** : Arrêt fatal si variable ou binaire obligatoire manquant ou fichier explicite introuvable ; assignation systématique des valeurs par défaut aux variables optionnelles. |

---

## 4. Impact — Spécifications Fonctionnelles

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| **`SPEC-SRV-01`** (Démarrage CLI & configuration) | **Modifiée** | - Déploiement de la configuration via `ConfigService.deploy()`.<br/>- Extension de la CLI avec options d'environnement `-e <path>`, `--env <path>`, `--env=<path>` avec rejet si argument vide (`AC-SRV-01-8`).<br/>- Résolution runtime de l'environnement (`AC-SRV-01-9`) : chargement de `env/.env` (si présent), rejet fatal si `envFile` spécifié inexistant, validation stricte de l'existence et exécutabilité des 3 binaires CLI d'agents (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) et affectation des valeurs par défaut. |
| **`SPEC-ARCH-01`** (Graphe DAG & étanchéité) | **Modifiée** | Définition des règles d'import de la couche `src/config/` : n'importe que des types purs (`import type`) de `lib/` et `types/`, tout d'`utils/` (valeurs et types), et est importée exclusivement par `ConfigService` (`src/services/config/`). Import direct strictement interdit pour `domain/`, `index.ts`, `controllers/`, `lib/` et `ui/`. |
| **`SPEC-ARCH-03`** (Isolation des accès système) | **Maintenue** | Seul le sous-système `src/lib/process/env/` (`env.engine.ts`, `env.layout.ts`) a le droit d'accéder à `process.env` et `process.cwd()`. Aucun accès direct hors de `lib/process/env/`. |
| **`SPEC-SRV-02`**, **`SPEC-ENG-*`**, **`SPEC-UI-*`** | **Inchangées** | Les couches supérieures continuent de consommer les données résolues sans connaissance du mécanisme de stockage d'environnement. |

---

## 5. Impact — Conception & Architecture

| Artefact | Impact | Ce qui change |
|---|---|---|
| **`ADR-022`** *(nouveau)* | **Créé** | Formalisation de la décision d'architecture du chargement dynamique d'environnement au runtime, abrogeant la section injection statique de l'[`ADR-008`](../adr/ADR-008-pipeline-de-build-vite-et-injection-env.md), et consignant le découplage des moteurs (`args-parser`, `env`), des schémas (`src/config/`) et du service (`src/services/config/`). |
| **`ADR-008`** | **Amendé** | Conserve les décisions de bundling (Vite SSR, `dist/clientsbox.js`, ESM, minification), mais délègue la gestion d'environnement au runtime selon l'ADR-022. |
| **`src/types/contracts/`** | **Créé** | Déclaration des contrats d'interface déclaratifs purs (`cli-parser.contract.ts` TYPES-014, `env-schema.contract.ts` TYPES-015). |
| **`src/lib/process/args-parser/`** | **Créé** | Moteur générique pur de parsing de flags CLI (`args-parser.engine.ts`, `args-parser.types.ts`). |
| **`src/lib/process/env/`** | **Créé** | Moteur générique de validation et d'injection d'environnement (`env.engine.ts`, `env.validators.ts`, `env.layout.ts`, `env.types.ts`). |
| **`src/config/`** | **Créé** | Déclaration des schémas (`cli-flags.config.ts`, `env.config.ts`) et constantes (`constants.config.ts`). N'importe que des types purs de `types/` et tout d'`utils/`. Zéro import de `lib/`. Importé exclusivement par `ConfigService`. |
| **`src/services/config/`** | **Créé** | Orchestrateur applicatif `ConfigService` (`config.service.ts`, `config.types.ts`) fournissant l'objet typé immuable `AppConfig`. |
| **`src/lib/process/cli-args.parser.ts` & `env-layout.resolver.ts`** | **Supprimés** | Fichiers monolithiques obsolètes remplacés par les moteurs modulaires ci-dessus. |
| **`src/index.ts`** (Composition Root) | **Modifié** | Appel de `new ConfigService().deploy(process.argv.slice(2))` en toute première instruction de démarrage. |
| **`vite.config.ts`** | **Modifié** | Suppression de la substitution `define` pour `process.env.*` et suppression du blocage au build si variables manquantes dans `.env`. |

---

## 6. Impact — Tests

| Cas de test | Impact | Description |
|---|---|---|
| **`CASE-SRV-01-8`** *(nouveau)* | **À écrire** | Validation du parsing CLI des options `-e <path>`, `--env <path>`, `--env=<path>` et gestion des syntaxes invalides via le moteur `args-parser.engine.ts`. |
| **`CASE-SRV-01-9`** *(nouveau)* | **À écrire** | Validation du chargement d'environnement :<br/>1. Échec fatal si fichier spécifié `-e` inexistant.<br/>2. Succès si fichier `-e` valide.<br/>3. Chargement transparent de `env/.env` si présent.<br/>4. Tolérance et absence d'erreur si `env/.env` absent.<br/>5. Échec fatal si l'un des 3 binaires CLI d'agents obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) est manquant, vide ou non exécutable.<br/>6. Application des valeurs par défaut pour les options non fournies. |
| **`CASE-ARCH-01-1`** | **À mettre à jour** | Audit d'architecture du graphe DAG intégrant `src/config/` (n'importe que des types purs et consommé exclusivement par `src/services/config/`). |
| **`CASE-ARCH-03-5`** | **À mettre à jour** | Audit d'architecture confirmant que le monopole d'accès à `process.env` et `process.cwd()` est strictement dévolu à `src/lib/process/env/env.engine.ts` et `src/lib/process/env/env.layout.ts`. |
| Tests existants (`tests/units/`) | **Maintenus** | Les tests Vitest continuent de s'exécuter en isolant `process.env` et en adaptant leurs imports vers les nouveaux modules. |

---

## 7. Impact — Code

| Composant | Statut | Responsabilité |
|---|---|---|
| `src/lib/process/args-parser/` | Créé | Moteur générique pur de parsing des options CLI (`args-parser.engine.ts`, `args-parser.types.ts`). |
| `src/lib/process/env/` | Créé | Moteur générique de validation et d'injection d'environnement (`env.engine.ts`, `env.validators.ts`, `env.layout.ts`, `env.types.ts`). Monopole d'accès système. |
| `src/config/` | Créé | Déclaration pure des schémas (`cli-flags.config.ts`, `env.config.ts`) et constantes (`constants.config.ts`). Consomme uniquement des types, importé exclusivement par `ConfigService`. |
| `src/services/config/` | Créé | Service orchestrateur `ConfigService` (`config.service.ts`, `config.types.ts`) fournissant la méthode `.deploy()` et retournant l'objet immuable `AppConfig`. |
| `src/lib/process/cli-args.parser.ts` & `env-layout.resolver.ts` | Supprimés | Fichiers monolithiques obsolètes retirés. |
| `src/index.ts` | Modifié | Chaînage au démarrage : `new ConfigService().deploy(process.argv.slice(2))` en toute première instruction de `main()`. |
| `vite.config.ts` | Modifié | Épuration de la clause `define` et des vérifications bloquantes au build. |

---

## 8. Effets de bord identifiés

1. **Ordre d'exécution dans `src/index.ts` :** L'appel à `configService.deploy()` doit impérativement précéder tout appel aux fonctions du logger pour que la désactivation `LOGS_DISABLED=true` soit prise en compte dès la première ligne de log.
2. **Priorité de résolution du Port HTTP (`PORT`) :**
   - Priorité 1 (maximale) : option CLI explicite `-p <port>` / `--port <port>`.
   - Priorité 2 : variable `PORT` issue du fichier d'environnement chargé ou de `process.env`.
   - Priorité 3 (repli) : constante nominale `DEFAULT_SERVER_PORT = 2974`.
3. **Validation obligatoire des 3 binaires CLI :** Les 3 binaires CLI (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`) doivent impérativement exister et être exécutables sur la machine hôte ou être fournis par des mocks sous `scripts/mock/` pour les environnements de test / CI.
4. **Conformité stricte au monopole d'accès (`CASE-ARCH-03-5`) :** Seuls `src/lib/process/env/env.engine.ts` et `src/lib/process/env/env.layout.ts` accèdent directement à `process.env` et `process.cwd()`.
5. **Chemins relatifs dans le fichier `.env` :** Si une variable comme `CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN` ou `CODEX_CLI_BIN` est spécifiée sous forme de chemin relatif dans `env/.env`, elle doit être résolue par rapport au répertoire de travail (`workspacePath`), évitant les erreurs de chemin selon l'endroit d'où la commande Node est lancée.
6. **CI/CD et Builds automatisés :** Le pipeline de build devient indépendant de la machine hôte : `npm run build` peut s'exécuter dans un environnement vierge sans `.env`.

---

## 9. Ce que nous ne ferons pas dans cette itération

- **Pas de cascade multi-niveaux :** Pas de chargement empilé de `.env.local`, `.env.development`, `.env.production`. Seul le fichier désigné (`envFile` explicite ou `env/.env` par défaut) est chargé.
- **Pas de rechargement à chaud :** Pas d'écouteur de fichier (`fs.watch`) sur `env/.env` pour recharger les variables sans redémarrer le serveur.
- **Pas de dépendance npm externe :** Utilisation exclusive des fonctionnalités natives de Node.js 24 (`node:util.parseEnv`, `node:fs`).

---

## 10. Ordre d'exécution retenu

| # | Étape | Responsable |
|---|---|---|
| 1 | Validation de l'analyse d'impact `impact-CR-011` | Autrement (`U`) / Antigravity |
| 2 | Rédaction de l'ADR [`ADR-022-chargement-dynamique-environnement.md`](../adr/ADR-022-chargement-dynamique-environnement.md) | Antigravity |
| 3 | Mise à jour de la spécification [`SPEC-SRV-01`](../../specs/server/SPEC-SRV-01.md) et des cas de test `CASE-SRV-01-8` / `CASE-SRV-01-9` | Antigravity |
| 4 | Écriture des tests unitaires au **ROUGE** (`tests/units/process/cli-args.parser.test.ts`, `tests/units/process/env-loader.service.test.ts`) | Antigravity |
| 5 | Implémentation du code au **VERT** (`cli-args.parser.ts`, `env-loader.service.ts`, `src/index.ts`) | Antigravity |
| 6 | Refactoring de `vite.config.ts` (retrait du define d'environnement) | Antigravity |
| 7 | Exécution complète de la suite d'assurance qualité (`npm test`, `npm run test:arch`, `npm run quality`, `npm run build`) | Antigravity |
