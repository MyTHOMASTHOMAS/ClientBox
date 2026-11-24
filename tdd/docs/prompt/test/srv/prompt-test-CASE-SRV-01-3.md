# Prompt — écrire le test de CASE-SRV-01-3

> **Titre :** CASE-SRV-01-3 — Arrêt immédiat avec code de sortie non nul en cas de port déjà occupé ou invalide  
> **Exigence / Critère d'acceptation :** AC-SRV-01-3 dans `tdd/specs/SRV.md`  
> **Cas de test associé :** [`CASE-SRV-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-3.md)  
> **Fichier de test unitaire cible :** [`CASE-SRV-01-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-01-3.test.ts)  
>
> Étape « cas de test $\rightarrow$ test ». Le cas de test est le contrat, l'agent produit le test TypeScript.  
> Suit [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md).  
>
> **Prérequis :** Le cas [`tdd/tests/srv/CASE-SRV-01-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-3.md) doit exister et faire foi.  
>
> À injecter tel quel dans l'agent. Un prompt = un test unitaire dédié.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : npm test
Commande pour ce seul test : node --test tests/srv/CASE-SRV-01-3.test.ts
Emplacement des tests : tests/srv/
Fichier de test cible : tests/srv/CASE-SRV-01-3.test.ts
Convention : bijection stricte 1-pour-1, un fichier .test.ts autonome par fiche CASE.

CE QUE JE TE DONNE
- Le cas de test : tdd/tests/srv/CASE-SRV-01-3.md
- La spécification métier : tdd/specs/SRV.md, section SPEC-SRV-01 (AC-SRV-01-3)
- Les exigences d'architecture : tdd/specs/ARCH.md et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-controllers.md, tdd/docs/signature/signature-lib.md
- La stratégie d'isolation et mocks : tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les helpers de test partagés : tests/helpers/test-server.ts, tests/helpers/flush-promises.ts, tests/helpers/mock-spawn.ts, tests/helpers/temp-dir.ts

TA TÂCHE
Écris UN test automatisé, et un seul, sous tests/srv/CASE-SRV-01-3.test.ts, qui traduit fidèlement CASE-SRV-01-3.

CONTRAINTES
1. Nom du test : exactement `test_CASE_SRV_01_3_immediate_exit_on_busy_or_invalid_port` (écrit dans la section « Test automatisé » du fichier CASE). Ne le reformule pas.
2. Interdiction formelle d'écrire ou de modifier des fichiers sous src/. N'écris aucune règle métier, aucune signature et ne crée aucun fichier dans src/.
3. Déduis dans le test où sera le code cible sous src/ en t'appuyant strictement sur tdd/specs/ARCH.md et tdd/docs/signature/ pour les noms de modules, fonctions, classes et types. Utilise des imports relatifs ESM avec extension `.js` (ex: `../../src/...`).
4. Les valeurs sont celles de la section « Données » et des critères Gherkin de la fiche CASE. N'en invente aucune.
5. Les assertions correspondent exactement aux lignes « Alors » et « Et » du Gherkin : une assertion par ligne, aucune de plus ni de moins.
6. Ne modifie aucun fichier en dehors de :
   - tests/srv/CASE-SRV-01-3.test.ts
7. Typage strict TypeScript sans aucun `any`.
8. Respecte scrupuleusement les règles d'isolation et d'encadrement ADR-006 (try/finally pour tout mock ou FakeTimer, restauration inconditionnelle de l'état).

RENDS
- Le code TypeScript complet du fichier tests/srv/CASE-SRV-01-3.test.ts.
- La liste des fichiers créés ou modifiés.
- La commande exacte pour lancer ce seul test.
- L'emplacement et l'interface déduits pour le futur code sous src/.
- Ce que tu as dû supposer et qui n'était pas dans ce que je t'ai donné.
```
