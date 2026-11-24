# CASE-ADPT-03-3 — Sessions propres à l'exécution, non persistées, création unique en parallèle

**Spécification :** `SPEC-ADPT-03`
**Critère d'acceptation :** `AC-ADPT-03-3`
**Type :** acceptation / intégration runner
**Niveau de risque :** élevé
**Service / contrats cibles :** `SVC-001` (`ScenarioRunnerService`), `CLIAdapter.createSession`

## Ce que ce cas protège

Les contextes sont **spécifiques au scénario** : chaque exécution repart de sessions neuves, et la table `agentId → sessionId` n'existe qu'en mémoire vive le temps de l'exécution (`REQ-101`, `R-32`). Aucune donnée de session n'est écrite par ClientsBox sur disque. Lorsque deux Runs du même agent démarrent en parallèle sans session existante, une seule session est créée et partagée (sinon l'agent aurait deux mémoires divergentes dans la même exécution). L'exécution parallèle elle-même n'est pas sérialisée (`R-33`).

## Cas

```gherkin
Étant donné un adapter simulé dont "createSession" retourne "chat-1", puis "chat-2", ...
Et un scénario : Start --> Run-1(agent-a)
Quand le scénario est exécuté une première fois par un runner
Et exécuté une seconde fois par un nouveau runner
Alors "createSession" est appelé 1 fois par exécution (2 au total)
Et Run-1 reçoit "chat-1" à la 1re exécution et "chat-2" à la 2e

Étant donné un répertoire de données temporaire servant de dataRoot
Quand une exécution se termine
Alors aucun fichier contenant "chat-1" ou "chat-2" n'a été créé ou modifié sous ce répertoire

Étant donné un scénario : Start --> Run-A(agent-a) et Start --> Run-B(agent-a) (fan-out)
Et un "createSession" résolu de manière asynchrone
Quand le scénario est exécuté
Alors "createSession" est appelé exactement 1 fois
Et Run-A et Run-B reçoivent le même sessionId
Et les deux Runs sont spawnés tous les deux (aucun ne reste bloqué)
```

## Données

| Élément | Valeur |
|---|---:|
| Scénario séquentiel | `Start → Run-1(agent-a)`, exécuté 2 fois (2 runners) |
| Scénario parallèle | `Start → Run-A(agent-a)`, `Start → Run-B(agent-a)` |
| Inspection disque | dataRoot temporaire, recherche des identifiants de session |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| `createSession` sur 2 exécutions | `2` | 1 par exécution, aucune réutilisation inter-exécutions |
| Session 1re / 2e exécution | `chat-1` / `chat-2` | Sessions spécifiques au scénario |
| Fichiers contenant un sessionId | `0` | Table en mémoire uniquement |
| `createSession` en fan-out même agent | `1` | Création partagée (même promesse) |
| Runs spawnés en fan-out | `2` | Pas de sérialisation (R-33) |

## Ce que ce cas ne vérifie pas

- Le renouvellement après ClearContext → `CASE-ADPT-03-2` ;
- La syntaxe `create-chat` → `CASE-ADPT-02-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_03_3_sessions_scoped_to_execution_and_not_persisted`
**Fichier :** `tests/units/adpt/CASE-ADPT-03-3.test.ts`

## Revue du test automatisé

- [ ] Le test exécute deux runners successifs sur le même scénario et vérifie des `sessionId` différents.
- [ ] Le test vérifie qu'aucun fichier sous le dataRoot temporaire ne contient d'identifiant de session.
- [ ] Le test vérifie un seul `createSession` et le même `sessionId` pour deux Runs parallèles du même agent.
- [ ] Le test échoue si la table de sessions est partagée entre exécutions ou écrite sur disque.
- [ ] Le nom du test contient `CASE_ADPT_03_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** v2 (2026-11-03) — R-31 retirée, sessions spécifiques au scénario.
