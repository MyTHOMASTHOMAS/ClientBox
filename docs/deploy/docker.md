# Conteneurisation et déploiement Docker — ClientsBox

Documentation officielle de référence pour l'exécution et le déploiement conteneurisé de ClientsBox sous Docker et Docker Compose.

---

## 1. Vue d'ensemble

ClientsBox propose une image Docker officielle standardisée reposant sur `node:24-slim` qui encapsule :

- Le runtime **Node.js 24**.
- Les dépendances système : `git`, `curl`, `jq`, `ca-certificates`, `openssh-client`.
- La configuration système `git config --system --add safe.directory '*'` pour éviter les erreurs de permissions sur les montages de volumes.
- Les **4 adaptateurs CLI d'agents d'IA** officiellement supportés, installés sous `/usr/local/bin/` :
  - **Cursor CLI** (`cursor-agent`)
  - **Claude CLI** (`claude`)
  - **Antigravity CLI** (`agy`)
  - **Codex CLI** (`codex`)
- Les variables d'environnement préconfigurées (`HOST=0.0.0.0`, `PORT=2974`, `AGENTS_DIR=.agents`, `IS_SANDBOX=1` pour autoriser `--dangerously-skip-permissions` sur Claude Code sous Docker, chemins `*_CLI_BIN`).

Aucune installation locale de Node 24 ni des 4 CLI tiers n'est requise sur la machine hôte.

---

## 2. Construction de l'image

Pour construire l'image locale officielle :

```bash
docker build -t clientsbox:latest .
```

L'image est construite via un multi-stage build qui compile le livrable universel `dist/clientsbox.js` puis l'intègre dans le runtime épuré `/opt/clientsbox/clientsbox.js`.

---

## 3. Authentification partagée & Approbation de Workspace

Pour éviter d'avoir à réauthentifier les CLI à chaque projet ou lors du lancement de conteneurs éphémères, les jetons de session ainsi que les approbations de sécurité (_Workspace Trust_) stockés dans `$HOME` (`/root`) sont isolés dans un **volume Docker nommé persistant et partagé** : `clientsbox-cli-auth`.

### Procédure : Shell interactif dans le dossier de travail

Exécutez le script d'authentification interactif depuis la racine de votre projet :

```bash
bash scripts/docker/clientsbox-auth.sh
```

Ce script démarre un conteneur éphémère interactif (`bash`) qui monte :

1. Le volume persistant `clientsbox-cli-auth` sur `/root` (conserve vos sessions et approbations).
2. Le répertoire courant de votre machine hôte en **miroir exact** (`-v "$PWD:$PWD" -w "$PWD"`).
3. Vos configurations Git (`~/.gitconfig`) et clés SSH (`~/.ssh`) en lecture seule si présentes.

### Commandes à exécuter dans le conteneur

Une fois dans le terminal du conteneur, positionné dans votre projet, vous pouvez vous connecter et approuver manuellement chaque CLI :

```bash
# 1. Cursor CLI : approuver le workspace (Workspace Trust) et se connecter
cursor-agent              # Appuyez sur Entrée / 'y' pour approuver le dossier courant
# ou directement : cursor-agent --trust
cursor-agent login        # Authentification avec votre compte Cursor

# 2. Claude CLI
claude login

# 3. Antigravity CLI
agy auth

# 4. Codex CLI
codex login

# Quitter une fois les approbations et connexions terminées
exit
```

Tous les jetons et approbations de dossiers sont conservés dans le volume `clientsbox-cli-auth`. Dès lors, les lancements via `clientsbox-run.sh` ou `docker compose` s'exécutent sans aucun blocage d'autorisation ni demande de reconnexion.

---

## 4. Les deux modes d'exploitation standard

### Mode 1 — Déploiement par projet (`docker-compose.yml`)

Idéal pour les équipes travaillant sur un même dépôt Git : la configuration Compose est versionnée à la racine du projet.

1. **Démarrer ClientsBox Studio (serveur web local) :**
   ```bash
   docker compose up -d
   ```
2. **Accéder à l'interface :**
   Ouvrez votre navigateur sur [http://127.0.0.1:2974](http://127.0.0.1:2974).
3. **Consulter les logs :**
   ```bash
   docker compose logs -f clientsbox
   ```
4. **Arrêter le conteneur :**
   ```bash
   docker compose down
   ```

_Spécificités :_

- Le répertoire courant est monté sur `/workspace`.
- Le volume nommé `clientsbox-cli-auth` est monté en `external: true`.
- Le port est strictement lié en local à `127.0.0.1:2974:2974` pour garantir la sécurité mono-hôte (`REQ-114`).
- L'option `init: true` est activée pour propager fidèlement les signaux POSIX.

---

### Mode 2 — Déploiement global autonome (`clientsbox-run.sh`)

Idéal pour piloter n'importe quel dossier ou projet depuis le terminal hôte sans conteneur persistant.

Le wrapper `scripts/docker/clientsbox-run.sh` lance un conteneur éphémère `--rm` en montant dynamiquement le dossier courant avec un **miroir exact du chemin absolu hôte** (`-v "$WS:$WS" -w "$WS"`), garantissant que les CLI tiers ne sont pas perturbés par des chemins virtuels.

```bash
# Lancement interactif (Studio Web)
bash scripts/docker/clientsbox-run.sh

# Lancement avec surcharge du port
PORT=3000 bash scripts/docker/clientsbox-run.sh
```

---

## 5. Exécution Headless non interactive (`--exec-scene`)

Pour les scripts bash, les pipelines CI/CD ou l'automatisation par lots :

```bash
# Via le wrapper global (Mode 2)
bash scripts/docker/clientsbox-run.sh --exec-scene <id|nom-scenario>

# Via Docker Compose (Mode 1)
docker compose run --rm -T clientsbox --exec-scene <id|nom-scenario>
```

### Règles techniques du mode headless :

- **Sans allocation TTY superflue (`-T`) :** évite l'injection de séquences d'échappement ANSI parasites dans les fichiers de logs CI.
- **Gestion stricte des signaux (`--init`) :** Tini est activé en PID 1 pour transmettre `SIGINT` (`Ctrl+C`) à tous les sous-processus d'agents et renvoyer le code standard `130`.
- **Sans mappage de port réseau (`-p`) :** aucun port n'est réservé, évitant tout conflit `EADDRINUSE` si l'UI tourne en parallèle ou si plusieurs scénarios headless sont lancés concurremment.
- **Codes de retour système :**
  - `0` : exécution achevée avec succès.
  - `1` : erreur d'exécution ou scénario introuvable.
  - `130` : arrêt d'urgence déclenché par interruption `SIGINT` (Ctrl+C).

---

## 6. Personnalisation & Outils durables

| Besoin                                                        | Solution recommandée                                                 | Remarque                                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Commits et push Git par les agents CLI**                    | Monter `~/.gitconfig` et `~/.ssh` en lecture seule (`:ro`)           | Géré automatiquement par `clientsbox-run.sh` ou décommentable dans `docker-compose.yml`.                    |
| **Fins de ligne Windows / WSL2**                              | Forcer LF dans `.gitattributes` (`*.sh text eol=lf`)                 | Évite les erreurs `\r: command not found` lors de l'exécution sous Linux.                                   |
| **Ajouter des outils durables (`python3`, `php`, `make`...)** | Image dérivée via `Dockerfile.clientsbox` (`FROM clientsbox:latest`) | Utilisable via `build:` en Compose ou variable `CLIENTSBOX_IMAGE` dans le wrapper. Survit aux mises à jour. |
| **Test exploratoire rapide**                                  | Conteneur persistant (`docker run --name ...` + `docker exec`)       | Non recommandé pour la production (volumes figés et non partageables).                                      |
