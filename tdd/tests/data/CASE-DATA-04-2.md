# CASE-DATA-04-2 — Relecture du système de fichiers comme unique source de vérité sans masquage des modifications manuelles

**Spécification :** `SPEC-DATA-04`
**Critère d'acceptation :** `AC-DATA-04-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le système ne doit jamais maintenir un cache persistant opaque : à chaque opération de lecture, la donnée est lue directement depuis le disque (`REQ-104`, `R-36`, `C-03`). Si un cache interposé masque les modifications manuelles (édition directe du fichier JSON), l'utilisateur reçoit une vue obsolète de ses données, brisant la promesse d'interopérabilité avec Git et les éditeurs externes.

## Cas

```gherkin
Étant donné un fichier ".agents/data/prompts/p-dev.json" contenant :
  { "id": "p-dev", "content": "Analyse le code" }
Et le serveur a déjà chargé ce prompt en mémoire lors d'une requête précédente
Quand l'utilisateur modifie directement le fichier sur le disque en changeant "content" en "Optimise le code"
Et que l'UI sollicite ce prompt via une nouvelle requête
Alors le contenu retourné par le serveur est "Optimise le code"
Et non la version précédemment mise en mémoire "Analyse le code"

Étant donné un agent ".agents/data/agents/agent-dev.json" présent sur le disque
Quand l'utilisateur supprime manuellement le fichier depuis l'explorateur de fichiers
Et que l'UI tente de charger l'agent "agent-dev"
Alors le système retourne une erreur indiquant que la ressource n'existe plus sur le disque
Et aucune donnée obsolète n'est retournée depuis un cache

Étant donné un répertoire ".agents/data/agents/" dans lequel l'utilisateur ajoute manuellement "agent-nouveau.json"
Quand l'UI liste les agents disponibles
Alors "agent-nouveau" apparaît dans la liste sans nécessiter de redémarrage du serveur
```

## Données

| Élément | Valeur |
|---|---:|
| Fichier prompt | `.agents/data/prompts/p-dev.json` |
| Contenu initial | `"Analyse le code"` |
| Contenu modifié manuellement | `"Optimise le code"` |
| Agent supprimé manuellement | `agent-dev.json` |
| Agent ajouté manuellement | `agent-nouveau.json` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Contenu retourné après modification manuelle | `"Optimise le code"` | Relecture disque sans cache |
| Retour pour ressource supprimée manuellement | Erreur `NOT_FOUND` | Disque = source de vérité |
| Présence nouvelle ressource ajoutée manuellement | `OUI` dans la liste | Scan disque à la demande |

## Ce que ce cas ne vérifie pas

- L'écriture synchrone lors d'une modification via l'UI → `CASE-DATA-04-1` ;
- L'absence de logs sous `data/` → `CASE-DATA-04-3` ;
- La surveillance en temps réel via watcher (`fs.watch`) → optionnel v1, hors périmètre AC minimal.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_04_2_disk_as_single_source_of_truth`
**Fichier :** `tests/tests-unitaires/data/case-data-04-2.test.ts`

## Revue du test automatisé

- [ ] Le test charge une ressource, modifie le fichier disque directement, recharge et vérifie la nouvelle valeur.
- [ ] Le test charge une ressource, supprime le fichier disque, recharge et vérifie l'erreur `NOT_FOUND`.
- [ ] Le test ajoute un fichier disque manuellement et vérifie sa présence dans le listing.
- [ ] Le test échoue si le serveur utilise un cache persistant qui masque les modifications disque.
- [ ] Le nom du test contient `CASE_DATA_04_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
