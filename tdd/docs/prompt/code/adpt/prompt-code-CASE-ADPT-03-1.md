# Prompt — écrire le code de CASE-ADPT-03-1

> **Titre :** CASE-ADPT-03-1 — Stop manuel : SIGTERM → SIGKILL, sans `clearContext`  
> **Exigence / Critère d'acceptation :** AC-ADPT-03-1 dans `tdd/specs/ADPT.md`  
> **Cas de test associé :** [`CASE-ADPT-03-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-03-1.md)  
> **Fichier de test unitaire cible :** [`CASE-ADPT-03-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-03-1.test.ts)  
> **Méthode de test exacte :** `test_CASE_ADPT_03_1_manual_stop_kills_process_without_clearing_session`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/adpt/CASE-ADPT-03-1.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/adpt/CASE-ADPT-03-1.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/adpt/CASE-ADPT-03-1.test.ts::test_CASE_ADPT_03_1_manual_stop_kills_process_without_clearing_session
- Le cas de test : tdd/tests/adpt/CASE-ADPT-03-1.md
- La spécification : tdd/specs/ADPT.md, section SPEC-ADPT-03 (AC-ADPT-03-1)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-004, LIB-006), tdd/docs/signature/signature-types.md (TYPES-001)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-003-adapter-cursor-cli.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/process/spawner.ts
  - src/lib/adapters/cursor-cli.adapter.ts
  - src/types/contracts/cli-adapter.contract.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ADPT_03_1_manual_stop_kills_process_without_clearing_session, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ADPT-03 / R-23 / R-24 / R-34 / LIB-004 :
   - Exporter `STOP_GRACE_MS === 3000` (constante nommée, pas magic number inline).
   - `spawnAgent({ command, args, cwd, onChunk, onExit, env? })` retourne un handle avec `stop()`.
   - `stop()` envoie **SIGTERM** immédiatement ; après `STOP_GRACE_MS` si le processus vit encore → **SIGKILL**.
   - Stop ≠ Clear (R-24) : `stop()` **ne doit jamais** invoquer `adapter.clearContext` (session native préservée).
4. Cycle de vie dans LIB-004 (`spawner.ts`). L'adapter peut exister (clearContext présent) mais n'est pas appelé par stop.
5. Respecte SPEC-ARCH-05 (arité via objet d'options). Timers fake = outil TU (ADR-006), pas à coder en production.
6. N'implémente que ce que ce test exige. Ne traite pas l'exécution réelle de `clearContext` (03-2) ni l'absence de persistance session (03-3). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `spawnAgent` / `stop` + `STOP_GRACE_MS` (LIB-004).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
