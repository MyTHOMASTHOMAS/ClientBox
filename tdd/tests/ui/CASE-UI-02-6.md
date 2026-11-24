# CASE-UI-02-6 — Validation E2E de l'interaction graphique sur le Canvas

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-6`  
**Type :** acceptation E2E navigateur (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-011`, `ADR-013`, ADR-015

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) que les composants Canvas Preact (`UI-020 components/canvas/canvas-board.tsx` intégré dans `UI-031 pages/scenario-studio-page.tsx`, `ADR-013`) et l'arborescence visuelle Tailwind CSS v4 sont correctement instanciés dans le DOM, qu'ils réagissent aux interactions graphiques (affichage du conteneur de canvas `.canvas-container`, blocs SVG et ports) et que la structure d'orchestration nodale et le terminal SSE sont immédiatement opérationnels.

---

## Cas

```gherkin
Scénario : Validation E2E du conteneur de Canvas et des rubriques de navigation
  Étant donné l'application ClientsBox ouverte dans le navigateur
  Quand l'utilisateur accède à la rubrique "Scénarios"
  Alors le conteneur ".canvas-container" est présent et visible à l'écran
  Et la vue de terminal "#terminal-output" est active et prête pour les flux SSE
```

---

## Données

| Élément | Valeur |
|---|---|
| Sélecteur Canvas | `.canvas-container, svg.canvas-root` |
| Sélecteur Terminal | `#terminal-output, .terminal-view` |
| Sélecteur Rubriques | `.sidebar-nav a[data-section], [data-section]` |

---

## Test automatisé

**Nom attendu :** `test_CASE_UI_02_6_canvas_container_and_navigation_e2e`  
**Fichier :** `tests/e2e/ui/CASE-UI-02-6.e2e.test.ts`  
**Outil :** Playwright (`@playwright/test`)

## Revue du test automatisé

- [ ] Le test navigue vers la vue Scénario et vérifie le montage du conteneur `.canvas-container`.
- [ ] Le test vérifie la visibilité des blocs et ports du canvas Preact.
- [ ] Le test vérifie que le composant de terminal est prêt à recevoir le flux SSE.
- [ ] Le nom du test contient `CASE_UI_02_6`.
- [ ] Le test échoue si le conteneur de canvas n'est pas rendu.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*
