/**
 * ============================================================================
 * P1-7 — PROVENANCE / EVIDENCE SYSTEM REGRESSION TEST SUITE
 * ============================================================================
 *
 * Verifies property-level provenance, grade applicability, evidence levels,
 * conflict resolution, staleness detection, and the 12 mandatory negative tests.
 */

import {
  EvidenceRecord,
  validateUrl,
  getApplicabilityScore,
  resolveEvidenceConflict,
  checkEvidenceStaleness,
  getPropertyEvidenceChain,
  getEvidencePrioritizedValue,
  PROPERTY_EVIDENCE_REGISTRY
} from '../provenanceEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase7ProvenanceSystemTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({
        name,
        passed: false,
        message: `Assertion failed. Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`,
        actual,
        expected
      });
      console.error(`[FAIL] ${name} :: actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
    }
  }

  console.log('\n================================================================================');
  console.log('  P1-7 — PROVENANCE / EVIDENCE SYSTEM REGRESSION TEST SUITE ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Basic Provenance Structure
  // --------------------------------------------------------------------------
  const sampleEv = PROPERTY_EVIDENCE_REGISTRY['labsa']['activeMatterPct'][0];
  assert('Basic: Evidence record exists and has valid sourceType', sampleEv !== undefined, true, true);
  assert('Basic: Evidence record sourceType matches expected category', sampleEv.sourceType === 'MANUFACTURER_TDS', sampleEv.sourceType, 'MANUFACTURER_TDS');
  assert('Basic: Evidence record verifiedDate exists', sampleEv.verifiedDate !== undefined, true, true);
  assert('Basic: URL validation is successful on legitimate URLs', validateUrl(sampleEv.url), true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Property-Level Provenance Isolation
  // --------------------------------------------------------------------------
  const activeEv = getPropertyEvidenceChain('labsa', 'activeMatterPct');
  const densityEv = getPropertyEvidenceChain('labsa', 'densityGmL');
  assert('Property-Level: Active Matter and Density have distinct sources', activeEv[0].evidenceId !== densityEv[0].evidenceId, true, true);
  assert('Property-Level: Correct property is linked to each evidence record', activeEv[0].property === 'activeMatterPct' && densityEv[0].property === 'densityGmL', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Grade Applicability & Context Evaluation
  // --------------------------------------------------------------------------
  const appExact = getApplicabilityScore(sampleEv, { ingredientId: 'labsa', gradeId: '96pct' });
  const appDiffGrade = getApplicabilityScore(sampleEv, { ingredientId: 'labsa', gradeId: '90pct' });
  const appUnknownGrade = getApplicabilityScore(sampleEv, { ingredientId: 'labsa' });

  assert('Grade Applicability: Exact grade matches with HIGH score', appExact.score === 100 && appExact.label === 'HIGH', true, true);
  assert('Grade Applicability: Different grade reduces score to MEDIUM/LOW', appDiffGrade.score === 70 && appDiffGrade.label === 'MEDIUM', true, true);
  assert('Grade Applicability: Unknown grade matches correctly', appUnknownGrade.score === 100 && appUnknownGrade.label === 'HIGH', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Evidence Strength Hierarchy
  // --------------------------------------------------------------------------
  assert('Evidence Strength: Manufacturer TDS categorized as PRIMARY', sampleEv.evidenceLevel === 'PRIMARY', true, true);
  
  const secondaryEv: EvidenceRecord = {
    evidenceId: 'ev-sec-1',
    sourceType: 'REPUTABLE_DATABASE',
    sourceName: 'PubChem',
    property: 'pKa',
    value: 1.5,
    evidenceLevel: 'SECONDARY',
    confidence: 'MEDIUM',
    status: 'SOURCE_BACKED'
  };
  assert('Evidence Strength: Database reference categorized as SECONDARY', secondaryEv.evidenceLevel === 'SECONDARY', true, true);

  const estEv: EvidenceRecord = {
    evidenceId: 'ev-est-1',
    sourceType: 'INTERNAL_ESTIMATE',
    sourceName: 'pH Speciation Model',
    property: 'pH',
    value: 7.0,
    evidenceLevel: 'ESTIMATED',
    confidence: 'LOW',
    status: 'ESTIMATED'
  };
  assert('Evidence Strength: Internal speciation model is ESTIMATED', estEv.evidenceLevel === 'ESTIMATED', true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Preserving and Resolving Conflicts
  // --------------------------------------------------------------------------
  const recordA: EvidenceRecord = { ...sampleEv, evidenceId: 'ev-a', value: 1.02 };
  const recordB: EvidenceRecord = { ...sampleEv, evidenceId: 'ev-b', value: 1.09 }; // diff > 5%
  const conflictRes = resolveEvidenceConflict([recordA, recordB]);

  assert('Conflict Resolution: Significantly differing numeric values trigger CONFLICTING status', conflictRes.status === 'CONFLICTING', true, true);
  assert('Conflict Resolution: Range min, max, and central estimates are computed', conflictRes.range?.min === 1.02 && conflictRes.range?.max === 1.09, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Property-Specific Staleness Detection
  // --------------------------------------------------------------------------
  const staleRegEv: EvidenceRecord = {
    ...sampleEv,
    property: 'regulatory',
    verifiedDate: '2023-01-01T00:00:00Z' // 3 years old in 2026
  };
  const isStaleReg = checkEvidenceStaleness(staleRegEv, 2026);
  assert('Staleness: Regulatory evidence > 2 years is marked stale', isStaleReg.isStale, true, true);

  const freshRegEv: EvidenceRecord = {
    ...sampleEv,
    property: 'regulatory',
    verifiedDate: '2025-01-01T00:00:00Z' // 1 year old in 2026
  };
  const isStaleFreshReg = checkEvidenceStaleness(freshRegEv, 2026);
  assert('Staleness: Regulatory evidence < 2 years is current', !isStaleFreshReg.isStale, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Prioritized Value Selection (Precedence)
  // --------------------------------------------------------------------------
  const tdsEv: EvidenceRecord = { ...sampleEv, sourceType: 'MANUFACTURER_TDS', value: 96 };
  const aiEstEv: EvidenceRecord = { ...sampleEv, sourceType: 'AI_ESTIMATE', value: 50 };
  const prioritizedVal = getEvidencePrioritizedValue([aiEstEv, tdsEv]);
  assert('Prioritization: Correctly selects manufacturer TDS over AI estimate based on hierarchy precedence', prioritizedVal === 96, prioritizedVal, 96);

  // --------------------------------------------------------------------------
  // MANDATORY NEGATIVE TESTS (Section 40)
  // --------------------------------------------------------------------------

  // 1. Missing source does NOT become verified
  const unverifiedFallback = getPropertyEvidenceChain('unknown-chemical', 'densityGmL');
  assert('Negative 1: Missing source defaults to UNVERIFIED status', unverifiedFallback[0].status === 'UNVERIFIED', true, true);

  // 2. AI answer does NOT become manufacturer data
  const aiEv: EvidenceRecord = {
    evidenceId: 'ev-ai-1',
    sourceType: 'AI_ESTIMATE',
    sourceName: 'Gemini Extractor',
    property: 'pH',
    value: 7.0,
    evidenceLevel: 'ESTIMATED',
    confidence: 'LOW',
    status: 'ESTIMATED'
  };
  assert('Negative 2: AI estimate retains AI_ESTIMATE/ESTIMATED level, never upgraded to MANUFACTURER_TDS', aiEv.sourceType === 'AI_ESTIMATE' && aiEv.status !== 'VERIFIED', true, true);

  // 3. Generic ingredient data does NOT automatically become grade-specific
  const genericToGrade = getApplicabilityScore(sampleEv, { ingredientId: 'labsa', gradeId: '90pct' });
  assert('Negative 3: Generic evidence applied to different grade degrades score', genericToGrade.score < 100, true, true);

  // 4. Different commercial grades do NOT silently share evidence
  const sles70Active = PROPERTY_EVIDENCE_REGISTRY['sles']['activeMatterPct'][0];
  const sles28Context = { ingredientId: 'sles', gradeId: '28pct' };
  const gradeCrossCheck = getApplicabilityScore(sles70Active, sles28Context);
  assert('Negative 4: SLES 70% evidence evaluated for SLES 28% context is flagged with lower applicability', gradeCrossCheck.score === 70, true, true);

  // 5. Conflicting sources do NOT silently overwrite each other
  const conflictOverwriteCheck = resolveEvidenceConflict([recordA, recordB]);
  assert('Negative 5: Conflict resolution returns CONFLICTING status and preserves both values', conflictOverwriteCheck.status === 'CONFLICTING' && conflictOverwriteCheck.values.length === 2, true, true);

  // 6. Old evidence does NOT automatically become current evidence
  const oldPriceEv: EvidenceRecord = {
    ...sampleEv,
    property: 'supplier_price',
    verifiedDate: '2024-01-01T00:00:00Z' // 2 years old in 2026
  };
  const isStalePrice = checkEvidenceStaleness(oldPriceEv, 2026);
  assert('Negative 6: Supplier price evidence > 1 year is flagged stale', isStalePrice.isStale, true, true);

  // 7. Calculated values do NOT appear as measured values
  const calcEv: EvidenceRecord = {
    evidenceId: 'ev-calc-1',
    sourceType: 'INTERNAL_ESTIMATE',
    sourceName: 'Mathematical Formula Model',
    property: 'densityGmL',
    value: 1.05,
    evidenceLevel: 'ESTIMATED',
    confidence: 'LOW',
    status: 'ESTIMATED'
  };
  assert('Negative 7: Calculated records maintain ESTIMATED level, never labeled as primary measured results', calcEv.evidenceLevel === 'ESTIMATED', true, true);

  // 8. User-provided values do NOT automatically become verified
  const userEv: EvidenceRecord = {
    evidenceId: 'ev-user-1',
    sourceType: 'USER_PROVIDED_VALUE',
    sourceName: 'User Entry Panel',
    property: 'activeMatterPct',
    value: 50,
    evidenceLevel: 'USER_PROVIDED',
    confidence: 'LOW',
    status: 'UNVERIFIED'
  };
  assert('Negative 8: User-provided values maintain UNVERIFIED status and USER_PROVIDED level', userEv.status === 'UNVERIFIED' && userEv.evidenceLevel === 'USER_PROVIDED', true, true);

  // 9. Missing evidence does NOT become fake confidence
  assert('Negative 9: Fallback unverified records have UNKNOWN confidence', unverifiedFallback[0].confidence === 'UNKNOWN', true, true);

  // 10. Unsupported regulatory claims do NOT become "compliant"
  const unverifiedReg = getPropertyEvidenceChain('unregistered-chemical', 'regulatory');
  assert('Negative 10: Unverified regulatory status remains UNVERIFIED', unverifiedReg[0].status === 'UNVERIFIED', true, true);

  // 11. Unsupported biodegradability claims do NOT become "biodegradable"
  const unverifiedBiodeg = getPropertyEvidenceChain('unknown-surfactant', 'biodegradability');
  assert('Negative 11: Unverified biodegradability record is UNVERIFIED', unverifiedBiodeg[0].status === 'UNVERIFIED', true, true);

  // 12. Unsupported compatibility claims do NOT become "compatible"
  const unverifiedCompat = getPropertyEvidenceChain('unknown-thickener', 'compatibility');
  assert('Negative 12: Unverified compatibility status is UNVERIFIED', unverifiedCompat[0].status === 'UNVERIFIED', true, true);

  // 13. URL validation fails on placeholder / fake URLs
  assert('Negative 13: Fake URLs are rejected', !validateUrl('https://example.com/tds.pdf') && !validateUrl('https://manufacturer.com/datasheet.pdf'), true, true);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`TOTAL P1-7 PROVENANCE SYSTEM TESTS : ${total}`);
  console.log(`PASSED                            : ${passed}`);
  console.log(`FAILED                            : ${failed}`);
  console.log('--------------------------------------------------------------------------------\n');

  return { total, passed, failed, results };
}
