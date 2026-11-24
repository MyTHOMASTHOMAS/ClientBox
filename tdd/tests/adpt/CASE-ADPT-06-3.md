# CASE-ADPT-06-3 — Décodage résilient des flux `parseStreamLine` et extraction stricte de réponse `parseOutput` Claude

**Spécification :** `SPEC-ADPT-06`  
**Critère d'acceptation :** `AC-ADPT-06-4`, `AC-ADPT-06-6`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

Le CLI Claude émet ses sorties sur stdout au format JSONL lorsqu'il est invoqué avec `--output-format stream-json --verbose --include-partial-messages`.  
1. La méthode `parseStreamLine(line: string)` de `ClaudeCLIAdapter` doit :
   - Intercepter sans erreur les événements structurés de Claude Code, en particulier `stream_event` avec `content_block_delta` et `delta.type === 'text_delta'` (ou `delta.text`), pour restituer le fragment au fil de l'eau `{ type: 'stdout', chunk: delta.text }`.
   - Intercepter les événements `assistant` avec `message.content[].text` pour restituer le texte produit.
   - Assurer un repli gracieux universel vers `{ type: 'stdout', chunk: line }` en présence de texte brut, de messages informatifs système (`system`, `user`, `result`) ou de JSON corrompu/tronqué, sans jamais lever d'exception bloquante.
2. La méthode `parseOutput(rawOutput: string)` de `ClaudeCLIAdapter` doit :
   - Analyser la sortie brute totale accumulée émise par le processus Claude (concaténation de lignes JSONL).
   - Extraire **exclusivement** le texte produit par l'agent (en concaténant les deltas textuels ou les blocs `assistant`).
   - Éliminer strictement toutes les lignes de métadonnées et événements de contrôle (`system`, `user`, `tools`, `mcp_servers`, `result`) afin que les sorties transmises au SAC (`BlockMessage.value`), aux blocs avals (ex: blocs `If`) et aux ordres de sortie `exit` ne contiennent aucune scorie technique JSON.
   - En présence de texte brut ou de contenu non-JSON, restituer le texte brut tel quel.

---

## Cas

```gherkin
Étant donné une ligne JSONL d'événement content_block_delta :
  '{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Refactoring achevé."}}}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: 'stdout', chunk: 'Refactoring achevé.' }

Étant donné une ligne JSONL d'événement assistant :
  '{"type":"assistant","message":{"content":[{"type":"text","text":"Analyse validée."}]}}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: 'stdout', chunk: 'Analyse validée.' }

Étant donné une ligne JSONL informative de démarrage :
  '{"type":"system","subtype":"init","session_id":"session_01j83abc123"}'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors la ligne est restituée sous forme de flux brut { type: 'stdout', chunk: line }

Étant donné une ligne de texte brut non-JSON :
  'Warning: Experimental feature'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors l'événement retourné est { type: 'stdout', chunk: 'Warning: Experimental feature' }

Étant donné une ligne JSON tronquée ou corrompue :
  '{"type":"stream_event","event":'
Quand "adapter.parseStreamLine(line)" est exécuté
Alors aucune exception n'est levée et l'événement retourné est { type: 'stdout', chunk: line }

Étant donné une sortie brute multi-lignes Claude contenant :
  """
  {"type":"system","subtype":"init","session_id":"session_01j83abc123"}
  {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"Code "}}}
  {"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"4721"}}}
  {"type":"result","subtype":"success","result":"Code 4721"}
  """
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la chaîne retournée est strictement "Code 4721"

Étant donné une sortie brute en texte pur "Code généré proprement"
Quand "adapter.parseOutput(rawOutput)" est exécuté
Alors la chaîne retournée est strictement "Code généré proprement"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Événements de streaming reconnus | `stream_event` (`content_block_delta`), `assistant` (`message.content`) |
| Lignes ignorées dans le texte net | `system`, `user`, `result`, métadonnées de protocole |
| Repli d'erreur de parsing | `{ type: 'stdout', chunk: line }` |

---

## Résultat attendu, calculé à la main

| Situation | Sortie attendue | Calcul |
|---|---|---|
| Delta de texte | `{ type: 'stdout', chunk: '...' }` | Extraction directe de `delta.text` |
| Sortie accumulée JSONL | Texte net concaténé sans scories JSON | Purge des métadonnées système |
| Ligne JSON corrompue | Aucune exception levée | Fallback sur texte brut |

---

## Ce que ce cas ne vérifie pas

- La génération des commandes de spawn → `CASE-ADPT-06-2` ;
- L'énumération des modèles → `CASE-ADPT-06-4` ;
- La capture dynamique de session en scénario → `CASE-ADPT-06-5`.

