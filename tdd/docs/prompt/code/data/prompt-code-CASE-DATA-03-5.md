# Prompt — écrire le code de CASE-DATA-03-5

> **Titre :** CASE-DATA-03-5 — Validation topologique : Start unique, 0 entrée, références valides  
> **Exigence / Critère d'acceptation :** AC-DATA-03-5 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-03-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-03-5.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-03-5.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-03-5.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_03_5_graph_topology_start_unique_and_no_inbound`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-03-5.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-03-5.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-03-5.test.ts::test_CASE_DATA_03_5_graph_topology_start_unique_and_no_inbound
- Le cas de test : tdd/tests/data/CASE-DATA-03-5.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-03 (AC-DATA-03-5)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-domain.md (DOM-008, DOM-007 si réutilisé), tdd/docs/signature/signature-types.md (TYPES-007, TYPES-008)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-005-persistance-data.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/graph/graph-validator.ts
  - src/domain/keys/key-collision.ts
  - src/types/models/node.model.ts
  - src/types/models/connection.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_03_5_graph_topology_start_unique_and_no_inbound, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-03 / DOM-008 / R-19 / R-20 / REQ-015 :
   - `validateGraph(nodes, connections)` retourne `string[]` (messages FR) ; `[]` si graphe valide.
   - 0 Start → erreur matching `/Start|absent|manquant/i`.
   - >1 Start → erreur matching `/unique|plusieurs|deux/i`.
   - Connexion dont `targetNodeId` est le Start → erreur matching `/Start|entr[ée]e|R-20|interdit/i`.
   - Référence `sourceNodeId`/`targetNodeId` inexistant → erreur matching `/référence|inexistant|invalide|nœud|noeud/i`.
   - Graphe nominal (1 Start, 0 entrée, refs valides) → `[]`.
4. Validation pure dans DOM-008. Pas d'`fs.*`, pas de services/, pas d'UI. Pas de validation d'existence disque des `agentId` (hors DOM-008).
5. Respecte TYPES-007/008 / `domain.puml`. Les ids d'exemple (`start-1`, `ghost`) = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas collisions de clés (03-4), persistance scénario (03-1), ni unicité canvas UI (UI-02-2). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `validateGraph` (DOM-008).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
