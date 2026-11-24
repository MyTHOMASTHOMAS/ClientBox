# CASE-ENG-04-3 — Détection d'échec de bloc et arrêt global immédiat d'urgence du scénario

**Spécification :** `SPEC-ENG-04`
**Critère d'acceptation :** `AC-ENG-04-3`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

En cas de défaillance d'un bloc quelconque au cours de l'exécution (code de sortie CLI d'erreur, exception dans un script If, timeout ou ressource introuvable), le moteur ordonne l'arrêt d'urgence immédiat de l'ensemble du scénario (`R-25`, `REQ-026`). Tous les processus en cours sur des branches parallèles sont interrompus et le scénario bascule dans l'état d'erreur global. Si cette interruption globale manquait, des branches orphelines poursuivraient des actions destructrices ou consommatrices de tokens sur une exécution déjà compromise.

## Cas

```gherkin
Étant donné un scénario avec deux branches parallèles issues d'un bloc Start :
  - Branche A : bloc "run-failing" suivi de "run-subsequent"
  - Branche B : bloc "run-parallel" en cours d'exécution
Quand le bloc "run-failing" échoue avec un code de sortie CLI non nul (exit code 1)
Alors le moteur interrompt immédiatement le sous-processus de "run-parallel" sur la Branche B
Et le bloc "run-subsequent" n'est jamais déclenché
Et le statut global du scénario passe à "ERREUR"

Étant donné un scénario avec deux branches dont la Branche B est suspendue en état de pause
Quand le bloc de la Branche A subit un échec fatal (exit code 1 ou exception)
Alors l'état de pause de la Branche B est immédiatement révoqué
Et le scénario passe au statut "ERREUR" sans rester suspendu indéfiniment

Étant donné un bloc If dont le script "if.js" lève une exception JavaScript runtime inattendue
Quand le moteur évalue ce bloc
Alors l'exception est interceptée par le moteur sans crash de l'application
Et l'arrêt global du scénario est déclenché avec notification d'erreur nominative
```

## Données

| Élément | Valeur |
|---|---:|
| Branche A | `id: "run-failing"` (échec exit code 1) $\rightarrow$ `id: "run-subsequent"` |
| Branche B (processus actif) | `id: "run-parallel"` (processus actif en cours) |
| Branche B (pause/attente) | `id: "pause-waiting"` (état suspendu / en attente utilisateur) |
| Erreur simulée CLI | Code de sortie 1 avec stderr `"Erreur fatale build"` |
| Erreur simulée script If | `throw new Error("Clé introuvable dans sac")` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut global scénario après échec Run | `ERREUR` | Arrêt global d'urgence (R-25, REQ-026) |
| Interruption sous-processus Branche B | `OUI` | Signal d'arrêt immédiat émis vers adapter |
| Révocation état pause Branche B | `OUI` | Annulation suspension pour basculer en ERREUR |
| Déclenchement de `run-subsequent` | `JAMAIS` | Arrêt de la séquence en amont |
| Crash serveur ClientsBox sur exception If | `NON` | Exception runtime interceptée proprement (cas limite 3) |
| Diagnostic émis | `OUI` | Message d'erreur identifiant le bloc défaillant |

## Ce que ce cas ne vérifie pas

- L'arrêt manuel déclenché par l'utilisateur via le bouton Stop → `SPEC-ADPT-03` ;
- L'émission nominale d'un bloc Run réussi → `CASE-ENG-03-2` ;
- Le rejet statique des fichiers JSON corrompus → `CASE-DATA-01-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_04_3_block_failure_triggers_immediate_global_scenario_stop`
**Fichier :** `tests/tests-unitaires/eng/case-eng-04-3.test.ts`

## Revue du test automatisé

- [ ] Le test lance un scénario bi-branche et simule un échec CLI sur l'une des branches.
- [ ] Le test vérifie que la branche concurrente active est interrompue immédiatement.
- [ ] Le test vérifie qu'une branche concurrente en pause est révoquée sans bloquer le passage à ERREUR.
- [ ] Le test vérifie qu'aucun bloc en aval du bloc défaillant n'est exécuté.
- [ ] Le test vérifie l'interception propre d'une exception dans un script If sans crash du serveur.
- [ ] Le test échoue si des blocs continuent de s'exécuter après l'échec.
- [ ] Le nom du test contient `CASE_ENG_04_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

