# Sommaire des Cas de Test — Domaine UTILS (Palier 2 : Primitives Techniques)

> **Document de référence :** `tdd/tests/utils/sommaire.md`  
> **Source des spécifications :** [`tdd/docs/utils/logger-spec.md`](../../docs/utils/logger-spec.md) (`SPEC-UTILS-01`, `SPEC-UTILS-02`)  
> **Décisions d'architecture liées :** [`ADR-014`](../../docs/adr/ADR-014-catalogue-evenements-logger-et-separation-severite.md)  

---

## 1. Inventaire des Cas de Test

| Identifiant | Fiche de Cas | Test Unitaire Vitest | Description |
| :--- | :--- | :--- | :--- |
| **`CASE-UTILS-01-1`** | [`CASE-UTILS-01-1.md`](./CASE-UTILS-01-1.md) | `tests/units/utils/case-utils-01-1.test.ts` | Journalisation structurée isomorphique, niveaux, dérivation contextuelle et kill-switch `LOGS_DISABLED`. |
| **`CASE-UTILS-02-1`** | [`CASE-UTILS-02-1.md`](./CASE-UTILS-02-1.md) | `tests/units/utils/case-utils-02-1.test.ts` | Catalogue d'événements sémantiques et segmentation physique par sévérité (`errors/`, `info/`, `debug/`). |
| **`CASE-UTILS-03-1`** | [`CASE-UTILS-03-1.md`](./CASE-UTILS-03-1.md) | `tests/units/utils/case-utils-03-1.test.ts` | Opérations CRUD élémentaires et isolation multi-domaines du cache interne LRU. |
| **`CASE-UTILS-03-2`** | [`CASE-UTILS-03-2.md`](./CASE-UTILS-03-2.md) | `tests/units/utils/case-utils-03-2.test.ts` | Gestion de la rétention temporelle (TTL par domaine et surcharge) et politique d'éviction LRU. |
