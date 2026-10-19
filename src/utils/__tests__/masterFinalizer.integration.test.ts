import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { finalizeMasterTestRun } from '../masterTestFinalizer';
import type { TestExecutionRecord } from './testIntegrity.regression.test';

export interface FinalizerIntegrationSummary {
  passed: number;
  failed: number;
  total: number;
  results: Array<{
    group: string;
    name: string;
    passed: boolean;
    message: string;
    actual?: any;
    expected?: any;
  }>;
}

export function runMasterFinalizerIntegrationTestSuite(): FinalizerIntegrationSummary {
  console.log('--- RUNNING MASTER FINALIZER FAILURE -> MANIFEST -> EXIT CODE INTEGRATION SUITE ---');

  const results: Array<{
    group: string;
    name: string;
    passed: boolean;
    message: string;
    actual?: any;
    expected?: any;
  }> = [];

  function assert(
    group: string,
    name: string,
    condition: boolean,
    actual?: any,
    expected?: any,
    customMsg?: string
  ) {
    const passed = Boolean(condition);
    results.push({
      group,
      name,
      passed,
      message: passed ? 'PASSED' : `FAILED: ${customMsg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`,
      actual,
      expected
    });
    const mark = passed ? '✓' : '✗';
    console.log(`  ${mark} [${group}] ${name}`);
  }

  const tempBaseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'master-finalizer-integ-'));
  const finalizerScriptPath = path.join(process.cwd(), 'src', 'utils', 'masterTestFinalizer.ts');

  try {
    // =========================================================================
    // TEST A: INTEGRITY FAILURE OVERRIDES A CLEAN EXECUTION MAP
    // =========================================================================
    const testAManifestPath = path.join(tempBaseDir, 'test-a-manifest.json');
    const testAConfigPath = path.join(tempBaseDir, 'test-a-config.json');

    // Clean execution map: all modules executed, zero failed assertions
    const cleanMapForTestA: TestExecutionRecord[] = [
      {
        file: 'cleanModuleA.test.ts',
        moduleName: 'runCleanModuleATestSuite',
        executed: true,
        passedAssertions: 10,
        failedAssertions: 0,
        totalAssertions: 10,
        skipped: false
      },
      {
        file: 'cleanModuleB.test.ts',
        moduleName: 'runCleanModuleBTestSuite',
        executed: true,
        passedAssertions: 5,
        failedAssertions: 0,
        totalAssertions: 5,
        skipped: false
      }
    ];

    // Genuine controlled test-integrity failure
    const testAIntegritySummary = {
      failed: 1,
      results: [
        {
          testId: 'TEST-A-INTEG-001',
          group: 'Integrity Suite A',
          name: 'Orphan File Registration Check',
          passed: false,
          message: 'FAILED: Detected 1 unregistered test file on disk'
        }
      ]
    };

    const testAConfig = {
      executionMap: cleanMapForTestA,
      discoveredCount: 2,
      testIntegritySummary: testAIntegritySummary,
      manifestPath: testAManifestPath,
      silent: false
    };

    fs.writeFileSync(testAConfigPath, JSON.stringify(testAConfig, null, 2), 'utf8');

    // Execute via child process using real production finalization path
    const testAChild = spawnSync(process.execPath, [path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs'), finalizerScriptPath, '--config', testAConfigPath], {
      encoding: 'utf8',
      cwd: process.cwd()
    });

    // 1. Non-zero exit code on integrity failure
    assert(
      'Test A — Integrity Failure Overrides Clean Map',
      'Child process exits with non-zero exit code (1) when integrity fails on clean map',
      testAChild.status === 1,
      testAChild.status,
      1
    );

    // 2. Manifest written to disk before exit
    const testAManifestExists = fs.existsSync(testAManifestPath);
    assert(
      'Test A — Integrity Failure Overrides Clean Map',
      'Manifest is written to disk before process exits on integrity failure',
      testAManifestExists,
      testAManifestExists,
      true
    );

    let testAManifestContent: any = null;
    if (testAManifestExists) {
      try {
        testAManifestContent = JSON.parse(fs.readFileSync(testAManifestPath, 'utf8'));
      } catch (e) {
        testAManifestContent = null;
      }
    }

    // 3. isCleanPass === false in manifest despite clean execution map
    assert(
      'Test A — Integrity Failure Overrides Clean Map',
      'Manifest records isCleanPass === false when test-integrity summary contains failures',
      testAManifestContent?.summary?.isCleanPass === false,
      testAManifestContent?.summary?.isCleanPass,
      false
    );

    // 4. Manifest status agrees with exit decision
    assert(
      'Test A — Integrity Failure Overrides Clean Map',
      'Manifest isCleanPass status strictly agrees with non-zero exit decision',
      testAManifestContent?.summary?.isCleanPass === false && testAChild.status === 1,
      { isCleanPass: testAManifestContent?.summary?.isCleanPass, exitCode: testAChild.status },
      { isCleanPass: false, exitCode: 1 }
    );

    // =========================================================================
    // TEST B: INDIVIDUAL TEST-INTEGRITY FAILURE DETAILS ARE PERSISTED IN MANIFEST
    // =========================================================================
    const testBManifestPath = path.join(tempBaseDir, 'test-b-manifest.json');
    const testBConfigPath = path.join(tempBaseDir, 'test-b-config.json');

    const knownTestId = 'TEST-INTEG-FAIL-902';
    const knownGroup = 'Forensic Trace Validation';
    const knownName = 'Mass Balance Law Enforcement Check';
    const knownMessage = 'Stoichiometric total mismatch: Expected 100.0%, got 99.2%';

    const testBExecutionMap: TestExecutionRecord[] = [
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

    const testBIntegritySummary = {
      failed: 1,
      results: [
        {
          testId: knownTestId,
          group: knownGroup,
          name: knownName,
          passed: false,
          message: knownMessage
        }
      ]
    };

    const testBConfig = {
      executionMap: testBExecutionMap,
      discoveredCount: 1,
      testIntegritySummary: testBIntegritySummary,
      manifestPath: testBManifestPath,
      silent: false
    };

    fs.writeFileSync(testBConfigPath, JSON.stringify(testBConfig, null, 2), 'utf8');

    // Execute via child process using real production finalization path
    const testBChild = spawnSync(process.execPath, [path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs'), finalizerScriptPath, '--config', testBConfigPath], {
      encoding: 'utf8',
      cwd: process.cwd()
    });

    const testBManifestExists = fs.existsSync(testBManifestPath);
    assert(
      'Test B — Failure Details Persisted',
      'Test B manifest is written to disk before exit decision',
      testBManifestExists,
      testBManifestExists,
      true
    );

    let testBManifestContent: any = null;
    if (testBManifestExists) {
      try {
        testBManifestContent = JSON.parse(fs.readFileSync(testBManifestPath, 'utf8'));
      } catch (e) {
        testBManifestContent = null;
      }
    }

    // Read back failure details from manifest on disk
    const persistedDetails = testBManifestContent?.summary?.failureDetails || testBManifestContent?.failureDetails || [];
    const matchedDetail = Array.isArray(persistedDetails)
      ? persistedDetails.find((d: any) => d.testId === knownTestId || d.name === knownName)
      : null;

    // 5. Individual failure details are persisted on disk (not only printed to console)
    assert(
      'Test B — Failure Details Persisted',
      'Exact individual failure details are persisted in manifest on disk',
      Boolean(matchedDetail) &&
      matchedDetail?.testId === knownTestId &&
      matchedDetail?.group === knownGroup &&
      matchedDetail?.name === knownName &&
      matchedDetail?.message === knownMessage,
      matchedDetail,
      {
        testId: knownTestId,
        group: knownGroup,
        name: knownName,
        message: knownMessage
      }
    );

    // 6. Manifest records isCleanPass === false and exit code is non-zero
    assert(
      'Test B — Failure Details Persisted',
      'Manifest records isCleanPass === false and exit code is non-zero (1)',
      testBManifestContent?.summary?.isCleanPass === false && testBChild.status === 1,
      { isCleanPass: testBManifestContent?.summary?.isCleanPass, exitCode: testBChild.status },
      { isCleanPass: false, exitCode: 1 }
    );

    // =========================================================================
    // SCENARIO 3: SUCCESS CONTROL PATH (CHILD PROCESS + DISK MANIFEST + EXIT 0)
    // =========================================================================
    const successManifestPath = path.join(tempBaseDir, 'success-manifest.json');
    const successConfigPath = path.join(tempBaseDir, 'success-config.json');

    const cleanExecutionMap: TestExecutionRecord[] = [
      {
        file: 'p2Phase13FinalIntegrity.regression.test.ts',
        moduleName: 'runP2Phase13FinalIntegrityTestSuite',
        executed: true,
        passedAssertions: 12,
        failedAssertions: 0,
        totalAssertions: 12,
        skipped: false
      },
      {
        file: 'controlModule.test.ts',
        moduleName: 'runControlModuleTestSuite',
        executed: true,
        passedAssertions: 5,
        failedAssertions: 0,
        totalAssertions: 5,
        skipped: false
      }
    ];

    const cleanIntegrityDetail = {
      failed: 0,
      results: [
        {
          testId: 'TEST-PASS-01',
          group: 'P2-13 Integrity',
          name: 'All checks passed',
          passed: true,
          message: 'PASSED'
        }
      ]
    };

    const successConfig = {
      executionMap: cleanExecutionMap,
      discoveredCount: 2,
      testIntegritySummary: cleanIntegrityDetail,
      manifestPath: successManifestPath,
      silent: false
    };

    fs.writeFileSync(successConfigPath, JSON.stringify(successConfig, null, 2), 'utf8');

    // Run clean case in child process
    const successChild = spawnSync(process.execPath, [path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs'), finalizerScriptPath, '--config', successConfigPath], {
      encoding: 'utf8',
      cwd: process.cwd()
    });

    // 7. Zero exit code
    assert(
      'Success Control Scenario',
      'Child process exits with zero (0) when all assertions pass',
      successChild.status === 0,
      successChild.status,
      0
    );

    // 8. Success manifest exists and is readable
    const successManifestExists = fs.existsSync(successManifestPath);
    assert(
      'Success Control Scenario',
      'Success manifest is written to disk before clean exit',
      successManifestExists,
      successManifestExists,
      true
    );

    let successManifestContent: any = null;
    if (successManifestExists) {
      try {
        successManifestContent = JSON.parse(fs.readFileSync(successManifestPath, 'utf8'));
      } catch (e) {
        successManifestContent = null;
      }
    }

    // 9. isCleanPass === true in clean manifest
    assert(
      'Success Control Scenario',
      'Manifest records isCleanPass === true on genuine clean pass',
      successManifestContent?.summary?.isCleanPass === true,
      successManifestContent?.summary?.isCleanPass,
      true
    );

    // 10. Clean run has empty failureDetails array (not fabricated entries)
    const successFailureDetails = successManifestContent?.summary?.failureDetails || successManifestContent?.failureDetails || [];
    assert(
      'Success Control Scenario',
      'Clean run contains empty failureDetails collection in manifest',
      Array.isArray(successFailureDetails) && successFailureDetails.length === 0,
      successFailureDetails.length,
      0
    );

    // 11. Clean aggregate counts
    const cleanExpectedTotal = cleanExecutionMap.reduce((s, e) => s + e.totalAssertions, 0);
    const cleanExpectedPassed = cleanExecutionMap.reduce((s, e) => s + e.passedAssertions, 0);

    assert(
      'Success Control Scenario',
      'Success manifest totals match clean execution records with 0 failures',
      successManifestContent?.summary?.totalAssertionsExecuted === cleanExpectedTotal &&
      successManifestContent?.summary?.totalAssertionsPassed === cleanExpectedPassed &&
      successManifestContent?.summary?.totalAssertionsFailed === 0 &&
      successManifestContent?.summary?.failedModulesCount === 0 &&
      successManifestContent?.summary?.testIntegrityFailures === 0,
      {
        total: successManifestContent?.summary?.totalAssertionsExecuted,
        passed: successManifestContent?.summary?.totalAssertionsPassed,
        failed: successManifestContent?.summary?.totalAssertionsFailed,
        testIntegrityFailures: successManifestContent?.summary?.testIntegrityFailures
      },
      { total: cleanExpectedTotal, passed: cleanExpectedPassed, failed: 0, testIntegrityFailures: 0 }
    );

    // =========================================================================
    // SCENARIO 4: IN-PROCESS INJECTED EXIT-STRATEGY VERIFICATION
    // =========================================================================
    let capturedExitCode: number | null = null;
    const directTempManifest = path.join(tempBaseDir, 'direct-manifest.json');

    finalizeMasterTestRun({
      executionMap: cleanMapForTestA,
      discoveredCount: 2,
      testIntegritySummary: testAIntegritySummary,
      manifestPath: directTempManifest,
      exitStrategy: (code: number) => {
        capturedExitCode = code;
      },
      silent: true
    });

    const directManifest = JSON.parse(fs.readFileSync(directTempManifest, 'utf8'));

    // 12. Direct call enforces exitStrategy(1) and isCleanPass === false
    assert(
      'Injected Exit Strategy',
      'Direct call triggers exit strategy with code 1 and writes isCleanPass === false',
      capturedExitCode === 1 && directManifest.summary.isCleanPass === false,
      { capturedExitCode, isCleanPass: directManifest.summary.isCleanPass },
      { capturedExitCode: 1, isCleanPass: false }
    );

    // =========================================================================
    // PROBLEM 1 SPECIALIZED TESTS: MANIFEST PERSISTENCE FAILURE INVARIANTS
    // =========================================================================

    // Test A — Manifest persistence failure (clean execution map, clean integrity, but write throws EACCES)
    let testAPersistExitCode: number | null = null;
    const resA = finalizeMasterTestRun({
      executionMap: cleanMapForTestA,
      discoveredCount: 2,
      testIntegritySummary: { failed: 0, results: [] },
      manifestPath: path.join(tempBaseDir, 'unwritable-a.json'),
      manifestWriter: () => {
        throw new Error('EACCES: permission denied, open unwritable-a.json');
      },
      exitStrategy: (code: number) => {
        testAPersistExitCode = code;
      },
      silent: true
    });

    assert(
      'Problem 1 — Test A: Manifest Persistence Failure',
      'Finalizer forces non-zero exit code (1) when manifest persistence throws EACCES',
      testAPersistExitCode === 1 && resA.exitCode === 1,
      { exitCode: testAPersistExitCode, resultExit: resA.exitCode },
      { exitCode: 1, resultExit: 1 }
    );

    assert(
      'Problem 1 — Test A: Manifest Persistence Failure',
      'Finalizer records isCleanPass === false and retains persistence failure in diagnostics',
      resA.masterHealth.isCleanPass === false &&
      resA.failureReport.failedIntegrity.some(f => f.testId === 'MANIFEST-PERSISTENCE-FAILURE'),
      { isCleanPass: resA.masterHealth.isCleanPass, hasPersistenceError: resA.failureReport.failedIntegrity.some(f => f.testId === 'MANIFEST-PERSISTENCE-FAILURE') },
      { isCleanPass: false, hasPersistenceError: true }
    );

    // Test B — Existing test failure plus manifest write failure
    let testBPersistExitCode: number | null = null;
    const resB = finalizeMasterTestRun({
      executionMap: [
        {
          file: 'failingModule.test.ts',
          moduleName: 'runFailingTestSuite',
          executed: true,
          passedAssertions: 8,
          failedAssertions: 2,
          totalAssertions: 10,
          skipped: false
        }
      ],
      discoveredCount: 1,
      testIntegritySummary: {
        failed: 1,
        results: [
          {
            testId: 'KNOWN-TEST-FAIL-01',
            group: 'Core Suite',
            name: 'Assertion Check',
            passed: false,
            message: 'Expected true, got false'
          }
        ]
      },
      manifestPath: path.join(tempBaseDir, 'unwritable-b.json'),
      manifestWriter: () => {
        throw new Error('EIO: I/O error writing manifest');
      },
      exitStrategy: (code: number) => {
        testBPersistExitCode = code;
      },
      silent: true
    });

    assert(
      'Problem 1 — Test B: Test Failure + Manifest Persistence Failure',
      'Final exit remains non-zero (1) and original test failure details plus persistence failure are both preserved',
      testBPersistExitCode === 1 &&
      resB.failureReport.failedIntegrity.some(f => f.testId === 'KNOWN-TEST-FAIL-01') &&
      resB.failureReport.failedIntegrity.some(f => f.testId === 'MANIFEST-PERSISTENCE-FAILURE'),
      {
        exitCode: testBPersistExitCode,
        hasOriginalFail: resB.failureReport.failedIntegrity.some(f => f.testId === 'KNOWN-TEST-FAIL-01'),
        hasPersistFail: resB.failureReport.failedIntegrity.some(f => f.testId === 'MANIFEST-PERSISTENCE-FAILURE')
      },
      { exitCode: 1, hasOriginalFail: true, hasPersistFail: true }
    );

    // Test C — Normal success control
    let testCExitCode: number | null = null;
    const resC = finalizeMasterTestRun({
      executionMap: cleanMapForTestA,
      discoveredCount: 2,
      testIntegritySummary: { failed: 0, results: [] },
      manifestPath: path.join(tempBaseDir, 'success-c.json'),
      exitStrategy: (code: number) => {
        testCExitCode = code;
      },
      silent: true
    });

    assert(
      'Problem 1 — Test C: Normal Success Control',
      'Clean run with successful manifest writing returns exit code 0 and isCleanPass === true',
      testCExitCode === 0 && resC.masterHealth.isCleanPass === true && resC.manifestWritten === true,
      { exitCode: testCExitCode, isCleanPass: resC.masterHealth.isCleanPass, written: resC.manifestWritten },
      { exitCode: 0, isCleanPass: true, written: true }
    );

    // Test D — Normal test failure control
    let testDExitCode: number | null = null;
    const resD = finalizeMasterTestRun({
      executionMap: [
        {
          file: 'failingModule.test.ts',
          moduleName: 'runFailingTestSuite',
          executed: true,
          passedAssertions: 5,
          failedAssertions: 1,
          totalAssertions: 6,
          skipped: false
        }
      ],
      discoveredCount: 1,
      testIntegritySummary: { failed: 0, results: [] },
      manifestPath: path.join(tempBaseDir, 'failure-d.json'),
      exitStrategy: (code: number) => {
        testDExitCode = code;
      },
      silent: true
    });

    assert(
      'Problem 1 — Test D: Normal Test Failure Control',
      'Failed assertions with successful manifest writing returns non-zero exit code and isCleanPass === false',
      testDExitCode === 1 && resD.masterHealth.isCleanPass === false && resD.manifestWritten === true,
      { exitCode: testDExitCode, isCleanPass: resD.masterHealth.isCleanPass, written: resD.manifestWritten },
      { exitCode: 1, isCleanPass: false, written: true }
    );

    // =========================================================================
    // PROBLEM 3 SPECIALIZED TESTS: P2-13 RAW FAILURE DIAGNOSTICS PERSISTENCE
    // =========================================================================

    // Test P3-A: P2-13 failure with raw diagnostics in child process & disk manifest
    const testP3AManifestPath = path.join(tempBaseDir, 'test-p3a-manifest.json');
    const testP3AConfigPath = path.join(tempBaseDir, 'test-p3a-config.json');

    const p3AExecutionMap: TestExecutionRecord[] = [
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

    const p3ARawDiagnostics = {
      passed: 11,
      failed: 1,
      total: 12,
      results: [
        {
          testId: 'P2-13-DEFECT-01',
          description: 'Missing contactTime parameter is rejected by empirical data importer',
          passed: false,
          message: 'Expected: MISSING_REQUIRED_FIELD, Actual: null'
        }
      ]
    };

    const testP3AConfig = {
      executionMap: p3AExecutionMap,
      discoveredCount: 1,
      testIntegritySummary: { failed: 0, results: [] },
      p2Phase13Summary: p3ARawDiagnostics,
      manifestPath: testP3AManifestPath,
      silent: true
    };

    fs.writeFileSync(testP3AConfigPath, JSON.stringify(testP3AConfig, null, 2), 'utf8');

    const testP3AChild = spawnSync(process.execPath, [path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs'), finalizerScriptPath, '--config', testP3AConfigPath], {
      encoding: 'utf8',
      cwd: process.cwd()
    });

    assert(
      'Problem 3 — Test P3-A: P2-13 Raw Diagnostics Child Process',
      'Child process exits with code 1 when P2-13 raw failure occurs',
      testP3AChild.status === 1,
      testP3AChild.status,
      1
    );

    const testP3AManifestExists = fs.existsSync(testP3AManifestPath);
    assert(
      'Problem 3 — Test P3-A: P2-13 Raw Diagnostics Disk Persistence',
      'Execution manifest is written to disk when P2-13 raw failure occurs',
      testP3AManifestExists,
      testP3AManifestExists,
      true
    );

    let testP3AManifestContent: any = null;
    if (testP3AManifestExists) {
      try {
        testP3AManifestContent = JSON.parse(fs.readFileSync(testP3AManifestPath, 'utf8'));
      } catch (e) {
        testP3AManifestContent = null;
      }
    }

    const p3APersistedDetails = testP3AManifestContent?.failureDetails || testP3AManifestContent?.summary?.failureDetails || [];
    const p3AMatchedDetail = Array.isArray(p3APersistedDetails)
      ? p3APersistedDetails.find((d: any) => d.testId === 'P2-13-DEFECT-01')
      : null;

    assert(
      'Problem 3 — Test P3-A: P2-13 Raw Diagnostics in Manifest Failure Collections',
      'Raw P2-13 failure diagnostic is persisted in manifest with original testId, description, and error message',
      Boolean(p3AMatchedDetail) &&
      p3AMatchedDetail?.testId === 'P2-13-DEFECT-01' &&
      p3AMatchedDetail?.description === 'Missing contactTime parameter is rejected by empirical data importer' &&
      p3AMatchedDetail?.message === 'Expected: MISSING_REQUIRED_FIELD, Actual: null',
      p3AMatchedDetail,
      {
        testId: 'P2-13-DEFECT-01',
        description: 'Missing contactTime parameter is rejected by empirical data importer',
        message: 'Expected: MISSING_REQUIRED_FIELD, Actual: null'
      }
    );

    assert(
      'Problem 3 — Test P3-A: Manifest isCleanPass False on P2-13 Failure',
      'Manifest records isCleanPass === false and p2Phase13Failures === 1',
      testP3AManifestContent?.summary?.isCleanPass === false &&
      testP3AManifestContent?.summary?.p2Phase13Failures === 1,
      {
        isCleanPass: testP3AManifestContent?.summary?.isCleanPass,
        p2Phase13Failures: testP3AManifestContent?.summary?.p2Phase13Failures
      },
      { isCleanPass: false, p2Phase13Failures: 1 }
    );

    // Test P3-B: Dual Failure Aggregation (Test Integrity + P2-13 Diagnostics neither overwrites the other)
    const testP3BManifestPath = path.join(tempBaseDir, 'test-p3b-manifest.json');
    let testP3BExitCode: number | null = null;

    const resP3B = finalizeMasterTestRun({
      executionMap: p3AExecutionMap,
      discoveredCount: 1,
      testIntegritySummary: {
        failed: 1,
        results: [
          {
            testId: 'INTEG-FAIL-404',
            group: 'Discovery Check',
            name: 'Missing File Check',
            passed: false,
            message: '1 orphan file found'
          }
        ]
      },
      p2Phase13Summary: {
        passed: 11,
        failed: 1,
        total: 12,
        results: [
          {
            testId: 'P2-13-DEFECT-02',
            description: 'Outside-domain prediction cannot become LAB_VALIDATED',
            passed: false,
            message: 'Expected: REJECTED, Actual: LAB_VALIDATED'
          }
        ]
      },
      manifestPath: testP3BManifestPath,
      exitStrategy: (code: number) => {
        testP3BExitCode = code;
      },
      silent: true
    });

    const testP3BManifest = JSON.parse(fs.readFileSync(testP3BManifestPath, 'utf8'));
    const combinedP3BDetails = testP3BManifest.failureDetails || [];
    const hasIntegFail = combinedP3BDetails.some((d: any) => d.testId === 'INTEG-FAIL-404');
    const hasP213Fail = combinedP3BDetails.some((d: any) => d.testId === 'P2-13-DEFECT-02');

    assert(
      'Problem 3 — Test P3-B: Dual Failure Aggregation Preservation',
      'Both test-integrity and P2-13 raw failure diagnostics are preserved together without overwriting',
      testP3BExitCode === 1 &&
      resP3B.masterHealth.isCleanPass === false &&
      hasIntegFail &&
      hasP213Fail &&
      testP3BManifest.summary.testIntegrityFailureDetails?.some((d: any) => d.testId === 'INTEG-FAIL-404') &&
      testP3BManifest.summary.p2Phase13FailureDetails?.some((d: any) => d.testId === 'P2-13-DEFECT-02'),
      { hasIntegFail, hasP213Fail, exitCode: testP3BExitCode },
      { hasIntegFail: true, hasP213Fail: true, exitCode: 1 }
    );

    // Test P3-C: P2-13 Clean Pass — No Phantom or Fabricated Failure Diagnostics
    const testP3CManifestPath = path.join(tempBaseDir, 'test-p3c-manifest.json');
    let testP3CExitCode: number | null = null;

    const resP3C = finalizeMasterTestRun({
      executionMap: cleanMapForTestA,
      discoveredCount: 2,
      testIntegritySummary: { failed: 0, results: [] },
      p2Phase13Summary: {
        passed: 12,
        failed: 0,
        total: 12,
        results: [
          {
            testId: 'P2-13-PASS-01',
            description: 'Deterministic fingerprint verification',
            passed: true,
            message: 'PASSED'
          }
        ]
      },
      manifestPath: testP3CManifestPath,
      exitStrategy: (code: number) => {
        testP3CExitCode = code;
      },
      silent: true
    });

    const testP3CManifest = JSON.parse(fs.readFileSync(testP3CManifestPath, 'utf8'));
    const p3CFailures = testP3CManifest.failureDetails || [];
    const p3CP213Failures = testP3CManifest.summary?.p2Phase13FailureDetails || [];

    assert(
      'Problem 3 — Test P3-C: P2-13 Clean Pass Leaves No Phantom Diagnostics',
      'Clean P2-13 run has zero failure diagnostics, exit code 0, and isCleanPass === true',
      testP3CExitCode === 0 &&
      resP3C.masterHealth.isCleanPass === true &&
      p3CFailures.length === 0 &&
      p3CP213Failures.length === 0 &&
      testP3CManifest.summary.p2Phase13Failures === 0,
      { exitCode: testP3CExitCode, isCleanPass: resP3C.masterHealth.isCleanPass, failuresCount: p3CFailures.length },
      { exitCode: 0, isCleanPass: true, failuresCount: 0 }
    );

  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempBaseDir)) {
        fs.rmSync(tempBaseDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore cleanup errors
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`\nMaster Finalizer Integration Suite: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)\n`);

  return {
    passed: passedCount,
    failed: failedCount,
    total: results.length,
    results
  };
}

// Standalone execution support
if (typeof process !== 'undefined' && process.argv && process.argv.length > 1) {
  const isDirect = process.argv.some(arg => arg.includes('masterFinalizer.integration.test'));
  if (isDirect) {
    const summary = runMasterFinalizerIntegrationTestSuite();
    process.exit(summary.failed > 0 ? 1 : 0);
  }
}
