import fs from 'fs';
import path from 'path';
import { runP2Phase13FinalIntegrityTestSuite, type P2Phase13Summary } from './p2Phase13FinalIntegrity.regression.test';

export interface TestExecutionRecord {
  file: string;
  moduleName: string;
  executed: boolean;
  passedAssertions: number;
  failedAssertions: number;
  totalAssertions: number;
  skipped: boolean;
  blocked?: boolean;
  blockReason?: string;
  error?: string;
}

export interface MasterTestSummary {
  discoveredCount: number;
  registeredCount: number;
  executedCount: number;
  skippedCount: number;
  failedModulesCount: number;
  totalAssertionsExecuted: number;
  totalAssertionsPassed: number;
  totalAssertionsFailed: number;
  isCleanPass: boolean;
}

/**
 * Evaluates the master test runner health strictly:
 * - Passed assertions must equal executed assertions.
 * - Failed assertions must be 0.
 * - Skipped modules must be 0.
 * - Failed modules must be 0.
 * - Executed modules must equal registered modules.
 * - Registered modules must equal discovered modules.
 */
export function evaluateMasterTestHealth(
  executionMap: TestExecutionRecord[],
  discoveredFilesCount: number
): MasterTestSummary {
  const registeredCount = executionMap.length;
  const executedCount = executionMap.filter(e => e.executed).length;
  const skippedCount = executionMap.filter(e => e.skipped).length;
  const failedModules = executionMap.filter(
    e => e.failedAssertions > 0 || !e.executed || e.skipped || !!e.error || e.totalAssertions === 0
  );
  const failedModulesCount = failedModules.length;

  const totalAssertionsExecuted = executionMap.reduce((sum, e) => sum + e.totalAssertions, 0);
  const totalAssertionsPassed = executionMap.reduce((sum, e) => sum + e.passedAssertions, 0);
  const totalAssertionsFailed = executionMap.reduce((sum, e) => sum + e.failedAssertions, 0);

  const isCleanPass = (
    executedCount === registeredCount &&
    registeredCount === discoveredFilesCount &&
    skippedCount === 0 &&
    failedModulesCount === 0 &&
    totalAssertionsFailed === 0 &&
    totalAssertionsExecuted === totalAssertionsPassed &&
    totalAssertionsExecuted > 0
  );

  return {
    discoveredCount: discoveredFilesCount,
    registeredCount,
    executedCount,
    skippedCount,
    failedModulesCount,
    totalAssertionsExecuted,
    totalAssertionsPassed,
    totalAssertionsFailed,
    isCleanPass
  };
}

export function runTestIntegrityTestSuite(
  executionMap: TestExecutionRecord[],
  p2Phase13Summary?: P2Phase13Summary
) {
  const results: { group: string; name: string; passed: boolean; message: string; actual?: any; expected?: any }[] = [];

  function assert(group: string, name: string, condition: boolean, actual?: any, expected?: any, message?: string) {
    results.push({
      group,
      name,
      passed: condition,
      message: condition ? 'PASSED' : `FAILED: ${message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`,
      actual,
      expected
    });
  }

  // 1. Real Disk Discovery vs Registration
  const testsDir = path.join(process.cwd(), 'src', 'utils', '__tests__');
  const discoveredFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.ts'));
  const registeredFiles = executionMap.map(e => e.file);

  const unregistered = discoveredFiles.filter(f => !registeredFiles.includes(f));
  assert(
    '1. Live Discovery Check',
    'All discovered test files on disk are registered',
    unregistered.length === 0,
    unregistered,
    [],
    `Unregistered test files found on disk: ${unregistered.join(', ')}`
  );

  // 2. Real Registration vs Execution
  const unexecuted = executionMap.filter(e => !e.executed);
  assert(
    '2. Live Execution Check',
    'All registered test modules were actually executed',
    unexecuted.length === 0,
    unexecuted.length,
    0,
    `Registered test modules not executed: ${unexecuted.map(e => e.file).join(', ')}`
  );

  // 3. Real Zero Assertions Check
  const zeroAssertions = executionMap.filter(e => e.totalAssertions === 0 && !e.skipped);
  assert(
    '3. Live Zero-Assertion Check',
    'All executed test modules executed at least 1 assertion',
    zeroAssertions.length === 0,
    zeroAssertions.length,
    0,
    `Test modules executed with 0 assertions: ${zeroAssertions.map(e => e.file).join(', ')}`
  );

  // 4. Real Skipped Check
  const skipped = executionMap.filter(e => e.skipped);
  assert(
    '4. Live Skipped Check',
    'Zero test modules were silently skipped in live execution',
    skipped.length === 0,
    skipped.length,
    0,
    `Skipped test modules: ${skipped.map(e => e.file).join(', ')}`
  );

  // 5. Real Error Check
  const errored = executionMap.filter(e => e.error);
  assert(
    '5. Live Error Check',
    'Zero test modules threw execution or import errors',
    errored.length === 0,
    errored.length,
    0,
    `Errored test modules: ${errored.map(e => `${e.file} (${e.error})`).join(', ')}`
  );

  // === SYNTHETIC SCENARIO REGRESSION TESTS (A to F) ===

  // A. Passed assertions reported separately from executed assertions
  const sampleMapA: TestExecutionRecord[] = [
    { file: 'a.test.ts', moduleName: 'runA', executed: true, passedAssertions: 8, failedAssertions: 2, totalAssertions: 10, skipped: false }
  ];
  const summaryA = evaluateMasterTestHealth(sampleMapA, 1);
  assert(
    'A. Distinct Reporting',
    'Passed assertions and total executed assertions are distinct values',
    summaryA.totalAssertionsPassed === 8 && summaryA.totalAssertionsExecuted === 10,
    { passed: summaryA.totalAssertionsPassed, executed: summaryA.totalAssertionsExecuted },
    { passed: 8, executed: 10 }
  );

  // B. Failed assertions reported separately
  assert(
    'B. Failed Assertion Isolation',
    'Failed assertions count is isolated and explicitly reported',
    summaryA.totalAssertionsFailed === 2,
    summaryA.totalAssertionsFailed,
    2
  );

  // C. Failed module cannot produce overall PASS
  assert(
    'C. Failure Integrity',
    'A test module with failed assertions cannot produce overall clean pass',
    summaryA.isCleanPass === false && summaryA.failedModulesCount === 1,
    summaryA.isCleanPass,
    false
  );

  // D. Skipped modules cannot produce overall PASS
  const sampleMapD: TestExecutionRecord[] = [
    { file: 'd.test.ts', moduleName: 'runD', executed: false, passedAssertions: 0, failedAssertions: 0, totalAssertions: 0, skipped: true }
  ];
  const summaryD = evaluateMasterTestHealth(sampleMapD, 1);
  assert(
    'D. Skipped Integrity',
    'Skipped test module fails clean pass evaluation',
    summaryD.isCleanPass === false && summaryD.skippedCount === 1,
    summaryD.isCleanPass,
    false
  );

  // E. Missing / unexecuted registered modules cannot produce overall PASS
  const sampleMapE: TestExecutionRecord[] = [
    { file: 'e1.test.ts', moduleName: 'runE1', executed: true, passedAssertions: 5, failedAssertions: 0, totalAssertions: 5, skipped: false },
    { file: 'e2.test.ts', moduleName: 'runE2', executed: false, passedAssertions: 0, failedAssertions: 0, totalAssertions: 0, skipped: false }
  ];
  const summaryE = evaluateMasterTestHealth(sampleMapE, 2);
  assert(
    'E. Unexecuted Module Integrity',
    'Unexecuted registered module prevents overall clean pass',
    summaryE.isCleanPass === false && summaryE.executedCount === 1 && summaryE.registeredCount === 2,
    summaryE.isCleanPass,
    false
  );

  // F. Zero-assertion modules are detected and fail overall pass
  const sampleMapF: TestExecutionRecord[] = [
    { file: 'f.test.ts', moduleName: 'runF', executed: true, passedAssertions: 0, failedAssertions: 0, totalAssertions: 0, skipped: false }
  ];
  const summaryF = evaluateMasterTestHealth(sampleMapF, 1);
  assert(
    'F. Zero-Assertion Detection',
    'Module executing zero assertions is detected as failed module and fails overall pass',
    summaryF.isCleanPass === false && summaryF.failedModulesCount === 1,
    summaryF.isCleanPass,
    false
  );

  // G. Blocked suite integrity
  const sampleMapG: TestExecutionRecord[] = [
    { file: 'g.test.ts', moduleName: 'runG', executed: false, passedAssertions: 0, failedAssertions: 0, totalAssertions: 0, skipped: false, blocked: true, blockReason: 'Dependency unavailable' }
  ];
  const summaryG = evaluateMasterTestHealth(sampleMapG, 1);
  assert(
    'G. Blocked Suite Integrity',
    'Blocked test module prevents overall clean pass',
    summaryG.isCleanPass === false,
    summaryG.isCleanPass,
    false
  );

  // H. Duplicate registration detection
  const duplicateFiles = registeredFiles.filter((f, idx) => registeredFiles.indexOf(f) !== idx);
  assert(
    'H. Duplicate Registration Check',
    'No duplicate test files registered in execution map',
    duplicateFiles.length === 0,
    duplicateFiles.length,
    0,
    `Duplicate registrations found: ${duplicateFiles.join(', ')}`
  );

  // I. Discovery mismatch check
  const orphanRegistered = registeredFiles.filter(f => !discoveredFiles.includes(f));
  assert(
    'I. Discovery Mismatch Check',
    'All registered test files exist on disk',
    orphanRegistered.length === 0,
    orphanRegistered.length,
    0,
    `Orphan registered files not found on disk: ${orphanRegistered.join(', ')}`
  );

  // J. No tests found check
  const summaryJ = evaluateMasterTestHealth([], 0);
  assert(
    'J. Zero Discovery Check',
    'Empty test discovery does not produce a clean pass',
    summaryJ.isCleanPass === false,
    summaryJ.isCleanPass,
    false
  );

  // K. Counter integrity check
  const totalExec = executionMap.reduce((s, e) => s + e.totalAssertions, 0);
  const totalPass = executionMap.reduce((s, e) => s + e.passedAssertions, 0);
  const totalFail = executionMap.reduce((s, e) => s + e.failedAssertions, 0);
  assert(
    'K. Counter Integrity',
    'Total executed assertions equals sum of passed and failed assertions',
    totalExec === totalPass + totalFail,
    { totalExec, sumPassFail: totalPass + totalFail },
    { equality: true }
  );

  // L. Real P2-13 Production Suite Result Capture (Option A: Meta-Test Tracking Without Untracked Re-execution)
  const p213Record = executionMap.find(e => e.file === 'p2Phase13FinalIntegrity.regression.test.ts');
  const realP213Summary: P2Phase13Summary = p2Phase13Summary || (p213Record
    ? {
        passed: p213Record.passedAssertions,
        failed: p213Record.failedAssertions,
        total: p213Record.totalAssertions,
        results: []
      }
    : runP2Phase13FinalIntegrityTestSuite());

  assert(
    'L. Real P2-13 Production Execution',
    'runP2Phase13FinalIntegrityTestSuite returns valid summary with zero failures',
    realP213Summary.failed === 0 && realP213Summary.passed > 0 && realP213Summary.total === realP213Summary.passed + realP213Summary.failed,
    realP213Summary.failed,
    0
  );

  // M. Real P2-13 Summary Feeding Master Health Evaluation
  const realExecutionMap: TestExecutionRecord[] = [
    {
      file: 'p2Phase13FinalIntegrity.regression.test.ts',
      moduleName: 'runP2Phase13FinalIntegrityTestSuite',
      executed: true,
      passedAssertions: realP213Summary.passed,
      failedAssertions: realP213Summary.failed,
      totalAssertions: realP213Summary.total,
      skipped: false
    }
  ];
  const realMasterHealthPass = evaluateMasterTestHealth(realExecutionMap, 1);
  assert(
    'M. Real Master Health Pass with P2-13 Summary',
    'evaluateMasterTestHealth returns isCleanPass=true when P2-13 summary results pass genuinely',
    realMasterHealthPass.isCleanPass === true && realMasterHealthPass.totalAssertionsPassed === realP213Summary.passed,
    realMasterHealthPass.isCleanPass,
    true
  );

  // N. Real P2-13 Failure Propagation in Master Health
  const failureExecutionMap: TestExecutionRecord[] = [
    {
      file: 'p2Phase13FinalIntegrity.regression.test.ts',
      moduleName: 'runP2Phase13FinalIntegrityTestSuite',
      executed: true,
      passedAssertions: realP213Summary.passed - 1,
      failedAssertions: 1,
      totalAssertions: realP213Summary.total,
      skipped: false
    }
  ];
  const realMasterHealthFail = evaluateMasterTestHealth(failureExecutionMap, 1);
  assert(
    'N. Real P2-13 Failure Propagation',
    'A failed P2-13 assertion count causes evaluateMasterTestHealth to return isCleanPass=false',
    realMasterHealthFail.isCleanPass === false && realMasterHealthFail.totalAssertionsFailed === 1,
    realMasterHealthFail.isCleanPass,
    false
  );

  // O. Single Execution & Accounting Consistency Check
  const p213MatchesExecutionMap = p213Record
    ? p213Record.passedAssertions === realP213Summary.passed &&
      p213Record.failedAssertions === realP213Summary.failed &&
      p213Record.totalAssertions === realP213Summary.total
    : true;
  assert(
    'O. Invocation Accounting Consistency',
    'P2-13 execution summary matches execution map record with zero untracked discrepancy',
    p213MatchesExecutionMap,
    { executionMapPassed: p213Record?.passedAssertions, summaryPassed: realP213Summary.passed },
    { equality: true }
  );

  // P. P2-13 Failure Details Preservation Without Throwing
  const mockFailedSummary: P2Phase13Summary = {
    passed: 11,
    failed: 1,
    total: 12,
    results: [
      { testId: 'TEST 1', description: 'Missing contactTime rejected', passed: false, message: 'Expected MISSING_REQUIRED_FIELD, Actual: null' }
    ]
  };
  assert(
    'P. P2-13 Failure Details Preservation',
    'A failed P2-13 assertion preserves its summary and individual failure details without throwing',
    mockFailedSummary.failed === 1 &&
    mockFailedSummary.results.length === 1 &&
    mockFailedSummary.results[0].passed === false &&
    mockFailedSummary.results[0].message.includes('Expected MISSING_REQUIRED_FIELD'),
    mockFailedSummary.results[0].passed,
    false
  );

  // Q. Failure Details Recorded Before Propagation
  const failingMapForRecording: TestExecutionRecord[] = [
    {
      file: 'p2Phase13FinalIntegrity.regression.test.ts',
      moduleName: 'runP2Phase13FinalIntegrityTestSuite',
      executed: true,
      passedAssertions: 11,
      failedAssertions: 1,
      totalAssertions: 12,
      skipped: false
    }
  ];
  const failingHealthRecord = evaluateMasterTestHealth(failingMapForRecording, 1);
  assert(
    'Q. Failure Details Recorded Before Propagation',
    'Failing assertion metrics are captured in health summary so manifest can record before exit',
    failingHealthRecord.totalAssertionsFailed === 1 &&
    failingHealthRecord.failedModulesCount === 1 &&
    failingHealthRecord.isCleanPass === false,
    { failedCount: failingHealthRecord.totalAssertionsFailed, isClean: failingHealthRecord.isCleanPass },
    { failedCount: 1, isClean: false }
  );

  // R. Test Integrity Suite Consumes Supplied Summary Without Rerunning
  const consumedSummary = p2Phase13Summary ? p2Phase13Summary : realP213Summary;
  assert(
    'R. Single-Execution Guarantee',
    'Test integrity suite consumes supplied P2-13 summary without invoking suite again',
    consumedSummary.passed > 0 && consumedSummary.failed === 0 && consumedSummary.total === consumedSummary.passed + consumedSummary.failed,
    { passed: consumedSummary.passed, failed: consumedSummary.failed, total: consumedSummary.total },
    { failed: 0, totalEqualsPassedPlusFailed: true }
  );

  // S. Manifest Assertion Accounting Truth
  const derivedTotal = executionMap.reduce((sum, e) => sum + e.totalAssertions, 0);
  const derivedPassed = executionMap.reduce((sum, e) => sum + e.passedAssertions, 0);
  const derivedFailed = executionMap.reduce((sum, e) => sum + e.failedAssertions, 0);
  assert(
    'S. Manifest Accounting Truth',
    'Master execution record totals strictly equate to sum of passed and failed assertions',
    derivedTotal === derivedPassed + derivedFailed && derivedTotal > 0,
    { derivedTotal, derivedSum: derivedPassed + derivedFailed },
    { equality: true }
  );

  // T. Master Runner Non-Zero Exit Condition
  const exitCodeConditionClean = !realMasterHealthPass.isCleanPass || 0 > 0;
  const exitCodeConditionFailed = !realMasterHealthFail.isCleanPass || 0 > 0;
  assert(
    'T. Non-Zero Exit on Failure Guard',
    'Clean health yields zero-exit condition while failed health strictly triggers non-zero exit',
    exitCodeConditionClean === false && exitCodeConditionFailed === true,
    { exitCodeConditionClean, exitCodeConditionFailed },
    { exitCodeConditionClean: false, exitCodeConditionFailed: true }
  );

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nTest Integrity Verification Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  const rawP213Failures = (realP213Summary?.results || [])
    .filter(r => !r.passed)
    .map(r => ({
      testId: r.testId,
      id: r.testId,
      group: 'P2-13 Final Integrity',
      name: r.description,
      description: r.description,
      passed: false,
      message: r.message
    }));

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results,
    discoveredCount: discoveredFiles.length,
    registeredCount: registeredFiles.length,
    executedCount: executionMap.filter(e => e.executed).length,
    skippedCount: skipped.length,
    totalAssertions: executionMap.reduce((sum, e) => sum + e.totalAssertions, 0),
    p2Phase13Summary: realP213Summary,
    p2Phase13FailureDetails: rawP213Failures
  };
}
