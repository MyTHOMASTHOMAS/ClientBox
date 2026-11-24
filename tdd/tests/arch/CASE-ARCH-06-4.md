# CASE-ARCH-06-4 — Immutabilité stricte des arguments reçus en entrée et absence totale de mutation in-place

**Spécification :** `SPEC-ARCH-06`
**Critère d'acceptation :** `AC-ARCH-06-4`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Les fonctions pures et services sous `src/` ne doivent jamais muter *in-place* les objets ou tableaux reçus en paramètre. Toute modification doit produire et retourner une nouvelle structure de données immuable.

## Cas

```gherkin
Étant donné les fonctions manipulant des structures complexes (objets, tableaux)
Quand elles sont exécutées avec un objet en paramètre
Alors l'objet passé en entrée conserve exactement ses références et valeurs initiales
Et la fonction retourne un nouvel objet distinct
```

## Données

| Élément | Valeur |
|---|---:|
| Cibles prioritaires | Fonctions de `src/domain/`, `src/services/` et `src/utils/` |
| Pratiques | Utilisation de `readonly`, clonage superficiel/profond, méthodes non mutantes |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Mutations in-place détectées | `0` | Assertions sur objets gelés (`Object.freeze`) |

## Ce que ce cas ne vérifie pas

- Le déterminisme du domaine -> `CASE-ARCH-02-2` ;
- L'inférence de retour -> `CASE-ARCH-06-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_06_4_function_arguments_immutability`
**Fichier :** `tests/tests-unitaires/arch/case-arch-06-4.test.ts`

## Revue du test automatisé

- [ ] Le test passe des structures `Object.freeze()` aux fonctions clés.
- [ ] Le test valide qu'aucune exception de mutation n'est levée et que de nouveaux objets sont retournés.
- [ ] Le test vérifie l'absence de réassignation des paramètres dans le corps des fonctions.
- [ ] Le test échoue si un paramètre d'entrée est muté ou réassigné.
- [ ] Le nom du test contient `CASE_ARCH_06_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
