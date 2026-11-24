# CASE-UI-02-3 — Différenciation visuelle explicite des deux familles de connecteurs et câbles de sortie du bloc If (Vrai / Faux)

**Spécification :** `SPEC-UI-02`
**Critère d'acceptation :** `AC-UI-02-3`
**Type :** acceptation
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

## Ce que ce cas protège

Le bloc If dispose de deux familles de sorties distinctes : la branche vraie (`true`) et la branche fausse (`false`) (`R-10b`, `R-15`). Au sein des composants Preact TSX `<CanvasNode />` (`UI-021 canvas-node.tsx`) et `<CanvasCable />` (`UI-022 canvas-cable.tsx`) stylisés via Tailwind CSS v4 (`ADR-013`), l'interface du canvas doit rendre cette dichotomie immédiatement compréhensible à l'écran via des connecteurs visuellement différenciés (connecteur vert `emerald-500` "Vrai" et connecteur rouge `red-500` "Faux") et des liaisons filaires (câbles SVG) qui reflètent distinctement leur famille d'appartenance avec classes `cable-true` et `cable-false` et attribut `data-branch`. Si les deux branches étaient confondues ou visuellement indistinctes, l'utilisateur risquerait de câbler la mauvaise branche logique par méprise.

## Cas

```gherkin
Étant donné un bloc If déposé sur le canvas d'orchestration
Quand l'utilisateur observe les connecteurs de sortie du bloc
Alors deux connecteurs distincts sont visibles :
  | connecteur | libellé / distinction visuelle                 |
  | true       | connecteur "Vrai" (couleur verte / style vrai) |
  | false      | connecteur "Faux" (couleur rouge / style faux) |

Étant donné deux blocs cibles "Run-Success" et "Run-Fallback"
Quand l'utilisateur relie le connecteur "Vrai" à "Run-Success" et le connecteur "Faux" à "Run-Fallback"
Alors le câble issu de la sortie "Vrai" hérite du style visuel de la branche vraie
Et le câble issu de la sortie "Faux" hérite du style visuel de la branche fausse
Et la structure de liaison enregistre explicitement la famille de sortie ("true" vs "false")
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc testé | Bloc `If` sur le canvas |
| Connecteur 1 (branche vraie) | `true` (indicateur visuel vert / libellé "Vrai") |
| Connecteur 2 (branche fausse) | `false` (indicateur visuel rouge / libellé "Faux") |
| Câblage | Style différencié hérité sur les câbles connectés |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre de familles de sorties distinctes | `2` | Branche vraie (`true`) et branche fausse (`false`) (R-10b, R-15) |
| Différenciation graphique sur connecteurs | `OUI` | Code couleur et/ou libellé explicite ("Vrai" vs "Faux") |
| Différenciation graphique sur câbles | `OUI` | Héritage visuel du style de la branche d'origine |

## Ce que ce cas ne vérifie pas

- L'évaluation runtime de l'expression conditionnelle du bloc If → `SPEC-ENG-03` ;
- L'unicité du bloc Start → `CASE-UI-02-2` ;
- L'affichage des statuts de blocs en direct → `CASE-UI-02-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_02_3_if_block_output_branches_visual_differentiation`
**Fichier :** `tests/tests-unitaires/ui/case-ui-02-3.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que le bloc If expose deux ports de sortie distincts identifiés `true` et `false`.
- [ ] Le test vérifie la présence d'attributs visuels distincts (classes CSS, libellés ou couleurs) pour "Vrai" et "Faux".
- [ ] Le test vérifie que les câbles connectés à chaque port conservent la différenciation de branche.
- [ ] Le test échoue si les deux sorties sont visuellement indiscernables.
- [ ] Le nom du test contient `CASE_UI_02_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
