import { describe, expect, it } from 'bun:test';
import { FormulaScientificOrchestrator } from '../orchestrator/formulaScientificOrchestrator';

describe('P0 Scientific Integrity: No Implicit Defaults', () => {
  it('should not allow unknown active matter to default to 100%', () => {
    const result = FormulaScientificOrchestrator.evaluate({
      formulaName: 'Test P0 Integrity',
      productCategory: 'LAUNDRY_LIQUID',
      ingredients: [{ name: 'Unknown Chemical', percentage: 10 }]
    });

    // Integrity check: Unknown active matter should NOT result in 100% active matter,
    // and should be flagged as unverified/incomplete.
    expect(result.totalActiveMatterPct).toBeLessThan(100);
    expect(result.activeMatterStatus).not.toBe('VALID');
    expect(result.activeMatterStatus).toBe('INSUFFICIENT_DATA');
  });

  it('should not allow pH to fallback to 7.0', () => {
    // Formulation designed to fail pH solver
    const result = FormulaScientificOrchestrator.evaluate({
      formulaName: 'Test pH Fallback',
      productCategory: 'LAUNDRY_LIQUID',
      ingredients: [{ name: 'Strong Acid', percentage: 100, activeMatterPct: 100 }]
    });

    // Integrity check: Failed pH should NOT be 7.0.
    expect(result.finalEquilibriumPH).not.toBe(7.0);
    expect(result.phStatus).not.toBe('VALID');
    expect(result.phStatus).toBe('INSUFFICIENT_DATA');
  });
});
