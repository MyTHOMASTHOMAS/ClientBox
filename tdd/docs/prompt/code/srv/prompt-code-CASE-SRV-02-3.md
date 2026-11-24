# Prompt — écrire le code de CASE-SRV-02-3

> **Titre :** CASE-SRV-02-3 — Arrêt gracieux du serveur HTTP sur SIGINT / SIGTERM avec libération du port  
> **Exigence / Critère d'acceptation :** AC-SRV-02-3 dans `tdd/specs/SRV.md`  
> **Cas de test associé :** [`CASE-SRV-02-3.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-3.md)  
> **Fichier de test unitaire cible :** [`CASE-SRV-02-3.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-3.test.ts)  
> **Méthode de test exacte :** `test_CASE_SRV_02_3_graceful_http_server_shutdown_on_sigint_sigterm`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/srv/CASE-SRV-02-3.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/srv/CASE-SRV-02-3.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/srv/CASE-SRV-02-3.test.ts::test_CASE_SRV_02_3_graceful_http_server_shutdown_on_sigint_sigterm
- Le cas de test : tdd/tests/srv/CASE-SRV-02-3.md
- La spécification : tdd/specs/SRV.md, section SPEC-SRV-02 (AC-SRV-02-3)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-007, LIB-008, LIB-010), tdd/docs/signature/signature-types.md (TYPES-011), tdd/docs/signature/signature-src.md (ROOT-001 — enregistrement signaux OS au boot, hors écriture directe de cette tâche)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-001-socle-applicatif.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/process/graceful-shutdown.ts
  - src/lib/http/http-server.ts
  - src/lib/http/router.ts
  - src/lib/http/static-handler.ts
  - src/types/contracts/http-router.contract.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_SRV_02_3_graceful_http_server_shutdown_on_sigint_sigterm, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-SRV-02 / AC-SRV-02-3 :
   - `registerGracefulShutdown({ closeHttpServer, exit, stopActiveRunners? })` enregistre le traitement de `SIGINT` et `SIGTERM`.
   - Sur `emit('SIGINT')` ou `emit('SIGTERM')` (API de test de la seam) : appeler `closeHttpServer()`, puis `exit(0)` — le port TCP doit être libéré (re-bind immédiat possible).
   - Fournir `dispose()` pour désenregistrer les handlers (isolation ADR-006).
4. La seam vit dans `src/lib/process/graceful-shutdown.ts` (Partie 63 POINT-005). Le bind HTTP reste dans LIB-010. Pas dans `src/domain/`, pas de logique métier. Ne modifie pas `src/index.ts` pour cette tâche (ROOT-001 câblera plus tard).
5. Respecte le modèle du domaine documenté dans tdd/docs/uml/domain.puml. N'invente aucune entité absente. Si le test l'exige, arrête-toi et dis-le-moi.
6. N'implémente que ce que ce test exige. Ne traite pas l'absence d'auth (CASE-SRV-02-4) ni la cascade vers sous-processus CLI (CASE-SRV-02-5 — `stopActiveRunners` peut rester optionnel/noop ici). Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG / étanchéité)
   - SPEC-ARCH-03 (I/O / handlers de signaux : seam testable en `lib/` ; ROOT-001 reste le Composition Root pour `process.on` en production)
   - SPEC-ARCH-05 (volumétrie < 250 lignes, arités bornées)
   - SPEC-ARCH-07 (complexité < 10, nommage, TSDoc)
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle — modules Node.js natifs uniquement.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.
11. Le port 9783 du TU est un jeu d'essai d'isolation — ne le code pas comme port par défaut applicatif.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : fichier et fonction (`registerGracefulShutdown` + `close()` LIB-010).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
