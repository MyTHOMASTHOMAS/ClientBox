# CASE-SRV-01-3 — Arrêt immédiat avec code de sortie non nul en cas de port déjà occupé ou invalide

**Spécification :** `SPEC-SRV-01`
**Critère d'acceptation :** `AC-SRV-01-3`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Si le port d'écoute demandé (qu'il s'agisse du port par défaut 2974 ou d'un port surchargé) est déjà occupé par un autre processus (`EADDRINUSE`), ou si la valeur fournie est invalide (non numérique, négative, égale à 0 ou supérieure à 65535), le processus ClientsBox doit s'interrompre immédiatement avec un code de sortie non nul (> 0) et émettre un message d'erreur explicite sur `stderr` (`REQ-005`, `R-35`). Il est strictement interdit de tenter automatiquement un autre port de repli sans intervention de l'utilisateur (`R-35`).

## Cas

```gherkin
Étant donné un processus tiers écoutant déjà sur le port TCP 2974
Quand l'utilisateur lance ClientsBox sans argument ("node .agents/clientsbox.js")
Alors le démarrage échoue immédiatement avec une erreur EADDRINUSE
Et un message explicite est écrit sur la sortie d'erreur standard (stderr)
Et le processus s'arrête avec un code de sortie non nul (exit code > 0)
Et le processus ne tente d'ouvrir aucun port alternatif (pas de fallback auto)

Étant donné un processus tiers écoutant déjà sur le port TCP 8080
Quand l'utilisateur lance ClientsBox avec l'option "-p 8080"
Alors le démarrage échoue immédiatement avec une erreur EADDRINUSE
Et un message explicite est écrit sur stderr sans tentative de repli
Et le processus s'arrête avec un code de sortie non nul (exit code > 0)

Étant donné l'utilisateur lançant ClientsBox avec un port non numérique ("--port abc")
Quand la ligne de commande est analysée
Alors le démarrage est immédiatement refusé
Et un message d'erreur d'usage est écrit sur stderr
Et le processus s'arrête avec un code de sortie non nul

Étant donné l'utilisateur lançant ClientsBox avec un port hors plage ("-p 0" ou "-p 70000")
Quand la ligne de commande est analysée
Alors le démarrage est immédiatement refusé avec diagnostic sur la plage valide (1–65535)
Et le processus s'arrête avec un code de sortie non nul
```

## Données

| Élément | Valeur |
|---|---:|
| Cas de conflit réseau | Port `2974` (défaut) ou `8080` (surcharge `-p`) déjà lié |
| Cas d'argument non numérique | `--port abc` |
| Cas de port nul / négatif | `-p 0`, `-p -1` |
| Cas de port hors plage TCP | `--port 70000` |
| Plage de ports autorisée | `1` à `65535` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Code de sortie sur port occupé | `> 0` (ex. `1`) | Arrêt fatal immédiat sans retry ni fallback (R-35) |
| Code de sortie sur port syntaxiquement invalide | `> 0` | Validation des arguments de ligne de commande en amont |
| Émission d'un message sur `stderr` | `OUI` | Diagnostic lisible pour l'opérateur |
| Tentative de bind sur port n+1 | `AUCUNE` | Interdiction stricte de port hopping automatique (R-35) |

## Ce que ce cas ne vérifie pas

- Le démarrage nominal sur port par défaut libre → `CASE-SRV-01-1` ;
- Le démarrage nominal avec port surchargé valide → `CASE-SRV-01-2` ;
- L'arrêt gracieux provoqué par `SIGINT` ou `SIGTERM` → `CASE-SRV-02-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_01_3_immediate_exit_on_busy_or_invalid_port`
**Fichier :** `tests/tests-unitaires/srv/case-srv-01-3.test.ts`

## Revue du test automatisé

- [ ] Le test simule un port pré-occupé (port par défaut 2974 ou port surchargé -p 8080) et vérifie l'interception de l'erreur `EADDRINUSE`.
- [ ] Le test vérifie que le code de sortie du processus est supérieur à 0.
- [ ] Le test vérifie qu'aucun autre port n'est ouvert en substitution (`R-35`).
- [ ] Le test vérifie le rejet immédiat d'une valeur de port non numérique (`--port abc`).
- [ ] Le test vérifie le rejet d'un port hors plage (`-p 0` et `-p 70000`).
- [ ] Le test vérifie la présence d'un message d'erreur sur `stderr`.
- [ ] Le nom du test contient `CASE_SRV_01_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
