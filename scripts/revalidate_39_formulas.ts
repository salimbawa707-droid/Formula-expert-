import { FORMULAS } from '../src/data/formulas';
import { normalizeProductCategory, getProductCategoryLabel, ProductCategoryId } from '../src/domain/productTaxonomy';
import { getScientificProductProfile, getCalculationPolicy } from '../src/domain/scientificProductProfiles';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { evaluateAuthoritativeHLB } from '../src/utils/hlbEngine';
import { calculateFormulationChelationCapacity, calculateDynamicChelatorRequirement } from '../src/utils/chelatorEngine';
import { calculateWaterHardnessTolerance } from '../src/utils/calculators';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';
import { calculateCleaningPerformance } from '../src/utils/cleaningPerformanceEngine';
import { ViscosityEngine } from '../src/utils/viscosityEngine';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';
import { revalidateFormulaTemplate } from '../src/utils/templateRevalidationEngine';

interface AuditRow {
  index: number;
  id: string;
  name: string;
  category: string;
  form: string;
  ingredientsCount: number;
  massSum: number;
  ph: number;
  targetPHMin: number;
  targetPHMax: number;
  phStatus: string;
  activeSurfactantPct: number;
  totalActiveMatterPct: number;
  activeTargetMin: number;
  activeTargetMax: number;
  activeStatus: string;
  hlb: number | string;
  hlbApplicable: boolean;
  chelationCapacityMg: number;
  chelationSufficient: boolean;
  compatOk: boolean;
  compatRisk: string;
  compatAlerts: number;
  cpi: number | string;
  viscosityCp: number | string;
  qgStatus: string;
  qgOverall: string;
  qgBlocking: string[];
  qgMajorWarnings: string[];
}

const auditRows: AuditRow[] = [];

for (let i = 0; i < FORMULAS.length; i++) {
  const f = FORMULAS[i];
  const catId = normalizeProductCategory(f.category) as ProductCategoryId;
  const profile = getScientificProductProfile(catId);
  const policy = getCalculationPolicy(catId);
  const batchSizeKg = f.batchSizeKg || 100;

  // 1. Normalization & Mass balance
  const rawIngs = f.ingredients || [];
  let massSum = 0;
  for (const ing of rawIngs) {
    massSum += Number(ing.percentage ?? ing.percent ?? 0);
  }

  // 2. pH via PHEngineV2
  const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
  let ph = 7.0;
  if (profile.physicalForm === 'POWDER') {
    const phRes = PHEngineV2.calculatePH(phInput, batchSizeKg, {
      productCategory: catId,
      temperatureC: 25,
      assumeSlurryBasisIfPowder: true,
      slurryConcentrationPct: 1.0
    });
    ph = phRes.pH;
  } else {
    const phRes = PHEngineV2.calculatePH(phInput, batchSizeKg, {
      productCategory: catId,
      temperatureC: 25
    });
    ph = phRes.pH;
  }

  const targetMin = policy.targetPHRange.min;
  const targetMax = policy.targetPHRange.max;
  const phStatus = (ph >= targetMin && ph <= targetMax) ? 'PASS' : 'FAIL';

  // 3. Active Matter
  const activeReport = ActiveMatterEngine.calculateActiveMatterReport(rawIngs as any, batchSizeKg);
  const activeSurfactantPct = activeReport.surfactants.totalActiveSurfactants;
  const totalActiveMatterPct = activeReport.totalActiveMatter;
  const activeTargetMin = policy.activeSurfactantRange.min;
  const activeTargetMax = policy.activeSurfactantRange.max;
  const activeStatus = (activeSurfactantPct >= activeTargetMin && activeSurfactantPct <= activeTargetMax) ? 'PASS' : 'FAIL';

  // 4. HLB
  let hlb: number | string = 'N/A';
  if (policy.requiresHLBAnalysis) {
    const hlbRes = evaluateAuthoritativeHLB(rawIngs as any);
    hlb = hlbRes.blendedHLB;
  }

  // 5. Chelation
  const chelationRes = calculateFormulationChelationCapacity(rawIngs as any);
  const dynChelation = calculateDynamicChelatorRequirement(rawIngs as any, 150);

  // 6. Compatibility
  const compat = calculateFormulationCompatibility(rawIngs as any, ph, catId);

  // 7. Cleaning Performance
  const perf = calculateCleaningPerformance(rawIngs as any, ph, catId);
  const cpi = perf.isCleaningApplicable ? perf.cpi : 'N/A';

  // 8. Viscosity
  const viscReport = ViscosityEngine.evaluateViscosity(rawIngs as any, {
    productCategory: catId,
    targetPH: ph,
    temperatureC: 25
  });
  const viscosityCp = viscReport.isFluid ? viscReport.viscosityCp : 'N/A (Solid)';

  // 9. Quality Gate
  const qg = evaluateScientificQualityGate({
    formulaName: f.name,
    formulaVersion: '1.0.0',
    ingredients: rawIngs as any,
    productCategory: catId,
    waterHardnessPpm: 150
  });

  auditRows.push({
    index: i + 1,
    id: f.id,
    name: f.name,
    category: getProductCategoryLabel(catId),
    form: profile.physicalForm,
    ingredientsCount: rawIngs.length,
    massSum: Number(massSum.toFixed(2)),
    ph: Number(ph.toFixed(2)),
    targetPHMin: targetMin,
    targetPHMax: targetMax,
    phStatus,
    activeSurfactantPct: Number(activeSurfactantPct.toFixed(2)),
    totalActiveMatterPct: Number(totalActiveMatterPct.toFixed(2)),
    activeTargetMin,
    activeTargetMax,
    activeStatus,
    hlb: typeof hlb === 'number' ? Number(hlb.toFixed(2)) : hlb,
    hlbApplicable: policy.requiresHLBAnalysis,
    chelationCapacityMg: Number(chelationRes.totalSequestrationMg.toFixed(1)),
    chelationSufficient: dynChelation.isSufficient,
    compatOk: compat.compatible,
    compatRisk: compat.riskLevel,
    compatAlerts: compat.alerts.length,
    cpi: typeof cpi === 'number' ? Number(cpi.toFixed(1)) : cpi,
    viscosityCp: typeof viscosityCp === 'number' ? Number(viscosityCp.toFixed(0)) : viscosityCp,
    qgStatus: qg.finalFormulaStatus,
    qgOverall: qg.finalFormulaStatus === 'VALID' || qg.finalFormulaStatus === 'VALID_WITH_WARNINGS' ? 'PASS' : 'FAIL',
    qgBlocking: qg.blockingIssues.map(b => b.code),
    qgMajorWarnings: qg.majorWarnings.map(w => w.code)
  });
}

console.log(JSON.stringify(auditRows, null, 2));
