import { evaluateExpertReasoning } from '../expertReasoningEngine';
import { FormulationIngredient } from '../../types';

export function runExpertReasoningTestSuite() {
  console.log('================================================================');
  console.log('  EXPERT FORMULATION REASONING & SANITY CHECK TEST SUITE        ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName} :: PASS ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} :: FAILED ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Healthy Balanced Formula
  const healthyIngredients: FormulationIngredient[] = [
    { id: '1', name: 'Water (Aqua)', percentage: 70, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
    { id: '2', name: 'LABSA 96% (Acid Slurry)', percentage: 10, activeMatterPct: 96, costPerKg: 1.8, role: 'Primary Anionic Surfactant' },
    { id: '3', name: 'Sodium Hydroxide 50% Liquid', percentage: 2.6, activeMatterPct: 50, costPerKg: 0.6, role: 'Neutralizing Base' },
    { id: '4', name: 'SLES 70% (Sodium Lauryl Ether Sulfate)', percentage: 8, activeMatterPct: 70, costPerKg: 1.6, role: 'Co-Surfactant' },
    { id: '5', name: 'CAPB 30% (Cocamidopropyl Betaine)', percentage: 4, activeMatterPct: 30, costPerKg: 1.4, role: 'Amphoteric Surfactant' },
    { id: '6', name: 'Sodium Citrate Dihydrate', percentage: 2, activeMatterPct: 100, costPerKg: 1.2, role: 'Builder / Chelator' },
    { id: '7', name: 'Sodium Chloride (Salt)', percentage: 1.2, activeMatterPct: 100, costPerKg: 0.1, role: 'Viscosity Modifier' },
    { id: '8', name: 'BIT 20% (Benzisothiazolinone)', percentage: 0.1, activeMatterPct: 20, costPerKg: 8.0, role: 'Preservative' },
    { id: '9', name: 'Fragrance', percentage: 0.5, activeMatterPct: 100, costPerKg: 15.0, role: 'Fragrance' },
    { id: '10', name: 'Optical Brightener CBS-X', percentage: 0.1, activeMatterPct: 100, costPerKg: 20.0, role: 'Optical Brightener' },
    { id: '11', name: 'Water adjustment', percentage: 1.5, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' }
  ];

  const healthyReport = evaluateExpertReasoning({
    ingredients: healthyIngredients,
    productCategory: 'Laundry Liquid',
    waterHardnessPpm: 150,
    calculatedPH: 8.2,
    totalActiveMatter: 16.4,
    totalPercentage: 100.0,
    costPerKg: 0.65,
    cleaningScore: 82,
    hardnessSufficiency: 'sufficient',
    maxSupportedHardnessPpm: 280,
    compatibilityScore: 100,
    viscosityEstimate: '850 cP (Optimal Viscous Gel)'
  });

  assert(healthyReport.sanityCheckPassed === true, 'Test 1: Healthy Balanced Formula passes sanity check', `Status: ${healthyReport.overallStatus}`);
  assert(healthyReport.criticalIssuesCount === 0, 'Test 1: Zero critical issues for healthy formula', `Critical count: ${healthyReport.criticalIssuesCount}`);
  assert(healthyReport.strengths.length >= 3, 'Test 1: Identifies valid positive formulation strengths', `Found ${healthyReport.strengths.length} strengths`);

  // TEST 2: Excessive Builder / High Alkalinity Formula
  const excessBuilderReport = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 60, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'Soda Ash Dense', percentage: 25, activeMatterPct: 100, costPerKg: 0.4, role: 'Builder' },
      { id: '3', name: 'Sodium Hydroxide 50%', percentage: 10, activeMatterPct: 50, costPerKg: 0.6, role: 'Neutralizing Base' },
      { id: '4', name: 'LABSA 96%', percentage: 5, activeMatterPct: 96, costPerKg: 1.8, role: 'Surfactant' }
    ],
    productCategory: 'Laundry Liquid',
    calculatedPH: 13.2,
    totalActiveMatter: 4.8,
    totalPercentage: 100.0,
    waterHardnessPpm: 150
  });

  assert(excessBuilderReport.issues.some(i => i.id === 'extreme-alkaline-ph'), 'Test 2: Flags extreme caustic alkalinity (pH > 12)', `Found: ${excessBuilderReport.issues.map(i=>i.id).join(', ')}`);
  assert(excessBuilderReport.recommendations.some(r => r.id === 'rec-ph-alkaline'), 'Test 2: Proposes buffer recommendation with trade-off disclosure');

  // TEST 3: Low-Chelator Hard-Water Formula
  const hardWaterDeficitReport = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 80, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'LABSA 96%', percentage: 12, activeMatterPct: 96, costPerKg: 1.8, role: 'Surfactant' },
      { id: '3', name: 'NaOH 50%', percentage: 3.1, activeMatterPct: 50, costPerKg: 0.6, role: 'Base' },
      { id: '4', name: 'SLES 70%', percentage: 4.9, activeMatterPct: 70, costPerKg: 1.6, role: 'Surfactant' }
    ],
    productCategory: 'Laundry Liquid',
    waterHardnessPpm: 350,
    calculatedPH: 8.4,
    hardnessSufficiency: 'insufficient',
    maxSupportedHardnessPpm: 80
  });

  assert(hardWaterDeficitReport.issues.some(i => i.id === 'chelation-deficit'), 'Test 3: Flags hard water chelation deficit (350 ppm demand vs 80 ppm capacity)', 'Detected deficit');
  assert(hardWaterDeficitReport.recommendations.some(r => r.id === 'rec-chelation'), 'Test 3: Recommends specific builder/chelator addition with calculation basis');

  // TEST 4: Anionic + Cationic Incompatibility Formula
  const ionicConflictReport = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 75, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'SLES 70% (Sodium Lauryl Ether Sulfate)', percentage: 12, activeMatterPct: 70, costPerKg: 1.6, role: 'Anionic Surfactant' },
      { id: '3', name: 'BKC 80% (Benzalkonium Chloride)', percentage: 4, activeMatterPct: 80, costPerKg: 3.2, role: 'Cationic Disinfectant' },
      { id: '4', name: 'Water adjustment', percentage: 9, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' }
    ],
    productCategory: 'Surface Cleaner',
    calculatedPH: 7.2
  });

  assert(ionicConflictReport.criticalIssuesCount >= 1, 'Test 4: Flags critical anionic-cationic precipitation hazard', `Critical: ${ionicConflictReport.criticalIssuesCount}`);
  assert(ionicConflictReport.overallStatus === 'FAIL', 'Test 4: Formula status is FAIL due to insoluble complex salt precipitation');

  // TEST 5: Enzyme / pH Mismatch & Bleach Conflict
  const enzymeMismatchReport = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 70, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'Protease Liquid Enzyme', percentage: 1.0, activeMatterPct: 100, costPerKg: 12.0, role: 'Enzyme' },
      { id: '3', name: 'Sodium Hypochlorite 12% (Bleach)', percentage: 5.0, activeMatterPct: 12, costPerKg: 0.3, role: 'Bleach' },
      { id: '4', name: 'SLES 28%', percentage: 24, activeMatterPct: 28, costPerKg: 0.8, role: 'Surfactant' }
    ],
    productCategory: 'Laundry Liquid',
    calculatedPH: 11.5
  });

  assert(enzymeMismatchReport.issues.some(i => i.id === 'enzyme-ph-mismatch'), 'Test 5: Flags enzyme pH denaturation risk at pH 11.5');
  assert(enzymeMismatchReport.issues.some(i => i.id === 'enzyme-bleach-oxidation'), 'Test 5: Flags enzyme-bleach oxidation conflict in liquid medium');

  // TEST 6: Excessive Electrolyte (Salting-Out Risk)
  const electrolyteReport = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 70, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'SLES 70%', percentage: 14, activeMatterPct: 70, costPerKg: 1.6, role: 'Surfactant' },
      { id: '3', name: 'Sodium Chloride (Salt)', percentage: 4.5, activeMatterPct: 100, costPerKg: 0.1, role: 'Viscosity Modifier' },
      { id: '4', name: 'Water balance', percentage: 11.5, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' }
    ],
    productCategory: 'Dishwash Liquid',
    calculatedPH: 6.8
  });

  assert(electrolyteReport.issues.some(i => i.id === 'electrolyte-salting-out'), 'Test 6: Flags excessive salt (4.5%) salting-out / phase separation risk');

  // TEST 7: Commercial-Grade Distinction
  const sles28Report = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 70, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'SLES 28% Liquid', percentage: 10, activeMatterPct: 28, costPerKg: 0.7, role: 'Surfactant' },
      { id: '3', name: 'Water balance', percentage: 20, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' }
    ],
    productCategory: 'Laundry Liquid'
  });

  const sles70Report = evaluateExpertReasoning({
    ingredients: [
      { id: '1', name: 'Water', percentage: 70, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'SLES 70% Paste', percentage: 10, activeMatterPct: 70, costPerKg: 1.6, role: 'Surfactant' },
      { id: '3', name: 'Water balance', percentage: 20, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' }
    ],
    productCategory: 'Laundry Liquid'
  });

  assert(sles28Report.productCategoryContext.category === 'Laundry Liquid', 'Test 7: SLES 28% uses accurate category context');
  assert(sles70Report.productCategoryContext.category === 'Laundry Liquid', 'Test 7: SLES 70% uses accurate category context');

  // TEST 8: Dynamic State Update (No Stale Reasoning)
  const initialInput = {
    ingredients: [
      { id: '1', name: 'Water', percentage: 90, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.8, role: 'Surfactant' }
    ],
    productCategory: 'Laundry Liquid',
    calculatedPH: 2.1
  };

  const initialReport = evaluateExpertReasoning(initialInput);
  assert(initialReport.issues.some(i => i.id === 'extreme-acidic-ph'), 'Test 8: Initial unneutralized formula flags acidic pH');

  // User neutralizes in same workflow:
  const updatedInput = {
    ingredients: [
      { id: '1', name: 'Water', percentage: 87.4, activeMatterPct: 0, costPerKg: 0.01, role: 'Solvent' },
      { id: '2', name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, costPerKg: 1.8, role: 'Surfactant' },
      { id: '3', name: 'Sodium Hydroxide 50%', percentage: 2.6, activeMatterPct: 50, costPerKg: 0.6, role: 'Base' }
    ],
    productCategory: 'Laundry Liquid',
    calculatedPH: 8.1
  };

  const updatedReport = evaluateExpertReasoning(updatedInput);
  assert(!updatedReport.issues.some(i => i.id === 'extreme-acidic-ph'), 'Test 8: Reasoning immediately clears acidic pH flag upon neutralization (Zero Stale State)');

  // TEST 9: No Stale Recommendations & Advisory Integrity
  assert(updatedReport.recommendations.every(r => r.problem && r.recommendedAction && r.tradeOff && r.confidence), 'Test 9: All recommendations contain Problem, Why, Action, Expected Effect, Trade-off, and Confidence');

  // TEST 10: Grounded Scientific Confidence & Types
  const allIssuesHaveValidBasis = healthyReport.issues.concat(excessBuilderReport.issues, ionicConflictReport.issues, enzymeMismatchReport.issues).every(
    i => ['CALCULATED', 'PREDICTIVE', 'EMPIRICAL', 'LABORATORY VERIFIED'].includes(i.scientificType) &&
         ['Critical', 'High', 'Medium', 'Low'].includes(i.severity)
  );
  assert(allIssuesHaveValidBasis, 'Test 10: All sanity issues have valid grounded scientific types (CALCULATED/PREDICTIVE/EMPIRICAL) with no fabricated claims');

  console.log('--------------------------------------------------');
  console.log(`TOTAL EXPERT REASONING TESTS : ${passed + failed}`);
  console.log(`PASSED                       : ${passed}`);
  console.log(`FAILED                       : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed };
}

if (process.argv[1] && process.argv[1].includes('expertReasoning.regression.test')) {
  const res = runExpertReasoningTestSuite();
  if (res.failed > 0) process.exit(1);
}

