# Page Instructions & export `.agents/docs/`

Consulter la documentation dans l'application et la matérialiser sur disque.

## Accès intégré dans l'UI

- Menu latéral → **Instructions**
- Navigation **in-place** sur `#/instructions` (SPEC-UI-04)
- Pas d'ouverture dans un nouvel onglet

L'arbre de documents reflète `docs/instructions/` (tri alphabétique des préfixes `01-`, `02-`, …). Le `README.md` d'un dossier sert de page d'entrée (`indexDoc`) au clic sur le dossier.

## Exporter vers `.agents/docs/`

Bouton **« Enregistrer dans le dossier local »** :

- Appel `POST /api/docs/export`
- Écriture atomique du miroir Markdown sous `.agents/docs/` (par défaut `<workspace>/.agents/docs`)
- Réponse typique : `{ ok: true, target: "…/.agents/docs", files: [ … ] }`

## Garanties d'isolation

| Garantie                               | Détail                                    |
| -------------------------------------- | ----------------------------------------- |
| Pas d'export automatique au démarrage  | Action manuelle uniquement                |
| Aucune écriture sous `.agents/data/`   | L'export cible exclusivement `docs/`      |
| Exclusion permanente de `docs/deploy/` | Build interne, jamais embarqué ni exporté |
