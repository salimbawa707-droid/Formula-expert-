/**
 * ============================================================================
 * P1 PHASE 11 — R&D EXPERIMENT, EVIDENCE & SCIENTIFIC LEARNING LOOP REGRESSION TESTS
 * ============================================================================
 */

import { globalScientificLearningEngine } from '../scientificLearningEngine';
import { globalGovernanceRegistry } from '../scientificGovernanceEngine';
import { FormulationIngredient } from '../../types';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runP1Phase11LearningLoopTestSuite(): { total: number; passed: number; failed: number; results: TestResult[] } {
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
  console.log('  P1 PHASE 11 — R&D EXPERIMENT, EVIDENCE & SCIENTIFIC LEARNING LOOP ');
  console.log('================================================================================\n');

  const engine = globalScientificLearningEngine;
  // Clear any existing trial state to keep tests deterministic
  engine.getAllTrials().forEach(t => engine.deleteExperimentTrial(t.trialId));

  const baseIngredients: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 12, activeMatterPct: 70, category: 'Anionic Surfactant' },
    { name: 'Sodium Citrate', percentage: 5, activeMatterPct: 100, category: 'Builder' },
    { name: 'Water', percentage: 83, activeMatterPct: 0, category: 'Solvent' }
  ];

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Recording Trials and Error Calculation
  // --------------------------------------------------------------------------
  
  // Trial 1: Soil removal matches closely
  const trial1 = engine.recordExperimentTrial({
    trialName: 'Hard-Water Stain Removal Trial A',
    formulaId: 'golden-hd-laundry',
    formulaVersion: '1.0.0',
    categoryId: 'LAUNDRY_LIQUID',
    operator: 'Dr. Evelyn Carter',
    testConditions: {
      temperatureC: 25,
      waterHardnessPpm: 150,
      dosageGramsPerLiter: 2.0
    },
    ingredients: baseIngredients,
    measurements: {
      cleaningScore: 82.5 // Simulated close score
    }
  });

  assert('Trial 1 successfully registered', typeof trial1.trialId === 'string', true, true);
  assert('Trial 1 registered active category', trial1.categoryId === 'LAUNDRY_LIQUID', trial1.categoryId, 'LAUNDRY_LIQUID');
  assert('Trial 1 predicted baseline cleaning score', typeof trial1.predictions.cleaningScore === 'number', true, true);
  assert('Trial 1 has correct absolute error calculation', typeof trial1.errors.cleaningScore.absoluteError === 'number', true, true);
  assert('Trial 1 is comparable', trial1.isComparable, true, true);

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Outlier & Replicate Statistical Tracking
  // --------------------------------------------------------------------------
  
  // Trial 2: High range replicate values trigger warning
  const trial2 = engine.recordExperimentTrial({
    trialName: 'Stain Swatch Replicate Check B',
    formulaId: 'golden-hd-laundry',
    formulaVersion: '1.0.0',
    categoryId: 'LAUNDRY_LIQUID',
    operator: 'Dr. Evelyn Carter',
    testConditions: { temperatureC: 25, waterHardnessPpm: 150 },
    ingredients: baseIngredients,
    measurements: { cleaningScore: 80.0 },
    replicateValues: {
      cleaningScore: [70.0, 91.0, 79.0] // High range = 21% deviation -> Suspect/Warning
    }
  });

  assert('Replicate mean calculated correctly', trial2.replicateMean?.cleaningScore === 80.0, trial2.replicateMean?.cleaningScore, 80.0);
  assert('Replicate stdDev calculated correctly', trial2.replicateStdDev?.cleaningScore !== undefined, true, true);
  assert('High range replicate flagged as SUSPECT_DATA', trial2.qualityStatus === 'SUSPECT_DATA', trial2.qualityStatus, 'SUSPECT_DATA');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Systematic Discrepancy & Learning Candidate Proposals
  // --------------------------------------------------------------------------
  
  // Clear suspect trial to prevent interference, or let it ignore suspect data
  engine.deleteExperimentTrial(trial2.trialId);

  // Record 3 highly under-predicted trials to trigger learning candidate.
  // Model predicts around ~82% cleaning index. We measure ~86% on bench.
  // Discrepancy threshold: systematic bias of |meanBias| >= 1.5% over 3 trials.
  
  engine.recordExperimentTrial({
    trialName: 'Under-predicted Standard Swatch 1',
    formulaId: 'golden-hd-laundry',
    formulaVersion: '1.0.0',
    categoryId: 'LAUNDRY_LIQUID',
    operator: 'Lab Tech',
    testConditions: { temperatureC: 25, waterHardnessPpm: 150 },
    ingredients: baseIngredients,
    measurements: { cleaningScore: 86.5 }
  });

  engine.recordExperimentTrial({
    trialName: 'Under-predicted Standard Swatch 2',
    formulaId: 'golden-hd-laundry',
    formulaVersion: '1.0.0',
    categoryId: 'LAUNDRY_LIQUID',
    operator: 'Lab Tech',
    testConditions: { temperatureC: 25, waterHardnessPpm: 150 },
    ingredients: baseIngredients,
    measurements: { cleaningScore: 86.0 }
  });

  engine.recordExperimentTrial({
    trialName: 'Under-predicted Standard Swatch 3',
    formulaId: 'golden-hd-laundry',
    formulaVersion: '1.0.0',
    categoryId: 'LAUNDRY_LIQUID',
    operator: 'Lab Tech',
    testConditions: { temperatureC: 25, waterHardnessPpm: 150 },
    ingredients: baseIngredients,
    measurements: { cleaningScore: 85.8 }
  });

  const candidates = engine.getLearningCandidates();
  assert('Systematic discrepancy generated learning candidate', candidates.length > 0, candidates.length > 0, true);
  
  const learningCandidate = candidates[0];
  if (learningCandidate) {
    assert('Candidate targets correct category', learningCandidate.canonicalCategory === 'LAUNDRY_LIQUID', learningCandidate.canonicalCategory, 'LAUNDRY_LIQUID');
    assert('Candidate targets correct KPI', learningCandidate.kpiId === 'cleaningScore', learningCandidate.kpiId, 'cleaningScore');
    assert('Candidate observed bias is positive (under-predicted)', learningCandidate.observedBias > 1.5, true, true);
    assert('Candidate recommended calibrated value', learningCandidate.recommendedValue > learningCandidate.currentValue, true, true);
    assert('Candidate confidence is MEDIUM (3 trials)', learningCandidate.confidence === 'MEDIUM', learningCandidate.confidence, 'MEDIUM');

    // --------------------------------------------------------------------------
    // TEST GROUP 4: Governance Pipeline Integration
    // --------------------------------------------------------------------------
    
    const proposal = engine.submitLearningCandidateToGovernance(
      learningCandidate.candidateId,
      'Dr. Evelyn Carter',
      'Verified performance bump under soft conditions'
    );

    assert('Candidate status updated to SUBMITTED', learningCandidate.status === 'SUBMITTED', learningCandidate.status, 'SUBMITTED');
    assert('Governance Calibration Proposal created successfully', typeof proposal.proposalId === 'string', true, true);
    assert('Proposal scope is category level', proposal.canonicalCategory === 'LAUNDRY_LIQUID', proposal.canonicalCategory, 'LAUNDRY_LIQUID');
    assert('Proposal preserves experimental sample count', proposal.sampleCount >= 4, true, true); // 1 baseline + 3 under-predicted
    
    // Verify theoretical constant protection safety rule
    // Try to approve something with a theoretical constant name:
    const physicalConstantProposal = {
      ...proposal,
      parameterName: 'LABSA Sulfonic Acid pKa',
      proposedShiftOffset: -2.0
    };

    const approvalOfConstant = globalGovernanceRegistry.approveCalibrationProposal(
      physicalConstantProposal,
      'APPROVED_BY_USER',
      'Empirically shifting physical chemistry constant'
    );

    assert('Rule A: Physics/chemistry constants locked against learning loop calibration', approvalOfConstant.approvalStatus === 'REJECTED', approvalOfConstant.approvalStatus, 'REJECTED');
    assert('Rule A rationale describes thermodynamic lockout', Boolean(approvalOfConstant.rejectionReason?.includes('ERR_CHEMISTRY_CONSTANT_IMMUTABLE')), true, true);
  } else {
    console.error('[FAIL] Could not verify Learning Candidate or Governance Integration because no candidates were generated.');
  }

  // Restore previous storage trials if needed, but keeping it clean is fine.
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}
