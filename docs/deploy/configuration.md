# Configuration (runtime dynamique ADR-022)

Les variables sont déclarées dans `env/.env.example`. En développement comme en production, elles sont lues dynamiquement au runtime depuis `env/.env` (ou via l'option `-e <chemin>`) ; le livrable `dist/clientsbox.js` ne contient aucune variable injectée au build (ADR-022).

## Variables principales

| Variable              | Obligatoire | Défaut        | Rôle                                                          |
| --------------------- | ----------- | ------------- | ------------------------------------------------------------- |
| `CURSOR_CLI_BIN`      | **Oui**     | —             | Chemin **absolu** du binaire cursor-cli / cursor-agent        |
| `ANTIGRAVITY_CLI_BIN` | **Oui**     | —             | Chemin **absolu** du binaire Antigravity CLI (`agy`)          |
| `CODEX_CLI_BIN`       | **Oui**     | —             | Chemin **absolu** du binaire Codex CLI (`codex`)              |
| `CLAUDE_CLI_BIN`      | **Oui**     | —             | Chemin **absolu** du binaire Claude CLI (`claude`)            |
| `PORT`                | Non         | `2974`        | Port HTTP local                                               |
| `HOST`                | Non         | `127.0.0.1`   | Interface d'écoute (loopback en local, `0.0.0.0` dans Docker) |
| `AGENTS_DIR`          | Non         | `.agents`     | Racine des données et docs locales                            |
| `NODE_ENV`            | Non         | `development` | Mode d'exécution                                              |
| `LOGS_DISABLED`       | Non         | `false`       | Désactive la journalisation structurée si `true`              |

## Exemple `env/.env`

```bash
CURSOR_CLI_BIN=/home/vous/.local/bin/cursor-agent
ANTIGRAVITY_CLI_BIN=/home/vous/.local/bin/agy
CODEX_CLI_BIN=/usr/local/bin/codex
CLAUDE_CLI_BIN=/usr/local/bin/claude
PORT=2974
HOST=127.0.0.1
AGENTS_DIR=.agents
```

## Workspace

Le **workspace** est le `cwd` au lancement du processus Node. Les écritures `.agents/data/` et `.agents/docs/` sont relatives à ce chemin.

> Le livrable `dist/clientsbox.js` est totalement universel et portable (ADR-022) : aucune variable n'est injectée au build. La configuration d'environnement reste confinée dans `env/.env` sur chaque machine hôte.

## Suite

- [Build et livrable](./build-et-livrable.md)
- [Lancement depuis les sources](./lancement-dev.md)
- [Index deploy](./README.md)
