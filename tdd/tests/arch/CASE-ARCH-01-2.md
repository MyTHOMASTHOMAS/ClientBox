# CASE-ARCH-01-2 — Pureté déclarative de la couche src/types/ (allow-list déclarative pure, zéro statement/runtime, imports bornés)

**Spécification :** `SPEC-ARCH-01`
**Critère d'acceptation :** `AC-ARCH-01-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

La couche `src/types/` doit rester strictement déclarative pure (zéro instruction exécutable runtime). Aucune classe instanciable, aucun corps de fonction, aucune variable runtime ni import vers d'autres couches applicatives (`domain/`, `lib/`, `services/`, `controllers/`, `ui/`, `index.ts`, `utils/`) n'est permis.

## Cas

```gherkin
Étant donné les fichiers situés dans le répertoire "src/types/"
Quand on inspecte la structure syntaxique (AST) et les instructions de chaque fichier
Alors ils ne contiennent que des déclarations "interface", "type", "const enum" ou types structuraux purs
Et ils ne contiennent aucun corps de fonction, classe instanciable, boucle ou variable runtime
Et ils n'importent aucun fichier provenant de "src/utils/", "src/domain/", "src/lib/", "src/services/", "src/controllers/", "src/ui/" ou "src/index.ts"
Et les imports autorisés sont les chemins relatifs intra-"src/types/" et les dépendances externes de types pures
```

## Données

| Élément | Valeur |
|---|---:|
| Répertoire cible | `src/types/` (12 modules `TYPES-001..012`) |
| Déclarations permises | `interface`, `type`, `const enum`, types structuraux |
| Déclarations interdites | `class`, `function`, `export const` valeur runtime, `enum` non-const |
| Imports permis | Chemins relatifs intra-`src/types/` et dépendances externes de types pures |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statements exécutables | `0` | Scan AST des nœuds d'instructions exécutables |
| Classes instanciables | `0` | Scan AST des déclarations de classes |
| Imports inter-couches interdits | `0` | Analyse des clauses d'importation |

## Ce que ce cas ne vérifie pas

- L'acyclicité globale du DAG -> `CASE-ARCH-01-1` ;
- L'étanchéité des contrôleurs -> `CASE-ARCH-01-3` ;
- L'isolation de l'UI -> `CASE-ARCH-01-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_01_2_types_layer_declarative_purity`
**Fichier :** `tests/tests-unitaires/arch/case-arch-01-2.test.ts`

## Revue du test automatisé

- [ ] Le test inspecte l'AST de tous les fichiers sous `src/types/`.
- [ ] Le test vérifie qu'aucun statement exécutable ni classe instanciable n'est présent.
- [ ] Le test vérifie qu'aucun import vers `src/utils/` ni vers les couches applicatives n'est réalisé.
- [ ] Le test échoue si un import interdit depuis une autre couche interne est présent dans types/.
- [ ] Le nom du test contient `CASE_ARCH_01_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
