# Sommaire des cas de test — Domaine DATA (Ressources & Persistance sous `.agents/data/`)

**Domaine :** `DATA`  
**Document maître des spécifications :** [`tdd/specs/DATA.md`](../../specs/DATA.md)  
**ADR d'ancrage :** [`ADR-005`](../../docs/adr/ADR-005-persistance-data.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.3.md` (CR-012 prompt `exit`)  

---

## 1. Spécifications couvertes

- [`SPEC-DATA-01`](../../specs/DATA.md#spec-data-01--schémas-json-et-validation-des-ressources-déclaratives) — Schémas JSON et validation des ressources déclaratives (`REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `R-01`, `R-02`, `R-05`, `R-06`, `C-03`, `C-08`, `REQ-101`, `REQ-104`, `Annexe A`, `D.3`)
- [`SPEC-DATA-02`](../../specs/DATA.md#spec-data-02--modèle-et-chargement-dynamique-des-scripts-conditionnels-js-if) — Modèle et chargement dynamique des scripts conditionnels JS (`if`) (`REQ-011`, `REQ-012`, `R-01`, `R-02`, `R-14`, `C-09`)
- [`SPEC-DATA-03`](../../specs/DATA.md#spec-data-03--format-intégrité-et-persistance-des-graphes-de-scénario) — Format, intégrité et persistance des graphes de scénario (`REQ-011`, `REQ-014`, `REQ-034`, `REQ-035`, `REQ-036`, `REQ-111`, `R-16`, `R-17`, `R-37`, `R-43`, `R-44`, `C-14`)
- [`SPEC-DATA-04`](../../specs/DATA.md#spec-data-04--synchronisation-bidirectionnelle-ui--fichiers-et-exclusion-des-logs) — Synchronisation bidirectionnelle UI ↔ Fichiers et exclusion des logs (`REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `REQ-034`, `REQ-104`, `REQ-111`, `R-36`, `R-37`, `C-03`)
- [`SPEC-DATA-05`](../../specs/DATA.md#spec-data-05--documentation-utilisateur-exportée-sous-agentsdocs) — Documentation utilisateur exportée sous `.agents/docs/` (`ADR-017`, `ADR-012`)

---

## 2. Tableau d'indexation des Cas de Test

| numéro | testfile | description rapide | clause / exigence spec liée |
|---|---|---|---|
| 01-1 | `CASE-DATA-01-1.md` | Validation du schéma JSON d'un Agent : `profilId`, `cliId` obligatoires et `model` optionnel | `SPEC-DATA-01`, `AC-DATA-01-1`, `AC-DATA-01-6`, `REQ-009`, `R-05`, `R-03` |
| 01-2 | `CASE-DATA-01-2.md` | Validation du schéma JSON d'un Profil et des 3 politiques d'envoi (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`) | `SPEC-DATA-01`, `AC-DATA-01-2`, `REQ-010`, `R-06` |
| 01-3 | `CASE-DATA-01-3.md` | Validation des schémas JSON `prompts/` et `exit/` (`{ id, name, content }`) | `SPEC-DATA-01`, `AC-DATA-01-3`, `REQ-011`, `R-01`, `R-02`, `R-07`, CR-012 |
| 01-4 | `CASE-DATA-01-4.md` | Rejet explicite de tout fichier JSON corrompu ou invalide avec diagnostic sans plantage applicatif | `SPEC-DATA-01`, `AC-DATA-01-4`, `C-08`, `REQ-101`, `REQ-104` |
| 01-5 | `CASE-DATA-01-5.md` | Refus de suppression d'un profil référencé par des agents (intégrité 409) | `SPEC-DATA-01`, `AC-DATA-01-5`, `R-05`, `REQ-010`, `ADR-005` |
| 01-6 | `CASE-DATA-01-6.md` | **ABROGÉ (CR-012)** — ancien `DOM-009` / matchers exit | — |
| 01-7 | `CASE-DATA-01-7.md` | Intégrité et typage strict des modèles de données étendus d'Option B (`TYPES-002..008`) | `SPEC-DATA-01`, `SPEC-DATA-03`, `AC-DATA-01-1`, `AC-DATA-03-1` |
| 02-1 | `CASE-DATA-02-1.md` | Détection, chargement et listage des scripts conditionnels JS sous `.agents/data/if/` | `SPEC-DATA-02`, `AC-DATA-02-1`, `REQ-011`, `R-01`, `R-02` |
| 02-2 | `CASE-DATA-02-2.md` | Exécution dynamique de la fonction `if(sac)` recevant le sac d'entrées et retournant un booléen | `SPEC-DATA-02`, `AC-DATA-02-2`, `REQ-012`, `R-14`, `C-09` |
| 02-3 | `CASE-DATA-02-3.md` | Interception propre des erreurs de syntaxe et exceptions d'exécution dans un script If sans crash du serveur | `SPEC-DATA-02`, `AC-DATA-02-3`, `R-25` |
| 02-4 | `CASE-DATA-02-4.md` | Lecture fraîche et résolution sécurisée des scripts If par ResourceStoreService (`SVC-002`) | `SPEC-DATA-02`, `SPEC-DATA-04`, `AC-DATA-02-1`, `AC-DATA-04-2` |
| 03-1 | `CASE-DATA-03-1.md` | Persistance et rechargement fidèle du document JSON de scénario (nœuds, positions, paramètres, liaisons) | `SPEC-DATA-03`, `AC-DATA-03-1`, `REQ-011`, `REQ-014`, `REQ-034`, `R-16` |
| 03-2 | `CASE-DATA-03-2.md` | Renumérotation automatique et séquentielle des clés d'entrées numériques par défaut après suppression de liaison | `SPEC-DATA-03`, `AC-DATA-03-2`, `REQ-035`, `R-43` |
| 03-3 | `CASE-DATA-03-3.md` | Préservation stricte et intégrale des clés d'entrées personnalisées lors de modifications topologiques | `SPEC-DATA-03`, `AC-DATA-03-3`, `REQ-035`, `R-43` |
| 03-4 | `CASE-DATA-03-4.md` | Détection et rejet strict de toute collision de clé d'entrée sur un même bloc cible | `SPEC-DATA-03`, `AC-DATA-03-4`, `R-13`, `REQ-033` |
| 03-5 | `CASE-DATA-03-5.md` | Validation topologique backend : Start unique, degré entrant 0, références valides | `SPEC-DATA-03`, `AC-DATA-03-5`, `R-19`, `R-20`, `REQ-015` |
| 03-6 | `CASE-DATA-03-6.md` | Liste no-save `SCENARIO_NODE_NO_SAVE_KEYS` : strip écriture/lecture des champs runtime (ex. `status`) | `SPEC-DATA-03`, `AC-DATA-03-6`, `R-37`, `REQ-111`, `DOM-018` |
| 03-7 | `CASE-DATA-03-7.md` | Nœud `callScenario` : persistance et validation de `targetScenarioId` (self-ref accepté / id vide / cible absente) | `SPEC-DATA-03`, `AC-DATA-03-7`, `REQ-039`, `REQ-041`, `R-46`, `ADR-018` |
| 03-8 | `CASE-DATA-03-8.md` | Nœud `command` : persistance et validation de `commandLine` (non vide, rejet whitespace) | `SPEC-DATA-03`, `AC-DATA-03-8`, `REQ-042`, `REQ-043`, `R-47`, `ADR-019` |
| 04-1 | `CASE-DATA-04-1.md` | Répercussion synchrone et atomique des modifications UI sur les fichiers disques correspondants | `SPEC-DATA-04`, `AC-DATA-04-1`, `REQ-009..012`, `REQ-034`, `R-36` |
| 04-2 | `CASE-DATA-04-2.md` | Relecture du système de fichiers comme unique source de vérité sans masquage des modifications manuelles | `SPEC-DATA-04`, `AC-DATA-04-2`, `REQ-104`, `R-36`, `C-03` |
| 04-3 | `CASE-DATA-04-3.md` | Garantie d'absence totale de journaux d'exécution, traces ou historiques de session sous `.agents/data/` | `SPEC-DATA-04`, `AC-DATA-04-3`, `REQ-111`, `R-37` |
| 04-4 | `CASE-DATA-04-4.md` | Gestion et rejet robuste d'un fichier JSON corrompu ou tronqué sous `.agents/data/` sans crash | `SPEC-DATA-04`, `SPEC-DATA-02`, `AC-DATA-04-1`, `AC-DATA-02-1`, `ADR-003` |
| 05-1 | `CASE-DATA-05-1.md` | Présence du miroir Markdown sous `.agents/docs/` après export réussi | `SPEC-DATA-05`, `AC-DATA-05-1`, `ADR-017` |
| 05-2 | `CASE-DATA-05-2.md` | Aucune écriture de documentation sous `.agents/data/` lors de l'export | `SPEC-DATA-05`, `AC-DATA-05-2`, `ADR-017`, `ADR-005` |
| 05-3 | `CASE-DATA-05-3.md` | Ré-export : mise à jour du miroir depuis la source embarquée | `SPEC-DATA-05`, `AC-DATA-05-3`, `ADR-017` |
