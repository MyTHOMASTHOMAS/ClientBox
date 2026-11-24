# Prompt — écrire le code de CASE-DATA-01-3

> **Titre :** CASE-DATA-01-3 — Validation des schémas Prompt et Exit Condition  
> **Exigence / Critère d'acceptation :** AC-DATA-01-3 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-01-3.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-01-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_01_3_prompt_and_exit_schema_validation`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-01-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-01-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-01-3.test.ts::test_CASE_DATA_01_3_prompt_and_exit_schema_validation
- Le cas de test : tdd/tests/data/CASE-DATA-01-3.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-01 (AC-DATA-01-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-types.md (TYPES-004, TYPES-005), tdd/docs/signature/signature-domain.md (DOM-009 — évaluation runtime matchers hors écriture de cette tâche)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/schemas/prompt.schema.ts
  - src/domain/schemas/exit.schema.ts
  - src/domain/schemas/validation-error.ts
  - src/types/models/prompt.model.ts
  - src/types/models/exit-condition.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_01_3_prompt_and_exit_schema_validation, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente les règles prescrites par SPEC-DATA-01 :
   - `parsePrompt` : Prompt valide (`id`, `name`, `content`) accepté ; absence de `content` → `ResourceValidationError` matching `/content/i`.
   - `parseExitCondition` : Exit valide avec `matchers` non vide (ex. `{ type: 'substring', value: 'DONE' }`) accepté ; `matchers: []` → `ResourceValidationError` matching `/matchers/i`.
4. La validation structurelle vit dans `src/domain/schemas/{prompt,exit}.schema.ts`. Ne confonds pas avec `DOM-009 evaluateExitMatchers` (évaluation runtime du flux — hors périmètre de ce prompt).
5. Respecte TYPES-004 / TYPES-005 / `domain.puml`. Les valeurs d'exemple (`p-init`, `DONE`) sont des jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas Agent/Profil, JSON corrompu, ni evaluation runtime exit. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 / SPEC-ARCH-02 (DAG + pureté domain)
   - SPEC-ARCH-05 / SPEC-ARCH-07
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : fichiers et fonctions (`parsePrompt`, `parseExitCondition`).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
