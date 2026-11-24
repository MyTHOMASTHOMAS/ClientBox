# CASE-DATA-01-6 — ABROGÉ (CR-012)

**Statut :** **abrogé** — 20/11/2026  
**Remplacé par :** rien (comportement matchers retiré) ; assemblage `exit` → `CASE-ENG-04-1` / `CASE-ENG-04-13`  
**Référence :** [`CR-004`](../../docs/cr/CR-004.md), [`impact-CR-012`](../../docs/impact/impact-CR-012-retablissement-prompt-exit.md), CDC v2.3 `R-07`

## Motif d'abrogation

Ce cas spécifiait `DOM-009` / `evaluateExitMatchers` (matchers `substring` / `regex` sur le flux CLI).  
Ce mécanisme d'arrêt anticipé est contraire à `R-07` et a été abrogé : une ressource `exit` est un prompt d'ordre de sortie `{ id, name, content }` additionné au prompt du `Run`, sans surveillance de `stdout`/`stderr`.

Le fichier de test unitaire associé (`tests/units/data/CASE-DATA-01-6.test.ts`) doit être **supprimé** lors de la phase Tests / Code (ROUGE → VERT).
