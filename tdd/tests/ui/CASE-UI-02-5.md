# CASE-UI-02-5 — Contrôle interactif de lancement du scénario depuis l'IHM du canvas transmettant l'ordre au moteur

**Spécification :** `SPEC-UI-02`
**Critère d'acceptation :** `AC-UI-02-5`
**Type :** acceptation
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

## Ce que ce cas protège

L'interface du canvas d'orchestration Preact (barre d'outils `<CanvasToolbar />` `UI-023`, hook `UI-010 use-execution-stream.hook.ts` et page `UI-031 scenario-studio-page.tsx`, `ADR-013`) fournit un contrôle d'exécution accessible (bouton "Lancer le scénario", `[data-action="run-scenario"]`) permettant à l'utilisateur de déclencher l'exécution du flux (`REQ-030`). Ce contrôle applique un verrouillage anti double-launch immédiat (`disabled=true`, `aria-busy=true`), valide l'intégrité de base du scénario (présence d'un bloc Start via `domain/graph/graph-integrity.validator.ts`) et transmet l'ordre de lancement à l'API backend `POST /api/scenarios/:id/run`. Dès le lancement, l'IHM passe le bloc Start à l'état actif et prépare la réception des flux d'exécution SSE.

## Cas

```gherkin
Étant donné un scénario valide affiché sur le canvas avec un bloc Start et des blocs reliés
Quand l'utilisateur clique sur le bouton "Lancer le scénario"
Alors l'interface envoie la requête HTTP d'exécution de scénario vers l'API backend
Et le bouton de lancement bascule en état désactivé / en cours d'exécution
Et le nœud Start passe visuellement à l'état actif
Et le terminal d'exécution se connecte pour écouter le flux de sortie

Étant donné un scénario incomplet ou en cours de sauvegarde
Quand l'utilisateur tente de lancer l'exécution
Alors l'action est conditionnée par la sauvegarde préalable
Et un message informe l'utilisateur du démarrage effectif du scénario
```

## Données

| Élément | Valeur |
|---|---:|
| Bouton d'action | Bouton "Lancer le scénario" sur la barre d'outils du canvas |
| Requête émise | `POST /api/scenarios/:id/run` (HTTP fetch, suivi de la connexion au flux SSE) |
| Changement d'état UI | Nœud Start actif, activation des indicateurs d'exécution, ouverture/focus terminal |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Transmission de l'ordre de run | `OUI` | Requête d'exécution émise vers le serveur (REQ-030) |
| Activation du nœud Start | `OUI` | Passage à l'état actif dès confirmation du lancement |
| Libellé du bouton | Rédigé en français | Conformité C-06 / REQ-007 |

## Ce que ce cas ne vérifie pas

- L'algorithme interne de parcours de graphe par le moteur → `SPEC-ENG-02` ;
- L'affichage des lignes streamées dans le terminal → `CASE-UI-03-1` ;
- L'arrêt d'urgence du scénario par bouton Stop → `CASE-UI-03-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_02_5_canvas_scenario_launch_control_transmitting_to_engine`
**Fichier :** `tests/tests-unitaires/ui/case-ui-02-5.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie la présence du bouton de déclenchement d'exécution sur le canvas.
- [ ] Le test simule le clic sur "Lancer le scénario" et intercepte l'appel API sortant.
- [ ] Le test vérifie le passage du bloc Start à l'état actif.
- [ ] Le test vérifie que le bouton empêche les doubles clics intempestifs pendant le lancement.
- [ ] Le test échoue si l'ordre de lancement n'atteint pas l'API.
- [ ] Le nom du test contient `CASE_UI_02_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
