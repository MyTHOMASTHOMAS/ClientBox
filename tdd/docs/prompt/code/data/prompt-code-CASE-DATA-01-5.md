# Prompt — écrire le code de CASE-DATA-01-5

> **Titre :** CASE-DATA-01-5 — Refus de suppression d'un profil lié à un ou plusieurs agents  
> **Exigence / Critère d'acceptation :** AC-DATA-01-5 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-01-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-01-5.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-01-5.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-01-5.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_01_5_refuse_delete_profile_with_linked_agents`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-01-5.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-01-5.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-01-5.test.ts::test_CASE_DATA_01_5_refuse_delete_profile_with_linked_agents
- Le cas de test : tdd/tests/data/CASE-DATA-01-5.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-01 (AC-DATA-01-5)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-services.md (SVC-002, SVC-004), tdd/docs/signature/signature-lib.md (LIB-002, LIB-011)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/services/agent.service.ts
  - src/services/resource-store.service.ts
  - src/lib/fs/fresh-reader.ts
  - src/lib/fs/file-remover.ts
  - src/domain/schemas/agent.schema.ts
  - src/domain/schemas/profile.schema.ts
  - src/domain/schemas/validation-error.ts
  - src/types/models/agent.model.ts
  - src/types/models/profile.model.ts
  - src/utils/id.utils.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_01_5_refuse_delete_profile_with_linked_agents, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-01 / R-05 / REQ-010 / ADR-005 :
   - `AgentService.deleteProfile(profileId)` refuse si un agent référence ce profil : Error avec message FR matching `/profil|agent|référenc/i` et propriété `httpStatus === 409` ; le fichier profil reste sur disque.
   - Suppression autorisée si aucun agent lié ; le fichier profil disparaît.
4. Intégrité référentielle dans `AgentService` (SVC-004) ; persistance / delete délégués à `ResourceStoreService` + `file-remover` (pas d'`fs.*` direct dans services — SPEC-ARCH-03). Constructeur compatible `{ store }` comme dans le TU.
5. Respecte `domain.puml` / TYPES-002/003. Les IDs d'exemple (`profil-shared`, …) sont des jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas listIfScripts, if-loader, scénarios. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG — services → lib/domain/types/utils ; pas l'inverse)
   - SPEC-ARCH-03 (I/O confinée à `lib/`)
   - SPEC-ARCH-05 / SPEC-ARCH-07
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `AgentService.deleteProfile`.
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
