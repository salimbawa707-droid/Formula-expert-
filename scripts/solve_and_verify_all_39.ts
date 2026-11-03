import { RAW_FORMULAS_REMEDIATED } from './remediated_formulas_candidate';
import { normalizeProductCategory, ProductCategoryId } from '../src/domain/productTaxonomy';
import { getScientificProductProfile, getCalculationPolicy } from '../src/domain/scientificProductProfiles';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';
import { PHEngineV2 } from '../src/domain/ph/pHEngineV2';
import { mapFormulationIngredientsToPHEngineInput } from '../src/utils/pHEngineAdapter';
import { ActiveMatterEngine } from '../src/utils/activeMatterEngine';
import { calculateFormulationCompatibility } from '../src/utils/compatibilityEngine';

const formulas = JSON.parse(JSON.stringify(RAW_FORMULAS_REMEDIATED));

// F1: hd-liquid-laundry (Target: 7.5 - 9.5)
const f1 = formulas[0];
f1.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = 1.84;
f1.ingredients.find((i: any) => i.name.includes('Triethanolamine')).percent = 0.5;
if (!f1.ingredients.find((i: any) => i.name.includes('Citric Acid'))) {
  f1.ingredients.push({
    id: 'f1-citric',
    name: 'Citric Acid Anhydrous',
    category: 'Builder / Chelator',
    percent: 0.08,
    activePercent: 100,
    costPerKg: 1.3,
    function: 'pH Buffer'
  });
}

// F2: eco-laundry-liquid (Target: 7.5 - 9.5)
const f2 = formulas[1];
const f2Soda = f2.ingredients.find((i: any) => i.name.includes('Carbonate'));
if (f2Soda) {
  f2Soda.name = 'Sodium Citrate Dihydrate';
  f2Soda.category = 'Builder / Chelator';
  f2Soda.percent = 2.0;
  f2Soda.function = 'Builder & Buffer';
}
f2.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = 1.63;
let f2Cit = f2.ingredients.find((i: any) => i.name.includes('Citric'));
if (!f2Cit) {
  f2Cit = { id: 'f2-cit', name: 'Citric Acid Anhydrous', category: 'Builder / Chelator', percent: 0.1, activePercent: 100, costPerKg: 1.3, function: 'pH Buffer' };
  f2.ingredients.push(f2Cit);
} else {
  f2Cit.percent = 0.1;
}

// F3: matic-frontload-enzyme-laundry (Target: 7.5 - 9.5)
const f3 = formulas[2];
f3.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = 2.28;
f3.ingredients.find((i: any) => i.name.includes('Triethanolamine')).percent = 0.5;
if (!f3.ingredients.find((i: any) => i.name.includes('Citric Acid'))) {
  f3.ingredients.push({
    id: 'f3-citric',
    name: 'Citric Acid Anhydrous',
    category: 'Builder / Chelator',
    percent: 0.18,
    activePercent: 100,
    costPerKg: 1.3,
    function: 'Enzyme Buffer'
  });
}

// F7: manual-dishwash-gel (Target: 6.0 - 8.0)
const f7 = formulas[6];
const f7Mea = f7.ingredients.find((i: any) => i.name.includes('MEA'));
if (f7Mea) {
  f7Mea.name = 'Cocamide DEA 85% (CDEA / CDE)';
  f7Mea.activePercent = 85;
}
f7.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = 1.52;
f7.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.1;
if (!f7.ingredients.find((i: any) => i.name.includes('Sodium Citrate'))) {
  f7.ingredients.push({
    id: 'f7-citrate',
    name: 'Sodium Citrate Dihydrate',
    category: 'Builder / Chelator',
    percent: 0.5,
    activePercent: 100,
    costPerKg: 1.4,
    function: 'Buffer'
  });
}

// F8: eco-lime-dishwash-gel (Target: 6.0 - 8.0)
const f8 = formulas[7];
f8.ingredients.find((i: any) => i.name.includes('Sodium Hydroxide')).percent = 1.07;
let f8Cit = f8.ingredients.find((i: any) => i.name.includes('Citric Acid'));
if (!f8Cit) {
  f8Cit = { id: 'f8-cit', name: 'Citric Acid Anhydrous', category: 'Builder / Chelator', percent: 0.05, activePercent: 100, costPerKg: 1.3, function: 'pH Buffer' };
  f8.ingredients.push(f8Cit);
} else {
  f8Cit.percent = 0.05;
}
if (!f8.ingredients.find((i: any) => i.name.includes('Sodium Citrate'))) {
  f8.ingredients.push({
    id: 'f8-citrate',
    name: 'Sodium Citrate Dihydrate',
    category: 'Builder / Chelator',
    percent: 0.5,
    activePercent: 100,
    costPerKg: 1.4,
    function: 'Buffer'
  });
}

// F9: ultra-gentle-apg-dishwash (Target: 6.0 - 8.0)
const f9 = formulas[8];

// F10: auto-dish-liquid (Target: 8.5 - 11.5)
const f10 = formulas[9];
f10.ingredients = f10.ingredients.filter((i: any) => !i.name.includes('Potassium Hydroxide'));
f10.ingredients.find((i: any) => i.name.includes('Sodium Silicate')).percent = 5.0;
if (!f10.ingredients.find((i: any) => i.name.includes('Citric Acid'))) {
  f10.ingredients.push({
    id: 'f10-citric',
    name: 'Citric Acid Anhydrous',
    category: 'Builder / Chelator',
    percent: 2.5,
    activePercent: 100,
    costPerKg: 1.3,
    function: 'pH Buffer & Co-Builder'
  });
}
if (!f10.ingredients.find((i: any) => i.name.includes('Kathon') || i.name.includes('Preservative'))) {
  f10.ingredients.push({
    id: 'f10-preservative',
    name: 'Kathon CG (CMIT/MIT 1.5%)',
    category: 'Preservative & Biocide',
    percent: 0.05,
    activePercent: 1.5,
    costPerKg: 12,
    function: 'Preservative'
  });
}

// F11: auto-dish-enzyme-gel (Target: 8.5 - 11.5)
const f11 = formulas[10];
const f11Soda = f11.ingredients.find((i: any) => i.name.includes('Sodium Carbonate'));
if (f11Soda) f11Soda.percent = 1.2;
if (!f11.ingredients.find((i: any) => i.name.includes('Sodium Bicarbonate'))) {
  f11.ingredients.push({
    id: 'f11-bicarb',
    name: 'Sodium Bicarbonate',
    category: 'Alkaline Builder',
    percent: 1.5,
    activePercent: 100,
    costPerKg: 0.55,
    function: 'Alkaline Buffer'
  });
}

// F12: commercial-dishwasher-rinse-aid (Target: 2.0 - 4.0)
const f12 = formulas[11];
if (!f12.ingredients.find((i: any) => i.name.includes('Kathon') || i.name.includes('Preservative') || i.name.includes('Benzoate'))) {
  f12.ingredients.push({
    id: 'f12-preservative',
    name: 'Kathon CG (CMIT/MIT 1.5%)',
    category: 'Preservative & Biocide',
    percent: 0.05,
    activePercent: 1.5,
    costPerKg: 12,
    function: 'Preservative'
  });
}

// F14: neutral-floor-cleaner-restorer (Target: 6.5 - 9.5)
const f14 = formulas[13];
f14.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.12;

// F15: multi-surface-lavender-floor (Target: 6.5 - 9.5)
const f15 = formulas[14];
f15.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.08;

// F17: eco-citrus-apg-cleaner (Target: 7.0 - 10.0)
const f17 = formulas[16];
f17.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.12;

// F18: economy-household-apc (Target: 7.0 - 10.0)
const f18 = formulas[17];
const f18Soda = f18.ingredients.find((i: any) => i.name.includes('Sodium Carbonate'));
if (f18Soda) {
  f18Soda.name = 'Sodium Bicarbonate';
  f18Soda.percent = 1.0;
  f18Soda.function = 'Alkaline Buffer';
}

// F20: eco-organic-acid-toilet-cleaner (Target: 1.5 - 3.0)
const f20 = formulas[19];
f20.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 8.5;
f20.ingredients.find((i: any) => i.name.includes('Sodium Citrate')).percent = 1.0;
if (!f20.ingredients.find((i: any) => i.name.includes('Kathon'))) {
  f20.ingredients.push({
    id: 'f20-preservative',
    name: 'Kathon CG (CMIT/MIT 1.5%)',
    category: 'Preservative & Biocide',
    percent: 0.05,
    activePercent: 1.5,
    costPerKg: 12,
    function: 'Preservative'
  });
}

// F25: anti-fog-glass-cleaner (Target: 8.5 - 10.5)
const f25 = formulas[24];
f25.ingredients.find((i: any) => i.name.includes('Ammonium Hydroxide')).percent = 0.01;

// F26: ammonia-free-eco-glass (Target: 8.5 - 10.5)
const f26 = formulas[25];
const f26Soda = f26.ingredients.find((i: any) => i.name.includes('Sodium Carbonate'));
if (f26Soda) {
  f26Soda.percent = 0.02;
}
if (!f26.ingredients.find((i: any) => i.name.includes('Sodium Bicarbonate'))) {
  f26.ingredients.push({
    id: 'f26-bicarb',
    name: 'Sodium Bicarbonate',
    category: 'Alkaline Builder',
    percent: 0.3,
    activePercent: 100,
    costPerKg: 0.55,
    function: 'Buffer'
  });
}

// F27: economy-blue-window-spray (Target: 8.5 - 10.5)
const f27 = formulas[26];
f27.ingredients.find((i: any) => i.name.includes('Ammonium Hydroxide')).percent = 0.01;

// F31: antibacterial-handwash-soap (Target: 5.0 - 6.8)
const f31 = formulas[30];
f31.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.12;
const f31Cit = f31.ingredients.find((i: any) => i.name.includes('Sodium Citrate'));
if (f31Cit) f31Cit.percent = 0.3;

// F32: sulfate-free-nourishing-handwash (Target: 5.0 - 6.8)
const f32 = formulas[31];
f32.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.15;
const f32Cit = f32.ingredients.find((i: any) => i.name.includes('Sodium Citrate'));
if (f32Cit) f32Cit.percent = 0.4;

// F33: economy-pearl-handwash (Target: 5.0 - 6.8)
const f33 = formulas[32];
f33.ingredients.find((i: any) => i.name.includes('Citric Acid')).percent = 0.05;
if (!f33.ingredients.find((i: any) => i.name.includes('Sodium Citrate'))) {
  f33.ingredients.push({
    id: 'f33-citrate',
    name: 'Sodium Citrate Dihydrate',
    category: 'Builder / Chelator',
    percent: 0.3,
    activePercent: 100,
    costPerKg: 1.4,
    function: 'Buffer'
  });
}

// F37: touchless-snow-foam-car-shampoo (Target: 9.5 - 11.5)
const f37 = formulas[36];
const meta = f37.ingredients.find((i: any) => i.name.includes('Sodium Metasilicate'));
if (meta) {
  meta.name = 'Sodium Bicarbonate';
  meta.category = 'Alkaline Builder';
  meta.percent = 1.5;
  meta.function = 'pH Buffer';
}
const ash = f37.ingredients.find((i: any) => i.name.includes('Sodium Carbonate'));
if (ash) ash.percent = 1.5;

// Rebalance water/filler for all formulas to sum exactly 100.00%
for (const f of formulas) {
  const isPowder = f.category.includes('Powder');
  if (isPowder) {
    const sulfate = f.ingredients.find((i: any) => i.name.includes('Sulfate'));
    if (sulfate) {
      const other = f.ingredients.filter((i: any) => i !== sulfate).reduce((s: number, i: any) => s + i.percent, 0);
      sulfate.percent = Number((100 - other).toFixed(2));
    }
  } else {
    const water = f.ingredients.find((i: any) => i.name.includes('Water'));
    if (water) {
      const other = f.ingredients.filter((i: any) => i !== water).reduce((s: number, i: any) => s + i.percent, 0);
      water.percent = Number((100 - other).toFixed(2));
    }
  }
}

// Now evaluate all 39!
let validCount = 0;
let failCount = 0;

for (let i = 0; i < formulas.length; i++) {
  const f = formulas[i];
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
  const isOk = status === 'VALID' || status === 'VALID_WITH_WARNINGS' || status === 'LAB_VALIDATION_REQUIRED';
  if (isOk) validCount++;
  else failCount++;

  const issues: string[] = [];
  if (Math.abs(massSum - 100) > 0.01) issues.push(`MassSum=${massSum}%`);
  if (!phPass) issues.push(`pH=${ph} (tgt ${policy.targetPHRange.min}-${policy.targetPHRange.max})`);
  if (!activePass) issues.push(`Active=${activePct}% (tgt ${policy.activeSurfactantRange.min}-${policy.activeSurfactantRange.max}%)`);
  if (!compRes.compatible) issues.push(`Incompat=[${compRes.alerts.map(a => a.title).join('; ')}]`);
  if (qg.blockingIssues.length > 0) issues.push(`Blockers=[${qg.blockingIssues.map(b => b.title).join('; ')}]`);

  console.log(`[${i+1}] ${f.id}: QG=${status} | pH=${ph} | Act=${activePct}% | ${issues.join(' | ') || 'PERFECT'}`);
}

console.log('\n======================================================');
console.log(`TOTAL PASSING (VALID/LAB_READINESS): ${validCount} / 39, FAILED: ${failCount}`);
console.log('======================================================');

import * as fs from 'fs';
fs.writeFileSync('scripts/tuned_39_formulas.json', JSON.stringify(formulas, null, 2));
