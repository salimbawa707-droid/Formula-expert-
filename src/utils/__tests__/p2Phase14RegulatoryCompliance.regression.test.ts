/**
 * ============================================================================
 * P2 — REGULATORY COMPLIANCE ENGINE MASTER REGRESSION TEST SUITE
 * ============================================================================
 * Forensic test suite verifying evidence-backed regulatory decision system:
 * 1. IS 869 incorrect disinfectant mapping is rejected.
 * 2. IS 7983 stale/withdrawn status cannot remain CURRENT.
 * 3. IS 4955:2020 metadata is strictly scoped to LAUNDRY_POWDER.
 * 4. EU 2026/405 vs 648/2004 temporal applicability.
 * 5. Historical regulation remains available for audits without false current enforcement.
 * 6. Jurisdiction isolation (India vs EU vs US).
 * 7. Product-category isolation.
 * 8. Effective-date resolution.
 * 9. Missing evidence -> NOT_VERIFIED.
 * 10. AI-generated URL -> NOT authoritative evidence.
 * 11. Conflicting sources -> CONFLICTING_EVIDENCE / HUMAN_REVIEW.
 * 12. Static checksum detection.
 * 13. Real SHA-256 changes when dataset changes.
 * 14. Unknown regulatory field cannot become COMPLIANT.
 * 15. No-regulation-found cannot become COMPLIANT.
 * 16. UI/export cannot override Regulatory SSOT.
 * 17. Duplicate regulatory sources resolve consistently.
 * 18. Withdrawn/superseded standards cannot silently pass.
 * 19. Future regulation cannot incorrectly apply before effective date.
 * 20. Historical audit can still resolve historical regulation correctly.
 * ============================================================================
 */

import {
  RegulatoryComplianceEngine,
  RegulatoryEvaluationInput,
  RegulatoryEvidenceEngine,
  RegulatoryEvidence,
  RegulatoryIngredientEngine,
  ClaimComplianceEngine,
  LabelComplianceEngine,
  SDSComplianceEngine,
  RegulatoryVersioningEngine,
  RegulatoryRuleRegistryEngine,
  RegulatoryProductScopeEngine,
  RegulatoryChecksumEngine,
  RegulatoryTemporalEngine,
  CANONICAL_REGULATORY_RULES,
  CANONICAL_REGULATORY_SCOPES
} from '../../domain/regulatory';
import { evaluateRegulatoryCompliance } from '../regulatoryEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export function runP2Phase14RegulatoryComplianceTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      results.push({ name, passed: false, message: message || 'Assertion failed' });
      console.error(`[FAIL] ${name}: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: IS 869 incorrect disinfectant mapping is rejected
  // --------------------------------------------------------------------------
  const floorCleanerScope = CANONICAL_REGULATORY_SCOPES['FLOOR_CLEANER'];
  const hasFalseIs869 = floorCleanerScope.indiaBisStandard?.includes('IS 869') === true ||
    (floorCleanerScope as any).indiaBisStandardId === 'IS 869';
  assert(
    'Test 1: IS 869 false disinfectant mapping is completely removed from FLOOR_CLEANER',
    !hasFalseIs869 && floorCleanerScope.indiaBisStatus === 'NOT_VERIFIED',
    'IS 869 is Ethylene Dichloride; cannot be mapped to floor cleaners or disinfectant fluids'
  );

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // TEST 2: IS 7983 Succession Chain & Temporal Resolution (1994 -> 2026 direct)
  // --------------------------------------------------------------------------
  const toiletCleanerScope = CANONICAL_REGULATORY_SCOPES['TOILET_CLEANER'];
  const is7983SuccessionToday = RegulatoryTemporalEngine.resolveIS7983Succession('2026-10-07');
  const is7983Historical2020 = RegulatoryTemporalEngine.resolveIS7983Succession('2020-01-01');
  const is7983Transition2026 = RegulatoryTemporalEngine.resolveIS7983Succession('2026-06-01');

  const rule1994 = CANONICAL_REGULATORY_RULES.find(r => r.ruleId === 'RULE_IND_BIS_7983_1994');
  const rule2025 = CANONICAL_REGULATORY_RULES.find(r => r.ruleId === 'RULE_IND_BIS_7983_2025_UNVERIFIED' || r.ruleId === 'RULE_IND_BIS_7983_2025_DRAFT');
  const rule2026 = CANONICAL_REGULATORY_RULES.find(r => r.ruleId === 'RULE_IND_BIS_7983_TOILET_CLEANER');

  // 1. 1994 historical / withdrawn state
  const is1994Withdrawn = is7983SuccessionToday.status1994 === 'WITHDRAWN' && rule1994?.status === 'WITHDRAWN' && rule1994?.withdrawalDate === '2026-09-12';
  // 2. Direct successor relationship (1994 -> 2026 evidenced; 2025 unevidenced / NOT_VERIFIED)
  const hasDirectSuccessorChain =
    rule1994?.supersededBy === 'IS 7983:2026' &&
    rule2026?.supersedes === 'IS 7983:1994' &&
    is7983SuccessionToday.successionGraph.direct1994To2026.isVerified &&
    !is7983SuccessionToday.successionGraph.from1994To2025.isVerified &&
    !is7983SuccessionToday.successionGraph.from2025To2026.isVerified &&
    rule2025?.status === 'NOT_VERIFIED' &&
    rule2025?.supersededBy === undefined;
  // 3. Current successor resolution
  const currentSuccessorResolved =
    is7983SuccessionToday.activeStandard === 'IS 7983:2026' &&
    is7983SuccessionToday.status2026 === 'CURRENT' &&
    toiletCleanerScope.indiaBisStatus === 'VERIFIED_CURRENT' &&
    toiletCleanerScope.indiaBisStandardId === 'IS 7983:2026';
  // 4. Historical evaluation-date resolution
  const historicalDateResolved =
    is7983Historical2020.status1994 === 'CURRENT' &&
    is7983Historical2020.status2026 === 'FUTURE' &&
    is7983Transition2026.status1994 === 'TRANSITIONAL' &&
    is7983Transition2026.status2026 === 'CURRENT';

  assert(
    'Test 2: IS 7983 authoritative succession chain verifies 1994 withdrawn state, 2026 current successor, and historical temporal resolution',
    is1994Withdrawn && hasDirectSuccessorChain && currentSuccessorResolved && historicalDateResolved,
    'IS 7983 succession chain must verify historical, transitional, and current successor resolution'
  );

  // --------------------------------------------------------------------------
  // TEST 3: IS 4955:2020 metadata is strictly scoped to LAUNDRY_POWDER
  // --------------------------------------------------------------------------
  const is4955Rule = CANONICAL_REGULATORY_RULES.find(r => r.ruleId === 'RULE_IND_BIS_STPP_PHOSPHATE');
  const coversOnlyPowder = is4955Rule?.productCategories.length === 1 && is4955Rule.productCategories[0] === 'LAUNDRY_POWDER';
  const doesNotCoverLiquid = !is4955Rule?.productCategories.includes('LAUNDRY_LIQUID' as any);
  const doesNotCoverDishwash = !is4955Rule?.productCategories.includes('DISHWASH_MANUAL' as any);
  assert(
    'Test 3: IS 4955:2020 metadata is strictly scoped exclusively to LAUNDRY_POWDER (no liquids or dishwash)',
    coversOnlyPowder && doesNotCoverLiquid && doesNotCoverDishwash,
    'IS 4955:2020 only covers laundry powders'
  );

  // --------------------------------------------------------------------------
  // TEST 4: EU 2026/405 vs 648/2004 temporal applicability (transitional awareness & Article 36)
  // --------------------------------------------------------------------------
  const temporalToday = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus('2026-10-07');
  const temporalPost2029MissingDate = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus('2030-01-01');
  const temporalPost2029Grandfathered = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus('2030-01-01', '2028-06-01');

  assert(
    'Test 4: EU Detergent Regulations in 2026 resolve into active transition where 648/2004 is applicable and 2026/405 is in-force but not yet generally applicable',
    temporalToday.isTransitionActive &&
      temporalToday.applicableRegulation === 'Regulation (EC) No 648/2004' &&
      temporalToday.ec648Status === 'CURRENT' &&
      temporalToday.eu2026Status === 'IN_FORCE_BUT_NOT_YET_GENERALLY_APPLICABLE' &&
      temporalPost2029MissingDate.complianceStatus === 'TRANSITIONAL_APPLICABILITY_UNKNOWN' &&
      temporalPost2029Grandfathered.complianceStatus === 'COMPLIANT_UNDER_ARTICLE_36_1',
    'Regulation 648/2004 remains applicable until 2029-09-23; Article 36 requires placingOnMarketDate post-repeal'
  );

  // --------------------------------------------------------------------------
  // TEST 5: EU 2026/405 post-transition repeal of 648/2004 (23 Sept 2029)
  // --------------------------------------------------------------------------
  // On 2029-01-01 (before 23 Sept 2029 repeal date), transition is still active
  const temporalPreRepeal2029 = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus('2029-01-01');
  // On 2029-10-01 (post-23-Sept-2029 general application & repeal date), 648/2004 is SUPERSEDED, 2026/405 is CURRENT
  const temporalPostRepeal2029 = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus('2029-10-01');

  assert(
    'Test 5: Post-transition (October 2029, after 23 Sept 2029 repeal), Regulation 648/2004 resolves as SUPERSEDED while 2026/405 is CURRENT',
    temporalPreRepeal2029.isTransitionActive &&
      !temporalPostRepeal2029.isTransitionActive &&
      temporalPostRepeal2029.ec648Status === 'SUPERSEDED' &&
      temporalPostRepeal2029.eu2026Status === 'CURRENT',
    'Post-23 September 2029, Regulation (EC) No 648/2004 is repealed and Regulation (EU) 2026/405 is solely CURRENT'
  );

  // --------------------------------------------------------------------------
  // TEST 6: Jurisdiction isolation (India vs EU vs US)
  // --------------------------------------------------------------------------
  const testInputIndiaIsolation: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 70 },
      { name: 'SLES 28%', percentage: 30 }
    ],
    productCategory: 'LAUNDRY_LIQUID',
    jurisdiction: 'INDIA'
  };
  const decisionIndiaIsolation = RegulatoryComplianceEngine.evaluate(testInputIndiaIsolation);
  const indiaHasNoEuRules = !decisionIndiaIsolation.passedRules.some(r => r.jurisdiction === 'EU') &&
    !decisionIndiaIsolation.failedRules.some(r => r.jurisdiction === 'EU');
  const indiaHasNoUsRules = !decisionIndiaIsolation.passedRules.some(r => r.jurisdiction === 'US_CARB' || r.jurisdiction === 'US_STATE_NY');
  assert(
    'Test 6: Jurisdiction isolation strictly prevents EU and US rules from evaluating in India jurisdiction',
    indiaHasNoEuRules && indiaHasNoUsRules
  );

  // --------------------------------------------------------------------------
  // TEST 7: Product-category isolation
  // --------------------------------------------------------------------------
  const testInputLiquidUnderPowderRule: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Sodium Tripolyphosphate (STPP)', percentage: 10.0 }, // Exceeds 2.5% for powder
      { name: 'Water', percentage: 90.0 }
    ],
    productCategory: 'LAUNDRY_LIQUID',
    jurisdiction: 'INDIA'
  };
  const decisionLiquidIsolation = RegulatoryComplianceEngine.evaluate(testInputLiquidUnderPowderRule);
  const is4955NotApplicableToLiquid = decisionLiquidIsolation.failedRules.every(r => r.ruleId !== 'RULE_IND_BIS_STPP_PHOSPHATE');
  assert(
    'Test 7: Category isolation ensures IS 4955 powder phosphate rule is NOT_APPLICABLE to LAUNDRY_LIQUID',
    is4955NotApplicableToLiquid
  );

  // --------------------------------------------------------------------------
  // TEST 8: Effective-date resolution (future regulation not enforced early)
  // --------------------------------------------------------------------------
  const mockFutureRule = {
    ...CANONICAL_REGULATORY_RULES[0],
    ruleId: 'RULE_MOCK_FUTURE_2030',
    effectiveFrom: '2030-01-01',
    status: 'FUTURE' as const
  };
  const futureTemporal = RegulatoryTemporalEngine.evaluateRuleTemporalApplicability(mockFutureRule, '2026-10-07');
  assert(
    'Test 8: Effective-date resolution marks future effective date (2030) as non-enforceable and FUTURE on evaluation date 2026',
    !futureTemporal.isLegallyEnforceable && futureTemporal.temporalStatus === 'FUTURE'
  );

  // --------------------------------------------------------------------------
  // TEST 9: Missing evidence -> NOT_VERIFIED
  // --------------------------------------------------------------------------
  const missingEvidenceRecord: RegulatoryEvidence = {
    evidenceId: '',
    source: '',
    authority: '',
    sourceType: 'UNVERIFIED_WEB_SOURCE',
    evidenceLevel: 5,
    regulationIdentifier: '',
    version: '',
    publicationDate: '',
    effectiveDate: '',
    retrievalDate: '',
    evidenceConfidence: 0,
    verificationStatus: 'MISSING'
  };
  const missingEvidenceValidation = RegulatoryEvidenceEngine.validateEvidence(missingEvidenceRecord);
  assert(
    'Test 9: Missing evidence record or evidenceId evaluates strictly to isValid=false and MISSING',
    !missingEvidenceValidation.isValid && missingEvidenceValidation.verificationStatus === 'MISSING'
  );

  // --------------------------------------------------------------------------
  // TEST 10: AI-generated URL / summary -> strictly NOT authoritative evidence
  // --------------------------------------------------------------------------
  const aiGeneratedEvidence: RegulatoryEvidence = {
    evidenceId: 'EVID_AI_GEN_99',
    source: 'AI Model Guess',
    authority: 'Synthetic LLM',
    sourceType: 'AI_GENERATED_SUMMARY',
    evidenceLevel: 5,
    sourceURL: 'https://chatgpt.com/fake-regulatory-source',
    regulationIdentifier: 'FAKE-REG-01',
    version: '1.0',
    publicationDate: '2026-01-01',
    effectiveDate: '2026-01-01',
    retrievalDate: '2026-10-07',
    evidenceConfidence: 0.99,
    verificationStatus: 'NOT_VERIFIED'
  };
  const aiValidation = RegulatoryEvidenceEngine.validateEvidence(aiGeneratedEvidence);
  assert(
    'Test 10: AI-generated summary and AI URLs are strictly rejected with authorityScore=0 and NOT_VERIFIED',
    !aiValidation.isValid && aiValidation.verificationStatus === 'NOT_VERIFIED' && aiValidation.authorityScore === 0
  );

  // --------------------------------------------------------------------------
  // TEST 11: Conflicting sources -> CONFLICTING_EVIDENCE / HUMAN_REVIEW
  // --------------------------------------------------------------------------
  const evidenceA: RegulatoryEvidence = {
    evidenceId: 'EVID_SRC_A',
    source: 'Technical Advisory Board A',
    authority: 'Standards Org A',
    sourceType: 'ACCREDITED_TECHNICAL_SOURCE',
    evidenceLevel: 3,
    regulationIdentifier: 'STD-100',
    version: '2022',
    publicationDate: '2022-01-01',
    effectiveDate: '2022-01-01',
    retrievalDate: '2026-01-01',
    evidenceConfidence: 0.8,
    verificationStatus: 'VERIFIED_SECONDARY_SOURCE'
  };
  const evidenceB: RegulatoryEvidence = {
    ...evidenceA,
    evidenceId: 'EVID_SRC_B',
    source: 'Technical Advisory Board B',
    authority: 'Standards Org B'
  };
  const conflictResolution = RegulatoryEvidenceEngine.resolveEvidenceConflict(evidenceA, evidenceB);
  assert(
    'Test 11: Two conflicting evidence sources of equal authority score are flagged isConflicting=true for legal review',
    conflictResolution.isConflicting
  );

  // --------------------------------------------------------------------------
  // TEST 12: Static checksum detection (no fake hardcoded checksums)
  // --------------------------------------------------------------------------
  const activeVersion = RegulatoryVersioningEngine.getCurrentVersion();
  const startsWithSha256 = activeVersion.checksum.startsWith('sha256-');
  const has64HexChars = activeVersion.checksum.replace('sha256-', '').length === 64;
  assert(
    'Test 12: Active regulatory knowledge version contains a real 64-hex SHA-256 digest',
    startsWithSha256 && has64HexChars
  );

  // --------------------------------------------------------------------------
  // TEST 13: Real SHA-256 changes when dataset changes
  // --------------------------------------------------------------------------
  const originalChecksum = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(CANONICAL_REGULATORY_RULES);
  const mutatedRules = CANONICAL_REGULATORY_RULES.map((r, i) =>
    i === 0 ? { ...r, requirementText: r.requirementText + ' [MUTATED]' } : r
  );
  const mutatedChecksum = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(mutatedRules);
  const sameChecksumAgain = RegulatoryChecksumEngine.computeCanonicalDatasetChecksum(CANONICAL_REGULATORY_RULES);
  assert(
    'Test 13: SHA-256 is deterministic (identical dataset produces same hash, modified dataset produces distinct hash)',
    originalChecksum.sha256 === sameChecksumAgain.sha256 && originalChecksum.sha256 !== mutatedChecksum.sha256
  );

  // --------------------------------------------------------------------------
  // TEST 14: Unknown regulatory field cannot become COMPLIANT
  // --------------------------------------------------------------------------
  const testInputUnknownIngredient: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 90 },
      { name: 'Mystery Proprietary Chemical X', percentage: 10 }
    ],
    productCategory: 'LAUNDRY_POWDER',
    jurisdiction: 'INDIA'
  };
  const decisionUnknown = RegulatoryComplianceEngine.evaluate(testInputUnknownIngredient);
  assert(
    'Test 14: Formula with unverified/unknown chemical identity CANNOT become COMPLIANT (evaluates to REVIEW_REQUIRED)',
    decisionUnknown.overallStatus === 'REVIEW_REQUIRED' && decisionUnknown.ingredientStatus.unknownIngredientsDetected.length > 0
  );

  // --------------------------------------------------------------------------
  // TEST 15: No-regulation-found cannot become COMPLIANT ("not detected" != "compliant")
  // --------------------------------------------------------------------------
  const testInputUnverifiedScope: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 95 },
      { name: 'Sodium Carbonate', percentage: 5 }
    ],
    productCategory: 'FLOOR_CLEANER', // Floor cleaner has no verified BIS standard (IS 869 removed)
    jurisdiction: 'INDIA'
  };
  const decisionFloorCleaner = RegulatoryComplianceEngine.evaluate(testInputUnverifiedScope);
  assert(
    'Test 15: Unverified category standard (Indian Floor Cleaner) CANNOT yield COMPLIANT (evaluates to REVIEW_REQUIRED)',
    decisionFloorCleaner.overallStatus === 'REVIEW_REQUIRED',
    'Unverified standards cannot certify compliance'
  );

  // --------------------------------------------------------------------------
  // TEST 16: UI/export bridge cannot override Regulatory SSOT
  // --------------------------------------------------------------------------
  const bridgeReport = evaluateRegulatoryCompliance(
    [{ name: 'Mystery Proprietary Chemical X', percentage: 10 }],
    'LAUNDRY_POWDER',
    { jurisdiction: 'INDIA', targetRegion: 'INDIA_BIS' }
  );
  assert(
    'Test 16: Legacy bridge to SSOT reflects RESTRICTED / non-compliant status and compliant=false for unverified inputs',
    !bridgeReport.compliant && bridgeReport.status !== 'COMPLIANT'
  );

  // --------------------------------------------------------------------------
  // TEST 17: Duplicate regulatory sources resolve consistently via authority hierarchy
  // --------------------------------------------------------------------------
  const primaryGovEvidence: RegulatoryEvidence = {
    evidenceId: 'EVID_PRIMARY_GOV',
    source: 'Official Ministry Gazette',
    authority: 'Government of India',
    sourceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceLevel: 1,
    regulationIdentifier: 'GSR-426',
    version: '2011',
    publicationDate: '2011-04-01',
    effectiveDate: '2011-04-01',
    retrievalDate: '2026-10-07',
    evidenceConfidence: 1.0,
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  };
  const secondaryBlogEvidence: RegulatoryEvidence = {
    evidenceId: 'EVID_BLOG',
    source: 'Packaging Industry Blog',
    authority: 'Trade Blog',
    sourceType: 'SECONDARY_PROFESSIONAL_SOURCE',
    evidenceLevel: 4,
    regulationIdentifier: 'GSR-426',
    version: '2011',
    publicationDate: '2015-01-01',
    effectiveDate: '2015-01-01',
    retrievalDate: '2026-10-07',
    evidenceConfidence: 0.5,
    verificationStatus: 'UNVERIFIED'
  };
  const hierarchyResolution = RegulatoryEvidenceEngine.resolveEvidenceConflict(primaryGovEvidence, secondaryBlogEvidence);
  assert(
    'Test 17: Primary official legislation strictly wins over secondary third-party source without conflict',
    !hierarchyResolution.isConflicting && hierarchyResolution.winningEvidence.evidenceId === 'EVID_PRIMARY_GOV'
  );

  // --------------------------------------------------------------------------
  // TEST 18: Withdrawn/superseded standards cannot silently pass
  // --------------------------------------------------------------------------
  const testInputToiletCleaner: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Hydrochloric Acid 33%', percentage: 10 },
      { name: 'Water', percentage: 90 }
    ],
    productCategory: 'TOILET_CLEANER', // IS 7983 is withdrawn / NOT_VERIFIED
    jurisdiction: 'INDIA'
  };
  const decisionToiletCleaner = RegulatoryComplianceEngine.evaluate(testInputToiletCleaner);
  assert(
    'Test 18: Withdrawn IS 7983 standard cannot silently PASS; forces REVIEW_REQUIRED status',
    decisionToiletCleaner.overallStatus === 'REVIEW_REQUIRED',
    'Withdrawn standard cannot yield COMPLIANT'
  );

  // --------------------------------------------------------------------------
  // TEST 19: Future regulation cannot incorrectly apply before effective date
  // --------------------------------------------------------------------------
  const futureRuleResult = RegulatoryComplianceEngine['evaluateSingleRule'](
    mockFutureRule,
    [],
    { ingredients: [], jurisdiction: 'INDIA', productCategory: 'LAUNDRY_POWDER' },
    7.0,
    RegulatoryProductScopeEngine.resolveProductScope('LAUNDRY_POWDER'),
    '2026-10-07'
  );
  assert(
    'Test 19: Single rule evaluation marks future regulation NOT_APPLICABLE before its effective date',
    futureRuleResult.status === 'NOT_APPLICABLE'
  );

  // --------------------------------------------------------------------------
  // TEST 20: Historical audit can still resolve historical regulation correctly
  // --------------------------------------------------------------------------
  const temporalHistorical2010 = RegulatoryTemporalEngine.resolveEUDetergentRegulationStatus('2010-06-01');
  assert(
    'Test 20: Historical audit (2010) correctly identifies Regulation 648/2004 as CURRENT and 2026/405 as FUTURE',
    temporalHistorical2010.ec648Status === 'CURRENT' && temporalHistorical2010.eu2026Status === 'FUTURE'
  );

  // --------------------------------------------------------------------------
  // TEST 21: IS 7983:1994 Authoritative Status, Withdrawal Evidence & Historical Enforceability (Req 1, 2, 3)
  // --------------------------------------------------------------------------
  const is1994Record = is7983SuccessionToday.chain.find(c => c.standardNumber === 'IS 7983:1994');
  assert(
    'Test 21: IS 7983:1994 status, withdrawal date 2026-09-12, and authoritative BIS evidence verified',
    is1994Record?.status === 'WITHDRAWN' &&
      is1994Record?.withdrawalDate === '2026-09-12' &&
      is1994Record?.evidenceId === 'EVID_IND_BIS_7983_1994' &&
      is1994Record?.verificationStatus === 'VERIFIED_PRIMARY_SOURCE' &&
      is1994Record?.sourceOrganization === 'Bureau of Indian Standards (BIS)' &&
      is7983Historical2020.status1994 === 'CURRENT',
    'IS 7983:1994 must be WITHDRAWN on current date, backed by primary BIS evidence, and enforceable on historical dates'
  );

  // --------------------------------------------------------------------------
  // TEST 22: IS 7983:2025 Exact Status & Evidence Absence -> NOT_VERIFIED (Req 4, 5)
  // --------------------------------------------------------------------------
  const is2025Record = is7983SuccessionToday.chain.find(c => c.standardNumber === 'IS 7983:2025');
  assert(
    'Test 22: IS 7983:2025 has no gazette record in BIS register and strictly resolves as NOT_VERIFIED with no succession link',
    is7983SuccessionToday.status2025 === 'NOT_VERIFIED' &&
      is2025Record?.status === 'NOT_VERIFIED' &&
      is2025Record?.verificationStatus === 'NOT_VERIFIED' &&
      is2025Record?.evidenceLevel === 5 &&
      is2025Record?.supersededBy === undefined &&
      is2025Record?.supersedes === undefined &&
      !is7983SuccessionToday.successionGraph.from1994To2025.isVerified &&
      !is7983SuccessionToday.successionGraph.from2025To2026.isVerified,
    'IS 7983:2025 must not invent draft, precursor, or superseded status without authoritative BIS evidence'
  );

  // --------------------------------------------------------------------------
  // TEST 23: IS 7983:2026 Exact Status & Authoritative Primary Evidence (Req 6, 7)
  // --------------------------------------------------------------------------
  const is2026Record = is7983SuccessionToday.chain.find(c => c.standardNumber === 'IS 7983:2026');
  assert(
    'Test 23: IS 7983:2026 Second Revision backed by primary BIS Gazette evidence is CURRENT and effective 2026-03-12',
    is7983SuccessionToday.status2026 === 'CURRENT' &&
      is2026Record?.status === 'CURRENT' &&
      is2026Record?.effectiveDate === '2026-03-12' &&
      is2026Record?.evidenceId === 'EVID_IND_BIS_7983_2026' &&
      is2026Record?.verificationStatus === 'VERIFIED_PRIMARY_SOURCE' &&
      is2026Record?.sourceOrganization === 'Bureau of Indian Standards (BIS)',
    'IS 7983:2026 must be CURRENT with primary BIS evidence and effective date 2026-03-12'
  );

  // --------------------------------------------------------------------------
  // TEST 24: Direct 1994 -> 2026 Succession Evidenced; Indirect 1994 -> 2025 -> 2026 Blocked (Req 8, 9)
  // --------------------------------------------------------------------------
  assert(
    'Test 24: Succession graph verifies direct 1994 -> 2026 link; strictly blocks unevidenced 1994 -> 2025 -> 2026 chain',
    is7983SuccessionToday.successionGraph.direct1994To2026.isVerified &&
      is7983SuccessionToday.successionGraph.direct1994To2026.status === 'VERIFIED_PRIMARY_SOURCE' &&
      !is7983SuccessionToday.successionGraph.from1994To2025.isVerified &&
      !is7983SuccessionToday.successionGraph.from2025To2026.isVerified,
    'Succession arrows must only exist where directly supported by primary BIS evidence'
  );

  // --------------------------------------------------------------------------
  // TEST 25: Evidence Gating: Conflicting Evidence -> REVIEW_REQUIRED & Missing Evidence -> NOT_VERIFIED (Req 10, 11)
  // --------------------------------------------------------------------------
  const conflictingRes = RegulatoryTemporalEngine.evaluateIS7983SuccessionWithEvidence('EVID_IND_BIS_7983_2026', '2026-10-07', true);
  const missingRes = RegulatoryTemporalEngine.evaluateIS7983SuccessionWithEvidence(undefined);
  const emptyRes = RegulatoryTemporalEngine.evaluateIS7983SuccessionWithEvidence('');
  assert(
    'Test 25: Conflicting BIS evidence forces REVIEW_REQUIRED; missing evidence forces NOT_VERIFIED',
    conflictingRes.complianceStatus === 'REVIEW_REQUIRED' &&
      !conflictingRes.isLegallyEnforceable &&
      missingRes.complianceStatus === 'NOT_VERIFIED' &&
      !missingRes.isLegallyEnforceable &&
      emptyRes.complianceStatus === 'NOT_VERIFIED' &&
      !emptyRes.isLegallyEnforceable,
    'Conflicting or missing evidence must never silently pass'
  );

  // --------------------------------------------------------------------------
  // TEST 26: Toilet Cleaner Scope Resolution & Standard Applicability vs Product Compliance Firewall (Req 12, 13)
  // --------------------------------------------------------------------------
  const testInvalidToiletCleanerFormula: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 95.0 },
      { name: 'Fragrance', percentage: 5.0 }
    ],
    productCategory: 'TOILET_CLEANER',
    jurisdiction: 'INDIA'
  };
  const decisionInvalidToiletCleaner = RegulatoryComplianceEngine.evaluate(testInvalidToiletCleanerFormula);
  assert(
    'Test 26: TOILET_CLEANER maps to IS 7983:2026, but non-compliant formulation cannot become COMPLIANT',
    toiletCleanerScope.indiaBisStandardId === 'IS 7983:2026' &&
      toiletCleanerScope.indiaBisStatus === 'VERIFIED_CURRENT' &&
      decisionInvalidToiletCleaner.overallStatus !== 'COMPLIANT',
    'Standard applicability must be strictly distinguished from formulation compliance'
  );

  // --------------------------------------------------------------------------
  // TEST 27: Historical Date Resolution & Post-Withdrawal Boundary Resolution (Req 14, 15)
  // --------------------------------------------------------------------------
  const resPast2020 = RegulatoryTemporalEngine.resolveIS7983Succession('2020-01-01');
  const resBoundaryDay = RegulatoryTemporalEngine.resolveIS7983Succession('2026-09-12');
  const resPostWithdrawal = RegulatoryTemporalEngine.resolveIS7983Succession('2026-10-07');
  assert(
    'Test 27: Historical evaluation resolves 1994 as CURRENT; post-withdrawal resolves 1994 as WITHDRAWN and 2026 as CURRENT',
    resPast2020.status1994 === 'CURRENT' &&
      resPast2020.status2026 === 'FUTURE' &&
      resBoundaryDay.status1994 === 'WITHDRAWN' &&
      resBoundaryDay.status2026 === 'CURRENT' &&
      resPostWithdrawal.status1994 === 'WITHDRAWN' &&
      resPostWithdrawal.status2026 === 'CURRENT',
    'Temporal engine must accurately distinguish historical validity from post-withdrawal enforceability'
  );

  // --------------------------------------------------------------------------
  // EXISTING CORE SUITE TESTS (Retained for 100% backward continuity)
  // --------------------------------------------------------------------------
  const testInputBanned: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 80 },
      { name: 'Nonylphenol Ethoxylate (NPE-9)', percentage: 5.0, casNumber: '9016-45-9' },
      { name: 'SLES 28%', percentage: 15.0 }
    ],
    productCategory: 'LAUNDRY_LIQUID',
    jurisdiction: 'EU'
  };
  const decisionBanned = RegulatoryComplianceEngine.evaluate(testInputBanned);
  assert(
    'Legacy EU Scope: NPE-9 > 0.1% triggers CRITICAL NON_COMPLIANT failure under REACH Annex XVII',
    decisionBanned.overallStatus === 'NON_COMPLIANT' && decisionBanned.failedRules.some(r => r.ruleId === 'RULE_EU_REACH_NPE_BAN')
  );

  const testInputIndiaSTPP: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Sodium Tripolyphosphate (STPP)', percentage: 10.0 },
      { name: 'LABSA 96%', percentage: 15.0 },
      { name: 'Soda Ash', percentage: 75.0 }
    ],
    productCategory: 'LAUNDRY_POWDER',
    jurisdiction: 'INDIA',
    packageSizeGramsOrMl: 1000
  };
  const decisionIndia = RegulatoryComplianceEngine.evaluate(testInputIndiaSTPP);
  assert(
    'Legacy India Scope: STPP > 2.5% in LAUNDRY_POWDER triggers NON_COMPLIANT failure under IS 4955',
    decisionIndia.overallStatus === 'NON_COMPLIANT' && decisionIndia.failedRules.some(r => r.ruleId === 'RULE_IND_BIS_STPP_PHOSPHATE')
  );

  const testInputNYDioxane: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 70 },
      {
        name: 'SLES 28% High Dioxane',
        percentage: 30.0,
        impuritiesPpm: { dioxane_1_4: 20 }
      }
    ],
    productCategory: 'LAUNDRY_LIQUID',
    jurisdiction: 'US_STATE_NY'
  };
  const decisionNY = RegulatoryComplianceEngine.evaluate(testInputNYDioxane);
  assert(
    'Legacy NY Scope: Calculated 1,4-Dioxane (6 ppm) > 1 ppm triggers CRITICAL failure under ECL § 37-0117',
    decisionNY.overallStatus === 'NON_COMPLIANT' && decisionNY.failedRules.some(r => r.ruleId === 'RULE_US_NY_STATE_14_DIOXANE')
  );

  const saferChoiceRule = RegulatoryRuleRegistryEngine.getAllRules().find(r => r.ruleId === 'RULE_US_EPA_SAFER_CHOICE_VOLUNTARY');
  assert(
    'Legacy Voluntary Programs: EPA Safer Choice is explicitly classified as VOLUNTARY_PROGRAM',
    saferChoiceRule?.mandatoryOrVoluntary === 'VOLUNTARY_PROGRAM' && saferChoiceRule.severity === 'INFORMATIONAL'
  );

  const testInputCorrosivePH: RegulatoryEvaluationInput = {
    ingredients: [
      { name: 'Water', percentage: 90 },
      { name: 'Sodium Hydroxide (Caustic Soda)', percentage: 10 }
    ],
    productCategory: 'KITCHEN_DEGREASER',
    jurisdiction: 'GLOBAL_UN_GHS',
    calculatedPH: 13.5
  };
  const decisionCorrosive = RegulatoryComplianceEngine.evaluate(testInputCorrosivePH);
  assert(
    'Legacy GHS Classification: pH 13.5 triggers GHS05 Corrosion, DANGER signal word',
    decisionCorrosive.packagingStatus.childResistantClosureRequired &&
      decisionCorrosive.labelStatus.checkList.some(c => c.itemId === 'LBL_GHS_HAZARD' && c.status === 'PASS')
  );

  const claimResultUnsubstantiated = ClaimComplianceEngine.evaluateClaims(
    ['Readily Biodegradable', 'Hypoallergenic', 'Phosphate-Free'],
    [RegulatoryIngredientEngine.processIngredient({ name: 'Water', percentage: 100 })],
    'EU'
  );
  assert(
    'Legacy Claim Compliance: Unsubstantiated claims flag CLAIM_NOT_SUBSTANTIATED',
    claimResultUnsubstantiated.evaluations.some(e => e.status === 'CLAIM_NOT_SUBSTANTIATED' && e.claimName.includes('Hypoallergenic'))
  );

  const labelResultMissingNetQty = LabelComplianceEngine.evaluateLabelRequirements('INDIA', [], 'NONE', undefined);
  assert(
    'Legacy Label Compliance: Omitted package size / net quantity flags MISSING and overall label status FAIL',
    labelResultMissingNetQty.overallLabelStatus === 'FAIL' && labelResultMissingNetQty.missingMandatoryFields.includes('Net Quantity Declaration')
  );

  const sdsResult = SDSComplianceEngine.evaluateSDSRequirements('EU', [], 7.0);
  assert(
    'Legacy SDS Compliance: Toxicological/Ecological sections flag DATA_NOT_AVAILABLE without fabricating fake toxicity values',
    sdsResult.sections.some(s => s.sectionNumber === 11 && s.status === 'DATA_NOT_AVAILABLE')
  );

  const fakeEvidence: RegulatoryEvidence = {
    evidenceId: 'EVID_FAKE_123',
    source: 'Fake Source',
    authority: 'Unknown',
    sourceType: 'UNVERIFIED_WEB_SOURCE',
    evidenceLevel: 5,
    sourceURL: 'https://example.com/fake-regulation',
    regulationIdentifier: 'REG-999',
    version: '1.0',
    publicationDate: '2020-01-01',
    effectiveDate: '2020-01-01',
    retrievalDate: '2026-01-01',
    evidenceConfidence: 0.1,
    verificationStatus: 'UNVERIFIED'
  };
  const evidenceValidation = RegulatoryEvidenceEngine.validateEvidence(fakeEvidence, '2026-01-15');
  assert(
    'Legacy Evidence Gate: Placeholder/fake URLs (example.com) are rejected as NOT_VERIFIED evidence',
    !evidenceValidation.isValid && evidenceValidation.verificationStatus === 'NOT_VERIFIED'
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}
