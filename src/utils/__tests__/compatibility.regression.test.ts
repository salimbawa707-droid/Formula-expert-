import { calculateFormulationCompatibility } from '../calculators';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  error?: string;
}

export function runCompatibilityTestSuite(): { passed: number; failed: number; results: TestResult[] } {
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
      error: passed ? undefined : `Expected ${expected}, got ${actual}`
    });
  }

  // 1. Empty Formula
  const resEmpty = calculateFormulationCompatibility([], 7.5);
  assertNear('Empty Formula', 'Empty formula score is 100', resEmpty.compatibilityScore, 100);
  assertEqual('Empty Formula', 'Empty formula compatible is true', resEmpty.compatible, true);
  assertEqual('Empty Formula', 'Empty formula has 0 alerts', resEmpty.alerts.length, 0);

  // 2. Anionic Surfactant Only
  const formulaAnionicOnly = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 89.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resAnionicOnly = calculateFormulationCompatibility(formulaAnionicOnly as any, 7.5);
  assertNear('Anionic Only', 'Anionic-only score is 100', resAnionicOnly.compatibilityScore, 100);
  assertEqual('Anionic Only', 'Anionic-only zero alerts', resAnionicOnly.alerts.length, 0);

  // 3. Cationic Surfactant Only
  const formulaCationicOnly = [
    { name: 'Cetrimonium Chloride', percentage: 5, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 94.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resCationicOnly = calculateFormulationCompatibility(formulaCationicOnly as any, 7.0);
  assertNear('Cationic Only', 'Cationic-only score is 100', resCationicOnly.compatibilityScore, 100);
  assertEqual('Cationic Only', 'Cationic-only zero alerts', resCationicOnly.alerts.length, 0);

  // 4. Anionic + Cationic Interaction Hazard
  const formulaIncompatible = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 2, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Phenoxyethanol', percentage: 0.5, activeMatterPct: 100, category: 'Preservative' },
    { name: 'Water', percentage: 87.5, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resIncompatible = calculateFormulationCompatibility(formulaIncompatible as any, 7.0);
  assertNear('Ionic Incompatibility', 'Anionic + Cationic interaction penalty (-30)', resIncompatible.compatibilityScore, 70);
  assertEqual('Ionic Incompatibility', 'Incompatible status flag', resIncompatible.compatible, false);
  assertEqual('Ionic Incompatibility', 'Interaction hazard alert present', resIncompatible.alerts.some(a => a.id === 'anionic-cationic-incompatibility'), true);

  // 5. Zero-Percent Cationic Surfactant Safety
  const formulaZeroCationic = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 0, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 89.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resZeroCationic = calculateFormulationCompatibility(formulaZeroCationic as any, 7.0);
  assertNear('Explicit Zero Safety', 'Explicit zero cationic surfactant produces 100%', resZeroCationic.compatibilityScore, 100);
  assertEqual('Explicit Zero Safety', 'Compatible boolean for zero cationic', resZeroCationic.compatible, true);

  // 6. High Water Activity without Preservative
  const formulaNoPreservative = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resNoPreservative = calculateFormulationCompatibility(formulaNoPreservative as any, 7.5);
  assertNear('Preservative Requirements', 'Missing preservative score penalty (-10)', resNoPreservative.compatibilityScore, 90);
  assertEqual('Preservative Requirements', 'Missing preservative alert created', resNoPreservative.alerts[0]?.id, 'missing-preservative');

  // 7. High Water Activity with Preservative
  const formulaWithPreservative = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Phenoxyethanol', percentage: 0.8, activeMatterPct: 100, category: 'Preservative' },
    { name: 'Water', percentage: 89.2, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resWithPreservative = calculateFormulationCompatibility(formulaWithPreservative as any, 7.5);
  assertNear('Preservative Requirements', 'High water with preservative produces 100%', resWithPreservative.compatibilityScore, 100);
  assertEqual('Preservative Requirements', 'Zero alerts with preservative', resWithPreservative.alerts.length, 0);

  // 8. Powder / Low Water Formula (<20% Water)
  const formulaPowder = [
    { name: 'Sodium Carbonate', percentage: 50, category: 'Builder' },
    { name: 'Sodium Sulfate', percentage: 45, category: 'Filler' },
    { name: 'LABSA 96%', percentage: 5, activeMatterPct: 96, category: 'Anionic Surfactant' }
  ];
  const resPowder = calculateFormulationCompatibility(formulaPowder as any, 10.5);
  assertNear('Powder / Low-Water', 'Low-water powder formula produces 100% without preservative alert', resPowder.compatibilityScore, 100);
  assertEqual('Powder / Low-Water', 'No missing-preservative alert for low-water formula', resPowder.alerts.some(a => a.id === 'missing-preservative'), false);

  // 9. Preservative at Normal pH (pH 7.0)
  const resPreservativeNormalPH = calculateFormulationCompatibility(formulaWithPreservative as any, 7.0);
  assertNear('Preservative Stability', 'Preservative at normal pH score is 100', resPreservativeNormalPH.compatibilityScore, 100);
  assertEqual('Preservative Stability', 'No alkaline mismatch alert at pH 7.0', resPreservativeNormalPH.alerts.some(a => a.id === 'preservative-ph-mismatch'), false);

  // 10. Preservative at High pH (pH 9.0)
  const resPreservativeHighPH = calculateFormulationCompatibility(formulaWithPreservative as any, 9.0);
  assertNear('Preservative Stability', 'Preservative at high pH penalty (-10)', resPreservativeHighPH.compatibilityScore, 90);
  assertEqual('Preservative Stability', 'Alkaline mismatch alert present at pH 9.0', resPreservativeHighPH.alerts.some(a => a.id === 'preservative-ph-mismatch'), true);

  // 11. Enzyme at Normal pH (pH 7.5)
  const formulaEnzymeNormal = [
    { name: 'Protease Enzyme', percentage: 1, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 98.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resEnzymeNormal = calculateFormulationCompatibility(formulaEnzymeNormal as any, 7.5);
  assertNear('Enzyme Stability', 'Enzyme at normal pH score is 100', resEnzymeNormal.compatibilityScore, 100);

  // 12. Enzyme at Low pH (pH 4.5)
  const resEnzymeLow = calculateFormulationCompatibility(formulaEnzymeNormal as any, 4.5);
  assertNear('Enzyme Stability', 'Enzyme low pH stability penalty (-15)', resEnzymeLow.compatibilityScore, 85);
  assertEqual('Enzyme Stability', 'Denaturation alert present at low pH', resEnzymeLow.alerts.some(a => a.id === 'enzyme-ph-denaturation'), true);

  // 13. Enzyme at High pH (pH 11.0)
  const formulaEnzymeLowWater = [
    { name: 'Protease Enzyme', percentage: 1, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Glycerin', percentage: 80, activeMatterPct: 100, category: 'Solvent' },
    { name: 'Water', percentage: 19, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resEnzymeHigh = calculateFormulationCompatibility(formulaEnzymeLowWater as any, 11.0);
  assertNear('Enzyme Stability', 'Enzyme high pH stability penalty (-15)', resEnzymeHigh.compatibilityScore, 85);
  assertEqual('Enzyme Stability', 'Denaturation alert present at high pH', resEnzymeHigh.alerts.some(a => a.id === 'enzyme-ph-denaturation'), true);

  // 14. Extreme Acidic pH (pH 2.99)
  const formulaExtremeAcid = [
    { name: 'Citric Acid', percentage: 15, category: 'pH Adjuster' },
    { name: 'Kathon CG', percentage: 0.1, category: 'Preservative' },
    { name: 'Water', percentage: 84.9, category: 'Solvent' }
  ];
  const resExtremeAcid = calculateFormulationCompatibility(formulaExtremeAcid as any, 2.99);
  assertNear('Extreme pH Hazard', 'pH 2.99 triggers extreme pH penalty (-20)', resExtremeAcid.compatibilityScore, 80);
  assertEqual('Extreme pH Hazard', 'Extreme acid alert present', resExtremeAcid.alerts.some(a => a.id === 'extreme-ph-hazard'), true);

  // 15. Extreme Alkaline pH (pH 12.01)
  const formulaExtremeAlkali = [
    { name: 'Sodium Hydroxide', percentage: 10, category: 'pH Adjuster' },
    { name: 'Water', percentage: 90, category: 'Solvent' }
  ];
  const resExtremeAlkali = calculateFormulationCompatibility(formulaExtremeAlkali as any, 12.01);
  assertEqual('Extreme pH Hazard', 'pH 12.01 triggers extreme pH alert', resExtremeAlkali.alerts.some(a => a.id === 'extreme-ph-hazard'), true);
  assertEqual('Extreme pH Hazard', 'Compatible is false for pH 12.01', resExtremeAlkali.compatible, false);

  // 16. High Active Matter Without Hydrotrope (>40%)
  const formulaHighActiveNoHydrotrope = [
    { name: 'LABSA 96%', percentage: 30, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 25, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 44.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resHighActiveNoHydrotrope = calculateFormulationCompatibility(formulaHighActiveNoHydrotrope as any, 7.0);
  assertNear('Phase Instability', 'High active matter without hydrotrope penalty (-10)', resHighActiveNoHydrotrope.compatibilityScore, 90);
  assertEqual('Phase Instability', 'Phase instability alert present', resHighActiveNoHydrotrope.alerts.some(a => a.id === 'high-active-matter-phase-instability'), true);

  // 17. High Active Matter With Hydrotrope (>40%)
  const formulaHighActiveWithHydrotrope = [
    { name: 'LABSA 96%', percentage: 30, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 25, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Xylene Sulfonate (SXS)', percentage: 3, activeMatterPct: 40, category: 'Hydrotrope' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 41.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resHighActiveWithHydrotrope = calculateFormulationCompatibility(formulaHighActiveWithHydrotrope as any, 7.0);
  assertNear('Phase Instability', 'High active matter with hydrotrope produces 100%', resHighActiveWithHydrotrope.compatibilityScore, 100);
  assertEqual('Phase Instability', 'No phase instability alert with hydrotrope', resHighActiveWithHydrotrope.alerts.some(a => a.id === 'high-active-matter-phase-instability'), false);

  // 18. Unknown Ingredient Safety
  const formulaUnknown = [
    { name: 'Super Secret Novel Additive', percentage: 2, activeMatterPct: 100, role: 'Special Additive' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 97.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resUnknown = calculateFormulationCompatibility(formulaUnknown as any, 7.0);
  assertNear('Unknown Safety', 'Unknown ingredient safely handled without crash', resUnknown.compatibilityScore, 100);
  assertEqual('Unknown Safety', 'No false positive errors for unknown ingredient', resUnknown.alerts.length, 0);

  // 19. Explicit Zero Preservation
  const formulaZeroPreservation = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 0, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Protease Enzyme', percentage: 0, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Concentrated NaOH', percentage: 0, activeMatterPct: 100, category: 'pH Adjuster' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 89.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resZeroPreservation = calculateFormulationCompatibility(formulaZeroPreservation as any, 7.0);
  assertNear('Explicit Zero Safety', 'Explicit zero additives do not trigger false hazards', resZeroPreservation.compatibilityScore, 100);

  // 20. Alias Field Contract Compatibility
  const formulaAlias = [
    { name: 'SLES 70%', percent: 10, activePercent: 70, role: 'Anionic Surfactant' },
    { name: 'Kathon CG', percentageInFormula: 0.1, activeMatterPurity: 1.5, role: 'Preservative' },
    { name: 'Water', percent: 89.9, activePercent: 0, role: 'Solvent' }
  ];
  const resAlias = calculateFormulationCompatibility(formulaAlias as any, 7.0);
  assertNear('Field Contract Aliases', 'Canonical field alias parsing produces 100%', resAlias.compatibilityScore, 100);

  // 21. Multiple Hazards Stacking
  const formulaMultiHazard = [
    { name: 'LABSA 96%', percentage: 15, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 5, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Water', percentage: 80, activeMatterPct: 0, category: 'Solvent' }
  ]; // Anionic + Cationic (-30) + Missing Preservative (-10) = -40 penalty -> score 60
  const resMultiHazard = calculateFormulationCompatibility(formulaMultiHazard as any, 7.0);
  assertNear('Multiple Hazards', 'Multiple penalties stack accurately (100 - 30 - 10 = 60)', resMultiHazard.compatibilityScore, 60);

  // 22. Score Lower Bound Clamp at 0
  const formulaExtremeLowerBound = [
    { name: 'LABSA 96%', percentage: 30, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 20, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 10, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Protease Enzyme', percentage: 2, activeMatterPct: 100, category: 'Enzyme' },
    { name: 'Concentrated Acid', percentage: 10, activeMatterPct: 100, category: 'pH Adjuster' },
    { name: 'Water', percentage: 28, activeMatterPct: 0, category: 'Solvent' }
  ]; // Anionic+Cationic (-30) + Missing Preservative (-10) + High Active (-10) + Enzyme (-15) + Extreme Acid (-20) = -85 -> score 15. Add high pH preservative mismatch = clamped >= 0
  const resExtremeLowerBound = calculateFormulationCompatibility(formulaExtremeLowerBound as any, 2.0);
  const isScoreLowerBounded = resExtremeLowerBound.compatibilityScore >= 0 && resExtremeLowerBound.compatibilityScore <= 100;
  assertEqual('Score Lower Bound', 'Extreme penalties clamp score >= 0', isScoreLowerBounded, true);

  // 23. Score Upper Bound Clamp at 100
  const resExtremeUpperBound = calculateFormulationCompatibility(formulaWithPreservative as any, 7.5);
  assertEqual('Score Upper Bound', 'Clean formula clamps score <= 100', resExtremeUpperBound.compatibilityScore <= 100, true);

  // 24. Formula Switching Determinism (A -> B -> C -> A -> B)
  const switchResA1 = calculateFormulationCompatibility(formulaWithPreservative as any, 7.5);
  const switchResB1 = calculateFormulationCompatibility(formulaIncompatible as any, 7.0);
  const switchResC1 = calculateFormulationCompatibility(formulaExtremeAlkali as any, 12.01);
  const switchResA2 = calculateFormulationCompatibility(formulaWithPreservative as any, 7.5);
  const switchResB2 = calculateFormulationCompatibility(formulaIncompatible as any, 7.0);

  assertNear('SSOT Reactivity', 'Formula A initial score', switchResA1.compatibilityScore, 100);
  assertNear('SSOT Reactivity', 'Formula B switched score', switchResB1.compatibilityScore, 70);
  assertEqual('SSOT Reactivity', 'Formula C extreme pH alert', switchResC1.alerts.some(a => a.id === 'extreme-ph-hazard'), true);
  assertNear('SSOT Reactivity', 'Formula A restored score (no stale state)', switchResA2.compatibilityScore, 100);
  assertNear('SSOT Reactivity', 'Formula B restored score (no stale state)', switchResB2.compatibilityScore, 70);

  // 25. Cross-Workspace Determinism (Identical inputs -> Identical output)
  const resDet1 = calculateFormulationCompatibility(formulaIncompatible as any, 7.0);
  const resDet2 = calculateFormulationCompatibility(formulaIncompatible as any, 7.0);
  assertEqual('Cross-Workspace Determinism', 'Identical inputs produce identical score', resDet1.compatibilityScore, resDet2.compatibilityScore);
  assertEqual('Cross-Workspace Determinism', 'Identical inputs produce identical compatible boolean', resDet1.compatible, resDet2.compatible);
  assertEqual('Cross-Workspace Determinism', 'Identical inputs produce identical alert count', resDet1.alerts.length, resDet2.alerts.length);

  // 26. Invalid / Non-Number pH Safety
  const resInvalidPH1 = calculateFormulationCompatibility(formulaWithPreservative as any, NaN);
  const resInvalidPH2 = calculateFormulationCompatibility(formulaWithPreservative as any, "invalid_string");
  const resInvalidPH3 = calculateFormulationCompatibility(formulaWithPreservative as any, undefined);
  assertNear('Invalid pH Safety', 'NaN pH falls back safely', resInvalidPH1.compatibilityScore, 100);
  assertNear('Invalid pH Safety', 'Invalid string pH falls back safely', resInvalidPH2.compatibilityScore, 100);
  assertNear('Invalid pH Safety', 'Undefined pH falls back safely', resInvalidPH3.compatibilityScore, 100);

  // 27. Boundary pH Exact Values
  const resPH3Exact = calculateFormulationCompatibility(formulaWithPreservative as any, 3.0);
  const resPH12Exact = calculateFormulationCompatibility(formulaWithPreservative as any, 12.0);
  const resPH85Exact = calculateFormulationCompatibility(formulaWithPreservative as any, 8.5);
  const resPH55Exact = calculateFormulationCompatibility(formulaEnzymeNormal as any, 5.5);
  const resPH105Exact = calculateFormulationCompatibility(formulaEnzymeNormal as any, 10.5);

  assertEqual('Boundary pH', 'pH 3.0 exact is NOT extreme pH hazard (<3.0 required)', resPH3Exact.alerts.some(a => a.id === 'extreme-ph-hazard'), false);
  assertEqual('Boundary pH', 'pH 12.0 exact is NOT extreme pH hazard (>12.0 required)', resPH12Exact.alerts.some(a => a.id === 'extreme-ph-hazard'), false);
  assertEqual('Boundary pH', 'pH 8.5 exact is NOT alkaline mismatch (>8.5 required)', resPH85Exact.alerts.some(a => a.id === 'preservative-ph-mismatch'), false);
  assertEqual('Boundary pH', 'pH 5.5 exact is NOT enzyme denaturation (<5.5 required)', resPH55Exact.alerts.some(a => a.id === 'enzyme-ph-denaturation'), false);
  assertEqual('Boundary pH', 'pH 10.5 exact is NOT enzyme denaturation (>10.5 required)', resPH105Exact.alerts.some(a => a.id === 'enzyme-ph-denaturation'), false);

  // 28. Duplicate-Hazard Single-Flag Execution
  const formulaMultiAnionicCationic = [
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, category: 'Anionic Surfactant' },
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Lauryl Sulfate (SLS)', percentage: 5, activeMatterPct: 95, category: 'Anionic Surfactant' },
    { name: 'Cetrimonium Chloride', percentage: 2, activeMatterPct: 25, category: 'Cationic Surfactant' },
    { name: 'Kathon CG', percentage: 0.1, activeMatterPct: 1.5, category: 'Preservative' },
    { name: 'Water', percentage: 72.9, activeMatterPct: 0, category: 'Solvent' }
  ];
  const resMultiAnionicCationic = calculateFormulationCompatibility(formulaMultiAnionicCationic as any, 7.0);
  assertEqual('Duplicate Hazard Safety', 'Multiple anionics + cationic triggers ionic alert exactly once', resMultiAnionicCationic.alerts.filter(a => a.id === 'anionic-cationic-incompatibility').length, 1);
  assertNear('Duplicate Hazard Safety', 'Multiple anionics + cationic score penalty is exactly -30', resMultiAnionicCationic.compatibilityScore, 70);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`==================================================`);
  console.log(`  COMPATIBILITY ENGINE REGRESSION SUITE          `);
  console.log(`==================================================`);
  results.forEach(r => {
    const status = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${status} ${r.suite} :: ${r.name}`);
    if (!r.passed) console.log(`       Error: ${r.error}`);
  });
  console.log(`--------------------------------------------------`);
  console.log(`TOTAL COMPATIBILITY TESTS : ${results.length}`);
  console.log(`PASSED                    : ${passed}`);
  console.log(`FAILED                    : ${failed}`);
  console.log(`--------------------------------------------------`);

  return { passed, failed, results };
}

