import { HLBEngine, evaluateAuthoritativeHLB, calculateHLB } from '../hlbEngine';
import { FormulationIngredient } from '../../types';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runHLBRegressionTestSuite() {
  const results: TestResult[] = [];

  function assert(group: string, name: string, condition: boolean, actual: any, expected: any, message?: string) {
    results.push({
      group,
      name,
      passed: Boolean(condition),
      actual,
      expected,
      message: message || (condition ? 'PASS' : `Expected ${expected}, got ${actual}`)
    });
  }

  function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.05) {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    assert(
      group,
      name,
      passed,
      actual,
      `${expected} ± ${tolerance}`,
      passed ? `PASS (diff: ${diff.toFixed(4)})` : `FAIL: got ${actual}, expected ${expected} ± ${tolerance}`
    );
  }

  console.log('\n==================================================');
  console.log('  AUTHORITATIVE HLB ENGINE REGRESSION SUITE        ');
  console.log('==================================================\n');

  // 1. Authoritative Lookup from Canonical Library
  const span80Res = HLBEngine.resolveIngredientHLB({ name: 'Span 80' });
  assert('Library Resolution', 'Span 80 resolved to HLB 4.3', span80Res.hlb === 4.3, span80Res.hlb, 4.3);
  assert('Library Resolution', 'Span 80 marked authoritative or estimated', span80Res.dataSource !== 'missing', span80Res.dataSource, 'authoritative | estimated');

  const tween80Res = HLBEngine.resolveIngredientHLB({ name: 'Polysorbate 80' });
  assert('Library Resolution', 'Polysorbate 80 resolved to HLB 15.0', tween80Res.hlb === 15.0, tween80Res.hlb, 15.0);

  // 2. Commercial Raw Material Grade Preservation (Same CAS, different grades)
  const sles70Res = HLBEngine.resolveIngredientHLB({ name: 'SLES 70%', percentage: 10, activeMatterPct: 70 });
  const sles28Res = HLBEngine.resolveIngredientHLB({ name: 'SLES 28%', percentage: 10, activeMatterPct: 28 });
  assert('Grade Preservation', 'SLES 70% active resolved to 70%', sles70Res.activeMatterPct === 70, sles70Res.activeMatterPct, 70);
  assert('Grade Preservation', 'SLES 28% active resolved to 28%', sles28Res.activeMatterPct === 28, sles28Res.activeMatterPct, 28);
  assert('Grade Preservation', 'SLES Davies HLB 40.0 resolved for both', sles70Res.hlb === 40.0 && sles28Res.hlb === 40.0, `${sles70Res.hlb}, ${sles28Res.hlb}`, '40.0, 40.0');

  // 3. Active-Matter-Weighted Blended HLB Calculation
  // 50/50 blend of Span 80 (HLB 4.3, 100% active) and Tween 80 (HLB 15.0, 100% active)
  const binaryBlend: FormulationIngredient[] = [
    { name: 'Span 80', percentage: 5, activeMatterPct: 100 },
    { name: 'Tween 80', percentage: 5, activeMatterPct: 100 }
  ];
  const binaryReport = evaluateAuthoritativeHLB(binaryBlend);
  assertNear('Blended HLB', '50/50 Span 80 & Tween 80 yields HLB 9.65', binaryReport.blendedHLB, 9.65, 0.02);
  assert('Blended HLB', 'Binary blend identifies 2 surfactants', binaryReport.surfactantsCount === 2, binaryReport.surfactantsCount, 2);
  assert('Blended HLB', 'Binary blend emulsion region is Oil-in-Water', binaryReport.emulsionRegion === 'Oil-in-Water (O/W) Emulsifier', binaryReport.emulsionRegion, 'Oil-in-Water (O/W) Emulsifier');

  // 4. Missing Data & Never-Invent Rule
  const unknownIng: FormulationIngredient[] = [
    { name: 'Synthetic Proprietary Polymer X99', percentage: 5, category: 'Surfactant' }
  ];
  const unknownReport = evaluateAuthoritativeHLB(unknownIng);
  assert('Missing HLB Discipline', 'Surfactant with no HLB data reports missing and 0 blended HLB', unknownReport.surfactantsWithMissingHLB === 1, unknownReport.surfactantsWithMissingHLB, 1);
  assert('Missing HLB Discipline', 'Not fully authoritative when data missing', unknownReport.isFullyAuthoritative === false, unknownReport.isFullyAuthoritative, false);

  // 5. Zero Proportion & Empty Formulation Safety
  const emptyReport = evaluateAuthoritativeHLB([]);
  assert('Edge Safety', 'Empty formula yields blended HLB = 0', emptyReport.blendedHLB === 0, emptyReport.blendedHLB, 0);
  assert('Edge Safety', 'Empty formula hasSurfactants is false', emptyReport.hasSurfactants === false, emptyReport.hasSurfactants, false);

  // 6. Explicit Override Respect
  const overrideIng: FormulationIngredient[] = [
    { name: 'Custom Nonionic Polyether', percentage: 10, hlbValue: 13.7, activeMatterPct: 100 }
  ];
  const overrideReport = evaluateAuthoritativeHLB(overrideIng);
  assert('Explicit Override', 'Explicit hlbValue 13.7 is respected', overrideReport.blendedHLB === 13.7, overrideReport.blendedHLB, 13.7);

  // 7. Legacy calculateHLB tuple wrapper
  const legacyVal = calculateHLB([
    { name: 'Span 80', hlb: 4.3, proportion: 30 },
    { name: 'Tween 80', hlb: 15.0, proportion: 70 }
  ]);
  assertNear('Legacy Wrapper', 'calculateHLB tuple wrapper matches 11.79', legacyVal, 11.79, 0.02);

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('--------------------------------------------------');
  console.log(`TOTAL HLB TESTS : ${total}`);
  console.log(`PASSED          : ${passed}`);
  console.log(`FAILED          : ${failed}`);
  console.log('--------------------------------------------------\n');

  return { total, passed, failed, results };
}

// Auto-run when executed via tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('hlbEngine.regression.test')) {
  const summary = runHLBRegressionTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}
