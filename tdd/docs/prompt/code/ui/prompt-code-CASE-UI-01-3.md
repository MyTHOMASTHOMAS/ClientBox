# Prompt — écrire le code de CASE-UI-01-3

> **Titre :** CASE-UI-01-3 — Sélecteur CLI d'agent restreint aux adaptateurs embarqués  
> **Exigence / Critère d'acceptation :** AC-UI-01-3 dans `tdd/specs/UI.md`  
> **Cas de test associé :** [`CASE-UI-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-01-3.md)  
> **Fichier de test unitaire cible :** [`CASE-UI-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-01-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_UI_01_3_agent_cli_selector_filtered_to_embedded_adapters`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/ui/CASE-UI-01-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/ui/CASE-UI-01-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/ui/CASE-UI-01-3.test.ts::test_CASE_UI_01_3_agent_cli_selector_filtered_to_embedded_adapters
- Le cas de test : tdd/tests/ui/CASE-UI-01-3.md
- La spécification : tdd/specs/UI.md, section SPEC-UI-01 (AC-UI-01-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-02, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-ui.md (UI-005), tdd/docs/signature/signature-services.md (SVC-003), tdd/docs/signature/signature-lib.md (LIB-006), tdd/docs/signature/signature-types.md (TYPES-001)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-002-contrat-adapter.md, tdd/docs/adr/ADR-003-adapter-cursor-cli.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/ui/views/agents/agent-form.ts
  - src/ui/i18n/fr-catalog.ts
  - src/services/adapter-registry.service.ts
  - src/lib/adapters/cursor-cli.adapter.ts
  - src/types/contracts/cli-adapter.contract.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_UI_01_3_agent_cli_selector_filtered_to_embedded_adapters, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-UI-01 / R-04 / R-28 / SVC-003 / UI-005 :
   - `AdapterRegistryService` : `listOperationalAdapters()` — v1 = seul `cursor-cli` (`CursorCLIAdapter`).
   - `getCliSelectOptions(registry)` → options `{ value }` uniquement pour adapters opérationnels ; registre vide → `[]`.
   - Aucune option pour CLI fictifs (`unsupported-cli`, `claude-code`, `aider`, `gemini`).
   - `validateAgentForm(..., { allowedCliIds })` : `cliId` hors liste → `{ ok: false, fieldErrors.cliId }` message FR (CLI|disponible|supporté|adaptateur) ; `cursor-cli` autorisé → `ok: true`.
4. DAG : `ui/` n'importe pas `lib/` ni `services/` — `getCliSelectOptions` reçoit le registre en paramètre (duck-typing / types). Le TU construit le registre côté test ; tu peux implémenter SVC-003 + LIB-006 car importés par le TU.
5. Messages FR via fr-catalog / deny-list (POINT-010). Respecte TYPES-001 (`CLIAdapter`).
6. N'implémente que ce que ce test exige. Ne traite pas le canvas ni le terminal. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md : SPEC-ARCH-01/02/03/05/07.
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : `getCliSelectOptions` (UI-005) + `AdapterRegistryService.listOperationalAdapters` (SVC-003).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
