# Prompt — écrire le code de CASE-SRV-02-4

> **Titre :** CASE-SRV-02-4 — Fonctionnement local mono-utilisateur sans authentification ni sandbox  
> **Exigence / Critère d'acceptation :** AC-SRV-02-4 dans `tdd/specs/SRV.md`  
> **Cas de test associé :** [`CASE-SRV-02-4.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-4.md)  
> **Fichier de test unitaire cible :** [`CASE-SRV-02-4.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-4.test.ts)  
> **Méthode de test exacte :** `test_CASE_SRV_02_4_local_single_user_operation_without_auth_or_sandbox`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/srv/CASE-SRV-02-4.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/srv/CASE-SRV-02-4.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/srv/CASE-SRV-02-4.test.ts::test_CASE_SRV_02_4_local_single_user_operation_without_auth_or_sandbox
- Le cas de test : tdd/tests/srv/CASE-SRV-02-4.md
- La spécification : tdd/specs/SRV.md, section SPEC-SRV-02 (AC-SRV-02-4)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-007, LIB-008, LIB-010), tdd/docs/signature/signature-types.md (TYPES-011), tdd/docs/signature/signature-src.md (ROOT-001 — hors écriture de cette tâche)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-001-socle-applicatif.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/http/http-server.ts
  - src/lib/http/router.ts
  - src/lib/http/static-handler.ts
  - src/types/contracts/http-router.contract.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_SRV_02_4_local_single_user_operation_without_auth_or_sandbox, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-SRV-02 / AC-SRV-02-4 / C-11 / REQ-106 / ADR-001 :
   - Les routes locales testées (`GET /`, `GET /api/health`) répondent **200** sans credentials (pas d'`Authorization`, pas de cookie).
   - Aucun code **401** ni **403** ; aucune redirection `Location` vers une page de login.
   - N'introduis aucun middleware d'authentification, JWT, session cookie, ni sandbox bloquante sur ces routes.
4. La logique de transport HTTP vit dans `src/lib/http/` (LIB-007/008/010). Pas dans un écran UI d'auth, pas dans `src/domain/`.
5. Respecte le modèle du domaine documenté dans tdd/docs/uml/domain.puml. N'invente aucune entité absente. Si le test l'exige, arrête-toi et dis-le-moi.
6. N'implémente que ce que ce test exige. Ne traite pas les signaux OS (CASE-SRV-02-3/02-5) ni l'affichage console URL. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG / étanchéité)
   - SPEC-ARCH-03 (I/O Node confinée à `src/lib/`)
   - SPEC-ARCH-05 (volumétrie < 250 lignes, arités bornées)
   - SPEC-ARCH-07 (complexité < 10, nommage, TSDoc)
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle — modules Node.js natifs uniquement.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.
11. Écoute exclusivement sur localhost (`127.0.0.1`). Le port 9784 du TU est un jeu d'essai — ne le code pas comme défaut applicatif.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : absence volontaire de middleware auth (fichier/couche HTTP).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
