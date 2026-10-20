import { ActiveFormulaState } from '../types';
import { IngredientResearchBridge } from './ingredientResearchBridge';
import { prepareFormulaForCalculation } from './formulaIngredientResearchPipeline';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`formulaIngredientResearchPipeline.test failed: ${message}`);
}

async function main(): Promise<void> {
  const formula: ActiveFormulaState = {
    name: 'Research pipeline test',
    batchSizeKg: 100,
    ingredients: [
      { name: 'Known Ingredient', percent: 10 },
      { name: 'Unknown Ingredient', percent: 5 }
    ]
  };

  const original = IngredientResearchBridge.resolveForFormula;
  try {
    let call = 0;
    IngredientResearchBridge.resolveForFormula = (async () => {
      call += 1;
      if (call === 1) {
        return {
          ingredient: { id: 'local-1', name: 'Known Ingredient', activePercent: 70, activeMatterPct: 70 },
          source: 'LOCAL_LIBRARY',
          requiresUserApproval: false
        };
      }
      return {
        ingredient: null,
        source: 'UNRESOLVED',
        requiresUserApproval: true,
        warning: 'No supported evidence.'
      };
    }) as typeof IngredientResearchBridge.resolveForFormula;

    const result = await prepareFormulaForCalculation(formula);
    assert(result.formula.ingredients.length === 1, 'unresolved ingredient must be excluded');
    assert(result.formula.ingredients[0].percent === 10, 'user percentage must be preserved');
    assert(result.formula.ingredients[0].activePercent === 70, 'researched/local active matter must be preserved');
    assert(result.unresolved.includes('Unknown Ingredient'), 'unknown ingredient must be reported');
    assert(result.calculationReady === false, 'formula with unresolved evidence must not calculate');
  } finally {
    IngredientResearchBridge.resolveForFormula = original;
  }

  console.log('formulaIngredientResearchPipeline.test: PASS');
}

void main();
