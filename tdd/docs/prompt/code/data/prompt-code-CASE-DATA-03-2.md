# Prompt — écrire le code de CASE-DATA-03-2

> **Titre :** CASE-DATA-03-2 — Renumérotation automatique des clés numériques après suppression  
> **Exigence / Critère d'acceptation :** AC-DATA-03-2 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-03-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-03-2.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-03-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-03-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_03_2_default_key_renumbering_after_deletion`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-03-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-03-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-03-2.test.ts::test_CASE_DATA_03_2_default_key_renumbering_after_deletion
- Le cas de test : tdd/tests/data/CASE-DATA-03-2.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-03 (AC-DATA-03-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-domain.md (DOM-006), tdd/docs/signature/signature-utils.md (UTILS-002), tdd/docs/signature/signature-types.md (TYPES-008)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-004-moteur-blocs.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/domain/keys/key-renumberer.ts
  - src/utils/array.utils.ts
  - src/types/models/connection.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_03_2_default_key_renumbering_after_deletion, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-03 / R-43 / DOM-006 :
   - `renumberDefaultKeys(connections, removedKey)` renumérote les clés numériques séquentielles restantes (`"0"`, `"1"`, …) après suppression d'une clé numérique.
   - Ex. après retrait de `"1"` parmi `"0","1","2"` → clés `"0","1"` (l'ancien `"2"` devient `"1"`).
   - Fonction pure, immutable (nouveau tableau).
4. La règle vit dans `src/domain/keys/key-renumberer.ts`. Pas dans services/UI. Pas d'I/O.
5. Respecte TYPES-008 / `domain.puml`.
6. N'implémente que ce que ce test exige. Ne traite pas la préservation des clés textuelles (CASE-DATA-03-3) au-delà du comportement numérique. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `renumberDefaultKeys`.
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
