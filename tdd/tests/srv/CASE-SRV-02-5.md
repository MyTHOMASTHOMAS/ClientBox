# CASE-SRV-02-5 — Cascade SIGINT/SIGTERM : libération HTTP et interruption des sous-processus CLI actifs

**Spécification :** `SPEC-SRV-02`
**Critère d'acceptation :** `AC-SRV-02-5`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Lorsqu'un signal OS (`SIGINT` / `SIGTERM`) survient pendant qu'un scénario exécute un sous-processus CLI, ClientsBox doit non seulement libérer le port HTTP (`CASE-SRV-02-3`) mais aussi transmettre l'arrêt aux enfants via `ScenarioRunnerService.stop()` / `LIB-004` (`SPEC-SRV-02` cas limite #3, `SPEC-ADPT-03`). Sans cette cascade, des processus CLI zombies resteraient actifs après extinction du serveur.

## Cas

```gherkin
Étant donné le serveur ClientsBox en écoute sur le port TCP 2974
Et un scénario en cours d'exécution avec un sous-processus "cursor-cli" enfant actif
Quand le processus serveur reçoit le signal d'interruption "SIGINT"
Alors le serveur HTTP ferme sa socket d'écoute et le port 2974 est libre
Et le sous-processus enfant reçoit SIGTERM (puis SIGKILL si non terminé après STOP_GRACE_MS = 3000 ms)
Et le processus Node se termine avec le code de sortie 0

Étant donné le serveur ClientsBox en écoute sur le port TCP 2974
Et un scénario en cours d'exécution avec un sous-processus "cursor-cli" enfant actif
Quand le processus serveur reçoit le signal d'interruption "SIGTERM"
Alors le serveur HTTP ferme sa socket d'écoute et le port 2974 est libre
Et le sous-processus enfant est interrompu selon la même escalade SPEC-ADPT-03
Et le processus Node se termine avec le code de sortie 0
```

## Données

| Élément | Valeur |
|---|---:|
| Port d'écoute | `2974` (ou port temporaire de test) |
| Signaux OS testés | `SIGINT`, `SIGTERM` |
| Sous-processus simulé | enfant spawné via `LIB-004` / adapter |
| Délai de grâce | `STOP_GRACE_MS = 3000 ms` (`SPEC-ADPT-03`) |
| Code de sortie serveur | `0` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Libération port HTTP | `OUI` | `server.close()` effectif |
| Invocation `ScenarioRunnerService.stop()` | `OUI` | Handler OS → holder runner (`signature-src.md` L22) |
| Signal initial enfant | `SIGTERM` | Escalade `SPEC-ADPT-03` |
| Escalade `SIGKILL` | Si `t > 3000 ms` | Timeout déterministe (FakeTimers ADR-006) |
| Code sortie processus parent | `0` | Arrêt gracieux |

## Ce que ce cas ne vérifie pas

- L'arrêt HTTP **sans** tâche active (libération port seule) → `CASE-SRV-02-3` ;
- Le Stop **manuel** utilisateur depuis l'UI → `CASE-ADPT-03-1` / `CASE-UI-03-2` ;
- La préservation de session native après Stop → `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_5_os_signal_cascades_to_cli_subprocess`
**Fichier :** `tests/tests-unitaires/srv/case-srv-02-5.test.ts`

## Revue du test automatisé

- [ ] Le test démarre le serveur avec un runner/sous-processus enfant simulé actif.
- [ ] Le test émet `SIGINT` et `SIGTERM` séparément.
- [ ] Le test vérifie la fermeture HTTP **et** l'interruption de l'enfant.
- [ ] Le test vérifie le code de sortie `0`.
- [ ] Le nom du test contient `CASE_SRV_02_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
