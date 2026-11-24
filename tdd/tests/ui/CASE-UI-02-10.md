# CASE-UI-02-10 — Page dédiée canvas scénario, hydratation et verrouillage anti double-Launch

**Spécification :** `SPEC-UI-02`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-UI-02-5`, `AC-UI-03-1`  
**Type :** acceptation / intégration  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

La page dédiée au studio de scénario (`UI-031 pages/scenario-studio-page.tsx`, composant Preact `<ScenarioStudioPage />`, `ADR-013`) assemble dans une même vue applicative : la planche canvas SVG interactive (`UI-020`, `UI-021`, `UI-022`), le panneau latéral d'inspection (`UI-024`), la barre d'outils et commandes (`UI-023 canvas-toolbar.tsx`, `UI-026 terminal-controls.tsx`), le hook d'exécution (`UI-010 use-execution-stream.hook.ts`) et le terminal web de streaming (`UI-025 terminal-view.tsx`). Ce cas garantit :
1. L'hydratation initiale fidèle du canvas depuis les données du scénario (`hydrateCanvasFromScenario`).
2. Le verrouillage strict anti double-Launch : dès qu'une exécution démarre, le bouton Lancer est visuellement désactivé et inhibé (`disabled=true`, `aria-busy=true`) tant que le scénario est actif.
3. Le démontage coordonné et propre de l'ensemble des sous-composants, abonnements SSE et timers lors du démontage de la vue Preact (`useEffect` cleanup).

---

## Cas

```gherkin
Étant donné le rendu du composant Preact "<ScenarioStudioPage scenarioId={scenarioId} client={httpClient} />"
Quand la page s'initialise
Alors le scénario est récupéré via l'API "GET /api/scenarios/:id"
Et le canvas est hydraté avec ses nœuds et ses câbles positionnés
Et la barre de contrôles propose les boutons "Lancer le scénario" et "Arrêter" (aucun bouton "Effacer le contexte")
Et le terminal de streaming est prêt à recevoir les événements

Étant donné la page ouverte avec un scénario inactif
Quand l'utilisateur clique sur "Lancer le scénario"
Alors l'appel "POST /api/scenarios/:id/run" est émis
Et le bouton "Lancer le scénario" passe en état désactivé (disabled=true)
Et toute nouvelle tentative de clic sur Lancer est ignorée

Étant donné la page quittée par l'utilisateur
Quand le composant "<ScenarioStudioPage />" est démonté de l'application (unmount Preact / useEffect cleanup)
Alors le canvas SVG, l'inspecteur, les listeners et la souscription SSE sont proprement détruits
```

---

## Données

| Élément | Valeur |
|---|---:|
| Composant d'assemblage | Composant Preact `<ScenarioStudioPage scenarioId={id} client={client} />` |
| Bouton Lancement | Action `[data-action="run-scenario"]`, libellé `"Lancer le scénario"` |
| Garde anti-concurrence | Propriété `disabled = true` et `aria-busy = true` tant que le run est en cours |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Double-clic prévenu | `1 seul appel POST` émis | Verrouillage synchrone au premier clic |
| Démontage Preact | Nettoyage en cascade (`useEffect`) | Libération du canvas, terminal, inspecteur et abonnement SSE |

---

## Ce que ce cas ne vérifie pas

- Le tracé des courbes SVG → `CASE-UI-02-7` ;
- Le tampon circulaire du terminal → `CASE-UI-03-1` ;
- La réhydratation d'une exécution déjà active au (re)montage du Studio → `CASE-UI-03-9`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_10_scenario_canvas_page_coordination`  
**Fichier :** `tests/units/ui/case-ui-02-10.test.ts`  

## Revue du test automatisé

- [ ] Le test monte la page scénario via `<ScenarioStudioPage />` et vérifie l'hydratation.
- [ ] Le test simule le clic de lancement et vérifie le verrouillage du bouton.
- [ ] Le test vérifie que le démontage Preact purge les sous-composants, listeners et flux SSE.
- [ ] Le nom du test contient `CASE_UI_02_10`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
