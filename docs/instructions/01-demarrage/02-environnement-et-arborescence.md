# Environnement & arborescence

Organisation du workspace sur disque et format de `env/.env`.

## Arborescence complète du workspace

```text
<workspace>/
├── env/
│   ├── .env                 # Variables runtime (à créer depuis .env.example)
│   └── .env.example         # Modèle versionné
├── .agents/                 # Racine Agents (AGENTS_DIR, défaut : .agents)
│   ├── data/                # Source de vérité des ressources
│   │   ├── profils/         # <id>.json
│   │   ├── agents/          # <id>.json
│   │   ├── prompts/         # <id>.json
│   │   ├── exit/            # <id>.json
│   │   ├── if/              # <id>.js
│   │   └── scenarios/       # <id>.json
│   └── docs/                # Miroir Markdown exporté depuis docs/instructions/
└── clientsbox.js            # Binaire / livrable
```

## Règles de persistance et zones interdites

- **Disque = source de vérité** : chaque lecture HTTP / headless relit les fichiers frais
- **Écritures atomiques** : fichiers temporaires puis `rename` (pas d'écriture partielle visible)
- **Versionnement Git recommandé** pour `.agents/data/` (hors secrets)
- **N'entre jamais** dans `.agents/data/` :
  - logs d'exécution / terminal (mémoire navigateur uniquement)
  - sessions CLI internes
  - documentation Markdown (celle-ci va dans `.agents/docs/` via export)

## Format du fichier `env/.env`

- Syntaxe : une variable par ligne, `CLE=VALEUR`
- Chargement dynamique au runtime (ADR-022) ; `--env` permet de pointer un autre fichier
- Les chemins de binaires sont des **chemins absolus** ; pas de fallback PATH pour Cursor / Codex / Antigravity au démarrage (validation stricte)

## Tableau des variables d'environnement

| Variable                       | Type        | Défaut          | Description                                               |
| ------------------------------ | ----------- | --------------- | --------------------------------------------------------- |
| `PORT`                         | nombre      | `2974`          | Port HTTP                                                 |
| `HOST`                         | string      | `127.0.0.1`     | Interface d'écoute                                        |
| `AGENTS_DIR`                   | string      | `.agents`       | Racine relative au workspace                              |
| `CURSOR_CLI_BIN`               | exécutable  | _(obligatoire)_ | Chemin absolu du binaire Cursor                           |
| `ANTIGRAVITY_CLI_BIN`          | exécutable  | _(obligatoire)_ | Chemin absolu du binaire Antigravity                      |
| `CODEX_CLI_BIN`                | exécutable  | _(obligatoire)_ | Chemin absolu du binaire Codex                            |
| `CLAUDE_CLI_BIN`               | exécutable  | _(obligatoire)_ | Chemin absolu du binaire Claude                           |
| `ANTIGRAVITY_PROBE_TIMEOUT_MS` | nombre      | `15000`         | Timeout d'amorce session Antigravity                      |
| `CODEX_PROBE_TIMEOUT_MS`       | nombre      | `15000`         | Timeout d'amorce session Codex                            |
| `CLAUDE_PROBE_TIMEOUT_MS`      | nombre      | `15000`         | Timeout d'amorce session Claude                           |
| `CALL_SCENARIO_MAX_DEPTH`      | nombre ≥ -1 | `-1`            | Profondeur max `CallScenario` (`-1` ou absent = illimité) |
| `LOGS_DISABLED`                | booléen     | `false`         | Coupe la journalisation structurée                        |
| `NODE_ENV`                     | enum        | `development`   | `development` \| `production` \| `test`                   |

## Exemple complet de `env/.env`

```bash
# Binaires (chemins absolus — obligatoires)
CURSOR_CLI_BIN=C:\Users\exemple\AppData\Local\cursor-agent\cursor-agent.exe
ANTIGRAVITY_CLI_BIN=C:\Users\exemple\AppData\Local\agy\bin\agy.exe
CODEX_CLI_BIN=C:\Users\exemple\AppData\Local\Programs\OpenAI\Codex\bin\codex.exe
CLAUDE_CLI_BIN=C:\Users\exemple\AppData\Roaming\npm\claude.cmd

ANTIGRAVITY_PROBE_TIMEOUT_MS=15000
CODEX_PROBE_TIMEOUT_MS=15000
CLAUDE_PROBE_TIMEOUT_MS=15000

PORT=2974
HOST=127.0.0.1
AGENTS_DIR=.agents
CALL_SCENARIO_MAX_DEPTH=-1
NODE_ENV=development
LOGS_DISABLED=false
```

Sous Linux / macOS, remplacez les chemins par vos binaires locaux (ex. `/home/user/.local/bin/cursor-agent`).
