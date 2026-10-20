import { describe, expect, it, vi } from 'vitest';
import { ActiveFormulaState } from '../types';
import { IngredientResearchBridge } from './ingredientResearchBridge';
import { prepareFormulaForCalculation } from './formulaIngredientResearchPipeline';

const formula: ActiveFormulaState = {
  name: 'Research pipeline test',
  ingredients: [
    { name: 'Known Ingredient', percent: 10 },
    { name: 'Unknown Ingredient', percent: 5 }
  ]
};

describe('formulaIngredientResearchPipeline', () => {
  it('keeps user percentages while enriching a formula ingredient', async () => {
    vi.spyOn(IngredientResearchBridge, 'resolveForFormula').mockResolvedValueOnce({
      ingredient: {
        id: 'local-1',
        name: 'Known Ingredient',
        activePercent: 70,
        activeMatterPct: 70
      },
      source: 'LOCAL_LIBRARY',
      requiresUserApproval: false
    }).mockResolvedValueOnce({
      ingredient: null,
      source: 'UNRESOLVED',
      requiresUserApproval: true,
      warning: 'No supported evidence.'
    });

    const result = await prepareFormulaForCalculation(formula);

    expect(result.formula.ingredients).toHaveLength(1);
    expect(result.formula.ingredients[0].percent).toBe(10);
    expect(result.formula.ingredients[0].activePercent).toBe(70);
    expect(result.unresolved).toContain('Unknown Ingredient');
    expect(result.calculationReady).toBe(false);
  });
});
