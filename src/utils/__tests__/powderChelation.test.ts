import { calculatePowderChelationSystem } from '../powderEngine/powderBuilderChelationAlkalinity';
import { ClassifiedIngredient } from '../powderEngine/types';

export function runPowderChelationTestSuite(): {
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

  const chelator: ClassifiedIngredient = {
    name: 'GLDA 47% Liquid (GLDA-4Na)',
    inputPercentage: 10,
    functionalClass: 'Chelating Agent / Soluble Sequestrant',
    isSurfactant: false,
    isBuilder: false,
    isChelator: true,
    isAlkalinitySource: false,
    isFiller: false,
    costPerKg: 1
  };

  // Missing activeMatterPct -> INSUFFICIENT_DATA
  const res1 = calculatePowderChelationSystem([{ ...chelator }]);
  assert('Missing activeMatterPct is INSUFFICIENT_DATA', res1.source === 'INSUFFICIENT_DATA');

  // Null activeMatterPct -> INSUFFICIENT_DATA
  const res2 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: null as any }]);
  assert('Null activeMatterPct is INSUFFICIENT_DATA', res2.source === 'INSUFFICIENT_DATA');

  // NaN activeMatterPct -> INSUFFICIENT_DATA
  const res3 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: NaN }]);
  assert('NaN activeMatterPct is INSUFFICIENT_DATA', res3.source === 'INSUFFICIENT_DATA');

  // Negative activeMatterPct -> INSUFFICIENT_DATA
  const res4 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: -1 }]);
  assert('Negative activeMatterPct is INSUFFICIENT_DATA', res4.source === 'INSUFFICIENT_DATA');

  // > 100 activeMatterPct -> INSUFFICIENT_DATA
  const res5 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 101 }]);
  assert('>100 activeMatterPct is INSUFFICIENT_DATA', res5.source === 'INSUFFICIENT_DATA');

  // Valid ingredient evidence without a wash scenario cannot produce a per-dose capacity.
  const missingScenario = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 47 }]);
  assert('Missing dose/volume is INSUFFICIENT_DATA', missingScenario.source === 'INSUFFICIENT_DATA' && missingScenario.calciumCapacityMgPerDose === undefined);

  // Valid 47% active matter with explicit wash scenario
  const res6 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 47 }], 50, 10);
  assert('Valid 47% source is CALCULATED', res6.source === 'CALCULATED');
  assert('Valid 47% hasValidatedData is true', res6.hasValidatedData === true);
  assert('Valid 47% calciumCapacityMgPerDose is defined', res6.calciumCapacityMgPerDose !== undefined);

  // 0% active matter as valid numeric 0
  const res7 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 0 }], 50, 10);
  assert('0% active matter source is CALCULATED', res7.source === 'CALCULATED');
  assert('0% active matter hasValidatedData is true', res7.hasValidatedData === true);
  assert('0% active matter calciumCapacityMgPerDose is 0', res7.calciumCapacityMgPerDose === 0);

  return {
    total: passed + failed,
    passed,
    failed,
    details
  };
}

const _res = runPowderChelationTestSuite();
if (_res.failed > 0) {
  throw new Error(`powderChelation.test failed: ${_res.details.filter(d => d.startsWith('[FAIL]')).join('; ')}`);
}
