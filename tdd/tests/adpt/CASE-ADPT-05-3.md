# CASE-ADPT-05-3 — Décodage résilient des flux `parseStreamLine` et extraction stricte de réponse `parseOutput` Codex

**Spécification :** `SPEC-ADPT-05`  
**Critère d'acceptation :** `AC-ADPT-05-4`, `AC-ADPT-05-6`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

Le CLI Codex émet ses sorties sur stdout au format JSONL lorsqu'il est invoqué avec le drapeau `--json`.  
1. La méthode `parseStreamLine(line: string)` de `CodexCLIAdapter` doit :
   - Intercepter sans erreur les événements structurés de Codex, en particulier l'événement `item.completed` portant un item de type `agent_message` avec son champ `text`.
   - Gérer la rétro-compatibilité avec les formats `{ type: 'text', content: '...' }`.
   - Assurer un repli gracieux universel vers `{ type: 'stdout', chunk: line }` en présence de texte brut, de messages informatifs ou de JSON corrompu/tronqué, sans jamais lever d'exception.
2. La méthode `parseOutput(rawOutput: string)` de `CodexCLIAdapter` doit :
   - Analyser la sortie brute totale accumulée émise par le processus Codex (concaténation de lignes JSONL).
   - Extraire **exclusivement** le texte produit par l'agent (`item.text` dans `item.completed` où `item.type === 'agent_message'`).
   - Éliminer strictement toutes les lignes de métadonnées et événements de contrôle (`thread.started`, `turn.started`, `turn.completed`, `usage`, etc.) afin que les sorties transmises au SAC, aux blocs avals (ex: blocs `If`) et aux conditions de sortie ne contiennent aucun déchet technique JSON.
   - En présence de texte brut ou de contenu non-JSON, restituer le texte brut tel quel.
3. Pour `CursorCLIAdapter` et `AntigravityCLIAdapter`, `parseOutput` restitue l'entrée brute sans altération (fonction identité).

---

## Cas

```gherkin
Étant donné une ligne JSONL d'événement agent_message :
  '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"Refactoring achevé avec succès."}}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: 'stdout', chunk: 'Refactoring achevé avec succès.' }

Étant donné une ligne JSONL informative de démarrage :
  '{"type":"thread.started","thread_id":"01a1c467-d234-7020-9cff-1d6cbdfeb8ca"}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors la ligne est restituée sous forme de flux brut { type: 'stdout', chunk: line }

Étant donné une ligne JSONL au format générique :
  '{"type":"text","content":"Contenu textuel format universel"}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: 'stdout', chunk: 'Contenu textuel format universel' }

Étant donné une ligne de texte brut non-JSON :
  'Reading additional input from stdin...'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: 'stdout', chunk: 'Reading additional input from stdin...' }

Étant donné une ligne JSON tronquée ou corrompue :
  '{"type":"item.completed","item":'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors aucune exception n'est levée et l'événement retourné est { type: 'stdout', chunk: line }

Étant donné une sortie brute multi-lignes Codex contenant :
  """
  {"type":"thread.started","thread_id":"01a1c505-6055-7893-a918-21c4e1a722e1"}
  {"type":"turn.started"}
  {"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"4721"}}
  {"type":"turn.completed","usage":{"input_tokens":42900,"output_tokens":33}}
  """
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la chaîne retournée est strictement "4721"

Étant donné une sortie brute en texte pur "Code généré proprement"
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la chaîne retournée est strictement "Code généré proprement"
```

---

## Données

| Ligne testée | Description |
|---|---|
| `{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"OK"}}` | Événement nominal de message final d'agent |
| `{"type":"thread.started","thread_id":"uuid-123"}` | Événement système de début de thread |
| `{"type":"text","content":"Bonjour"}` | Format universel rétro-compatible |
| `Reading additional input from stdin...` | Ligne de statut brute |
| `{"invalid_json` | JSON syntaxiquement corrompu |
| Flux multi-lignes Codex JSONL avec message `"4721"` | Sortie complète accumulée d'un bloc Run Codex |

---

## Résultat attendu, calculé à la main

| Entrée | Méthode appelée | Résultat attendu |
|---|---|---|
| Message agent `item.completed` | `parseStreamLine` | `{ type: 'stdout', chunk: "OK" }` |
| Événement système `thread.started` | `parseStreamLine` | Ligne brute complète |
| Format universel `content` | `parseStreamLine` | `{ type: 'stdout', chunk: "Bonjour" }` |
| Texte brut stdout | `parseStreamLine` | `{ type: 'stdout', chunk: "Reading..." }` |
| JSON invalide | `parseStreamLine` | Ligne brute sans exception |
| Flux JSONL complet avec `text: "4721"` | `parseOutput` | `"4721"` (épuré de tout JSON) |
| Texte pur `"4721"` | `parseOutput` (Cursor / Antigravity / Codex fallback) | `"4721"` (identique) |

---

## Ce que ce cas ne vérifie pas

- L'assemblage de la commande de lancement → `CASE-ADPT-05-2` ;
- L'amorce de session → `CASE-ADPT-05-5`.

