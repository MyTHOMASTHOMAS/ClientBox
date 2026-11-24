# CASE-ARCH-01-3 — Étanchéité stricte des contrôleurs (src/controllers/ n'importe ni domain/ ni lib/)

**Spécification :** `SPEC-ARCH-01`
**Critère d'acceptation :** `AC-ARCH-01-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

La couche `src/controllers/` assure l'exposition HTTP et doit être strictement découplée des détails d'infrastructure (`lib/`) et du modèle métier pur (`domain/`). Elle doit passer exclusivement par `services/`, `types/` et `utils/`.

## Cas

```gherkin
Étant donné les fichiers situés dans "src/controllers/"
Quand on analyse leurs déclarations d'importation
Alors aucun fichier de contrôleur n'importe de module depuis "src/domain/"
Et aucun fichier de contrôleur n'importe de module depuis "src/lib/"
Et toutes les interactions métier et techniques passent par "src/services/" et les contrats "src/types/"
```

## Données

| Élément | Valeur |
|---|---:|
| Couche cible | `src/controllers/` (`CTL-001..007`) |
| Imports interdits | `src/domain/**`, `src/lib/**` |
| Imports autorisés | `src/types/**`, `src/utils/**`, `src/services/**` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Imports directs `domain/` | `0` | Analyse AST des imports de `controllers/` |
| Imports directs `lib/` | `0` | Analyse AST des imports de `controllers/` |

## Ce que ce cas ne vérifie pas

- L'isolation de la couche UI -> `CASE-ARCH-01-4` ;
- La matrice générale des imports -> `CASE-ARCH-01-5` ;
- Le découplage via HttpRouter -> `CASE-ARCH-04-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_01_3_controllers_layer_isolation`
**Fichier :** `tests/tests-unitaires/arch/case-arch-01-3.test.ts`

## Revue du test automatisé

- [ ] Le test analyse les imports de l'ensemble des contrôleurs sous `src/controllers/`.
- [ ] Le test valide l'absence d'import vers `src/domain/` et vers `src/lib/`.
- [ ] Le test vérifie que les dépendances sont injectées via les abstractions autorisées.
- [ ] Le test échoue si un contrôleur importe directement un composant UI ou un service non autorisé.
- [ ] Le nom du test contient `CASE_ARCH_01_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
