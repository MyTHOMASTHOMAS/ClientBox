# Prompt — écrire le code de CASE-DATA-04-3

> **Titre :** CASE-DATA-04-3 — Absence totale de logs / historiques sous `.agents/data/`  
> **Exigence / Critère d'acceptation :** AC-DATA-04-3 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-04-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-04-3.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-04-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-04-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_04_3_no_logs_or_history_under_data_dir`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-04-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-04-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-04-3.test.ts::test_CASE_DATA_04_3_no_logs_or_history_under_data_dir
- Le cas de test : tdd/tests/data/CASE-DATA-04-3.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-04 (AC-DATA-04-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-services.md (SVC-002), tdd/docs/signature/signature-lib.md (LIB-001, LIB-002, LIB-011), tdd/docs/signature/signature-types.md (TYPES-002, TYPES-003, TYPES-006)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/services/resource-store.service.ts
  - src/lib/fs/atomic-writer.ts
  - src/lib/fs/fresh-reader.ts
  - src/lib/fs/file-remover.ts
  - src/types/models/scenario.model.ts
  - src/types/models/agent.model.ts
  - src/types/models/profile.model.ts
  - src/utils/id.utils.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_04_3_no_logs_or_history_under_data_dir, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-04 / R-37 / REQ-111 :
   - Sous `dataRoot` (`.agents/data/`), seuls les dossiers déclaratifs : `agents`, `profils`, `prompts`, `exit`, `if`, `scenarios`.
   - Interdits : dossiers `logs`, `history`, `sessions`, `stream`, `cache` ; fichiers `*.log`, `*.trace`, `*-history.json`.
   - `ResourceStoreService.getScenario` (succès ou rejet `missing-scenario`) ne doit créer aucun artefact interdit sous `dataRoot`.
   - Aucune écriture de journal d'exécution, trace, chunk stream ou historique de session depuis le store.
4. Le store reste une façade CRUD déclarative (SVC-002) via `lib/fs/*` — pas de module logger sous `data/`. Constructeur `{ dataRoot }`.
5. Respecte TYPES / `domain.puml`. Les ids d'exemple (`s1`, `agent-1`) = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas atomicité CRUD (04-1) ni anti-cache (04-2), ni streaming UI. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : invariant R-37 dans `ResourceStoreService` (aucun writer de logs sous data/).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
