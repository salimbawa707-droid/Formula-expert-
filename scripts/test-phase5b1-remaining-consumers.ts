import assert from 'node:assert/strict';
import { buildBoundedActiveMatterReport, buildBoundedCostReport } from '../src/utils/boundedFormulaAdapter';
import { calculateActiveMatter, calculateBoundedActiveMatter, calculateBoundedFormulaCost, generateFormulationWarnings } from '../src/utils/calculators';
import { ScientificExecutionDAG } from '../src/utils/orchestrator/scientificExecutionDAG';

const completeScenario = buildBoundedActiveMatterReport([
  { id: 'sles', name: 'SLES 28%', percentage: 10, activeMatterPct: 28, activeMatterInputSource: 'CATALOG_DEFAULT' } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]);
assert.equal(completeScenario.status, 'COMPLETE');
assert.equal(completeScenario.totalActiveNominalPct, 2.8);
assert.equal(completeScenario.releaseEligible, false);
assert(completeScenario.provenance.some(x => x.evidenceClass === 'CATALOG_DEFAULT'));

const unknownAssay = buildBoundedActiveMatterReport([
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
  { id: 'unknown', name: 'Unknown surfactant grade', percentage: 10 } as any,
]);
assert.equal(unknownAssay.status, 'INSUFFICIENT_DATA');
assert.equal(unknownAssay.unknownRawPercent, 10);
assert.equal(unknownAssay.totalActiveNominalPct, null);
assert.deepEqual(unknownAssay.missingIngredientIds, ['unknown']);

const incompletePrice = buildBoundedCostReport([
  { id: 'priced', name: 'Priced ingredient', percentage: 90, costPerKg: 2 } as any,
  { id: 'unpriced', name: 'Unpriced ingredient', percentage: 10, costPerKg: null } as any,
], 100);
assert.equal(incompletePrice.status, 'INSUFFICIENT_DATA');
assert.equal(incompletePrice.knownSubtotalNominalPerKg, 1.8);
assert.equal(incompletePrice.totalCostNominalPerKg, null);
assert.equal(incompletePrice.batchCostNominal, null);
assert.equal(incompletePrice.unknownRawPercent, 10);
assert.equal(incompletePrice.releaseEligible, false);

const fullPrice = buildBoundedCostReport([
  { id: 'a', name: 'A', percentage: 50, costPerKg: 2 } as any,
  { id: 'b', name: 'B', percentage: 50, costPerKg: 4 } as any,
], 20);
assert.equal(fullPrice.status, 'COMPLETE');
assert.equal(fullPrice.totalCostNominalPerKg, 3);
assert.equal(fullPrice.batchCostNominal, 60);
assert.equal(fullPrice.releaseEligible, false);


const calculatorBoundedActive = calculateBoundedActiveMatter([
  { id: 'sles-28', name: 'SLES 28%', percentage: 10, activeMatterPct: 28, activeMatterInputSource: 'USER_ENTERED' } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]);
assert.equal(calculatorBoundedActive.status, 'COMPLETE');
assert.equal(calculatorBoundedActive.totalActiveNominalPct, 2.8);
assert.equal(calculatorBoundedActive.releaseEligible, false);
assert.equal(calculateActiveMatter([
  { id: 'sles-28', name: 'SLES 28%', percentage: 10, activeMatterPct: 28, activeMatterInputSource: 'USER_ENTERED' } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]), 2.8);

const calculatorBoundedCost = calculateBoundedFormulaCost([
  { id: 'priced', name: 'Priced', percentage: 90, costPerKg: 2 } as any,
  { id: 'unpriced', name: 'Unpriced', percentage: 10 } as any,
], 10);
assert.equal(calculatorBoundedCost.status, 'INSUFFICIENT_DATA');
assert.equal(calculatorBoundedCost.unknownRawPercent, 10);
assert.equal(calculatorBoundedCost.totalCostNominalPerKg, null);
assert.equal(calculatorBoundedCost.releaseEligible, false);

assert(generateFormulationWarnings([
  { id: 'unknown', name: 'Unverified surfactant', percentage: 10 } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]).some(message => message.includes('incomplete or unknown')));
assert.equal(generateFormulationWarnings([
  { id: 'low', name: 'SLES 28%', percentage: 10, activeMatterPct: 28, activeMatterInputSource: 'USER_ENTERED' } as any,
  { id: 'water', name: 'Deionized Water', percentage: 90 } as any,
]).some(message => message.includes('below 5%')), true);


const dag = new ScientificExecutionDAG();
const dagWithUnknownAssay = dag.executeDAG({
  formulaId: 'PHASE5B1-BOUNDED-DAG-UNKNOWN',
  formulaName: 'Bounded evidence DAG regression',
  formulaVersion: '1.0.0',
  productCategory: 'LAUNDRY_LIQUID',
  batchSizeKg: 100,
  waterHardnessPpm: 100,
  washVolumeL: 10,
  washDoseGrams: 50,
  ingredients: [
    { id: 'water', name: 'Water', percentage: 90, activeMatterPct: 0, role: 'Solvent' },
    { id: 'unverified', name: 'Unverified surfactant grade', percentage: 10, role: 'Anionic Surfactant' },
  ],
} as any);
assert.equal(dagWithUnknownAssay.state.activeMatterReport.boundedEvidence.status, 'INSUFFICIENT_DATA');
assert.equal(dagWithUnknownAssay.state.activeMatterReport.unknownActiveRawMassPct, 10);
assert.equal(dagWithUnknownAssay.state.activeMatterReport.releaseEligible, false);

console.log('PHASE 5B-1 REMAINING CONSUMER ADAPTER REGRESSIONS PASS');
