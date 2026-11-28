import assert from 'node:assert/strict';
import { evaluateAIGrade } from '../src/utils/gradeEngine';

const intervalFormula = [
  {
    id: 'sles-70', canonicalIngredientId: 'sles-70', name: 'SLES', category: 'anionic surfactant', percentage: 50,
    activeMatterPct: 28, activeMatterLowerPct: 16, activeMatterUpperPct: 24,
    activeMatterInputSource: 'USER_ENTERED'
  },
  { id: 'water', name: 'Deionized Water', category: 'water', percentage: 50, activeMatterPct: 0 }
];
const intervalGrade = evaluateAIGrade(intervalFormula, 7, 100, 'LAUNDRY_LIQUID');
assert.equal(intervalGrade.isEvaluable, true);
assert.equal(intervalGrade.breakdown.boundedActiveMatterStatus, 'COMPLETE');
assert.equal(intervalGrade.breakdown.activeMatterLowerPct, 8);
assert.equal(intervalGrade.breakdown.activeMatterUpperPct, 12);
// Conservative score is min(score(8%)=80, score(12%)=100).
assert.equal(intervalGrade.breakdown.activeMatterScore, 80);
assert.equal(intervalGrade.evidenceLevel, 'PREDICTED_ONLY');

const unknownAssayGrade = evaluateAIGrade([
  { id: 'unknown', name: 'Unverified surfactant grade', category: 'surfactant', percentage: 10 },
  { id: 'water', name: 'Deionized Water', category: 'water', percentage: 90, activeMatterPct: 0 }
], 7, 100, 'LAUNDRY_LIQUID');
assert.equal(unknownAssayGrade.isEvaluable, false);
assert.equal(unknownAssayGrade.grade, 'N/A');
assert(unknownAssayGrade.blockingIssues.some(issue => issue.includes('BOUNDED_ACTIVE_MATTER_INSUFFICIENT_DATA')));

console.log('PHASE 5B-1 GRADE ENGINE BOUNDED INTERVAL REGRESSIONS PASS');
