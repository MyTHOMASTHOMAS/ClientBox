# CASE-ARCH-05-3 — Arité des fonctions bornée (<= 3 paramètres positionnels ou passage obligatoire par un objet d'options typé)

**Spécification :** `SPEC-ARCH-05`
**Critère d'acceptation :** `AC-ARCH-05-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Toute fonction ou méthode sous `src/` doit accepter au maximum 3 paramètres positionnels. Au-delà (≥ 4 arguments), les paramètres doivent être obligatoirement regroupés dans une interface ou un objet d'options typé.

## Cas

```gherkin
Étant donné les déclarations de fonctions et méthodes dans "src/"
Quand on compte le nombre de paramètres de leur signature
Alors aucune fonction n'accepte 4 paramètres positionnels ou plus
Et toutes les fonctions à besoins multiples regroupent leurs arguments dans un objet d'options typé
```

## Données

| Élément | Valeur |
|---|---:|
| Plafond d'arité | `3 paramètres positionnels maximum` |
| Règle de refactorisation | Passage par `options: { param1, param2, ... }` dès 4 paramètres |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fonctions avec arité > 3 | `0` | Analyse AST des signatures de fonctions |

## Ce que ce cas ne vérifie pas

- L'inférence des types de retour -> `CASE-ARCH-06-1` ;
- La volumétrie des fonctions -> `CASE-ARCH-05-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_05_3_function_arity_bound_compliance`
**Fichier :** `tests/tests-unitaires/arch/case-arch-05-3.test.ts`

## Revue du test automatisé

- [ ] Le test inspecte les paramètres de toutes les fonctions sous `src/`.
- [ ] Le test valide qu'aucune fonction ne dépasse 3 arguments positionnels.
- [ ] Le test vérifie le nombre de paramètres formels de chaque fonction via l'AST TypeScript.
- [ ] Le test échoue si une fonction déclare plus de 3 paramètres positionnels.
- [ ] Le nom du test contient `CASE_ARCH_05_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
