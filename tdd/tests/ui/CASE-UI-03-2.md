# CASE-UI-03-2 — Action d'arrêt d'urgence Stop interrompant immédiatement l'exécution active ou l'état de pause du scénario

**Spécification :** `SPEC-UI-03`
**Critère d'acceptation :** `AC-UI-03-2`
**Type :** acceptation
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-013`, ADR-015  

## Ce que ce cas protège

Le bouton d'arrêt d'urgence "Stop" (`[data-action="stop-scenario"]`) doit être accessible et actif dans l'interface Preact (composants `UI-023 canvas-toolbar.tsx` et `UI-026 terminal-controls.tsx` orchestrés par `UI-010 use-execution-stream.hook.ts`, `ADR-013`) à la fois pendant l'exécution d'un bloc Run et pendant un état de pause de join (`REQ-025`, `R-34`). Le déclenchement de cette action transmet un ordre d'arrêt immédiat `DELETE /api/scenarios/:id/run` pour interrompre le sous-processus CLI ou rompre l'attente de join, faisant basculer instantanément le statut du scénario à l'état stoppé dans l'interface avec confirmation en français (`UI-004 i18n/fr.i18n.ts`). Cette action d'interruption manuelle ne déclenche en aucun cas d'effacement de session (`clearContext`) au niveau du CLI.

## Cas

```gherkin
Étant donné un scénario en cours d'exécution avec un bloc Run actif
Quand l'utilisateur clique sur le bouton "Stop" dans la barre d'outils
Alors la requête "DELETE /api/scenarios/:id/run" est immédiatement émise vers le serveur
Et le statut de l'exécution dans l'IHM passe instantanément à l'état stoppé / interrompu
Et aucune commande d'effacement de session (clear) n'est transmise

Étant donné un scénario où un bloc est en état de pause (attente de signaux join)
Quand l'utilisateur clique sur le bouton "Stop"
Alors l'attente de pause est immédiatement rompue
Et le scénario passe à l'état stoppé
Et l'interface confirme l'arrêt complet de l'exécution avec un message explicite en français
```

## Données

| Élément | Valeur |
|---|---:|
| Bouton testé | Bouton d'action "Stop" (Arrêt d'urgence, `[data-action="stop-scenario"]`) |
| Requête API émise | `DELETE /api/scenarios/:id/run` |
| État 1 (exécution active) | Bloc Run en cours de stream |
| État 2 (pause join) | Bloc en état d'attente `sum(power) < N` (`R-34`) |
| Action | Clic sur le bouton Stop |
| Statut résultant | Scénario à l'état `stoppe` / `interrompu` |
| Impact sur la session native CLI | `AUCUN` (préservation stricte de la mémoire native) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Disponibilité du bouton Stop en run | `OUI` (actif et cliquable) | Exigence REQ-025 |
| Disponibilité du bouton Stop en pause join | `OUI` (actif et cliquable) | Règle R-34 (rupture immédiate de pause) |
| Transmission d'un ordre Clear | `NON` (0 appel clearContext) | Règle Stop $\neq$ Clear (R-24) |
| Message de confirmation d'arrêt | Rédigé en français | Conformité C-06 / REQ-007 |

## Ce que ce cas ne vérifie pas

- L'émission bas niveau des signaux `SIGTERM`/`SIGKILL` par le runtime → `CASE-ADPT-03-1` ;
- Le reset manuel explicite de contexte → `CASE-UI-03-3` ;
- Le streaming continu dans le terminal → `CASE-UI-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_03_2_emergency_stop_button_action_in_run_and_pause_states`
**Fichier :** `tests/tests-unitaires/ui/case-ui-03-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que le bouton Stop est activé lorsqu'un bloc Run est en cours d'exécution.
- [ ] Le test vérifie que le bouton Stop est activé lorsqu'un bloc est en état de pause de join.
- [ ] Le test simule le clic sur Stop et vérifie l'émission immédiate de la requête d'interruption.
- [ ] Le test vérifie la mise à jour visuelle vers l'état stoppé.
- [ ] Le test vérifie qu'aucun ordre d'effacement de session n'est déclenché.
- [ ] Le test échoue si Stop est inactif ou sans effet pendant un état de pause.
- [ ] Le nom du test contient `CASE_UI_03_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
