# ClientsBox

<p align="center">
  <strong>Orchestrateur visuel & moteur d'exécution multi-agents pour CLI IA</strong><br>
  <em>Pilotez, enchaînez et automatisez vos agents Cursor, Claude, Antigravity et Codex dans des scénarios déterministes.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js&logoColor=white" alt="Node.js 24+">
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/Architecture-TDD%20%2F%20Hexagonale-FF6B6B" alt="TDD">
  <img src="https://img.shields.io/badge/Docker-Official%20Image-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Security-Local%20Loopback%20(C--11)-green" alt="Security C-11">
  <img src="https://img.shields.io/badge/Tests-100%25%20Passing%20(236%20unit%20%7C%2017%20e2e)-brightgreen" alt="Tests 100%">
</p>

---

## 🌟 Présentation

**ClientsBox** est une plateforme d'orchestration locale conçue pour coordonner des équipes d'agents d'intelligence artificielle autonomes directement au cœur de vos bases de code.

Plutôt que d'enfermer vos workflows dans des environnements propriétaires dans le cloud, ClientsBox tire parti des **outils CLI natifs** installés sur votre machine ou dans un conteneur dédié (**Cursor CLI**, **Claude CLI**, **Antigravity CLI**, **Codex CLI**), tout en vous offrant :

1. **Un Studio Web interactif (Canvas Node-based)** pour concevoir visuellement des scénarios complexes par glisser-déposer.
2. **Un moteur d'exécution déterministe** gérant les branchements conditionnels, les exécutions de commandes shell, la récursivité contrôlée et la reprise de session conversationnelle.
3. **Un mode Headless scriptable** (`--exec-scene`) intégrable directement dans vos pipelines CI/CD, hooks Git et scripts d'automatisation.
4. **Une persistance 100% locale** : toutes vos configurations résident dans votre projet sous le dossier `.agents/data/` au format JSON et JavaScript lisible et versionnable sous Git.

---

## 🚀 Fonctionnalités Clés

- 🤖 **Support Multi-CLI Officiel :**
  - **Cursor CLI** (`cursor-agent`) avec gestion automatique des sessions (`-p --resume`) et validation du _Workspace Trust_.
  - **Claude CLI** (`claude`) avec flux textuels et reprise d'historique.
  - **Antigravity CLI** (`agy`) avec gestion de flux et agents autonomes.
  - **Codex CLI** (`codex`) pour la génération et revue de code automatisée.
- 🎨 **Studio Canvas Visuel :**
  - Interface web réactive construite en **Preact** et **TailwindCSS v4**.
  - Rendu vectoriel SVG haute performance avec connexions magnétiques et auto-routage.
  - Inspecteur de ressources contextuel et terminal d'exécution temps réel connecté via **Server-Sent Events (SSE)**.
- ⚙️ **Moteur de Workflow Robuste à 6 Blocs :**
  - `Start` : Point d'entrée unique du graphe d'exécution.
  - `Run` : Exécution ciblée d'un agent avec prompt injecté, profil système et condition de sortie.
  - `If` : Branchement booléen dynamique (Oui/Non) piloté par un script JavaScript sécurisé.
  - `Command` : Exécution de commandes shell système (build, lint, tests) avec interception des codes de retour.
  - `CallScenario` : Sous-scénarios modulaires et récursifs avec protection contre les boucles infinies.
  - `ClearContext` : Réinitialisation propre de la mémoire contextuelle d'un agent.
- 🔒 **Sécurité Stricte Mono-Utilisateur (`C-11`) :**
  - Écoute strictement bornée au loopback local (`127.0.0.1:2974`).
  - Aucun transit de données sensibles vers des serveurs tiers en dehors des API officielles des CLI configurés.
  - Isolement complet sous Docker avec volumes persistants d'authentification partagée.

---

## ⚡ Démarrage Rapide

### Option A — Avec Docker (Recommandé, Zéro Installation Locale)

Aucune installation locale de Node.js 24 ni des 4 CLI tiers n'est requise.

#### 1. Construire l'image officielle

```bash
docker build -t clientsbox:latest .
```

#### 2. Authentifier et approuver vos CLI dans votre projet

```bash
./scripts/docker/clientsbox-auth.sh
```

> Ce script ouvre un terminal interactif dans votre dossier de travail actuel pour approuver le _Workspace Trust_ (`cursor-agent`) et vous connecter à vos comptes (`cursor-agent login`, `claude login`, `agy auth`, `codex login`). Les autorisations sont conservées dans le volume persistant `clientsbox-cli-auth`.

#### 3. Lancer ClientsBox

```bash
# Mode Serveur Web (Studio interactif)
./scripts/docker/clientsbox-run.sh

# Ou via Docker Compose à la racine du projet
docker compose up -d
```

Ouvrez votre navigateur sur **[http://127.0.0.1:2974](http://127.0.0.1:2974)**.

#### 4. Exécution Headless (CI/CD ou Script)

```bash
./scripts/docker/clientsbox-run.sh --exec-scene <id-ou-nom-du-scenario>
```

---

### Option B — Installation Native depuis les Sources

#### 1. Prérequis

- **Node.js 24+** et **npm 10+**
- Les CLI d'IA souhaités accessibles dans votre `$PATH`

#### 2. Installation & Configuration

```bash
# Cloner le dépôt et installer les dépendances
npm install

# Configurer l'environnement local
cp env/.env.example env/.env
```

Renseignez dans `env/.env` les chemins d'accès absolus de vos binaires CLI (`CURSOR_CLI_BIN`, `CLAUDE_CLI_BIN`, etc.).

#### 3. Démarrage

```bash
# Lancer le serveur local
npm start

# Mode développement avec rechargement à chaud
npm run dev
```

---

## 📚 Documentation Complète

Le projet dispose d'une documentation technique et opérationnelle exhaustive organisée en deux grands espaces :

### 🚀 Guide de Déploiement & Exploitation (`docs/deploy/`)

| Guide                                                                  | Description                                                            |
| :--------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| 📖 **[Index Déploiement](./docs/deploy/README.md)**                    | Vue d'ensemble du déploiement et des opérations                        |
| 🐳 **[Conteneurisation Docker](./docs/deploy/docker.md)**              | Guide officiel Docker, Docker Compose, wrapper global et volume d'auth |
| ⚙️ **[Configuration & Environnement](./docs/deploy/configuration.md)** | Variables `env/.env`, options d'exécution et flags CLI                 |
| 📦 **[Build et Livrable](./docs/deploy/build-et-livrable.md)**         | Compilation Vite / Rolldown et génération de `dist/clientsbox.js`      |
| 🛠️ **[Installation Native](./docs/deploy/installation.md)**            | Prérequis système et installation pas-à-pas                            |
| 💻 **[Lancement Développement](./docs/deploy/lancement-dev.md)**       | Scripts de développement, mode watch et debug                          |

### 📖 Instructions d'Utilisation & Scénarios (`docs/instructions/`)

| Section                                                                                    | Description                                                   |
| :----------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| 📘 **[Index des Instructions](./docs/instructions/README.md)**                             | Guide unifié pour opérateurs humains et agents d'IA           |
| 🚦 **[01 — Démarrage](./docs/instructions/01-demarrage/README.md)**                        | Prise en main, arborescence `.agents/` et commandes CLI       |
| 🧩 **[02 — Ressources](./docs/instructions/02-ressources/README.md)**                      | Définition des Profils, Agents, Prompts, Exits et scripts If  |
| 🔄 **[03 — Scénarios & Moteur](./docs/instructions/03-scenarios-et-moteur/README.md)**     | Utilisation du Studio Canvas, règles des 6 blocs et exécution |
| 💡 **[04 — Exemples & Dépannage](./docs/instructions/04-exemples-et-depannage/README.md)** | Workflows complets clés en main, patterns avancés et FAQ      |

---

## 📁 Architecture du Projet

```text
ClientsBox/
├── .agents/data/               # Données de travail locales (versionnées sous Git)
│   ├── profils/                # Définitions des rôles et politiques système (JSON)
│   ├── agents/                 # Configuration des agents et association de CLI (JSON)
│   ├── prompts/                # Consignes opérationnelles réutilisables (JSON)
│   ├── exit/                   # Conditions d'arrêt et de succès (JSON)
│   ├── if/                     # Scripts de condition booléenne (JavaScript ESM/CJS)
│   └── scenarios/              # Graphes complets des scénarios de travail (JSON)
├── dist/                       # Livrable universel autonome compilé (clientsbox.js)
├── docs/                       # Documentation officielle
│   ├── deploy/                 # Documentation d'installation et de déploiement
│   └── instructions/           # Documentation opérationnelle du Studio et des blocs
├── scripts/
│   └── docker/                 # Scripts d'orchestration conteneurisée
│       ├── clientsbox-auth.sh  # Shell d'authentification et approbation de workspace
│       └── clientsbox-run.sh   # Wrapper global d'exécution éphémère (Mode 2)
├── src/                        # Code source TypeScript (Architecture Hexagonale)
│   ├── controllers/            # Contrôleurs HTTP, SSE et CLI
│   ├── domain/                 # Entités métier, validateurs de graphe et topologie
│   ├── lib/                    # Adaptateurs CLI (Cursor, Claude, Antigravity, Codex)
│   ├── services/               # Moteur d'exécution, gestionnaire de sessions et store
│   └── ui/                     # Interface Web Studio (Preact, TailwindCSS v4)
├── tdd/                        # Référentiel méthodologique TDD (CDC v2.5, Specs, ADR, CR)
├── docker-compose.yml          # Déploiement standard par projet (Mode 1)
├── Dockerfile                  # Multi-stage build Node 24-slim avec les 4 CLI préinstallés
└── package.json
```

---

## 🧪 Qualité, Tests & Méthodologie TDD

ClientsBox est intégralement conçu et maintenu selon une méthodologie rigoureuse de **Test-Driven Development (TDD)** :

```bash
# Vérification de l'intégrité du code (TypeCheck + Lint + Prettier)
npm run quality

# Exécuter les 236 tests unitaires et d'intégration Vitest
npm run test:unit

# Exécuter les 17 tests End-to-End Playwright (navigateurs réels)
npm run test:e2e

# Exécution complète de la suite de validation CI
npm run ci

# Compiler le livrable de production
npm run build
```

---

## 🛡️ Sécurité & Confidentialité

- **Architecture Local-First :** Le serveur d'API et le Studio Web n'écoutent que sur `127.0.0.1` (`HOST=127.0.0.1`). Aucune interface publique n'est exposée sur le réseau local ou externe.
- **Gestion des Secrets :** Les clés d'API et les jetons d'authentification ne sont jamais stockés dans les fichiers de scénarios versionnés. Sous Docker, ils sont isolés dans le volume sécurisé `clientsbox-cli-auth`.

---

## 📄 Licence

Ce projet est sous licence propriétaire / ISC. Tous droits réservés.
