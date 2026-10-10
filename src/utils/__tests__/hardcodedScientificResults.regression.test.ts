import { runRootCauseTroubleshooter } from '../troubleshooterEngine';
import { analyzeMachineProfile } from '../machineEngine';
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

  // 1. Troubleshooter Engine Dynamic Results
  const troubleEmpty = runRootCauseTroubleshooter([], 'Phase Separation / Cloudiness');
  assert(
    '1. Troubleshooter Empty Input Neutral State',
    'Troubleshooter with empty ingredients returns NOT_EVALUATED rather than hardcoded 88 score or 7.5 pH',
    troubleEmpty.estimatedPH === 'NOT_EVALUATED' && troubleEmpty.activeSurfactants === 'NOT_EVALUATED',
    { ph: troubleEmpty.estimatedPH, active: troubleEmpty.activeSurfactants },
    { ph: 'NOT_EVALUATED', active: 'NOT_EVALUATED' }
  );

  const troubleLow = runRootCauseTroubleshooter([{ name: 'SLES 70%', percentage: 5, activeMatterPct: 70 }], 'Low Viscosity');
  const troubleHigh = runRootCauseTroubleshooter([{ name: 'SLES 70%', percentage: 20, activeMatterPct: 70 }], 'Low Viscosity');
  assert(
    '1. Troubleshooter Dynamic Input Sensitivity',
    'Troubleshooter activeSurfactants changes dynamically with ingredient percentage changes (3.5% vs 14.0%)',
    troubleLow.activeSurfactants === 3.5 && troubleHigh.activeSurfactants === 14,
    { low: troubleLow.activeSurfactants, high: troubleHigh.activeSurfactants },
    { low: 3.5, high: 14 }
  );

  // 2. Machine Profile Engine Dynamic Results
  const machineEmpty = analyzeMachineProfile([], 'Front Load High-Efficiency (HE)');
  assert(
    '2. Machine Engine Empty Input Neutral State',
    'Machine Engine with empty ingredients returns NOT_EVALUATED rather than hardcoded 14.5% active surfactant',
    machineEmpty.activeSurfactantPct === 'NOT_EVALUATED' && machineEmpty.cleaningPerformance.status === 'NOT_EVALUATED',
    { active: machineEmpty.activeSurfactantPct, perfStatus: machineEmpty.cleaningPerformance.status },
    { active: 'NOT_EVALUATED', perfStatus: 'NOT_EVALUATED' }
  );

  const machineFormA = analyzeMachineProfile([{ name: 'SLES 70%', percentage: 10, activeMatterPct: 70 }], 'Front Load High-Efficiency (HE)');
  const machineFormB = analyzeMachineProfile([{ name: 'SLES 70%', percentage: 20, activeMatterPct: 70 }], 'Front Load High-Efficiency (HE)');
  assert(
    '2. Machine Engine Dynamic Input Sensitivity',
    'Machine Engine activeSurfactantPct updates dynamically from ingredients (7.0% vs 14.0%)',
    machineFormA.activeSurfactantPct === 7 && machineFormB.activeSurfactantPct === 14,
    { formA: machineFormA.activeSurfactantPct, formB: machineFormB.activeSurfactantPct },
    { formA: 7, formB: 14 }
  );

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
    { name: 'Tetrasodium EDTA 40%', percentage: 5, activeMatterPct: 40, role: 'Chelator' }
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
