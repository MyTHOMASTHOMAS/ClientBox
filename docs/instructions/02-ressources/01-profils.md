# Profils (`profils/<id>.json`)

Un profil définit le **rôle système** partagé par un ou plusieurs agents : consignes (`systemPrompt`) et politique d'injection (`policy`).

## À quoi sert un profil ?

- Factoriser les consignes permanentes (« tu es un développeur senior… »)
- Contrôler **quand** le `systemPrompt` est renvoyé à l'agent (chaque prompt, début de scénario, ou jusqu'à un `ClearContext`)

## Gestion dans l'interface (`#/profiles`)

- Créer, éditer, supprimer un profil
- **Protection anti-orphelins** : la suppression est refusée (`HTTP 409`) tant qu'au moins un agent référence ce profil

Message typique :

> Suppression du profil « … » refusée : un ou plusieurs agents y sont référencés.

## Format du fichier `.agents/data/profils/<id>.json`

| Champ          | Type   | Obligatoire | Contraintes                                         |
| -------------- | ------ | ----------- | --------------------------------------------------- |
| `id`           | string | oui         | Non vide ; pas de `/`, `\`, `..` ; = nom du fichier |
| `name`         | string | oui         | Non vide                                            |
| `systemPrompt` | string | oui         | Chaîne (peut être vide côté schéma domaine)         |
| `policy`       | enum   | non         | Défaut : `chaque_prompt`                            |

## Les 3 politiques d'injection (`policy`)

| Valeur JSON              | Libellé UI                        | Comportement                                                                           |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------- |
| `chaque_prompt`          | Chaque prompt                     | `systemPrompt` injecté à **chaque** `Run` (défaut)                                     |
| `debut_scenario`         | Début de scénario                 | Une seule fois par scénario (pas de réinjection après `ClearContext` dans le même run) |
| `une_fois_jusqu_a_clear` | Une fois jusqu'à réinitialisation | Une fois jusqu'au prochain bloc `ClearContext` sur cet agent                           |

Assemblage effectif lorsqu'injection active :

```text
systemPrompt + "\n\n" + userPrompt
```

Si `systemPrompt` est vide ou non injecté → `userPrompt` seul.

## Exemples copiables

### Minimal (politique par défaut)

```json
{
  "id": "profil-dev",
  "name": "Développeur",
  "systemPrompt": "Tu es un développeur senior. Réponds de façon concise."
}
```

### Complet

```json
{
  "id": "profil-reviewer",
  "name": "Reviewer",
  "systemPrompt": "Tu es un reviewer exigeant. Signale les risques et conclus par TERMINE.",
  "policy": "debut_scenario"
}
```

### Cas de rejet à la validation

| Entrée                             | Erreur                        |
| ---------------------------------- | ----------------------------- |
| `policy: "toujours"`               | Valeur de `policy` invalide   |
| `id` ou `name` vide                | Champs obligatoires manquants |
| `systemPrompt` absent / non-string | `systemPrompt` obligatoire    |
