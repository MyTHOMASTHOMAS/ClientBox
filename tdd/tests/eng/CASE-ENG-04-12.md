# CASE-ENG-04-12 — Bloc Command : tracking dans les processus actifs et interruption d'urgence (Stop)

**Spécification :** `SPEC-ENG-04`, `SPEC-ENG-03`  
**Critère d'acceptation :** `AC-ENG-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-019`  
**Service / contrats cibles :** `SVC-001`, `runner-active-processes`, spawner process  

---

## Ce que ce cas protège

Lorsqu'un bloc **Command** est en cours d'exécution, son sous-processus système doit être immédiatement inscrit dans le registre partagé des processus actifs de l'exécution (`runner-active-processes`) (`ADR-019`).

Si l'utilisateur déclenche un arrêt d'urgence (**Stop** manuel per `R-34`, `REQ-025`, `REQ-043`), ou si une branche concurrente échoue et provoque l'arrêt global sur erreur (`R-25`, `REQ-026`), le moteur doit **tuer immédiatement le processus de la commande** en cours (signal d'interruption).

Sans ce tracking systématique, des commandes longues ou des scripts orphelins (ex. compilations lourdes, boucles shell, utilitaires réseaux) survivraient en arrière-plan sur la machine hôte après un Stop, consommant des ressources et créant des effets de bord incontrôlés.

---

## Cas

```gherkin
Scénario : Stop manuel pendant l'exécution d'un bloc Command
  Étant donné un scénario avec un bloc Command exécutant une commande shell longue (ex. sleep)
  Quand l'utilisateur déclenche Stop sur le scénario racine via runner.stop()
  Alors le sous-processus système de la commande est immédiatement tué (signal envoyé)
  Et le processus est retiré des processus actifs
  Et le scénario passe au statut arrêté ("stopped" ou "error")
  Et aucune sortie power n'est propagée

Scénario : Échec d'une branche concurrente tue le processus Command en cours
  Étant donné un scénario avec deux branches parallèles : un bloc Command long et un bloc Run échouant
  Quand le bloc Run échoue
  Alors l'arrêt global du scénario racine est déclenché (R-25)
  Et le processus de la commande en cours sur l'autre branche est immédiatement interrompu
  Et le statut final global est en erreur ("error")

Scénario : Nettoyage propre du registre des processus après terminaison nominale
  Étant donné un bloc Command qui s'exécute et se termine normalement (exit code 0)
  Quand le processus s'achève
  Alors son handle est retiré du registre des processus actifs
  Et un Stop ultérieur ne tente pas de tuer un processus déjà clos
```

---

## Données

| Élément | Valeur |
|---|---|
| Registre de tracking | `runner-active-processes` |
| Action d'interruption | `runner.stop()` ou `DELETE /api/scenarios/:id/run` |
| Commande testée | Processus long (ou simulant une durée active) |
| Processus survivants attendus | `0` (`R-34`, `REQ-025`, `REQ-043`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Inscription dans processus actifs | `OUI` | dès le spawn |
| Kill sur Stop manuel | `OUI` (signal transmis) | R-34 / REQ-025 / REQ-043 |
| Kill sur échec concurrent | `OUI` | R-25 / REQ-026 |
| Processus résiduel | `0` | AC-ENG-04-3 |

---

## Ce que ce cas ne vérifie pas

- L'exécution nominale sans interruption → `CASE-ENG-03-9` ;
- Le stop récursif sous-scénario CallScenario → `CASE-ENG-04-11` ;
- L'interface du bouton Stop dans le terminal → `CASE-UI-03-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_12_command_block_active_process_tracking_and_stop_kill`  
**Fichier :** `tests/units/eng/CASE-ENG-04-12.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'inscription du process Command dans le registre actif.
- [ ] Le test vérifie que l'appel à `runner.stop()` interrompt le processus système.
- [ ] Le test vérifie qu'un échec sur une branche concurrente interrompt le process Command.
- [ ] Le test vérifie le dé-enregistrement propre à la fin normale de la commande.
- [ ] Le nom du test contient `CASE_ENG_04_12`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1.
