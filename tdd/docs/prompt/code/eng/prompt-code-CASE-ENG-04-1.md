# Prompt — écrire le code de CASE-ENG-04-1

> **Titre :** CASE-ENG-04-1 — Assemblage prompt moteur (system + user) avant adapter  
> **Exigence / Critère d'acceptation :** AC-ENG-04-1 dans `tdd/specs/ENG.md`  
> **Cas de test associé :** [`CASE-ENG-04-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-04-1.md)  
> **Fichier de test unitaire cible :** [`CASE-ENG-04-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-04-1.test.ts)  
> **Méthode de test exacte :** `test_CASE_ENG_04_1_engine_prompt_assembly_before_adapter_call`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/eng/CASE-ENG-04-1.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/eng/CASE-ENG-04-1.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/eng/CASE-ENG-04-1.test.ts::test_CASE_ENG_04_1_engine_prompt_assembly_before_adapter_call
- Le cas de test : tdd/tests/eng/CASE-ENG-04-1.md
- La spécification : tdd/specs/ENG.md, section SPEC-ENG-04 (AC-ENG-04-1)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-domain.md (DOM-004), tdd/docs/signature/signature-utils.md (UTILS-001 optionnel)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/prompt/prompt-assembler.ts
  - src/utils/string.utils.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ENG_04_1_engine_prompt_assembly_before_adapter_call, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ENG-04 / R-45 / DOM-004 :
   - `assemblePrompt(systemPrompt, userPrompt)` : concaténation avec séparateur `\n\n` si system non vide.
   - `systemPrompt === ''` → retourne **uniquement** `userPrompt` (pas de `\n` en tête).
   - Résultat transmis tel quel à l'adapter via `assembledPrompt` (distinct du user seul).
4. Fonction pure dans `domain/prompt/prompt-assembler.ts`. Pas d'adapter, pas de services.
5. Valeurs d'exemple (TypeScript, validation schéma) = jeux d'essai SPEC.
6. N'implémente que ce que ce test exige. Ne traite pas policies profil (04-2) ni stop global (04-3). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `assemblePrompt` (DOM-004).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
