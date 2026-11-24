# CASE-SRV-01-1 — Démarrage du serveur sur le port par défaut 2974 en l'absence d'argument de port

**Spécification :** `SPEC-SRV-01`
**Critère d'acceptation :** `AC-SRV-01-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le lancement en ligne de commande de ClientsBox sans option de port doit obligatoirement lier l'écoute HTTP locale sur le port par défaut standard `2974` (`REQ-005`, `REQ-006`, `C-04`). Si ce port par défaut n'était pas respecté ou si une valeur non conforme était utilisée, l'utilisateur et les scripts externes ne pourraient pas accéder de manière prévisible à l'interface sur `http://localhost:2974`.

## Cas

```gherkin
Étant donné un terminal ouvert dans le répertoire de travail "/workspace/projet-test"
Et le port TCP 2974 est libre sur l'interface locale (localhost)
Quand l'utilisateur lance la commande "node .agents/clientsbox.js" sans argument de port
Alors le serveur HTTP démarre avec succès
Et l'écoute réseau TCP est active sur "http://localhost:2974"
Et le port effectif d'écoute rapporté par l'instance serveur est 2974
```

## Données

| Élément | Valeur |
|---|---:|
| Port par défaut | `2974` |
| Hôte local | `localhost` (`127.0.0.1`) |
| Arguments CLI fournis | `[]` (aucun argument de port) |
| Statut du port au démarrage | `LIBRE` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Numéro de port d'écoute | `2974` | Port conventionnel par défaut de ClientsBox (REQ-005, C-04) |
| Statut serveur | `READY / LISTENING` | Le serveur TCP accepte les connexions entrantes |
| Code de sortie initial | `0 (actif)` | Processus résident en attente de requêtes |

## Ce que ce cas ne vérifie pas

- La surcharge du port via `-p` ou `--port` → `CASE-SRV-01-2` ;
- Le comportement en cas de conflit de port occupé (`EADDRINUSE`) → `CASE-SRV-01-3` ;
- La résolution du chemin `workspacePath` → `CASE-SRV-01-4` ;
- La distribution des fichiers statiques de l'UI web → `CASE-SRV-02-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_01_1_default_port_startup_on_2974`
**Fichier :** `tests/tests-unitaires/srv/case-srv-01-1.test.ts`

## Revue du test automatisé

- [ ] Le test démarre l'instance serveur sans argument de port CLI.
- [ ] Le test vérifie que le port d'écoute effectif retourné par `server.address().port` est exactement `2974`.
- [ ] Le test vérifie qu'une connexion HTTP locale sur `http://localhost:2974` aboutit avec succès.
- [ ] Le test échoue si la valeur par défaut est modifiée (ex. 3000 ou 8080).
- [ ] Le nom du test contient `CASE_SRV_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
