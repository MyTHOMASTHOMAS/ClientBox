# CASE-ADPT-04-3 — Décodage résilient des flux de streaming dans `parseStreamLine`

**Spécification :** `SPEC-ADPT-04`  
**Critère d'acceptation :** `AC-ADPT-04-4`  
**Type :** acceptation  
**Niveau de risque :** moyen  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

La méthode `parseStreamLine(line: string)` de `AntigravityCLIAdapter` doit convertir toute ligne de sortie produite par le processus `agy` en un événement typé `AgentStreamEvent` (`SPEC-ADPT-01` / `SPEC-ADPT-04`).  
Ce cas garantit :
1. L'extraction du texte incrémental émis dans les flux NDJSON de type `step_update` portant une propriété `text_delta`.
2. L'extraction de la réponse finale émise dans les événements `result` portant `result.response` ou `response`.
3. Le décodage rétro-compatible des formats `{ type: 'text', content: '...' }`.
4. Le repli universel et silencieux sur la ligne brute `{ type: 'stdout', chunk: line }` en cas de chaîne non-JSON ou de JSON malformé, **sans jamais lever d'exception**.

---

## Cas

```gherkin
Étant donné une ligne NDJSON d'étape Antigravity :
  '{"event":"step_update","step_update":{"conversation_id":"c1","step_index":1,"state":"DONE","text_delta":"Bonjour le monde\n"}}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: "stdout", chunk: "Bonjour le monde\n" }

Étant donné une ligne NDJSON de résultat Antigravity :
  '{"event":"result","result":{"conversation_id":"c1","status":"SUCCESS","response":"Mission accomplie\n"}}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: "stdout", chunk: "Mission accomplie\n" }

Étant donné un objet JSON de fin d'exécution print standard :
  '{"conversation_id":"c1","status":"SUCCESS","response":"Texte simple\n"}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: "stdout", chunk: "Texte simple\n" }

Étant donné une ligne de texte brut non-JSON :
  "Fetching available models..."
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: "stdout", chunk: "Fetching available models..." }

Étant donné une chaîne JSON tronquée ou invalide :
  '{"event":"step_update","step_update":{'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: "stdout", chunk: "{\"event\":\"step_update\",\"step_update\":{" }
Et aucune exception n'est levée

Étant donné une sortie brute multi-lignes stream-json émise par Antigravity :
  """
  {"event":"init","conversation_id":"c-1"}
  {"event":"step_update","step_update":{"text_delta":"Calcul en cours..."}}
  {"event":"result","result":{"status":"SUCCESS","response":"42"}}
  """
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la méthode retourne strictement "42" sans métadonnée JSON

Étant donné une sortie brute multi-lignes ne contenant que des événements step_update :
  """
  {"event":"step_update","step_update":{"text_delta":"Partie 1\n"}}
  {"event":"step_update","step_update":{"text_delta":"Partie 2"}}
  """
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la méthode retourne strictement "Partie 1\nPartie 2"

Étant donné une sortie brute en texte pur non-JSON : "Texte brut direct"
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la méthode retourne fidèlement "Texte brut direct"
```

---

## Données

| Ligne en entrée | Type d'entrée | Extraction attendue |
|---|---|---|
| `{"event":"step_update","step_update":{"text_delta":"Bonjour"}}` | NDJSON step_update | `"Bonjour"` |
| `{"event":"result","result":{"response":"Fait"}}` | NDJSON result | `"Fait"` |
| `{"response":"Sortie finale"}` | JSON standard | `"Sortie finale"` |
| `{"type":"text","content":"Format Cursor"}` | Rétrocompatibilité | `"Format Cursor"` |
| `"Texte brut sur stdout"` | Texte brut | `"Texte brut sur stdout"` |
| `"{ malformed json"` | JSON corrompu | `"{ malformed json"` |

---

## Résultat attendu, calculé à la main

| Entrée | Sortie attendue `AgentStreamEvent` |
|---|---|
| Delta de streaming | `{ type: 'stdout', chunk: 'Bonjour' }` |
| Réponse résultat | `{ type: 'stdout', chunk: 'Fait' }` |
| Réponse simple | `{ type: 'stdout', chunk: 'Sortie finale' }` |
| Format texte standard | `{ type: 'stdout', chunk: 'Format Cursor' }` |
| Ligne brute | `{ type: 'stdout', chunk: 'Texte brut sur stdout' }` |
| Erreur syntaxe JSON | `{ type: 'stdout', chunk: '{ malformed json' }` (zéro exception) |

---

## Ce que ce cas ne vérifie pas

- L'accumulation du buffer dans le runner → `SPEC-ENG-04` ;
- L'évaluation des conditions d'arrêt sur le chunk → `SPEC-ENG-03`.

