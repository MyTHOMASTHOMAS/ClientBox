# Sommaire des cas de test — Domaine ENG (Moteur de Blocs, Join & Ordonnancement)

**Domaine :** `ENG`  
**Document maître des spécifications :** [`tdd/specs/ENG.md`](../../specs/ENG.md)  
**ADR d'ancrage :** [`ADR-004`](../../docs/adr/ADR-004-moteur-blocs.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.3.md` (CR-012 prompt `exit`)  

---

## 1. Spécifications couvertes

- [`SPEC-ENG-01`](../../specs/ENG.md#spec-eng-01--messages-inter-blocs-et-sac-dentrées) — Messages inter-blocs et sac d'entrées (`REQ-033`, `REQ-034`, `R-10`, `R-11`, `R-44`, `C-10`, `C-14`, `REQ-105`, `Annexe B.2`, `D.2`)
- [`SPEC-ENG-02`](../../specs/ENG.md#spec-eng-02--algorithme-de-join-calcul-de-power-pause-et-règle-n0) — Algorithme de Join, calcul de Power, Pause et règle N=0 (`REQ-017`, `REQ-037`, `R-42`, `R-42b`, `R-42c`, `R-42d`, `C-15`, `Annexe B.3`)
- [`SPEC-ENG-03`](../../specs/ENG.md#spec-eng-03--comportement-des-4-types-de-blocs-spécialisés) — Comportement des blocs spécialisés dont CallScenario (`REQ-015`, `REQ-016`, `REQ-018`–`020`, `REQ-038`–`041`, `R-08`, `R-09`, `R-10b`, `R-12`–`15`, `R-19`–`22`, `R-39`, `R-46`, `C-10`, `Annexe B.4`)
- [`SPEC-ENG-04`](../../specs/ENG.md#spec-eng-04--assemblage-du-prompt-politiques-de-profil-et-arrêt-global-sur-erreur) — Assemblage du prompt, politiques de profil et arrêt global sur erreur / halt CallScenario (`REQ-023`, `REQ-025`, `REQ-026`, `REQ-032`, `R-06`, `R-25`, `R-34`, `R-45`, `D.3`, ADR-018)

---

## 2. Tableau d'indexation des Cas de Test

| numéro | testfile | description rapide | clause / exigence spec liée |
|---|---|---|---|
| 01-1 | `CASE-ENG-01-1.md` | Structure du message inter-blocs `BlockMessage` (`blockType`, `value`, `power`) et absence stricte de champ `key` sur les sorties | `SPEC-ENG-01`, `AC-ENG-01-1`, `REQ-033`, `R-10`, `R-44`, `D.2` |
| 01-2 | `CASE-ENG-01-2.md` | Constitution et indexation du sac d'entrées `BlockInputBag` par les clés d'entrées sur un bloc cible multi-ports | `SPEC-ENG-01`, `AC-ENG-01-2`, `REQ-034`, `R-11`, `C-10` |
| 02-1 | `CASE-ENG-02-1.md` | Déclenchement de l'exécution d'un bloc à $N \ge 1$ entrées si et seulement si les $N$ messages sont reçus et $\sum power === N$ | `SPEC-ENG-02`, `AC-ENG-02-1`, `REQ-017`, `REQ-037`, `R-42`, `C-15` |
| 02-2 | `CASE-ENG-02-2.md` | Bascule automatique en état de pause pour tout bloc ayant reçu ses $N$ messages mais avec une somme de puissances $\sum power < N$ | `SPEC-ENG-02`, `AC-ENG-02-2`, `REQ-037`, `R-42b` |
| 02-3 | `CASE-ENG-02-3.md` | Inactivité absolue et absence totale d'émission de message ou de power pour tout bloc à $N = 0$ entrée câblée (hors Start) | `SPEC-ENG-02`, `AC-ENG-02-3`, `R-42d` |
| 02-4 | `CASE-ENG-02-4.md` | Suspension du scheduler `SVC-001` sur Join waiting/pause (via `ScenarioRunnerService`, anti-faux-vert) | `SPEC-ENG-02`, `SPEC-ENG-04`, `AC-ENG-02-2`, `AC-ENG-04-3`, `SVC-001` |
| 03-1 | `CASE-ENG-03-1.md` | Émission initiale synchrone du message `{ blockType: 'start', value: null, power: 1 }` sur toutes les sorties du bloc Start au lancement | `SPEC-ENG-03`, `AC-ENG-03-1`, `REQ-015`, `R-19`, `R-20` |
| 03-2 | `CASE-ENG-03-2.md` | Exécution de la commande CLI par le bloc Run, émission de la sortie textuelle avec `power: 1` ou terminaison en endpoint (0 sortie) | `SPEC-ENG-03`, `AC-ENG-03-2`, `REQ-016`, `R-12`, `R-21` |
| 03-3 | `CASE-ENG-03-3.md` | Évaluation de la condition `if(sac)` par le bloc If et distribution différentielle de puissance (`power: 1` branche active, `power: 0` branche inactive) | `SPEC-ENG-03`, `AC-ENG-03-3`, `REQ-018`, `REQ-019`, `R-10b`, `R-14`, `R-15`, `R-22` |
| 03-4 | `CASE-ENG-03-4.md` | ClearContext : nouvelle session au Run suivant de l'agent + propagation `power: 1` (insuffisant : reset policy seul) | `SPEC-ENG-03`, `AC-ENG-03-4`, `REQ-020`, `REQ-038`, `R-39`, `SVC-001` |
| 03-5 | `CASE-ENG-03-5.md` | Règles de consommation du sac d'entrées : non-lecture Run/ClearContext vs lecture If | `SPEC-ENG-01`, `SPEC-ENG-03`, `AC-ENG-01-2`, `AC-ENG-03-3` |
| 03-6 | `CASE-ENG-03-6.md` | Résilience et statut d'erreur en français sur échec de script If sans crash process | `SPEC-ENG-03`, `SPEC-DATA-02`, `AC-ENG-03-3`, `AC-DATA-02-3` |
| 03-7 | `CASE-ENG-03-7.md` | CallScenario : await, émission `power: 1` / `value: null`, échec enfant, self-call autorisé, borne `CALL_SCENARIO_MAX_DEPTH` | `SPEC-ENG-03`, `SPEC-ENG-01`, `AC-ENG-03-5`, `REQ-039`, `REQ-040`, `REQ-041`, `R-46`, `ADR-018` |
| 03-8 | `CASE-ENG-03-8.md` | CallScenario : relay des chunks CLI enfant vers `chunkReceived` du runner racine (terminal parent) | `SPEC-ENG-03`, `SPEC-UI-03`, `AC-ENG-03-6`, `AC-UI-03-5`, `REQ-024`, `REQ-040`, `ADR-018` |
| 03-9 | `CASE-ENG-03-9.md` | Command : exécution shell OS (cwd = workspace), await exit 0, émission `power: 1` / `value: null`, fail sur exit ≠ 0 | `SPEC-ENG-03`, `SPEC-ENG-01`, `AC-ENG-03-7`, `REQ-042`, `REQ-043`, `R-47`, `ADR-019` |
| 04-1 | `CASE-ENG-04-1.md` | Assemblage préalable du prompt complet (`systemPrompt` + `userPrompt` + `exit` optionnel) avant appel adapter | `SPEC-ENG-04`, `AC-ENG-04-1`, `REQ-032`, `R-07`, `R-45`, CR-012 |
| 04-2 | `CASE-ENG-04-2.md` | Application fidèle des 3 politiques d'injection du profil (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear` avec reset ClearContext) | `SPEC-ENG-04`, `AC-ENG-04-2`, `REQ-023`, `R-06`, `D.3` |
| 04-3 | `CASE-ENG-04-3.md` | Détection d'échec d'un bloc quelconque et déclenchement de l'arrêt global immédiat de l'ensemble du scénario | `SPEC-ENG-04`, `AC-ENG-04-3`, `REQ-026`, `R-25` |
| 04-4 | `CASE-ENG-04-4.md` | Orchestration graphe `SVC-001` : `run()` nominal Start→Run, `stop()` 3000 ms (anti-faux-vert) | `SPEC-ENG-01..04`, `AC-ENG-04-3`, `AC-ADPT-03-1`, `SVC-001` |
| 04-5 | `CASE-ENG-04-5.md` | Gestion runtime de PolicyInjectionState et réinitialisation par ClearContext | `SPEC-ENG-04`, `SPEC-DATA-01`, `AC-ENG-04-2`, `AC-DATA-01-2` |
| 04-6 | `CASE-ENG-04-6.md` | Délai de grâce STOP_GRACE_MS et escalade temporelle d'arrêt du runner (`SVC-001`, `LIB-004`) | `SPEC-ENG-04`, `SPEC-ADPT-03`, `SPEC-ARCH-03`, `AC-ENG-04-3`, `AC-ADPT-03-1`, `AC-ARCH-03-4` |
| 04-7 | `CASE-ENG-04-7.md` | Ordre d'exécution = connexions du graphe, indépendant de l'ordre du tableau `nodes[]` | `SPEC-ENG-01`, `SPEC-ENG-03`, `SPEC-ENG-04`, `AC-ENG-03-1`, `AC-ENG-04-3`, `SVC-001` |
| 04-8 | `CASE-ENG-04-8.md` | Fan-out multi-sorties + bifurcation If : flux oui **ou** flux non (exclusifs) via `SVC-001` | `SPEC-ENG-01`, `SPEC-ENG-03`, `SPEC-ENG-04`, `AC-ENG-03-1`, `AC-ENG-03-3`, `AC-ENG-04-3`, `SVC-001` |
| 04-9 | `CASE-ENG-04-9.md` | Stop pendant `prepareRunContext` : aucun CLI Run orphelin après `stop()` (course handle) | `SPEC-ENG-04`, `SPEC-ADPT-03`, `AC-ENG-04-3`, `AC-ADPT-03-1`, `SVC-001`, `LIB-004` |
| 04-10 | `CASE-ENG-04-10.md` | Stop : reset des blocs `running`/`paused` → `idle` (fin du pulse UI) | `SPEC-ENG-04`, `SPEC-UI-02`, `AC-ENG-04-3`, `AC-UI-02-4`, `SVC-001` |
| 04-11 | `CASE-ENG-04-11.md` | CallScenario nested : halt récursif spawns parent+enfant et Stop manuel | `SPEC-ENG-04`, `SPEC-ENG-03`, `AC-ENG-04-3`, `REQ-025`, `REQ-026`, `R-25`, `R-34`, `ADR-018` |
| 04-12 | `CASE-ENG-04-12.md` | Command : tracking dans `runner-active-processes` et interruption d'urgence (Stop / échec concurrent) | `SPEC-ENG-04`, `SPEC-ENG-03`, `AC-ENG-04-3`, `REQ-025`, `REQ-043`, `R-34`, `ADR-019` |
| 04-13 | `CASE-ENG-04-13.md` | Run + `exitId` : assemblage additif et fin naturelle du CLI (aucun `stop()` sur mot-clé) | `SPEC-ENG-04`, `SPEC-ENG-03`, `AC-ENG-04-1`, `R-07`, `R-22`, `R-45`, CR-012 |
