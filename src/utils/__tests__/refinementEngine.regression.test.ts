import { RefinementEngine } from '../refinementEngine';
import { DetailedLabEvidenceRecord } from '../labEvidenceEngine';

export function runRefinementEngineRegressionTestSuite() {
const category = 'LAUNDRY_LIQUID' as const;
const ingredient = [{ name: 'SLES', percentage: 15 }];

function record(input: {
  id: string;
  formulaId: string;
  version?: string;
  value: number;
  categoryId?: string;
  sampleId?: string;
  replicateNumber?: number;
}): DetailedLabEvidenceRecord {
  return {
    measurementId: input.id,
    formulaId: input.formulaId,
    formulaVersion: input.version || '1.0',
    parameterKey: 'ingredient:sles:percentage',
    value: input.value,
    unit: '%',
    testDate: '2026-11-27',
    provenance: 'MEASURED',
    qualityStatus: 'ACCEPTED',
    sourceType: 'LAB_MEASURED',
    categoryId: input.categoryId as any,
    sampleId: input.sampleId,
    replicateNumber: input.replicateNumber
  };
}

function proposal(records: DetailedLabEvidenceRecord[]) {
  return RefinementEngine.proposeAdjustments(ingredient as any, records, category)[0];
}

const results: Array<{ name: string; passed: boolean; actual: unknown; expected: unknown }> = [];
function check(name: string, condition: boolean, actual: unknown, expected: unknown) {
  results.push({ name, passed: condition, actual, expected });
}

// Category isolation: dishwash evidence must not influence laundry refinement.
const categoryScoped = proposal([
  record({ id: 'l1', formulaId: 'L1', value: 10 }),
  record({ id: 'l2', formulaId: 'L2', value: 20 }),
  record({ id: 'l3', formulaId: 'L3', value: 30 }),
  record({ id: 'd1', formulaId: 'D1', value: 99, categoryId: 'DISHWASH_MANUAL' })
]);
check('cross-category evidence excluded', categoryScoped?.proposedPercentage === 20, categoryScoped?.proposedPercentage, 20);

// Missing category cannot be treated as a wildcard.
const missingCategory = proposal([
  record({ id: 'm1', formulaId: 'M1', value: 10, categoryId: undefined }),
  record({ id: 'm2', formulaId: 'M2', value: 20, categoryId: undefined }),
  record({ id: 'm3', formulaId: 'M3', value: 30, categoryId: undefined })
]);
check('missing category fails closed', missingCategory === undefined, missingCategory, undefined);

// Equal formula weighting: ten replicates from F1 do not outweigh F2 and F3.
const manyReplicates = Array.from({ length: 10 }, (_, i) =>
  record({ id: `f1-r${i}`, formulaId: 'F1', value: 10, sampleId: `S${i}`, replicateNumber: i + 1 })
);
const balanced = proposal([
  ...manyReplicates,
  record({ id: 'f2-r1', formulaId: 'F2', value: 20, sampleId: 'S2', replicateNumber: 1 }),
  record({ id: 'f3-r1', formulaId: 'F3', value: 30, sampleId: 'S3', replicateNumber: 1 })
]);
check('formula IDs receive equal weight despite replicate count', Math.abs((balanced?.proposedPercentage || 0) - 20) < 1e-9, balanced?.proposedPercentage, 20);
check('replicate count is reported', balanced?.evidenceReplicateCount === 12, balanced?.evidenceReplicateCount, 12);

// Versions within a single formula are first averaged within formula, then formulas receive equal weight.
const versionBalanced = proposal([
  record({ id: 'v1a', formulaId: 'F1', version: '1.0', value: 10 }),
  record({ id: 'v1b', formulaId: 'F1', version: '2.0', value: 30 }),
  record({ id: 'v2', formulaId: 'F2', value: 40 }),
  record({ id: 'v3', formulaId: 'F3', value: 50 })
]);
check('formula versions do not multiply formula weight', Math.abs((versionBalanced?.proposedPercentage || 0) - (110 / 3)) < 0.01, versionBalanced?.proposedPercentage, 36.67);

// Three versions of one formula are not three independent formulas.
const sameFormulaVersions = proposal([
  record({ id: 'same1', formulaId: 'ONE', version: '1.0', value: 10 }),
  record({ id: 'same2', formulaId: 'ONE', version: '2.0', value: 20 }),
  record({ id: 'same3', formulaId: 'ONE', version: '3.0', value: 30 })
]);
check('three versions of one formula do not satisfy minimum independent formula count', sameFormulaVersions === undefined, sameFormulaVersions, undefined);

// Duplicate sample/replicate identity is counted once, not as another independent replicate.
const duplicateReplicate = proposal([
  record({ id: 'dup-a', formulaId: 'F1', value: 10, sampleId: 'S1', replicateNumber: 1 }),
  record({ id: 'dup-b', formulaId: 'F1', value: 10, sampleId: 'S1', replicateNumber: 1 }),
  record({ id: 'dup-c', formulaId: 'F2', value: 20, sampleId: 'S2', replicateNumber: 1 }),
  record({ id: 'dup-d', formulaId: 'F3', value: 30, sampleId: 'S3', replicateNumber: 1 })
]);
check('duplicate sample replicate is deduplicated', duplicateReplicate?.evidenceReplicateCount === 3, duplicateReplicate?.evidenceReplicateCount, 3);

// Conflicting values for one sample/replicate make that formula version ambiguous and excluded.
const conflictingDuplicate = proposal([
  record({ id: 'conf-a', formulaId: 'F1', value: 10, sampleId: 'S1', replicateNumber: 1 }),
  record({ id: 'conf-b', formulaId: 'F1', value: 11, sampleId: 'S1', replicateNumber: 1 }),
  record({ id: 'conf-c', formulaId: 'F2', value: 20 }),
  record({ id: 'conf-d', formulaId: 'F3', value: 30 })
]);
check('conflicting duplicate identity excludes the ambiguous formula version', conflictingDuplicate === undefined, conflictingDuplicate, undefined);

// Category aliases normalize through the canonical taxonomy.
const aliasCategory = proposal([
  record({ id: 'a1', formulaId: 'A1', value: 10, categoryId: 'Liquid Laundry' }),
  record({ id: 'a2', formulaId: 'A2', value: 20, categoryId: 'LAUNDRY_LIQUID' }),
  record({ id: 'a3', formulaId: 'A3', value: 30, categoryId: 'laundry liquid' })
]);
check('valid legacy category aliases normalize to canonical category', aliasCategory?.categoryId === category, aliasCategory?.categoryId, category);

// Calculated, unaccepted, non-percentage and incomplete evidence are rejected.
const invalidEvidence = proposal([
  record({ id: 'i1', formulaId: 'I1', value: 10 }),
  record({ id: 'i2', formulaId: 'I2', value: 20 }),
  { ...record({ id: 'i3', formulaId: 'I3', value: 30 }), sourceType: 'CALCULATED' },
  { ...record({ id: 'i4', formulaId: 'I4', value: 40 }), qualityStatus: 'ACCEPTED_WITH_WARNING' },
  { ...record({ id: 'i5', formulaId: 'I5', value: 50 }), unit: 'ppm' as any }
]);
check('calculated, warning and incompatible-unit records are rejected', invalidEvidence === undefined, invalidEvidence, undefined);

const failed = results.filter(result => !result.passed);
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} | ${result.name} | actual=${String(result.actual)} | expected=${String(result.expected)}`);
}
console.log(`Refinement category/weighting regressions: ${results.length - failed.length}/${results.length} PASS`);
if (failed.length > 0) throw new Error(`${failed.length} refinement regression(s) failed`);
return { passed: results.length - failed.length, failed: failed.length, total: results.length, results };
}
