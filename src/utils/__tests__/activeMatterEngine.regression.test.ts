import { 
  ActiveMatterEngine, 
  evaluateAuthoritativeActiveMatter, 
  calculateActiveMatter, 
  calculateActiveSurfactants, 
  calculateRawSurfactants
} from '../activeMatterEngine';
import { FormulationIngredient } from '../../types';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message?: string;
}

export function runActiveMatterRegressionTestSuite() {
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
  console.log('  AUTHORITATIVE ACTIVE MATTER ENGINE TEST SUITE    ');
  console.log('==================================================\n');

  // 1. Authoritative Lookup from Canonical Library & Benchmarks
  const labsa90Res = ActiveMatterEngine.resolveIngredientActive({ name: 'LABSA (Acid Slurry 90%)' });
  assert('Resolution', 'LABSA 90% resolves to 90%', labsa90Res.activeMatterPct === 90, labsa90Res.activeMatterPct, 90);
  assert('Resolution', 'LABSA 90% provenance is authoritative/derived', labsa90Res.dataSource !== 'missing', labsa90Res.dataSource, 'authoritative | derived_from_name');

  const sles70Res = ActiveMatterEngine.resolveIngredientActive({ name: 'SLES 70%' });
  assert('Resolution', 'SLES 70% resolves to 70%', sles70Res.activeMatterPct === 70, sles70Res.activeMatterPct, 70);

  const capbRes = ActiveMatterEngine.resolveIngredientActive({ name: 'CAPB (30% Liquid)' });
  assert('Resolution', 'CAPB resolves to 30%', capbRes.activeMatterPct === 30, capbRes.activeMatterPct, 30);

  // 2. Commercial Raw Material Grade Preservation (Same CAS, different grades)
  const slesPaste = ActiveMatterEngine.resolveIngredientActive({ name: 'Sodium Laureth Sulfate (70% Paste)', casNumber: '68585-34-2' });
  const slesLiquid = ActiveMatterEngine.resolveIngredientActive({ name: 'Sodium Laureth Sulfate (28% Solution)', casNumber: '68585-34-2' });
  assert('Grade Preservation', 'SLES Paste resolves to 70%', slesPaste.activeMatterPct === 70, slesPaste.activeMatterPct, 70);
  assert('Grade Preservation', 'SLES Solution resolves to 28%', slesLiquid.activeMatterPct === 28, slesLiquid.activeMatterPct, 28);

  const naoh50 = ActiveMatterEngine.resolveIngredientActive({ name: 'Sodium Hydroxide (50% Liquid)', casNumber: '1310-73-2' });
  const naoh99 = ActiveMatterEngine.resolveIngredientActive({ name: 'Sodium Hydroxide (Flakes 99%)', casNumber: '1310-73-2' });
  assert('Grade Preservation', 'NaOH 50% resolves to 50%', naoh50.activeMatterPct === 50, naoh50.activeMatterPct, 50);
  assert('Grade Preservation', 'NaOH Flakes resolves to 99%', naoh99.activeMatterPct === 99, naoh99.activeMatterPct, 99);

  // 3. Explicit User Override
  const customOverride = ActiveMatterEngine.resolveIngredientActive({ 
    name: 'SLES (70% Paste)', 
    activeMatterPct: 68.5 
  });
  assert('Explicit Override', 'Explicit activeMatterPct overrides name/canonical database', customOverride.activeMatterPct === 68.5, customOverride.activeMatterPct, 68.5);
  assert('Explicit Override', 'DataSource is explicit_override', customOverride.dataSource === 'explicit_override', customOverride.dataSource, 'explicit_override');

  // 4. Water & Solvent Zero-Active Handling
  const waterRes = ActiveMatterEngine.resolveIngredientActive({ name: 'Deionized Water' });
  assert('Water Handling', 'Deionized Water resolves to 0% active matter', waterRes.activeMatterPct === 0, waterRes.activeMatterPct, 0);
  assert('Water Handling', 'Deionized Water is identified as water', waterRes.isWater === true, waterRes.isWater, true);

  // 5. Formulation Mass Breakdown & Water Balance Report
  const testFormula: FormulationIngredient[] = [
    { id: '1', name: 'Deionized Water', percentage: 60.0 }, // 0% active, 60% free water
    { id: '2', name: 'SLES 70%', percentage: 20.0 },         // 14% active, 6% carried water
    { id: '3', name: 'CAPB 30%', percentage: 10.0 },         // 3% active, 7% carried water
    { id: '4', name: 'LAE-9', percentage: 5.0 },             // 5% active, 0% carrier
    { id: '5', name: 'Sodium Chloride', percentage: 2.0 },   // 2% active solid, 0% carrier
    { id: '6', name: 'Citric Acid', percentage: 1.0 },       // 1% active solid, 0% carrier
    { id: '7', name: 'Preservative', percentage: 0.2 },      // 0.2% active solid
    { id: '8', name: 'Fragrance', percentage: 1.8 }          // 1.8% active solid
  ];

  const report = evaluateAuthoritativeActiveMatter(testFormula, 100);

  // Total active matter: 14 + 3 + 5 + 2 + 1 + 0.2 + 1.8 = 27.0%
  assertNear('Mass Breakdown', 'Total active matter is 27.0%', report.totalActiveMatter, 27.0, 0.05);
  assertNear('Mass Breakdown', 'Total active kg for 100kg batch is 27.0kg', report.totalActiveKg, 27.0, 0.05);
  
  // Total raw percentage is 100%
  assertNear('Mass Breakdown', 'Total raw percentage is 100.0%', report.totalRawPercentage, 100.0, 0.05);
  
  // Total carrier percentage is 73.0% (60 free water + 6 from SLES + 7 from CAPB)
  assertNear('Mass Breakdown', 'Total carrier percentage is 73.0%', report.totalCarrierPercentage, 73.0, 0.05);

  // Water Balance: free added water = 60%, carried water = 13%, total water = 73%
  assertNear('Water Balance', 'Free water is 60.0%', report.waterBalance.freeAddedWaterPct, 60.0, 0.05);
  assertNear('Water Balance', 'Carried water from raw materials is 13.0%', report.waterBalance.carriedWaterPct, 13.0, 0.05);
  assertNear('Water Balance', 'Total water is 73.0%', report.totalWaterPct, 73.0, 0.05);

  // Surfactant breakdown:
  // Anionic: SLES 70% @ 20% dosage = 14.0%
  // Amphoteric: CAPB 30% @ 10% dosage = 3.0%
  // Nonionic: LAE-9 @ 5% dosage = 5.0%
  // Total Active Surfactants = 22.0%
  assertNear('Surfactants', 'Anionic active surfactant is 14.0%', report.surfactants.anionicActivePct, 14.0, 0.05);
  assertNear('Surfactants', 'Amphoteric active surfactant is 3.0%', report.surfactants.amphotericActivePct, 3.0, 0.05);
  assertNear('Surfactants', 'Nonionic active surfactant is 5.0%', report.surfactants.nonionicActivePct, 5.0, 0.05);
  assertNear('Surfactants', 'Total active surfactants is 22.0%', report.surfactants.totalActiveSurfactants, 22.0, 0.05);
  assertNear('Surfactants', 'Total raw surfactants is 35.0%', report.surfactants.totalRawSurfactants, 35.0, 0.05);

  // 6. Direct Functional Helpers Parity
  const directActive = calculateActiveMatter(testFormula);
  const directActiveSurf = calculateActiveSurfactants(testFormula);
  const directRawSurf = calculateRawSurfactants(testFormula);

  assertNear('Direct Helpers', 'calculateActiveMatter matches report', directActive, report.totalActiveMatter, 0.05);
  assertNear('Direct Helpers', 'calculateActiveSurfactants matches report', directActiveSurf, report.surfactants.totalActiveSurfactants, 0.05);
  assertNear('Direct Helpers', 'calculateRawSurfactants matches report', directRawSurf, report.surfactants.totalRawSurfactants, 0.05);

  // 7. Edge Cases & Safety Clamping
  const emptyReport = evaluateAuthoritativeActiveMatter([], 100);
  assert('Edge Cases', 'Empty ingredients return 0% active matter', emptyReport.totalActiveMatter === 0, emptyReport.totalActiveMatter, 0);

  const clampedRes = ActiveMatterEngine.resolveIngredientActive({ name: 'Special Chemical', activeMatterPct: 150 });
  assert('Safety Clamping', 'Active matter > 100% is clamped to 100%', clampedRes.activeMatterPct === 100, clampedRes.activeMatterPct, 100);

  const negClampedRes = ActiveMatterEngine.resolveIngredientActive({ name: 'Special Chemical', activeMatterPct: -20 });
  assert('Safety Clamping', 'Active matter < 0% is clamped to 0%', negClampedRes.activeMatterPct === 0, negClampedRes.activeMatterPct, 0);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nActive Matter Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}
