# Workflow complet clé en main

Bundle réaliste : **Générer → Vérifier via `If` → (OK : `Command` de tests) ou (KO : `ClearContext` + Corriger)**.

> Important moteur : un bloc `command` qui sort avec un code ≠ 0 met le scénario en **erreur** et **n'émet pas** vers l'aval. Pour un aiguillage Vrai/Faux, faites porter la décision à un `If` sur la sortie d'un `Run` (ou à un script qui lit un fichier produit par une commande qui sort toujours en `0`).

## Schéma logique du flux

```text
[Start]
   | key=0
   v
[Run: prompt-coder / exit-termine]
   | key=0
   v
[If: tests-ok]  (inspecte sac["0"].value du Run)
    |                         \
    | port 0 (Vrai)            \ port 1 (Faux)
    v                           v
[Command: npm test]      [ClearContext: agent-dev]
                                    |
                                    v
                          [Run: prompt-corriger]
```

## Arborescence des fichiers à créer

```text
.agents/data/
├── profils/profil-dev.json
├── agents/agent-dev.json
├── prompts/prompt-coder.json
├── prompts/prompt-corriger.json
├── exit/exit-termine.json
├── if/tests-ok.js
└── scenarios/demo-dev-test.json
```

## Contenu complet et copiable

### `.agents/data/profils/profil-dev.json`

```json
{
  "id": "profil-dev",
  "name": "Développeur",
  "systemPrompt": "Tu es un développeur senior. Modifie uniquement les fichiers nécessaires. Sois concis.",
  "policy": "chaque_prompt"
}
```

### `.agents/data/agents/agent-dev.json`

```json
{
  "id": "agent-dev",
  "name": "Agent Dev",
  "profilId": "profil-dev",
  "cliId": "cursor-cli"
}
```

Adaptez `cliId` (`antigravity` / `codex-cli`) et ajoutez `model` si besoin.

### `.agents/data/prompts/prompt-coder.json`

```json
{
  "id": "prompt-coder",
  "name": "Générer",
  "content": "Implémente la fonction demandée dans le workspace.\nSi tout est correct, inclus le mot OK dans ta réponse."
}
```

### `.agents/data/prompts/prompt-corriger.json`

```json
{
  "id": "prompt-corriger",
  "name": "Corriger",
  "content": "La génération précédente n'est pas valide. Corrige le code et inclus OK si c'est bon."
}
```

### `.agents/data/exit/exit-termine.json`

```json
{
  "id": "exit-termine",
  "name": "Fin TERMINE",
  "content": "Quand tu as terminé, réponds exactement : TERMINE"
}
```

### `.agents/data/if/tests-ok.js`

```js
export default function (sac) {
  const text = sac['0']?.value;
  return typeof text === 'string' && text.includes('OK');
}
```

### `.agents/data/scenarios/demo-dev-test.json`

```json
{
  "id": "demo-dev-test",
  "name": "Démo Dev + Tests",
  "description": "Générer → If(OK) → npm test | sinon ClearContext + corriger",
  "nodes": [
    { "id": "n-start", "type": "start", "position": { "x": 40, "y": 200 } },
    {
      "id": "n-coder",
      "type": "run",
      "position": { "x": 280, "y": 200 },
      "agentId": "agent-dev",
      "promptId": "prompt-coder",
      "exitId": "exit-termine"
    },
    {
      "id": "n-if",
      "type": "if",
      "position": { "x": 560, "y": 200 },
      "ifScriptId": "tests-ok"
    },
    {
      "id": "n-test",
      "type": "command",
      "position": { "x": 840, "y": 120 },
      "commandLine": "npm test --silent"
    },
    {
      "id": "n-clear",
      "type": "clearContext",
      "position": { "x": 840, "y": 320 },
      "agentId": "agent-dev"
    },
    {
      "id": "n-fix",
      "type": "run",
      "position": { "x": 1120, "y": 320 },
      "agentId": "agent-dev",
      "promptId": "prompt-corriger",
      "exitId": "exit-termine"
    }
  ],
  "connections": [
    {
      "sourceNodeId": "n-start",
      "sourcePortIndex": 0,
      "targetNodeId": "n-coder",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-coder",
      "sourcePortIndex": 0,
      "targetNodeId": "n-if",
      "targetPortIndex": 0,
      "key": "0"
    },
    {
      "sourceNodeId": "n-if",
      "sourcePortIndex": 0,
      "targetNodeId": "n-test",
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

## Exécution et vérification

1. Studio : `#/scenarios` → ouvrir `demo-dev-test` → **Lancer**
2. CLI :

```bash
node clientsbox.js --exec-scene demo-dev-test
```

Code retour attendu en succès : `0`.
