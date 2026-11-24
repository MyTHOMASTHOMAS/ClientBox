# CASE-UI-03-5 — Validation E2E de l'arrêt d'urgence Stop et libération des ressources per REQ-025

**Spécification :** `SPEC-UI-03`, `SPEC-ENG-04`, `SPEC-ADPT-03`  
**Critère d'acceptation :** `AC-UI-03-2`, `AC-ENG-04-3`, `AC-ADPT-03-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-002`, `ADR-004`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Conformément à `REQ-025` et à la règle `R-34`, l'utilisateur doit pouvoir interrompre immédiatement et de manière certaine une exécution en cours depuis l'interface Preact (`UI-023 canvas-toolbar.tsx`, `UI-025 terminal-view.tsx`, `UI-026 terminal-controls.tsx`, `UI-031 scenario-studio-page.tsx`, `ADR-013` ; bouton Stop `[data-action="stop-scenario"]`). Ce cas valide dans un vrai navigateur que :
1. Un clic sur le bouton « Arrêter » émet la commande `DELETE /api/scenarios/:id/run`.
2. Le flux de streaming dans le terminal Preact s'interrompt instantanément.
3. Un message d'interruption en français apparaît dans le terminal (« Exécution interrompue par l'utilisateur. », `UI-004 i18n/fr.i18n.ts`).
4. Le sous-processus CLI enfant est interrompu côté serveur et le bouton Lancer redevient cliquable.

---

## Cas

```gherkin
Scénario : Interruption manuelle d'un scénario en cours d'exécution
  Étant donné un scénario en cours de traitement actif produisant des flux de logs dans le terminal web
  Et le bouton "Arrêter" (Stop) actif et visible
  Quand l'utilisateur clique sur le bouton "Arrêter"
  Alors une requête "DELETE /api/scenarios/:id/run" est envoyée au serveur HTTP
  Et l'émission de nouveaux chunks s'arrête immédiatement dans le terminal
  Et une ligne d'information finale indique : "Exécution interrompue par l'utilisateur."
  Et le badge du nœud actif passe à un état neutre ou interrompu
  Et le bouton "Lancer le scénario" redevient accessible
```

---

## Données

| Élément | Valeur |
|---|---:|
| Bouton Stop | `[data-action="stop-scenario"]`, libellé `"Arrêter"` |
| Requête API attendue | `DELETE /api/scenarios/:id/run` |
| Message de fin | Contient `"interrompue par l'utilisateur"` en français |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Réactivité à l'arrêt | Événementielle | Confirmation par réception de l'événement d'interruption et arrêt des chunks |
| Disponibilité du serveur post-arrêt | Stable | Prêt pour un nouveau lancement |

---

## Ce que ce cas ne vérifie pas

- L'escalade temporelle de 3000 ms en TU → `CASE-ENG-04-6` ;
- Le désabonnement flux SSE → `CASE-SRV-02-14`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_03_5_e2e_stop_button_emergency_interruption`  
**Fichier :** `tests/e2e/ui/CASE-UI-03-5.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test lance un scénario puis clique sur Arrêter.
- [ ] Le test vérifie que le flux de streaming cesse.
- [ ] Le test vérifie le message d'interruption en français.
- [ ] Le test vérifie que le bouton Lancer est réactivé.
- [ ] Le nom du test contient `CASE_UI_03_5`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
