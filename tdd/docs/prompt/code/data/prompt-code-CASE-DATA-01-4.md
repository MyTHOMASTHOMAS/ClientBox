# Prompt — écrire le code de CASE-DATA-01-4

> **Titre :** CASE-DATA-01-4 — Rejet des JSON corrompus / incomplets et IDs de traversal sans crash  
> **Exigence / Critère d'acceptation :** AC-DATA-01-4 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-01-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-01-4.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-01-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-01-4.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_01_4_reject_corrupt_json_without_crash`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-01-4.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-01-4.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-01-4.test.ts::test_CASE_DATA_01_4_reject_corrupt_json_without_crash
- Le cas de test : tdd/tests/data/CASE-DATA-01-4.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-01 (AC-DATA-01-4)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-002 fresh-reader), tdd/docs/signature/signature-utils.md (UTILS-003), tdd/docs/signature/signature-types.md (TYPES-002, TYPES-003)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/fs/fresh-reader.ts
  - src/utils/id.utils.ts
  - src/domain/schemas/agent.schema.ts
  - src/domain/schemas/profile.schema.ts
  - src/domain/schemas/validation-error.ts
  - src/types/models/agent.model.ts
  - src/types/models/profile.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_01_4_reject_corrupt_json_without_crash, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente les règles prescrites par SPEC-DATA-01 / AC-DATA-01-4 :
   - `readJsonFile(path)` : JSON syntaxiquement invalide → Error (message évoquant le fichier / JSON / parse) **sans crash processus**.
   - Profil JSON incomplet (ex. `{ id }` seul) passé à `parseProfile` → `ResourceValidationError` (champs manquants).
   - `isValidResourceId('../etc/passwd') === false` ; `parseAgent` avec un tel `id` → `ResourceValidationError` matching `/id|interdit|\.\./i`.
4. Répartition des couches :
   - I/O lecture JSON → `src/lib/fs/fresh-reader.ts` (LIB-002, SPEC-ARCH-03)
   - Validation ID → `src/utils/id.utils.ts` (UTILS-003)
   - Validation schéma → `src/domain/schemas/*` (pure)
5. Respecte le modèle du domaine / TYPES. Les chemins fixture `.agents/data/agents|profils` sont des jeux d'essai ADR-006.
6. N'implémente que ce que ce test exige. Ne traite pas delete profil lié (CASE-DATA-01-5), ni scripts if, ni scénarios. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG — `domain/` ↛ `lib/` ; `utils/` sans I/O)
   - SPEC-ARCH-02 (pureté domain)
   - SPEC-ARCH-03 (`node:fs` confiné à `lib/`)
   - SPEC-ARCH-05 / SPEC-ARCH-07
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle — modules Node.js natifs uniquement pour LIB-002.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `readJsonFile` + `isValidResourceId` + `parseAgent`/`parseProfile`.
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
