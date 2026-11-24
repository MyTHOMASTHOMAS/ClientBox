# Prompt — écrire le code de CASE-UI-02-4

> **Titre :** CASE-UI-02-4 — Affichage temps réel des statuts d'exécution des nœuds  
> **Exigence / Critère d'acceptation :** AC-UI-02-4 dans `tdd/specs/UI.md`  
> **Cas de test associé :** [`CASE-UI-02-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-4.md)  
> **Fichier de test unitaire cible :** [`CASE-UI-02-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-4.test.ts)  
> **Méthode de test exacte :** `test_CASE_UI_02_4_canvas_node_execution_status_realtime_display`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/ui/CASE-UI-02-4.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/ui/CASE-UI-02-4.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/ui/CASE-UI-02-4.test.ts::test_CASE_UI_02_4_canvas_node_execution_status_realtime_display
- Le cas de test : tdd/tests/ui/CASE-UI-02-4.md
- La spécification : tdd/specs/UI.md, section SPEC-UI-02 (AC-UI-02-4)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-ui.md (UI-009), tdd/docs/signature/signature-types.md (TYPES-012)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/ui/canvas/block-node.ts
  - src/types/messages/block-status.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_UI_02_4_canvas_node_execution_status_realtime_display, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-UI-02 / REQ-007 / AC-UI-02-4 / TYPES-012 :
   - `BlockStatus` = `'idle' | 'running' | 'paused' | 'completed' | 'error'`.
   - `BLOCK_STATUS_VISUALS` : exactement 5 entrées.
   - `mapBlockStatusToVisual(status)` → `{ status, cssClass, labelFr, badge?, color?, highlight? }`.
   - Labels FR : idle→`Inactif` ; running→« en cours » ; paused→« pause » ; completed→« termin… » ; error→« erreur ».
   - Pause : badge ou label avec « pause » et `cssClass` contenant `pause`.
   - Erreur : surbrillance (`highlight === true` ou cssClass error) et/ou couleur rouge.
   - 5 labels FR distincts (`seenLabels.size === 5`).
4. Bijection EN technique → FR présentation dans UI-009 uniquement (ne pas altérer les littéraux TYPES-012).
5. Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas le launch scénario (02-5) ni le terminal (03-*). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `mapBlockStatusToVisual` / `BLOCK_STATUS_VISUALS` (UI-009).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
