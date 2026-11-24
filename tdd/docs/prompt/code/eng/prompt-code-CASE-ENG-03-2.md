# Prompt — écrire le code de CASE-ENG-03-2

> **Titre :** CASE-ENG-03-2 — Bloc Run : prompt statique (R-12), émission power 1, endpoint  
> **Exigence / Critère d'acceptation :** AC-ENG-03-2 dans `tdd/specs/ENG.md`  
> **Cas de test associé :** [`CASE-ENG-03-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-2.md)  
> **Fichier de test unitaire cible :** [`CASE-ENG-03-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_ENG_03_2_run_block_execution_emission_and_endpoint`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/eng/CASE-ENG-03-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/eng/CASE-ENG-03-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/eng/CASE-ENG-03-2.test.ts::test_CASE_ENG_03_2_run_block_execution_emission_and_endpoint
- Le cas de test : tdd/tests/eng/CASE-ENG-03-2.md
- La spécification : tdd/specs/ENG.md, section SPEC-ENG-03 (AC-ENG-03-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-types.md (TYPES-001, TYPES-009, TYPES-010), tdd/docs/signature/signature-services.md (SVC-001 — hors écriture minimale si non importé par le TU)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-002-contrat-adapter.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/types/contracts/cli-adapter.contract.ts
  - src/types/messages/block-message.model.ts
  - src/types/messages/input-bag.model.ts
  - src/domain/messages/build-block-message.ts
  - src/domain/messages/input-bag.ops.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ENG_03_2_run_block_execution_emission_and_endpoint, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ENG-03 / R-12 / R-21 / REQ-016 :
   - Le prompt CLI vient de `ExecutionContext.assembledPrompt` (paramètres statiques) — le sac d'entrées peut exister mais **ne doit pas** être injecté dans les args (R-12 : pas de `ignore-me` dans la commande).
   - Succès → `buildBlockMessage('run', cliOutput, 1)` émis vers chaque cible (power 1, value = sortie CLI).
   - 0 sortie → endpoint (fan-out vide, aucune émission) — helper fanOut est local au TU.
4. Contrats TYPES-001 + messages (POINT-008). Le TU utilise un `CLIAdapter` de test ; pas d'obligation d'implémenter SVC-001 pour ce seul test.
5. Respecte TYPES-009/010. Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas If power différentiel (03-3) ni ClearContext bloc (03-4). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `buildBlockMessage('run', …, 1)` + contrat `assembledPrompt` (R-12).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
