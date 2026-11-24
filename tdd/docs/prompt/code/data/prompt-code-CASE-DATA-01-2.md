# Prompt — écrire le code de CASE-DATA-01-2

> **Titre :** CASE-DATA-01-2 — Validation du schéma Profil (enum `policy` + défaut `chaque_prompt`)  
> **Exigence / Critère d'acceptation :** AC-DATA-01-2 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-01-2.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-01-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_01_2_profile_schema_policy_enum_and_default`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-01-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-01-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-01-2.test.ts::test_CASE_DATA_01_2_profile_schema_policy_enum_and_default
- Le cas de test : tdd/tests/data/CASE-DATA-01-2.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-01 (AC-DATA-01-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-types.md (TYPES-003), tdd/docs/signature/signature-domain.md
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/schemas/profile.schema.ts
  - src/domain/schemas/validation-error.ts
  - src/types/models/profile.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_01_2_profile_schema_policy_enum_and_default, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-01 / R-06 :
   - `parseProfile(input)` accepte les 3 policies : `chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`.
   - Si `policy` est absente → défaut **`chaque_prompt`** (valeur métier SPEC, pas un hard-code arbitraire inventé hors spec).
   - Policy invalide (ex. jeu d'essai `toujours`) → `ResourceValidationError` matching `/policy|toujours/i`.
4. La validation vit dans `src/domain/schemas/profile.schema.ts` (pure). Pas dans DOM-003 `policy-checker.ts` (runtime d'injection ENG — hors périmètre). Pas dans services/UI.
5. Respecte TYPES-003 / `domain.puml`. N'invente pas de 4ᵉ policy.
6. N'implémente que ce que ce test exige. Ne traite pas Agent, Prompt/Exit, JSON corrompu. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG)
   - SPEC-ARCH-02 (pureté domain)
   - SPEC-ARCH-05 / SPEC-ARCH-07 (volumétrie, complexité, nommage)
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : fichier et fonction (`parseProfile` + défaut policy).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
