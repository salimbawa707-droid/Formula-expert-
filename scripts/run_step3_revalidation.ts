import { FORMULAS } from '../src/data/formulas';
import { normalizeProductCategory, ProductCategoryId } from '../src/domain/productTaxonomy';
import { getScientificProductProfile, getCalculationPolicy } from '../src/domain/scientificProductProfiles';
import { evaluateScientificQualityGate } from '../src/utils/scientificQualityGateEngine';

console.log('Running Step 3: Revalidating all 39 formulas with corrected profiles (BEFORE formula composition changes)...');

const beforeData = [
  { id: 'hd-liquid-laundry', oldProfile: 'LAUNDRY_LIQUID', oldStatus: 'INCOMPATIBLE' },
  { id: 'eco-laundry-liquid', oldProfile: 'LAUNDRY_LIQUID', oldStatus: 'INCOMPATIBLE' },
  { id: 'matic-frontload-enzyme-laundry', oldProfile: 'LAUNDRY_LIQUID', oldStatus: 'INCOMPATIBLE' },
  { id: 'eco-washing-powder', oldProfile: 'LAUNDRY_POWDER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'standard-active-laundry-powder', oldProfile: 'LAUNDRY_POWDER', oldStatus: 'VALID' },
  { id: 'premium-oxy-enzyme-powder', oldProfile: 'LAUNDRY_POWDER', oldStatus: 'INCOMPATIBLE' },
  { id: 'manual-dishwash-gel', oldProfile: 'DISHWASH_MANUAL', oldStatus: 'VALID_WITH_WARNINGS' },
  { id: 'eco-lime-dishwash-gel', oldProfile: 'DISHWASH_MANUAL', oldStatus: 'VALID_WITH_WARNINGS' },
  { id: 'ultra-gentle-apg-dishwash', oldProfile: 'DISHWASH_MANUAL', oldStatus: 'OUT_OF_SPEC' },
  { id: 'auto-dish-liquid', oldProfile: 'DISHWASH_AUTOMATIC', oldStatus: 'INCOMPATIBLE' },
  { id: 'auto-dish-enzyme-gel', oldProfile: 'DISHWASH_AUTOMATIC', oldStatus: 'INCOMPATIBLE' },
  { id: 'commercial-dishwasher-rinse-aid', oldProfile: 'DISHWASH_AUTOMATIC', oldStatus: 'OUT_OF_SPEC' },
  { id: 'pine-disinfectant-floor-cleaner', oldProfile: 'FLOOR_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'neutral-floor-cleaner-restorer', oldProfile: 'FLOOR_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'multi-surface-lavender-floor', oldProfile: 'FLOOR_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'all-purpose-spray-cleaner', oldProfile: 'MULTIPURPOSE_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'eco-citrus-apg-cleaner', oldProfile: 'MULTIPURPOSE_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'economy-household-apc', oldProfile: 'MULTIPURPOSE_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'thick-hcl-toilet-cleaner', oldProfile: 'TOILET_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'eco-organic-acid-toilet-cleaner', oldProfile: 'TOILET_CLEANER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'economy-viscous-acid-bowl', oldProfile: 'TOILET_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'soap-scum-scale-remover', oldProfile: 'BATHROOM_CLEANER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'foam-action-tile-cleaner', oldProfile: 'BATHROOM_CLEANER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'acid-free-disinfectant-bathroom', oldProfile: 'BATHROOM_CLEANER', oldStatus: 'INCOMPATIBLE' },
  { id: 'anti-fog-glass-cleaner', oldProfile: 'GLASS_CLEANER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'ammonia-free-eco-glass', oldProfile: 'GLASS_CLEANER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'economy-blue-window-spray', oldProfile: 'GLASS_CLEANER', oldStatus: 'OUT_OF_SPEC' },
  { id: 'encapsulated-fragrance-softener', oldProfile: 'FABRIC_SOFTENER', oldStatus: 'INCOMPATIBLE' },
  { id: 'ultra-concentrate-softener', oldProfile: 'FABRIC_SOFTENER', oldStatus: 'INCOMPATIBLE' },
  { id: 'economy-fabric-conditioner', oldProfile: 'FABRIC_SOFTENER', oldStatus: 'INCOMPATIBLE' },
  { id: 'antibacterial-handwash-soap', oldProfile: 'HAND_WASH', oldStatus: 'INCOMPATIBLE' },
  { id: 'sulfate-free-nourishing-handwash', oldProfile: 'HAND_WASH', oldStatus: 'VALID' },
  { id: 'economy-pearl-handwash', oldProfile: 'HAND_WASH', oldStatus: 'INCOMPATIBLE' },
  { id: 'heavy-duty-caustic-oven-cleaner', oldProfile: 'KITCHEN_DEGREASER', oldStatus: 'INCOMPATIBLE' },
  { id: 'solvent-kitchen-degreaser', oldProfile: 'KITCHEN_DEGREASER', oldStatus: 'INCOMPATIBLE' },
  { id: 'eco-citrus-solvent-free-degreaser', oldProfile: 'KITCHEN_DEGREASER', oldStatus: 'INCOMPATIBLE' },
  { id: 'touchless-snow-foam-car-shampoo', oldProfile: 'CAR_SHAMPOO', oldStatus: 'INCOMPATIBLE' },
  { id: 'wash-and-wax-car-shampoo', oldProfile: 'CAR_SHAMPOO', oldStatus: 'INCOMPATIBLE' },
  { id: 'economy-auto-wash-liquid', oldProfile: 'CAR_SHAMPOO', oldStatus: 'INCOMPATIBLE' }
];

const results: any[] = [];

for (let i = 0; i < FORMULAS.length; i++) {
  const f = FORMULAS[i];
  const catId = normalizeProductCategory(f.category) as ProductCategoryId;
  const profile = getScientificProductProfile(catId, f.name || f.id);
  const qg = evaluateScientificQualityGate({
    formulaName: f.name,
    formulaVersion: '1.0.0',
    ingredients: f.ingredients as any,
    productCategory: catId,
    waterHardnessPpm: 150
  });

  const b = beforeData[i] || { oldProfile: catId, oldStatus: 'UNKNOWN' };
  const newProfileId = profile.subProfileId || profile.specificationProfileId;
  const newStatus = qg.finalFormulaStatus;

  let reason = 'Unchanged';
  if (b.oldStatus !== newStatus) {
    reason = `Status transition from ${b.oldStatus} to ${newStatus} due to profile realignment`;
  } else if (b.oldProfile !== newProfileId) {
    reason = `Profile mapped to specialized subclass ${newProfileId}; formula composition still needs stoichiometric remediation`;
  } else {
    reason = `Profile unchanged; formula composition requires chemical remediation`;
  }

  results.push({
    formula: f.name,
    id: f.id,
    oldProfile: b.oldProfile,
    newProfile: newProfileId,
    oldStatus: b.oldStatus,
    newStatus,
    reason
  });
}

import * as fs from 'fs';
fs.writeFileSync('test_reports/step3_profile_revalidation.json', JSON.stringify(results, null, 2));
console.log('Step 3 revalidation output saved to test_reports/step3_profile_revalidation.json');
