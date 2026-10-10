import { calculateLiquidNVR, isKnownVolatile, NVRResult } from '../liquidNvrEngine';
import { calculateActiveSurfactants } from '../calculators';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runLiquidNvrRegressionTestSuite() {
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

  // A. Ingredient with known nonVolatileFraction
  const ingA = [
    { name: 'Water', percentage: 80, role: 'Solvent' },
    { name: 'SLES 28%', percentage: 15, role: 'Anionic Surfactant', nonVolatileFraction: 0.28 },
    { name: 'Sodium Chloride', percentage: 5, role: 'Salt', nonVolatileFraction: 1.0 }
  ];
  const resA: NVRResult = calculateLiquidNVR(ingA, 10);
  assert('A. Known Nonvolatile Fractions', 'Liquid NVR calculation is correct', resA.nvrPercentage === 9.2, resA.nvrPercentage, 9.2);
  assert('A. Known Nonvolatile Fractions', 'Status is COMPLETE for fully documented formula', resA.status === 'COMPLETE' && resA.isComplete === true, resA.status, 'COMPLETE');

  // B. Water/known volatile ingredient
  const ingB = [
    { name: 'Water', percentage: 70, role: 'Solvent' },
    { name: 'Isopropyl Alcohol', percentage: 10, role: 'Solvent', nonVolatileFraction: 0.0 },
    { name: 'Active Polymer', percentage: 20, role: 'Polymer', nonVolatileFraction: 1.0 }
  ];
  const resB = calculateLiquidNVR(ingB, 100);
  assert('B. Volatile Solvents', 'Volatiles contribute 0.0% to NVR', resB.nvrPercentage === 20, resB.nvrPercentage, 20);
  assert('B. Volatile Solvents', 'isKnownVolatile detects ethanol and water', isKnownVolatile({ name: 'Ethanol' }) && isKnownVolatile({ name: 'DI Water' }), true, true);

  // C. Ingredient with missing nonVolatileFraction
  const ingC = [
    { name: 'Water', percentage: 85 },
    { name: 'Unknown Botanical Extract', percentage: 15, role: 'Specialty Additive' }
  ];
  const resC = calculateLiquidNVR(ingC, 50);
  assert('C. Missing Nonvolatile Fraction', 'Unknown ingredient is NOT assumed to be 100% NVR', resC.nvrPercentage === 0.0, resC.nvrPercentage, 0.0);
  assert('C. Missing Nonvolatile Fraction', 'Formula is flagged with INSUFFICIENT_DATA status', resC.status === 'INSUFFICIENT_DATA' && !resC.isComplete, resC.status, 'INSUFFICIENT_DATA');
  assert('C. Missing Nonvolatile Fraction', 'Unknown ingredient is tracked in unknownIngredients list', resC.unknownIngredients.includes('Unknown Botanical Extract'), resC.unknownIngredients, ['Unknown Botanical Extract']);

  // D. Mixed formula containing known + unknown NVR ingredients
  const ingD = [
    { name: 'Water', percentage: 60, role: 'Solvent' },
    { name: 'SLES 70%', percentage: 20, nonVolatileFraction: 0.70 },
    { name: 'Unknown Polymer Blend', percentage: 20 }
  ];
  const resD = calculateLiquidNVR(ingD, 100);
  assert('D. Mixed Known + Unknown', 'Known portion calculates 14.0% NVR', resD.nvrPercentage === 14.0, resD.nvrPercentage, 14.0);
  assert('D. Mixed Known + Unknown', 'Data completeness reflects 80% known mass', resD.dataCompleteness === 80.0, resD.dataCompleteness, 80.0);
  assert('D. Mixed Known + Unknown', 'Unknown mass percent is exactly 20.0%', resD.unknownMassPercent === 20.0, resD.unknownMassPercent, 20.0);

  // E. Verify unknown ingredient does NOT become 100% NVR
  const ingE = [
    { name: 'Water', percentage: 90 },
    { name: 'Secret Chemical Compound X', percentage: 10 }
  ];
  const resE = calculateLiquidNVR(ingE, 100);
  assert('E. Non-100% Fallback', 'Unknown chemical does not default to 10% NVR (100% fraction)', resE.nvrPercentage !== 10.0 && resE.nvrPercentage === 0.0, resE.nvrPercentage, 0.0);

  // F. Changing an unknown ingredient does not silently fabricate an NVR value
  const ingF1 = [{ name: 'Water', percentage: 80 }, { name: 'Unknown Additive A', percentage: 20 }];
  const ingF2 = [{ name: 'Water', percentage: 80 }, { name: 'Unknown Additive B', percentage: 20 }];
  const resF1 = calculateLiquidNVR(ingF1, 100);
  const resF2 = calculateLiquidNVR(ingF2, 100);
  assert('F. No Fabricated Value', 'Different unknown ingredients remain transparently unknown without fabricated values', resF1.nvrPercentage === 0.0 && resF2.nvrPercentage === 0.0, { f1: resF1.nvrPercentage, f2: resF2.nvrPercentage }, { f1: 0.0, f2: 0.0 });

  // G. Complete-data formula calculates normally
  const ingG = [
    { name: 'Water', percentage: 75 },
    { name: 'LABSA 96%', percentage: 10, nonVolatileFraction: 0.96 },
    { name: 'Caustic Soda 50%', percentage: 2, nonVolatileFraction: 0.50 },
    { name: 'SLES 70%', percentage: 10, nonVolatileFraction: 0.70 },
    { name: 'Salt', percentage: 3, nonVolatileFraction: 1.0 }
  ];
  const resG = calculateLiquidNVR(ingG, 100);
  // Expected NVR: 10*0.96 + 2*0.50 + 10*0.70 + 3*1.0 = 9.6 + 1.0 + 7.0 + 3.0 = 20.6%
  assert('G. Complete Data Calculation', 'Complete formula calculates exact deterministic NVR', resG.nvrPercentage === 20.6, resG.nvrPercentage, 20.6);
  assert('G. Complete Data Calculation', 'Status is COMPLETE and completeness is 100%', resG.status === 'COMPLETE' && resG.dataCompleteness === 100.0, { status: resG.status, comp: resG.dataCompleteness }, { status: 'COMPLETE', comp: 100.0 });

  // H. Incomplete-data formula receives neutral state
  const ingH = [
    { name: 'Water', percentage: 90 },
    { name: 'Uncharacterized Fragrance Oil', percentage: 10 }
  ];
  const resH = calculateLiquidNVR(ingH, 100);
  assert('H. Neutral State for Incomplete Data', 'Incomplete formula receives INSUFFICIENT_DATA status and provenance', resH.status === 'INSUFFICIENT_DATA' && resH.provenance === 'INSUFFICIENT_DATA', { status: resH.status, prov: resH.provenance }, { status: 'INSUFFICIENT_DATA', prov: 'INSUFFICIENT_DATA' });

  // I. Powder engine separation & Active Matter independence
  const ingI = [
    { name: 'Water', percentage: 80 },
    { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96, nonVolatileFraction: 0.96 },
    { name: 'Salt', percentage: 10, nonVolatileFraction: 1.0 }
  ];
  const nvrI = calculateLiquidNVR(ingI, 100);
  const activeI = calculateActiveSurfactants(ingI);
  assert('I. Active vs NVR Independence', 'Active Matter and NVR remain distinct independent properties', activeI !== nvrI.nvrPercentage, { active: activeI, nvr: nvrI.nvrPercentage }, 'Distinct values');

  // J. UI/Provenance distinguishes calculated NVR from lab-measured NVR
  const ingJ = [{ name: 'Base Chemical', percentage: 100, nonVolatileFraction: 0.50 }];
  const resJ = calculateLiquidNVR(ingJ, 10);
  assert('J. Calculated Provenance', 'Complete NVR calculation carries CALCULATED provenance, never false LABORATORY_MEASURED', resJ.provenance === 'CALCULATED', resJ.provenance, 'CALCULATED');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nLiquid NVR Engine Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}
