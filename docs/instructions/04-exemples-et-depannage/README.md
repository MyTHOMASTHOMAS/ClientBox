# Exemples & dépannage

Modèles prêts à copier et matrice de résolution d'incidents.

## Mode d'emploi

1. Copier les fichiers indiqués sous `.agents/data/` (IDs cohérents entre eux)
2. Ouvrir le scénario dans le Studio (`#/scenarios`) **ou** lancer en CLI :

```bash
node clientsbox.js --exec-scene <id>
```

3. Adapter prompts / commandes à votre workspace

## Sommaire

| Guide                                                        | Contenu                                                |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| [Workflow clé en main](./01-workflow-complet-cle-en-main.md) | Bundle multi-fichiers Générer → Tester → If → Corriger |
| [Patterns avancés](./02-patterns-avances.md)                 | Boucles, Join, hybride IA+Command, CallScenario        |
| [Dépannage & FAQ](./03-depannage-et-faq.md)                  | Symptôme → Cause → Solution                            |

**Règle d'or** : créez d'abord profils / agents / prompts / exit / if, puis le scénario qui les référence.
