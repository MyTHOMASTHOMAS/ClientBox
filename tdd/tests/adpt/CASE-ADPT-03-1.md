# CASE-ADPT-03-1 — Interruption manuelle Stop d'un processus CLI sans perte ni altération de la session native

**Spécification :** `SPEC-ADPT-03`
**Critère d'acceptation :** `AC-ADPT-03-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

L'action d'interruption Stop manuel envoie un signal système (`SIGTERM`, suivi de `SIGKILL` en cas de non-réponse) pour terminer le sous-processus CLI enfant en cours (`R-23`, `R-24`, `R-34`, `REQ-022`, `REQ-025`). Cette action se distingue fondamentalement de ClearContext (Stop $\neq$ Clear) : elle termine l'exécution sans créer ni supprimer de session native (aucun appel `createSession`, aucune commande CLI de reset). La table de sessions de l'exécution est simplement abandonnée avec elle (`SPEC-ADPT-03`).

## Cas

```gherkin
Étant donné un sous-processus "cursor-cli" en cours d'exécution active pour l'agent "agent-1"
Et un historique de conversation déjà établi au niveau natif du CLI
Quand l'utilisateur déclenche l'action "Stop"
Alors le processus enfant reçoit le signal SIGTERM et s'interrompt immédiatement
Et le statut du scénario passe à l'état interrompu / arrêté
Mais aucune commande de reset de session n'est envoyée au CLI
Et aucun appel "createSession" n'est déclenché par le Stop

Étant donné un processus enfant qui ne répond pas au signal SIGTERM après expiration du délai de grâce STOP_GRACE_MS (3000 ms)
Quand l'action Stop est en cours
Alors le gestionnaire de processus émet un signal SIGKILL pour forcer la libération immédiate des ressources
```

## Données

| Élément | Valeur |
|---|---:|
| Processus cible | Sous-processus `cursor-cli` actif |
| Signal initial | `SIGTERM` |
| Délai de grâce avant escalade | `STOP_GRACE_MS = 3000 ms` (SPEC-ADPT-03) |
| Signal d'escalade forcé | `SIGKILL` |
| Action sur la session native | `AUCUNE` (préservation stricte) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut du processus enfant | `TERMINATED` (tué) | Signal `SIGTERM` / `SIGKILL` appliqué (R-23, R-34) |
| Escalade SIGKILL | Déclenchée si `t > 3000 ms` | Timeout déterministe prévenant les processus zombies |
| Appels `createSession` déclenchés par le Stop | `0` | Distinction formelle Stop vs Clear (R-24) |
| Commande CLI de reset de session | `AUCUNE` | Stop n'agit que sur le processus |

## Ce que ce cas ne vérifie pas

- L'oubli de session par le bloc ClearContext → `CASE-ADPT-03-2` ;
- Le déclenchement de l'arrêt global sur échec interne de bloc → `CASE-ENG-04-3` ;
- Le bouton Stop dans l'interface graphique UI → `SPEC-UI-03`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_03_1_manual_stop_kills_process_without_clearing_session`
**Fichier :** `tests/tests-unitaires/adpt/case-adpt-03-1.test.ts`

## Revue du test automatisé

- [ ] Le test spawne un sous-processus factice et appelle la méthode d'interruption Stop.
- [ ] Le test vérifie que le sous-processus est tué (`SIGTERM`).
- [ ] Le test vérifie qu'aucun `createSession` ni commande de reset n'est invoqué lors de l'arrêt.
- [ ] Le test vérifie l'escalade vers `SIGKILL` en cas de non-terminaison après expiration du délai de grâce `STOP_GRACE_MS = 3000 ms` à l'aide de faux timers déterministes (`jest.useFakeTimers()`, ADR-006).
- [ ] Le test échoue si Stop déclenche une réinitialisation de session.
- [ ] Le nom du test contient `CASE_ADPT_03_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
