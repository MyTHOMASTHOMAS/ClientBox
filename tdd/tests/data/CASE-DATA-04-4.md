# CASE-DATA-04-4 — Gestion et rejet robuste d'un fichier JSON corrompu ou tronqué sous .agents/data/

**Spécification :** `SPEC-DATA-04`, `SPEC-DATA-02`  
**Critère d'acceptation :** `AC-DATA-04-1`, `AC-DATA-02-1`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-003`, `ADR-004`  

---

## Ce que ce cas protège

Les modules de lecture `FreshReader` (`LIB-002 json-fresh-reader.fs.ts`) et `ResourceStoreService` (`SVC-002 resource-store.service.ts`) accèdent directement aux entités persistées sous `.agents/data/` (agents, profils, scénarios, prompts, exit). Si un fichier JSON sur le disque est tronqué, incomplet ou syntaxiquement invalide (suite à une coupure d'alimentation, une édition manuelle erronée ou un crash externe), ce cas garantit :
1. Que la tentative de parsing JSON n'entraîne aucun crash fatal du processus Node.js (`uncaughtException`).
2. Qu'une erreur explicite rédigée en français (`"Fichier de données corrompu ou illisible : ..."` ou équivalent) est produite ou levée.
3. Que l'état mémoire du magasin de ressources reste intègre et que les autres entités valides demeurent parfaitement accessibles.

---

## Cas

```gherkin
Étant donné un fichier sur le disque ".agents/data/agents/corrupted-agent.json" contenant un JSON tronqué :
  """
  { "id": "corrupted-agent", "name": "Agent Casse", "profileId": "p-1
  """
Quand "resourceStore.getAgent('corrupted-agent')" ou "readFreshJson()" est appelé
Alors la méthode rejette la promesse ou lève une exception contrôlée
Et le message d'erreur est rédigé en langue française et mentionne l'anomalie de lecture ou de syntaxe
Et le processus serveur Node.js ne subit aucun arrêt inopiné (uncaughtException = 0)

Étant donné un fichier vide de 0 octet ".agents/data/profiles/empty-profile.json"
Quand "resourceStore.getProfile('empty-profile')" est appelé
Alors l'erreur de désérialisation est interceptée proprement
Et les autres profils sains du répertoire continuent d'être listés et chargés sans dégradation
```

---

## Données

| Élément | Valeur |
|---|---:|
| Fichier corrompu testé | `.agents/data/agents/corrupted-agent.json` |
| Contenu fichier corrompu | `{"id": "corrupted-agent", "name": "Agent Casse", "profileId": "p-1` (syntaxe invalide) |
| Fichier vide testé | `.agents/data/profiles/empty-profile.json` (taille: 0 octet) |
| Message d'erreur attendu | Contient `"corrompu"`, `"invalide"` ou `"illisible"` en français |
| Robustesse processus | `process.exit` n'est pas appelé ; pas de crash global |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut d'erreur | Exception ou rejet contrôlé | `SyntaxError` capturé et transformé en erreur applicative |
| Diagnostic en français | Présent dans `error.message` | Conformité REQ-007 |
| Intégrité du magasin | Liste des entités saines inchangée | Isolation stricte de la ressource défaillante |

---

## Ce que ce cas ne vérifie pas

- L'écriture atomique sur disque en cas de succès → `CASE-DATA-04-1` ;
- Le verrouillage concurrentiel lors de deux écritures → `CASE-SRV-02-15` ;
- La validation des champs requis d'un JSON bien formé → `CASE-DATA-01-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_DATA_04_4_corrupted_truncated_json_file_resilience`  
**Fichier :** `tests/units/data/case-data-04-4.test.ts`  

## Revue du test automatisé

- [ ] Le test crée un fichier JSON tronqué et un fichier vide sous `.agents/data/`.
- [ ] Le test tente de charger ces ressources via `ResourceStoreService` / `FreshReader`.
- [ ] Le test vérifie que l'erreur levée est descriptive et rédigée en français.
- [ ] Le test vérifie que les autres ressources valides restent lisibles sans altération.
- [ ] Le nom du test contient `CASE_DATA_04_4`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
