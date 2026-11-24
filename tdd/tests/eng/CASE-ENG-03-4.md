# CASE-ENG-03-4 — Bloc ClearContext : oubli de la session de l'agent et propagation de `power: 1`

**Spécification :** `SPEC-ENG-03`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-ENG-03-4`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`  
**Service / contrats cibles :** `SVC-001` (exécution du bloc), `CLIAdapter.createSession`  

---

## Ce que ce cas protège

Le bloc ClearContext efface la mémoire de l'agent configuré en paramètre statique en **oubliant sa session de scénario** : le Run suivant de cet agent obtient une nouvelle session via `createSession` (`R-39`, `REQ-020`, `REQ-038`, `SPEC-ADPT-03`). Il ne lit pas le sac d'entrées, ne lance aucune commande CLI, et propage sur toutes ses sorties `{ blockType: 'clearContext', value: null, power: 1 }`.

Si le runner se contentait de réarmer `PolicyInjectionState` **sans** changer de session, l'agent CLI conserverait sa mémoire : ce cas doit faire échouer cette implémentation incomplète.

---

## Cas

```gherkin
Étant donné un adapter simulé dont "createSession" retourne "chat-1" puis "chat-2"
Et un scénario : Start --> Run-before(agent-dev) --> Clear-1(agent-dev) --> Run-next(agent-dev)
Quand le scénario est exécuté par ScenarioRunnerService.run()
Alors "Run-before" reçoit sessionId "chat-1"
Et "Run-next" reçoit sessionId "chat-2"
Et le bloc "Clear-1" termine au statut "completed"
Et "Run-next" est exécuté (il a reçu le message de Clear-1 avec power 1)
Et aucun spawn de processus n'est attribué au bloc "Clear-1"

Étant donné un bloc ClearContext "clear-isolated" (agent-dev) sans sortie, relié à Start
Et agent-dev n'ayant encore aucune session
Quand le scénario est exécuté
Alors le bloc termine au statut "completed" sans erreur
Et "createSession" n'est pas appelé
Et le scénario termine au statut "completed"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Chaîne principale | `Start → Run-before(agent-dev) → Clear-1(agent-dev) → Run-next(agent-dev)` |
| Retours `createSession` | `"chat-1"`, `"chat-2"` |
| Bloc isolé | `clear-isolated`, agent `agent-dev`, 0 sortie |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Session `Run-before` | `chat-1` | Premier Run de agent-dev |
| Session `Run-next` | `chat-2` | Session oubliée par Clear-1 |
| Spawns du bloc Clear | `0` | Aucune commande CLI |
| Message émis | `{ blockType: "clearContext", value: null, power: 1 }` | REQ-038 |
| ClearContext isolé | `completed`, 0 `createSession` | Cas limite 4 SPEC-ENG-03 |
| Policy seule sans changement de session | `FAIL` du test | Incomplet ≠ conforme |

---

## Ce que ce cas ne vérifie pas

- L'effet de ClearContext sur l'injection `une_fois_jusqu_a_clear` → `CASE-ENG-04-2`, `CASE-ENG-04-5` ;
- La syntaxe `create-chat` / `--resume` → `CASE-ADPT-02-2`, `CASE-ADPT-02-4` ;
- L'isolation entre agents et le Clear pendant un Run parallèle → `CASE-ADPT-03-2`, `CASE-ADPT-03-4` ;
- Clear ≠ Stop → `SPEC-ENG-04` / R-24.

---

## Interdiction explicite (anti-faux-vert)

- Le `sessionId` doit être observé à l'entrée de `adapter.buildCommand` (ou du spawn) déclenché par `runner.run()`, pas dans un état interne du runner.
- Un test qui ne vérifie que `power: 1` sans changement de session est insuffisant.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_03_4_clear_context_block_reset_and_power_propagation`  
**Fichier :** `tests/units/eng/CASE-ENG-03-4.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie que `Run-next` reçoit une session différente de `Run-before`.
- [ ] Le test vérifie que `Run-next` est exécuté après Clear-1 (propagation `power: 1`).
- [ ] Le test vérifie qu'un ClearContext à 0 sortie termine sans erreur et sans `createSession`.
- [ ] Le test échoue si seul `PolicyInjectionState` est réarmé sans changement de session.
- [ ] Le nom du test contient `CASE_ENG_03_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** Autrement (`U`)  
**Remarques :** v3 (2026-11-03) — ClearContext = oubli de session de scénario (plus d'appel `adapter.clearContext`).
