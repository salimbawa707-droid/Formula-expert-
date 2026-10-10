import { FORMULAS } from '../../data/formulas';
import { CANONICAL_PRODUCT_CATEGORY_IDS } from '../../domain/productTaxonomy';
import { generateCurrentScientificReport } from '../../../scripts/audit_39_current_status';
import fs from 'fs';
import path from 'path';

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runCurrentScientificReportRegressionTestSuite() {
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

  // 1. Dynamic Formula Count Derivation
  const report = generateCurrentScientificReport();
  assert(
    'A. Dynamic Formula Count',
    'Formula count matches FORMULAS.length dynamically',
    report.metadata.totalFormulas === FORMULAS.length && report.formulas.length === FORMULAS.length,
    { meta: report.metadata.totalFormulas, formulaArrayLen: report.formulas.length },
    { expectedLen: FORMULAS.length }
  );

  // 2. Dynamic Taxonomy Category Count Derivation
  assert(
    'B. Dynamic Category Count',
    'Category count matches CANONICAL_PRODUCT_CATEGORY_IDS.length dynamically',
    report.metadata.totalCanonicalCategories === CANONICAL_PRODUCT_CATEGORY_IDS.length &&
    report.metadata.totalCanonicalCategories === 13,
    report.metadata.totalCanonicalCategories,
    CANONICAL_PRODUCT_CATEGORY_IDS.length
  );

  // 3. Dynamic Status Distribution Calculation
  const computedDistribution: Record<string, number> = {};
  for (const f of report.formulas) {
    computedDistribution[f.qgStatus] = (computedDistribution[f.qgStatus] || 0) + 1;
  }
  const metaDistribution = report.metadata.statusDistribution;
  const distributionMatches = Object.keys(computedDistribution).every(
    k => computedDistribution[k] === metaDistribution[k]
  );
  assert(
    'C. Dynamic Status Distribution',
    'Status distribution is computed dynamically from evaluation outputs',
    distributionMatches && Object.values(metaDistribution).reduce((a, b) => a + b, 0) === FORMULAS.length,
    metaDistribution,
    computedDistribution
  );

  // 4. Report Metadata & Scientific Integrity
  assert(
    'D. Scientific Provenance & Metadata',
    'Report metadata reflects calculated/predicted status and contains timestamp',
    !report.metadata.isLaboratoryMeasured &&
    report.metadata.provenance === 'CALCULATED_AND_PREDICTED' &&
    typeof report.metadata.generationTimestamp === 'string' &&
    report.metadata.generationTimestamp.length > 0,
    { isLab: report.metadata.isLaboratoryMeasured, prov: report.metadata.provenance },
    { isLab: false, prov: 'CALCULATED_AND_PREDICTED' }
  );

  // 5. Stale / Historical Report Protection
  const srcDir = path.join(process.cwd(), 'src');
  function scanDirForStaleReportImports(dir: string): string[] {
    const findings: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findings.push(...scanDirForStaleReportImports(fullPath));
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
        entry.name !== 'currentScientificReport.regression.test.ts'
      ) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (
          content.includes('detailed_39_analysis') ||
          content.includes('revalidation_39_output') ||
          content.includes('full-reconciliation') ||
          content.includes('step3_profile_revalidation')
        ) {
          findings.push(fullPath);
        }
      }
    }
    return findings;
  }

  const staleImports = scanDirForStaleReportImports(srcDir);
  assert(
    'E. Stale Report Protection',
    'No production src/ files import or depend on historical/stale reports',
    staleImports.length === 0,
    staleImports,
    []
  );

  // 6. JSON Artifact on Disk Consistency
  const reportPath = path.join(process.cwd(), 'test_reports', 'current_39_status.json');
  const reportExists = fs.existsSync(reportPath);
  let diskReportMatches = false;
  if (reportExists) {
    try {
      const fileData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      if (fileData && fileData.metadata && fileData.metadata.totalFormulas === FORMULAS.length) {
        diskReportMatches = true;
      }
    } catch {
      diskReportMatches = false;
    }
  }
  assert(
    'F. Disk Report Integrity',
    'test_reports/current_39_status.json exists and reflects dynamic metadata',
    diskReportMatches,
    diskReportMatches,
    true
  );

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nCurrent Scientific Report Regression Suite: ${passed}/${results.length} PASSED (${failed} FAILED)`);

  return {
    passed,
    failed,
    total: results.length,
    results
  };
}
