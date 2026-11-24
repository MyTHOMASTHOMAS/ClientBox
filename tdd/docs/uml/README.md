# Diagrammes UML — ClientsBox

Les diagrammes vivent en **PlantUML** dans ce dossier : c'est du texte, donc versionnable, diffable et relisible par l'agent en revue critique.

---

## 1. Inventaire des diagrammes

| Fichier | Type de diagramme | Domaine / Sujet couvert | Date |
|---|---|---|---|
| [`use-cases.puml`](./use-cases.puml) | Cas d'utilisation | Vue d'ensemble des cas d'usage utilisateur vs spécifications | 2026-09-23 |
| [`domain.puml`](./domain.puml) | Classes du domaine | Entités métier, schémas JSON, nœuds de graphe et messages inter-blocs | 2026-09-23 |
| [`components.puml`](./components.puml) | Composants | Architecture modulaire 5-tiers (UI, SRV, ENG, ADPT, DATA) | 2026-09-23 |
| [`sequences/sequence-run-streaming.puml`](./sequences/sequence-run-streaming.puml) | Séquence | Exécution d'un Run, assemblage profil et streaming live terminal | 2026-09-23 |
| [`sequences/sequence-join-power-pause.puml`](./sequences/sequence-join-power-pause.puml) | Séquence | Algorithme de Join ($N \ge 1$), calcul de Power et gestion de la Pause | 2026-09-23 |
| [`sequences/sequence-stop-emergency.puml`](./sequences/sequence-stop-emergency.puml) | Séquence | Arrêt d'urgence Stop (en run / pause) et kill du processus sans clear | 2026-09-23 |

---

## 2. Rendu graphique

Pour compiler les fichiers `.puml` en images vectorielles SVG :

```bash
# Avec PlantUML installé localement :
plantuml -tsvg tdd/docs/uml/**/*.puml tdd/docs/uml/*.puml
```

> **Note :** Les images générées ne sont pas commitées : seules les sources `.puml` textuelles font foi.

---

## 3. Conventions respectées

- **Vocabulaire métier :** Les noms de classes et d'acteurs reprennent strictement les termes du Cahier des Charges (`Agent`, `Profile`, `Prompt`, `ExitCondition`, `Scenario`, `ScenarioNode`, `BlockMessage`, `BlockInputBag`).
- **Traçabilité des spécifications :** Chaque cas d'usage et interaction clé référence explicitement ses spécifications d'ancrage (`SPEC-SRV-*`, `SPEC-DATA-*`, `SPEC-ADPT-*`, `SPEC-ENG-*`, `SPEC-UI-*`).
- **Pureté du domaine :** `domain.puml` contient exclusivement les entités conceptuelles et règles métier sans contrôleur, repository ni classe technique.
