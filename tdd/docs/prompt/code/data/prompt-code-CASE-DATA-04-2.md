# Prompt — écrire le code de CASE-DATA-04-2

> **Titre :** CASE-DATA-04-2 — Disque comme unique source de vérité (sans cache opaque)  
> **Exigence / Critère d'acceptation :** AC-DATA-04-2 dans `tdd/specs/DATA.md`  
> **Cas de test associé :** [`CASE-DATA-04-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/data/CASE-DATA-04-2.md)  
> **Fichier de test unitaire cible :** [`CASE-DATA-04-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/data/CASE-DATA-04-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_DATA_04_2_disk_as_single_source_of_truth`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/data/CASE-DATA-04-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/data/CASE-DATA-04-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/data/CASE-DATA-04-2.test.ts::test_CASE_DATA_04_2_disk_as_single_source_of_truth
- Le cas de test : tdd/tests/data/CASE-DATA-04-2.md
- La spécification : tdd/specs/DATA.md, section SPEC-DATA-04 (AC-DATA-04-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-services.md (SVC-002), tdd/docs/signature/signature-lib.md (LIB-002), tdd/docs/signature/signature-types.md (TYPES-002, TYPES-004)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/services/resource-store.service.ts
  - src/lib/fs/fresh-reader.ts
  - src/types/models/agent.model.ts
  - src/types/models/prompt.model.ts
  - src/utils/id.utils.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_DATA_04_2_disk_as_single_source_of_truth, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-DATA-04 / R-36 / REQ-104 / C-03 :
   - Chaque `getPrompt` / `getAgent` / `listAgents` relit le disque via LIB-002 (`readJsonFile` / listage) — aucun cache opaque ne masque une édition manuelle.
   - Après mutation manuelle du JSON prompt → `getPrompt` retourne le nouveau `content`.
   - Après `unlink` manuel d'un agent → `getAgent` rejette avec Error matching `/NOT_FOUND|introuvable|n'existe|absent/i`.
   - Après ajout manuel d'un fichier agent → `listAgents` l'inclut sans redémarrage.
   - Primitive `readJsonFile<T>(path)` exportée et cohérente avec le contenu disque.
4. Pas d'`fs.*` dans `services/` : délégation à `lib/fs/fresh-reader.ts`. Pas de watcher obligatoire (hors AC).
5. Respecte TYPES-002/004 / `domain.puml`. Valeurs d'exemple (`p-dev`, `agent-nouveau`) = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas écriture atomique CRUD (04-1) ni exclusion logs (04-3). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `getPrompt`/`getAgent`/`listAgents` + `readJsonFile` (LIB-002).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
