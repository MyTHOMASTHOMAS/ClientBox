# Prompt — écrire le code de CASE-SRV-02-2

> **Titre :** CASE-SRV-02-2 — Affichage console de l'URL d'accès sans ouverture automatique du navigateur  
> **Exigence / Critère d'acceptation :** AC-SRV-02-2 dans `tdd/specs/SRV.md`  
> **Cas de test associé :** [`CASE-SRV-02-2.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/tests/srv/CASE-SRV-02-2.md)  
> **Fichier de test unitaire cible :** [`CASE-SRV-02-2.test.ts`](file:///home/thomaz/Documents/project/AI/ClientsBox/tests/srv/CASE-SRV-02-2.test.ts)  
> **Méthode de test exacte :** `test_CASE_SRV_02_2_console_url_display_without_browser_auto_open`  
>
> Étape « test → code ». Le test est le contrat, l'agent produit le code sous `src/`.  
> Suit [`tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md`](file:///home/thomaz/Documents/project/AI/ClientsBox/tdd/docs/prompt/code/PROMPT_CONTEXTE_INITIAL_CODE.md).  
>
> **Prérequis :** le test `tests/srv/CASE-SRV-02-2.test.ts` doit exister et être rouge.  
>
> À injecter tel quel dans l'agent. Un prompt = une tâche = un test qui passe du rouge au vert.

```text
CONTEXTE
Stack : Node.js ≥ 24 / TypeScript (ESM NodeNext), runner natif node:test + node:assert/strict.
Commande de test globale : node --test tests/**/*.test.ts
Commande pour ce seul test : node --test tests/srv/CASE-SRV-02-2.test.ts
Commande d'audit d'architecture : conformité manuelle aux SPEC-ARCH applicables + consultation de out/arch-report.json / out/rapport-arch.md dès que l'outil SPEC-ARCH-09 est disponible (statut 🟢 CONFORME requis)

CE QUE JE TE DONNE
- Le test à faire passer : tests/srv/CASE-SRV-02-2.test.ts::test_CASE_SRV_02_2_console_url_display_without_browser_auto_open
- Le cas de test : tdd/tests/srv/CASE-SRV-02-2.md
- La spécification : tdd/specs/SRV.md, section SPEC-SRV-02 (AC-SRV-02-2)
- Les exigences d'architecture : tdd/specs/ARCH.md (SPEC-ARCH-01, SPEC-ARCH-03, SPEC-ARCH-05, SPEC-ARCH-07) et tdd/specs/sommaire.md
- Les signatures d'architecture : tdd/docs/signature/signature-src.md (ROOT-001 — affichage URL au boot, hors écriture directe de cette tâche), tdd/docs/signature/signature-lib.md
- Le modèle du domaine : tdd/docs/uml/domain.puml
- ADR de référence : tdd/docs/adr/ADR-001-socle-applicatif.md, tdd/docs/adr/ADR-006-strategie-et-harnais-de-test.md
- Les fichiers du domaine que tu peux créer / modifier :
  - src/lib/process/startup-console.ts

TA TÂCHE
1. Fais passer au vert le test test_CASE_SRV_02_2_console_url_display_without_browser_auto_open, et lui seul.
2. À la fin de la tâche, vérifie la conformité aux règles d'architecture listées, analyse tout rapport d'audit disponible sous out/, et applique les corrections nécessaires pour garantir 0 infraction sur le périmètre touché.

CONTRAINTES
1. Ne modifie aucun fichier sous tests/. Le test est le contrat absolu et intangible, pas une proposition. Si tu le crois faux, arrête-toi et dis-le-moi.
2. Ne le contourne pas : pas de skip, pas de xfail, pas de tolérance élargie, pas d'assertion neutralisée.
3. Implémente la règle prescrite par SPEC-SRV-02 / REQ-004 :
   - `formatServerAccessUrl(port)` retourne `http://localhost:<port>` (le port est un paramètre — 974 et 8080 sont des jeux d'essai du TU, pas des constantes exclusives).
   - `writeServerReadyMessage(port, write?)` écrit un message contenant cette URL via le callback `write` (ou stdout par défaut) — sans aucun appel à `xdg-open`, `open`, `explorer.exe`, `start`, ni tout spawn d'ouverture de navigateur.
4. La logique vit dans `src/lib/process/startup-console.ts` (seam Partie 63 POINT-005). Pas dans un contrôleur, pas dans UI, pas dans `src/domain/`. Ne modifie pas `src/index.ts` pour cette tâche.
5. Respecte le modèle du domaine documenté dans tdd/docs/uml/domain.puml. N'invente aucune entité absente. Si le test l'exige, arrête-toi et dis-le-moi.
6. N'implémente que ce que ce test exige. Ne traite pas la distribution statique (CASE-SRV-02-1), l'arrêt gracieux / cascade de signaux (CASE-SRV-02-3/02-5), ni l'auth. Les autres tests rouges restent rouges.
7. Respecte strictement tdd/specs/ARCH.md :
   - SPEC-ARCH-01 (DAG / étanchéité)
   - SPEC-ARCH-03 (effets de bord confinés à `src/lib/` — pas de spawn navigateur)
   - SPEC-ARCH-05 (volumétrie < 250 lignes, arités bornées)
   - SPEC-ARCH-07 (complexité < 10, nommage, TSDoc)
8. Ne modifie aucun fichier en dehors de la liste autorisée ci-dessus.
9. Aucune dépendance nouvelle — modules Node.js natifs uniquement.
10. Convention ESM NodeNext : imports relatifs `.js` ; typage strict sans `any`.

RENDS
- Le diff.
- La liste des fichiers créés ou modifiés sous src/.
- La commande exacte pour lancer ce seul test, et son résultat (🟢 VERT).
- Le résultat de la vérification d'audit / conformité ARCH sur le périmètre touché (🟢 CONFORME).
- Où vit la règle, en une ligne : fichier et fonctions (`formatServerAccessUrl`, `writeServerReadyMessage`).
- Ce que tu as dû supposer et qui n'était ni dans la spécification ni dans le test.
```
