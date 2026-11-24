# Règles du moteur & Terminal live

Comment le moteur exécute le graphe et comment piloter / observer un run.

## Règle des blocs orphelins (N = 0)

Tout bloc **hors** `start` sans aucune connexion entrante est **strictement inactif** : jamais déclenché, reste `Inactif` (`idle`).

## Barrière de Join (N ≥ 1) et mécanique de `power`

Pour un bloc cible avec N connexions entrantes :

1. Tant qu'au moins une entrée n'a pas reçu de message → `waiting`
2. Quand les N messages sont présents :
   - si ∑ `power` = N → **`trigger`** (le bloc s'exécute)
   - sinon → **`pause`** (`En pause`) — typiquement une branche `If` inactive a envoyé `power: 0`

Écrasement Last-Write-Wins : un nouveau message sur la même `key` remplace le précédent (utile en boucle).

## Distribution binaire d'un bloc `If`

Le `If` émet **toujours sur les deux branches** :

| Branche | Port | `power` si condition vraie | `power` si condition fausse |
| ------- | ---: | -------------------------: | --------------------------: |
| Vrai    |  `0` |                        `1` |                         `0` |
| Faux    |  `1` |                        `0` |                         `1` |

Ainsi l'aval de la branche non prise passe en `En pause` au lieu d'attendre indéfiniment.

## Assemblage des prompts et gestion du contexte

- Format : `systemPrompt + "\n\n" + userPrompt` selon la `policy` du profil (voir [Profils](../02-ressources/01-profils.md))
- Modèle effectif : `agent.model` (champ agent)
- **`ClearContext`** : oublie la session mémoire de l'agent ciblé et réarme la politique `une_fois_jusqu_a_clear` ; **ne** tue **pas** un `Run` déjà en cours ; pas de bouton clear manuel séparé dans l'UI

## Exécution de `Command` et `CallScenario`

### `Command`

- Shell OS (`shell: true`) dans le workspace
- Succès uniquement si code de sortie `0`
- Stop global interrompt le processus (sur Windows : `taskkill /T /F` puis signal)

### `CallScenario`

- Sous-runner in-process rattaché à l'identité du run racine
- Sessions / politiques d'injection du sous-scénario **isolées**
- Aucun paramètre métier transmis (propagation `power` uniquement)
- Garde-fou : `CALL_SCENARIO_MAX_DEPTH` (`-1` = illimité)
- Auto-appel (récursion) autorisé

## Pilotage UI et Terminal live (SSE)

### Boutons

| Action           | Effet                                   |
| ---------------- | --------------------------------------- |
| **Lancer**       | Valide le graphe puis démarre le runner |
| **Arrêter tout** | Stop des processus actifs               |

Séquence Stop sur un `Run` :

1. `SIGTERM` immédiat
2. Si le processus vit encore après **3000 ms** → `SIGKILL`
3. Les sessions conversationnelles CLI **ne sont pas** effacées

### Badges d'état des blocs

| Libellé UI | Statut interne |
| ---------- | -------------- |
| Inactif    | `idle`         |
| En cours   | `running`      |
| En pause   | `paused`       |
| Terminé    | `completed`    |
| Erreur     | `error`        |

### Terminal live (SSE)

- Endpoints : `GET /api/scenarios/:id/stream` (et flux global `/api/stream`)
- Filtres, recherche, auto-scroll
- Tampon mémoire circulaire de **5000** lignes
- **Aucun log écrit sur disque**
- Recharger la page vide le terminal ; les statuts de blocs peuvent être restaurés selon l'état serveur

Événements principaux : `chunkReceived`, `blockStatusChanged`, `statusChanged`.
