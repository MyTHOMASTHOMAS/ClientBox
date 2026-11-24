# CASE-SRV-01-6 — Exécution nominale headless d'un scénario en direct dans le terminal sans serveur HTTP

**Spécification :** `SPEC-SRV-01`  
**Critère d'acceptation :** `AC-SRV-01-6`  
**Type :** acceptation / intégration  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-020`  
**Modules cibles :** `ROOT-001` (`src/index.ts`), `CTL-004` (`cli-scenario.controller.ts`)  

---

## Ce que ce cas protège

Lorsqu'un utilisateur lance ClientsBox avec l'argument `--exec-scene <cible>` (`REQ-044`, `R-48`), l'application doit :
1. Résoudre le scénario ciblé dans `.agents/data/scenarios/` en testant d'abord l'identifiant exact (`scenario.id`), puis par repli le libellé insensible à la casse (`scenario.name`) ;
2. Instancier le moteur de scénario (`ScenarioRunnerService`) et exécuter le graphe de manière autonome en direct dans le terminal ;
3. **N'instancier aucun serveur HTTP local** : aucun socket TCP ne doit être ouvert (le port 2974 reste totalement libre) ;
4. Diffuser en streaming temps réel sur la sortie standard (`stdout`) les flux bruts produits par les agents/commandes, enrichis des marqueurs textuels explicites de cycle de vie émis par ClientsBox (Option B validée : `[ClientsBox] Démarrage...`, `[Bloc: <id>] Terminé`, `[ClientsBox] Succès global`) ;
5. Se terminer avec le code de sortie système `0` dès que le scénario s'achève avec le statut `completed`.

---

## Cas

```gherkin
Scénario : Exécution headless nominale par identifiant technique exact
  Étant donné un projet avec un scénario existant "test-step4-command" (exécutant un bloc Start -> Command)
  Et aucun serveur HTTP n'est en cours d'écoute
  Quand l'utilisateur lance ClientsBox via l'option `--exec-scene test-step4-command`
  Alors aucun port TCP n'est lié par ClientsBox
  Et les flux textuels du bloc Command sont streamés sur stdout
  Et les marqueurs de cycle de vie ClientsBox sont imprimés dans le terminal
  Et le processus se termine avec le code de sortie 0

Scénario : Exécution headless par nom lisible de scénario
  Étant donné un projet avec un scénario dont le champ name vaut "Test Step 4 — Commande Shell Native"
  Quand l'utilisateur lance ClientsBox via l'option `--exec-scene "Test Step 4 — Commande Shell Native"`
  Alors le scénario correspondant est identifié et exécuté avec succès
  Et le processus se termine avec le code de sortie 0
```

---

## Données

| Paramètre | Valeur de test |
|---|---|
| Scénario cible par id | `test-step4-command` |
| Scénario cible par name | `Test Step 4 — Commande Shell Native` |
| Port HTTP lié | `AUCUN` (0 socket lié) |
| Flux capturés | `stdout` (chunks et marqueurs `[ClientsBox]`) |
| Code de sortie attendu | `0` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| État du serveur HTTP | Non démarré | AC-SRV-01-6 / REQ-044 / ADR-020 |
| Résolution du scénario | Trouvé par `id` ou `name` | R-48 |
| Marqueurs console | Présents dans le flux stdout | Option B validée |
| Code de sortie Node | `0` | Terminaison nominale |

---

## Ce que ce cas ne vérifie pas

- Le comportement sur scénario inexistant ou bloc en échec → `CASE-SRV-01-7` ;
- L'interruption manuelle par signal `SIGINT` (Ctrl+C) → `CASE-SRV-01-7` ;
- Le parsing unitaire de l'argument de commande → `CASE-SRV-01-5`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_01_6_headless_scenario_execution_and_terminal_streaming`  
**Fichier :** `tests/units/srv/CASE-SRV-01-6.test.ts`  

## Revue du test automatisé

- [ ] Le test exécute un scénario via le runner headless sans démarrer de serveur HTTP.
- [ ] Le test vérifie que la résolution fonctionne par identifiant exact et par nom.
- [ ] Le test vérifie la présence des chunks textuels et des marqueurs `[ClientsBox]` dans la sortie console.
- [ ] Le test confirme que le code de retour final est 0.
- [ ] Le test vérifie qu'aucun socket TCP n'a été ouvert sur le port de test.
- [ ] Le nom du test contient `CASE_SRV_01_6`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-009 / CDC v2.2.
