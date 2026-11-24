# CASE-ADPT-05-5 — Gestion de session conversationnelle Codex au premier Run sans amorce ping et reprise multi-runs

**Spécification :** `SPEC-ADPT-05`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-ADPT-05-6`, `AC-ADPT-05-7`, `AC-ADPT-03-2`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

---

## Ce que ce cas protège

Lorsqu'un agent utilisant l'adaptateur Codex CLI s'exécute dans un scénario, sa mémoire conversationnelle doit être préservée entre les différents blocs `Run` successifs de cet agent au sein d'une même exécution.  
Afin d'éviter tout gaspillage de jetons LLM (~28 000 tokens) et toute latence superflue au démarrage causée par un prompt artificiel `ping`, la session est capturée **dynamiquement au premier Run réel** :

Ce cas garantit :
1. **Zéro probe préalable / Économie de tokens :** Au premier Run de l'agent, la commande est lancée directement avec le vrai prompt utilisateur en mode initial (`codex exec --json ... <vrai_prompt>`), sans exécuter de pré-amorce `ping`.
2. **Capture dynamique de session (`extractSessionId`) :** Dès la première ligne émise sur stdout portant `thread.started`, la méthode `extractSessionId(line)` extrait le `thread_id` qui est immédiatement enregistré dans la table de session du scénario (`ScenarioSessionRegistry`).
3. **Reprise multi-runs fluide (`exec resume`) :** Les blocs `Run` subséquents du même agent dans ce scénario reçoivent automatiquement ce `thread_id` et construisent la commande de reprise `codex exec resume <thread_id> ...`.
4. **Renouvellement sur ClearContext :** Après un bloc `ClearContext`, la session est oubliée en mémoire vive. Le Run suivant réamorce un nouveau fil directement avec son prompt et capture le nouveau `thread_id`.
5. **Robustesse de l'extracteur :** `extractSessionId` extrait sans faille les UUID valides et renvoie `null` pour les lignes non pertinentes ou le texte brut.

---

## Cas

```gherkin
Étant donné une ligne de démarrage Codex sur stdout :
  '{"type":"thread.started","thread_id":"01a1c505-6055-7893-a918-21c4e1a722e1"}'
Quand "adapter.extractSessionId(line)" est exécuté
Alors l'identifiant extrait est strictement "01a1c505-6055-7893-a918-21c4e1a722e1"

Étant donné une ligne sans identifiant de session :
  '{"type":"turn.started"}'
Quand "adapter.extractSessionId(line)" est exécuté
Alors la méthode retourne null

Étant donné un scénario exécutant Start -> Run-1(agent-codex) -> Run-2(agent-codex)
Quand le scénario est exécuté
Alors Run-1 s'exécute en mode initial sans sessionId
Et son identifiant "thread_id" est capturé dès la première ligne émise
Et Run-2 s'exécute avec la commande "exec resume" en réutilisant exactement cet identifiant
Et aucun appel préalable avec le prompt artificiel "ping" n'a été exécuté

Étant donné un scénario Start -> Run-1(agent-codex) -> ClearContext(agent-codex) -> Run-2(agent-codex) -> Run-3(agent-codex)
Quand le scénario est exécuté
Alors Run-1 capture une première session
Et après le bloc ClearContext, la session est oubliée
Et Run-2 s'exécute à nouveau en mode initial et capture un nouvel identifiant distinct
Et Run-3 reprend ce nouvel identifiant en mode "exec resume"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Binaire invoqué pour l'amorce | `<CODEX_CLI_BIN>` |
| Arguments d'amorce | `["exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "ping"]` |
| Événement déclencheur | Événement JSON `thread.started` portant le champ `thread_id` |
| Délai de timeout de sécurité | `15 000 ms` |
| Répertoire d'exécution | `ctx.workspacePath` |

---

## Résultat attendu, calculé à la main

| Situation | Sortie attendue | Calcul |
|---|---|---|
| Réception ligne `thread.started` avec UUID | UUID extrait, promesse résolue après terminaison | `01a1c467-d234-7020-9cff-1d6cbdfeb8ca` |
| Flux terminé sans UUID | Exception levée | Erreur en français `"Échec de création de session Codex..."` |
| Timeout dépassé (> 15000 ms) | Exception levée, arrêt forcé | Erreur en français `"Délai d'initialisation de session Codex dépassé..."` |
| 2 Runs consécutifs même agent | Même `sessionId` dans `exec resume` | Session de scénario réutilisée (`SPEC-ADPT-03`) |
| ClearContext intermédiaire | 2 appels `createSession`, sessions distinctes | Renouvellement mémoire conforme (`SPEC-ADPT-03`) |

---

## Ce que ce cas ne vérifie pas

- La construction brute de `buildCommand` → `CASE-ADPT-05-2` ;
- Le streaming en temps réel des blocs Run → `CASE-ADPT-05-3`.

