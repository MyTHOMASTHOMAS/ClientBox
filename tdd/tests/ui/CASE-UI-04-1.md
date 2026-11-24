# CASE-UI-04-1 — Navigation vers la documentation Instructions dans l'application

**Spécification :** `SPEC-UI-04`  
**Critère d'acceptation :** `AC-UI-04-1`  
**Type :** acceptation  
**Niveau de risque :** majeur  
**ADR liés :** `ADR-017`, `ADR-013`

## Ce que ce cas protège

L'accès à la documentation depuis l'application principale doit naviguer de manière fluide vers la vue Instructions (`#/instructions`) via le menu latéral, sans ouvrir de nouvelle fenêtre ni de nouvel onglet intempestif.

## Cas

```gherkin
Étant donné l'application principale affichée
Quand l'utilisateur clique sur l'élément de navigation Instructions dans la barre latérale
Alors l'application navigue vers la route "#/instructions"
Et la vue Instructions est affichée au sein du layout principal
```

## Données

| Élément | Valeur |
|---|---:|
| Route cible | `#/instructions` |
| Mécanisme attendu | Navigation in-place (`onNavigate`) |
| Nouvel onglet requis | `NON` (navigation intégrée) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Hash Instructions | `#/instructions` | Route UI-052 |
| Navigation intégrée | `OUI` | `Sidebar` déclenche `onNavigate('#/instructions')` |

## Ce que ce cas ne vérifie pas

- Le rendu des sections documentaires → `CASE-UI-04-2` ;
- Le bouton d'export → `CASE-UI-04-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_04_1_docs_access_opens_instructions_in_new_tab`  
**Fichier :** `tests/units/ui/CASE-UI-04-1.test.ts`

## Revue du test automatisé

- [ ] Espionne `window.open` (ou API équivalente) lors du clic d'accès doc.
- [ ] Vérifie l'URL / hash `#/instructions`.
- [ ] Vérifie que le contrôle existe dans le chrome (sidebar / layout).
- [ ] Le nom du test contient `CASE_UI_04_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** Un E2E Playwright complémentaire reste possible ; le TU peut valider le geste d'ouverture.
