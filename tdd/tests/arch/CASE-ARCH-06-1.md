# CASE-ARCH-06-1 — Inférence automatique native des types de retour de fonction sans typage explicite sur les fonctions concrètes

**Spécification :** `SPEC-ARCH-06`
**Critère d'acceptation :** `AC-ARCH-06-1`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le code sous `src/` maximise l'inférence native de TypeScript : il est interdit d'annoter explicitement le type de retour d'une fonction concrète (ex: `function foo(): string`), le compilateur devant déduire le type exact automatiquement.

## Cas

```gherkin
Étant donné les fonctions concrètes implémentées sous "src/"
Quand on inspecte leur signature
Alors aucun type de retour explicite n'est annoté sur la déclaration
Et le type de retour est intégralement inféré par le compilateur TypeScript
```

## Données

| Élément | Valeur |
|---|---:|
| Périmètre | Fonctions concrètes avec corps d'implémentation sous `src/` |
| Exclusion | Contrats d'interfaces et signatures abstraites dans `src/types/**` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Annotations de retour non exemptées | `0` | Scan AST des ReturnTypeNode sur fonctions concrètes |

## Ce que ce cas ne vérifie pas

- L'exemption de retour -> `CASE-ARCH-06-2` ;
- Le bannissement de any -> `CASE-ARCH-06-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_06_1_return_type_inference_compliance`
**Fichier :** `tests/tests-unitaires/arch/case-arch-06-1.test.ts`

## Revue du test automatisé

- [ ] Le test scanne les déclarations de fonctions concrètes sous `src/`.
- [ ] Le test valide l'absence d'annotation explicite de type de retour non exemptée.
- [ ] Le test vérifie l'absence d'annotations de retour explicites non nécessaires.
- [ ] Le test échoue si une fonction porte une annotation de retour explicite sans balise @returnTypeExemption.
- [ ] Le nom du test contient `CASE_ARCH_06_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
