import { readFileSync } from 'node:fs';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const analyzer = readFileSync('src/components/SmartFormulaAnalyzerPro.tsx', 'utf8');
const policy = readFileSync('src/utils/aiScientificValidationPolicy.ts', 'utf8');

assert(analyzer.includes('assessAiScientificValidation'), 'Production analyzer must import and invoke the scientific validation policy.');
assert(analyzer.includes("evidenceRoute: 'MISSING'"), 'Analyzer must fail closed when no supplier lot evidence is attached.');
assert(analyzer.includes('exactIdentityAndGrade: false'), 'Analyzer must not infer exact commercial grade identity from catalog matching.');
assert(analyzer.includes('matchedBenchmarkAvailable: false'), 'Analyzer must not fabricate a held-out endpoint benchmark.');
assert(analyzer.includes('orchestratorReport.massBalance?.isBalanced === true'), 'Analyzer must bind the mass-balance gate to the authoritative orchestrator result.');
assert(analyzer.includes('orchestratorReport.pHResult?.solverConverged === true'), 'Analyzer must bind the charge-balance gate to the pH solver convergence result.');
assert(analyzer.includes('data-testid="ai-scientific-validation-panel"'), 'The evidence-gated assessment must be visible in the production analyzer UI.');
assert(analyzer.includes('requiredDisclosure'), 'The production analyzer must display the mandatory scientific disclosure.');
assert(analyzer.includes('aiScientificValidation?.userLabel'), 'The PDF export must include the evidence-gate disposition.');
assert(policy.includes('EVIDENCE_GATED_COMPOSITE_SCREENING_SCORE_NOT_ACCURACY'), 'Policy must explicitly prohibit interpreting the composite score as accuracy.');
assert(policy.includes('endpointBenchmarkQualified') && policy.includes('supplierLotVerified'), 'Policy must keep endpoint benchmark qualification separate from supplier-lot verification.');

console.log('AI scientific validation analyzer integration: 12/12 assertions passed.');
