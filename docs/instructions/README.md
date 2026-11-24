# Instructions d'utilisation — ClientsBox

Documentation **unifiée** (humains et agents IA) pour utiliser le binaire ClientsBox : interface web, fichiers sous `.agents/data/`, et exécution headless.

> Build, npm et livrable interne → [`docs/deploy/`](../deploy/README.md) (jamais exporté vers `.agents/docs/`).

## Présentation

ClientsBox est un **orchestrateur local** de workflows multi-agents. Il enchaîne :

- des appels à des CLI d'agents (`cursor-cli`, `antigravity`, `codex-cli`) ;
- des commandes shell (`Command`) ;
- des sous-scénarios réutilisables (`CallScenario`) ;
- des branchements conditionnels (`If`) et des réinitialisations de contexte (`ClearContext`).

Vous pilotez le même graphe depuis l'**interface web** (`http://127.0.0.1:2974/`) ou en éditant directement les fichiers sous `.agents/data/`.

## Carte globale de la configuration

| Fichier / dossier     | Format               | Rôle                                              | Page                                                                      |
| --------------------- | -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| `env/.env`            | `CLE=VALEUR`         | Port, binaires CLI, profondeur CallScenario, logs | [Environnement](./01-demarrage/02-environnement-et-arborescence.md)       |
| `profils/<id>.json`   | JSON                 | Consignes système + politique d'injection         | [Profils](./02-ressources/01-profils.md)                                  |
| `agents/<id>.json`    | JSON                 | Lien profil + adapter CLI + modèle optionnel      | [Agents](./02-ressources/02-agents.md)                                    |
| `prompts/<id>.json`   | JSON                 | Mission ponctuelle confiée à un `Run`             | [Prompts & Exit](./02-ressources/03-prompts-et-exit.md)                   |
| `exit/<id>.json`      | JSON                 | Ordre de sortie additionné au prompt d'un `Run`   | [Prompts & Exit](./02-ressources/03-prompts-et-exit.md)                   |
| `if/<id>.js`          | JS (ESM ou CommonJS) | Script booléen du bloc `If`                       | [Scripts If](./02-ressources/04-scripts-if.md)                            |
| `scenarios/<id>.json` | JSON                 | Graphe de blocs et connexions                     | [Schéma & blocs](./03-scenarios-et-moteur/02-schema-scenario-et-blocs.md) |

Chemins relatifs à `.agents/data/` (sauf `env/.env`, à la racine du projet).

## Parcours de prise en main (5 étapes)

1. **Démarrer** — [Lancement & CLI](./01-demarrage/01-lancement-et-cli.md) → UI sur `http://127.0.0.1:2974/` ou mode `--exec-scene`.
2. **Créer Profil & Agent** — [Profils](./02-ressources/01-profils.md) puis [Agents](./02-ressources/02-agents.md).
3. **Créer Prompt / Exit / Script If** — [Prompts & Exit](./02-ressources/03-prompts-et-exit.md), [Scripts If](./02-ressources/04-scripts-if.md).
4. **Construire le scénario** — [Studio](./03-scenarios-et-moteur/01-studio-canvas.md) ou édition JSON.
5. **Exécuter et observer** — [Moteur & Terminal](./03-scenarios-et-moteur/03-moteur-et-execution.md), puis [exemples](./04-exemples-et-depannage/README.md).

## Sommaire

| Section                                                           | Contenu                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| [01 — Démarrage](./01-demarrage/README.md)                        | Installation, lancement serveur / headless, arborescence et `.env` |
| [02 — Ressources](./02-ressources/README.md)                      | Profils, agents, prompts, exit, scripts If                         |
| [03 — Scénarios & moteur](./03-scenarios-et-moteur/README.md)     | Studio, schéma des 6 blocs, règles d'exécution, export doc         |
| [04 — Exemples & dépannage](./04-exemples-et-depannage/README.md) | Bundle clé en main, patterns avancés, FAQ                          |

## Frontière documentaire

| Emplacement          | Public                      | Exporté vers `.agents/docs/` ?                   |
| -------------------- | --------------------------- | ------------------------------------------------ |
| `docs/instructions/` | Opérateurs et IA            | Oui (bouton _Enregistrer dans le dossier local_) |
| `docs/deploy/`       | Build / déploiement interne | Non                                              |
