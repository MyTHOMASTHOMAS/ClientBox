# Sommaire des Prompts de Test — Domaine ADPT (Adaptateurs CLI, Isolation & Streaming)

> **Domaine :** `ADPT` — Adaptateurs CLI, Isolation & Streaming  
> **Spécification maître :** [`tdd/specs/ADPT.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/specs/ADPT.md)  
> **ADR d'ancrage :** [`ADR-002-cursor-cli.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/adr/ADR-002-cursor-cli.md)  
> **Contexte initial de test :** [`PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md)  
> **Sommaire général des tests :** [`tdd/docs/prompt/test/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/sommaire.md)  
> **Nombre de prompts :** **9 prompts** (100 % couverture du domaine)

---

## 1. Description du Périmètre

Interface unifiée des adaptateurs CLI (cursor-cli), streaming d'événements en temps réel et isolation des processus.

---

## 2. Table d'Indexation des Prompts (ADPT)

| # | Cas de Test (CASE) | Exigence Spec | Fichier Test Cible | Prompt Unitaire Dédié | Méthode de Test Définie | Commande de Test Unitaire |
|:---:|:---|:---:|:---|:---|:---|:---|
| 01 | [`CASE-ADPT-01-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-01-1.md) | `AC-ADPT-01-1` | [`CASE-ADPT-01-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-01-1.test.ts) | [`prompt-test-CASE-ADPT-01-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-01-1.md) | `test_CASE_ADPT_01_1_cli_adapter_typescript_contract_compliance` | `node --test tests/adpt/CASE-ADPT-01-1.test.ts` |
| 02 | [`CASE-ADPT-01-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-01-2.md) | `AC-ADPT-01-2` | [`CASE-ADPT-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-01-2.test.ts) | [`prompt-test-CASE-ADPT-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-01-2.md) | `test_CASE_ADPT_01_2_execution_context_typing_and_propagation` | `node --test tests/adpt/CASE-ADPT-01-2.test.ts` |
| 03 | [`CASE-ADPT-01-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-01-3.md) | `AC-ADPT-01-3` | [`CASE-ADPT-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-01-3.test.ts) | [`prompt-test-CASE-ADPT-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-01-3.md) | `test_CASE_ADPT_01_3_stream_normalization_and_graceful_fallback` | `node --test tests/adpt/CASE-ADPT-01-3.test.ts` |
| 04 | [`CASE-ADPT-02-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-02-1.md) | `AC-ADPT-02-1` | [`CASE-ADPT-02-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-02-1.test.ts) | [`prompt-test-CASE-ADPT-02-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-02-1.md) | `test_CASE_ADPT_02_1_cursor_cli_bin_environment_variable_validation` | `node --test tests/adpt/CASE-ADPT-02-1.test.ts` |
| 05 | [`CASE-ADPT-02-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-02-2.md) | `AC-ADPT-02-2` | [`CASE-ADPT-02-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-02-2.test.ts) | [`prompt-test-CASE-ADPT-02-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-02-2.md) | `test_CASE_ADPT_02_2_cursor_cli_command_generation_with_prompt_and_cwd` | `node --test tests/adpt/CASE-ADPT-02-2.test.ts` |
| 06 | [`CASE-ADPT-02-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-02-3.md) | `AC-ADPT-02-3` | [`CASE-ADPT-02-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-02-3.test.ts) | [`prompt-test-CASE-ADPT-02-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-02-3.md) | `test_CASE_ADPT_02_3_cursor_cli_stream_parsing_to_agent_stream_event` | `node --test tests/adpt/CASE-ADPT-02-3.test.ts` |
| 07 | [`CASE-ADPT-03-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-03-1.md) | `AC-ADPT-03-1` | [`CASE-ADPT-03-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-03-1.test.ts) | [`prompt-test-CASE-ADPT-03-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-03-1.md) | `test_CASE_ADPT_03_1_manual_stop_kills_process_without_clearing_session` | `node --test tests/adpt/CASE-ADPT-03-1.test.ts` |
| 08 | [`CASE-ADPT-03-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-03-2.md) | `AC-ADPT-03-2` | [`CASE-ADPT-03-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-03-2.test.ts) | [`prompt-test-CASE-ADPT-03-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-03-2.md) | `test_CASE_ADPT_03_2_cursor_cli_clear_context_execution` | `node --test tests/adpt/CASE-ADPT-03-2.test.ts` |
| 09 | [`CASE-ADPT-03-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/adpt/CASE-ADPT-03-3.md) | `AC-ADPT-03-3` | [`CASE-ADPT-03-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/adpt/CASE-ADPT-03-3.test.ts) | [`prompt-test-CASE-ADPT-03-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/prompt-test-CASE-ADPT-03-3.md) | `test_CASE_ADPT_03_3_no_session_state_persistence_by_clientsbox` | `node --test tests/adpt/CASE-ADPT-03-3.test.ts` |

---

## 3. Guide d'Exécution Locale

1. **Chargement du Contexte :** Injecter le fichier [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md) avant d'exécuter un prompt de ce lot.
2. **Exécution du Prompt :** Copier le contenu du fichier `prompt-test-CASE-*.md` concerné dans l'agent IA.
3. **Vérification :** Lancer la commande unitaire `node --test tests/adpt/CASE-*.test.ts`.
