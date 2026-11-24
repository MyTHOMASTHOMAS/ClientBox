# CASE-ARCH-06-2 — Exemption documentée obligatoire via @returnTypeExemption dans le TSDoc immédiatement précédent en cas de retour explicite inévitable

**Spécification :** `SPEC-ARCH-06`
**Critère d'acceptation :** `AC-ARCH-06-2`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Si une annotation explicite de type de retour est indispensable (type récursif, discriminant non déductible), elle doit obligatoirement être justifiée par la balise `@returnTypeExemption <motif>` dans le bloc TSDoc immédiatement précédent la déclaration.

## Cas

```gherkin
Étant donné une fonction concrète déclarant explicitement son type de retour
Quand on analyse son bloc de documentation TSDoc
Alors le bloc TSDoc immédiatement précédent contient obligatoirement "@returnTypeExemption <justification>"
Et toute annotation de retour dépourvue de cette balise provoque l'échec du test
```

## Données

| Élément | Valeur |
|---|---:|
| Balise d'exemption | `@returnTypeExemption <motif>` |
| Locus obligatoire | Bloc commentaire TSDoc immédiatement précédent la fonction |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Retours explicites non justifiés | `0` | Concaténation AST ReturnTypeNode et JSDoc comment |

## Ce que ce cas ne vérifie pas

- L'inférence nominale -> `CASE-ARCH-06-1` ;
- Le registre des exemptions out/ -> `CASE-ARCH-09-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_06_2_return_type_exemption_tag_compliance`
**Fichier :** `tests/tests-unitaires/arch/case-arch-06-2.test.ts`

## Revue du test automatisé

- [ ] Le test identifie toutes les fonctions annotées d'un type de retour explicite.
- [ ] Le test vérifie la présence de `@returnTypeExemption` dans le TSDoc précédent.
- [ ] Le test vérifie que la balise @returnTypeExemption est documentée dans le bloc TSDoc de la fonction.
- [ ] Le test échoue si une exemption de type de retour est utilisée sans justification TSDoc.
- [ ] Le nom du test contient `CASE_ARCH_06_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
