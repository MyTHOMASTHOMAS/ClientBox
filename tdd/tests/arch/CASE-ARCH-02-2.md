# CASE-ARCH-02-2 — Pureté et déterminisme des 10 fonctions de calcul et de validation métier dans src/domain/ sans mutation d'état global

**Spécification :** `SPEC-ARCH-02`
**Critère d'acceptation :** `AC-ARCH-02-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Les 10 fonctions exportées par `src/domain/` (`evaluateJoin`, `isOrphanBlock`, `shouldInjectSystemPrompt`, `updatePolicyState`, `assemblePrompt`, `assignDefaultKey`, `renumberDefaultKeys`, `hasKeyCollision`, `isValidConnectionKey`, `validateGraph`) doivent être synchrones, pures et déterministes, sans état global mutable ni altération des structures reçues en entrée. `evaluateExitMatchers` (`DOM-009`) est abrogé (CR-012) et ne fait plus partie du périmètre.

## Cas

```gherkin
Étant donné les 10 fonctions de calcul et validation métier de "src/domain/"
Quand elles sont exécutées avec des entrées identiques
Alors elles retournent systématiquement des sorties identiques sans effet de bord
Et les arguments d'entrée ne sont jamais mutés en place
Et aucune variable globale partagée n'est altérée
Et aucune fonction "evaluateExitMatchers" n'est exportée ni chargée
```

## Données

| Élément | Valeur |
|---|---:|
| 10 fonctions testées | `evaluateJoin`, `isOrphanBlock`, `shouldInjectSystemPrompt`, `updatePolicyState`, `assemblePrompt`, `assignDefaultKey`, `renumberDefaultKeys`, `hasKeyCollision`, `isValidConnectionKey`, `validateGraph` |
| Fonction abrogée | `evaluateExitMatchers` (`DOM-009`, CR-012) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Déterminisme | `100 % (Sorties stables)` | Exécution multiple avec mêmes arguments |
| Mutation in-place | `0 (Objets inchangés)` | Assertion d'immutabilité sur arguments d'entrée |
| Cardinal exporté | `10` | Retrait de `evaluateExitMatchers` |

## Ce que ce cas ne vérifie pas

- L'absence d'I/O -> `CASE-ARCH-02-1` ;
- La validation topologique Start -> `CASE-ARCH-02-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_02_2_domain_pure_functions_and_determinism`
**Fichier :** `tests/units/arch/case-arch-02-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie le comportement pur des 10 fonctions de `src/domain/`.
- [ ] Le test ne charge plus `evaluateExitMatchers` / `exit-matcher.evaluator.ts`.
- [ ] Le test vérifie que les objets et tableaux passés en paramètre ne sont pas mutés.
- [ ] Le test vérifie que l'exécution répétée produit des résultats strictement identiques.
- [ ] Le test échoue si une fonction du domaine lit une variable d'état globale ou produit un effet de bord.
- [ ] Le nom du test contient `CASE_ARCH_02_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — 11 → 10 fonctions (abrogation `DOM-009`).
