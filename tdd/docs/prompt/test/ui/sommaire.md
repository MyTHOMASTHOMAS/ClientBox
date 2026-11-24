# Sommaire des Prompts de Test — Domaine UI (Interface Web, Canvas, Terminal & Commandes)

> **Domaine :** `UI` — Interface Web, Canvas, Terminal & Commandes  
> **Spécification maître :** [`tdd/specs/UI.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/specs/UI.md)  
> **ADR d'ancrage :** [`ADR-001-socle-applicatif.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/adr/ADR-001-socle-applicatif.md)  
> **Contexte initial de test :** [`PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md)  
> **Sommaire général des tests :** [`tdd/docs/prompt/test/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/sommaire.md)  
> **Nombre de prompts :** **11 prompts** (100 % couverture du domaine)

---

## 1. Description du Périmètre

Interface utilisateur Web en français intégral, canvas nodal interactif, terminal de logs en direct et boutons d'action rapide.

---

## 2. Table d'Indexation des Prompts (UI)

| # | Cas de Test (CASE) | Exigence Spec | Fichier Test Cible | Prompt Unitaire Dédié | Méthode de Test Définie | Commande de Test Unitaire |
|:---:|:---|:---:|:---|:---|:---|:---|
| 01 | [`CASE-UI-01-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-01-1.md) | `AC-UI-01-1` | [`CASE-UI-01-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-01-1.test.ts) | [`prompt-test-CASE-UI-01-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-01-1.md) | `test_CASE_UI_01_1_full_french_language_coverage_on_ui` | `node --test tests/ui/CASE-UI-01-1.test.ts` |
| 02 | [`CASE-UI-01-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-01-2.md) | `AC-UI-01-2` | [`CASE-UI-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-01-2.test.ts) | [`prompt-test-CASE-UI-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-01-2.md) | `test_CASE_UI_01_2_crud_forms_availability_and_validation_integrity` | `node --test tests/ui/CASE-UI-01-2.test.ts` |
| 03 | [`CASE-UI-01-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-01-3.md) | `AC-UI-01-3` | [`CASE-UI-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-01-3.test.ts) | [`prompt-test-CASE-UI-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-01-3.md) | `test_CASE_UI_01_3_agent_cli_selector_filtered_to_embedded_adapters` | `node --test tests/ui/CASE-UI-01-3.test.ts` |
| 04 | [`CASE-UI-02-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-1.md) | `AC-UI-02-1` | [`CASE-UI-02-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-1.test.ts) | [`prompt-test-CASE-UI-02-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-02-1.md) | `test_CASE_UI_02_1_canvas_nodal_composition_and_oriented_wiring` | `node --test tests/ui/CASE-UI-02-1.test.ts` |
| 05 | [`CASE-UI-02-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-2.md) | `AC-UI-02-2` | [`CASE-UI-02-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-2.test.ts) | [`prompt-test-CASE-UI-02-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-02-2.md) | `test_CASE_UI_02_2_start_block_strict_uniqueness_enforcement` | `node --test tests/ui/CASE-UI-02-2.test.ts` |
| 06 | [`CASE-UI-02-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-3.md) | `AC-UI-02-3` | [`CASE-UI-02-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-3.test.ts) | [`prompt-test-CASE-UI-02-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-02-3.md) | `test_CASE_UI_02_3_if_block_output_branches_visual_differentiation` | `node --test tests/ui/CASE-UI-02-3.test.ts` |
| 07 | [`CASE-UI-02-4`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-4.md) | `AC-UI-02-4` | [`CASE-UI-02-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-4.test.ts) | [`prompt-test-CASE-UI-02-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-02-4.md) | `test_CASE_UI_02_4_canvas_node_execution_status_realtime_display` | `node --test tests/ui/CASE-UI-02-4.test.ts` |
| 08 | [`CASE-UI-02-5`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-02-5.md) | `AC-UI-02-5` | [`CASE-UI-02-5.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-02-5.test.ts) | [`prompt-test-CASE-UI-02-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-02-5.md) | `test_CASE_UI_02_5_canvas_scenario_launch_control_transmitting_to_engine` | `node --test tests/ui/CASE-UI-02-5.test.ts` |
| 09 | [`CASE-UI-03-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-03-1.md) | `AC-UI-03-1` | [`CASE-UI-03-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-03-1.test.ts) | [`prompt-test-CASE-UI-03-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-03-1.md) | `test_CASE_UI_03_1_web_terminal_realtime_streaming_without_data_persistence` | `node --test tests/ui/CASE-UI-03-1.test.ts` |
| 10 | [`CASE-UI-03-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-03-2.md) | `AC-UI-03-2` | [`CASE-UI-03-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-03-2.test.ts) | [`prompt-test-CASE-UI-03-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-03-2.md) | `test_CASE_UI_03_2_emergency_stop_button_action_in_run_and_pause_states` | `node --test tests/ui/CASE-UI-03-2.test.ts` |
| 11 | [`CASE-UI-03-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/ui/CASE-UI-03-3.md) | `AC-UI-03-3` | [`CASE-UI-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/ui/CASE-UI-03-3.test.ts) | [`prompt-test-CASE-UI-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/prompt-test-CASE-UI-03-3.md) | `test_CASE_UI_03_3_manual_agent_clear_context_button_action` | `node --test tests/ui/CASE-UI-03-3.test.ts` |

---

## 3. Guide d'Exécution Locale

1. **Chargement du Contexte :** Injecter le fichier [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md) avant d'exécuter un prompt de ce lot.
2. **Exécution du Prompt :** Copier le contenu du fichier `prompt-test-CASE-*.md` concerné dans l'agent IA.
3. **Vérification :** Lancer la commande unitaire `node --test tests/ui/CASE-*.test.ts`.
