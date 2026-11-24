# Prompt — écrire le code de CASE-ENG-04-3

> **Titre :** CASE-ENG-04-3 — Arrêt global immédiat sur échec de bloc (R-25)  
> **Exigence / Critère d'acceptation :** AC-ENG-04-3 dans `tdd/specs/ENG.md`  
> **Cas de test associé :** [`CASE-ENG-04-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-04-3.md)  
> **Fichier de test unitaire cible :** [`CASE-ENG-04-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-04-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_ENG_04_3_block_failure_triggers_immediate_global_scenario_stop`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/eng/CASE-ENG-04-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/eng/CASE-ENG-04-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/eng/CASE-ENG-04-3.test.ts::test_CASE_ENG_04_3_block_failure_triggers_immediate_global_scenario_stop
- Le cas de test : tdd/tests/eng/CASE-ENG-04-3.md
- La spécification : tdd/specs/ENG.md, section SPEC-ENG-04 (AC-ENG-04-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-004), tdd/docs/signature/signature-types.md (TYPES-012), tdd/docs/signature/signature-services.md (SVC-001 — orchestration R-25 référencée, non importée par ce TU)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/process/spawner.ts
  - src/types/messages/block-status.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ENG_04_3_block_failure_triggers_immediate_global_scenario_stop, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ENG-04 / R-25 / LIB-004 / TYPES-012 :
   - Exporter `RunnerStatus` (TYPES-012) incluant au minimum `'running' | 'error'` (et les autres littéraux documentés).
   - `spawnAgent(options)` retourne un handle avec `stop()` (LIB-004).
   - Exporter `STOP_GRACE_MS` (constante nommée = 3000 ms).
   - `stop()` : SIGTERM immédiat ; après `STOP_GRACE_MS` si le processus vit encore → SIGKILL.
   - Effet observé par le TU (helper local d'abort) : statut global `'error'`, diagnostic contenant l'id du bloc + message, handles stoppés, branches pause vidées, aucun bloc ultérieur déclenché, exception If interceptée → arrêt sans crash process.
4. Le TU porte le helper d'orchestration d'abort en local ; tu ne modifies pas `tests/`. La surface `src/` requise est spawner + `RunnerStatus`. Ne crée pas SVC-001 sauf si strictement nécessaire pour compiler — ce TU ne l'importe pas.
5. Timers fake = outil TU (ADR-006), pas à coder en production.
6. N'implémente que ce que ce test exige. Ne traite pas les politiques profil (04-2) ni le Lot UI. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `spawnAgent`/`stop` + `STOP_GRACE_MS` (LIB-004) + `RunnerStatus` (TYPES-012) au service de R-25.
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
