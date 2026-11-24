# Sommaire des Prompts de Test — Domaine ENG (Moteur de Scénarios, Blocs & Join)

> **Domaine :** `ENG` — Moteur de Scénarios, Blocs & Join  
> **Spécification maître :** [`tdd/specs/ENG.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/specs/ENG.md)  
> **ADR d'ancrage :** [`ADR-004-moteur-de-scenario.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/adr/ADR-004-moteur-de-scenario.md)  
> **Contexte initial de test :** [`PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md)  
> **Sommaire général des tests :** [`tdd/docs/prompt/test/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/sommaire.md)  
> **Nombre de prompts :** **12 prompts** (100 % couverture du domaine)

---

## 1. Description du Périmètre

Orchestration événementielle asynchrone des blocs (START, RUN, IF, CLEAR_CONTEXT), gestion des états de pause et synchronisation JOIN.

---

## 2. Table d'Indexation des Prompts (ENG)

| # | Cas de Test (CASE) | Exigence Spec | Fichier Test Cible | Prompt Unitaire Dédié | Méthode de Test Définie | Commande de Test Unitaire |
|:---:|:---|:---:|:---|:---|:---|:---|
| 01 | [`CASE-ENG-01-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-01-1.md) | `AC-ENG-01-1` | [`CASE-ENG-01-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-01-1.test.ts) | [`prompt-test-CASE-ENG-01-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-01-1.md) | `test_CASE_ENG_01_1_block_message_structure_no_output_key` | `node --test tests/eng/CASE-ENG-01-1.test.ts` |
| 02 | [`CASE-ENG-01-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-01-2.md) | `AC-ENG-01-2` | [`CASE-ENG-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-01-2.test.ts) | [`prompt-test-CASE-ENG-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-01-2.md) | `test_CASE_ENG_01_2_input_bag_indexing_by_entry_keys` | `node --test tests/eng/CASE-ENG-01-2.test.ts` |
| 03 | [`CASE-ENG-02-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-02-1.md) | `AC-ENG-02-1` | [`CASE-ENG-02-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-02-1.test.ts) | [`prompt-test-CASE-ENG-02-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-02-1.md) | `test_CASE_ENG_02_1_join_trigger_when_all_inputs_received_with_full_power` | `node --test tests/eng/CASE-ENG-02-1.test.ts` |
| 04 | [`CASE-ENG-02-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-02-2.md) | `AC-ENG-02-2` | [`CASE-ENG-02-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-02-2.test.ts) | [`prompt-test-CASE-ENG-02-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-02-2.md) | `test_CASE_ENG_02_2_pause_state_transition_and_subsequent_unpause` | `node --test tests/eng/CASE-ENG-02-2.test.ts` |
| 05 | [`CASE-ENG-02-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-02-3.md) | `AC-ENG-02-3` | [`CASE-ENG-02-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-02-3.test.ts) | [`prompt-test-CASE-ENG-02-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-02-3.md) | `test_CASE_ENG_02_3_zero_input_blocks_remain_inactive_except_start` | `node --test tests/eng/CASE-ENG-02-3.test.ts` |
| 06 | [`CASE-ENG-03-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-1.md) | `AC-ENG-03-1` | [`CASE-ENG-03-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-1.test.ts) | [`prompt-test-CASE-ENG-03-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-03-1.md) | `test_CASE_ENG_03_1_start_block_initial_emission` | `node --test tests/eng/CASE-ENG-03-1.test.ts` |
| 07 | [`CASE-ENG-03-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-2.md) | `AC-ENG-03-2` | [`CASE-ENG-03-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-2.test.ts) | [`prompt-test-CASE-ENG-03-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-03-2.md) | `test_CASE_ENG_03_2_run_block_execution_emission_and_endpoint` | `node --test tests/eng/CASE-ENG-03-2.test.ts` |
| 08 | [`CASE-ENG-03-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-3.md) | `AC-ENG-03-3` | [`CASE-ENG-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-3.test.ts) | [`prompt-test-CASE-ENG-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-03-3.md) | `test_CASE_ENG_03_3_if_block_evaluation_and_differential_power_dispatch` | `node --test tests/eng/CASE-ENG-03-3.test.ts` |
| 09 | [`CASE-ENG-03-4`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-03-4.md) | `AC-ENG-03-4` | [`CASE-ENG-03-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-03-4.test.ts) | [`prompt-test-CASE-ENG-03-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-03-4.md) | `test_CASE_ENG_03_4_clear_context_block_reset_and_power_propagation` | `node --test tests/eng/CASE-ENG-03-4.test.ts` |
| 10 | [`CASE-ENG-04-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-04-1.md) | `AC-ENG-04-1` | [`CASE-ENG-04-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-04-1.test.ts) | [`prompt-test-CASE-ENG-04-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-04-1.md) | `test_CASE_ENG_04_1_engine_prompt_assembly_before_adapter_call` | `node --test tests/eng/CASE-ENG-04-1.test.ts` |
| 11 | [`CASE-ENG-04-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-04-2.md) | `AC-ENG-04-2` | [`CASE-ENG-04-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-04-2.test.ts) | [`prompt-test-CASE-ENG-04-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-04-2.md) | `test_CASE_ENG_04_2_profile_injection_policies_and_clear_context_reset` | `node --test tests/eng/CASE-ENG-04-2.test.ts` |
| 12 | [`CASE-ENG-04-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/eng/CASE-ENG-04-3.md) | `AC-ENG-04-3` | [`CASE-ENG-04-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/eng/CASE-ENG-04-3.test.ts) | [`prompt-test-CASE-ENG-04-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/prompt-test-CASE-ENG-04-3.md) | `test_CASE_ENG_04_3_block_failure_triggers_immediate_global_scenario_stop` | `node --test tests/eng/CASE-ENG-04-3.test.ts` |

---

## 3. Guide d'Exécution Locale

1. **Chargement du Contexte :** Injecter le fichier [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md) avant d'exécuter un prompt de ce lot.
2. **Exécution du Prompt :** Copier le contenu du fichier `prompt-test-CASE-*.md` concerné dans l'agent IA.
3. **Vérification :** Lancer la commande unitaire `node --test tests/eng/CASE-*.test.ts`.
