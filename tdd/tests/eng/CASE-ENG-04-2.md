# CASE-ENG-04-2 — Application fidèle des 3 politiques d'injection du profil et réinitialisation ClearContext

**Spécification :** `SPEC-ENG-04`
**Critère d'acceptation :** `AC-ENG-04-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le moteur assure le suivi de l'état d'injection du prompt système par agent et applique strictement l'une des trois politiques définies dans le profil (`R-06`, `D.3`, `REQ-023`) : `chaque_prompt` (injection systématique), `debut_scenario` (injection au premier Run de l'agent dans le scénario uniquement), ou `une_fois_jusqu_a_clear` (injection au premier Run puis omission jusqu'à exécution d'un bloc ClearContext pour cet agent). Si ce suivi est défaillant, le prompt système est soit pollué par des répétitions superflues, soit absent lors des reprises après reset.

## Cas

```gherkin
Étant donné un agent "agent-all" avec un profil en politique "chaque_prompt"
Quand il exécute un premier bloc Run "run-1" puis un second bloc Run "run-2"
Alors le prompt assemblé de "run-1" contient le prompt système
Et le prompt assemblé de "run-2" contient également le prompt système

Étant donné un agent "agent-start" avec un profil en politique "debut_scenario"
Quand il exécute un premier bloc Run "run-3" puis un second bloc Run "run-4"
Alors le prompt assemblé de "run-3" contient le prompt système
Mais le prompt assemblé de "run-4" contient uniquement le prompt utilisateur sans le prompt système

Étant donné un agent "agent-clear" avec un profil en politique "une_fois_jusqu_a_clear"
Quand il exécute un premier bloc Run "run-5"
Alors son prompt assemblé contient le prompt système
Quand il exécute un second bloc Run "run-6"
Alors son prompt assemblé ne contient pas le prompt système
Quand un bloc ClearContext "clear-agent" s'exécute pour cet agent
Et qu'un troisième bloc Run "run-7" s'exécute par la suite
Alors le prompt assemblé de "run-7" contient à nouveau le prompt système
```

## Données

| Élément | Valeur |
|---|---:|
| `systemPrompt` commun | `"Prompt Système Standard"` |
| `userPrompt` Run | `"Action utilisateur"` |
| Agent 1 (chaque_prompt) | `policy: "chaque_prompt"` |
| Agent 2 (debut_scenario) | `policy: "debut_scenario"` |
| Agent 3 (une_fois_jusqu_a_clear) | `policy: "une_fois_jusqu_a_clear"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Injection `run-1` (chaque_prompt) | `OUI` | 1er appel $\rightarrow$ injecté |
| Injection `run-2` (chaque_prompt) | `OUI` | 2e appel $\rightarrow$ injecté systématiquement (R-06) |
| Injection `run-3` (debut_scenario) | `OUI` | 1er appel $\rightarrow$ injecté au début (R-06) |
| Injection `run-4` (debut_scenario) | `NON` | 2e appel $\rightarrow$ exclu (R-06) |
| Injection `run-5` (une_fois_clear) | `OUI` | 1er appel avant clear $\rightarrow$ injecté |
| Injection `run-6` (une_fois_clear) | `NON` | 2e appel avant clear $\rightarrow$ exclu |
| Injection `run-7` (après ClearContext) | `OUI` | Réinitialisation effectuée par ClearContext $\rightarrow$ injecté à nouveau (R-06, cas limite 2) |

## Ce que ce cas ne vérifie pas

- L'assemblage textuel unitaire $\rightarrow$ `CASE-ENG-04-1` ;
- La validation du schéma de l'enum `policy` dans le profil $\rightarrow$ `CASE-DATA-01-2` ;
- Le renouvellement de session par ClearContext $\rightarrow$ `CASE-ENG-03-4`, `CASE-ADPT-03-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_04_2_profile_injection_policies_and_clear_context_reset`
**Fichier :** `tests/tests-unitaires/eng/case-eng-04-2.test.ts`

## Revue du test automatisé

- [ ] Le test exécute 2 blocs Run successifs avec `policy: "chaque_prompt"` et valide la double injection.
- [ ] Le test exécute 2 blocs Run successifs avec `policy: "debut_scenario"` et valide l'omission au 2e appel.
- [ ] Le test déroule la séquence `Run -> Run -> ClearContext -> Run` avec `policy: "une_fois_jusqu_a_clear"` et valide la ré-injection.
- [ ] Le test échoue si ClearContext ne réinitialise pas le flag d'injection.
- [ ] Le nom du test contient `CASE_ENG_04_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
