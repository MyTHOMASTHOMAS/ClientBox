# Patterns d'orchestration avancés

Quatre architectures réutilisables (schéma logique + extraits).

---

## Pattern 1 — Boucle de correction avec `ClearContext`

```text
Run (générer) → If → (Faux) ClearContext → Run (corriger)
                  └→ (Vrai) fin
```

Extraits :

```json
{
  "id": "n-clear",
  "type": "clearContext",
  "position": { "x": 900, "y": 300 },
  "agentId": "agent-dev"
}
```

```js
// if/besoin-correction.js
export default function (sac) {
  const text = sac['0']?.value;
  return typeof text === 'string' && text.includes('OK');
}
```

Branchez le port `1` (Faux) vers `ClearContext`, puis vers un second `Run` avec un prompt de correction. Utile avec `policy: "une_fois_jusqu_a_clear"`.

---

## Pattern 2 — Parallélisme et synchronisation (Join N = 2)

Deux branches `Run` en parallèle réunies sur un `If` avec **clés nommées**.

```text
          ┌→ Run analyse  ── key=analyse ─┐
Start ────┤                               ├→ If (Join N=2)
          └→ Run securite ── key=securite ┘
```

Connexions :

```json
[
  {
    "sourceNodeId": "n-analyse",
    "sourcePortIndex": 0,
    "targetNodeId": "n-if",
    "targetPortIndex": 0,
    "key": "analyse"
  },
  {
    "sourceNodeId": "n-securite",
    "sourcePortIndex": 0,
    "targetNodeId": "n-if",
    "targetPortIndex": 0,
    "key": "securite"
  }
]
```

Script :

```js
export default function (sac) {
  const a = sac.analyse?.value;
  const s = sac.securite?.value;
  return typeof a === 'string' && typeof s === 'string' && a.includes('OK') && s.includes('OK');
}
```

Le `If` ne se déclenche que lorsque **les deux** messages sont arrivés avec `power: 1`.

---

## Pattern 3 — Pipeline hybride IA + Shell (`Command`)

```text
Start → Run (générer) → Command (npm test / linter) → …
```

```json
{
  "id": "n-lint",
  "type": "command",
  "position": { "x": 700, "y": 200 },
  "commandLine": "npm run lint"
}
```

Rappels :

- `commandLine` non vide après trim
- Code ≠ 0 → erreur du bloc / scénario (pas d'émission aval)
- Pour un aiguillage post-tests, préférez un script `If` qui lit un artefact disque produit par une commande à sortie `0`, ou un marqueur dans la sortie du `Run`

---

## Pattern 4 — Modularisation par sous-scénarios (`CallScenario`)

```text
Start → CallScenario(sous-pipeline) → Run (synthèse)
```

```json
{
  "id": "n-call",
  "type": "callScenario",
  "position": { "x": 400, "y": 200 },
  "targetScenarioId": "sous-pipeline"
}
```

- Auto-appel autorisé (récursion)
- Sessions isolées dans le sous-runner
- Plafond : `CALL_SCENARIO_MAX_DEPTH` (`-1` = illimité)
- Aucun paramètre métier transmis au sous-scénario (propagation `power` uniquement)
