import { IngredientResearchService } from './ingredientResearchService';
import { researchIngredientForFormula } from './ingredientResearchController';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`ingredientResearchController.test failed: ${message}`);
}

async function main(): Promise<void> {
  let emptyRejected = false;
  try {
    await researchIngredientForFormula('   ');
  } catch (error) {
    emptyRejected = error instanceof Error && error.message === 'Ingredient name is required.';
  }
  assert(emptyRejected, 'empty ingredient name must be rejected');

  const original = IngredientResearchService.researchMultiSource;
  let researchCalls = 0;
  IngredientResearchService.researchMultiSource = (async (...args: Parameters<typeof original>) => {
    researchCalls += 1;
    return original.apply(IngredientResearchService, args);
  }) as typeof original;

  try {
    const result = await researchIngredientForFormula('SLES');
    assert(result.status === 'LOCAL', 'known local ingredient must resolve locally');
    assert(result.canUseInFormula === true, 'local ingredient must be calculation-ready');
    assert(researchCalls === 0, 'local ingredient must not trigger web research');
  } finally {
    IngredientResearchService.researchMultiSource = original;
  }

  console.log('ingredientResearchController.test: PASS');
}

void main();
