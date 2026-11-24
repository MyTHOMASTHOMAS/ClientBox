# CASE-UI-03-6 — *(Retiré)* Validation E2E du bouton « Effacer le contexte »

**Statut :** retiré le 2026-11-03  
**Spécification :** `SPEC-UI-03` v1.4  

Le bouton de réinitialisation manuelle du contexte a été supprimé de l'IHM : la mémoire d'un agent est spécifique à une exécution de scénario et ne s'efface que par un bloc ClearContext (`SPEC-ADPT-03`). Ce cas n'a plus d'objet.

- L'absence du bouton est protégée par `CASE-UI-03-3`.
- Le renouvellement de session par ClearContext est protégé par `CASE-ENG-03-4` et `CASE-ADPT-03-2`.
- Le test `tests/e2e/ui/CASE-UI-03-6.e2e.test.ts` doit être supprimé.
