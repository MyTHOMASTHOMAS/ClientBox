# CASE-SRV-01-7 — Résilience d'exécution headless : scénario introuvable, échec de bloc et arrêt SIGINT

**Spécification :** `SPEC-SRV-01`  
**Critère d'acceptation :** `AC-SRV-01-7`  
**Type :** acceptation / résilience  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-020`  
**Modules cibles :** `ROOT-001` (`src/index.ts`), `CTL-004` (`cli-scenario.controller.ts`)  

---

## Ce que ce cas protège

En mode d'exécution direct en ligne de commande (`--exec-scene`), ClientsBox doit gérer de manière robuste les situations d'erreur et les signaux d'interruption système (`REQ-044`, `R-48`, `R-25`) :
1. **Scénario introuvable :** Si la cible fournie ne correspond à aucun identifiant ni aucun libellé dans `.agents/data/scenarios/`, ClientsBox doit émettre un message d'erreur explicite en français sur `stderr` et se terminer immédiatement avec le code de sortie `1`.
2. **Échec d'un bloc en cours de scénario :** Si un bloc quelconque échoue (code de sortie CLI agent non nul, exception script If, échec de bloc Command ou CallScenario), le runner ordonne l'arrêt d'urgence global de toutes les branches (`R-25`), imprime un diagnostic sur `stderr` et termine le processus avec le code de sortie `1`.
3. **Interruption manuelle (Ctrl+C / `SIGINT`) :** La réception du signal `SIGINT` doit être interceptée pour déclencher immédiatement `runner.stop()` : tous les sous-processus actifs (agents et commandes) reçoivent l'escalade propre `SIGTERM` $\rightarrow$ `SIGKILL` (aucun processus orphelin en tâche de fond), un message d'interruption est affiché, et le processus se termine avec le code de sortie standard `130`.

---

## Cas

```gherkin
Scénario : Scénario demandé introuvable
  Étant donné un projet ne contenant aucun scénario correspondant à "scenario-fantome"
  Quand l'utilisateur lance ClientsBox avec l'option `--exec-scene scenario-fantome`
  Alors un message d'erreur explicatif est émis sur stderr
  Et le processus se termine avec le code de sortie 1

Scénario : Échec d'un bloc en cours d'exécution
  Étant donné un scénario contenant un bloc Command configuré avec une commande erronée
  Quand l'utilisateur lance ClientsBox avec l'option `--exec-scene` ciblant ce scénario
  Alors le bloc échoue et l'arrêt d'urgence global du scénario est ordonné
  Et le diagnostic d'échec est émis sur stderr
  Et le processus se termine avec le code de sortie 1

Scénario : Interruption manuelle par signal SIGINT (Ctrl+C)
  Étant donné un scénario en cours d'exécution avec un sous-processus actif
  Quand le processus principal ClientsBox reçoit le signal SIGINT
  Alors l'arrêt d'urgence immédiat runner.stop() est déclenché
  Et le sous-processus actif est arrêté de façon propre (SIGTERM/SIGKILL)
  Et un message d'interruption opérateur est émis
  Et le processus quitte avec le code de sortie 130
```

---

## Données

| Cas d'erreur | Cible ou déclencheur | Flux de message | Code exit attendu |
|---|---|---|---|
| Scénario inexistant | `"scenario-inconnu-xyz"` | `stderr` | `1` |
| Échec de bloc | Scénario à commande défaillante (`exit 42`) | `stderr` | `1` |
| Interruption manuelle | Émission de `SIGINT` pendant run | `stdout`/`stderr` | `130` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Diagnostic introuvable | Message en français sur stderr | AC-SRV-01-7 / REQ-044 |
| Échec scénario | Arrêt global R-25 et exit code 1 | R-48 |
| Gestion SIGINT | Arrêt sans orphelins et exit code 130 | Standard POSIX 128 + SIGINT(2) = 130 |

---

## Ce que ce cas ne vérifie pas

- L'exécution nominale réussie → `CASE-SRV-01-6` ;
- Le parsing unitaire des options CLI → `CASE-SRV-01-5`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_01_7_headless_resilience_missing_scenario_block_error_and_sigint`  
**Fichier :** `tests/units/srv/CASE-SRV-01-7.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie le rejet sur scénario inexistant avec code 1 et message sur stderr.
- [ ] Le test vérifie qu'un échec de bloc entraîne l'arrêt global et la sortie avec code 1.
- [ ] Le test vérifie que la capture de SIGINT appelle `runner.stop()` et sort avec le code 130.
- [ ] Le test confirme la libération de tous les processus fils sans laisser d'orphelins.
- [ ] Le nom du test contient `CASE_SRV_01_7`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-009 / CDC v2.2.
