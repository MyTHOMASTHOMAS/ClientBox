# Studio d'orchestration (Canvas)

Éditeur nodal du scénario (`#/scenarios/<id>`).

## Anatomie de l'écran Studio

| Zone                       | Rôle                                           |
| -------------------------- | ---------------------------------------------- |
| Barre d'outils flottante   | Ajouter un bloc, lancer / arrêter, sauvegarder |
| Surface Canvas SVG         | Blocs, ports, connexions                       |
| Tiroir Inspecteur (droite) | Paramètres du bloc sélectionné                 |
| Dock Terminal (bas)        | Flux live SSE                                  |

## Navigation spatiale (Pan & Zoom)

- **Pan** : déplacer la caméra (ADR-021)
- **Zoom** : molette / gestes selon la plateforme
- **Recentrage** : ramener le graphe dans la vue
- Viewport optionnel persisté dans `metadata.viewport` (`x`, `y`, `zoom`)

## Manipuler les blocs et l'Inspecteur

Les **6 types** de blocs : `start`, `run`, `if`, `clearContext`, `command`, `callScenario`.

1. Ajouter un bloc depuis la barre d'outils (un second `Start` est refusé)
2. Sélectionner un nœud → configurer dans l'Inspecteur
3. Supprimer : `Delete` / `Backspace` ou bouton Inspecteur

Champs inspecteur selon le type : voir [Schéma & blocs](./02-schema-scenario-et-blocs.md).

## Câbler les blocs et gérer les clés

1. Tirer une connexion d'un port de sortie vers un port d'entrée
2. Attribution automatique de la clé : `"0"`, puis `"1"`, `"2"`, …
3. Renommage possible d'une clé (clés textuelles personnalisées autorisées)
4. Suppression d'un câble numérique → **renumérotation** compacte des clés numériques restantes (les clés textuelles sont préservées)
5. Collision interdite : deux connexions entrantes vers le **même** bloc cible ne peuvent pas partager la même `key`

## Sauvegarde et verrouillage en exécution

- Indicateur de synchronisation (état « dirty » / sauvegardé)
- Pendant un run : graphe **verrouillé** (`graphLocked`) — pas d'édition structurelle
- Les changements de `status` SSE ne marquent **pas** le document comme modifié
