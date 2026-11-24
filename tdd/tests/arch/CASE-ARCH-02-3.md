# CASE-ARCH-02-3 — Isomorphisme strict de src/domain/ (directement exécutable sans polyfill en environnement navigateur et Node.js)

**Spécification :** `SPEC-ARCH-02`
**Critère d'acceptation :** `AC-ARCH-02-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Les modules du domaine doivent pouvoir être importés et exécutés à l'identique dans un contexte navigateur (utilisés par `src/ui/` pour valider le graphe) et dans Node.js, sans nécessiter de polyfill ni d'émulation système.

## Cas

```gherkin
Étant donné les modules de "src/domain/"
Quand ils sont chargés dans un contexte isolé sans globales Node.js
Alors toutes les fonctions s'exécutent avec succès
Et aucune erreur liée à l'absence d'APIs Node.js n'est levée
```

## Données

| Élément | Valeur |
|---|---:|
| Modules cibles | `src/domain/**/*.ts` |
| Environnements cibles | Node.js ≥ 24 et Navigateurs modernes (V8 / WebKit / Gecko) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Erreurs de chargement sandboxed | `0` | Exécution dans un runtime sans globals Node.js |
| Dépendances polyfills | `0` | Zéro dépendance externe requise |

## Ce que ce cas ne vérifie pas

- La pureté déclarative de types/ -> `CASE-ARCH-01-2` ;
- La validation Start -> `CASE-ARCH-02-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_02_3_domain_isomorphic_execution`
**Fichier :** `tests/tests-unitaires/arch/case-arch-02-3.test.ts`

## Revue du test automatisé

- [ ] Le test charge et exécute les modules de `src/domain/` sans modules Node.js.
- [ ] Le test valide l'absence de runtime error dans un environnement sans globals Node.
- [ ] Le test vérifie qu'aucune API spécifique à Node.js n'est requise pour exécuter le domaine.
- [ ] Le test échoue si une dépendance non exécutable dans un navigateur standard est introduite.
- [ ] Le nom du test contient `CASE_ARCH_02_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — ne plus charger `exit/exit-matcher.evaluator.ts` / `evaluateExitMatchers` dans le harness d'isomorphisme.
