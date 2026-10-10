import {
  calculateActiveMatter,
  calculateActiveSurfactants,
  calculateCleaningPerformance,
  calculateCPI
} from '../calculators';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  error?: string;
}

export function runCleaningPerformanceTestSuite(): { passed: number; failed: number; results: TestResult[] } {
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

  // 1. Active Matter Calculation
  const formula1 = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'CAPB 30%', percentage: 5, activeMatterPct: 30, category: 'Amphoteric Surfactant' },
    { name: 'Water', percentage: 85, activeMatterPct: 0, category: 'Solvent' }
  ];
  // Active Matter = 10 * 0.70 + 5 * 0.30 = 7.0 + 1.5 = 8.5%
  assertNear('Active Matter', 'Standard active matter sum', calculateActiveMatter(formula1 as any), 8.5);

  // 2. Active Surfactants Calculation
  assertNear('Active Surfactants', 'Surfactant active matter sum', calculateActiveSurfactants(formula1 as any), 8.5);

  // 3. Alias Compatibility & Zero Preservation
  const formulaAlias = [
    { name: 'LABSA 96%', percent: 8, activePercent: 96, role: 'Anionic Surfactant' },
    { name: 'Zero Active Ingredient', percentageInFormula: 5, activeMatterPurity: 0, role: 'Builder' },
    { name: 'Zero Percentage Ingredient', percentage: 0, activeMatterPct: 50, role: 'Enzyme' }
  ];
  // Active Surfactant = 8 * 0.96 = 7.68
  assertNear('Alias Compatibility', 'Alias field recognition', calculateActiveSurfactants(formulaAlias as any), 7.68);
  assertNear('Zero Preservation', 'Explicit zero active matter', calculateActiveMatter(formulaAlias as any), 7.68);

  // 4. CPI Baseline & Cleaning Score Baseline
  const perfBaseline = calculateCleaningPerformance(formula1 as any, 8.0, 'LAUNDRY_LIQUID');
  const cpiBaseline = calculateCPI(formula1 as any, 8.0, 'LAUNDRY_LIQUID');
  assertEqual('CPI & Cleaning Score Equality', 'calculateCPI matches cleaningScore', cpiBaseline, perfBaseline.cleaningScore);

  // 5. No-Enzyme vs Enzyme Formula
  const formulaNoEnzyme = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Water', percentage: 90, activeMatterPct: 0 }
  ];
  const formulaWithEnzyme = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Protease Enzyme', percentage: 0.5, activeMatterPct: 100, category: 'Enzymes' },
    { name: 'Water', percentage: 89.5, activeMatterPct: 0 }
  ];
  const perfNoEnz = calculateCleaningPerformance(formulaNoEnzyme as any, 8.0, 'LAUNDRY_LIQUID');
  const perfWithEnz = calculateCleaningPerformance(formulaWithEnzyme as any, 8.0, 'LAUNDRY_LIQUID');
  assertEqual('Enzyme Bonus', 'No enzyme bonus is 0', perfNoEnz.enzymeBonus, 0);
  assertNear('Enzyme Bonus', 'Enzyme bonus is applied (>0)', perfWithEnz.enzymeBonus > 0 ? 1 : 0, 1);
  assertNear('Enzyme Bonus', 'Enzyme formula score higher than no-enzyme', (perfWithEnz.cleaningScore ?? 0) > (perfNoEnz.cleaningScore ?? 0) ? 1 : 0, 1);

  // 6. Builder Contribution
  const formulaWithBuilder = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 3, activeMatterPct: 100, category: 'Builder / Chelator' },
    { name: 'Water', percentage: 87, activeMatterPct: 0 }
  ];
  const perfWithBuilder = calculateCleaningPerformance(formulaWithBuilder as any, 8.0, 'LAUNDRY_LIQUID');
  assertNear('Builder Contribution', 'Builder contribution applied (>0)', perfWithBuilder.builderContribution > 0 ? 1 : 0, 1);
  assertNear('Builder Contribution', 'Builder formula score higher than base', (perfWithBuilder.cleaningScore ?? 0) > (perfNoEnz.cleaningScore ?? 0) ? 1 : 0, 1);

  // 7. Formula A -> B -> C -> A Switching Reactivity
  const formulaA = [
    { name: 'SLES 70%', percentage: 15, activeMatterPct: 70, category: 'Anionic Surfactant' }
  ];
  const formulaB = [
    { name: 'SLES 70%', percentage: 5, activeMatterPct: 70, category: 'Anionic Surfactant' }
  ];
  const perfA = calculateCleaningPerformance(formulaA as any, 8.0, 'LAUNDRY_LIQUID');
  const perfB = calculateCleaningPerformance(formulaB as any, 8.0, 'LAUNDRY_LIQUID');
  assertNear('Formula Switching', 'Formula A score higher than Formula B', (perfA.cleaningScore ?? 0) > (perfB.cleaningScore ?? 0) ? 1 : 0, 1);
  
  // Re-evaluation of Formula A produces identical result (Idempotency & No Stale State)
  const perfA2 = calculateCleaningPerformance(formulaA as any, 8.0, 'LAUNDRY_LIQUID');
  assertEqual('Idempotency', 'Re-evaluation produces identical result', perfA2.cleaningScore, perfA.cleaningScore);

  // 8. AIFormulator vs SmartFormulaAnalyzerPro Determinism
  // Both components consuming calculateCleaningPerformance on formulaWithEnzyme obtain identical output
  const cpiAIFormulator = calculateCPI(formulaWithEnzyme as any, 8.0, 'LAUNDRY_LIQUID');
  const cpiAnalyzer = calculateCleaningPerformance(formulaWithEnzyme as any, 8.0, 'LAUNDRY_LIQUID').overallScore;
  assertEqual('Cross-Component Determinism', 'AIFormulator CPI equals SmartFormulaAnalyzerPro Overall CPI', cpiAIFormulator, cpiAnalyzer);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  return { passed, failed, results };
}
