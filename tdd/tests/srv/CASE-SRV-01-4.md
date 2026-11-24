# CASE-SRV-01-4 — Résolution stricte et assignation de workspacePath à partir du répertoire courant d'exécution process.cwd()

**Spécification :** `SPEC-SRV-01`
**Critère d'acceptation :** `AC-SRV-01-4`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le répertoire racine du projet de l'utilisateur (`workspacePath`) doit être résolu de façon stricte et déterministe à partir du répertoire courant d'exécution du processus (`process.cwd()`) lors du démarrage (`REQ-001`, `REQ-002`, `C-07`). Si le workspace était résolu relativement à l'emplacement du binaire (`__dirname` dans `.agents/`) ou s'il dépendait d'un chemin codé en dur, ClientsBox ciblerait le mauvais dossier hôte et manipulerait des données hors du projet de l'utilisateur.

## Cas

```gherkin
Étant donné un terminal ouvert dans le dossier "/home/dev/mon-projet-hote"
Quand l'utilisateur lance la commande "node .agents/clientsbox.js"
Alors le serveur initialise la variable de configuration "workspacePath"
Et la valeur de "workspacePath" est strictement égale à "/home/dev/mon-projet-hote"
Et tous les chemins relatifs des domaines DATA, ADPT et ENG sont ancrés sur cette racine

Étant donné un lancement depuis un sous-dossier "/home/dev/mon-projet-hote/packages/core"
Quand la commande est exécutée
Alors "workspacePath" vaut exactement "/home/dev/mon-projet-hote/packages/core"
```

## Données

| Élément | Valeur |
|---|---:|
| `process.cwd()` initial de test 1 | `/home/dev/mon-projet-hote` |
| `process.cwd()` initial de test 2 | `/home/dev/mon-projet-hote/packages/core` |
| Emplacement du binaire exécutable | `<workspacePath>/.agents/clientsbox.js` |
| Propriété de configuration exposée | `workspacePath` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Valeur de `workspacePath` | `process.cwd()` | Assignation directe sans altération de chemin (C-07) |
| Différenciation avec `__dirname` | `OUI` | `workspacePath` != répertoire interne de l'artefact `.agents/` |
| Immuabilité du workspace en runtime | `OUI` | Fixé au boot du serveur pour toute la durée de vie du processus |

## Ce que ce cas ne vérifie pas

- L'existence de l'arborescence `.agents/data/` sous le workspace → `SPEC-DATA-01` (`CASE-DATA-01-1`) ;
- Le passage du `workspacePath` à l'adapter de commande CLI → `SPEC-ADPT-01` (`CASE-ADPT-01-2`) ;
- Le choix et la validation du port d'écoute → `CASE-SRV-01-1` et `CASE-SRV-01-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_01_4_workspace_path_strict_resolution_from_cwd`
**Fichier :** `tests/tests-unitaires/srv/case-srv-01-4.test.ts`

## Revue du test automatisé

- [ ] Le test initialise le serveur sous un répertoire de travail spécifique via `process.cwd()`.
- [ ] Le test vérifie que le contexte applicatif serveur expose un `workspacePath` identique à `process.cwd()`.
- [ ] Le test assure l'isolation d'environnement : test sous répertoire temporaire sandboxé (`fs.mkdtempSync`) ou bloc `afterEach`/`finally` restaurant strictement le `process.cwd()` initial (ADR-006).
- [ ] Le test vérifie que `workspacePath` n'est pas confondu avec le répertoire de distribution du bundle.
- [ ] Le test vérifie la constance de `workspacePath` lors de l'exécution de requêtes.
- [ ] Le test échoue si `workspacePath` est forcé à une valeur arbitraire ou codée en dur.
- [ ] Le nom du test contient `CASE_SRV_01_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
