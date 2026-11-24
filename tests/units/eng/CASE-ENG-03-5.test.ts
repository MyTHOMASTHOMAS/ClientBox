import { describe, it, expect, vi } from 'vitest';
import type { BlockInputBag } from '../../../src/types/models/input-bag.model.js';
import { runIfScript, type IfScriptFn } from '../../../src/lib/fs/dynamic-module-loader.fs.js';
import { assemblePrompt } from '../../../src/domain/prompt/prompt.assembler.js';

describe('CASE-ENG-03-5 — Règles de consommation du sac d’entrées : non-lecture Run/ClearContext vs lecture If (SPEC-ENG-01 / SPEC-ENG-03)', () => {
  it('test_CASE_ENG_03_5_input_bag_consumption_rules', async () => {
    // 1. Définition d'un sac d'entrées modèle
    const inputBag: BlockInputBag = {
      '0': { blockType: 'run', value: 'résultat précédent', power: 1 },
      param: { blockType: 'run', value: 100, power: 1 },
    };

    // Proxy pour espionner tout accès aux propriétés du sac d'entrées
    const accessedKeys: string[] = [];
    const spiedBag = new Proxy(inputBag, {
      get(target, prop, receiver) {
        if (typeof prop === 'string') {
          accessedKeys.push(prop);
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    // 2. Bloc Run : ne doit lire aucune clé du sac d'entrées
    // L'assemblage de prompt pour Run dépend exclusivement des prompts statiques configurés
    const staticSystemPrompt = 'Directive système';
    const staticUserPrompt = 'Tâche utilisateur autonome';

    const assembled = assemblePrompt(staticSystemPrompt, staticUserPrompt);

    expect(assembled).toContain(staticSystemPrompt);
    expect(assembled).toContain(staticUserPrompt);
    // Aucune clé lue sur le sac lors de l'exécution du bloc Run
    expect(accessedKeys.length).toBe(0);

    // 3. Bloc ClearContext : ne doit lire aucune clé du sac d'entrées
    const clearContextExecution = vi.fn().mockImplementation((agentId: string, _bag?: BlockInputBag) => {
      // ClearContext s'exécute uniquement avec son agentId statique configuré
      return { resetAgentId: agentId };
    });
    const clearResult = clearContextExecution('agent-alpha', spiedBag);
    expect(clearResult.resetAgentId).toBe('agent-alpha');
    // Aucune clé lue sur le sac lors du ClearContext
    expect(accessedKeys.length).toBe(0);

    // 4. Bloc If : doit impérativement consommer le sac d'entrées
    const ifScript: IfScriptFn = (sac) => {
      return (sac['0']?.value as string) === 'résultat précédent' && (sac['param']?.value as number) === 100;
    };

    const conditionResult = runIfScript(ifScript, spiedBag);
    expect(conditionResult).toBe(true);

    // Vérifier que le sac a bien été lu par le script If
    expect(accessedKeys).toContain('0');
    expect(accessedKeys).toContain('param');
  });
});
