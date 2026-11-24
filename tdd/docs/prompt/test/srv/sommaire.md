# Sommaire des Prompts de Test — Domaine SRV (Serveur Local, Port & Signaux OS)

> **Domaine :** `SRV` — Serveur Local, Port & Signaux OS  
> **Spécification maître :** [`tdd/specs/SRV.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/specs/SRV.md)  
> **ADR d'ancrage :** [`ADR-001-socle-applicatif.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/adr/ADR-001-socle-applicatif.md)  
> **Contexte initial de test :** [`PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md)  
> **Sommaire général des tests :** [`tdd/docs/prompt/test/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/sommaire.md)  
> **Nombre de prompts :** **9 prompts** (100 % couverture du domaine)

---

## 1. Description du Périmètre

Gestion du cycle de vie du serveur HTTP local, détection de ports, cascades SIGINT/SIGTERM et résolution du workspace.

---

## 2. Table d'Indexation des Prompts (SRV)

| # | Cas de Test (CASE) | Exigence Spec | Fichier Test Cible | Prompt Unitaire Dédié | Méthode de Test Définie | Commande de Test Unitaire |
|:---:|:---|:---:|:---|:---|:---|:---|
| 01 | [`CASE-SRV-01-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-1.md) | `AC-SRV-01-1` | [`CASE-SRV-01-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-01-1.test.ts) | [`prompt-test-CASE-SRV-01-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-01-1.md) | `test_CASE_SRV_01_1_default_port_startup_on_974` | `node --test tests/srv/CASE-SRV-01-1.test.ts` |
| 02 | [`CASE-SRV-01-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-2.md) | `AC-SRV-01-2` | [`CASE-SRV-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-01-2.test.ts) | [`prompt-test-CASE-SRV-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-01-2.md) | `test_CASE_SRV_01_2_dynamic_port_override_via_cli_options` | `node --test tests/srv/CASE-SRV-01-2.test.ts` |
| 03 | [`CASE-SRV-01-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-3.md) | `AC-SRV-01-3` | [`CASE-SRV-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-01-3.test.ts) | [`prompt-test-CASE-SRV-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-01-3.md) | `test_CASE_SRV_01_3_immediate_exit_on_busy_or_invalid_port` | `node --test tests/srv/CASE-SRV-01-3.test.ts` |
| 04 | [`CASE-SRV-01-4`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-4.md) | `AC-SRV-01-4` | [`CASE-SRV-01-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-01-4.test.ts) | [`prompt-test-CASE-SRV-01-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-01-4.md) | `test_CASE_SRV_01_4_workspace_path_strict_resolution_from_cwd` | `node --test tests/srv/CASE-SRV-01-4.test.ts` |
| 05 | [`CASE-SRV-02-1`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-1.md) | `AC-SRV-02-1` | [`CASE-SRV-02-1.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-1.test.ts) | [`prompt-test-CASE-SRV-02-1.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-02-1.md) | `test_CASE_SRV_02_1_static_ui_files_distribution_on_http_root` | `node --test tests/srv/CASE-SRV-02-1.test.ts` |
| 06 | [`CASE-SRV-02-2`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-2.md) | `AC-SRV-02-2` | [`CASE-SRV-02-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-2.test.ts) | [`prompt-test-CASE-SRV-02-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-02-2.md) | `test_CASE_SRV_02_2_console_url_display_without_browser_auto_open` | `node --test tests/srv/CASE-SRV-02-2.test.ts` |
| 07 | [`CASE-SRV-02-3`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-3.md) | `AC-SRV-02-3` | [`CASE-SRV-02-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-3.test.ts) | [`prompt-test-CASE-SRV-02-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-02-3.md) | `test_CASE_SRV_02_3_graceful_http_server_shutdown_on_sigint_sigterm` | `node --test tests/srv/CASE-SRV-02-3.test.ts` |
| 08 | [`CASE-SRV-02-4`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-4.md) | `AC-SRV-02-4` | [`CASE-SRV-02-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-4.test.ts) | [`prompt-test-CASE-SRV-02-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-02-4.md) | `test_CASE_SRV_02_4_local_single_user_operation_without_auth_or_sandbox` | `node --test tests/srv/CASE-SRV-02-4.test.ts` |
| 09 | [`CASE-SRV-02-5`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-5.md) | `AC-SRV-02-5` | [`CASE-SRV-02-5.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-5.test.ts) | [`prompt-test-CASE-SRV-02-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/prompt-test-CASE-SRV-02-5.md) | `test_CASE_SRV_02_5_os_signal_cascades_to_cli_subprocess` | `node --test tests/srv/CASE-SRV-02-5.test.ts` |

---

## 3. Guide d'Exécution Locale

1. **Chargement du Contexte :** Injecter le fichier [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md) avant d'exécuter un prompt de ce lot.
2. **Exécution du Prompt :** Copier le contenu du fichier `prompt-test-CASE-*.md` concerné dans l'agent IA.
3. **Vérification :** Lancer la commande unitaire `node --test tests/srv/CASE-*.test.ts`.
