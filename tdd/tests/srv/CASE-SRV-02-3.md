# CASE-SRV-02-3 — Arrêt gracieux du serveur HTTP avec libération effective du port sur réception de SIGINT ou SIGTERM

**Spécification :** `SPEC-SRV-02`
**Critère d'acceptation :** `AC-SRV-02-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Lors de la réception d'un signal d'interruption système (`SIGINT` typiquement déclenché par Ctrl+C, ou `SIGTERM` envoyé par un orchestrateur de processus), le serveur HTTP doit procéder à une extinction gracieuse : fermeture de l'écoute socket, libération immédiate du port TCP et terminaison du processus avec le code de sortie 0 (`SPEC-SRV-02`, `AC-SRV-02-3`). Si le port n'était pas libéré ou si le processus restait bloqué à l'état zombie, toute tentative de relance ultérieure échouerait avec une erreur `EADDRINUSE`.

## Cas

```gherkin
Étant donné le serveur ClientsBox en cours d'exécution sur le port TCP 2974
Quand le processus reçoit le signal d'interruption "SIGINT"
Alors le serveur HTTP ferme immédiatement sa socket d'écoute
Et le port TCP 2974 devient immédiatement libre pour d'autres processus
Et le processus Node.js termine son exécution avec le code de sortie 0

Étant donné le serveur ClientsBox en cours d'exécution sur le port TCP 2974
Quand le processus reçoit le signal d'interruption "SIGTERM"
Alors le serveur HTTP ferme immédiatement sa socket d'écoute
Et le port TCP 2974 devient immédiatement libre pour d'autres processus
Et le processus Node.js termine son exécution avec le code de sortie 0
```

## Données

| Élément | Valeur |
|---|---:|
| Port d'écoute testé | `2974` (ou port temporaire dédié de test) |
| Signaux système testés | `SIGINT`, `SIGTERM` |
| Code de sortie attendu | `0` (terminaison normale sur signal d'arrêt) |
| État final du port | `LIBRE` (vérifiable par bind immédiat) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Réception et interception du signal | `OUI` | Handler `process.on('SIGINT', ...)` et `process.on('SIGTERM', ...)` |
| Libération de la socket TCP | `IMMÉDIATE` | Appel effectif de `server.close()` |
| Réutilisabilité du port après arrêt | `100%` | Nouveau serveur capable d'écouter sur 2974 sans `EADDRINUSE` |
| Code de terminaison | `0` | Arrêt gracieux propre (SPEC-SRV-02 / AC-SRV-02-3) |

## Ce que ce cas ne vérifie pas

- L'interruption des sous-processus CLI enfants lors d'un signal OS → `CASE-SRV-02-5` ; le Stop manuel utilisateur → `CASE-ADPT-03-1` ;
- Le traitement des requêtes HTTP en vol pendant l'arrêt.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_3_graceful_http_server_shutdown_on_sigint_sigterm`
**Fichier :** `tests/tests-unitaires/srv/case-srv-02-3.test.ts`

## Revue du test automatisé

- [ ] Le test démarre une instance de serveur HTTP sur un port donné.
- [ ] Le test émet séparément les signaux `SIGINT` et `SIGTERM` vers le processus serveur.
- [ ] Le test vérifie que la méthode de fermeture de la socket `server.close()` est invoquée.
- [ ] Le test vérifie qu'un second serveur peut immédiatement se lier sur le même port sans erreur `EADDRINUSE`.
- [ ] Le test vérifie que le code de sortie final est 0.
- [ ] Le nom du test contient `CASE_SRV_02_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
