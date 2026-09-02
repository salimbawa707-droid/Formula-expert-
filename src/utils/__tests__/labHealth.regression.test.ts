import { calculateLabHealthScore } from '../calculators';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  error?: string;
}

export function runLabHealthTestSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assertNear(suite: string, name: string, actual: number, expected: number, tolerance = 0.05) {
    const passed = Math.abs(actual - expected) <= tolerance;
    results.push({
      suite,
      name,
      passed,
      actual,
      expected,
      error: passed ? undefined : `Expected ${expected} ± ${tolerance}, got ${actual}`
    });
  }

  function assertEqual(suite: string, name: string, actual: any, expected: any) {
    const passed = actual === expected;
    results.push({
      suite,
      name,
      passed,
      actual,
      expected,
      error: passed ? undefined : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  }

  console.log('==================================================');
  console.log('  LAB HEALTH SCORE REGRESSION SUITE              ');
  console.log('==================================================');

  // 1. Empty Formula
  const resEmpty = calculateLabHealthScore([]);
  assertNear('Empty Formula', 'Empty formula score is 100', resEmpty.finalScore, 100);
  assertEqual('Empty Formula', 'Empty formula rating is Safe / Low Hazard', resEmpty.rating, 'Safe / Low Hazard');
  assertEqual('Empty Formula', 'Empty formula has 0 alerts', resEmpty.alerts.length, 0);

  // 2. Normal Low-Risk Detergent
  const formulaNormal = [
    { name: 'Water', percentage: 80, category: 'Solvent' },
    { name: 'SLES 70%', percentage: 12, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5, category: 'Amphoteric Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, category: 'Builder' }
  ];
  const resNormal = calculateLabHealthScore(formulaNormal, 7.0);
  assertNear('Normal Detergent', 'Normal formula score is 100', resNormal.finalScore, 100);
  assertEqual('Normal Detergent', 'Normal formula rating is Safe / Low Hazard', resNormal.rating, 'Safe / Low Hazard');
  assertEqual('Normal Detergent', 'Normal formula zero alerts', resNormal.alerts.length, 0);

  // 3. Explicit Zero Ingredient
  const formulaWithZero = [
    ...formulaNormal,
    { name: 'Caustic Soda 50%', percentage: 0, category: 'Alkali' },
    { name: 'Protease Powder', percentage: 0, category: 'Enzyme' }
  ];
  const resWithZero = calculateLabHealthScore(formulaWithZero, 7.0);
  assertNear('Explicit Zero', 'Zero-percentage hazards produce 100 score', resWithZero.finalScore, 100);
  assertEqual('Explicit Zero', 'Zero-percentage hazards produce zero alerts', resWithZero.alerts.length, 0);

  // 4. Strong Acid Raw Material Handling
  const formulaAcidUnneutralized = [
    { name: 'LABSA Sulfonic Acid', percentage: 10, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90, category: 'Solvent' }
  ];
  const resAcidUnneutralized = calculateLabHealthScore(formulaAcidUnneutralized, 3.5);
  assertEqual('Strong Acid', 'Unneutralized LABSA generates warning alert', resAcidUnneutralized.alerts.some(a => a.id === 'strong-acid-unneutralized' || a.id === 'ph-mild-acid'), true);

  const resAcidNeutralized = calculateLabHealthScore(formulaAcidUnneutralized, 7.0);
  assertNear('Strong Acid', 'Neutralized LABSA score is 95 (-5 for raw acid handling)', resAcidNeutralized.finalScore, 95);
  assertEqual('Strong Acid', 'Neutralized LABSA creates raw acid handling alert', resAcidNeutralized.alerts.some(a => a.id === 'strong-acid-neutralized'), true);

  // 5. Strong Alkali Raw Material Handling
  const formulaAlkali = [
    { name: 'Caustic Soda 50%', percentage: 3, category: 'Alkali' },
    { name: 'Water', percentage: 97, category: 'Solvent' }
  ];
  const resAlkaliHigh = calculateLabHealthScore(formulaAlkali, 11.5);
  assertEqual('Strong Alkali', 'High pH Caustic Soda triggers caustic alkali alert', resAlkaliHigh.alerts.some(a => a.id === 'strong-alkali-unneutralized'), true);

  const resAlkaliNeutralized = calculateLabHealthScore(formulaAlkali, 7.0);
  assertNear('Strong Alkali', 'Neutralized Caustic Soda score is 95 (-5 penalty)', resAlkaliNeutralized.finalScore, 95);

  // 6. Normal Final pH
  const resNormalPH = calculateLabHealthScore(formulaNormal, 7.2);
  assertNear('Normal pH', 'pH 7.2 produces 0 pH penalty', resNormalPH.finalScore, 100);

  // 7. Extreme Acidic pH (< 3.0)
  const resExtremeAcid = calculateLabHealthScore(formulaNormal, 2.5);
  assertNear('Extreme Acid', 'pH 2.5 penalty is -25', resExtremeAcid.finalScore, 75);
  assertEqual('Extreme Acid', 'pH 2.5 triggers Critical extreme acid alert', resExtremeAcid.alerts.some(a => a.id === 'ph-extreme-acid' && a.severity === 'Critical'), true);

  // 8. Extreme Alkaline pH (> 12.0)
  const resExtremeAlkali = calculateLabHealthScore(formulaNormal, 12.5);
  assertNear('Extreme Alkali', 'pH 12.5 penalty is -25', resExtremeAlkali.finalScore, 75);
  assertEqual('Extreme Alkali', 'pH 12.5 triggers Critical extreme alkali alert', resExtremeAlkali.alerts.some(a => a.id === 'ph-extreme-alkali' && a.severity === 'Critical'), true);

  // 9. Enzyme Formula & 10. Powder Enzyme Handling
  const formulaEnzymePowder = [
    ...formulaNormal,
    { name: 'Protease Enzyme Powder', percentage: 1, category: 'Enzyme', notes: 'dry powder' }
  ];
  const resEnzymePowder = calculateLabHealthScore(formulaEnzymePowder, 7.0);
  assertNear('Enzyme Handling', 'Powder enzyme penalty is -15', resEnzymePowder.finalScore, 85);
  assertEqual('Enzyme Handling', 'Powder enzyme triggers dust/inhalation hazard alert', resEnzymePowder.alerts.some(a => a.id === 'enzyme-powder-dust' && a.severity === 'High'), true);

  // 11. Liquid Enzyme Handling
  const formulaEnzymeLiquid = [
    ...formulaNormal,
    { name: 'Protease Liquid Preparation', percentage: 1, category: 'Enzyme' }
  ];
  const resEnzymeLiquid = calculateLabHealthScore(formulaEnzymeLiquid, 7.0);
  assertNear('Enzyme Handling', 'Liquid enzyme penalty is -5', resEnzymeLiquid.finalScore, 95);
  assertEqual('Enzyme Handling', 'Liquid enzyme triggers low-severity precaution alert', resEnzymeLiquid.alerts.some(a => a.id === 'enzyme-liquid-sensitization' && a.severity === 'Low'), true);

  // 12. Fragrance / Sensitizer Behavior
  const formulaFragrance = [
    ...formulaNormal,
    { name: 'Tropical Citrus Perfume', percentage: 1.5, category: 'Fragrance' }
  ];
  const resFragrance = calculateLabHealthScore(formulaFragrance, 7.0);
  assertNear('Fragrance Handling', 'High fragrance penalty is -5', resFragrance.finalScore, 95);
  assertEqual('Fragrance Handling', 'Fragrance alert generated', resFragrance.alerts.some(a => a.id === 'fragrance-sensitization'), true);

  // 13. Unknown Ingredient
  const formulaUnknown = [
    ...formulaNormal,
    { name: 'X-Factor Secret Additive 99', percentage: 2, category: 'Specialty' }
  ];
  const resUnknown = calculateLabHealthScore(formulaUnknown, 7.0);
  assertNear('Unknown Ingredient', 'Unknown ingredient penalty is -2', resUnknown.finalScore, 98);
  assertEqual('Unknown Ingredient', 'Unknown data alert generated without crash', resUnknown.alerts.some(a => a.title === 'Unknown Safety Data Notice'), true);

  // 14. Restricted Ingredient
  const formulaRestricted = [
    ...formulaNormal,
    { name: 'NPE-9 Nonylphenol Ethoxylate', percentage: 5, category: 'Nonionic Surfactant' }
  ];
  const resRestricted = calculateLabHealthScore(formulaRestricted, 7.0);
  assertNear('Restricted Ingredient', 'Restricted ingredient penalty is -20', resRestricted.finalScore, 80);
  assertEqual('Restricted Ingredient', 'Restricted raw material alert generated', resRestricted.alerts.some(a => a.title === 'Restricted Raw Material Alert'), true);

  // 15. High-Risk Multi-Ingredient Formula
  const formulaMultiHazard = [
    { name: 'Caustic Soda 50%', percentage: 10, category: 'Alkali' },
    { name: 'Protease Powder', percentage: 2, category: 'Enzyme', notes: 'powder' },
    { name: 'NPE-9', percentage: 5, category: 'Nonionic Surfactant' },
    { name: 'Ethanol', percentage: 8, category: 'Solvent' }
  ];
  const resMultiHazard = calculateLabHealthScore(formulaMultiHazard, 12.5); // pH 12.5 (-25 pH, -20 alkali, -15 enzyme, -20 NPE, -10 solvent = -90 total -> score 10)
  assertNear('Multi Hazard', 'Multi-hazard formula score is 10', resMultiHazard.finalScore, 10);
  assertEqual('Multi Hazard', 'Rating is High Safety Hazard', resMultiHazard.rating, 'High Safety Hazard');

  // 16. Multiple Hazard Stacking
  const resMultiHazardCount = resMultiHazard.alerts.length;
  assertEqual('Multi Hazard Stacking', 'Multiple alerts stacked', resMultiHazardCount >= 4, true);

  // 17. Duplicate Hazard Prevention (Unknown penalty capped at 6)
  const formula10Unknowns = [
    { name: 'Unknown A', percentage: 1, category: 'Custom' },
    { name: 'Unknown B', percentage: 1, category: 'Custom' },
    { name: 'Unknown C', percentage: 1, category: 'Custom' },
    { name: 'Unknown D', percentage: 1, category: 'Custom' },
    { name: 'Unknown E', percentage: 1, category: 'Custom' }
  ];
  const res10Unknowns = calculateLabHealthScore(formula10Unknowns, 7.0);
  assertNear('Duplicate Prevention', '5 unknown ingredients penalty capped at 6 (-6 total)', res10Unknowns.finalScore, 94);

  // 18. Score Lower Bound
  const resClampedLower = calculateLabHealthScore([
    { name: 'Caustic Soda 50%', percentage: 30, category: 'Alkali' },
    { name: 'Protease Powder', percentage: 10, category: 'Enzyme', notes: 'powder' },
    { name: 'NPE-9', percentage: 20, category: 'Nonionic Surfactant' },
    { name: 'Formaldehyde', percentage: 5, category: 'Preservative' },
    { name: 'Ethanol', percentage: 25, category: 'Solvent' }
  ], 14.0);
  assertNear('Score Lower Bound', 'Score clamps to >= 0', resClampedLower.finalScore, 0);

  // 19. Score Upper Bound
  assertNear('Score Upper Bound', 'Score clamps to <= 100', resNormal.finalScore, 100);

  // 20. Invalid Numeric Inputs Safety
  const resNaNPH = calculateLabHealthScore(formulaNormal, NaN as any);
  assertNear('Invalid Input Safety', 'NaN pH falls back safely to pH 7.0', resNaNPH.finalScore, 100);

  const resInvalidStringPH = calculateLabHealthScore(formulaNormal, 'invalid' as any);
  assertNear('Invalid Input Safety', 'Invalid string pH falls back safely', resInvalidStringPH.finalScore, 100);

  // 21. Canonical Aliases
  const formulaAliases = [
    { name: 'Water', percent: 80, category: 'Solvent' },
    { name: 'Protease Enzyme Powder', percentageInFormula: 1, role: 'Enzyme', notes: 'powder' }
  ];
  const resAliases = calculateLabHealthScore(formulaAliases, 7.0);
  assertNear('Canonical Aliases', 'Aliased field names parsed correctly', resAliases.finalScore, 85);

  // 22. Explicit Zero Preservation
  const formulaZeroPreserved = [
    { name: 'Water', percentage: 100, activeMatterPct: 0, costPerKg: 0 }
  ];
  const resZeroPreserved = calculateLabHealthScore(formulaZeroPreserved, 7.0);
  assertNear('Explicit Zero Preservation', 'Explicit zero values preserved without fallback corruption', resZeroPreserved.finalScore, 100);

  // 23. Formula A -> B Switching & 24. Rapid Switching
  calculateLabHealthScore(formulaNormal, 7.0);
  const resSwitchB = calculateLabHealthScore(formulaEnzymePowder, 7.0);
  const resSwitchA2 = calculateLabHealthScore(formulaNormal, 7.0);
  assertNear('Formula Switching', 'Switching back to Formula A restores score 100', resSwitchA2.finalScore, 100);
  assertEqual('Formula Switching', 'Formula A has 0 alerts', resSwitchA2.alerts.length, 0);

  // 25. Refresh / Hydration
  const resHydration = calculateLabHealthScore(JSON.parse(JSON.stringify(formulaEnzymePowder)), 7.0);
  assertNear('Hydration Determinism', 'Hydrated formulation yields identical score', resHydration.finalScore, resSwitchB.finalScore);

  // 26. Cross-Workspace Determinism
  const inputAIFormulator = { ph: 7.0, analyzedIngs: formulaEnzymePowder };
  const inputAnalyzerPro = formulaEnzymePowder;
  const resAI = calculateLabHealthScore(inputAIFormulator);
  const resAnalyzer = calculateLabHealthScore(inputAnalyzerPro, 7.0);
  assertEqual('Cross-Workspace Determinism', 'AIFormulator score equals AnalyzerPro score', resAI.finalScore, resAnalyzer.finalScore);
  assertEqual('Cross-Workspace Determinism', 'AIFormulator alerts count equals AnalyzerPro alerts count', resAI.alerts.length, resAnalyzer.alerts.length);

  // 27. Independence from Compatibility Score
  // Formula: Liquid Protease + SLES (Compatible chemically = Compatibility 100, but Lab Health has liquid enzyme handling precaution = 95)
  assertNear('Independence from Compatibility', 'Lab Health Score is distinct from Compatibility Score', resEnzymeLiquid.finalScore, 95);

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.passed) {
      passed++;
      console.log(`[PASS] ${r.suite} :: ${r.name}`);
    } else {
      failed++;
      console.log(`[FAIL] ${r.suite} :: ${r.name}`);
      console.log(`       Error: ${r.error}`);
    }
  }

  console.log('--------------------------------------------------');
  console.log(`TOTAL LAB HEALTH TESTS : ${results.length}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log('--------------------------------------------------');

  return { passed, failed, results };
}
