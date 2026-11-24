# Prompt — écrire le code de CASE-UI-03-3

> **Titre :** CASE-UI-03-3 — Reset manuel du contexte agent (bouton Effacer le contexte)  
> **Exigence / Critère d'acceptation :** AC-UI-03-3 dans `tdd/specs/UI.md`  
> **Cas de test associé :** [`CASE-UI-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-03-3.md)  
> **Fichier de test unitaire cible :** [`CASE-UI-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-03-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_UI_03_3_manual_agent_clear_context_button_action`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/ui/CASE-UI-03-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/ui/CASE-UI-03-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/ui/CASE-UI-03-3.test.ts::test_CASE_UI_03_3_manual_agent_clear_context_button_action
- Le cas de test : tdd/tests/ui/CASE-UI-03-3.md
- La spécification : tdd/specs/UI.md, section SPEC-UI-03 (AC-UI-03-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-ui.md (UI-013, UI-002), tdd/docs/signature/signature-services.md (SVC-004 — clearContext côté serveur référencé, non importé par ce TU UI)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-002-contrat-adapter.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/ui/terminal/context-reset-button.ts
  - src/ui/api/http-client.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_UI_03_3_manual_agent_clear_context_button_action, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-UI-03 / R-30 / REQ-021 / AC-UI-03-3 :
   - `CLEAR_CONTEXT_BUTTON_LABEL === 'Effacer le contexte'` (FR).
   - `CLEAR_CONTEXT_CONFIRM_PROMPT` message FR de confirmation.
   - `requestClearContext({ agentId, http, userConfirmed })` :
     - `userConfirmed === false` → `ok: false`, `cancelled: true`, aucun appel HTTP.
     - `userConfirmed === true` → `http.post('/api/agents/<id>/clear')` ; `ok: true` ; `successMessage` FR (contexte|effacé|réinitialis|mémoire).
     - Échec POST → `ok: false`, `errorMessage` FR, `uiStable === true` (pas de crash UI).
   - Clear ≠ Stop : **aucun** `http.del` sur `/run`.
4. Composant UI-013 distinct du terminal streaming (UI-012). HttpClient injecté ; pas d'import `lib/` / `services/` depuis `ui/`.
5. Valeurs d'exemple = jeux d'essai.
6. N'implémente que ce que ce test exige. Ne généralise pas au canvas launch. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `requestClearContext` (UI-013).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
