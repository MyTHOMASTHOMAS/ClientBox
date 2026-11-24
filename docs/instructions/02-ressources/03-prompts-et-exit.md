# Prompts & ordres de sortie Exit

Les **prompts** définissent la mission ponctuelle d'un `Run`. Les ressources **Exit** définissent un **ordre de sortie** réutilisable, additionné à la fin du prompt lorsque le bloc `Run` référence un `exitId`.

---

## Prompts (`prompts/<id>.json`)

### Rôle et gestion UI (`#/resources`)

- Séparer la **mission ponctuelle** (`content`) du profil permanent (`systemPrompt`)
- Ne pas y dupliquer l'ordre de sortie : le placer dans une ressource Exit si le graphe en a besoin (boucle, branchement)

### Format de `.agents/data/prompts/<id>.json`

| Champ     | Type   | Obligatoire | Contraintes                 |
| --------- | ------ | ----------- | --------------------------- |
| `id`      | string | oui         | Non vide ; = nom du fichier |
| `name`    | string | oui         | Non vide                    |
| `content` | string | oui         | Chaîne (peut être vide)     |

### Exemple copiable

```json
{
  "id": "prompt-coder",
  "name": "Générer le code",
  "content": "Implémente la fonction demandée dans le workspace."
}
```

---

## Ordres de sortie Exit (`exit/<id>.json`)

### Rôle et gestion UI (`#/resources/exits`)

- Fournir une consigne de fin de tâche **hors** prompt de mission
- Si le bloc `Run` a un `exitId`, le moteur ajoute `exit.content` **après** le prompt de mission (séparateur `\n\n`)
- Le processus CLI s'exécute jusqu'à sa **fin naturelle** ; aucun arrêt anticipé sur un mot-clé
- Le routage (`TERMINER` / `CONTINUE`, etc.) est assuré en aval par un bloc **If** qui lit `sac[key].value`

### Format de `.agents/data/exit/<id>.json`

| Champ     | Type   | Obligatoire | Contraintes                                |
| --------- | ------ | ----------- | ------------------------------------------ |
| `id`      | string | oui         | Non vide                                   |
| `name`    | string | oui         | Non vide                                   |
| `content` | string | oui         | Chaîne (ordre de sortie adressé au modèle) |

Si `exitId` est absent sur un `Run`, aucun ordre de sortie n'est ajouté ; le bloc attend la fin naturelle du processus (code `0` ou `null`).

### Exemple copiable — boucle TERMINER / CONTINUE

```json
{
  "id": "exit-rapport",
  "name": "Clôture du rapport",
  "content": "Si tu estimes que le rapport est complet, renvoie TERMINER dans ta réponse. Sinon renvoie CONTINUE pour passer à l'agent suivant."
}
```

### Exemple copiable — marqueur simple

```json
{
  "id": "exit-termine",
  "name": "Fin TERMINE",
  "content": "Quand tu as terminé, réponds exactement : TERMINE"
}
```

### Cas de rejet

| Entrée             | Erreur                        |
| ------------------ | ----------------------------- |
| `content` absent   | Champ `content` obligatoire   |
| `id` / `name` vide | Champs obligatoires manquants |
