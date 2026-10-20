import { describe, expect, it, vi } from 'vitest';
import { IngredientResearchService } from './ingredientResearchService';
import { researchIngredientForFormula } from './ingredientResearchController';

describe('researchIngredientForFormula', () => {
  it('rejects an empty ingredient name', async () => {
    await expect(researchIngredientForFormula('   ')).rejects.toThrow('Ingredient name is required.');
  });

  it('returns local ingredients without invoking research', async () => {
    const spy = vi.spyOn(IngredientResearchService, 'researchMultiSource');
    const result = await researchIngredientForFormula('SLES');

    expect(result.status).toBe('LOCAL');
    expect(result.canUseInFormula).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
