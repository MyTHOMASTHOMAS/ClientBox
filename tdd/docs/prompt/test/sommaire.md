# Sommaire des Prompts de Test — Kit TDD ClientsBox

> **Emplacement :** `tdd/docs/prompt/test/sommaire.md`  
> **Rôle :** Sommaire maître (Sommaire des Sommaires) redirigeant vers les sommaires de prompts de test par domaine fonctionnel.  
> **Couverture globale :** **93 prompts de tests unitaires** répartis en **6 sous-sommaires de domaine**.  
> **Contexte initial pour les tests :** [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md).

---

## Répertoire des Sous-Sommaires par Domaine

| Domaine | Intitulé & Description | Sous-Sommaire Dédié | Nb Prompts | Statut |
|:---:|---|:---:|:---:|:---:|
| **ARCH** | **Architecture Technique, DAG, Qualité & Audit**<br>Acyclicité DAG, pureté types, étanchéité contrôleurs/UI, zéro-I/O domaine, volumétrie, inférence, TSDoc, 58 modules signés, reporting out/ | [`arch/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/arch/sommaire.md) | 36 | PRÊT |
| **SRV** | **Serveur Local, Port & Signaux OS**<br>Cycle de vie serveur HTTP, détection de port (2974), cascades SIGINT/SIGTERM, résolution workspace | [`srv/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/srv/sommaire.md) | 9 | PRÊT |
| **DATA** | **Persistance, Schémas, If-Scripts & Graphe**<br>Schémas JSON (agents, profils, prompts, exit, scenarios), if-scripts, DAG, intégrité disque | [`data/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/data/sommaire.md) | 16 | PRÊT |
| **ADPT** | **Adaptateurs CLI, Isolation & Streaming**<br>Contrat cursor-cli, streaming unifié, exécution contextuelle, isolation des sous-processus | [`adpt/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/adpt/sommaire.md) | 9 | PRÊT |
| **ENG** | **Moteur de Scénarios, Blocs & Join**<br>Orchestration des blocs (START, RUN, IF, CLEAR_CONTEXT), gestion pause/reprise, synchronisation JOIN | [`eng/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/eng/sommaire.md) | 12 | PRÊT |
| **UI** | **Interface Web, Canvas, Terminal & Commandes**<br>Interface 100% français, canvas nodal orienté, terminal live streaming, arrêts d'urgence | [`ui/sommaire.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/ui/sommaire.md) | 11 | PRÊT |
| **TOTAL** | **Ensemble des 6 domaines fonctionnels et techniques ClientsBox** | **6 Sous-Sommaires Dédiés** | **93** | **100 % COUVERT** |

---

## Guide d'Utilisation

1. **Accéder à un Domaine :** Cliquez sur le lien du sous-sommaire correspondant dans le tableau ci-dessus pour accéder à la liste exhaustive des prompts unitaires, des méthodes de tests et des commandes de test associées.
2. **Consigne Système Commune :** Avant d'injecter un prompt unitaire dans un agent de test, transmettre systématiquement la consigne système maître [\`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md\`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md).
