# Prompt — écrire le code de CASE-UI-02-2

> **Titre :** CASE-UI-02-2 — Unicité stricte du bloc Start sur le canvas  
> **Exigence / Critère d'acceptation :** AC-UI-02-2 dans `tdd/specs/UI.md`  
> **Cas de test associé :** [`CASE-UI-02-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-2.md)  
> **Fichier de test unitaire cible :** [`CASE-UI-02-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_UI_02_2_start_block_strict_uniqueness_enforcement`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/ui/CASE-UI-02-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/ui/CASE-UI-02-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/ui/CASE-UI-02-2.test.ts::test_CASE_UI_02_2_start_block_strict_uniqueness_enforcement
- Le cas de test : tdd/tests/ui/CASE-UI-02-2.md
- La spécification : tdd/specs/UI.md, section SPEC-UI-02 (AC-UI-02-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-ui.md (UI-008), tdd/docs/signature/signature-domain.md (DOM-008), tdd/docs/signature/signature-types.md (TYPES-007)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/ui/canvas/canvas-view.ts
  - src/domain/graph/graph-validator.ts
  - src/types/models/node.model.ts
  - src/types/models/connection.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_UI_02_2_start_block_strict_uniqueness_enforcement, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-UI-02 / REQ-015 / AC-UI-02-2 :
   - Premier `addBlock(..., 'start', ...)` → `ok: true`.
   - Second Start sur le même document → `ok: false`, document inchangé (toujours 1 Start), `error` message FR contenant « un seul|unique|Start ».
   - Message FR : pas de Submit/Cancel/Error/Delete/Save anglais.
   - Cohérence DOM-008 : `validateGraph` avec 1 Start → `[]` ; avec 2 Start → erreurs mentionnant Start/unique/un seul.
   - `removeBlock` puis nouvel `addBlock('start')` → autorisé (`ok: true`), nouvel id ≠ `start-1`.
4. Validation client-side dans UI-008 avant envoi serveur ; `validateGraph` (DOM-008) reste la source de vérité graphe.
5. Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas câblage complet (02-1 hors ce qui est déjà requis), branches If, statuts, launch. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `addBlock` refus 2e Start (UI-008) + `validateGraph` (DOM-008).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
