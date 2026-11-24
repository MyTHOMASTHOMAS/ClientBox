# Prompt — écrire le code de CASE-ENG-04-2

> **Titre :** CASE-ENG-04-2 — Politiques d'injection profil + reset ClearContext  
> **Exigence / Critère d'acceptation :** AC-ENG-04-2 dans `tdd/specs/ENG.md`  
> **Cas de test associé :** [`CASE-ENG-04-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-04-2.md)  
> **Fichier de test unitaire cible :** [`CASE-ENG-04-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-04-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_ENG_04_2_profile_injection_policies_and_clear_context_reset`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/eng/CASE-ENG-04-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/eng/CASE-ENG-04-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/eng/CASE-ENG-04-2.test.ts::test_CASE_ENG_04_2_profile_injection_policies_and_clear_context_reset
- Le cas de test : tdd/tests/eng/CASE-ENG-04-2.md
- La spécification : tdd/specs/ENG.md, section SPEC-ENG-04 (AC-ENG-04-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-domain.md (DOM-003, DOM-004), tdd/docs/signature/signature-types.md (TYPES-003)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/prompt/policy-checker.ts
  - src/domain/prompt/prompt-assembler.ts
  - src/types/models/profile.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ENG_04_2_profile_injection_policies_and_clear_context_reset, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ENG-04 / DOM-003 / TYPES-003 :
   - `PolicyInjectionState` : `{ hasInjectedOnce, hasInjectedThisScenario }` (exporté depuis policy-checker).
   - `shouldInjectSystemPrompt(policy, state)` → boolean selon policy.
   - `updatePolicyState(policy, state, event)` avec `event` ∈ `'run' | 'clearContext'` — state machine **immutable** (retourne nouvel état).
   - `chaque_prompt` : injection systématique à chaque Run.
   - `debut_scenario` : injection au 1er Run du scénario uniquement.
   - `une_fois_jusqu_a_clear` : injection au 1er Run après dernier clear ; `updatePolicyState(..., 'clearContext')` réarme l'injection.
   - Assemblage via `assemblePrompt` (DOM-004) : inject → system+user ; sinon user seul.
4. Pureté domain/prompt. Pas de services/, pas d'adapter.
5. Respecte TYPES-003 (`ProfilePolicy`). Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas stop global erreur (04-3). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `shouldInjectSystemPrompt` / `updatePolicyState` (DOM-003).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
