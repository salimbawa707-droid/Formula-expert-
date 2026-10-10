import { RAW_FORMULAS_REMEDIATED } from './remediated_formulas_candidate';
import { normalizeProductCategory, ProductCategoryId } from '../src/domain/productTaxonomy';
import { getScientificProductProfile, getCalculationPolicy } from '../src/domain/scientificProductProfiles';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';
import { revalidateFormulaTemplate } from '../src/utils/templateRevalidationEngine';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';

console.log('TESTING CANDIDATE REMEDIATED 39 FORMULAS...\n');

let validCount = 0;
let validWithWarningsCount = 0;
let failCount = 0;

for (let i = 0; i < RAW_FORMULAS_REMEDIATED.length; i++) {
  const f = RAW_FORMULAS_REMEDIATED[i];
  const catId = normalizeProductCategory(f.category) as ProductCategoryId;
  const profile = getScientificProductProfile(catId, f.name || f.id);
  const policy = profile.calculationPolicy;
  const rawIngs = f.ingredients || [];

  const isPowder = profile.physicalForm === 'POWDER';
  const phInput = mapFormulationIngredientsToPHEngineInput(rawIngs as any);
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
    specificationProfileId: profile.subProfileId || profile.specificationProfileId,
    waterHardnessPpm: 150
  });

  const massSum = Number(rawIngs.reduce((s: number, ing: any) => s + (ing.percent ?? ing.percentage ?? 0), 0).toFixed(2));

  const status = qg.finalFormulaStatus;
  if (status === 'VALID') validCount++;
  else if (status === 'VALID_WITH_WARNINGS') validWithWarningsCount++;
  else failCount++;

  const issues: string[] = [];
  if (Math.abs(massSum - 100) > 0.01) issues.push(`MassSum=${massSum}%`);
  if (!phPass) issues.push(`pH=${ph} (tgt ${policy.targetPHRange.min}-${policy.targetPHRange.max})`);
  if (!activePass) issues.push(`Active=${activePct}% (tgt ${policy.activeSurfactantRange.min}-${policy.activeSurfactantRange.max}%)`);
  if (!compRes.compatible) issues.push(`Incompat=[${compRes.alerts.map(a => a.title).join('; ')}]`);
  if (qg.blockingIssues.length > 0) issues.push(`Blockers=[${qg.blockingIssues.map(b => b.title).join('; ')}]`);

  console.log(`[${i+1}] ${f.id} (${profile.subProfileId || catId}): QG=${status} | pH=${ph} | Act=${activePct}% | ${issues.join(' | ') || 'PERFECT'}`);
}

console.log('\n======================================================');
console.log(`SUMMARY: VALID=${validCount}, VALID_WITH_WARNINGS=${validWithWarningsCount}, FAILED=${failCount}`);
console.log('======================================================');
