# CASE-ADPT-03-5 — Nettoyage et non-prolifération des sous-processus CLI orphelins en cas d'interruption du serveur

**Spécification :** `SPEC-ADPT-03`, `SPEC-SRV-01`  
**Critère d'acceptation :** `AC-ADPT-03-1`, `AC-SRV-01-3`  
**Type :** acceptation / intégration  
**Niveau de risque :** critique  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

Le module de lancement de commandes (`LIB-004 child-process.spawner.ts`), le service d'agent (`SVC-004 agent.service.ts`) et la Composition Root serveur (`ROOT-001 src/index.ts`) supervisent l'exécution des processus enfants CLI (notamment `cursor-cli`). Si le serveur ClientsBox est interrompu (réception d'un signal système `SIGINT`, `SIGTERM` ou fermeture par l'utilisateur pendant qu'une tâche agent s'exécute), ce cas garantit :
1. Que le serveur intercepte le signal et ordonne immédiatement la terminaison des processus enfants actifs via `process.kill()` ou le mécanisme d'arrêt de l'adapter.
2. Qu'aucun sous-processus orphelin ou zombie ne continue de consommer des ressources processeur ou mémoire de façon clandestine sur la machine hôte.
3. Que tous les descripteurs de flux I/O (`stdin`, `stdout`, `stderr`) attachés aux enfants sont fermés proprement.

---

## Cas

```gherkin
Étant donné un serveur ClientsBox en fonctionnement
Et un sous-processus CLI lancé via "Spawner" pour exécuter une commande longue durée
Et le handle de processus enfant supervisé et actif dans le gestionnaire de processus
Quand le serveur reçoit un signal d'interruption du système d'exploitation ("SIGINT" ou "SIGTERM")
Alors le gestionnaire de terminaison invoque "kill()" sur le processus enfant actif
Et le sous-processus enfant est effectivement terminé (état killed ou exit notifié)
Et aucun processus CLI orphelin n'est laissé en exécution détachée
Et les descripteurs de flux sont clôturés sans fuite de handles
```

---

## Données

| Élément | Valeur |
|---|---:|
| Signal de terminaison reçu | `SIGINT` ou `SIGTERM` (`node:process`) |
| Signal envoyé à l'enfant | `SIGTERM` puis escalade `SIGKILL` si nécessaire per ADR-002 |
| Méthode de lancement | `Spawner.spawn(command, args, options)` |
| Registre des processus actifs | Liste des enfants supervisés dans le cycle de vie du serveur |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Processus enfants vivants post-arrêt | `0 processus` | Nettoyage exhaustif par le signal d'interruption |
| Fermeture des flux I/O | Flux fermés (`destroyed: true`) | Libération des handles OS |
| Code de sortie serveur | `0` ou code signal | Sortie maîtrisée sans blocage |

---

## Ce que ce cas ne vérifie pas

- L'arrêt d'urgence initié par l'API REST `DELETE /api/scenarios/:id/run` → `CASE-UI-03-5` ;
- La dissociation entre `clearContext` et le cycle de vie du processus → `CASE-ADPT-03-4` ;
- Le protocole de temporisation de grâce de 3000 ms → `CASE-ENG-04-6`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ADPT_03_5_server_shutdown_child_process_orphan_cleanup`  
**Fichier :** `tests/units/adpt/case-adpt-03-5.test.ts`  

## Revue du test automatisé

- [ ] Le test spawne un sous-processus simulant une tâche longue.
- [ ] Le test déclenche le gestionnaire de shutdown du serveur.
- [ ] Le test vérifie que le sous-processus reçoit le signal de kill.
- [ ] Le test vérifie qu'aucun processus orphelin ne subsiste après la terminaison.
- [ ] Le nom du test contient `CASE_ADPT_03_5`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
