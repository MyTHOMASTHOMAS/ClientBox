# Agents (`agents/<id>.json`)

Un agent est l'**identité CLI** exécutée par les blocs `Run` et ciblée par `ClearContext`. Il relie un profil, un adapter CLI et optionnellement un modèle.

## À quoi sert un agent ?

- Choisir **quel binaire** parler (`cliId`)
- Hériter des consignes via `profilId`
- Fixer un **modèle** optionnel (`model`) transmis au CLI via `--model` lorsqu'il est renseigné

## Gestion dans l'interface (`#/agents`)

- Formulaire modal (création / édition)
- Liste des adapters filtrée sur les CLI **opérationnels**
- Champ modèle en **autocomplétion libre** alimenté par `GET /api/models?cliId=…`
  - Cache LRU backend (TTL 1 h, listes non vides uniquement)
  - Si le CLI ne répond pas → `[]` ; la **saisie manuelle reste autorisée**

## Format du fichier `.agents/data/agents/<id>.json`

| Champ      | Type   | Obligatoire | Contraintes                                                        |
| ---------- | ------ | ----------- | ------------------------------------------------------------------ |
| `id`       | string | oui         | Non vide ; pas de `/`, `\`, `..` ; = nom du fichier                |
| `name`     | string | oui         | Non vide                                                           |
| `profilId` | string | oui         | Non vide ; doit pointer un profil existant pour un run réussi      |
| `cliId`    | string | oui         | Adapter opérationnel (voir ci-dessous)                             |
| `model`    | string | non         | Trimé ; omis si vide ; transmis au CLI uniquement s'il est présent |

## Adapters CLI supportés (`cliId`)

| `cliId`       | Variable d'environnement | Notes                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------- |
| `cursor-cli`  | `CURSOR_CLI_BIN`         | Sessions via `create-chat` / `--resume`                                 |
| `antigravity` | `ANTIGRAVITY_CLI_BIN`    | Probe timeout : `ANTIGRAVITY_PROBE_TIMEOUT_MS`                          |
| `codex-cli`   | `CODEX_CLI_BIN`          | Probe timeout : `CODEX_PROBE_TIMEOUT_MS`                                |
| `claude-cli`  | `CLAUDE_CLI_BIN`         | Probe timeout : `CLAUDE_PROBE_TIMEOUT_MS` (capture lazy au premier Run) |

Si `model` est absent, le flag `--model` n'est **pas** ajouté à la commande CLI.

## Exemples copiables

### Minimal (sans `model`)

```json
{
  "id": "agent-dev",
  "name": "Agent Dev",
  "profilId": "profil-dev",
  "cliId": "cursor-cli"
}
```

### Complet (avec `model`)

```json
{
  "id": "agent-dev",
  "name": "Agent Dev",
  "profilId": "profil-dev",
  "cliId": "codex-cli",
  "model": "gpt-5.3-codex"
}
```

### Cas de rejet

| Entrée                   | Erreur                       |
| ------------------------ | ---------------------------- |
| `profilId` vide / absent | Champ obligatoire `profilId` |
| `cliId` vide / absent    | Champ obligatoire `cliId`    |
| `id` contenant `../`     | Identifiant interdit         |
| `model` non-string       | `model` doit être une chaîne |
