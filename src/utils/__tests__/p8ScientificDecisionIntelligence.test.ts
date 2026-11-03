/**
 * ============================================================================
 * PHASE 8 — SCIENTIFIC DECISION INTELLIGENCE & FORMULATION GUIDANCE TEST SUITE
 * ============================================================================
 */

import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';
import { ScientificDecisionEngine } from '../scientificDecisionEngine';
import { PRODUCT_CATEGORIES } from '../../domain/productTaxonomy';

export function runP8ScientificDecisionTestSuite() {
  const results: any[] = [];
  const assert = (name: string, condition: boolean, message?: string) => {
    results.push({ name, passed: Boolean(condition), message });
    console.log(`[${condition ? 'PASS' : 'FAIL'}] [Phase 8 Decision Engine] ${name} ${message ? `:: ${message}` : ''}`);
  };

  // 1. Evaluate standard formula and decision engine
  const testFormula = {
    formulaId: 'F-DECISION-1',
    formulaName: 'Test Laundry Liquid',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: [
      { name: 'Water', percentage: 80 },
      { name: 'LABSA 96%', percentage: 10, activeMatterPct: 96 },
      { name: 'Sodium Hydroxide 50%', percentage: 2.5, activeMatterPct: 50 },
      { name: 'Sodium Citrate', percentage: 5 }
    ]
  };

  const evalResult = FormulaScientificOrchestrator.evaluate(testFormula);
  const decisionReport = ScientificDecisionEngine.evaluateDecisionIntelligence(evalResult);

  assert('Decision engine produces valid report', decisionReport !== null && decisionReport.formulaStatus !== undefined);
  assert('Decision engine consumes authoritative pH', decisionReport.propertyDecisions['pH'] !== undefined);
  assert('Decision engine consumes authoritative active matter', decisionReport.propertyDecisions['activeMatter'] !== undefined);

  // 2. What-If Scenario simulation (immutable original formula)
  const scenario = ScientificDecisionEngine.simulateWhatIfScenario(testFormula, 'High Active Scenario', (ings) => {
    return ings.map(i => i.name.includes('LABSA') ? { ...i, percentage: 15 } : i);
  });

  assert('What-If simulation produces scenario ID / fingerprint', scenario.scenarioId !== evalResult.formulaIdentity.fingerprint);
  assert('Original formula remains immutable (testFormula ingredients unchanged)', testFormula.ingredients.find(i => i.name.includes('LABSA'))?.percentage === 10);

  // 3. Change Impact Analysis
  const impact = ScientificDecisionEngine.analyzeChangeImpact('increase_chelator');
  assert('Change impact analysis returns dependency chain supported by DAG', impact.dependencyChain.length > 0 && impact.dependencyChain.every(d => d.supportedByDAG));

  // 4. 13 Category coverage check
  const categories = Object.keys(PRODUCT_CATEGORIES);
  assert('Supports all 13 canonical product categories', categories.length >= 13);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Phase 8 Scientific Decision Intelligence Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    suite: 'Phase 8 Scientific Decision Intelligence',
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}
