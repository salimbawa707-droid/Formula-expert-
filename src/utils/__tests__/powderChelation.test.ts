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

  // Zero active matter cannot support a positive chelation-capacity claim.
  const res7 = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 0 }], 50, 10);
  assert('0% active matter source is INSUFFICIENT_DATA', res7.source === 'INSUFFICIENT_DATA');
  assert('0% active matter hasValidatedData is false', res7.hasValidatedData === false);
  assert('0% active matter calciumCapacityMgPerDose is unavailable', res7.calciumCapacityMgPerDose === undefined);

  // GLDA-47 lookup capacity is already on a commercial-product basis: 10% of a 50g dose = 5g; 5g × 137mg/g = 685mg.
  const commercialBasis = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 47 }], 50, 10);
  assert('Commercial-grade capacity is not double-discounted by assay', commercialBasis.calciumCapacityMgPerDose === 685);

  // Explicit active-material basis is scaled once by the commercial assay.
  const activeBasis = calculatePowderChelationSystem([{
    ...chelator,
    name: 'Custom GLDA grade',
    activeMatterPct: 50,
    chelatingCapacityMgPerGram: 100,
    chelatingCapacityEvidenceId: 'TEST-CAPACITY-EVIDENCE',
    chelatingCapacityBasis: 'ACTIVE_MATERIAL'
  }], 50, 10);
  assert('Explicit active-material capacity is assay-scaled exactly once', activeBasis.calciumCapacityMgPerDose === 250);

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
