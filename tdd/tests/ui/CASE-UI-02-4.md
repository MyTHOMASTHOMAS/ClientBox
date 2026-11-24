# CASE-UI-02-4 — Affichage en temps réel du statut d'exécution de chaque nœud (inactif, en cours, pause join, terminé, erreur)

**Spécification :** `SPEC-UI-02`
**Critère d'acceptation :** `AC-UI-02-4`
**Type :** acceptation
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

## Ce que ce cas protège

Pendant l'exécution d'un scénario, l'état de chaque nœud sur le canvas doit être reflété visuellement et en temps réel pour offrir un suivi clair du déroulement (`REQ-014`, `R-42b`). Grâce à la réactivité déclarative de Preact (`UI-021 canvas-node.tsx` et `UI-017 badge.tsx`, `ADR-013`) alimentée par le hook `UI-010 use-execution-stream.hook.ts` traitant les événements SSE `block_status`, les états fondamentaux sont projetés sans re-création intégrale du DOM : `inactif` (avant exécution), `en_cours` (exécution active), `en_pause` (attente de join : `sum(power) < N`, `R-42b`), `termine` (succès), et `erreur` (échec avec surbrillance Tailwind v4). En particulier, la visibilité de l'état de pause est essentielle pour que l'utilisateur comprenne qu'un bloc attend des signaux complémentaires sans être bloqué ni planté.

## Cas

```gherkin
Étant donné un scénario en cours d'exécution sur le canvas
Quand les événements de progression du moteur sont reçus via le flux d'état
Alors chaque nœud met à jour son indicateur d'état en temps réel :
  | état reçu   | indicateur visuel sur le nœud                              |
  | inactif     | style neutre par défaut                                    |
  | en_cours    | animation d'activité / halo actif                          |
  | en_pause    | badge explicite "En pause" / style d'attente de join       |
  | termine     | coche de validation / style succès                         |
  | erreur      | surbrillance rouge / icône d'alerte et diagnostic d'erreur |

Étant donné un bloc Run avec N=2 qui reçoit un premier message avec power=1
Quand le moteur passe le bloc en état de pause join
Alors le nœud Run affiche immédiatement l'état visuel "En pause"
Et l'utilisateur est informé visuellement de l'attente du signal manquant
```

## Données

| Élément | Valeur |
|---|---:|
| Statuts de nœud gérés | `inactif`, `en_cours`, `en_pause`, `termine`, `erreur` |
| Événement d'état de pause | Transition vers `en_pause` lorsque `sum(power) < N` (`R-42b`) |
| Événement d'erreur | Transition vers `erreur` avec affichage du diagnostic associé |
| Fréquence de mise à jour | Réactive en temps réel dès notification par le serveur |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre d'états visuels distincts | `5` | Inactif, En cours, En pause (join), Terminé, Erreur (REQ-014, R-42b) |
| Représentation de l'état de pause join | Badge explicite "En pause" | Règle R-42b, CDC §6 et §8 |
| Surbrillance rouge sur erreur | `OUI` | Diagnostic visuel immédiat (cas limite 4) |

## Ce que ce cas ne vérifie pas

- L'algorithme de calcul de puissance du join → `SPEC-ENG-02` ;
- Le streaming texte du terminal web → `CASE-UI-03-1` ;
- L'interruption manuelle par bouton Stop → `CASE-UI-03-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_02_4_canvas_node_execution_status_realtime_display`
**Fichier :** `tests/tests-unitaires/ui/case-ui-02-4.test.ts`

## Revue du test automatisé

- [ ] Le test simule les transitions d'état du moteur vers le composant canvas.
- [ ] Le test vérifie la mise à jour visuelle du nœud pour les 5 états (`inactif`, `en_cours`, `en_pause`, `termine`, `erreur`).
- [ ] Le test vérifie que l'état de pause join est explicitement visible (badge ou classe CSS dédiée).
- [ ] Le test vérifie la surbrillance d'erreur sur événement d'échec de bloc.
- [ ] Le test échoue si un état d'exécution est ignoré par le rendu visuel.
- [ ] Le nom du test contient `CASE_UI_02_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
