# Prompt — écrire le code de CASE-ADPT-03-3

> **Titre :** CASE-ADPT-03-3 — Absence de persistance d'état de session par ClientsBox  
> **Exigence / Critère d'acceptation :** AC-ADPT-03-3 dans `tdd/specs/ADPT.md`  
> **Cas de test associé :** [`CASE-ADPT-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-03-3.md)  
> **Fichier de test unitaire cible :** [`CASE-ADPT-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-03-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_ADPT_03_3_no_session_state_persistence_by_clientsbox`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/adpt/CASE-ADPT-03-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/adpt/CASE-ADPT-03-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/adpt/CASE-ADPT-03-3.test.ts::test_CASE_ADPT_03_3_no_session_state_persistence_by_clientsbox
- Le cas de test : tdd/tests/adpt/CASE-ADPT-03-3.md
- La spécification : tdd/specs/ADPT.md, section SPEC-ADPT-03 (AC-ADPT-03-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-004, LIB-006, LIB-005), tdd/docs/signature/signature-types.md (TYPES-001)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-003-adapter-cursor-cli.md, tdd/docs/adr/ADR-002-contrat-adapter.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/adapters/cursor-cli.adapter.ts
  - src/lib/process/spawner.ts
  - src/lib/process/env-resolver.ts
  - src/types/contracts/cli-adapter.contract.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_ADPT_03_3_no_session_state_persistence_by_clientsbox, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-ADPT-03 / R-31 / R-32 / R-33 / REQ-101 :
   - `buildCommand` + `spawnAgent` pour deux runs successifs : handles distincts, ≥ 2 spawns ; **aucun** fichier/dossier session|history|cache|stream|conversation sous `.agents/`.
   - Concurrence : deux `spawnAgent` immédiats sans verrou applicatif (R-33) → +2 spawns.
   - Continuité conversationnelle déléguée au CLI natif — ClientsBox ne matérialise aucune table Session.
4. Adapter LIB-006 + spawner LIB-004. Pas d'écriture d'état session dans services/ ni sous data/.
5. Respecte TYPES-001. Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas Stop (03-1) ni clearContext (03-2). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : invariant R-31/R-32 dans adapter/spawner (zéro persistance session).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
