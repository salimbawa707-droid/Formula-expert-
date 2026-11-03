
import { RAW_FORMULAS } from '../src/data/formulas';
import { calculatePHAdvanced } from '../src/utils/phEngine';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import { calculateActiveMatter } from '../src/utils/activeMatterEngine';
import { calculateHLBandCMC } from '../src/utils/hlbCmcEngine';
import { calculateDetailedViscosity } from '../src/utils/viscosityEngine';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';
import * as fs from 'fs';

export function runFullReconciliation() {
  const reconciliation = RAW_FORMULAS.map(formula => {
    // 1. Trace inputs
    const phInput = mapFormulationIngredientsToPHEngineInput(formula.ingredients);
    
    // 2. Engines
    const phRes = calculatePHAdvanced(phInput, formula.batchSizeKg || 100, { productCategory: formula.category as any });
    const activeMatter = calculateActiveMatter(formula.ingredients);
    const hlbCmc = calculateHLBandCMC(formula.ingredients);
    const viscosityRes = calculateDetailedViscosity(formula.ingredients, { temperatureC: 25 });
    
    // 3. Quality Gate
    const qgReport = evaluateScientificQualityGate({
      formulaName: formula.name,
      formulaVersion: '1.0.0',
      ingredients: formula.ingredients,
      productCategory: formula.category
    });
    
    return {
      id: formula.id,
      name: formula.name,
      category: formula.category,
      ph: phRes.pH,
      targetPH: formula.targetPH,
      activeSurfactant: activeMatter.totalSurfactantActivePct,
      totalActive: activeMatter.totalActiveMatterPct,
      hlb: hlbCmc.hlb,
      cmc: hlbCmc.cmc,
      viscosity: viscosityRes.viscosityCp,
      status: qgReport.finalFormulaStatus,
      blocking: qgReport.blockingIssues.map(i => i.code)
    };
  });
  
  fs.writeFileSync('./full-reconciliation.json', JSON.stringify(reconciliation, null, 2));
  return reconciliation;
}

runFullReconciliation();
