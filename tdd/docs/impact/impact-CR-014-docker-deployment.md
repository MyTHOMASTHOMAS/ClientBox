# Analyse d'impact — CR-014 (Conteneurisation Docker officielle de ClientsBox)

**Demande du client :** Formaliser et intégrer une configuration Docker officielle pour ClientsBox reposant sur une image `node:24-slim`, l'installation automatisée des 4 CLI obligatoires via leurs installateurs curl officiels sous `/usr/local/bin/`, une gestion centralisée de l'authentification via un volume nommé partagé `clientsbox-cli-auth` sur `/root`, le support de deux modes de déploiement (Mode 1 projet Compose / Mode 2 global wrapper CLI `$WS:$WS`), l'exécution non interactive (`--exec-scene`) avec `--init` sans conflit de port, et la personnalisation via images dérivées.  
**Entretien source :** [`tdd/docs/cr/CR-006.md`](../cr/CR-006.md) (Questions `CR-06/Q01` à `CR-06/Q11`)  
**Reçue le :** 23/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `feat/docker-deployment`  

---

> **Règle fondamentale TDD / Traçabilité :**  
> Aucune modification des artefacts d'infrastructure ou de documentation avant la validation formelle de l'impact et la mise à jour de la chaîne descendante :  
> **CR (`CR-006`) $\rightarrow$ Analyse d'impact (`impact-CR-014`) $\rightarrow$ CDC (v2.5) $\rightarrow$ Spécifications / ADR $\rightarrow$ Fichiers Docker & Scripts $\rightarrow$ Documentation $\rightarrow$ Validation CI.**

---

## 1. Ce que le client demande, reformulé

ClientsBox est actuellement distribué sous forme de livrable universel compilé (`dist/clientsbox.js`), exécuté directement sur l'environnement Node.js hôte (`ADR-022`).  
Le client demande de formaliser et livrer une **solution de déploiement conteneurisée officielle sous Docker**, permettant aux développeurs et équipes d'exécuter ClientsBox de manière reproductible, isolée et sans friction d'authentification :

1. **Une image Docker de base reproductible et outillée (`Dockerfile`) :**
   - Socle `node:24-slim` complété par les outils système nécessaires aux workflows et aux blocs `Command` (`git`, `curl`, `jq`, `ca-certificates`, `openssh-client`).
   - Correction globale du contrôle de sécurité Git sur volumes montés : `git config --system --add safe.directory '*'`.
   - Variables d'environnement standardisées : `HOST=0.0.0.0` (contournant le loopback `127.0.0.1` pour exposer l'UI sur l'hôte), `PORT=2974`, `AGENTS_DIR=.agents`.
   - Installation automatisée des **4 binaires obligatoires au démarrage** via leurs installateurs officiels en ligne :
     - Cursor CLI : `curl https://cursor.com/install -fsS | bash`
     - Claude CLI : `curl -fsSL https://claude.ai/install.sh | bash`
     - Antigravity CLI : `curl -fsSL https://antigravity.google/cli/install.sh | bash`
     - Codex CLI : `curl -fsSL https://chatgpt.com/codex/install.sh | sh`
   - Emplacement des exécutables garantis dans `/usr/local/bin/` (`cursor-agent`, `claude`, `agy`, `codex`) via variables `ENV` (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`), empêchant tout masquage lors du montage du volume d'authentification sur `/root`.
   - Point d'entrée direct sur le livrable universel : `WORKDIR /workspace` et `ENTRYPOINT ["node", "/opt/clientsbox/clientsbox.js"]`.
2. **Une authentification partagée pérenne (Zéro reconnexion) :**
   - Création d'un volume Docker nommé persistant `clientsbox-cli-auth` monté sur `/root` (`$HOME`).
   - Procédure de connexion unique : conteneur temporaire interactif pour authentifier les 4 CLI une fois pour toutes, puis réutilisation transparente pour tous les projets.
3. **Deux modes de déploiement standardisés :**
   - **Mode 1 — Projet (`docker-compose.yml`) :** situé à la racine du projet, dédié aux équipes partageant un dépôt Git. Monte la racine du projet sur `/workspace`, versionne le dossier `.agents/`, et lie le volume d'authentification externe.
   - **Mode 2 — Global (Script wrapper CLI `--rm`) :** lance un conteneur éphémère isolant chaque run, montant dynamiquement le projet sous son chemin hôte réel (`-v "$WS:$WS" -w "$WS"`) pour préserver l'exactitude des chemins absolus manipulés par les modèles LLM.
4. **Le support complet du mode non interactif (`--exec-scene`) :**
   - Exécution headless sans serveur HTTP, avec conservation fidèle des codes de sortie (`0` succès, `1` échec, `130` arrêt utilisateur `Ctrl+C`).
   - Activation systématique de `--init` (Tini) pour relayer les signaux d'interruption `SIGINT`/`SIGTERM` vers les sous-processus enfants.
   - Absence de publication de port `-p 2974:2974` en mode `--exec-scene` pour éviter les collisions et permettre l'exécution concurrente de multiples scénarios.
5. **L'extensibilité, la gestion des tests rapides et la portabilité des environnements :**
   - **Image dérivée recommandée (`FROM clientsbox:latest`) :** via un `Dockerfile.clientsbox` spécifique au projet pour les dépendances durables (Python, PHP, Make...).
   - **Usage exploratoire ponctuel :** tolérance documentée pour les tests rapides sans `Dockerfile` via un conteneur persistant sans `--rm` (`docker exec`), classé hors standard pour la production ou le travail d'équipe.
   - **Identité Git et clés SSH :** recommandations de montage en lecture seule (`:ro`) pour `~/.gitconfig` et `~/.ssh`.
   - **Normalisation des fins de ligne sous Windows :** imposition des fins de ligne LF dans `.gitattributes` (`*.sh text eol=lf`) pour éviter les erreurs d'exécution de scripts shell dans le conteneur Linux.

---

## 2. Questions posées au client et arbitrages (Alignement 1:1 avec CR-006)

| ID | Question posée au client | Réponse et arbitrage acté |
|---|---|---|
| **CR-06/Q01** | Quelle image de base Docker et environnement d'exécution retenir ? | **`node:24-slim`** (Debian Bookworm) pour sa légèreté, avec Node.js 24 et l'installation des dépendances système indispensables (`git`, `curl`, `jq`, `ca-certificates`, `openssh-client`). |
| **CR-06/Q02** | Quels sont les binaires CLI obligatoires à embarquer et comment les installer dans l'image ? | Conformément au CDC v2.4 et `SPEC-SRV-01`, il y a **4 binaires obligatoires** installés via leurs commandes curl officielles :<br>• Cursor CLI : `curl https://cursor.com/install -fsS \| bash`<br>• Claude CLI : `curl -fsSL https://claude.ai/install.sh \| bash`<br>• Antigravity CLI : `curl -fsSL https://antigravity.google/cli/install.sh \| bash`<br>• Codex CLI : `curl -fsSL https://chatgpt.com/codex/install.sh \| sh`<br>Exécutables garantis sous `/usr/local/bin/` et déclarés via `ENV` (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`), empêchant tout masquage lors du montage de `/root`. |
| **CR-06/Q03** | Comment garantir l'accessibilité de l'UI web depuis l'hôte tout en préservant la sécurité locale ? | En forçant **`ENV HOST=0.0.0.0`** dans le `Dockerfile`. ClientsBox écoute par défaut sur le loopback strict `127.0.0.1` (`SPEC-SRV-02` / `C-11`) ; le forçage à `0.0.0.0` dans le conteneur permet au mapping de port **`127.0.0.1:2974:2974`** sur l'hôte d'acheminer le trafic web sans exposer le port publiquement sur le réseau local. |
| **CR-06/Q04** | Comment pérenniser l'authentification des CLI sans reconnexion à chaque changement de projet ? | Par un **volume Docker nommé partagé** (`clientsbox-cli-auth`) monté sur `/root` (`$HOME`). Les identifiants, tokens et configurations déposés par les commandes d'authentification des 4 CLI lors d'une session initiale (`docker run --rm -it ...`) sont ainsi conservés et partagés de manière transparente avec tous les conteneurs ClientsBox. |
| **CR-06/Q05** | Quels sont les deux modes de déploiement normalisés prévus pour les utilisateurs ? | Deux modes officiels :<br>1. **Mode 1 (Projet / `docker-compose.yml`)** : dédié au travail en équipe sur un dépôt Git avec montage de `/workspace`, dossier `.agents/` partagé et volume `clientsbox-cli-auth` externe.<br>2. **Mode 2 (Global / Script wrapper `--rm`)** : conteneur éphémère isolant chaque run, montant le workspace avec préservation des chemins hôtes réels (`-v "$WS:$WS" -w "$WS"`). |
| **CR-06/Q06** | Comment exécuter des scénarios en mode non interactif / CI (`--exec-scene`) avec gestion propre des signaux ? | Par passage direct de l'argument `--exec-scene <id|nom>` au conteneur. L'option Docker **`--init`** (ou `init: true` en Compose) est obligatoire pour que le gestionnaire d'init Tini répercute les signaux `SIGINT`/`SIGTERM` vers les sous-processus et renvoie fidèlement les codes de sortie de ClientsBox (`0` succès, `1` échec, `130` arrêt utilisateur `Ctrl+C`). |
| **CR-06/Q07** | Pourquoi omettre l'exposition de port en mode `--exec-scene` ? | Aucun port `-p 2974:2974` n'est publié en mode `--exec-scene` afin d'éviter tout conflit de port si l'UI web tourne déjà sur la machine hôte et d'autoriser l'exécution concurrente de multiples scénarios en parallèle. |
| **CR-06/Q08** | Comment éviter l'erreur Git fatale `dubious ownership` lors du montage de volumes hôtes ? | Par l'ajout de l'instruction globale **`git config --system --add safe.directory '*'`** dès le build de l'image de base. |
| **CR-06/Q09** | Comment gérer l'identité des commits Git, l'accès SSH et la portabilité des scripts ? | Par le montage en lecture seule (`:ro`) des fichiers de configuration hôte : `~/.gitconfig` et `~/.ssh`. Pour les postes Windows, imposer la normalisation des fins de ligne LF dans `.gitattributes` (`*.sh text eol=lf`) pour éviter les erreurs `\r: command not found` dans le conteneur Linux. |
| **CR-06/Q10** | Comment supporter des outils personnalisés (Python, PHP, Make...) et quel statut accorder au « conteneur persistant » ? | **Image dérivée recommandée (`FROM clientsbox:latest`)** via un `Dockerfile.clientsbox` spécifique au projet (pérenne et partageable en Git). L'option alternative d'un « conteneur persistant » sans `--rm` via `docker exec` est tolérée pour des tests exploratoires ponctuels, mais formellement déconseillée en équipe (non partageable, volumes figés, perte des modifications lors des montées de version). |
| **CR-06/Q11** | Quelle est la trajectoire méthodologique documentaire et technique ? | Enregistrement de **`CR-006`** $\rightarrow$ Analyse d'impact **`impact-CR-014-docker-deployment.md`** $\rightarrow$ Cahier des Charges **CDC v2.5** (nouveau chapitre déploiement conteneurisé) $\rightarrow$ Création des artefacts (`Dockerfile`, `docker-compose.yml`, `scripts/docker/`, `docs/deploy/docker.md`) $\rightarrow$ Validation `npm run ci`. |

---

## 3. Impact — Cahier des charges (CDC v2.5 — [`cahier-des-charges-v2.5.md`](../cdc/cahier-des-charges-v2.5.md))

L'évolution donne lieu à la publication du **Cahier des Charges v2.5** (succédant à la v2.4 archivée intacte) :

| Exigence / Section | Statut | Impact & Justification |
|---|---|---|
| `REQ-002` (Serveur HTTP local) | **Conforme** | Fonctionnement nominal conservé sur le port 2974, avec écoute conteneurisée sur `0.0.0.0`. |
| `REQ-031` / `REQ-112` (Binaires obligatoires) | **Conforme** | Les 4 binaires obligatoires sont intégrés et résolus sans fichier `.env` physique via `process.env`. |
| `REQ-044` / `R-48` (Exécution headless `--exec-scene`) | **Conforme** | Support complet du mode non interactif avec relai de signaux via `--init` (codes `0` / `1` / `130`). |
| `REQ-045` (Navigation spatiale Canvas Pan & Zoom) | **Inchangée** | Conservée telle qu'introduite en CDC v2.2 (CR-010) ; aucun lien avec le chantier Docker. |
| `REQ-046` / `R-50` (Chargement dynamique d'environnement) | **Inchangée** | Conservée telle qu'introduite en CDC v2.2 (CR-011) ; prérequis déjà exploité pour le runtime sans `.env` physique (ADR-022). |
| `REQ-047` *(nouvelle)* (Conteneurisation Docker officielle) | **Ajoutée** | Image officielle `node:24-slim`, outils système, `safe.directory '*'`, 4 CLI sous `/usr/local/bin/` et `HOST=0.0.0.0`. |
| `REQ-048` *(nouvelle)* (Authentification CLI partagée) | **Ajoutée** | Volume nommé `clientsbox-cli-auth` monté sur `/root` + script `scripts/docker/clientsbox-auth.sh`. |
| `REQ-049` *(nouvelle)* (Modes Compose / Wrapper et CI headless) | **Ajoutée** | Mode 1 (`docker-compose.yml` à la racine), Mode 2 (`clientsbox-run.sh` / `$WS:$WS`), `--init` sans port en `--exec-scene`. |
| `R-51` *(nouvelle)* (Image Docker et ENV embarquées) | **Ajoutée** | Formalise le socle image, les `ENV` et l'`ENTRYPOINT` officiels. |
| `R-52` *(nouvelle)* (Volume d'auth partagé) | **Ajoutée** | Formalise l'isolation des jetons CLI dans `clientsbox-cli-auth` sans masquage des binaires. |
| `R-53` *(nouvelle)* (Modes conteneurisés et signaux) | **Ajoutée** | Formalise Mode 1 / Mode 2, `--init`, absence de `-p` et de TTY en CI. |
| `REQ-113` *(nouvelle)* (Zéro impact `src/`) | **Ajoutée** | Portabilité Docker sans aucune modification du code applicatif. |
| `REQ-114` *(nouvelle)* (Sécurité mono-hôte conteneurisée) | **Ajoutée** | Bind hôte `127.0.0.1:2974:2974` en Mode 1 ; aucun port exposé en `--exec-scene`. |
| `REQ-115` *(nouvelle)* (Compatibilité LF / `safe.directory`) | **Ajoutée** | Fins de ligne LF pour les scripts `.sh` et respect de `safe.directory '*'` multi-OS. |
| Contraintes `C-04` (Port) & `C-11` (Réseau local) | **Adaptées** | Clarification : `127.0.0.1` en natif, `0.0.0.0` dans le conteneur, mapping hôte `127.0.0.1:2974:2974` ; nouvelles contraintes CDC n°16–18. |
| Reste du CDC (`REQ-001..043`, hors éléments détaillés ci-dessus) | **Inchangé** | Aucun impact sur les scénarios, l'éditeur de graphe, le SAC, les conditions Exit ou les scripts If. |

---

## 4. Impact — Spécifications fonctionnelles & Architecture

| Spécification | Nature de l'impact | Description et justification |
|---|---|---|
| [`tdd/specs/SRV.md`](../specs/SRV.md) (`SPEC-SRV-01`) | **Complétée** | Précision que le moteur d'environnement valide `HOST=0.0.0.0` comme valeur valide pour le binding conteneurisé. |
| [`tdd/specs/SRV.md`](../specs/SRV.md) (`SPEC-SRV-02`) | **Complétée** | Précision sur l'obligation du drapeau `--init` (Tini) en environnement conteneurisé pour garantir `AC-SRV-02-3` (arrêt gracieux des sous-processus et code `130`). |
| [`tdd/specs/ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-03`) | **Inchangée** | Le monopole I/O reste strictement respecté : les variables `HOST`, `PORT`, `*_CLI_BIN` continuent d'être lues exclusivement via `src/lib/process/env/`. |
| [`tdd/specs/ARCH.md`](../specs/ARCH.md) (`SPEC-ARCH-08`) | **Inchangée** | Le total de 200 modules officiels signés (`LIB-001..035`) ne change pas car aucun module applicatif n'est ajouté sous `src/`. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Mise à jour** | Référencement du CDC v2.5 et documentation du mode de déploiement conteneurisé officiel. |

---

## 5. Impact — Conception & Nouveaux Artefacts

L'intégration Docker n'altère aucun composant interne du moteur. Elle introduit une suite d'artefacts d'infrastructure et de documentation à la racine et sous `docs/` :

```text
ClientsBox/
├── Dockerfile                           # Image officielle ClientsBox (node:24-slim, 4 installateurs curl, git, tools)
├── .dockerignore                        # Exclusion de node_modules, .git, tests, logs, tmp
├── docker-compose.yml                   # Modèle de référence figé à la racine pour déploiement Mode 1 (projet)
├── scripts/
│   └── docker/
│       ├── clientsbox-run.sh            # Wrapper d'exécution Mode 2 (montage dynamique hôte $WS:$WS)
│       └── clientsbox-auth.sh           # Script utilitaire d'amorce d'authentification unique des 4 CLI
└── docs/
    └── deploy/
        ├── docker.md                    # Guide officiel complet du déploiement Docker (Modes 1 & 2, Auth, CI)
        └── README.md                    # Index mis à jour pointant vers docker.md
```

---

## 6. Impact — Tests & Validation

| Catégorie de test | Impact | Description de la validation |
|---|---|---|
| **Tests unitaires (`tests/units/**`)** | **Inchangés** | Les 179 suites de test existantes restent valides à 100 %. |
| **Tests E2E (`tests/e2e/**`)** | **Inchangés** | Les tests Playwright continuent de s'exécuter sur le build universel. |
| **Tests de syntaxe Dockerfile** | **Nouveau** | Validation de la syntaxe du `Dockerfile` et vérification des directives (pas de secrets, binaires dans `/usr/local/bin`, `HOST=0.0.0.0`). |
| **Test de validation d'environnement** | **Conforme** | Vérification que le démarrage sans fichier `env/.env` (uniquement sur `process.env`) valide les 4 binaires obligatoires et initialise le serveur. |
| **Intégration continue (`npm run ci`)** | **Préservée** | `npm run ci` (`npm test && npm run quality`) continue de s'exécuter avec succès code 0. |

---

## 7. Impact — Code de production (`src/`)

> **Impact sur `src/` : 0 fichier modifié, 0 ligne ajoutée.**  
> Grâce à l'architecture découplée mise en place lors de `CR-003` (`ADR-022`), ClientsBox résout nativement ses paramètres depuis `process.env` lorsque `env/.env` est absent. Le runtime applicatif est déjà prêt pour la conteneurisation sans aucune retouche de code.

---

## 8. Effets de bord identifiés et mitigations

1. **Permissions des fichiers créés par les agents sous Linux hôte :**
   - *Risque :* Les agents exécutant des blocs `Run` créent des fichiers appartenant à `root:root` sur la machine hôte.
   - *Mitigation :* Documenter la configuration `user: "${UID:-1000}:${GID:-1000}"` dans Compose et l'utilisation de `umask` pour les partages d'équipe.
2. **Masquage involontaire lors du montage de `/root` :**
   - *Risque :* Si un installateur CLI dépose son binaire par défaut dans `/root/.local/bin/` ou `/root/.cursor/` lors du build Docker, le montage du volume `clientsbox-cli-auth:/root` au runtime le masquerait entièrement.
   - *Mitigation :* L'instruction `RUN` du `Dockerfile` déplace ou lie symboliquement (`ln -s`) systématiquement les exécutables vers `/usr/local/bin/` (`cursor-agent`, `claude`, `agy`, `codex`), sanctuarisant les exécutables hors de `/root`.
3. **Erreur Git `dubious ownership` sur les dépôts montés :**
   - *Risque :* Échec immédiat des blocs `Command` effectuant des opérations Git (`git status`, `git commit`).
   - *Mitigation :* Injection obligatoire de `git config --system --add safe.directory '*'` dans l'image.
4. **Fins de ligne CRLF vs LF sur les postes Windows :**
   - *Risque :* Des scripts `.sh` montés depuis un hôte Windows avec fins de ligne CRLF échoueraient dans le conteneur Linux (`\r: command not found`).
   - *Mitigation :* Documenter et imposer la règle `.gitattributes` (`*.sh text eol=lf`) dans le guide de déploiement.

---

## 9. Ce que nous ne ferons pas dans ce chantier (Périmètre hors-scope partagé)

- La modification du code applicatif interne TypeScript (impact `src/` = 0 ligne).
- Le déploiement sur un cluster Kubernetes ou Swarm multi-nœuds (mono-hôte Docker et Docker Compose exclusivement).
- L'inclusion de secrets, de jetons ou de clés d'API en clair dans l'image Docker (les secrets restent confinés dans le volume nommé hôte).
- La compilation de binaires spécifiques au runtime Docker (utilisation exclusive du livrable universel `dist/clientsbox.js`).
- La publication automatisée des images sur un registre public comme Docker Hub (la construction reste locale ou gérée par la CI privée de l'organisation).
- L'adoption du conteneur persistant comme mode d'exploitation standard (réservé aux tests exploratoires jetables).

---

## 10. Ordre d'exécution retenu

| # | Étape | Responsable | Livrable / Validation |
|---|---|---|---|
| **1** | Archivage formel du CDC v2.4 sous `archived/` | Antigravity | [`tdd/docs/cdc/archived/cahier-des-charges-v2.4.md`](../cdc/archived/cahier-des-charges-v2.4.md) |
| **2** | Rédaction du Cahier des Charges **CDC v2.5** | Antigravity | [`tdd/docs/cdc/cahier-des-charges-v2.5.md`](../cdc/cahier-des-charges-v2.5.md) |
| **3** | Création du `Dockerfile` officiel et de `.dockerignore` | Antigravity | `Dockerfile`, `.dockerignore` |
| **4** | Création du modèle `docker-compose.yml` (racine) et scripts | Antigravity | `docker-compose.yml`, `scripts/docker/` |
| **5** | Rédaction du guide officiel de déploiement Docker | Antigravity | [`docs/deploy/docker.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/docs/deploy/docker.md) |
| **6** | Validation qualité et pipeline complet | Antigravity | `npm run ci` vert (tests + quality) |
