# CASE-UI-02-16 — Verrouillage front édition / sauvegarde pendant un run actif

**Spécification :** `SPEC-UI-02`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-UI-02-9`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`  
**Modules cibles :** `UI-031` (`scenario-studio-page`), `UI-023` (`canvas-toolbar`), interactions canvas / inspecteur

---

## Ce que ce cas protège

Pendant qu'un scénario s'exécute (ou est en pause join avec runner encore actif), modifier le graphe ou l'enregistrer crée un décalage entre le JSON design et le runner en mémoire. Ce cas impose un **garde-fou UX uniquement** (pas de 409 PUT serveur en v1) :

1. Si `isRunning` **ou** `launchLocked` **ou** snapshot GET `/run` avec `busy === true`, alors :
   - Enregistrer (`data-action="save-scenario"`) est désactivé / no-op ;
   - ajout / suppression de blocs, drag des nœuds, câblage et suppression de câbles sont bloqués ;
   - le panneau inspecteur refuse l'édition des paramètres de design.
2. Stop et le terminal live restent disponibles.
3. Après `completed` / `stopped` / `error`, ou snapshot `busy === false`, le verrou est levé.

Couvre aussi la réhydratation (`CASE-UI-03-9`) : un F5 en plein run ne doit pas rouvrir l'édition.

---

## Cas

```gherkin
Étant donné un Studio avec isRunning=true (ou launchLocked=true)
Quand l'utilisateur tente data-action="save-scenario"
Alors l'action n'émet aucun PUT/POST /api/scenarios
Et le contrôle Enregistrer est disabled ou équivalent

Étant donné le même état actif
Quand l'utilisateur tente d'ajouter un bloc, de déplacer un nœud, de câbler ou d'éditer l'inspecteur
Alors le document canvas et les paramètres de nœud restent inchangés

Étant donné un snapshot GET run avec busy=true après chargement de page
Quand le Studio réhydrate
Alors Enregistrer et l'édition restent verrouillés

Étant donné un run qui passe à status "stopped" (ou busy=false)
Quand le verrou est réévalué
Alors Enregistrer et l'édition du graphe redeviennent possibles
Et Stop peut rester inactif selon SPEC-UI-03
```

---

## Données

| Élément | Valeur |
|---|---|
| Conditions de verrou | `isRunning \|\| launchLocked \|\| snapshot.busy` |
| Actions bloquées | save, add/remove block, drag, wire, delete cable, inspector edit |
| Actions autorisées | Stop, lecture terminal / badges statut |
| Portée | front only (pas de contrat HTTP PUT) |

---

## Nom de test suggéré

`test_CASE_UI_02_16_studio_locks_edit_and_save_while_scenario_running`

---

## Checklist d'implémentation

- [ ] Propager un flag `graphLocked` (ou réutiliser `isRunning \|\| launchLocked`) à toolbar, board, inspecteur.
- [ ] Désactiver `data-action="save-scenario"` pendant le verrou.
- [ ] Bloquer les mutations canvas (add/remove/wire/drag) et l'édition inspecteur.
- [ ] Lever le verrou sur fin de run / snapshot idle.
- [ ] Hors scope : 409 serveur sur PUT scénario pendant run.
