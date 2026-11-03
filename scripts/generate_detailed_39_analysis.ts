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

interface AuditDetail {
  index: number;
  id: string;
  name: string;
  category: string;
  form: string;
  ingredientsCount: number;
  massSum: number;
  ph: number;
  targetMin: number;
  targetMax: number;
  phStatus: 'PASS' | 'FAIL';
  phDelta: number;
  activeSurfactantPct: number;
  activeMin: number;
  activeMax: number;
  activeStatus: 'PASS' | 'FAIL';
  hlb: number | string;
  hlbTarget: string;
  chelationMg: number;
  chelationReqMg: number;
  chelationStatus: 'PASS' | 'FAIL';
  compatStatus: 'COMPATIBLE' | 'INCOMPATIBLE';
  compatRisk: string;
  compatAlerts: string[];
  cpi: number | string;
  viscosityCp: number | string;
  viscMin: number;
  viscMax: number;
  qgStatus: string;
  blockingCodes: string[];
  majorCodes: string[];
  rootCauses: string[];
}

const details: AuditDetail[] = [];

for (let i = 0; i < FORMULAS.length; i++) {
  const f = FORMULAS[i];
  const catId = normalizeProductCategory(f.category) as ProductCategoryId;
  const profile = getScientificProductProfile(catId);
  const policy = getCalculationPolicy(catId);
  const batchSizeKg = f.batchSizeKg || 100;
  const rawIngs = f.ingredients || [];

  let massSum = 0;
  for (const ing of rawIngs) {
    massSum += Number(ing.percentage ?? (ing as any).percent ?? 0);
  }

  const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
  const isPowder = profile.physicalForm === 'POWDER';
  const phRes = PHEngineV2.calculatePH(phInput, batchSizeKg, {
    productCategory: catId,
    temperatureC: 25,
    assumeSlurryBasisIfPowder: isPowder,
    slurryConcentrationPct: isPowder ? 1.0 : undefined
  });
  const ph = Number(phRes.pH.toFixed(2));
  const targetMin = policy.targetPHRange.min;
  const targetMax = policy.targetPHRange.max;
  const phStatus = (ph >= targetMin && ph <= targetMax) ? 'PASS' : 'FAIL';
  const phDelta = ph < targetMin ? Number((ph - targetMin).toFixed(2)) : (ph > targetMax ? Number((ph - targetMax).toFixed(2)) : 0);

  const activeRep = ActiveMatterEngine.calculateActiveMatterReport(rawIngs as any, batchSizeKg);
  const actSurfactant = Number(activeRep.surfactants.totalActiveSurfactants.toFixed(2));
  const activeMin = policy.activeSurfactantRange.min;
  const activeMax = policy.activeSurfactantRange.max;
  const activeStatus = (actSurfactant >= activeMin && actSurfactant <= activeMax) ? 'PASS' : 'FAIL';

  let hlbVal: number | string = 'N/A';
  if (policy.requiresHLBAnalysis) {
    const hlbRes = evaluateAuthoritativeHLB(rawIngs as any);
    hlbVal = Number(hlbRes.blendedHLB.toFixed(2));
  }
  const hlbTargetStr = policy.targetHLBRange ? `${policy.targetHLBRange.min} - ${policy.targetHLBRange.max}` : 'N/A';

  const chelRes = calculateFormulationChelationCapacity(rawIngs as any);
  const dynChel = calculateDynamicChelatorRequirement(rawIngs as any, 150);
  const chelationStatus = dynChel.isSufficient ? 'PASS' : 'FAIL';

  const compRes = calculateFormulationCompatibility(rawIngs as any, ph, catId);
  const compatStatus = compRes.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE';

  const perf = calculateCleaningPerformance(rawIngs as any, ph, catId);
  const cpiVal = perf.isCleaningApplicable ? Number(perf.cpi.toFixed(1)) : 'N/A';

  const viscRes = ViscosityEngine.evaluateViscosity(rawIngs as any, {
    productCategory: catId,
    targetPH: ph,
    temperatureC: 25
  });
  const viscosityCp = viscRes.isFluid ? Number(viscRes.viscosityCp.toFixed(0)) : `Solid (${profile.physicalForm})`;
  const viscMin = policy.targetViscosityRange?.min ?? 0;
  const viscMax = policy.targetViscosityRange?.max ?? 0;

  const qg = evaluateScientificQualityGate({
    formulaName: f.name,
    formulaVersion: '1.0.0',
    ingredients: rawIngs as any,
    productCategory: catId,
    waterHardnessPpm: 150
  });

  const rootCauses: string[] = [];
  if (phStatus === 'FAIL') {
    if (ph > targetMax) {
      rootCauses.push(`High alkaline excess (PHEngineV2: ${ph} vs max target ${targetMax}) due to unneutralized base or high alkaline builder ratio`);
    } else {
      rootCauses.push(`Acidic deviation (PHEngineV2: ${ph} vs min target ${targetMin})`);
    }
  }
  if (activeStatus === 'FAIL') {
    if (actSurfactant < activeMin) {
      rootCauses.push(`Sub-potent active surfactant concentration (${actSurfactant}% vs min target ${activeMin}%)`);
    } else {
      rootCauses.push(`Surfactant over-concentration (${actSurfactant}% vs max target ${activeMax}%)`);
    }
  }
  if (!compRes.compatible) {
    const alertNames = compRes.alerts.map(a => a.ruleName || a.description).slice(0, 2);
    rootCauses.push(`Chemical incompatibility alerts: ${alertNames.join('; ')}`);
  }
  if (!dynChel.isSufficient && chelRes.totalSequestrationMg < dynChel.requiredSequestrationMg) {
    rootCauses.push(`Chelation capacity deficit at 150 ppm water hardness (${chelRes.totalSequestrationMg.toFixed(1)} mg vs ${dynChel.requiredSequestrationMg.toFixed(1)} mg required)`);
  }

  details.push({
    index: i + 1,
    id: f.id,
    name: f.name,
    category: getProductCategoryLabel(catId),
    form: profile.physicalForm,
    ingredientsCount: rawIngs.length,
    massSum: Number(massSum.toFixed(2)),
    ph,
    targetMin,
    targetMax,
    phStatus,
    phDelta,
    activeSurfactantPct: actSurfactant,
    activeMin,
    activeMax,
    activeStatus,
    hlb: hlbVal,
    hlbTarget: hlbTargetStr,
    chelationMg: Number(chelRes.totalSequestrationMg.toFixed(1)),
    chelationReqMg: Number(dynChel.requiredSequestrationMg.toFixed(1)),
    chelationStatus,
    compatStatus,
    compatRisk: compRes.riskLevel,
    compatAlerts: compRes.alerts.map(a => a.description),
    cpi: cpiVal,
    viscosityCp,
    viscMin,
    viscMax,
    qgStatus: qg.finalFormulaStatus,
    blockingCodes: qg.blockingIssues.map(b => b.code),
    majorCodes: qg.majorWarnings.map(m => m.code),
    rootCauses
  });
}

import * as fs from 'fs';
fs.writeFileSync('test_reports/detailed_39_analysis.json', JSON.stringify(details, null, 2));

console.log('Successfully generated test_reports/detailed_39_analysis.json');
console.log('Total analyzed:', details.length);
