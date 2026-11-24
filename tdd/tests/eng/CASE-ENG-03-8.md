# CASE-ENG-03-8 — CallScenario : relay des chunks CLI enfant vers le parent

**Spécification :** `SPEC-ENG-03`, `SPEC-UI-03`  
**Critère d'acceptation :** `AC-ENG-03-6`, `AC-UI-03-5`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-018`  
**Service / contrats cibles :** `SVC-001` (runner nested), bus SSE racine  

---

## Ce que ce cas protège

Lors d'un **CallScenario**, les chunks `stdout` / `stderr` émis par les spawns CLI du **sous-runner** doivent être **relayés** sur les listeners `chunkReceived` du runner **racine**, afin que le terminal Studio (SSE du scénario parent) affiche le flux enfant (`REQ-024`, note SPEC-UI-03).

Sans ce relay, le terminal du parent reste silencieux pendant toute la sous-exécution alors que les agents enfants travaillent — diagnostic impossible. Le canvas / pastilles / `statusChanged` de l'enfant restent **non exposés** (`REQ-040`).

---

## Cas

```gherkin
Scénario : Chunks CLI enfant visibles sur le bus racine
  Étant donné un scénario parent "parent" avec Start --> Call-1(targetScenarioId="enfant")
  Et un scénario "enfant" Start --> Run-child (adapter / spawn émettant des chunks)
  Quand ScenarioRunnerService.run() exécute "parent"
  Et le spawn de Run-child émet un chunk stdout "hello-enfant"
  Alors le listener chunkReceived du runner parent reçoit un événement contenant "hello-enfant"
  Et le payload indique le nestedScenarioId "enfant" (ou équivalent traçable)
  Et aucun blockStatusChanged enfant n'est appliqué aux nœuds du graphe parent

Scénario : Chunks parent inchangés hors CallScenario
  Étant donné un Run sur le scénario racine sans CallScenario
  Quand un chunk stdout est émis
  Alors chunkReceived racine le reçoit comme aujourd'hui (régression)
```

---

## Données

| Élément | Valeur |
|---|---|
| Parent | `Start → Call-1(enfant)` |
| Enfant | `Start → Run-child` |
| Événement | `chunkReceived` |
| Contenu chunk | texte non vide (ex. `hello-enfant`) |
| Hors scope | pastilles / `blockStatusChanged` / `statusChanged` de l'enfant |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| chunkReceived parent | ≥ 1 événement avec le texte enfant | relay nested → racine |
| nestedScenarioId | `enfant` | traçabilité terminal |
| Pastilles parent | inchangées (pas de nodeId enfant) | REQ-040 |

---

## Ce que ce cas ne vérifie pas

- Await / power 1 / self-call / profondeur → `CASE-ENG-03-7` ;
- Halt / Stop récursif → `CASE-ENG-04-11` ;
- Rendu Preact du terminal / tampon 5000 → `CASE-UI-03-1` ;
- Non-recovery canvas enfant → `CASE-UI-03-10`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_03_8_call_scenario_child_chunks_relayed_to_parent`  
**Fichier :** `tests/units/eng/CASE-ENG-03-8.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie qu'un chunk émis par le spawn enfant arrive sur `chunkReceived` du parent.
- [ ] Le test vérifie la présence d'un marqueur de scénario nested (id enfant).
- [ ] Le test ne force pas l'application de `blockStatusChanged` enfant sur le graphe parent.
- [ ] Le nom du test contient `CASE_ENG_03_8`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 — terminal parent fusionne les flux CLI nested sans recovery canvas enfant.
