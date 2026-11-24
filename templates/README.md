# Templates de Configuration — ClientsBox

Ce répertoire contient des jeux de données et configurations types pour l'application **ClientsBox**.

> [!NOTE]
> **Rôle :** Ces fichiers sont versionnés dans Git pour servir de modèles et de données d'initialisation pour le développement local (`npm run dev`).  
> Ils ne sont **pas** utilisés par les suites de tests automatisées (Vitest / Playwright).

---

## Structure

Conformément à l'[ADR-005](../tdd/docs/adr/ADR-005-persistance-data.md), les templates reproduisent l'arborescence attendue par l'application :

```text
templates/data/
├── agents/            # Agents configurés (agent-codeur.json, agent-validateur.json)
├── profils/           # Profils système (profil-developpeur.json, profil-reviewer.json)
├── prompts/           # Modèles de prompts (prompt-generation.json, prompt-validation.json)
├── exit/              # Conditions de sortie (exit-termine.json)
├── if/                # Scripts de branchement JS (est-valide.js)
└── scenarios/         # Scénarios nodaux complets (scenario-demo.json)
```

---

## Utilisation en Développement Local

Pour copier ces templates dans votre environnement local `.agents/data/` (ignoré par Git) :

```bash
npm run seed:dev
```

Vous pouvez ensuite lancer votre serveur de développement :

```bash
npm run dev
```

L'interface web sur `http://localhost:2974` disposera immédiatement des agents, scénarios et profils d'exemple.
