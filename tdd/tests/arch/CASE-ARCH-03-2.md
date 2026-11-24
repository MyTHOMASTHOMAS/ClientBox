# CASE-ARCH-03-2 — Cécité métier de la couche src/lib/ (aucun import depuis src/domain/)

**Spécification :** `SPEC-ARCH-03`
**Critère d'acceptation :** `AC-ARCH-03-2`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

La couche `src/lib/` regroupe des connecteurs techniques réutilisables et neutres (écriture atomique, spawner, mini-router). Elle doit être totalement aveugle au domaine métier et ne doit importer aucun fichier de `src/domain/`.

## Cas

```gherkin
Étant donné les fichiers situés dans "src/lib/"
Quand on inspecte leurs clauses d'importation
Alors aucun fichier de "src/lib/" n'importe de chemin situé dans "src/domain/"
Et ils ne manipulent ni blocs de scénario, ni règles de join, ni algorithmes de prompt
```

## Données

| Élément | Valeur |
|---|---:|
| Couche cible | `src/lib/` (22 modules `LIB-001..022`) |
| Imports interdits | `src/domain/**` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Imports `domain/` dans `lib/` | `0` | Scan AST des imports sous `src/lib/` |

## Ce que ce cas ne vérifie pas

- L'étanchéité des contrôleurs -> `CASE-ARCH-01-3` ;
- L'écriture atomique -> `CASE-ARCH-03-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_03_2_lib_layer_domain_blindness`
**Fichier :** `tests/tests-unitaires/arch/case-arch-03-2.test.ts`

## Revue du test automatisé

- [ ] Le test analyse les imports de l'ensemble des modules sous `src/lib/`.
- [ ] Le test valide l'absence d'import vers `src/domain/`.
- [ ] Le test vérifie que lib/ ne contient aucune notion métier ClientsBox.
- [ ] Le test échoue si un import depuis lib/ vers domain/, services/ ou controllers/ est détecté.
- [ ] Le nom du test contient `CASE_ARCH_03_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — le marqueur regex `/\bevaluateExitMatchers\b/` n'est plus un symbole métier attendu (module abrogé).
