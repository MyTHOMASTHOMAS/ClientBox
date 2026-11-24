# CASE-ENG-03-9 — Bloc Command : exécution shell OS, await exit 0 et émission `power: 1`

**Spécification :** `SPEC-ENG-03`, `SPEC-ENG-01`  
**Critère d'acceptation :** `AC-ENG-03-7`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-019`  
**Service / contrats cibles :** `SVC-001` (runner), exécuteurs de blocs, `runner-active-processes`  

---

## Ce que ce cas protège

Le bloc **Command** (`R-47`, `REQ-042`, `REQ-043`) permet d'exécuter une commande système OS arbitraire au sein d'un graphe de scénario sans faire appel à un adapter d'agent CLI. Après validation du join d'entrée (`N ≥ 1` et `sum(power) === N`), il lance la commande avec **`cwd = workspacePath`**, **attend** sa fin complète, et émet `{ blockType: 'command', value: null, power: 1 }` sur chaque sortie câblée si le code de sortie est **0**. Le bloc ne lit pas le sac d'entrées.

Si la commande se termine avec un **code de sortie différent de 0** ou si elle est introuvable / syntaxiquement invalide, le bloc échoue immédiatement et déclenche l'**arrêt global d'urgence du scénario racine** (`R-25`, `REQ-026`). Ses flux stdout et stderr sont transmis en temps réel via l'événement `chunkReceived` du runner.

Sans cette vérification, le moteur risquerait de poursuivre prématurément le graphe, de masquer des erreurs de scripts système, ou de ne pas respecter le répertoire de travail du projet.

---

## Cas

```gherkin
Scénario : Exécution nominale Command avec exit code 0
  Étant donné un scénario avec Start --> Cmd-1(commandLine="echo 'test command'") --> Run-after
  Et le workspace positionné sur "/app/mon-projet"
  Quand ScenarioRunnerService.run() exécute le scénario
  Alors la commande shell est exécutée avec cwd "/app/mon-projet"
  Et le runner attend la fin du processus shell
  Et Cmd-1 émet sur ses sorties "{ blockType: 'command', value: null, power: 1 }"
  Et Run-after est déclenché après l'achèvement de Cmd-1
  Et Cmd-1 ne lit pas le sac d'entrées

Scénario : Échec d'un bloc Command avec code de sortie non nul
  Étant donné un bloc Command configuré avec une commande retournant exit 1
  Quand le processus shell se termine avec exit code 1
  Alors le bloc Command passe au statut d'erreur
  Et le scénario racine bascule en statut d'erreur global (R-25)
  Et aucun message power n'est émis sur les sorties du bloc Command

Scénario : Échec sur commande invalide ou introuvable
  Étant donné un bloc Command avec commandLine pointant vers un exécutable inexistant
  Quand le runner exécute le bloc
  Alors l'erreur de spawn fait échouer le bloc
  Et le scénario racine s'interrompt en statut d'erreur (R-25, REQ-043)

Scénario : Relais temps réel des flux stdout et stderr
  Étant donné un bloc Command émettant des données sur stdout et stderr
  Quand le processus s'exécute
  Alors les chunks sont transmis au runner racine via le callback chunkReceived
  Et les événements portent nodeId "Cmd-1" et streamType ("stdout" ou "stderr")
```

---

## Données

| Élément | Valeur |
|---|---|
| Type nœud | `command` |
| Paramètre statique | `commandLine: "..."` |
| Répertoire d'exécution | `cwd = workspacePath` (`REQ-006`, `REQ-043`) |
| Entrées / Sorties | `1..N` in / `0..N` out, sac non lu |
| Message de succès | `{ blockType: 'command', value: null, power: 1 }` |
| Échec | exitCode !== 0 ou erreur spawn ⇒ `failBlock` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Répertoire d'exécution | `workspacePath` | REQ-006 / REQ-043 |
| Await complétion process | `OUI` | AC-ENG-03-7 |
| Message émis (exit 0) | `{ blockType: 'command', value: null, power: 1 }` | R-47 / REQ-042 |
| Statut racine sur exit ≠ 0 | `error` / arrêt global | R-25 / REQ-026 |
| Chunks relayés | reçus sur `chunkReceived` | REQ-024 / REQ-043 |

---

## Ce que ce cas ne vérifie pas

- L'interruption manuelle du process par le bouton Stop → `CASE-ENG-04-12` ;
- La persistance et la validation de schéma `commandLine` → `CASE-DATA-03-8` ;
- L'interface d'édition toolbar et inspecteur → `CASE-UI-02-19`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_03_9_command_block_shell_execution_await_exit_and_power`  
**Fichier :** `tests/units/eng/CASE-ENG-03-9.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie que la commande s'exécute dans `workspacePath`.
- [ ] Le test vérifie l'attente complète de la fin du processus avant émission.
- [ ] Le test vérifie l'émission de `{ blockType: 'command', value: null, power: 1 }` sur exit 0.
- [ ] Le test vérifie l'arrêt global racine sur code de sortie ≠ 0 ou erreur spawn.
- [ ] Le test vérifie le relais des chunks stdout/stderr sur `chunkReceived`.
- [ ] Le nom du test contient `CASE_ENG_03_9`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1.
