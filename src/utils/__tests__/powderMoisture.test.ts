import { calculatePowderMoistureAndDryMatter } from '../powderEngine/powderMoistureDryMatter';
import { FormulationIngredient } from '../../types';

export function runPowderMoistureTestSuite(): {
  total: number;
  passed: number;
  failed: number;
  details: string[];
} {
  let passed = 0;
  let failed = 0;
  const details: string[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      passed++;
      details.push(`[PASS] ${name}`);
    } else {
      failed++;
      details.push(`[FAIL] ${name}: ${message || 'Assertion failed'}`);
    }
  }

  const ingredients: FormulationIngredient[] = [
    { name: 'Soda Ash', percentage: 50 },
    { name: 'Sodium Sulfate', percentage: 50 }
  ];
  
  const massBalance = {
    assignedPercentage: 100,
    unassignedPercentage: 0,
    formulaTotalPct: 100,
    status: 'BALANCED' as const,
    missingPercentage: 0,
    excessPercentage: 0,
    statusMessage: 'Balanced',
    source: 'CALCULATED' as const
  };

  // TEST 1: Missing moisture input -> INSUFFICIENT_DATA
  const res1 = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100);
  assert('Missing moisture is null', res1.moisturePct === null);
  assert('Missing moisture status is INSUFFICIENT_DATA', res1.moistureStatus === 'INSUFFICIENT_DATA');

  // TEST 2: Valid lab moisture
  const res2 = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100, {
    measuredMoisturePct: 5.0
  });
  assert('Valid moisture is 5.0%', res2.moisturePct === 5.0);
  assert('Derived dry matter is 95.0%', res2.dryMatterPct === 95.0);
  assert('Moisture status is MEASURED', res2.moistureStatus === 'MEASURED');
  assert('Dry matter status is DERIVED', res2.dryMatterStatus === 'DERIVED');

  // TEST 3: Reject moisture > 100%
  const res3 = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100, {
    measuredMoisturePct: 101.0
  });
  assert('Reject moisture > 100%', res3.moisturePct === null && res3.moistureStatus === 'INSUFFICIENT_DATA');

  // TEST 4: Reject negative moisture
  const res4 = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100, {
    measuredMoisturePct: -1.0
  });
  assert('Reject negative moisture', res4.moisturePct === null && res4.moistureStatus === 'INSUFFICIENT_DATA');

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runPowderMoistureTestSuite();
if (_res.failed > 0) {
  throw new Error(`powderMoisture.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}
