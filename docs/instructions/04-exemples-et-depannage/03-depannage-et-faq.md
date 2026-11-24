# Dépannage & FAQ

Matrice **Symptôme → Cause → Solution**.

## Démarrage & CLI

| Symptôme                                   | Cause probable                                     | Solution                                                                                                                |
| ------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Port `2974` occupé / démarrage échoue      | Autre processus sur le port                        | `node clientsbox.js --port 3000` ou libérer le port                                                                     |
| Adapter absent de la liste Agents          | Binaire manquant / non exécutable / env non chargé | Renseigner `CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN` (chemins absolus) dans `env/.env` |
| Erreur « CURSOR_CLI_BIN est obligatoire… » | Variable absente ou vide                           | Copier `env/.env.example` → `env/.env` et compléter                                                                     |
| Liste de modèles vide `[]`                 | CLI ne répond pas à `listModels` / timeout         | Saisie manuelle du `model` toujours possible ; vérifier le binaire                                                      |
| `--exec-scene` code `1`                    | Scénario introuvable ou graphe invalide            | Vérifier l'id et les invariants (Start unique, `commandLine`, etc.)                                                     |
| `--exec-scene` code `130`                  | `Ctrl+C` / SIGTERM                                 | Comportement normal (interruption)                                                                                      |

## Validation de fichiers `.agents/data/`

| Symptôme                              | Cause probable                             | Solution                                                        |
| ------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| JSON invalide / ressource absente     | Syntaxe ou mauvais dossier                 | Valider le JSON ; respecter `profils/`, `agents/`, …            |
| Collision ou vacuité de `key`         | Deux entrées même clé / clé `""`           | Renommer ; clés uniques par `targetNodeId`                      |
| Second bloc `Start`                   | Plusieurs `start`                          | Un seul `Start` par scénario                                    |
| `commandLine` vide                    | Champ manquant ou espaces seuls            | Renseigner une commande non vide                                |
| Suppression de profil refusée (`409`) | Agent(s) liés                              | Supprimer / retarget les agents d'abord                         |
| `profilId` / `cliId` rejeté           | Champ vide                                 | Champs obligatoires non vides                                   |
| `exit` sans `content`                 | Ancien format `matchers` ou champ manquant | Schéma `{ id, name, content }` ; réécrire ou `npm run seed:dev` |

## Exécution & moteur

| Symptôme                        | Cause probable                                              | Solution                                                                                         |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bloc figé en **En pause**       | Join reçu avec au moins un `power: 0` (branche If inactive) | Attendu sur la branche non prise ; vérifier le câblage                                           |
| Bloc jamais lancé               | Orphelin (N = 0 entrées) hors Start                         | Câbler au moins une entrée                                                                       |
| `Run` qui semble coupé trop tôt | Ancien comportement matchers / stop anticipé (obsolète)     | Depuis CR-012, le CLI va jusqu'à sa fin naturelle ; placer l'ordre de sortie dans `exit.content` |
| Profondeur max `CallScenario`   | `CALL_SCENARIO_MAX_DEPTH` atteint                           | Augmenter la limite ou `-1` pour illimité                                                        |
| `Command` en erreur             | Code de sortie ≠ 0                                          | Corriger la commande / cwd workspace                                                             |
| Script If en erreur             | Exception / export non-fonction                             | Voir [Scripts If](../02-ressources/04-scripts-if.md)                                             |
| Mauvaise branche If             | Clé `sac["0"]` obsolète après renumérotation                | Mettre à jour le script ou utiliser des clés nommées                                             |

## Terminal & export

| Symptôme                                  | Cause probable                                         | Solution                                                            |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Historique terminal perdu au rechargement | Tampon mémoire uniquement (5000 lignes, pas de disque) | Comportement normal                                                 |
| Erreur disque à l'export `.agents/docs/`  | Permissions / chemin `AGENTS_DIR`                      | Vérifier les droits d'écriture sur `.agents/docs/`                  |
| Doc introuvable dans l'UI                 | Mauvais menu                                           | Ouvrir `#/instructions` (navigation in-place, pas un nouvel onglet) |
