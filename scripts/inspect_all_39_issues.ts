import { FORMULAS } from '../src/data/formulas';
import { normalizeProductCategory, getProductCategoryLabel, ProductCategoryId } from '../src/domain/productTaxonomy';
import { getScientificProductProfile, getCalculationPolicy } from '../src/domain/scientificProductProfiles';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { evaluateAuthoritativeHLB } from '../src/utils/hlbEngine';
import { calculateFormulationChelationCapacity, calculateDynamicChelatorRequirement } from '../src/utils/chelatorEngine';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';
import { calculateCleaningPerformance } from '../src/utils/cleaningPerformanceEngine';
import { ViscosityEngine } from '../src/utils/viscosityEngine';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';

console.log('Analyzing 39 formulas for Phase 2 remediation plan...');

for (let i = 0; i < FORMULAS.length; i++) {
  const f = FORMULAS[i];
  const catId = normalizeProductCategory(f.category) as ProductCategoryId;
  const profile = getScientificProductProfile(catId);
  const policy = getCalculationPolicy(catId);
  const rawIngs = f.ingredients || [];

  const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
  const isPowder = profile.physicalForm === 'POWDER';
  const phRes = PHEngineV2.calculatePH(phInput, f.batchSizeKg || 100, {
    productCategory: catId,
    temperatureC: 25,
    assumeSlurryBasisIfPowder: isPowder,
    slurryConcentrationPct: isPowder ? 1.0 : undefined
  });
  const ph = Number(phRes.pH.toFixed(2));
  const phPass = ph >= policy.targetPHRange.min && ph <= policy.targetPHRange.max;

  const activeRep = ActiveMatterEngine.calculateActiveMatterReport(rawIngs as any, f.batchSizeKg || 100);
  const activePct = Number(activeRep.surfactants.totalActiveSurfactants.toFixed(2));
  const activePass = activePct >= policy.activeSurfactantRange.min && activePct <= policy.activeSurfactantRange.max;

  const compRes = calculateFormulationCompatibility(rawIngs as any, ph, catId);

  const qg = evaluateScientificQualityGate({
    formulaName: f.name,
    formulaVersion: '1.0.0',
    ingredients: rawIngs as any,
    productCategory: catId,
    waterHardnessPpm: 150
  });

  const issues: string[] = [];
  if (!phPass) issues.push(`pH ${ph} (target: ${policy.targetPHRange.min}-${policy.targetPHRange.max})`);
  if (!activePass) issues.push(`Active ${activePct}% (target: ${policy.activeSurfactantRange.min}-${policy.activeSurfactantRange.max}%)`);
  if (!compRes.compatible) issues.push(`Incompat: ${compRes.alerts.map(a => a.ruleName || a.title).join(', ')}`);

  console.log(`[${i+1}] ${f.id} (${f.category}): QG=${qg.finalFormulaStatus} | ${issues.join(' | ') || 'CLEAN'}`);
}
