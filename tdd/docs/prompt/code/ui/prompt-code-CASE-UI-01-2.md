# Prompt — écrire le code de CASE-UI-01-2

> **Titre :** CASE-UI-01-2 — Formulaires CRUD et intégrité de validation  
> **Exigence / Critère d'acceptation :** AC-UI-01-2 dans `tdd/specs/UI.md`  
> **Cas de test associé :** [`CASE-UI-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-01-2.md)  
> **Fichier de test unitaire cible :** [`CASE-UI-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-01-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_UI_01_2_crud_forms_availability_and_validation_integrity`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/ui/CASE-UI-01-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/ui/CASE-UI-01-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/ui/CASE-UI-01-2.test.ts::test_CASE_UI_01_2_crud_forms_availability_and_validation_integrity
- Le cas de test : tdd/tests/ui/CASE-UI-01-2.md
- La spécification : tdd/specs/UI.md, section SPEC-UI-01 (AC-UI-01-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-ui.md (UI-005, UI-006, UI-007, UI-014), tdd/docs/signature/signature-types.md (TYPES-003)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-005-persistance-data.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/ui/views/agents/agent-form.ts
  - src/ui/views/profiles/profile-form.ts
  - src/ui/views/resources/generic-crud.ts
  - src/ui/views/scenarios/scenario-crud.ts
  - src/ui/i18n/fr-catalog.ts
  - src/types/models/profile.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_UI_01_2_crud_forms_availability_and_validation_integrity, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-UI-01 / AC-UI-01-2 :
   - Champs formulaires : Agent (`id`,`name`,`profilId`,`cliId`) ; Profil (`id`,`name`,`systemPrompt`,`policy`) ; Prompt (`id`,`name`,`contenu`) ; Exit (`id`,`name`,`type`,`expression`) ; Scénario (`id`,`name`,`description`,`payload`).
   - `PROFILE_POLICY_OPTIONS` = exactement les 3 policies TYPES-003.
   - `validateAgentForm` : `profilId` vide → `{ ok: false, fieldErrors.profilId }` message FR ; collision `id` existant → erreur FR sur `id` ; valeurs valides → `ok: true`.
   - `validateProfileForm` / `validatePromptForm` / `validateExitForm` / `validateScenarioForm` : jeux nominaux → `ok: true`.
   - Messages d'erreur hors deny-list anglaise (`ENGLISH_DENY_LIST` / `TECH_ALLOW_LIST` depuis fr-catalog).
4. Surface TU = exports fonctions/constantes (au-delà du seul `*View` inventorié UI-005…) — allow-list maintenue (contrat TU). Pas d'import `lib/` depuis `ui/`.
5. Respecte TYPES-003 (`ProfilePolicy`). Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne traite pas le filtrage CLI registre (01-3) ni le canvas. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : validate*Form + *_FORM_FIELDS (UI-005/006/007/014).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
