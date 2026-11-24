# CASE-ADPT-03-2 — Session de scénario : réutilisation entre Runs et nouvelle session après ClearContext

**Spécification :** `SPEC-ADPT-03`, `SPEC-ENG-03`
**Critère d'acceptation :** `AC-ADPT-03-2`
**Type :** acceptation / intégration runner
**Niveau de risque :** critique
**Service / contrats cibles :** `SVC-001` (`ScenarioRunnerService`), `CLIAdapter.createSession`

## Ce que ce cas protège

Le but du moteur : **un agent garde sa mémoire tout au long du scénario, et ne la perd que sur un ClearContext** (`R-39`, `REQ-020`). Concrètement, le runner obtient une session par `createSession` au premier Run de l'agent, transmet le même `ctx.sessionId` à tous ses Runs suivants, et n'en recrée une qu'après un ClearContext ciblant cet agent.

Ce cas fait échouer :
- un runner qui crée une session à chaque Run (agent sans mémoire) ;
- un runner qui ne transmet pas `sessionId` à `buildCommand` ;
- un ClearContext qui ne fait que réarmer la politique d'injection sans changer de session ;
- un ClearContext qui oublie la session d'un **autre** agent.

## Cas

```gherkin
Étant donné un adapter simulé dont "createSession" retourne successivement "chat-1", "chat-2", "chat-3"
Et un scénario : Start --> Run-1(agent-a) --> Run-2(agent-a) --> Run-3(agent-b)
Quand le scénario est exécuté
Alors "createSession" est appelé 2 fois : pour agent-a puis pour agent-b
Et "buildCommand" reçoit sessionId "chat-1" pour Run-1 et Run-2
Et "buildCommand" reçoit sessionId "chat-2" pour Run-3

Étant donné le même adapter réinitialisé
Et un scénario : Start --> Run-1(agent-a) --> Run-b(agent-b) --> Clear(agent-a) --> Run-2(agent-a) --> Run-b2(agent-b)
Quand le scénario est exécuté
Alors "createSession" est appelé 3 fois
Et Run-1 reçoit "chat-1", Run-b reçoit "chat-2"
Et Run-2 reçoit "chat-3" (nouvelle session après le ClearContext)
Et Run-b2 reçoit toujours "chat-2" (agent-b non affecté)
Et aucune commande CLI de reset n'est lancée par le bloc Clear
```

## Données

| Élément | Valeur |
|---|---:|
| Retours successifs de `createSession` | `"chat-1"`, `"chat-2"`, `"chat-3"` |
| Scénario A | `Start → Run-1(a) → Run-2(a) → Run-3(b)` |
| Scénario B | `Start → Run-1(a) → Run-b(b) → Clear(a) → Run-2(a) → Run-b2(b)` |
| Observation | `sessionId` reçu par `buildCommand` pour chaque Run, nombre d'appels `createSession` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Scénario A — appels `createSession` | `2` | 1 par agent distinct |
| Scénario A — sessions Run-1 / Run-2 / Run-3 | `chat-1` / `chat-1` / `chat-2` | Réutilisation pour agent-a |
| Scénario B — appels `createSession` | `3` | a, b, puis a après Clear |
| Scénario B — sessions Run-1 / Run-b / Run-2 / Run-b2 | `chat-1` / `chat-2` / `chat-3` / `chat-2` | Clear ne touche que agent-a |
| Spawns lancés par le bloc Clear | `0` | Aucune commande CLI |

## Ce que ce cas ne vérifie pas

- La syntaxe `create-chat` / `--resume` → `CASE-ADPT-02-2`, `CASE-ADPT-02-4` ;
- Le réarmement `une_fois_jusqu_a_clear` → `CASE-ENG-04-5` ;
- La propagation `power: 1` du bloc ClearContext → `CASE-ENG-03-4`.

## Interdiction explicite (anti-faux-vert)

- Appeler `createSession` à la main dans le test ne prouve rien : les appels doivent être déclenchés par `runner.run()`.
- Le `sessionId` doit être observé à l'entrée de `adapter.buildCommand` (contrat réel), pas dans un état interne du runner.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_03_2_scenario_session_reuse_and_renewal_after_clear`
**Fichier :** `tests/units/adpt/CASE-ADPT-03-2.test.ts`

## Revue du test automatisé

- [ ] Le test exécute les scénarios via `ScenarioRunnerService.run()` avec un adapter simulé enregistrant `createSession` et `buildCommand`.
- [ ] Le test vérifie le nombre d'appels `createSession` et le `sessionId` reçu par chaque Run.
- [ ] Le test vérifie que agent-b garde sa session après le Clear de agent-a.
- [ ] Le test échoue si une session est créée à chaque Run ou si le Clear ne change pas la session.
- [ ] Le nom du test contient `CASE_ADPT_03_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** v2 (2026-11-03) — remplace l'ancien `clearContext` adapter (commande `--clear-context` inexistante).
