# Prompt — écrire le test de CASE-ARCH-09-5

> **Titre :** CASE-ARCH-09-5 — Bilan d'étanchéité du DAG et matrice de conformité des flux d'imports des 8 couches dans out/rapport-arch.md per signature.md §5  
> **Exigence / Critère d'acceptation :** AC-ARCH-09-5 dans `tdd/specs/ARCH.md`  
> **Cas de test associé :** [`CASE-ARCH-09-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/arch/CASE-ARCH-09-5.md)  
> **Fichier de test unitaire cible :** [`case-arch-09-5.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/arch/case-arch-09-5.test.ts)  
>
> Étape « cas de test $\rightarrow$ test ». Le cas de test est le contrat, l'agent produit le test TypeScript.  
> Suit [`tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/test/PROMPT_CONTEXTE_INITIAL_TEST.md).  
>
> **Prérequis :** Le cas [`tdd/tests/arch/CASE-ARCH-09-5.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/arch/CASE-ARCH-09-5.md) doit exister et faire foi.  
>
> À injecter tel quel dans l'agent. Un prompt = un test unitaire dédié.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), framework de test Vitest (vitest.config.ts).
Commande de test globale : npm test
Commande pour ce seul test : npx vitest run tests/arch/case-arch-09-5.test.ts
Emplacement des tests : tests/arch/
Fichier de test cible : tests/arch/case-arch-09-5.test.ts
Convention : bijection stricte 1-pour-1, un fichier .test.ts autonome par fiche CASE.

CE QUE JE TE DONNE
- Le cas de test : tdd/tests/arch/CASE-ARCH-09-5.md
- La spécification métier : tdd/specs/ARCH.md, section SPEC-ARCH-09 (AC-ARCH-09-5)
- Les exigences d'architecture : tdd/specs/ARCH.md et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature.md (matrice §5) et signatures de couches
- La stratégie d'isolation et mocks : tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md et ADR-007-framework-de-test-typescript.md
- Les helpers de test partagés : tests/helpers/temp-dir.ts, tests/helpers/flush-promises.ts, tests/helpers/mock-spawn.ts, tests/helpers/test-server.ts

TA TÂCHE
Écris UN test automatisé, et un seul, sous tests/arch/case-arch-09-5.test.ts, qui traduit fidèlement CASE-ARCH-09-5.

CONTRAINTES
1. Nom du test : exactement `test_CASE_ARCH_09_5_layer_isolation_dag_compliance_matrix` (écrit dans la section « Test automatisé » du fichier CASE). Ne le reformule pas.
2. Interdiction formelle d'écrire ou de modifier des fichiers sous src/. N'écris aucune règle métier, aucune signature et ne crée aucun fichier dans src/.
3. Déduis dans le test où sera le code cible sous src/ en t'appuyant strictement sur tdd/specs/ARCH.md et tdd/docs/signature/ pour les noms de modules, fonctions, classes et types. Utilise des imports relatifs TypeScript (ex: `../../src/...`).
4. Les valeurs sont celles de la section « Données » et des critères Gherkin de la fiche CASE. N'en invente aucune.
5. Les assertions correspondent exactement aux lignes « Alors » et « Et » du Gherkin : une assertion par ligne, aucune de plus ni de moins.
6. Ne modifie aucun fichier en dehors de :
   - tests/arch/case-arch-09-5.test.ts
7. Typage strict TypeScript sans aucun `any`.
8. Respecte scrupuleusement les règles d'isolation et d'encadrement ADR-006 / ADR-007 (test déterministe sous Vitest).

RENDS
- Le code TypeScript complet du fichier tests/arch/case-arch-09-5.test.ts.
- La liste des fichiers créés ou modifiés.
- La commande exacte pour lancer ce seul test.
- L'emplacement et l'interface déduits pour le futur code sous src/.
- Ce que tu as dû supposer et qui n'était pas dans ce que je t'ai donné.
```
