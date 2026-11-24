# Spécifications — Socle Applicatif & Serveur HTTP

**Domaine :** `SRV`  
**Document maître :** `tdd/specs/sommaire.md`  
**ADR d'ancrage :** [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md), [`ADR-012`](../docs/adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../docs/adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../docs/adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md), [`ADR-020`](../docs/adr/ADR-020-cli-exec-scene.md), [`ADR-022`](../docs/adr/ADR-022-chargement-dynamique-environnement.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.5.md` (CR-014 / CR-006 Conteneurisation Docker, CR-013 Claude CLI, CR-009, CR-010, CR-011, CR-012) ; bases archivées intactes  

---

## SPEC-SRV-01 — Démarrage CLI, configuration du port et résolution du workspace

**Exigences :** `REQ-001`, `REQ-002`, `REQ-003`, `REQ-005`, `REQ-006`, `REQ-031`, `REQ-044`, `REQ-046`, `REQ-047`, `REQ-049`, `R-35`, `R-40`, `R-48`, `R-50`, `R-51`, `R-53`, `C-01`, `C-02`, `C-04`, `C-07`, `C-16`, `C-17`, `C-18`, `REQ-102`, `REQ-108`, `REQ-112`, `REQ-113`, `REQ-114`, `REQ-115`  
**Statut :** proposé  
**Version :** v1.5 (2026-11-24, CR-014 / CR-006 — Conteneurisation Docker officielle, binding conteneurisé HOST=0.0.0.0 et 4 CLI)  

### Règle

> ClientsBox est développé en TypeScript et distribué comme livrable standalone JavaScript (`clientsbox.js`), exécutable via Node ≥ 24.
> **Initialisation dynamique de l'environnement et de la configuration (runtime) :** en toute première étape de démarrage (avant l'initialisation du logger ou des services applicatifs), ClientsBox déploie sa configuration via `ConfigService.deploy(process.argv.slice(2))` selon les spécifications déclaratives de `src/config/` (`ADR-022`, `R-50`, `REQ-046`) :
> - Par défaut, l'application recherche le fichier `env/.env` (relatif à `workspacePath`). Si ce fichier est absent, **ce n'est pas une erreur** : ClientsBox poursuit son exécution en exploitant directement `process.env`.
> - Si un fichier explicite est spécifié via `-e <chemin>` ou `--env <chemin>` (ou `--env=<chemin>`), il est chargé ; si ce fichier n'existe pas sur le disque, ClientsBox s'arrête **immédiatement avec une erreur fatale explicite en français** (`EnvLoadError`).
> - La présence et l'exécutabilité des **quatre binaires CLI d'agents** (**`CURSOR_CLI_BIN`**, **`ANTIGRAVITY_CLI_BIN`**, **`CODEX_CLI_BIN`**, **`CLAUDE_CLI_BIN`**) sont validées au runtime : l'absence, la valeur vide ou l'inexistence de l'un quelconque de ces exécutables provoque un arrêt fatal avec renvoi explicite vers `env/.env.example` (`REQ-031`, `REQ-112`).
> - Les valeurs par défaut sont systématiquement assignées aux variables optionnelles non renseignées (`PORT=2974`, `HOST=127.0.0.1`, `AGENTS_DIR=.agents`, `LOGS_DISABLED=false`, etc.). Dans l'environnement conteneurisé Docker officiel (`Dockerfile`), la variable `HOST=0.0.0.0` est nativement injectée afin d'écouter sur toutes les interfaces réseau du conteneur (`R-51`, `REQ-047`, `C-16`), tandis que `127.0.0.1` demeure la valeur par défaut en exécution locale hôte hors conteneur.
> - Le paramètre `LOGS_DISABLED=true` désactive immédiatement toute sortie de log de manière synchrone avant toute émission console.
>
> Au lancement en ligne de commande, le service initialise le workspace sur le répertoire courant (`cwd`).
> **Mode Serveur (défaut) :** en l'absence de l'option `--exec-scene`, ClientsBox lie l'écoute HTTP sur le port configuré (résolu par ordre de priorité : option CLI `-p` / `--port`, puis variable `PORT`, puis défaut `2974`), et s'interrompt immédiatement en erreur si le port est déjà occupé (`R-35`, `REQ-005`).
> **Mode Headless direct (`--exec-scene`) :** si l'option `--exec-scene <cible>` (ou `--exec-scene=<cible>`) est spécifiée, ClientsBox résout le scénario cible (par identifiant prioritaire `id`, puis par repli insensible à la casse sur `name`), et l'exécute directement en streaming console sans instancier de serveur HTTP ni lier de socket TCP (`REQ-044`, `R-48`, `ADR-020`). Le processus diffuse les sorties brutes et les marqueurs de cycle de vie (Option B) puis se termine avec le code système approprié (`0` en succès, `1` en échec ou scénario introuvable, `130` sur `SIGINT` après arrêt propre des sous-processus).

### Portée

- Couvre le parsing des arguments de la ligne de commande (`-p`, `--port`, `--exec-scene`, `-e`, `--env`) via le moteur `args-parser.engine.ts` et le schéma `CLIENTSBOX_CLI_SCHEMA`.
- Couvre la résolution dynamique et le chargement des fichiers d'environnement (`env/.env` par défaut ou fichier explicite `-e`) via `env.engine.ts`.
- Couvre la validation au runtime des 4 binaires CLI d'agents obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`) et l'assignation des valeurs par défaut pour les options.
- Couvre le déploiement et l'initialisation unifiée via `ConfigService.deploy()`.
- Couvre la résolution prioritaire du port HTTP (CLI `-p` > `PORT` dans env > 2974).
- Couvre la résolution obligatoire de `workspacePath` à partir de `process.cwd()`.
- Couvre la détection du conflit de port (erreur `EADDRINUSE`) en mode serveur avec arrêt immédiat et code de sortie non nul.
- Couvre l'exécution autonome headless en console en présence de `--exec-scene`, sans écoute HTTP.
- Couvre la résolution de scénario par `id` puis `name`.
- Couvre le streaming temps réel console des chunks et marqueurs de cycle de vie `[ClientsBox]`.
- Couvre la cascade d'arrêt propre des sous-processus sur interruption `SIGINT` (Ctrl+C).
- Couvre l'exécution sous Node ≥ 24 en mode standalone sans dépendances externes requises au runtime.
- Couvre la portabilité totale sous environnement conteneurisé Docker officiel (`Dockerfile`) avec écoute `HOST=0.0.0.0` sans modification du code applicatif sous `src/` (`REQ-113`, `REQ-047`).
- Ne couvre pas la distribution des fichiers statiques ni le service des routes API en mode headless → `SPEC-SRV-02` (mode serveur uniquement).
- Ne couvre pas la création ou la validation de l'arborescence `.agents/data/` → `SPEC-DATA-01`.

### Scénarios nominaux

```gherkin
Scénario : Démarrage avec le port par défaut
  Étant donné un terminal ouvert dans le dossier "/home/alex/mon-projet"
  Et le port 2974 est libre
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js"
  Alors le serveur démarre en écoute sur "http://localhost:2974"
  Et le chemin du workspace actif est "/home/alex/mon-projet"

Scénario : Surcharge du port via l'option courte -p
  Étant donné un terminal ouvert dans un projet hôte
  Et le port 8080 est libre
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js -p 8080"
  Alors le serveur démarre en écoute sur "http://localhost:8080"

Scénario : Surcharge du port via l'option longue --port
  Étant donné un terminal ouvert dans un projet hôte
  Et le port 3000 est libre
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js --port 3000"
  Alors le serveur démarre en écoute sur "http://localhost:3000"

Scénario : Chargement automatique de env/.env au démarrage
  Étant donné un projet hôte contenant un fichier "env/.env" définissant "PORT=4000"
  Et le port 4000 est libre
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js" sans option de port
  Alors le fichier "env/.env" est chargé automatiquement
  Et le serveur démarre en écoute sur "http://localhost:4000"

Scénario : Priorité de l'option CLI -p sur la variable PORT du fichier env
  Étant donné un projet hôte avec un fichier "env/.env" définissant "PORT=4000"
  Et le port 5000 est libre
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js -p 5000"
  Alors le serveur démarre en écoute sur "http://localhost:5000"

Scénario : Chargement d'un fichier d'environnement explicite via -e
  Étant donné un fichier personnalisé "custom.env" définissant "LOGS_DISABLED=true"
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js -e custom.env"
  Alors les variables de "custom.env" sont injectées dans l'environnement
  Et les logs console sont totalement désactivés

Scénario : Tolérance et résilience si env/.env est absent
  Étant donné un projet hôte sans dossier "env/" ni fichier "env/.env"
  Et les variables CURSOR_CLI_BIN, ANTIGRAVITY_CLI_BIN, CODEX_CLI_BIN et CLAUDE_CLI_BIN sont définies dans l'environnement du shell
  Quand l'utilisateur lance la commande "node .agents/clientsbox.js"
  Alors aucune erreur de fichier manquant n'est levée
  Et le serveur démarre normalement en écoute sur le port 2974

Scénario : Exécution headless d'un scénario via --exec-scene par id
  Étant donné un terminal ouvert dans un workspace contenant le scénario "test-step1-dialogue"
  Quand l'utilisateur lance la commande "node clientsbox.js --exec-scene test-step1-dialogue"
  Alors aucun serveur HTTP n'est démarré
  Et le scénario est exécuté avec affichage des chunks et marqueurs textuels ClientsBox dans le terminal
  Et le processus se termine avec le code de sortie 0 à l'achèvement avec succès

Scénario : Exécution headless d'un scénario via --exec-scene par nom de scénario
  Étant donné un terminal ouvert dans un workspace contenant un scénario nommé "Test Step 1 — Dialogue Multi-Agents"
  Quand l'utilisateur lance la commande "node clientsbox.js --exec-scene 'Test Step 1 — Dialogue Multi-Agents'"
  Alors le scénario correspondant est identifié et exécuté en direct dans le terminal
  Et le processus se termine avec le code de sortie 0
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Port déjà occupé par un autre processus (`EADDRINUSE`) en mode serveur | Arrêt immédiat du processus avec code de sortie > 0, message explicite sur `stderr` indiquant le port en conflit, sans tenter d'autre port (`R-35`). |
| 2 | Valeur de port non numérique (ex. `--port abc`) | Refus immédiat au démarrage, affichage d'un message d'erreur d'usage sur `stderr`, arrêt avec code exit > 0. |
| 3 | Port hors plage valide (ex. `-p 0` ou `-p 70000`) | Refus immédiat, message indiquant que le port doit être compris entre 1 et 65535, arrêt avec code exit > 0. |
| 4 | Lancement depuis un répertoire imbriqué ou sans `.agents/` | `workspacePath` est strictement positionné sur le `cwd` de la commande de lancement (`C-07`). |
| 5 | Option `--exec-scene` ciblant un scénario inexistant | Arrêt immédiat avec code de sortie 1 et affichage sur `stderr` d'un message explicatif en français signalant que le scénario est introuvable (`R-48`, `REQ-044`). |
| 6 | Option `--exec-scene` sans valeur fournie (ex. `node clientsbox.js --exec-scene`) | Refus immédiat avec message d'usage sur `stderr` et code de sortie 1. |
| 7 | Échec d'un bloc en cours d'exécution headless (statut `error`) | Interruption du scénario, notification sur `stderr`, et sortie du processus avec le code 1 (`R-25`, `R-48`). |
| 8 | Interruption manuelle (`Ctrl+C` / `SIGINT`) en cours d'exécution headless | Arrêt propre d'urgence déclenché sur le runner (`runner.stop()`), escalade SIGTERM/SIGKILL sur les sous-processus actifs, message d'interruption et sortie avec code 130 (`R-48`). |
| 9 | Fichier d'environnement explicite `-e` / `--env` introuvable sur le disque | Arrêt fatal immédiat avec message explicite en français signalant que le fichier spécifié n'existe pas (`EnvLoadError`, code exit > 0) (`R-50`, `REQ-046`). |
| 10 | Option `-e` ou `--env` sans argument de chemin (ex. `node clientsbox.js -e`) | Rejet immédiat avec message d'usage `ServerCliParseError` sur `stderr` et code de sortie 1 (`REQ-046`). |
| 11 | L'un des quatre binaires obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`) manquant, vide ou non exécutable au runtime | Arrêt fatal au démarrage avec message explicite en français précisant la clé manquante/invalide et invitant à consulter `env/.env.example` (`REQ-031`, `REQ-112`). |

### Ce qui n'est pas défini

- *2026-11-16* — Paramètres dynamiques injectés au sac d'entrées initial en CLI : différés (le sac d'entrées initial reste vide en V1 per CDC v2.1).
- *2026-11-17* — Rechargement à chaud (hot reload) des variables d'environnement sans redémarrage : non requis, un redémarrage du processus est la norme.

### Critères d'acceptation

- [ ] `AC-SRV-01-1` — Le serveur démarre sur le port `2974` en l'absence d'argument de port (`CASE-SRV-01-1`).
- [ ] `AC-SRV-01-2` — Le port est modifiable via `-p <n>` et `--port <n>` (`CASE-SRV-01-2`).
- [ ] `AC-SRV-01-3` — Le démarrage échoue avec un code d'erreur non nul si le port est occupé ou invalide (`CASE-SRV-01-3`).
- [ ] `AC-SRV-01-4` — Le chemin `workspacePath` correspond exactement au `process.cwd()` à l'initialisation (`CASE-SRV-01-4`).
- [ ] `AC-SRV-01-5` — L'argument `--exec-scene <cible>` ou `--exec-scene=<cible>` est correctement parsé sans déclencher d'erreur de port (`CASE-SRV-01-5`, `REQ-044`).
- [ ] `AC-SRV-01-6` — En présence de `--exec-scene`, le scénario est résolu (par id puis par nom) et exécuté en streaming console direct sans démarrer de serveur HTTP, avec code de sortie 0 en succès (`CASE-SRV-01-6`, `REQ-044`, `R-48`).
- [ ] `AC-SRV-01-7` — En mode `--exec-scene`, le processus quitte avec code 1 si le scénario est introuvable ou si un bloc échoue, et avec code 130 sur SIGINT après arrêt coordonné des processus fils (`CASE-SRV-01-7`, `REQ-044`, `R-48`).
- [ ] `AC-SRV-01-8` — Les options `-e <path>`, `--env <path>`, `--env=<path>` sont correctement parsées dans `parseServerCliArgs` et les erreurs de syntaxe (argument manquant) sont rejetées avec `ServerCliParseError` (`CASE-SRV-01-8`, `REQ-046`).
- [ ] `AC-SRV-01-9` — Résolution runtime de l'environnement et déploiement via `ConfigService` : chargement de `env/.env` (si présent), repli transparent sans erreur si absent, rejet fatal (`EnvLoadError`) si le fichier explicite `-e` est inexistant, validation stricte de la présence et de l'exécutabilité des 4 binaires d'agents obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`) et application systématique des valeurs par défaut (`CASE-SRV-01-9`, `REQ-046`, `R-50`, `ADR-022`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la stricte conformité de R-35 (aucun fallback de port auto) | Acceptée | Conforme au CDC §9 REQ-005 et ADR-001. |
| Isolation des tests de `workspacePath` (`AC-SRV-01-4`) | Précisée | Privilégier l'injection de dépendance (`workspacePath`) ou isoler `process.chdir()` dans un bloc `afterEach`/`finally` strict avec sandbox temporaire (ADR-006). |

---

## SPEC-SRV-02 — Serveur HTTP local, exposition de l'API et affichage console

**Exigences :** `REQ-003`, `REQ-004`, `REQ-040`, `REQ-047`, `REQ-048`, `REQ-049`, `R-51`, `R-52`, `R-53`, `C-05`, `C-11`, `C-16`, `C-18`, `REQ-106`, `REQ-109`, `REQ-114`  
**Statut :** proposé  
**Version :** v1.8 (2026-11-24, CR-014 — Déploiement conteneurisé Docker, exposition locale sécurisée 127.0.0.1:2974:2974 et relais des signaux via --init)  

### Règle

> Le serveur HTTP local distribue les fichiers statiques de l'interface utilisateur web et fournit les points d'entrée d'API pour le fonctionnement de l'application.
> L'ensemble des assets statiques (HTML, CSS, JS) est compilé en mémoire dans le livrable depuis `src/ui/` (Preact et Tailwind CSS per ADR-013 et ADR-015) et distribué exclusivement depuis la mémoire sans lecture sur disque ni variable `PUBLIC_DIR` (ADR-012).
> Dès que l'écoute est effective, l'URL d'accès est imprimée dans la console du terminal OS (sans déclencher d'ouverture automatique du navigateur).
> L'application s'exécute en local mono-utilisateur, sans couche d'authentification ni sandbox.
> **Exposition réseau conteneurisée :** en environnement conteneurisé Docker (Mode 1 Compose per ADR-022 et CDC v2.5), l'exposition sur l'hôte est strictement restreinte à `127.0.0.1:2974:2974` pour garantir l'absence d'exposition non sollicitée sur le réseau local (`C-11`, `C-16`, `REQ-114`). En mode headless (`--exec-scene`), aucun mappage de port réseau n'est instancié. L'utilisation du drapeau `--init` (Tini) en conteneur est obligatoire afin de garantir la cascade propre des signaux POSIX (`SIGINT`, Ctrl+C) et le code de sortie 130 per `AC-SRV-02-3` et `AC-SRV-02-5` (`R-53`, `REQ-049`, `C-18`).
> Le serveur expose également les routes de documentation utilisateur (`GET /api/docs`, `POST /api/docs/export`) : la source lue/exportée est le contenu **embarqué** (pas un dossier `public/` disque) ; l'export matérialise le miroir sous `.agents/docs/` (`ADR-017`, `SPEC-DATA-05`).
> **Exécution / mono-run :** au plus un run HTTP racine à la fois (`activeRunner`). Un `POST /api/scenarios/:id/run` alors qu'un run est déjà actif répond **409**. Pendant un CallScenario, `activeScenarioId` reste l'id du scénario **racine** ; la sous-exécution est in-process et **ne** passe **pas** par un second `POST /run` (`REQ-040`, ADR-018). `GET /api/scenarios/:id/run` et le SSE `:id/stream` d'un id **différent** de la racine active ne publient **pas** l'état du sous-run nested.

### Portée

- Couvre le service des ressources statiques (HTML, CSS, JS bundles) de l'UI web compilées en mémoire dans le livrable (ADR-012, ADR-013).
- Couvre la communication HTTP/API locale entre le frontend et le backend serveur.
- Couvre l'affichage obligatoire du lien cliquable dans la console du terminal OS au démarrage (`REQ-004`).
- Couvre l'arrêt gracieux du serveur HTTP lors de la réception des signaux d'interruption (`SIGINT`, `SIGTERM`).
- Couvre le principe mono-utilisateur local sans authentification (`C-11`, `REQ-106`).
- Couvre les endpoints de consultation et d'export de la documentation utilisateur (`ADR-017`).
- Couvre l'identité du run HTTP racine pendant CallScenario (sans détailler le moteur de blocs).
- Ne couvre pas la logique métier des CRUD ressources → `SPEC-DATA-01` à `SPEC-DATA-04`.
- Ne couvre pas le contrat disque détaillé de `.agents/docs/` → `SPEC-DATA-05`.
- Ne couvre pas l'exécution des scénarios ni les blocs → `SPEC-ENG-01` à `SPEC-ENG-04`.
- Ne couvre pas l'affichage graphique du Canvas, du terminal ni de la page Instructions → `SPEC-UI-01` à `SPEC-UI-04`.

### Scénarios nominaux

```gherkin
Scénario : Affichage du lien dans le terminal OS au démarrage
  Étant donné le serveur démarré avec succès sur le port 2974
  Quand l'écoute réseau est active
  Alors le terminal OS affiche le message "ClientsBox disponible sur http://localhost:2974"
  Et aucun navigateur web n'est ouvert automatiquement par le processus

Scénario : Distribution de l'interface utilisateur web
  Étant donné le serveur HTTP en écoute sur le port 2974
  Quand un client HTTP effectue une requête GET sur "/"
  Alors le serveur répond avec un code HTTP 200 et le document HTML principal de l'UI

Scénario : Arrêt gracieux du serveur HTTP (SIGINT / SIGTERM)
  Étant donné le serveur en cours d'exécution
  Quand l'utilisateur émet un signal d'arrêt (SIGINT / Ctrl+C ou SIGTERM)
  Alors le serveur ferme l'écoute réseau, libère le port et termine le processus avec le code 0

Scénario : Cascade d'arrêt OS vers sous-processus CLI actifs
  Étant donné le serveur en cours d'exécution
  Et un scénario en cours avec un sous-processus CLI enfant actif
  Quand le processus reçoit le signal "SIGINT" (ou "SIGTERM")
  Alors le serveur ferme l'écoute HTTP et libère le port
  Et le sous-processus CLI enfant est interrompu (SIGTERM puis SIGKILL si nécessaire per SPEC-ADPT-03)
  Et le processus Node se termine avec le code de sortie 0

Scénario : Consultation de la documentation embarquée
  Étant donné le serveur HTTP en écoute
  Quand un client effectue GET "/api/docs"
  Alors le serveur répond 200 avec la liste ou le contenu des documents embarqués
  Et aucune lecture d'un dossier public/ disque n'est réalisée

Scénario : Export de la documentation vers .agents/docs/
  Étant donné le serveur HTTP en écoute
  Quand un client effectue POST "/api/docs/export"
  Alors le serveur répond 200 avec un corps indiquant le succès et le chemin cible
  Et le miroir Markdown est écrit sous ".agents/docs/" (ou AGENTS_DIR/docs)

Scénario : Identité du run racine pendant CallScenario
  Étant donné un scénario parent en cours via POST "/api/scenarios/parent/run"
  Et un bloc CallScenario exécutant le scénario "enfant" in-process
  Quand un client interroge GET "/api/scenarios/parent/run"
  Alors activeScenarioId vaut "parent" et busy est vrai
  Quand un client interroge GET "/api/scenarios/enfant/run"
  Alors l'état du sous-run nested n'est pas publié comme run actif de "enfant"
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Requête sur une route ou un fichier statique inexistant | Réponse HTTP 404 standard avec message d'erreur clair sans crash du serveur. |
| 2 | Fermeture brutale du client navigateur pendant un flux | Le serveur intercepte la déconnexion socket sans interrompre son propre processus HTTP. |
| 3 | Réception d'un signal `SIGINT` ou `SIGTERM` pendant une tâche active | Fermeture ordonnée du serveur HTTP et transmission des signaux d'arrêt aux sous-processus actifs (`SPEC-ADPT-03`). |
| 4 | Tentative d'accès depuis une autre machine sur le réseau | Fonctionnement local par défaut (écoute `localhost` / `127.0.0.1`). |
| 5 | Échec I/O lors de `POST /api/docs/export` | Réponse d'erreur HTTP avec message en français ; pas de crash processus. |
| 6 | `POST /api/scenarios/:id/run` alors qu'un run racine est déjà actif | Réponse HTTP **409** ; le CallScenario nested ne contourne pas cette règle via un second POST. |

### Ce qui n'est pas défini

- *2026-09-22* — Protocole temps réel spécifique (SSE vs WebSocket vs HTTP chunked stream) : le choix d'implémentation est laissé libre au code tant que le flux streaming est assuré vers l'UI.

### Critères d'acceptation

- [ ] `AC-SRV-02-1` — Le serveur sert les fichiers statiques de l'UI sur la racine web (`CASE-SRV-02-1`).
- [ ] `AC-SRV-02-2` — L'URL d'accès est imprimée dans la console sans ouverture automatique de navigateur (`CASE-SRV-02-2`).
- [ ] `AC-SRV-02-3` — Le serveur s'arrête proprement sur réception de `SIGINT` / `SIGTERM` en libérant le port (`CASE-SRV-02-3`).
- [ ] `AC-SRV-02-4` — Aucune authentification ni sandbox n'entrave l'accès local (`CASE-SRV-02-4`).
- [ ] `AC-SRV-02-5` — Sur `SIGINT` / `SIGTERM` pendant une exécution active, le serveur libère le port HTTP **et** transmet l'arrêt aux sous-processus CLI via le runner (`CASE-SRV-02-5`, cas limite #3 L131, `SPEC-ADPT-03`).
- [ ] `AC-SRV-02-9` — Validation E2E dans un navigateur réel de la résolution du répertoire de données via la variable `AGENTS_DIR` (par défaut `.agents` ou chemin personnalisé) (`CASE-SRV-02-10`, `ADR-011`).
- [ ] `AC-SRV-02-10` — `GET /api/docs` expose la documentation utilisateur embarquée sans lecture d'un dossier `public/` (`CASE-SRV-02-17`, `ADR-017`).
- [ ] `AC-SRV-02-11` — `POST /api/docs/export` matérialise le miroir sous `.agents/docs/` et renvoie un succès avec chemin cible, ou une erreur en français (`CASE-SRV-02-18`, `ADR-017`).
- [ ] `AC-SRV-02-12` — Pendant un CallScenario, `activeScenarioId` reste le scénario racine ; `GET /run` / SSE de l'enfant ne publient pas le sous-run ; un second `POST /run` répond 409 (`CASE-SRV-02-19`, `REQ-040`, ADR-018).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Ne pas figer arbitrairement REST/SSE/WS comme imposé par le CDC (POINT-003) | Acceptée | Règle formulée de manière neutre et respectueuse du CDC et de l'ADR-001. |
| Ajouter routes docs sans réintroduire public/ | Acceptée | Aligné ADR-012 / ADR-017. |
| Mono-run HTTP + nested CallScenario | Acceptée | 2026-11-13 — CR-008 / ADR-018 : sous-runner in-process, pas de second POST /run. |
