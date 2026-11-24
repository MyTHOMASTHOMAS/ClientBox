# Prompt — écrire le code de CASE-SRV-01-2

> **Titre :** CASE-SRV-01-2 — Surcharge dynamique du port d'écoute via les options CLI `-p` et `--port`  
> **Exigence / Critère d'acceptation :** AC-SRV-01-2 dans `tdd/specs/SRV.md`  
> **Cas de test associé :** [`CASE-SRV-01-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-01-2.md)  
> **Fichier de test unitaire cible :** [`CASE-SRV-01-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-01-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_SRV_01_2_dynamic_port_override_via_cli_options`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/srv/CASE-SRV-01-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/srv/CASE-SRV-01-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/srv/CASE-SRV-01-2.test.ts::test_CASE_SRV_01_2_dynamic_port_override_via_cli_options
- Le cas de test : tdd/tests/srv/CASE-SRV-01-2.md
- La spécification : tdd/specs/SRV.md, section SPEC-SRV-01 (AC-SRV-01-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-lib.md (LIB-007, LIB-008, LIB-010), tdd/docs/signature/signature-types.md (TYPES-011), tdd/docs/signature/signature-src.md (ROOT-001 — hors périmètre d'écriture de cette tâche)
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-001-socle-applicatif.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/process/cli-args.ts
  - src/lib/http/http-server.ts
  - src/lib/http/router.ts
  - src/lib/http/static-handler.ts
  - src/types/contracts/http-router.contract.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_SRV_01_2_dynamic_port_override_via_cli_options, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle de parsing CLI prescrite par SPEC-SRV-01 / REQ-005 / REQ-006 : prise en charge de `-p <port>`, `--port <port>` et `--port=<port>`, avec priorité de la surcharge sur le défaut 974. Les valeurs d'exemple du cas (8080, 3000, 4200) ne doivent pas être codées en dur comme seules valeurs acceptées — ce sont des jeux d'essai ; le parseur doit accepter tout entier de port valide fourni.
4. La logique de parsing CLI et de bind HTTP vit dans `src/lib/` (`parseServerCliArgs` dans `cli-args.ts`, `createLocalHttpServer` dans `http-server.ts`). Pas dans un contrôleur, pas dans un écran UI, pas dans `src/domain/`.
5. Respecte le modèle du domaine documenté dans tdd/docs/uml/domain.puml : mêmes classes, mêmes attributs, mêmes relations, même vocabulaire. N'invente aucune entité ni relation absente du diagramme. Si le test l'exige, arrête-toi et dis-le-moi plutôt que de t'en écarter.
6. N'implémente que ce que ce test exige. Ne traite pas les autres cas (port invalide / EADDRINUSE → CASE-SRV-01-3, workspacePath → CASE-SRV-01-4, UI statique → CASE-SRV-02-*). Les autres tests rouges restent rouges.
7. Respecte strictement les spécifications de tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG / étanchéité des couches — `lib/` n'importe pas `controllers/` ni `services/`)
   - SPEC-ARCH-03 (I/O Node confinée à `src/lib/`)
   - SPEC-ARCH-05 (volumétrie fichiers < 250 lignes, arités bornées)
   - SPEC-ARCH-07 (complexité cyclomatique < 10, nommage kebab-case / camelCase, TSDoc)
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle — modules Node.js natifs uniquement.
10. Convention ESM NodeNext : imports relatifs avec extension `.js` ; typage strict sans aucun `any`.
11. Écoute exclusivement sur localhost (`127.0.0.1`) conformément à SPEC-SRV-02 / LIB-010.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : fichier et fonction (parsing des trois formes d'options + bind sur le port surchargé).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```