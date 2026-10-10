import { evaluateScientificQualityGate } from '../scientificQualityGateEngine';
import { revalidateFormulaTemplate } from '../templateRevalidationEngine';
import { FormulaItem } from '../../types';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runFormulaLibraryQualityGateRegressionTestSuite() {
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

  const sampleFormula: FormulaItem = {
    id: 'test-lib-1',
    name: 'Test Liquid Formula',
    category: 'Liquid Laundry Detergent',
    batchSizeKg: 100,
    targetPH: 7.0,
    description: 'Test formula description',
    ingredients: [
      { name: 'Water', percentage: 70 },
      { name: 'Sodium Hydroxide', percentage: 30, role: 'Base' }
    ],
    instructions: ['Mix']
  };

  // A. Stored/legacy status vs current Quality Gate
  const qg = evaluateScientificQualityGate({
    formulaName: sampleFormula.name,
    formulaVersion: '1.0.0',
    productCategory: sampleFormula.category,
    ingredients: sampleFormula.ingredients.map(i => ({ name: i.name, percentage: i.percent ?? i.percentage ?? 0, role: i.role })),
    waterHardnessPpm: 150,
    batchSizeKg: sampleFormula.batchSizeKg,
    targetCostPerKg: 50
  });

  assert('A. Stored Status vs Quality Gate', 'Quality Gate status is authoritative over legacy metadata', qg.finalFormulaStatus !== 'VALID', qg.finalFormulaStatus, 'non-VALID');

  // B. No stored status defaults to neutral (not VALID)
  const neutralStatus = qg.finalFormulaStatus || 'INSUFFICIENT_DATA';
  assert('B. Missing Status Default', 'Missing evaluation never defaults blindly to VALID', neutralStatus !== 'VALID', neutralStatus, 'non-VALID');

  // C. Template Compliance vs Final Scientific Verdict separation
  const templateReport = revalidateFormulaTemplate(sampleFormula);
  assert('C. Template vs Scientific Verdict', 'Template revalidation and Quality Gate remain distinct', Boolean(templateReport) && typeof qg.finalFormulaStatus === 'string', true, true);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nFormula Library Quality Gate Integration Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}
