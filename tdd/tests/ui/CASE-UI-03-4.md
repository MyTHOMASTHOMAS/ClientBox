# CASE-UI-03-4 — Validation E2E du lancement de scénario, streaming SSE et terminal live per REQ-024

**Spécification :** `SPEC-UI-03`, `SPEC-ENG-04`, `SPEC-SRV-02`  
**Critère d'acceptation :** `AC-UI-03-1`, `AC-UI-02-5`, `AC-SRV-02-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) la chaîne complète d'exécution d'un scénario depuis l'interface utilisateur Preact (`UI-031 scenario-studio-page.tsx`, `UI-023 canvas-toolbar.tsx`, `UI-025 terminal-view.tsx`, `UI-010 use-execution-stream.hook.ts`, `ADR-013`) :
1. Clic sur le bouton « Lancer le scénario » (`[data-action="run-scenario"]`).
2. Verrouillage immédiat du bouton Launch (désactivé, état anti double-Launch géré via `UI-023` et `UI-010`) pour prévenir toute exécution concurrente.
3. Affichage réactif des statuts de blocs sur le canvas SVG (`running`, puis `completed`).
4. Ouverture de la vue terminal Preact (`UI-025`) et affichage fluide des chunks textuels streamés reçus via la route SSE canonique `GET /api/scenarios/:id/stream` (`EventSource`).
5. Absence de persistance de logs sur le disque (`R-26`) et réactivation du bouton Launch en fin d'exécution.

---

## Cas

```gherkin
Scénario : Exécution nominale avec affichage streaming dans le terminal
  Étant donné un scénario valide ouvert sur "#/scenarios/sc-demo"
  Et le bouton "Lancer le scénario" disponible et cliquable
  Quand l'utilisateur clique sur "Lancer le scénario"
  Alors le bouton passe immédiatement en état désactivé (disabled=true)
  Et la requête "POST /api/scenarios/sc-demo/run" est émise vers le serveur
  Et le panneau de terminal s'ouvre au bas de l'écran
  Et les lignes de streaming ("stdout: ...") s'affichent au fur et à mesure dans le terminal
  Et le nœud Run sur le canvas affiche le badge d'état "En cours" (running) puis "Terminé" (completed per TYPES-012)
  
  Quand l'exécution du scénario se termine avec succès
  Alors le terminal affiche le message de fin "Scénario terminé avec succès."
  Et le bouton "Lancer le scénario" redevient actif
  Et aucun fichier de log n'a été créé dans ".agents/data/"
```

---

## Données

| Élément | Valeur |
|---|---:|
| Bouton d'action | `[data-action="run-scenario"]` |
| Sélecteur du terminal | `.terminal-view` ou `.terminal-lines` |
| Événements reçus | `stdout`, `block_status`, `done` |
| Vérification disque | `fs.readdirSync('.agents/data/logs')` $\to$ n'existe pas |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Réception streaming terminal | Chunks affichés en direct | Flux SSE actif |
| Fichiers de log sur disque | `0 fichier` | Règle R-26 (volatilité absolue du terminal) |
| Déverrouillage post-run | Bouton réactivé | Cycle de vie d'exécution complet |

---

## Ce que ce cas ne vérifie pas

- L'interruption par arrêt d'urgence Stop → `CASE-UI-03-5` ;
- Le composant unitaire terminal → `CASE-UI-03-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_03_4_e2e_scenario_launch_and_sse_streaming`  
**Fichier :** `tests/e2e/ui/CASE-UI-03-4.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test clique sur Lancer le scénario.
- [ ] Le test vérifie que le bouton devient disabled.
- [ ] Le test attend l'apparition des chunks dans le terminal Playwright.
- [ ] Le test vérifie la réactivation du bouton à la fin.
- [ ] Le nom du test contient `CASE_UI_03_4`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
