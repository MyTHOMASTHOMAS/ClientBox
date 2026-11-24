# Prompt — écrire le code de CASE-ENG-03-3

> **Titre :** CASE-ENG-03-3 — Bloc If : évaluation script + distribution différentielle power (R-15)  
> **Exigence / Critère d'acceptation :** AC-ENG-03-3 dans `tdd/specs/ENG.md`  
> **Cas de test associé :** [`CASE-ENG-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-3.md)  
> **Fichier de test unitaire cible :** [`CASE-ENG-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_ENG_03_3_if_block_evaluation_and_differential_power_dispatch`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/eng/CASE-ENG-03-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/eng/CASE-ENG-03-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/eng/CASE-ENG-03-3.test.ts::test_CASE_ENG_03_3_if_block_evaluation_and_differential_power_dispatch
- Le cas de test : tdd/tests/eng/CASE-ENG-03-3.md
- La spécification : tdd/specs/ENG.md, section SPEC-ENG-03 (AC-ENG-03-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-003), tdd/docs/signature/signature-types.md (TYPES-009, TYPES-010), tdd/docs/signature/signature-services.md (R-15 via SVC-001 — distribution orchestrée)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/messages/build-block-message.ts
  - src/domain/messages/if-power-dispatch.ts
  - src/lib/fs/if-loader.ts
  - src/types/messages/block-message.model.ts
  - src/types/messages/input-bag.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ENG_03_3_if_block_evaluation_and_differential_power_dispatch, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ENG-03 / R-15 / SPEC-DATA-02 :
   - `runIfScript(fn, sac)` exécute `(sac: BlockInputBag) => boolean` et retourne le booléen (LIB-003 — seam TU vs `loadIfScript` documenté ; POINT-007).
   - `distributeIfPower(condition, truePortIds, falsePortIds)` retourne `{ portId, message }[]` avec `message.blockType === 'if'`.
   - Si `condition === true` : ports « true » → `power: 1`, ports « false » → `power: 0`.
   - Si `condition === false` : inverse (false → 1, true → 0).
   - Cas limites : 0 port false + false → un seul message power 0 ; 0 ports des deux côtés → `[]`.
4. Distribution pure dans `if-power-dispatch.ts` (POINT-009 — absent inventaire DOM-*). Pas d'I/O dans domain/messages sauf délégation loader.
5. Respecte TYPES-009/010. Jeux d'essai OK/KO = illustration.
6. N'implémente que ce que ce test exige. Ne traite pas ClearContext (03-4) ni assemblage prompt (04-*). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `distributeIfPower` + `runIfScript`.
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
