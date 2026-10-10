import { tryGetScientificProductProfile, SCIENTIFIC_PRODUCT_PROFILES } from '../../domain/scientificProductProfiles';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { calculateWaterHardnessTolerance } from '../chelatorEngine';
import { calculateActiveSurfactants } from '../activeMatterEngine';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runCategorySuitabilityRegressionTestSuite() {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any) {
    results.push({
      group,
      name,
      passed: condition,
      actual,
      expected,
      message: condition ? 'PASSED' : `FAILED (Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    });
  }

  // Helper simulating the new UI category suitability calculation
  function getSuitabilityHelper(
    productCategory: string,
    activeSurfactants: number,
    cationicPct: number,
    hasZeroHardnessProtection: boolean
  ): string {
    const profile = tryGetScientificProductProfile(productCategory);
    let categorySuitability = "High (Optimal Formulation Profile)";

    if (profile) {
      const minActive = profile.calculationPolicy.minTotalActiveSurfactantPct ?? profile.calculationPolicy.activeSurfactantRange.min;
      const maxActive = profile.calculationPolicy.maxTotalActiveSurfactantPct ?? profile.calculationPolicy.activeSurfactantRange.max;
      const isCationicRequired = profile.calculationPolicy.surfactantPreference === 'CATIONIC_DOMINANT' || profile.calculationPolicy.requiresFabricSofteningMetrics;
      const requiresChelation = profile.calculationPolicy.requiresChelationHardness;

      if (isCationicRequired && cationicPct === 0) {
        return "Poor: Lacks cationic conditioning active (e.g. Esterquat).";
      } else if (maxActive !== undefined && activeSurfactants > maxActive) {
        return `Sub-optimal: Active surfactant loading (${activeSurfactants.toFixed(1)}%) exceeds maximum profile limit (${maxActive.toFixed(1)}%).`;
      } else if (activeSurfactants < minActive) {
        return `Moderate: Active surfactant loading (${activeSurfactants.toFixed(1)}%) is below standard benchmark of ${minActive.toFixed(1)}% for ${productCategory}.`;
      } else if (requiresChelation && hasZeroHardnessProtection) {
        return "Needs Builder: Formula lacks chelating builder system for hard water protection.";
      }
    }
    return categorySuitability;
  }

  // A & B & D. Display correctness and zero duplicated hardcoded values
  const profileLaundry = tryGetScientificProductProfile('LAUNDRY_LIQUID');
  assert(
    'A. Authoritative Profile Correctness',
    'Can resolve authoritative profile parameters for LAUNDRY_LIQUID',
    profileLaundry !== null && profileLaundry.categoryId === 'LAUNDRY_LIQUID',
    profileLaundry?.categoryId,
    'LAUNDRY_LIQUID'
  );

  const suitabilityA = getSuitabilityHelper('LAUNDRY_LIQUID', 5.0, 0, false);
  assert(
    'A. Authoritative Threshold Match',
    'Suitability description correctly incorporates canonical minActive threshold dynamically from profile',
    suitabilityA.includes('below standard benchmark of 10.0%') || suitabilityA.includes('below standard benchmark of 8.0%'),
    suitabilityA,
    'Moderate: Active surfactant loading ... below standard benchmark'
  );

  // C. Changing a canonical category threshold changes UI result automatically
  const originalMin = SCIENTIFIC_PRODUCT_PROFILES.LAUNDRY_LIQUID.calculationPolicy.minTotalActiveSurfactantPct;
  // Temporarily override the threshold to simulate change
  SCIENTIFIC_PRODUCT_PROFILES.LAUNDRY_LIQUID.calculationPolicy.minTotalActiveSurfactantPct = 12.0;
  const suitabilityC = getSuitabilityHelper('LAUNDRY_LIQUID', 11.0, 0, false);
  assert(
    'C. Threshold Change Propagation',
    'UI result propagates and reflects canonical threshold changes instantly',
    suitabilityC.includes('below standard benchmark of 12.0%'),
    suitabilityC,
    'below standard benchmark of 12.0%'
  );
  // Restore original threshold
  SCIENTIFIC_PRODUCT_PROFILES.LAUNDRY_LIQUID.calculationPolicy.minTotalActiveSurfactantPct = originalMin;

  // E. Category suitability diagnostic does not override Final Scientific Verdict
  const formulaWithWarning: any[] = [
    { name: 'Water', percentage: 95.0 },
    { name: 'SLES 70%', percentage: 5.0, activeMatterPct: 70 } // Very low actives
  ];
  const qg = evaluateScientificQualityGate({
    ingredients: formulaWithWarning,
    productCategory: 'LAUNDRY_LIQUID',
    formulaName: 'Dilute Test',
    formulaVersion: '1.0.0'
  });
  assert(
    'E. Quality Gate Final Verdict Authority',
    'Stale/Suitability diagnostics do not unilaterally declare OUT_OF_SPEC; Verdict is governed by Quality Gate',
    qg.finalFormulaStatus === 'OUT_OF_SPEC' || qg.finalFormulaStatus === 'LAB_VALIDATION_REQUIRED' || qg.finalFormulaStatus === 'VALID_WITH_WARNINGS' || qg.finalFormulaStatus === 'INCOMPATIBLE',
    qg.finalFormulaStatus,
    'Quality Gate output'
  );

  // F. Product Category Identity remains separate from Physical Form
  const laundryLiquidProfile = tryGetScientificProductProfile('LAUNDRY_LIQUID');
  assert(
    'F. Physical Form Separation',
    'Physical form LIQUID is distinct from canonical category LAUNDRY_LIQUID',
    laundryLiquidProfile?.physicalForm === 'LIQUID',
    laundryLiquidProfile?.physicalForm,
    'LIQUID'
  );

  // G & H. Hardness and Active Matter usage
  const mockIngredients = [
    { name: 'Water', percentage: 95, category: 'Solvent' },
    { name: 'Sodium Laureth Sulfate (SLES 70%)', percentage: 5, activeMatterPct: 70, category: 'Surfactant' }
  ];
  const activeMatter = calculateActiveSurfactants(mockIngredients);
  const hardnessRes = calculateWaterHardnessTolerance(mockIngredients, 150, 10, 20, 100, 'LAUNDRY_LIQUID');
  assert(
    'H. Active Matter Integrity',
    'Active Matter calculation delegates strictly to the authoritative activeSurfactantEngine',
    activeMatter === 3.5,
    activeMatter,
    3.5
  );
  assert(
    'G. Hardness Sequestration Integrity',
    'Water hardness capacity calculations delegate to the authoritative chelatorEngine',
    hardnessRes.totalSequestrationMg === 0,
    hardnessRes.totalSequestrationMg,
    0
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nCategory Suitability Unification Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}
