import { calculateBatchCost, calculateCommercialMarginChain, calculateProfitAndMargin } from '../calculators';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  group: string;
  passed: boolean;
  actual: any;
  expected: any;
  difference: string;
  message: string;
}

const results: TestResult[] = [];

function assertNear(group: string, name: string, actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;
  results.push({
    group,
    name,
    passed,
    actual,
    expected,
    difference: diff.toFixed(4),
    message: passed
      ? `PASS (actual: ${actual}, expected: ${expected}, diff: ${diff.toFixed(4)})`
      : `FAIL (actual: ${actual}, expected: ${expected}, diff: ${diff.toFixed(4)})`
  });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${group} :: ${name}`);
  console.log(`   Inputs & Calculation -> Expected: ${expected}, Actual: ${actual}, Diff: ${diff.toFixed(4)}`);
}

export function runMarginChainTestSuite() {
  results.length = 0;

  // ==========================================
  // GROUP 1 — RAW MATERIAL & BATCH COST SCALING
  // ==========================================
  const controlledFormula: FormulationIngredient[] = [
    { id: '1', name: 'Ingredient A', percentage: 50, costPerKg: 100 },
    { id: '2', name: 'Ingredient B', percentage: 30, costPerKg: 50 },
    { id: '3', name: 'Ingredient C', percentage: 20, costPerKg: 0 }
  ];

  const rawCostPerKg = calculateBatchCost(controlledFormula, 1);
  assertNear('Raw Material Cost', 'Controlled Formula Cost/kg (50%@100 + 30%@50 + 20%@0)', rawCostPerKg, 65.00);

  const batch100 = calculateBatchCost(controlledFormula, 100);
  assertNear('Batch Scaling', 'Proportional Batch Cost @ 100 kg', batch100, 6500.00);

  const batch50 = calculateBatchCost(controlledFormula, 50);
  assertNear('Batch Scaling', 'Proportional Batch Cost @ 50 kg', batch50, 3250.00);

  const batch200 = calculateBatchCost(controlledFormula, 200);
  assertNear('Batch Scaling', 'Proportional Batch Cost @ 200 kg', batch200, 13000.00);

  // ==========================================
  // GROUP 2 — FIELD ALIASES & EXPLICIT ZEROS
  // ==========================================
  const aliasFormula: FormulationIngredient[] = [
    { id: '1', name: 'Ing Alias 1', percent: 50, costPerKg: 100 } as any,
    { id: '2', name: 'Ing Alias 2', percentageInFormula: 30, costPerKg: 50 } as any,
    { id: '3', name: 'Ing Alias 3', percentage: 20, costPerKg: 0 }
  ];
  const aliasCostPerKg = calculateBatchCost(aliasFormula, 1);
  assertNear('Field Aliases', 'Canonical percentage/percent/percentageInFormula parsing', aliasCostPerKg, 65.00);

  const zeroCostFormula: FormulationIngredient[] = [
    { id: '1', name: 'Deionized Water', percentage: 80, costPerKg: 0 },
    { id: '2', name: 'Active Ingredient', percentage: 20, costPerKg: 100 }
  ];
  const zeroCostPerKg = calculateBatchCost(zeroCostFormula, 1);
  assertNear('Explicit Zero', 'Explicit zero costPerKg remains 0 (Water @ 0/kg)', zeroCostPerKg, 20.00);

  // ==========================================
  // GROUP 3 — COMMERCIAL MARGIN CHAIN STAGES
  // ==========================================
  const chain0 = calculateCommercialMarginChain(controlledFormula, 100, 0, 15);
  assertNear('Manufacturing Overhead', '0% Overhead Manufacturing Cost', chain0.manufacturingCost, 65.00);

  const chain10 = calculateCommercialMarginChain(controlledFormula, 100, 10, 15);
  assertNear('Manufacturing Overhead', '10% Overhead Manufacturing Cost', chain10.manufacturingCost, 71.50);

  const chain12 = calculateCommercialMarginChain(controlledFormula, 100, 12, 15);
  assertNear('Manufacturing Overhead', '12% Overhead Manufacturing Cost', chain12.manufacturingCost, 72.80);

  const chain20 = calculateCommercialMarginChain(controlledFormula, 100, 20, 15);
  assertNear('Manufacturing Overhead', '20% Overhead Manufacturing Cost', chain20.manufacturingCost, 78.00);

  assertNear('Packaging & Ex-Factory', 'Ex-Factory Cost (Manufacturing 72.80 + Packaging 15.00)', chain12.finalExFactoryCost, 87.80);

  assertNear('Commercial Tiering', 'Distributor Price (15% markup on Ex-Factory)', chain12.suggestedDistributor, 100.97);
  assertNear('Commercial Tiering', 'Wholesale Price (20% markup on Ex-Factory)', chain12.suggestedWholesale, 105.36);
  assertNear('Commercial Tiering', 'Retail Price (25% markup on Ex-Factory)', chain12.suggestedRetail, 109.75);
  assertNear('GST & MRP Model', 'Suggested MRP (18% GST on Retail 109.75)', chain12.suggestedMRP, 129.51);

  // ==========================================
  // GROUP 4 — PROFIT & MARGIN VS MARKUP
  // ==========================================
  const pmNormal = calculateProfitAndMargin(100, 125);
  assertNear('Profit & Margin', 'Normal Profit (125 - 100)', pmNormal.profit, 25.00);
  assertNear('Profit & Margin', 'Normal Markup % ((25 / 100) * 100)', pmNormal.markupPct, 25.00);
  assertNear('Profit & Margin', 'Normal Gross Margin % ((25 / 125) * 100)', pmNormal.grossMarginPct, 20.00);

  const pmLoss = calculateProfitAndMargin(100, 80);
  assertNear('Profit & Margin', 'Negative Profit (80 - 100)', pmLoss.profit, -20.00);
  assertNear('Profit & Margin', 'Negative Gross Margin % ((-20 / 80) * 100)', pmLoss.grossMarginPct, -25.00);

  const pmZero = calculateProfitAndMargin(100, 100);
  assertNear('Profit & Margin', 'Zero Profit (100 - 100)', pmZero.profit, 0.00);
  assertNear('Profit & Margin', 'Zero Gross Margin %', pmZero.grossMarginPct, 0.00);

  // ==========================================
  // SUMMARY REPORTING
  // ==========================================
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n==================================================');
  console.log('  COMMERCIAL MARGIN CHAIN REGRESSION SUITE  ');
  console.log('==================================================\n');
  console.log(`TOTAL MARGIN CHAIN TESTS : ${total}`);
  console.log(`PASSED                   : ${passed}`);
  console.log(`FAILED                   : ${failed}\n`);

  return { total, passed, failed, results };
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('marginChain.regression.test')) {
  const summary = runMarginChainTestSuite();
  if (summary.failed > 0) {
    process.exit(1);
  }
}
