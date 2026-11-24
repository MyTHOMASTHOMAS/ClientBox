# Ressources déclaratives

Les ressources sont les briques réutilisables d'un workflow. Chaque ressource est **un fichier** sous `.agents/data/`, éditable depuis l'UI ou directement sur disque.

## Modèle « 1 fichier = 1 ressource »

| Type      | Dossier    | Extension |
| --------- | ---------- | --------- |
| Profil    | `profils/` | `.json`   |
| Agent     | `agents/`  | `.json`   |
| Prompt    | `prompts/` | `.json`   |
| Exit      | `exit/`    | `.json`   |
| Script If | `if/`      | `.js`     |

Le nom du fichier (`<id>.json` / `<id>.js`) doit correspondre au champ `id` (ou à l'identifiant du script).

## Conventions d'identifiants (`id`)

- Minuscules, chiffres et tirets : `kebab-case` (ex. `profil-dev`, `agent-codeur`)
- Interdits : `/`, `\`, `..` (anti-traversée)
- Correspondance stricte fichier ↔ `id`

## Ordre de création et intégrité référentielle

```text
profils → agents → prompts / exit / if → scenarios
```

Un agent référence un `profilId` ; un bloc `Run` référence `agentId`, `promptId`, `exitId` ; un bloc `If` référence `ifScriptId`. Créez d'abord les dépendances.

## Contenu de la section

| Guide                                     | Contenu                                   |
| ----------------------------------------- | ----------------------------------------- |
| [Profils](./01-profils.md)                | `systemPrompt` + 3 politiques d'injection |
| [Agents](./02-agents.md)                  | `profilId`, `cliId`, `model`              |
| [Prompts & Exit](./03-prompts-et-exit.md) | Missions et ordres de sortie              |
| [Scripts If](./04-scripts-if.md)          | ESM / CommonJS + structure du `sac`       |

**Règle d'or** : l'UI et le disque manipulent les mêmes fichiers ; pas de base cachée.
