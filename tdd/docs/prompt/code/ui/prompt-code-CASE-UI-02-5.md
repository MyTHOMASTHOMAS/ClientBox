# Prompt — écrire le code de CASE-UI-02-5

> **Titre :** CASE-UI-02-5 — Contrôle de lancement du scénario transmis au moteur  
> **Exigence / Critère d'acceptation :** AC-UI-02-5 dans `tdd/specs/UI.md`  
> **Cas de test associé :** [`CASE-UI-02-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-5.md)  
> **Fichier de test unitaire cible :** [`CASE-UI-02-5.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-5.test.ts)  
> **Méthode de test exacte :** `test_CASE_UI_02_5_canvas_scenario_launch_control_transmitting_to_engine`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/ui/CASE-UI-02-5.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/ui/CASE-UI-02-5.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/ui/CASE-UI-02-5.test.ts::test_CASE_UI_02_5_canvas_scenario_launch_control_transmitting_to_engine
- Le cas de test : tdd/tests/ui/CASE-UI-02-5.md
- La spécification : tdd/specs/UI.md, section SPEC-UI-02 (AC-UI-02-5)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-ui.md (UI-008, UI-002), tdd/docs/signature/signature-types.md (TYPES-012)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-004-moteur-blocs.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/ui/canvas/canvas-view.ts
  - src/ui/api/http-client.ts
  - src/types/messages/block-status.model.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_UI_02_5_canvas_scenario_launch_control_transmitting_to_engine, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-UI-02 / AC-UI-02-5 :
   - `LAUNCH_BUTTON_LABEL === 'Lancer le scénario'` (FR ; pas Run/Submit/Start anglais isolés).
   - `tryLaunchScenario(doc, http)` : si graphe valide avec Start → `http.post('/api/scenarios/<id>/run')` ; `ok: true` ; `launchButtonDisabled: true` ; `startNodeStatus: 'running'`.
   - Anti double-clic : si `doc.runnerStatus === 'running'` → `ok: false`, aucun POST supplémentaire.
   - Document sans Start → `ok: false` + `error` message FR (accents / unique|Start|scénario…).
4. Délégation réseau via `HttpClient` (UI-002) injecté — pas d'import `services/` / `lib/` depuis `ui/`.
5. Réutilise `createCanvasDocument` / `addBlock` / `wireOriented` déjà couverts par 02-1/02-2 si présents ; n'anticipe pas le terminal (03-*).
6. N'implémente que ce que ce test exige. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `tryLaunchScenario` / `LAUNCH_BUTTON_LABEL` (UI-008).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
