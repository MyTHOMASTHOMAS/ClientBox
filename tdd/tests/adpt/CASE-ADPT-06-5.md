# CASE-ADPT-06-5 — Gestion de session conversationnelle Claude au premier Run sans amorce ping et reprise multi-runs

**Spécification :** `SPEC-ADPT-06`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-ADPT-06-7`, `AC-ADPT-03-2`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

---

## Ce que ce cas protège

Lorsqu'un agent utilisant l'adaptateur Claude CLI s'exécute dans un scénario, sa mémoire conversationnelle doit être préservée entre les différents blocs `Run` successifs de cet agent au sein d'une même exécution.  
Afin d'éviter tout gaspillage de jetons LLM et toute latence superflue au démarrage causée par un prompt artificiel `ping`, la session est capturée **dynamiquement au premier Run réel** (pattern de capture paresseuse / *lazy capture*) :

Ce cas garantit :
1. **Zéro probe préalable / Économie de tokens :** Au premier Run de l'agent (`ctx.sessionId` absent), la commande est lancée directement avec le vrai prompt utilisateur en mode initial (`claude --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions "<prompt>"`), sans exécuter de pré-amorce `ping` ni injecter `--resume` ou `--session-id`.
2. **Capture dynamique de session (`extractSessionId`) :** Dès la première ligne émise sur stdout portant `type: "system"` et `subtype: "init"`, la méthode `extractSessionId(line)` extrait le `session_id` qui est immédiatement enregistré dans la table de session du scénario (`ScenarioSessionRegistry`).
3. **Reprise multi-runs fluide (`--resume`) :** Les blocs `Run` subséquents du même agent dans ce scénario reçoivent automatiquement ce `sessionId` et construisent la commande de reprise `claude --resume <sessionId> ...`.
4. **Renouvellement sur ClearContext :** Après un bloc `ClearContext`, la session est oubliée en mémoire vive. Le Run suivant réamorce un nouveau fil directement avec son prompt et capture le nouveau `session_id`.
5. **Robustesse de l'extracteur :** `extractSessionId` extrait sans faille les identifiants valides et renvoie `null` pour les lignes non pertinentes ou le texte brut.

---

## Cas

```gherkin
Étant donné une ligne de démarrage Claude sur stdout :
  '{"type":"system","subtype":"init","session_id":"session_01j83abc123"}'
Quand "adapter.extractSessionId(line)" est exécuté
Alors l'identifiant extrait est strictement "session_01j83abc123"

Étant donné une ligne d'événement sans identifiant de session :
  '{"type":"stream_event","event":{"type":"content_block_delta"}}'
Quand "adapter.extractSessionId(line)" est exécuté
Alors la méthode retourne null

Étant donné un scénario exécutant Start -> Run-1(agent-claude) -> Run-2(agent-claude)
Quand le scénario est exécuté
Alors Run-1 s'exécute en mode initial sans sessionId
Et son identifiant "session_id" est capturé dès la première ligne émise
Et Run-2 s'exécute avec l'argument "--resume session_01j83abc123" en réutilisant exactement cet identifiant
Et aucun appel préalable avec le prompt artificiel "ping" n'a été exécuté

Étant donné un scénario Start -> Run-1(agent-claude) -> ClearContext(agent-claude) -> Run-2(agent-claude) -> Run-3(agent-claude)
Quand le scénario est exécuté
Alors Run-1 capture une première session
Et après le bloc ClearContext, la session est oubliée
Et Run-2 s'exécute à nouveau en mode initial et capture un nouvel identifiant distinct
Et Run-3 reprend ce nouvel identifiant en mode "--resume"

Étant donné un appel direct à la méthode d'amorce "adapter.createSession(ctx)" avec un mock répondant immédiatement l'événement init
Quand "createSession" est exécuté
Alors la promesse résout avec le "session_id" extrait dès la première ligne

Étant donné un appel direct à "adapter.createSession(ctx)" où le processus n'émet aucun session_id et se termine
Quand "createSession" est exécuté
Alors la promesse est rejetée avec une erreur explicite signalant l'absence d'identifiant de session

Étant donné un appel direct à "adapter.createSession(ctx)" où le processus dépasse le délai "CLAUDE_PROBE_TIMEOUT_MS"
Quand "createSession" est exécuté
Alors le sous-processus est interrompu (kill SIGTERM) et la promesse est rejetée pour dépassement de délai
```

---

## Données

| Élément | Valeur |
|---|---:|
| Événement déclencheur | Événement JSON `system` (`subtype: init`) portant le champ `session_id` |
| Délai de timeout de sécurité | `CLAUDE_PROBE_TIMEOUT_MS` (défaut : `15 000 ms`) |
| Répertoire d'exécution | `ctx.workspacePath` |

---

## Résultat attendu, calculé à la main

| Situation | Sortie attendue | Calcul |
|---|---|---|
| Ligne d'initialisation | `'session_01j83abc123'` | Extraction de `record.session_id` |
| Ligne de delta sans session | `null` | Absence de champ de session |
| 1er Run scénario | Commande sans `--resume` ni `--session-id` | Mode initial direct |
| 2nd Run scénario | Commande avec `['--resume', 'session_01j83abc123']` | Reprise du fil contextuel |
| Après ClearContext | Session effacée, nouvel amorçage | Nettoyage de mémoire vive |
| `createSession` nominal | `'session_01j83abc123'` | Résolution de la promesse dès l'amorce |
| `createSession` sans ID | Rejet avec message d'erreur | Absence de session_id dans le flux |
| `createSession` timeout | Rejet avec message de dépassement de délai | Expiration de `CLAUDE_PROBE_TIMEOUT_MS` |

---

## Ce que ce cas ne vérifie pas

- La conformité TypeScript générale de l'adaptateur → `CASE-ADPT-06-1` ;
- Le détail de construction des arguments → `CASE-ADPT-06-2` ;
- Le décodage et l'épuration de la réponse finale → `CASE-ADPT-06-3`.

