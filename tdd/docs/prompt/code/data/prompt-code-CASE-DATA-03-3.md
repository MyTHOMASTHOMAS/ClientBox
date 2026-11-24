# Prompt — écrire le code de CASE-DATA-03-3

> **Titre :** CASE-DATA-03-3 — Préservation des clés textuelles personnalisées après suppression  
> **Exigence / Critère d'acceptation :** AC-DATA-03-3 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-03-3.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-03-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_03_3_custom_keys_preserved_after_deletion`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-03-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-03-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-03-3.test.ts::test_CASE_DATA_03_3_custom_keys_preserved_after_deletion
- Le cas de test : tdd/tests/data/CASE-DATA-03-3.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-03 (AC-DATA-03-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-domain.md (DOM-006), tdd/docs/signature/signature-types.md (TYPES-008)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-004-moteur-blocs.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/keys/key-renumberer.ts
  - src/utils/array.utils.ts
  - src/types/models/connection.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_03_3_custom_keys_preserved_after_deletion, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-03 / R-43 / DOM-006 :
   - Les clés **non numériques** (ex. `promptData`, `mainPrompt`) sont **strictement préservées** et exclues du renumérotage.
   - Après retrait d'une clé numérique `"0"` dans un mixte `promptData`/`0`/`1`, `promptData` reste intact et `"1"` devient `"0"`.
   - Après retrait d'une clé custom, les autres customs restent inchangées (pas de renumérotation textuelle).
4. Même fonction `renumberDefaultKeys` que CASE-DATA-03-2 (étendre la règle, ne pas dupliquer ailleurs).
5. Respecte TYPES-008 / `domain.puml`. Les libellés custom = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas collisions (03-4) ni topologie Start (03-5). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `renumberDefaultKeys` (exclusion clés non numériques).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
