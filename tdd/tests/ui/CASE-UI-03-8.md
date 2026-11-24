# CASE-UI-03-8 — Validation E2E de la résilience sur erreur d'un bloc et arrêt propre per REQ-026

**Spécification :** `SPEC-UI-02`, `SPEC-UI-03`, `SPEC-ENG-04`  
**Critère d'acceptation :** `AC-UI-02-4`, `AC-UI-03-1`, `AC-ENG-04-3`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-011`, `ADR-013`, `ADR-015`  

---

## Ce que ce cas protège

Conformément à `REQ-026` et à la règle `R-25`, tout échec d'exécution survenant au sein d'un bloc (bloc Run retournant un code d'erreur non nul ou script If levant une exception) doit interrompre immédiatement l'ensemble du scénario de manière sécurisée. Ce cas valide dans un vrai navigateur que, dans l'IHM Preact stylisée avec Tailwind CSS v4 et le Design System (`UI-017 badge.tsx`, `UI-021 canvas-node.tsx`, `UI-023 canvas-toolbar.tsx`, `UI-025 terminal-view.tsx`, `ADR-013`, `ADR-015`) :
1. Le nœud fautif passe au statut visuel **Erreur** sur le canvas (badge Tailwind token error `status-error` / `bg-status-error/20 text-status-error` per `ADR-015` avec message descriptif en français via `UI-004 i18n/fr.i18n.ts`).
2. Le terminal web Preact affiche le message d'erreur en français et notifie l'arrêt du scénario.
3. Le bouton « Lancer le scénario » est réactivé (`disabled=false`) pour permettre une correction.
4. Le serveur HTTP local et l'interface continuent de fonctionner parfaitement (aucun crash du backend Node.js).

---

## Cas

```gherkin
Scénario : Gestion d'un bloc en échec et arrêt global sécurisé
  Étant donné un scénario ouvert sur le canvas contenant un bloc Run configuré avec une commande erronée
  Quand l'utilisateur clique sur "Lancer le scénario"
  Alors l'exécution démarre et le badge du bloc Run passe à "En cours"
  
  Quand le bloc rencontre l'erreur d'exécution
  Alors le badge du bloc Run passe immédiatement à l'état "Erreur" (rouge)
  Et une ligne d'erreur explicite en français s'affiche dans le terminal web
  Et le scénario s'interrompt sans déclencher les blocs avals
  Et le bouton "Lancer le scénario" est réactivé (disabled=false)
  
  Quand l'utilisateur clique ensuite sur la rubrique "#/agents"
  Alors l'interface répond immédiatement et le serveur reste pleinement disponible
```

---

## Données

| Élément | Valeur |
|---|---:|
| Statut visuel attendu sur le bloc | Classe CSS `.status-error` / couleur rouge (`#ef4444`) |
| Libellé badge d'erreur | `"Erreur"` (`REQ-007`) |
| Message terminal | Rédigé en français sans stack trace brute non gérée |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut du bloc fautif | `'error'` | Interception par le runner |
| Réactivité serveur post-erreur | `100 %` | Zéro crash process |
| Réactivation bouton Launch | `disabled = false` | Prêt pour un nouveau run |

---

## Ce que ce cas ne vérifie pas

- L'interception unitaire du script If → `CASE-ENG-03-6` ;
- Le mock unitaire du spawner CLI → `CASE-ADPT-01-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_03_8_e2e_block_error_resilience_and_graceful_stop`  
**Fichier :** `tests/e2e/ui/CASE-UI-03-8.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test exécute un scénario générant une erreur de bloc.
- [ ] Le test vérifie que le bloc affiche le statut rouge « Erreur ».
- [ ] Le test vérifie la réactivation du bouton Lancer.
- [ ] Le test navigue vers une autre vue pour confirmer que l'application vit toujours.
- [ ] Le nom du test contient `CASE_UI_03_8`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
