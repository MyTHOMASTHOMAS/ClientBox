# CASE-ARCH-01-6 — Conformité des ordres topologiques intra-couches (Micro-DAGs des 8 couches et Micro-DAG Front par dossier)

**Spécification :** `SPEC-ARCH-01`  
**Critère d'acceptation :** `AC-ARCH-01-1`, `AC-ARCH-01-5`, `AC-ARCH-01-6`  
**Type :** acceptation / architecture  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-013`, `ADR-015`  

---

## Ce que ce cas protège

Au-delà de l'étanchéité macro entre les 8 couches principales, chaque couche interne doit respecter un ordre topologique strict ($\prec$) défini dans `signature.md` §2.2, `signature-ui.md` §2.2 et `SPEC-ARCH-01`. Ce cas garantit :
1. Dans `domain/` : $\text{schemas} \parallel \text{keys} \parallel \text{messages} \parallel \text{join} \parallel \text{prompt} \prec \text{graph}$ (6 sous-domaines ; `exit/` abrogé CR-012).
2. Dans `services/` : $\text{resource-store} \prec \text{adapter-registry} \prec \text{agent.service} \prec \text{scenario-runner.service}$.
3. Dans `ui/` (Micro-DAG Front par dossier à 5 niveaux) :
   $$\text{Niveau 0 (api } \parallel \text{i18n } \parallel \text{types)} \prec \text{Niveau 1 (hooks)} \prec \text{Niveau 2 (components)} \prec \text{Niveau 3 (pages)} \prec \text{Niveau 4 (app.tsx)}$$
   - `components/` n'importe jamais de module depuis `pages/` ni depuis `app.tsx` ;
   - `hooks/` n'importe aucun composant JSX ni balisage VDOM ;
   - `api/`, `i18n/`, `types/` n'importent aucun autre sous-dossier de `ui/` ;
   - aucune page de `pages/` n'en importe une autre (isolation complète des routes applicatives).
4. Dans `controllers/` : $\text{resource.controller} \parallel \text{execution.controller} \prec \text{stream.controller}$.
5. Dans `lib/` : $\text{fs} \prec \text{process} \prec \text{adapters} \prec \text{http}$.

---

## Cas

```gherkin
Étant donné les formules de Micro-DAGs scellées dans "tdd/docs/signature/signature.md" section 2.2 et "tdd/specs/ARCH.md" SPEC-ARCH-01
Quand on extrait les dépendances d'imports internes au sein de chaque couche sous "src/"
Alors aucun sous-domaine de "domain/" n'importe un sous-domaine de rang supérieur ou parallèle interdit
Et "scenario-runner.service" (SVC-001) n'est importé par aucun autre module de "services/" (les contrats "scenario-runner.types" restent autorisés)
Et l'ordre topologique interne de "src/ui/" obéit strictement aux 5 niveaux : (api/ || i18n/ || types/) ≺ hooks/ ≺ components/ ≺ pages/ ≺ app.tsx
Et aucun composant de "src/ui/components/" n'importe de module depuis "src/ui/pages/" ou "src/ui/app.tsx"
Et aucun hook de "src/ui/hooks/" n'importe de composant JSX ou de balisage VDOM
Et aucun module de "src/ui/api/" ou "src/ui/i18n/" ne dépend d'un autre sous-dossier de "src/ui/"
Et aucune dépendance circulaire n'existe entre les pages de "src/ui/pages/"
Et 0 cycle ou couplage inversé n'est détecté à l'intérieur des 8 couches
```

---

## Données

| Couche | Ordre Topologique Micro-DAG Intra-Couche |
|:---|:---|
| `domain/` | $\text{schemas} \parallel \text{keys} \parallel \text{messages} \parallel \text{join} \parallel \text{prompt} \prec \text{graph}$ (pas de sous-domaine `exit/`) |
| `services/` | $\text{resource-store} \prec \text{adapter-registry} \prec \text{agent} \prec \text{scenario-runner}$ |
| `ui/` | $\text{Niveau 0 (api } \parallel \text{i18n } \parallel \text{types)} \prec \text{Niveau 1 (hooks)} \prec \text{Niveau 2 (components)} \prec \text{Niveau 3 (pages)} \prec \text{Niveau 4 (app.tsx)}$ |
| `controllers/` | $\text{resource} \parallel \text{execution} \prec \text{stream}$ |
| `lib/` | $\text{fs} \prec \text{process} \prec \text{adapters} \prec \text{http}$ |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Violations d'ordre Micro-DAG | `0 violation` | Analyse de graphe dirigé acyclique intra-couche |
| Cycles internes | `0 cycle` | Validation topologique par couche |

---

## Ce que ce cas ne vérifie pas

- La matrice d'imports globale inter-couches → `CASE-ARCH-01-5` ;
- La pureté de types/ → `CASE-ARCH-01-2` ;
- L'isolation système de la couche UI navigateur → `CASE-ARCH-01-4`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ARCH_01_6_intra_layer_micro_dags_compliance`  
**Fichier :** `tests/units/arch/case-arch-01-6.test.ts`  

## Revue du test automatisé

- [ ] Le test analyse les imports internes de `domain/`.
- [ ] Le test analyse les imports internes de `services/`.
- [ ] Le test analyse les imports internes de `ui/` selon le Micro-DAG par dossier à 5 niveaux.
- [ ] Le test vérifie l'absence d'import de `pages/` depuis `components/`.
- [ ] Le test vérifie l'absence de JSX/VDOM dans `hooks/`.
- [ ] Le test vérifie l'absence d'import croisé entre pages de `pages/`.
- [ ] Le test analyse les imports internes de `controllers/` et `lib/`.
- [ ] Le test échoue en cas d'inversion d'ordre topologique interne.
- [ ] Le nom du test contient `CASE_ARCH_01_6`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-012 — retrait de `domain/exit/` du Micro-DAG (6 sous-domaines).  

