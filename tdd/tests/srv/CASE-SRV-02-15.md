# CASE-SRV-02-15 — Atomicité et intégrité face à des requêtes PUT concurrentes sur la même ressource

**Spécification :** `SPEC-SRV-02`, `SPEC-DATA-04`  
**Critère d'acceptation :** `AC-SRV-02-2`, `AC-DATA-04-1`  
**Type :** acceptation / intégration  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-005`  

---

## Ce que ce cas protège

Le contrôleur de ressources HTTP (`CTL-001 resource.controller.ts`) et le service de stockage (`SVC-002 resource-store.service.ts`) s'appuient sur le module d'écriture atomique (`LIB-001 json-atomic-writer.fs.ts`) pour persister les entités sous `.agents/data/`. Lorsque deux requêtes HTTP `PUT` concurrentes sont émises quasi-simultanément sur le même identifiant de ressource (par exemple deux modifications simultanées du même scénario `PUT /api/scenarios/sc-concurrence`), ce cas garantit :
1. Qu'aucun entrelacement d'écritures ne corrompt le fichier sur le disque (zéro fichier JSON hybride ou tronqué).
2. Que chaque écriture s'exécute de façon atomique via un fichier temporaire distinct (`.tmp`) suivi d'un renommage atomique du système de fichiers (`fs.rename`).
3. Qu'à l'issue des deux requêtes, le fichier JSON présent sur le disque est syntaxiquement valide et correspond intégralement à l'un des deux états soumis, avec des réponses HTTP valides renvoyées aux clients.

---

## Cas

```gherkin
Étant donné une ressource scénario existante "sc-concurrence" initialisée sur le disque
Et deux requêtes HTTP "PUT /api/scenarios/sc-concurrence" préparées en parallèle :
  | Requête | Nom soumis                | Nombre de nœuds |
  | Req-A   | "Scénario Version Alpha"  | 2 nœuds         |
  | Req-B   | "Scénario Version Bêta"   | 3 nœuds         |
Quand les deux requêtes HTTP PUT sont déclenchées simultanément ("Promise.all")
Alors les deux requêtes obtiennent une réponse HTTP valide (codes 200 OK ou 204)
Et le fichier ".agents/data/scenarios/sc-concurrence.json" sur le disque est un document JSON 100% valide
Et le contenu correspond intégralement à Req-A ou à Req-B (état cohérent du dernier gagnant)
Et aucun résidu de fichier temporaire ".tmp" ne subsiste dans le répertoire
```

---

## Données

| Élément | Valeur |
|---|---:|
| Ressource testée | `sc-concurrence` (scénario) |
| Charge Req-A | `{ "id": "sc-concurrence", "name": "Version Alpha", "nodes": [n1, n2], "connections": [] }` |
| Charge Req-B | `{ "id": "sc-concurrence", "name": "Version Bêta", "nodes": [n1, n2, n3], "connections": [c1] }` |
| Mécanisme de sécurité | Écriture atomique via `json-atomic-writer.fs.ts` (`writeAtomic`) |
| Fichier temporaire | Préfixe ou extension temporaire nettoyée |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Validité JSON post-course | 100% parseable sans erreur | Atomicité de `fs.rename` au niveau de l'OS |
| Cohérence des données | Égale à Req-A ou Req-B | Aucun entrelacement de fragments d'octets |
| Nettoyage disques | 0 fichier orphelin `.tmp` | Nettoyage systématique garanti |

---

## Ce que ce cas ne vérifie pas

- Le verrouillage d'exécution concurrente de runner (409 sur /run) → `CASE-SRV-02-11` ;
- La corruption préexistante de fichier sur le disque → `CASE-DATA-04-4`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_15_concurrent_put_requests_atomicity`  
**Fichier :** `tests/units/srv/case-srv-02-15.test.ts`  

## Revue du test automatisé

- [ ] Le test prépare deux charges distinctes pour une même ressource.
- [ ] Le test émet les deux requêtes HTTP PUT simultanément via `Promise.all`.
- [ ] Le test valide les statuts HTTP de réponse.
- [ ] Le test relit le fichier disque et certifie sa validité syntaxique JSON intégrale.
- [ ] Le nom du test contient `CASE_SRV_02_15`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
