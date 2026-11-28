import assert from 'node:assert/strict';
import { evaluateAIGrade, scoreActiveMatterInterval } from '../src/utils/gradeEngine';

const intervalFormula = [
  {
    id: 'sles-70', canonicalIngredientId: 'sles-70', name: 'SLES', category: 'anionic surfactant', percentage: 50,
    activeMatterPct: 20, activeMatterLowerPct: 16, activeMatterUpperPct: 24,
    activeMatterInputSource: 'USER_ENTERED'
  },
  { id: 'water', name: 'Deionized Water', category: 'water', percentage: 50, activeMatterPct: 0 }
];
const intervalGrade = evaluateAIGrade(intervalFormula, 7, 100, 'LAUNDRY_LIQUID');
// This fixture has no complete wash scenario, so the overall grade must remain N/A.
assert.equal(intervalGrade.isEvaluable, false);
assert(intervalGrade.blockingIssues.includes('performance'));
// 50% raw ingredient at 16–24% active gives an 8–12% total active interval.
assert.equal(scoreActiveMatterInterval(8, 12), 80);
assert.equal(scoreActiveMatterInterval(16, 24), 100);
assert.equal(scoreActiveMatterInterval(12, 8), null);
assert.equal(scoreActiveMatterInterval(-1, 12), null);

const unknownAssayGrade = evaluateAIGrade([
  { id: 'unknown', name: 'Unverified surfactant grade', category: 'surfactant', percentage: 10 },
  { id: 'water', name: 'Deionized Water', category: 'water', percentage: 90, activeMatterPct: 0 }
], 7, 100, 'LAUNDRY_LIQUID');
assert.equal(unknownAssayGrade.isEvaluable, false);
assert.equal(unknownAssayGrade.grade, 'N/A');
assert(unknownAssayGrade.blockingIssues.some(issue => issue.includes('BOUNDED_ACTIVE_MATTER_INSUFFICIENT_DATA')));

console.log('PHASE 5B-1 GRADE ENGINE BOUNDED INTERVAL REGRESSIONS PASS');
