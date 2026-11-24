# Prompt — écrire le code de CASE-ENG-03-4

> **Titre :** CASE-ENG-03-4 — Bloc ClearContext : reset agent + propagation power 1  
> **Exigence / Critère d'acceptation :** AC-ENG-03-4 dans `tdd/specs/ENG.md`  
> **Cas de test associé :** [`CASE-ENG-03-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-4.md)  
> **Fichier de test unitaire cible :** [`CASE-ENG-03-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-4.test.ts)  
> **Méthode de test exacte :** `test_CASE_ENG_03_4_clear_context_block_reset_and_power_propagation`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/eng/CASE-ENG-03-4.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/eng/CASE-ENG-03-4.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/eng/CASE-ENG-03-4.test.ts::test_CASE_ENG_03_4_clear_context_block_reset_and_power_propagation
- Le cas de test : tdd/tests/eng/CASE-ENG-03-4.md
- La spécification : tdd/specs/ENG.md, section SPEC-ENG-03 (AC-ENG-03-4)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-006), tdd/docs/signature/signature-types.md (TYPES-001, TYPES-009, TYPES-010)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-003-adapter-cursor-cli.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/types/contracts/cli-adapter.contract.ts
  - src/types/messages/block-message.model.ts
  - src/types/messages/input-bag.model.ts
  - src/domain/messages/build-block-message.ts
  - src/domain/messages/input-bag.ops.ts
  - src/lib/adapters/cursor-cli.adapter.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ENG_03_4_clear_context_block_reset_and_power_propagation, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ENG-03 / LIB-006 :
   - `CLIAdapter.clearContext(ctx)` invoqué — reset session native CLI (`agent-dev` tracé).
   - Message émis : `buildBlockMessage('clearContext', null, 1)` — indexable dans sac aval.
   - Fan-out vers sorties : power 1 ; 0 sortie → endpoint sans erreur après clear.
   - `CursorCLIAdapter.clearContext` présent (fonction).
4. Clear ≠ Stop (R-24). Adapter + messages (POINT-008). Pas de SVC-001 requis pour ce TU isolé.
5. Respecte TYPES-001/009/010. Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas If (03-3) ni policies (04-2). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `clearContext` (LIB-006) + `buildBlockMessage('clearContext', null, 1)`.
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
