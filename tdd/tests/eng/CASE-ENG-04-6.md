# CASE-ENG-04-6 — Délai de grâce STOP_GRACE_MS et escalade temporelle d'arrêt du runner

**Spécification :** `SPEC-ENG-04`, `SPEC-ADPT-03`, `SPEC-ARCH-03`  
**Critère d'acceptation :** `AC-ENG-04-3`, `AC-ADPT-03-1`, `AC-ARCH-03-4`  
**Type :** acceptation / intégration  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-004`, `ADR-006`  

---

## Ce que ce cas protège

Lors d'un ordre d'interruption manuelle du scénario (`DELETE /api/scenarios/:id/run` ou bouton Stop), le runner (`SVC-001`) doit coordonner l'arrêt gracieux des sous-processus via `ProcessManager` (`LIB-004`). Ce cas garantit qu'un délai de grâce déterministe de `3000 ms` (`STOP_GRACE_MS`) est accordé au processus après l'envoi du signal `SIGTERM` pour lui permettre de libérer ses verrous et fichiers locaux, et que le signal forcé `SIGKILL` n'est émis qu'en cas de non-réponse à l'issue de ce délai.

---

## Cas

```gherkin
Étant donné un scénario en cours d'exécution avec un sous-processus CLI enfant actif
Quand le runner reçoit l'ordre d'arrêt d'urgence "stopActiveRunner()"
Alors le runner émet d'abord un signal "SIGTERM" au sous-processus
Et il démarre un compte à rebours de grâce de 3000 ms ("STOP_GRACE_MS")

Étant donné que le sous-processus se termine spontanément dans les 500 ms
Quand le signal de sortie du processus est capté
Alors le timer de grâce est immédiatement annulé
Et le runner confirme l'arrêt sans émettre de signal "SIGKILL"

Étant donné un sous-processus récalcitrant qui ignore le signal "SIGTERM"
Quand le délai de 3000 ms s'écoule entièrement
Alors le runner escalade immédiatement vers l'émission de "SIGKILL"
Et le sous-processus est forcé à se terminer
```

---

## Données

| Élément | Valeur |
|---|---:|
| Constante de temporisation | `STOP_GRACE_MS = 3000` ms |
| Premier signal émis | `SIGTERM` |
| Signal d'escalade | `SIGKILL` |
| Règle de test déterministe | Utilisation de timers virtuels Vitest (`vi.useFakeTimers()`) per ADR-006 |

---

## Résultat attendu, calculé à la main

| Situation | Signal final | Durée avant arrêt |
|---|:---:|---|
| Sortie normale avant 3 000 ms | `SIGTERM` seul | $< 3000\text{ ms}$ |
| Processus bloqué après 3 000 ms | `SIGKILL` | Exactement $3000\text{ ms}$ |

---

## Ce que ce cas ne vérifie pas

- L'action Stop déclenchée depuis l'IHM web → `CASE-UI-03-2` ;
- Le relais SSE vers le terminal → `CASE-SRV-02-8`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ENG_04_6_runner_stop_grace_period_escalation`  
**Fichier :** `tests/units/eng/case-eng-04-6.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'émission initiale de SIGTERM.
- [ ] Le test avance le timer virtuel de 3000 ms.
- [ ] Le test vérifie l'escalade en SIGKILL si le process ne répond pas.
- [ ] Le nom du test contient `CASE_ENG_04_6`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
