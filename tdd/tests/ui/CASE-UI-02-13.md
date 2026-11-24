# CASE-UI-02-13 — Validation E2E du câblage différentiel If et de la renumérotation automatique per REQ-035

**Spécification :** `SPEC-UI-02`, `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-UI-02-3`, `AC-DATA-03-2` (geste de retrait : `AC-UI-02-7`)  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-005`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur que, dans l'environnement Preact stylisé avec Tailwind CSS v4 (`ADR-013`, `UI-021 canvas-node.tsx`, `UI-022 canvas-cable.tsx`) :
1. Les deux sorties du bloc `If` (port « Vrai » vert `emerald-500` et port « Faux » rouge `red-500`) génèrent des liaisons cubiques SVG graphiquement distinctes reliées à des blocs distincts.
2. Lorsqu'un bloc cible possède des connexions d'entrées ordonnées par défaut ("0", "1", "2") et que l'utilisateur retire le câble intermédiaire (clé "1") via le geste en deux clics (`AC-UI-02-7` / `CASE-UI-02-14` : 1er clic sur le câble → option « Supprimer », 2e clic sur l'option), l'interface graphique et le modèle sous-jacent réordonnent automatiquement et immédiatement la clé "2" en "1" (`key-renumberer.domain.ts`, `REQ-035`, `R-43`).

---

## Cas

```gherkin
Scénario : Câblage distinctif du bloc If et renumérotation automatique des clés
  Étant donné un canvas contenant un bloc If et deux blocs Run (Run-A et Run-B)
  Quand l'utilisateur câble le port "Vrai" [data-branch="true"] du bloc If vers Run-A
  Et le port "Faux" [data-branch="false"] du bloc If vers Run-B
  Alors le câble vers Run-A est stylisé en vert avec data-branch="true" et celui vers Run-B en rouge avec data-branch="false"
  
  Étant donné un bloc Join relié à 3 câbles sur ses entrées "0", "1", "2"
  Quand l'utilisateur clique une première fois sur le câble de la clé "1"
  Alors l'option "Supprimer" (data-action="delete-connection") apparaît près de la liaison
  Quand l'utilisateur clique une seconde fois sur cette option "Supprimer"
  Alors le câble disparaît du canvas
  Et la connexion précédemment assignée à la clé "2" est automatiquement réassignée à la clé "1"
  Et l'inspecteur du bloc Join affiche les entrées "0" et "1" consécutives
```

---

## Données

| Élément | Valeur |
|---|---:|
| Port Vrai If | Attribut `data-branch="true"`, classe `cable-true` / vert (`#10b981`) |
| Port Faux If | Attribut `data-branch="false"`, classe `cable-false` / rouge (`#ef4444`) |
| Clés initiales sur bloc Join | `["0", "1", "2"]` |
| Clé supprimée | `"1"` |
| Clés résultantes attendues | `["0", "1"]` (séquentiel sans trou per REQ-035) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Clés post-suppression | `["0", "1"]` | Renumérotation immédiate par `DOM-006` |
| Continuité topologique | Préservée | Aucune clé orpheline résiduelle |

---

## Ce que ce cas ne vérifie pas

- Le détail unitaire du geste deux clics (annulation, exclusivité de sélection) → `CASE-UI-02-14` ;
- La détection de collision de clés personnalisées → `CASE-DATA-03-4` ;
- Le calcul pur unitaire dans le domaine → `CASE-DATA-03-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_13_e2e_if_differential_wiring_and_key_renumbering`  
**Fichier :** `tests/e2e/ui/CASE-UI-02-13.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test câble les ports Vrai et Faux du If et valide les classes/couleurs et `data-branch`.
- [ ] Le test câble 3 entrées sur un nœud.
- [ ] Le test retire l'entrée 1 via le geste deux clics (câble puis `data-action="delete-connection"`) et vérifie la renumérotation automatique de 2 en 1.
- [ ] Le nom du test contient `CASE_UI_02_13`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
