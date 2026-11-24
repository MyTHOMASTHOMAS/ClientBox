# Schéma scénario & contrat des 6 blocs

Référence de `.agents/data/scenarios/<id>.json`.

## Structure racine

| Champ         | Type    | Obligatoire | Description                        |
| ------------- | ------- | ----------- | ---------------------------------- |
| `id`          | string  | oui         | = nom du fichier                   |
| `name`        | string  | oui         | Libellé affiché                    |
| `description` | string  | non         | Description libre (UI / templates) |
| `nodes`       | tableau | oui         | Nœuds du graphe                    |
| `connections` | tableau | oui         | Connexions orientées               |
| `metadata`    | objet   | non         | Ex. `viewport: { x, y, zoom }`     |

## Structure commune d'un nœud (`Node`)

| Champ      | Type       | Notes                     |
| ---------- | ---------- | ------------------------- |
| `id`       | string     | Unique dans le scénario   |
| `type`     | enum       | Un des 6 types ci-dessous |
| `position` | `{ x, y }` | Coordonnées canvas        |
| `label`    | string     | Optionnel                 |

### Champs interdits à la persistance

Ne **jamais** écrire de champ runtime dans le JSON :

- `status` est exclu par `SCENARIO_NODE_NO_SAVE_KEYS` et retiré à la lecture / écriture

---

## Contrat détaillé des 6 types de blocs

### `start`

|          |                                                 |
| -------- | ----------------------------------------------- |
| Rôle     | Point d'entrée unique du graphe                 |
| Entrées  | 0 (connexions entrantes interdites)             |
| Sorties  | 1 (port `0`)                                    |
| Champs   | `label?`                                        |
| Émission | `{ blockType: "start", value: null, power: 1 }` |

```json
{ "id": "node-start", "type": "start", "position": { "x": 80, "y": 180 } }
```

### `run`

|          |                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------- |
| Rôle     | Exécuter un agent CLI (mission + ordre de sortie optionnel)                                       |
| Entrées  | N ≥ 1 connexions (Join)                                                                           |
| Sorties  | 1 (port `0`)                                                                                      |
| Champs   | `agentId` (requis au runtime), `promptId?`, `exitId?`                                             |
| Émission | `{ blockType: "run", value: "<sortie CLI complète>", power: 1 }` après fin naturelle du processus |

```json
{
  "id": "node-coder",
  "type": "run",
  "position": { "x": 440, "y": 180 },
  "agentId": "agent-dev",
  "promptId": "prompt-coder",
  "exitId": "exit-termine"
}
```

### `if`

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Rôle     | Branchement selon un script JS                                            |
| Entrées  | N ≥ 1                                                                     |
| Sorties  | 2 — port `0` = Vrai, port `1` = Faux                                      |
| Champs   | `ifScriptId` (requis)                                                     |
| Émission | `power: 1` sur la branche choisie, `power: 0` sur l'autre (`value: null`) |

```json
{
  "id": "node-if",
  "type": "if",
  "position": { "x": 800, "y": 180 },
  "ifScriptId": "tests-ok"
}
```

### `clearContext`

|          |                                                        |
| -------- | ------------------------------------------------------ |
| Rôle     | Réinitialiser la session conversationnelle d'un agent  |
| Entrées  | N ≥ 1                                                  |
| Sorties  | 1 (port `0`)                                           |
| Champs   | `agentId` (requis)                                     |
| Émission | `{ blockType: "clearContext", value: null, power: 1 }` |

```json
{
  "id": "node-clear",
  "type": "clearContext",
  "position": { "x": 800, "y": 320 },
  "agentId": "agent-dev"
}
```

### `command`

|          |                                                                              |
| -------- | ---------------------------------------------------------------------------- |
| Rôle     | Exécuter une commande shell dans le workspace                                |
| Entrées  | N ≥ 1                                                                        |
| Sorties  | 1 (port `0`)                                                                 |
| Champs   | `commandLine` **obligatoire**, non vide après trim                           |
| Émission | `{ blockType: "command", value: null, power: 1 }` si code `0` ; sinon erreur |

```json
{
  "id": "node-test",
  "type": "command",
  "position": { "x": 620, "y": 180 },
  "commandLine": "npm test"
}
```

### `callScenario`

|          |                                                                          |
| -------- | ------------------------------------------------------------------------ |
| Rôle     | Lancer un sous-scénario in-process                                       |
| Entrées  | N ≥ 1                                                                    |
| Sorties  | 1 (port `0`)                                                             |
| Champs   | `targetScenarioId` (requis, non vide) — **auto-appel autorisé**          |
| Émission | `{ blockType: "callScenario", value: null, power: 1 }` après `completed` |

```json
{
  "id": "node-call",
  "type": "callScenario",
  "position": { "x": 1000, "y": 180 },
  "targetScenarioId": "sous-pipeline"
}
```

Garde-fou : `CALL_SCENARIO_MAX_DEPTH` (`-1` = illimité).

---

## Structure d'une connexion (`Connection`)

| Champ             | Type   | Description                                                   |
| ----------------- | ------ | ------------------------------------------------------------- |
| `sourceNodeId`    | string | Nœud source                                                   |
| `sourcePortIndex` | number | Port de sortie (`0`, ou `1` pour branche Faux d'un `if`)      |
| `targetNodeId`    | string | Nœud cible                                                    |
| `targetPortIndex` | number | Port d'entrée (généralement `0`)                              |
| `key`             | string | Clé non vide, unique parmi les entrées du même `targetNodeId` |

Aliases historiques acceptés en lecture : `from` / `to` / `outputPort`.

```json
{
  "sourceNodeId": "node-start",
  "sourcePortIndex": 0,
  "targetNodeId": "node-coder",
  "targetPortIndex": 0,
  "key": "0"
}
```

## Invariants de validation topologique

| Règle                                                   | Message typique                                   |
| ------------------------------------------------------- | ------------------------------------------------- |
| Exactement 1 `start`                                    | Start absent / plusieurs Start détectés           |
| Degré entrant du `start` = 0                            | Connexion entrante vers le Start interdite (R-20) |
| Références de nœuds valides                             | Nœud source / cible inexistant                    |
| `key` non vide + unique par cible                       | Clé invalide / collision de clé                   |
| `sourcePortIndex` = `0` sauf `if` (`0` Vrai / `1` Faux) | —                                                 |
| `commandLine` non vide sur tout `command`               | `commandLine` vide ou manquant (REQ-043)          |
| `targetScenarioId` non vide sur tout `callScenario`     | `targetScenarioId` vide ou manquant (REQ-041)     |

---

## Exemple complet (6 types de blocs)

```json
{
  "id": "demo-six-blocs",
  "name": "Démo 6 blocs",
  "description": "Start → Run → Command → If → (Vrai: CallScenario | Faux: ClearContext → Run)",
  "nodes": [
    { "id": "n-start", "type": "start", "position": { "x": 40, "y": 200 } },
    {
      "id": "n-run",
      "type": "run",
      "position": { "x": 280, "y": 200 },
      "agentId": "agent-dev",
      "promptId": "prompt-coder",
      "exitId": "exit-termine"
    },
    {
      "id": "n-cmd",
      "type": "command",
      "position": { "x": 520, "y": 200 },
      "commandLine": "npm test --silent"
    },
    {
      "id": "n-if",
      "type": "if",
      "position": { "x": 760, "y": 200 },
      "ifScriptId": "tests-ok"
    },
    {
      "id": "n-call",
      "type": "callScenario",
      "position": { "x": 1000, "y": 120 },
      "targetScenarioId": "sous-pipeline"
    },
    {
      "id": "n-clear",
      "type": "clearContext",
      "position": { "x": 1000, "y": 280 },
      "agentId": "agent-dev"
    },
    {
      "id": "n-fix",
      "type": "run",
      "position": { "x": 1240, "y": 280 },
      "agentId": "agent-dev",
      "promptId": "prompt-corriger",
      "exitId": "exit-termine"
    }
  ],
  "connections": [
    {
      "sourceNodeId": "n-start",
      "sourcePortIndex": 0,
      "targetNodeId": "n-run",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-run",
      "sourcePortIndex": 0,
      "targetNodeId": "n-cmd",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-cmd",
      "sourcePortIndex": 0,
      "targetNodeId": "n-if",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-if",
      "sourcePortIndex": 0,
      "targetNodeId": "n-call",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-if",
      "sourcePortIndex": 1,
      "targetNodeId": "n-clear",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-clear",
      "sourcePortIndex": 0,
      "targetNodeId": "n-fix",
      "targetPortIndex": 0,
      "key": "0"
    }
  ]
}
```
