# CASE-UI-04-2 — Affichage des sections de documentation embarquée en français

**Spécification :** `SPEC-UI-04`  
**Critère d'acceptation :** `AC-UI-04-2`  
**Type :** acceptation  
**Niveau de risque :** majeur  
**ADR liés :** `ADR-017`, `ADR-012`, `ADR-013`

## Ce que ce cas protège

La page Instructions (`UI-050`) doit rendre le contenu du manifeste embarqué (`UI-051`, source `docs/instructions/`) en français, avec un sommaire navigable. Une page vide ou anglaise rendrait la doc inutilisable.

## Cas

```gherkin
Étant donné la page Instructions montée avec un manifeste embarqué non vide
Quand la vue est affichée
Alors un sommaire ou une liste de sections est visible
Et le contenu d'au moins une section (ex. titre / corps) est affiché en français
Et aucun libellé chrome de la deny-list anglaise n'apparaît sur cette page pour les actions doc
```

## Données

| Élément | Valeur |
|---|---:|
| Page | `instructions-page.tsx` (`UI-050`) |
| Manifeste | `user-docs.manifest.ts` (`UI-051`) |
| Source conceptuelle | `docs/instructions/**/*.md` |
| Hors manifeste | `docs/deploy/` (non affiché) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Sections listées | `≥ 1` | Manifeste non vide |
| Contenu visible | `OUI` | Rendu MD → UI |
| Langue chrome doc | `FR` | SPEC-UI-04 / C-06 |

## Ce que ce cas ne vérifie pas

- L'ouverture nouvel onglet → `CASE-UI-04-1` ;
- L'export disque → `CASE-UI-04-3` / `CASE-DATA-05-*`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_04_2_instructions_page_renders_embedded_french_sections`  
**Fichier :** `tests/units/ui/CASE-UI-04-2.test.ts`

## Revue du test automatisé

- [ ] Monte `InstructionsPage` avec manifeste de test ou réel.
- [ ] Vérifie présence d'entrées de sommaire et d'un contenu textuel FR.
- [ ] Vérifie l'absence des termes deny-list sur les libellés d'action de la page.
- [ ] Le nom du test contient `CASE_UI_04_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
