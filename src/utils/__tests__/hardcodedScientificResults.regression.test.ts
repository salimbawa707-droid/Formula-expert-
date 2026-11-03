import { analyzeClimateAndHardWater } from '../climateEngine';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runHardcodedScientificResultsRegressionTestSuite() {
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

  // 3. Climate Engine Dynamic Water Hardness Tolerance
  const climateEmpty = analyzeClimateAndHardWater([], 'Hot & Humid Tropical', 'Hard (120-180 ppm)');
  assert(
    '3. Climate Engine Empty Input Neutral State',
    'Climate Engine with empty ingredients returns NOT_EVALUATED for hardness tolerance rather than fixed 250 ppm',
    climateEmpty.calculatedHardnessTolerance === 'NOT_EVALUATED' && climateEmpty.hardnessInfo.maxSupportedPpm === 'NOT_EVALUATED',
    climateEmpty.calculatedHardnessTolerance,
    'NOT_EVALUATED'
  );

  const climateChelated = analyzeClimateAndHardWater([
    { name: 'Water', percentage: 80, category: 'Solvent' },
    { name: 'SLES 70%', percentage: 15, activeMatterPct: 70, category: 'Surfactant' },
    { name: 'Tetrasodium EDTA 39% Liquid', percentage: 5, activeMatterPct: 39, role: 'Chelator' }
  ], 'Temperate', 'Hard (120-180 ppm)');
  assert(
    '3. Climate Engine Dynamic Chelator Calculation',
    'Climate Engine hardness tolerance calculates real ppm capacity from chelator load',
    typeof climateChelated.hardnessInfo.maxSupportedPpm === 'number' && climateChelated.hardnessInfo.maxSupportedPpm > 0,
    climateChelated.hardnessInfo.maxSupportedPpm,
    'number > 0'
  );

  // 4. Lab Evidence Isolation & Provenance Integrity
  const qgResult = evaluateScientificQualityGate({
    ingredients: [
      { name: 'Water', percentage: 84.5, category: 'Solvent' },
      { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Surfactant' },
      { name: 'Cocamidopropyl Betaine', percentage: 5, activeMatterPct: 30, category: 'Surfactant' },
      { name: 'Phenoxyethanol', percentage: 0.5, category: 'Preservative' }
    ],
    productCategory: 'LAUNDRY_LIQUID',
    formulaName: 'Model Test',
    formulaVersion: '1.0.0'
  });
  assert(
    '4. Provenance Integrity',
    'Calculated/predicted formula without lab measurements has evidenceStatus PREDICTED_ONLY, not FULLY_LAB_VALIDATED',
    qgResult.evidenceStatus === 'PREDICTED_ONLY',
    qgResult.evidenceStatus,
    'PREDICTED_ONLY'
  );

  // 5. Authoritative Final Verdict Isolation
  assert(
    '5. Quality Gate Final Verdict Authority',
    'Quality Gate finalFormulaStatus is non-empty and governed by master rules',
    Boolean(qgResult.finalFormulaStatus) && (qgResult.finalFormulaStatus as string) !== 'PASS',
    qgResult.finalFormulaStatus,
    'Valid non-PASS FinalFormulaStatus (e.g. LAB_VALIDATION_REQUIRED)'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nHardcoded Scientific Results Sweep Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}
