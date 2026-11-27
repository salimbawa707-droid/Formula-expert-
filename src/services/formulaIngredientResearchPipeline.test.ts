import { ActiveFormulaState } from '../types';
import { IngredientResearchBridge } from './ingredientResearchBridge';
import { prepareFormulaForCalculation, requireCalculationReadyFormula } from './formulaIngredientResearchPipeline';

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

  const calculationFormula: ActiveFormulaState = {
    name: 'Deterministic calculation test',
    batchSizeKg: 100,
    ingredients: [
      { name: 'Researched Surfactant', percent: 10, activeMatterPct: 70 },
      { name: 'Water', percent: 90, activeMatterPct: 0 }
    ]
  };

  const originalResolver = IngredientResearchBridge.resolveForFormula;
  try {
    IngredientResearchBridge.resolveForFormula = (async (name: string) => ({
      ingredient: {
        id: name === 'Researched Surfactant' ? 'research-1' : 'water-1',
        name,
        ...(name === 'Researched Surfactant' ? {
          activePercent: 70,
          activeMatterPct: 70,
          activeMatterInputSource: 'SOURCE_BACKED',
          activeMatterEvidenceId: 'supplier-tds-lot-001',
          activeMatterEvidenceUrl: 'https://supplier.example/grade-tds.pdf',
          activeMatterEvidenceSourceType: 'MANUFACTURER_TDS',
          provenance: {
            sourceType: 'OFFICIAL_MANUFACTURER',
            source: 'Exact supplier grade TDS',
            sourceUrl: 'https://supplier.example/grade-tds.pdf',
            verificationStatus: 'VERIFIED'
          }
        } : {}),
        category: name === 'Researched Surfactant' ? 'Anionic Surfactant' : 'Solvent / Carrier'
      },
      source: name === 'Researched Surfactant' ? 'WEB_RESEARCH' : 'LOCAL_LIBRARY',
      requiresUserApproval: false
    })) as typeof IngredientResearchBridge.resolveForFormula;

    const result = await prepareFormulaForCalculation(calculationFormula);
    assert(result.calculationReady, 'complete formula must be screening-calculation-ready');
    assert(result.authoritativeCalculationReady, 'exact supplier-grade active assay evidence must unlock authoritative calculation');
    assert(result.activeMatterReport?.activeMatterStatus === 'COMPLETE', 'deterministic active matter report must be complete');
    assert(result.activeMatterReport?.totalActiveMatter === 7, '10% raw at 70% active must produce 7% active matter');
    assert(result.activeMatterReport?.totalBatchActiveKg === 7, '100 kg batch must contain 7 kg active matter');
  } finally {
    IngredientResearchBridge.resolveForFormula = originalResolver;
  }

  const originalScreeningResolver = IngredientResearchBridge.resolveForFormula;
  try {
    IngredientResearchBridge.resolveForFormula = (async (name: string) => ({
      ingredient: {
        id: 'screening-only-1',
        name,
        activePercent: 70,
        activeMatterPct: 70,
        activeMatterInputSource: 'CATALOG_DEFAULT',
        category: 'Anionic Surfactant'
      },
      source: 'LOCAL_LIBRARY',
      requiresUserApproval: false
    })) as typeof IngredientResearchBridge.resolveForFormula;
    const screeningOnly = await prepareFormulaForCalculation({
      name: 'Screening only must not release',
      batchSizeKg: 100,
      ingredients: [{ name: 'SLES 70%', percent: 100 }]
    });
    assert(screeningOnly.calculationReady, 'screening arithmetic may be computed from a catalog default');
    assert(screeningOnly.authoritativeCalculationReady === false, 'catalog default must not authorize formula release');
    let strictGateBlocked = false;
    try {
      await requireCalculationReadyFormula({
        name: 'Screening only must not release',
        batchSizeKg: 100,
        ingredients: [{ name: 'SLES 70%', percent: 100 }]
      });
    } catch {
      strictGateBlocked = true;
    }
    assert(strictGateBlocked, 'strict calculation gate must reject non-authoritative catalog defaults');
  } finally {
    IngredientResearchBridge.resolveForFormula = originalScreeningResolver;
  }

  const originalMissingResolver = IngredientResearchBridge.resolveForFormula;
  try {
    IngredientResearchBridge.resolveForFormula = (async (name: string) => ({
      ingredient: { id: 'unverified-1', name, category: 'Specialty Additive' },
      source: 'LOCAL_LIBRARY',
      requiresUserApproval: false
    })) as typeof IngredientResearchBridge.resolveForFormula;
    const noAssayResult = await prepareFormulaForCalculation({
      name: 'Missing assay must block',
      batchSizeKg: 100,
      ingredients: [{ name: 'Unlisted Proprietary Chemical QZ-998', percent: 100 }]
    });
    assert(noAssayResult.calculationReady === false, 'missing active-matter assay must block calculation even when ingredient identity resolves');
    assert(noAssayResult.unresolved.includes('Unlisted Proprietary Chemical QZ-998'), 'ingredient without active-matter assay must be named as unresolved');
    assert(noAssayResult.activeMatterReport?.activeMatterStatus === 'INSUFFICIENT_DATA', 'missing assay must remain visible in the active-matter report');
  } finally {
    IngredientResearchBridge.resolveForFormula = originalMissingResolver;
  }

  console.log('formulaIngredientResearchPipeline.test: PASS');
}

void main();
