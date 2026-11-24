# CASE-ENG-04-5 — Gestion runtime de PolicyInjectionState et réinitialisation par ClearContext

**Spécification :** `SPEC-ENG-04`, `SPEC-DATA-01`  
**Critère d'acceptation :** `AC-ENG-04-2`, `AC-DATA-01-2`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`  

---

## Ce que ce cas protège

La politique de profil `une_fois_jusqu_a_clear` impose d'injecter le `systemPrompt` lors de la première sollicitation d'un agent dans le scénario, puis de ne plus l'injecter lors des sollicitations suivantes tant qu'aucun événement `ClearContext` n'est intervenu (`R-06`, `D.3`). Ce cas garantit que le runner maintient une map en mémoire `PolicyInjectionState` par agent, met à jour cet état immédiatement après toute injection réussie, et le réinitialise à l'état non-injecté dès qu'un bloc `ClearContext` (ou l'action `onClearContext`) s'exécute pour cet agent.

---

## Cas

```gherkin
Étant donné un agent "agent-a" configuré avec la politique "une_fois_jusqu_a_clear"
Et le runner initialisant la map "PolicyInjectionState" pour "agent-a" à false (non injecté)
Quand un premier bloc Run exécute une commande pour "agent-a"
Alors le prompt système est injecté dans le prompt assemblé
Et la map d'état passe immédiatement à true (injecté) pour "agent-a"

Étant donné un second bloc Run exécutant une commande pour "agent-a" dans la même exécution
Quand la politique est évaluée
Alors le prompt système n'est PAS réinjecté (état injecté conservé)

Étant donné un bloc ClearContext exécuté pour "agent-a"
Quand le bloc termine son exécution
Alors la map "PolicyInjectionState" pour "agent-a" est réinitialisée à false
Et le prochain bloc Run pour "agent-a" réinjectera à nouveau le prompt système
```

---

## Données

| Élément | Valeur |
|---|---:|
| Politique testée | `'une_fois_jusqu_a_clear'` |
| Structure mémoire | `Map<string, PolicyInjectionState>` gérée par `ScenarioRunnerService` |
| Événement de bascule | Premier appel Run $\to$ `true`, ClearContext $\to$ `false` |

---

## Résultat attendu, calculé à la main

| Étape | État `PolicyInjectionState` | `systemPrompt` injecté ? |
|---|:---:|:---:|
| Initialisation | `false` | — |
| 1er bloc Run | Passe à `true` | **OUI** |
| 2e bloc Run | Reste `true` | **NON** |
| Bloc ClearContext | Passe à `false` | — |
| 3e bloc Run | Passe à `true` | **OUI** |

---

## Ce que ce cas ne vérifie pas

- Les deux autres politiques (`chaque_prompt`, `debut_scenario`) → `CASE-ENG-04-2` ;
- Le contenu du prompt utilisateur → `CASE-ENG-04-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_5_policy_injection_state_runtime_management`  
**Fichier :** `tests/units/eng/case-eng-04-5.test.ts`  

## Revue du test automatisé

- [ ] Le test simule une séquence Run $\to$ Run $\to$ ClearContext $\to$ Run.
- [ ] Le test vérifie la mise à jour de la map d'injection.
- [ ] Le test vérifie l'assemblage conditionnel du prompt système.
- [ ] Le nom du test contient `CASE_ENG_04_5`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
