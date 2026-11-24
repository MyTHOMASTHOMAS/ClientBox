# CASE-DATA-02-4 — Lecture fraîche et résolution sécurisée des scripts If par ResourceStoreService

**Spécification :** `SPEC-DATA-02`, `SPEC-DATA-04`  
**Critère d'acceptation :** `AC-DATA-02-1`, `AC-DATA-04-2`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-005`  

---

## Ce que ce cas protège

Le service de stockage (`SVC-002 resource-store.service.ts`) doit fournir les méthodes `readIfScript(id: string): string` et `resolveIfScriptPath(id: string): string`. Ce cas garantit que la lecture textuelle est toujours fraîchement rechargée depuis le disque sans cache mémoire périmé (`json-fresh-reader.fs.ts`, `SPEC-DATA-04`), et que la résolution de chemin interdit strictement l'évasion hors du dossier autorisé `.agents/data/if/` en levant une exception explicite en français.

---

## Cas

```gherkin
Étant donné un fichier de script ".agents/data/if/predicate.js" contenant "return sac['0'] > 10;"
Quand "resourceStore.readIfScript('predicate')" est invoqué
Alors le contenu textuel exact du fichier est retourné sous forme de chaîne de caractères

Étant donné que le fichier sur disque est modifié manuellement par un éditeur externe
Quand "resourceStore.readIfScript('predicate')" est invoqué à nouveau
Alors le nouveau contenu est immédiatement retourné sans effet de cache mémoire

Étant donné un identifiant frauduleux contenant des caractères de traversée "predicate/../../../etc/passwd"
Quand "resourceStore.resolveIfScriptPath('predicate/../../../etc/passwd')" est invoqué
Alors le service lève une erreur explicite en français "Chemin de script non autorisé."
```

---

## Données

| Élément | Valeur |
|---|---:|
| Dossier canonique des scripts If | `<workspacePath>/.agents/data/if/` |
| Méthode de lecture | `ResourceStoreService.readIfScript(id)` |
| Méthode de résolution | `ResourceStoreService.resolveIfScriptPath(id)` |
| Exception attendue sur traversal | `Error: "Chemin de script non autorisé."` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fraîcheur de lecture | Immédiate | Consommation directe de fresh-reader sans buffer |
| Confinement de chemin | Strictement sous `.agents/data/if/` | Vérification `path.resolve` préfixé par le répertoire autorisé |

---

## Ce que ce cas ne vérifie pas

- L'évaluation du script par le moteur d'exécution → `CASE-DATA-02-2` ;
- Le contrôleur HTTP REST → `CASE-SRV-02-9`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_02_4_resource_store_read_if_script_secure`  
**Fichier :** `tests/units/data/case-data-02-4.test.ts`  

## Revue du test automatisé

- [ ] Le test lit un script If existant et vérifie son contenu.
- [ ] Le test vérifie la fraîcheur après modification disque.
- [ ] Le test vérifie le rejet des identifiants avec traversée de répertoire.
- [ ] Le nom du test contient `CASE_DATA_02_4`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
