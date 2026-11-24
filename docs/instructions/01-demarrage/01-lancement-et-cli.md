# Lancement serveur & mode headless

Toutes les façons de démarrer le binaire `clientsbox.js`.

## Mode serveur web (interface graphique)

Sans `--exec-scene`, ClientsBox démarre un serveur HTTP local :

```bash
node clientsbox.js
# ou, selon votre livrable :
node dist/clientsbox.js
```

- Écoute par défaut : `http://127.0.0.1:2974/`
- Host exclusif loopback (`127.0.0.1`) ; port configurable via `--port` / `PORT`

### Carte rapide de la navigation

| Route                 | Écran                                     |
| --------------------- | ----------------------------------------- |
| `#/scenarios`         | Liste des scénarios + Studio              |
| `#/agents`            | Agents                                    |
| `#/profiles`          | Profils                                   |
| `#/resources`         | Prompts                                   |
| `#/resources/exits`   | Ordres de sortie Exit                     |
| `#/resources/scripts` | Scripts If (lecture)                      |
| `#/parametres`        | Paramètres                                |
| `#/instructions`      | Cette documentation (navigation in-place) |

## Mode headless (`--exec-scene`)

Exécute un scénario **sans** démarrer le serveur HTTP (ADR-020) :

```bash
node clientsbox.js --exec-scene <id-scenario>
```

Exemple :

```bash
node clientsbox.js --exec-scene demo-dev-test
```

### Flux de sortie

- Les flux agent / moteur sont écrits sur `stdout` / `stderr` du processus
- Le processus quitte dès la fin (succès, erreur ou interruption)

### Codes de retour

| Code  |                                                     Signification |
| ----- | ----------------------------------------------------------------: |
| `0`   |                        Scénario terminé avec succès (`completed`) |
| `1`   | Erreur (scénario introuvable, graphe invalide, échec d'exécution) |
| `130` |                     Interruption opérateur (`SIGINT` / `SIGTERM`) |

## Options CLI

| Flag           | Court | Type             | Défaut | Description                                    |
| -------------- | ----- | ---------------- | ------ | ---------------------------------------------- |
| `--port`       | `-p`  | nombre (1–65535) | `2974` | Port HTTP du serveur (ignoré en headless)      |
| `--env`        | `-e`  | chemin non vide  | —      | Fichier d'environnement personnalisé           |
| `--exec-scene` | —     | id non vide      | —      | Identifiant du scénario à exécuter en headless |

Exemples :

```bash
node clientsbox.js --port 3000
node clientsbox.js -e ./env/.env.local
node clientsbox.js --exec-scene scenario-demo -e ./env/.env
```

Les variables d'environnement (binaires CLI, `AGENTS_DIR`, `CALL_SCENARIO_MAX_DEPTH`, etc.) sont documentées dans [Environnement & arborescence](./02-environnement-et-arborescence.md).
