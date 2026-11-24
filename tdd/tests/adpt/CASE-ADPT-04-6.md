# CASE-ADPT-04-6 — Création de session conversationnelle Antigravity par amorce stream-json et reprise multi-runs

**Spécification :** `SPEC-ADPT-04`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-ADPT-04-6`, `AC-ADPT-03-2`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

---

## Ce que ce cas protège

Lorsqu'un agent utilisant l'adaptateur Antigravity CLI s'exécute dans un scénario, sa mémoire conversationnelle doit être préservée entre les différents blocs `Run` successifs de cet agent au sein d'une même exécution.  
Afin d'éviter tout gaspillage de tokens LLM et toute latence superflue au démarrage causée par un prompt artificiel `ping`, la session est capturée **dynamiquement au premier Run réel** (alignement avec l'architecture de session Codex) :

Ce cas garantit :
1. **Zéro probe préalable / Économie de tokens :** Au premier Run de l'agent, la commande est lancée directement avec le vrai prompt utilisateur en mode initial (`agy --dangerously-skip-permissions --output-format stream-json --print <vrai_prompt>`), sans exécuter de pré-amorce `ping`.
2. **Capture dynamique de session (`extractSessionId`) :** Dès la première ligne émise sur stdout portant `conversation_id` (notamment dans l'événement `init` ou `step_update`), la méthode `extractSessionId(line)` extrait le `conversation_id` qui est immédiatement enregistré dans la table de session du scénario (`ScenarioSessionRegistry`).
3. **Reprise multi-runs fluide (`--conversation`) :** Les blocs `Run` subséquents du même agent dans ce scénario reçoivent automatiquement ce `conversation_id` et construisent la commande de reprise avec `--conversation <conversation_id>`.
4. **Renouvellement sur ClearContext :** Après un bloc `ClearContext`, la session est oubliée en mémoire vive. Le Run suivant réamorce un nouveau fil directement avec son prompt et capture le nouveau `conversation_id`.
5. **Résilience de la méthode de secours `createSession` :** `createSession` reste testée et opérationnelle en fallback unitaire avec terminaison ordonnée.

---

## Cas

```gherkin
Étant donné une ligne de démarrage Antigravity sur stdout :
  '{"event":"init","conversation_id":"0192e5a4-9b2c-7b00-8123-abcdef012345","init":{"cwd":"/tmp/demo","tools":[]}}'
Quand "adapter.extractSessionId(line)" est exécuté
Alors l'identifiant extrait est strictement "0192e5a4-9b2c-7b00-8123-abcdef012345"

Étant donné une ligne sans conversation_id :
  '{"event":"ping"}'
Quand "adapter.extractSessionId(line)" est exécuté
Alors la méthode retourne null

Étant donné un environnement où le binaire Antigravity retourne sur stdout la ligne d'initialisation suivante et se termine avec code 0 :
  """
  {"event":"init","conversation_id":"0192e5a4-9b2c-7b00-8123-abcdef012345","init":{"cwd":"/tmp/demo","tools":[]}}
  """
Quand "adapter.createSession(ctx)" est exécuté
Alors la promesse résout l'identifiant "0192e5a4-9b2c-7b00-8123-abcdef012345"
Et le sous-processus enfant d'amorce se termine proprement sans signal d'arrêt forcé

Étant donné un processus d'amorce qui se ferme avec code 0 sans avoir émis aucun "conversation_id"
Quand "adapter.createSession(ctx)" est exécuté
Alors la promesse est rejetée avec une erreur explicite contenant "Échec de création de session Antigravity : aucun identifiant retourné"

Étant donné un processus d'amorce qui se ferme avec un code de sortie non nul (ex: code 2)
Quand "adapter.createSession(ctx)" est exécuté
Alors la promesse est rejetée avec une erreur explicite contenant "code d'erreur 2"

Étant donné un processus d'amorce qui ne répond pas et dépasse le délai de 15 000 ms
Quand "adapter.createSession(ctx)" est exécuté
Alors la promesse est rejetée avec une erreur explicite mentionnant le délai dépassé
Et le sous-processus est interrompu

Étant donné un scénario exécutant Start -> Run-1(agent-agy) -> Run-2(agent-agy)
Quand le scénario est exécuté
Alors Run-1 s'exécute en mode initial sans sessionId avec "--output-format stream-json"
Et son identifiant "conversation_id" est capturé dès la première ligne émise
Et Run-2 s'exécute avec "--conversation" en réutilisant exactement cet identifiant
Et aucun appel préalable avec le prompt artificiel "ping" n'a été exécuté

Étant donné un scénario Start -> Run-1(agent-agy) -> ClearContext(agent-agy) -> Run-2(agent-agy) -> Run-3(agent-agy)
Quand le scénario est exécuté
Alors Run-1 capture une première session
Et après le bloc ClearContext, la session est oubliée
Et Run-2 s'exécute à nouveau en mode initial et capture un nouvel identifiant distinct
Et Run-3 reprend ce nouvel identifiant via "--conversation"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Binaire invoqué pour l'amorce | `<ANTIGRAVITY_CLI_BIN>` |
| Arguments d'amorce | `["--dangerously-skip-permissions", "--output-format", "stream-json", "-p", "ping"]` |
| Événement déclencheur de kill | Détection d'un champ `conversation_id` sous forme de chaîne non vide |
| Délai de timeout de sécurité | `15 000 ms` |
| Signal d'arrêt immédiat | `SIGTERM` / `killProcessSafely` |
| Répertoire d'exécution | `ctx.workspacePath` |

---

## Résultat attendu, calculé à la main

| Situation | Sortie attendue | Calcul |
|---|---|---|
| Réception ligne `init` avec UUID | UUID extrait, promesse résolue, kill déclenché | `0192e5a4-9b2c-7b00-8123-abcdef012345` |
| Flux terminé sans UUID | Exception levée | Erreur en français `"Échec de création de session Antigravity..."` |
| Timeout dépassé (> 15000 ms) | Exception levée, kill forcé | Erreur en français `"Délai d'initialisation de session Antigravity dépassé..."` |
| 2 Runs consécutifs même agent | Même `sessionId` dans `--conversation` | Session de scénario réutilisée (`SPEC-ADPT-03`) |
| ClearContext intermédiaire | 2 appels `createSession`, sessions distinctes | Renouvellement mémoire conforme (`SPEC-ADPT-03`) |

