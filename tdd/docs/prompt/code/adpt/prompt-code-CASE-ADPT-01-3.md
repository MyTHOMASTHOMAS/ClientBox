# Prompt — écrire le code de CASE-ADPT-01-3

> **Titre :** CASE-ADPT-01-3 — Normalisation du flux et fallback gracieux `parseStreamLine`  
> **Exigence / Critère d'acceptation :** AC-ADPT-01-3 dans `tdd/specs/ADPT.md`  
> **Cas de test associé :** [`CASE-ADPT-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-01-3.md)  
> **Fichier de test unitaire cible :** [`CASE-ADPT-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-01-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_ADPT_01_3_stream_normalization_and_graceful_fallback`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/adpt/CASE-ADPT-01-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/adpt/CASE-ADPT-01-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/adpt/CASE-ADPT-01-3.test.ts::test_CASE_ADPT_01_3_stream_normalization_and_graceful_fallback
- Le cas de test : tdd/tests/adpt/CASE-ADPT-01-3.md
- La spécification : tdd/specs/ADPT.md, section SPEC-ADPT-01 (AC-ADPT-01-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-types.md (TYPES-001), tdd/docs/signature/signature-lib.md (LIB-006)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-002-contrat-adapter.md, tdd/docs/adr/ADR-003-adapter-cursor-cli.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/types/contracts/cli-adapter.contract.ts
  - src/lib/adapters/cursor-cli.adapter.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ADPT_01_3_stream_normalization_and_graceful_fallback, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ADPT-01 / R-29 / C-01 / REQ-103 :
   - `CursorCLIAdapter.parseStreamLine(line: string): AgentStreamEvent` — ne lève **jamais** d'exception.
   - Ligne nominale → `{ type: 'stdout', chunk: line }` (ex. « Compilation réussie »).
   - Ligne warning → `type` ∈ `{ 'stderr', 'stdout' }` avec `chunk` inchangé.
   - Ligne malformée / JSON corrompu → fallback `{ type: 'stdout', chunk: line }` (pas de throw).
   - Couvrir lignes vides, whitespace, JSON valide, unicode, null-byte : toujours un `AgentStreamEvent` valide (`type` ∈ stdout|stderr|exit|error, `chunk: string`).
4. Parsing dans LIB-006 uniquement. Pas de persistance disque des chunks.
5. Respecte TYPES-001 `AgentStreamEvent`. Chaînes d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas protocole Cursor détaillé (02-3), ni terminal UI. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `CursorCLIAdapter.parseStreamLine` (LIB-006).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
