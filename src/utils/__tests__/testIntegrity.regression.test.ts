import fs from 'fs';
import path from 'path';

export interface TestExecutionRecord {
  file: string;
  moduleName: string;
  executed: boolean;
  passedAssertions: number;
  failedAssertions: number;
  totalAssertions: number;
  skipped: boolean;
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

export function runTestIntegrityTestSuite(executionMap: TestExecutionRecord[]) {
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

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✓' : '✗';
    console.log(`  ${icon} [${r.group}] ${r.name}: ${r.message}`);
  });

  console.log(`\nTest Integrity Verification Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results,
    discoveredCount: discoveredFiles.length,
    registeredCount: registeredFiles.length,
    executedCount: executionMap.filter(e => e.executed).length,
    skippedCount: skipped.length,
    totalAssertions: executionMap.reduce((sum, e) => sum + e.totalAssertions, 0)
  };
}
