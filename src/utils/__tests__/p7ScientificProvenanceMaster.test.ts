import {
  generateMasterScientificProvenanceReport,
  computeFormulaFingerprint,
  checkResultTraceability,
  evaluateScientificQualityGate,
  evaluateFormulaScientificValidation,
  MasterScientificQualityGateInput
} from '../calculators';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runPhase7ProvenanceTestSuite(): { passed: number; failed: number; results: TestResult[] } {
  const results: TestResult[] = [];

  function assert(suite: string, name: string, condition: boolean, actual?: any, expected?: any) {
    const passed = Boolean(condition);
    results.push({
      name: `[${suite}] ${name}`,
      passed,
      message: passed
        ? 'PASS'
        : `FAIL: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  }

  const sampleIngredients: FormulationIngredient[] = [
    { id: 'water', name: 'Deionized Water', percentage: 75.0, category: 'Solvent' },
    { id: 'sles', name: 'SLES 70%', percentage: 15.0, category: 'Anionic Surfactant' },
    { id: 'capb', name: 'CAPB 30%', percentage: 5.0, category: 'Amphoteric Surfactant' },
    { id: 'citric', name: 'Citric Acid 50%', percentage: 1.0, category: 'Acidifier' },
    { id: 'glcin', name: 'GLDA 47%', percentage: 1.0, category: 'Chelator' }
  ];

  // 1. Provenance Propagation across all 9 dimensions
  const rep1 = generateMasterScientificProvenanceReport({
    formulaId: 'F-101',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: sampleIngredients,
    speciationResult: { pH: 8.5, isMeasured: false },
    activeMatterResult: { totalActiveMatterPct: 12.0, totalSurfactantActivePct: 12.0 },
    hlbResult: { blendedHLB: 13.5, dataSource: 'authoritative' },
    chelationResult: { capacityCaCO3GPer100g: 1.8, isSufficient: true },
    compatibilityResult: { compatible: true, score: 95 },
    stabilityResult: { isPhysicallyStable: true, score: 95 },
    performanceResult: { cpi: 82, isMeasured: false },
    labEvidenceReport: { validationState: 'CALCULATED', isLabValidated: false },
    qualityGateStatus: { finalFormulaStatus: 'VALID', scientificValidity: 'VALID' }
  });

  const dims = rep1.dimensions;
  assert('ProvenancePropagation', 'Covers pH dimension', Boolean(dims.pH), dims.pH?.dimension, 'pH');
  assert('ProvenancePropagation', 'Covers activeMatter dimension', Boolean(dims.activeMatter), dims.activeMatter?.dimension, 'activeMatter');
  assert('ProvenancePropagation', 'Covers hlb dimension', Boolean(dims.hlb), dims.hlb?.dimension, 'hlb');
  assert('ProvenancePropagation', 'Covers waterHardness dimension', Boolean(dims.waterHardness), dims.waterHardness?.dimension, 'waterHardness');
  assert('ProvenancePropagation', 'Covers compatibility dimension', Boolean(dims.compatibility), dims.compatibility?.dimension, 'compatibility');
  assert('ProvenancePropagation', 'Covers stability dimension', Boolean(dims.stability), dims.stability?.dimension, 'stability');
  assert('ProvenancePropagation', 'Covers cpi dimension', Boolean(dims.cpi), dims.cpi?.dimension, 'cpi');
  assert('ProvenancePropagation', 'Covers labEvidence dimension', Boolean(dims.labEvidence), dims.labEvidence?.dimension, 'labEvidence');
  assert('ProvenancePropagation', 'Covers qualityGate dimension', Boolean(dims.qualityGate), dims.qualityGate?.dimension, 'qualityGate');

  assert('ProvenancePropagation', 'pH has assumptions & limitations', dims.pH.assumptions.length > 0 && dims.pH.limitations.length > 0, true, true);
  assert('ProvenancePropagation', 'activeMatter has authoritative engine', dims.activeMatter.authoritativeEngine === 'ActiveMatterEngine', dims.activeMatter.authoritativeEngine, 'ActiveMatterEngine');

  // 2. Formula & Version Traceability (Fingerprinting)
  const fp1 = computeFormulaFingerprint('F-101', '1.0.0', sampleIngredients, 'LAUNDRY_LIQUID');
  const fp1_same = computeFormulaFingerprint('F-101', '1.0.0', sampleIngredients, 'LAUNDRY_LIQUID');
  assert('Traceability', 'Identical formula generates identical fingerprint', fp1 === fp1_same, fp1, fp1_same);

  const modifiedIngredients: FormulationIngredient[] = [
    { id: 'water', name: 'Deionized Water', percentage: 73.0, category: 'Solvent' },
    { id: 'sles', name: 'SLES 70%', percentage: 17.0, category: 'Anionic Surfactant' },
    { id: 'capb', name: 'CAPB 30%', percentage: 5.0, category: 'Amphoteric Surfactant' },
    { id: 'citric', name: 'Citric Acid 50%', percentage: 1.0, category: 'Acidifier' },
    { id: 'glcin', name: 'GLDA 47%', percentage: 1.0, category: 'Chelator' }
  ];
  const fp2 = computeFormulaFingerprint('F-101', '1.0.0', modifiedIngredients, 'LAUNDRY_LIQUID');
  assert('Traceability', 'Ingredient change alters fingerprint', fp1 !== fp2, fp1 !== fp2, true);

  const fpVersionChange = computeFormulaFingerprint('F-101', '1.0.1', sampleIngredients, 'LAUNDRY_LIQUID');
  assert('Traceability', 'Version change alters fingerprint', fp1 !== fpVersionChange, fp1 !== fpVersionChange, true);

  // 3. Stale-Result Prevention
  const staleCheck1 = checkResultTraceability(fp1, fp1);
  assert('StalePrevention', 'Matching fingerprint is NOT stale', staleCheck1.isStale === false, staleCheck1.isStale, false);

  const staleCheck2 = checkResultTraceability(fp1, fp2);
  assert('StalePrevention', 'Mismatching fingerprint IS stale', staleCheck2.isStale === true, staleCheck2.isStale, true);
  assert('StalePrevention', 'Stale check provides reason', Boolean(staleCheck2.staleReason), true, true);

  // 4. Calculated vs Laboratory Evidence Separation
  assert('CalculatedVsLab', 'Calculation alone NEVER produces LAB_VALIDATED', rep1.overallProvenanceState !== 'LAB_VALIDATED', rep1.overallProvenanceState, 'SCIENTIFICALLY_SCREENED');
  assert('CalculatedVsLab', 'Calculation alone isLabValidated is false', rep1.isLabValidated === false, rep1.isLabValidated, false);

  const valRep = evaluateFormulaScientificValidation({
    formulaId: 'F-101',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    isComputationallyValid: true,
    predictedMetrics: { pH: 8.5, viscosityCps: 250, activeSurfactantsPct: 12.0, cpi: 82 },
    labEvidenceRecords: []
  });
  assert('CalculatedVsLab', 'Unmeasured validation state is SCIENTIFICALLY_SCREENED', valRep.validationState === 'SCIENTIFICALLY_SCREENED', valRep.validationState, 'SCIENTIFICALLY_SCREENED');

  const rep2 = generateMasterScientificProvenanceReport({
    formulaId: 'F-101',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: sampleIngredients,
    speciationResult: { pH: 8.5, isMeasured: true },
    activeMatterResult: { totalActiveMatterPct: 12.0, totalSurfactantActivePct: 12.0 },
    performanceResult: { cpi: 82, isMeasured: true },
    labEvidenceReport: { validationState: 'LAB_VALIDATED', isLabValidated: true, completedTests: ['pH', 'viscosity', 'activeSurfactants', 'cleaningScore'] },
    qualityGateStatus: { finalFormulaStatus: 'VALID', scientificValidity: 'VALID' }
  });
  assert('CalculatedVsLab', 'With full lab evidence, overall state is LAB_VALIDATED', rep2.overallProvenanceState === 'LAB_VALIDATED', rep2.overallProvenanceState, 'LAB_VALIDATED');
  assert('CalculatedVsLab', 'With full lab evidence, isLabValidated is true', rep2.isLabValidated === true, rep2.isLabValidated, true);

  // 5. Quality Gate Enforcement & Provenance Synchronization
  const gateInput: MasterScientificQualityGateInput = {
    formulaId: 'F-101',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: sampleIngredients,
    waterHardnessPpm: 150
  };
  const gateReport = evaluateScientificQualityGate(gateInput);

  assert('QualityGateEnforcement', 'Quality Gate includes formulaFingerprint', Boolean(gateReport.formulaFingerprint), true, true);
  assert('QualityGateEnforcement', 'Quality Gate embeds provenanceReport', Boolean(gateReport.provenanceReport), true, true);
  assert('QualityGateEnforcement', 'Quality Gate provenanceReport covers 9 dimensions', Object.keys(gateReport.provenanceReport.dimensions).length === 9, Object.keys(gateReport.provenanceReport.dimensions).length, 9);

  // Fatal incompatibility test (Bleach + Acid)
  const hazardousIngredients: FormulationIngredient[] = [
    { id: 'bleach', name: 'Sodium Hypochlorite 12%', percentage: 10.0, category: 'Bleach / Oxidizer' },
    { id: 'acid', name: 'Hydrochloric Acid 33%', percentage: 5.0, category: 'Acidifier' },
    { id: 'water', name: 'Water', percentage: 85.0, category: 'Solvent' }
  ];
  const hazardGate = evaluateScientificQualityGate({
    formulaId: 'F-HAZARD',
    formulaVersion: '1.0.0',
    productCategory: 'TOILET_CLEANER',
    ingredients: hazardousIngredients
  });
  assert('QualityGateEnforcement', 'Hazardous formula is INCOMPATIBLE', hazardGate.compatibilityStatus === 'INCOMPATIBLE' || hazardGate.compatibilityStatus === 'CRITICAL_HAZARD', hazardGate.compatibilityStatus, 'INCOMPATIBLE');
  assert('QualityGateEnforcement', 'Hazardous formula final status is INCOMPATIBLE', hazardGate.finalFormulaStatus === 'INCOMPATIBLE', hazardGate.finalFormulaStatus, 'INCOMPATIBLE');

  // 6. Traceability Chain Engine Lineage
  const enginesExecuted = rep1.traceabilityChain.enginesExecuted;
  assert('EngineLineage', 'Executes 8 core engines', enginesExecuted.length === 8, enginesExecuted.length, 8);
  assert('EngineLineage', 'Includes pHEngineV2', enginesExecuted.includes('pHEngineV2'), true, true);
  assert('EngineLineage', 'Includes ScientificQualityGateEngine', enginesExecuted.includes('ScientificQualityGateEngine'), true, true);

  // 7. Invalid/Missing Data Handling
  const emptyGate = evaluateScientificQualityGate({
    formulaId: 'F-EMPTY',
    formulaVersion: '1.0.0',
    productCategory: 'LAUNDRY_LIQUID',
    ingredients: []
  });
  assert('MissingData', 'Empty ingredients flagged as INSUFFICIENT_DATA', emptyGate.scientificValidity === 'INSUFFICIENT_DATA', emptyGate.scientificValidity, 'INSUFFICIENT_DATA');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    passed: passedCount,
    failed: failedCount,
    results
  };
}
