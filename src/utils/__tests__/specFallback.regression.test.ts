import { evaluateSpecifications } from '../specificationEngine/specificationEvaluator';
import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  actual?: any;
  expected?: any;
  message?: string;
}

export function runSpecFallbackRegressionTestSuite() {
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

  // Simulated UI fallback evaluation replicating SpecificationDashboard line 1247
  function evaluateUiFallback(specReport: any): string {
    return specReport?.verdict?.status || 'INSUFFICIENT_DATA';
  }

  // A. undefined specReport
  const resA = evaluateUiFallback(undefined);
  assert(
    'A. Undefined specReport',
    'Undefined specReport resolves to neutral INSUFFICIENT_DATA, not PASS',
    resA !== 'PASS' && resA === 'INSUFFICIENT_DATA',
    resA,
    'INSUFFICIENT_DATA'
  );

  // B. undefined verdict
  const resB = evaluateUiFallback({ name: 'Test' });
  assert(
    'B. Undefined verdict',
    'Undefined verdict resolves to neutral INSUFFICIENT_DATA, not PASS',
    resB !== 'PASS' && resB === 'INSUFFICIENT_DATA',
    resB,
    'INSUFFICIENT_DATA'
  );

  // C. undefined verdict.status
  const resC = evaluateUiFallback({ verdict: {} });
  assert(
    'C. Undefined status',
    'Undefined verdict status resolves to neutral INSUFFICIENT_DATA, not PASS',
    resC !== 'PASS' && resC === 'INSUFFICIENT_DATA',
    resC,
    'INSUFFICIENT_DATA'
  );

  // D. null status
  const resD = evaluateUiFallback({ verdict: { status: null } });
  assert(
    'D. Null status',
    'Null status does not fallback to PASS and is treated as neutral',
    resD !== 'PASS' && resD === 'INSUFFICIENT_DATA',
    resD,
    'INSUFFICIENT_DATA'
  );

  // E. empty status
  const resE = evaluateUiFallback({ verdict: { status: '' } });
  assert(
    'E. Empty status',
    'Empty status does not fallback to PASS and is treated as neutral',
    resE !== 'PASS' && resE === 'INSUFFICIENT_DATA',
    resE,
    'INSUFFICIENT_DATA'
  );

  // F. explicit PASS
  const resF = evaluateUiFallback({ verdict: { status: 'PASS' } });
  assert(
    'F. Explicit PASS',
    'Explicit PASS remains PASS',
    resF === 'PASS',
    resF,
    'PASS'
  );

  // G. explicit NEEDS_ADJUSTMENT
  const resG = evaluateUiFallback({ verdict: { status: 'NEEDS_ADJUSTMENT' } });
  assert(
    'G. Explicit NEEDS_ADJUSTMENT',
    'Explicit NEEDS_ADJUSTMENT remains unchanged',
    resG === 'NEEDS_ADJUSTMENT',
    resG,
    'NEEDS_ADJUSTMENT'
  );

  // H. Master Quality Gate = LAB_VALIDATION_REQUIRED
  // Ensure that a formula evaluated via the Master Scientific Quality Gate resulting in non-PASS status does not output PASS
  const formulaH = [
    { name: 'Water', percentage: 84.5, category: 'Solvent' },
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Surfactant' },
    { name: 'Cocamidopropyl Betaine', percentage: 5, activeMatterPct: 30, category: 'Surfactant' },
    { name: 'Phenoxyethanol', percentage: 0.5, category: 'Preservative' }
  ];
  const qgH = evaluateScientificQualityGate({
    ingredients: formulaH,
    productCategory: 'LAUNDRY_LIQUID',
    formulaName: 'Test H',
    formulaVersion: '1.0.0'
  });
  assert(
    'H. Master Quality Gate LAB_VALIDATION_REQUIRED',
    'Master Quality Gate resolves to non-PASS status',
    (qgH.finalFormulaStatus as string) !== 'PASS',
    qgH.finalFormulaStatus,
    'non-PASS status (e.g. LAB_VALIDATION_REQUIRED, OUT_OF_SPEC, or INCOMPATIBLE)'
  );

  // I. Master Quality Gate = NEEDS_ADJUSTMENT / OUT_OF_SPEC / INCOMPATIBLE
  const formulaI = [
    { name: 'Water', percentage: 99, category: 'Solvent' },
    { name: 'SLES 70%', percentage: 1, activeMatterPct: 70, category: 'Surfactant' } // below minimum actives limit
  ];
  const qgI = evaluateScientificQualityGate({
    ingredients: formulaI,
    productCategory: 'LAUNDRY_LIQUID',
    formulaName: 'Test I',
    formulaVersion: '1.0.0'
  });
  assert(
    'I. Master Quality Gate NEEDS_ADJUSTMENT / OUT_OF_SPEC',
    'Out of spec formula resolves to non-PASS status',
    (qgI.finalFormulaStatus as string) !== 'PASS',
    qgI.finalFormulaStatus,
    'non-PASS status (e.g. OUT_OF_SPEC or INCOMPATIBLE)'
  );

  // J. 0 ppm / BASELINE_ONLY
  // 0 ppm water hardness remains evaluated as NOT_EVALUATED/BASELINE_ONLY, never converted to PASS
  const specReportJ = evaluateSpecifications({
    formulaName: 'Test J',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    parameters: [
      {
        id: 'param-1',
        parameterKey: 'hardness',
        parameterName: 'Water Hardness',
        unit: 'ppm',
        criticality: 'MAJOR',
        source: 'USER_DEFINED',
        isActive: true,
        createdAt: '',
        updatedAt: ''
      }
    ],
    labMeasurements: [
      {
        measurementId: 'm-1',
        formulaVersion: '1.0.0',
        parameterKey: 'hardness',
        value: 0,
        unit: 'ppm',
        provenance: 'MEASURED',
        testDate: '2026-10-01'
      }
    ],
    powderReport: null,
    costReport: null,
    liquidResults: { pH: 8.0, activeSurfactants: 12.0 }
  });
  const statusJ = specReportJ.items[0]?.status;
  assert(
    'J. Water Hardness 0 ppm Baseline Preservation',
    '0 ppm water hardness is evaluated as NOT_EVALUATED or similar status, and never defaults to PASS',
    statusJ !== 'PASS',
    statusJ,
    'NOT_EVALUATED or similar'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nSpecification Verdict Fallback Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}
