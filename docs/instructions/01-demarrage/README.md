# Démarrage

Cette section couvre le lancement de ClientsBox et l'organisation du workspace sur disque.

## Prérequis système

- **Node.js** ≥ 24
- Au moins un CLI d'agent opérationnel : `cursor-cli`, `antigravity` ou `codex-cli`
- Fichier `env/.env` renseigné (chemins absolus des binaires) — voir [Environnement](./02-environnement-et-arborescence.md)

## Contenu de la section

| Guide                                                                 | Contenu                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| [Lancement & CLI](./01-lancement-et-cli.md)                           | Mode serveur UI, mode headless `--exec-scene`, flags CLI  |
| [Environnement & arborescence](./02-environnement-et-arborescence.md) | Layout `.agents/`, variables `env/.env`, zones interdites |

**Règle d'or** : le disque sous `.agents/data/` est la source de vérité ; l'UI et le mode headless lisent les mêmes fichiers.
