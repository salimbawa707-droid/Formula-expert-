import { RefinementEngine } from '../refinementEngine';
import { DetailedLabEvidenceRecord } from '../labEvidenceEngine';
import { validateIngredientCompositionEvidence } from '../ingredientCompositionEvidence';
import { registerUserInstrument, resetUserInstrumentsForTest } from '../../domain/lims/instrument';
import { canPromoteToLabValidated } from '../lims/limsEvidencePromotionEngine';

export function runRefinementEngineRegressionTestSuite() {
resetUserInstrumentsForTest();
const instrumentRegistration = registerUserInstrument({
  instrumentId: 'REFINEMENT-REGRESSION-BALANCE-01',
  name: 'Regression Analytical Balance',
  manufacturer: 'Test Manufacturer',
  model: 'RB-01',
  serialNumber: 'RB-SN-001',
  instrumentType: 'ANALYTICAL_BALANCE',
  calibrationCertificateReference: 'CAL-RB-001',
  lastCalibrationDate: '2026-01-01',
  nextCalibrationDate: '2030-01-01',
  location: 'Regression Lab',
  custodian: 'Test Custodian',
  registeredBy: 'Test Analyst'
});
if (!instrumentRegistration.success) throw new Error(`Test instrument registration failed: ${instrumentRegistration.error}`);
const category = 'LAUNDRY_LIQUID' as const;
const ingredient = [{ name: 'SLES', percentage: 15 }];

function record(input: {
  id: string;
  formulaId: string;
  version?: string;
  value: number;
  categoryId?: string | null;
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
    categoryId: (input.categoryId === null ? undefined : input.categoryId ?? category) as any,
    sampleId: input.sampleId || `SAMPLE-${input.id}`,
    batchId: `BATCH-${input.formulaId}`,
    operator: 'Test Analyst',
    instrumentId: 'REFINEMENT-REGRESSION-BALANCE-01',
    instrument: 'REFINEMENT-REGRESSION-BALANCE-01',
    testMethod: 'Validated gravimetric assay SOP-01',
    replicateNumber: input.replicateNumber ?? 1,
    evidenceKind: 'INGREDIENT_COMPOSITION',
    ingredientCanonicalId: 'sles',
    ingredientName: 'SLES',
    compositionBasis: 'W_W',
    compositionMethod: 'GRAVIMETRIC_ASSAY',
    compositionMethodDetails: 'Validated gravimetric SOP-01; w/w calculation',
    instrumentCalibrationReference: 'CAL-RB-001',
    sourceDocumentReference: `LABBOOK-${input.id}`,
    formulaCompositionReference: `FORMULA-SNAPSHOT-${input.formulaId}-${input.version || '1.0'}`
  };
}

function proposal(
  records: DetailedLabEvidenceRecord[],
  activeIngredients: Array<{ id?: string; canonicalIngredientId?: string; name: string; percentage: number }> = ingredient
) {
  return RefinementEngine.proposeAdjustments(activeIngredients as any, records, category)[0];
}

const results: Array<{ name: string; passed: boolean; actual: unknown; expected: unknown }> = [];
function check(name: string, condition: boolean, actual: unknown, expected: unknown) {
  results.push({ name, passed: condition, actual, expected });
}

// Category isolation: dishwash evidence must not influence laundry refinement.
const gateDiagnostic = canPromoteToLabValidated(record({ id: 'gate-diagnostic', formulaId: 'GATE', value: 15 }));
console.log(`Composition LIMS gate diagnostic: ${gateDiagnostic.allowed ? 'ALLOWED' : gateDiagnostic.reasons.join(' | ')}`);
const categoryScoped = proposal([
  record({ id: 'l1', formulaId: 'L1', value: 10 }),
  record({ id: 'l2', formulaId: 'L2', value: 20 }),
  record({ id: 'l3', formulaId: 'L3', value: 30 }),
  record({ id: 'd1', formulaId: 'D1', value: 99, categoryId: 'DISHWASH_MANUAL' })
]);
check('cross-category evidence excluded', categoryScoped?.proposedPercentage === 20, categoryScoped?.proposedPercentage, 20);

// Missing category cannot be treated as a wildcard.
const missingCategory = proposal([
  record({ id: 'm1', formulaId: 'M1', value: 10, categoryId: null }),
  record({ id: 'm2', formulaId: 'M2', value: 20, categoryId: null }),
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

// Repeated rows for one sample without replicate numbers are also deduplicated.
const missingReplicateNumber = proposal([
  record({ id: 'missing-rep-a', formulaId: 'F1', value: 10, sampleId: 'S1' }),
  record({ id: 'missing-rep-b', formulaId: 'F1', value: 10, sampleId: 'S1' }),
  record({ id: 'missing-rep-c', formulaId: 'F2', value: 20, sampleId: 'S2' }),
  record({ id: 'missing-rep-d', formulaId: 'F3', value: 30, sampleId: 'S3' })
]);
check('same sample without replicate number is deduplicated', missingReplicateNumber?.evidenceReplicateCount === 3, missingReplicateNumber?.evidenceReplicateCount, 3);

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

// Ingredient-composition evidence contract: valid traceability is required end-to-end.
const validCompositionRecord = record({ id: 'contract-valid', formulaId: 'C1', value: 22 });
const validContract = validateIngredientCompositionEvidence({
  ...(validCompositionRecord as any),
  categoryId: category,
  formulaId: 'C1',
  formulaVersion: '1.0',
  sampleId: 'S-contract',
  value: 22,
  unit: '%'
});
check('complete source-backed composition contract accepted', validContract.isValid, validContract.errors, []);
const mismatchedCalibrationContract = validateIngredientCompositionEvidence({
  ...(validCompositionRecord as any),
  instrumentCalibrationReference: 'UNMATCHED-CERTIFICATE',
  categoryId: category,
  formulaId: 'C1',
  formulaVersion: '1.0',
  sampleId: 'S-contract',
  value: 22,
  unit: '%'
});
check('unmatched instrument calibration certificate rejected', !mismatchedCalibrationContract.isValid, mismatchedCalibrationContract.isValid, false);


const missingSourceContract = validateIngredientCompositionEvidence({
  ...(validCompositionRecord as any),
  sourceDocumentReference: '',
  categoryId: category,
  formulaId: 'C1',
  formulaVersion: '1.0',
  sampleId: 'S-contract',
  value: 22,
  unit: '%'
});
check('missing original source document rejected', !missingSourceContract.isValid, missingSourceContract.isValid, false);

const invalidReplicateContract = validateIngredientCompositionEvidence({
  ...(validCompositionRecord as any),
  replicateNumber: 0,
  categoryId: category,
  formulaId: 'C1',
  formulaVersion: '1.0',
  sampleId: 'S-contract',
  value: 22,
  unit: '%'
});
check('zero replicate number rejected', !invalidReplicateContract.isValid, invalidReplicateContract.isValid, false);

const invalidBasisContract = validateIngredientCompositionEvidence({
  ...(validCompositionRecord as any),
  compositionBasis: undefined,
  categoryId: category,
  formulaId: 'C1',
  formulaVersion: '1.0',
  sampleId: 'S-contract',
  value: 22,
  unit: '%'
});
check('unspecified composition basis rejected', !invalidBasisContract.isValid, invalidBasisContract.isValid, false);

const wrongIngredientIdentity = proposal([
  { ...record({ id: 'id1', formulaId: 'ID1', value: 10 }), ingredientCanonicalId: 'different-ingredient' },
  record({ id: 'id2', formulaId: 'ID2', value: 20 }),
  record({ id: 'id3', formulaId: 'ID3', value: 30 })
]);
check('canonical ingredient identity mismatch excluded', wrongIngredientIdentity === undefined, wrongIngredientIdentity, undefined);

check('canonical ingredient ID takes precedence over database row ID', (() => {
  const canonicalIdentityProposal = proposal([
    record({ id: 'canonical-id-1', formulaId: 'CAN1', value: 10 }),
    record({ id: 'canonical-id-2', formulaId: 'CAN2', value: 20 }),
    record({ id: 'canonical-id-3', formulaId: 'CAN3', value: 30 })
  ], [{
    id: 'ui-row-uuid-7f3a',
    canonicalIngredientId: 'SLES',
    name: 'SLES',
    percentage: 15
  }]);
  return canonicalIdentityProposal?.proposedPercentage === 20;
})(), 'canonical ID used', 20);

check('canonical IDs with underscores are preserved', (() => {
  const customRecords = [
    record({ id: 'underscore-1', formulaId: 'UND1', value: 10 }),
    record({ id: 'underscore-2', formulaId: 'UND2', value: 20 }),
    record({ id: 'underscore-3', formulaId: 'UND3', value: 30 })
  ].map(item => ({
    ...item,
    parameterKey: 'ingredient:sles:percentage',
    ingredientCanonicalId: 'SODIUM_HYDROXIDE',
    ingredientName: 'SLES'
  }));
  const canonicalIdentityProposal = proposal(customRecords, [{
    canonicalIngredientId: 'sodium_hydroxide',
    name: 'SLES',
    percentage: 15
  }]);
  return canonicalIdentityProposal?.proposedPercentage === 20;
})(), 'underscore canonical ID preserved', 20);


resetUserInstrumentsForTest();

const failed = results.filter(result => !result.passed);
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} | ${result.name} | actual=${String(result.actual)} | expected=${String(result.expected)}`);
}
console.log(`Refinement category/weighting regressions: ${results.length - failed.length}/${results.length} PASS`);
if (failed.length > 0) throw new Error(`${failed.length} refinement regression(s) failed`);
return { passed: results.length - failed.length, failed: failed.length, total: results.length, results };
}
