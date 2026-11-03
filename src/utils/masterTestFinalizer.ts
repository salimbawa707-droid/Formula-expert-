import fs from 'fs';
import path from 'path';
import { evaluateMasterTestHealth, TestExecutionRecord, MasterTestSummary } from './__tests__/testIntegrity.regression.test';

export interface IntegrityFailureDetail {
  testId?: string;
  id?: string;
  group: string;
  name: string;
  description?: string;
  passed?: boolean;
  message: string;
  actual?: any;
  expected?: any;
}

export interface MasterFinalizationParams {
  executionMap: TestExecutionRecord[];
  discoveredCount: number;
  testIntegritySummary?: {
    failed: number;
    results: IntegrityFailureDetail[];
    p2Phase13Summary?: any;
    p2Phase13FailureDetails?: IntegrityFailureDetail[];
  };
  p2Phase13Summary?: any;
  p2Phase13FailureDetails?: IntegrityFailureDetail[];
  manifestPath?: string;
  manifestWriter?: (filePath: string, content: string) => void;
  exitStrategy?: (code: number) => void;
  silent?: boolean;
}

export interface MasterManifestSummary extends MasterTestSummary {
  testIntegrityFailures: number;
  p2Phase13Failures?: number;
  failureDetails: IntegrityFailureDetail[];
  testIntegrityFailureDetails?: IntegrityFailureDetail[];
  p2Phase13FailureDetails?: IntegrityFailureDetail[];
}

export interface MasterExecutionManifest {
  timestamp: string;
  summary: MasterManifestSummary;
  failureDetails: IntegrityFailureDetail[];
  testIntegrityFailureDetails?: IntegrityFailureDetail[];
  p2Phase13FailureDetails?: IntegrityFailureDetail[];
  executionMap: TestExecutionRecord[];
}

export interface MasterFinalizationResult {
  manifestPath: string;
  manifestWritten: boolean;
  masterHealth: MasterTestSummary;
  exitCode: number;
  failureReport: {
    failedIntegrity: IntegrityFailureDetail[];
    failedP213: IntegrityFailureDetail[];
    failedModules: TestExecutionRecord[];
  };
  reportOutput: string[];
}

/**
 * Production master test runner finalization and reporting path.
 * 
 * Logical Execution Order:
 * 1. Collect actual execution and test-integrity results.
 * 2. Calculate final aggregate counts and truthful final clean-pass status:
 *    - "isCleanPass" is true ONLY when all required modules/assertions pass,
 *      no failed modules exist, AND testIntegritySummary.failed === 0.
 * 3. Include individual test-integrity failure details in the manifest.
 * 4. Persist the completed manifest to disk BEFORE exit decision.
 * 5. Log comprehensive diagnostic reports and enforce final process exit status.
 */
export function finalizeMasterTestRun(params: MasterFinalizationParams): MasterFinalizationResult {
  const {
    executionMap,
    discoveredCount,
    testIntegritySummary = { failed: 0, results: [] },
    manifestPath = path.join(process.cwd(), 'test_reports', 'execution-manifest.json'),
    exitStrategy = (code: number) => process.exit(code),
    silent = false
  } = params;

  const reportOutput: string[] = [];
  const log = (msg: string) => {
    reportOutput.push(msg);
    if (!silent) console.log(msg);
  };
  const errLog = (msg: string) => {
    reportOutput.push(msg);
    if (!silent) console.error(msg);
  };

  // Step 1: Base health calculation across execution records
  const baseHealth = evaluateMasterTestHealth(executionMap, discoveredCount);

  // Step 2: Extract real available test-integrity failure details
  const rawResults = testIntegritySummary?.results || [];
  const testIntegrityFailuresCount = testIntegritySummary?.failed ?? 0;

  const failedIntegrity: IntegrityFailureDetail[] = rawResults
    .filter((r: any) => r.passed === false || (r.passed === undefined && testIntegrityFailuresCount > 0))
    .map((r: any) => ({
      testId: r.testId || r.id || r.name,
      id: r.id || r.testId || r.name,
      group: r.group,
      name: r.name,
      description: r.description || r.name,
      message: r.message,
      actual: r.actual,
      expected: r.expected,
      passed: false
    }));

  const failedModules = executionMap.filter(m => m.failedAssertions > 0 || !m.executed || m.skipped);

  // Step 2b: Extract real available P2-13 raw failure diagnostics
  const rawP213Items: any[] = [];
  const addP213Sources = (source: any) => {
    if (!source) return;
    if (Array.isArray(source)) {
      rawP213Items.push(...source);
    } else if (Array.isArray(source.results)) {
      rawP213Items.push(...source.results);
    } else if (Array.isArray(source.failureDetails)) {
      rawP213Items.push(...source.failureDetails);
    }
  };

  addP213Sources(params.p2Phase13FailureDetails);
  addP213Sources(params.p2Phase13Summary);
  addP213Sources(testIntegritySummary?.p2Phase13FailureDetails);
  addP213Sources((testIntegritySummary as any)?.p2Phase13Summary);

  const failedP213: IntegrityFailureDetail[] = [];
  for (const r of rawP213Items) {
    if (r && (r.passed === false || (r.passed === undefined && r.message && !r.message.includes('PASSED')))) {
      const detail: IntegrityFailureDetail = {
        testId: r.testId || r.id || r.name || 'P2-13-UNKNOWN',
        id: r.id || r.testId || r.name || 'P2-13-UNKNOWN',
        group: r.group || 'P2-13 Final Integrity',
        name: r.name || r.description || r.testId || 'P2-13 Assertion Failure',
        description: r.description || r.name || r.testId,
        message: r.message || 'Assertion failed',
        actual: r.actual,
        expected: r.expected,
        passed: false
      };
      if (!failedP213.some(existing => existing.testId === detail.testId && existing.message === detail.message)) {
        failedP213.push(detail);
      }
    }
  }

  // Combine failure details without dropping or overwriting earlier failures
  const combinedFailureDetails: IntegrityFailureDetail[] = [...failedIntegrity];
  for (const p2Detail of failedP213) {
    if (!combinedFailureDetails.some(d => d.testId === p2Detail.testId && d.message === p2Detail.message)) {
      combinedFailureDetails.push(p2Detail);
    }
  }

  // Step 3 & 4: Preliminary check and manifest persistence attempt
  let manifestWritten = false;
  let persistenceError: string | null = null;
  const preliminaryCleanPass = baseHealth.isCleanPass && testIntegrityFailuresCount === 0 && failedP213.length === 0;

  const customManifestWriter = params.manifestWriter || ((p: string, c: string) => {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(p, c, 'utf8');
  });

  try {
    const tentativeManifestData: MasterExecutionManifest = {
      timestamp: new Date().toISOString(),
      summary: {
        ...baseHealth,
        isCleanPass: preliminaryCleanPass,
        testIntegrityFailures: testIntegrityFailuresCount,
        p2Phase13Failures: failedP213.length,
        failureDetails: combinedFailureDetails,
        testIntegrityFailureDetails: failedIntegrity,
        p2Phase13FailureDetails: failedP213
      },
      failureDetails: combinedFailureDetails,
      testIntegrityFailureDetails: failedIntegrity,
      p2Phase13FailureDetails: failedP213,
      executionMap
    };
    customManifestWriter(manifestPath, JSON.stringify(tentativeManifestData, null, 2));
    manifestWritten = true;
    log(`✓ Execution manifest written to ${manifestPath}`);
  } catch (e: any) {
    persistenceError = e?.message || String(e);
    errLog(`Failed to write execution manifest: ${persistenceError}`);
  }

  // Step 5: Finalize status based on successful persistence invariant
  const finalCleanPass = preliminaryCleanPass && manifestWritten;

  const persistenceFailureDetail: IntegrityFailureDetail | null = persistenceError ? {
    testId: 'MANIFEST-PERSISTENCE-FAILURE',
    group: 'Master Test Finalizer',
    name: 'Execution Manifest Disk Persistence',
    message: `Failed to write execution manifest to ${manifestPath}: ${persistenceError}`,
    passed: false
  } : null;

  const finalFailedIntegrity = persistenceFailureDetail 
    ? [...failedIntegrity, persistenceFailureDetail] 
    : failedIntegrity;


  const finalMasterHealth: MasterTestSummary = {
    ...baseHealth,
    isCleanPass: finalCleanPass
  };

  const hasFailed = !finalCleanPass;
  const exitCode = hasFailed ? 1 : 0;

  // Step 6: Log diagnostic reports
  if (testIntegrityFailuresCount > 0 || failedIntegrity.length > 0) {
    log('Failed Test Integrity assertions:');
    const itemsToLog = failedIntegrity.length > 0 ? failedIntegrity : rawResults;
    itemsToLog.forEach(r => {
      log(`  [FAIL] ${r.group} -> ${r.name}: ${r.message}`);
    });
  }

  if (failedP213.length > 0) {
    log('Failed P2-13 Raw Diagnostics:');
    failedP213.forEach(r => {
      log(`  [P2-13 FAIL] ${r.testId} -> ${r.name}: ${r.message}`);
    });
  }

  if (failedModules.length > 0) {
    log('Failed Test Modules:');
    failedModules.forEach(m => {
      log(`  [MODULE FAIL] ${m.file} (${m.moduleName}): ${m.failedAssertions} failed assertions`);
    });
  }

  log(`================================================================`);
  log(`MASTER TEST RUNNER REPORT:`);
  log(`  DISCOVERED MODULES:         ${finalMasterHealth.discoveredCount}`);
  log(`  REGISTERED MODULES:         ${finalMasterHealth.registeredCount}`);
  log(`  EXECUTED MODULES:           ${finalMasterHealth.executedCount}`);
  log(`  SKIPPED MODULES:            ${finalMasterHealth.skippedCount}`);
  log(`  FAILED MODULES:             ${finalMasterHealth.failedModulesCount}`);
  log(`  TEST INTEGRITY FAILURES:    ${testIntegrityFailuresCount}`);
  log(`  P2-13 FAILURES:             ${failedP213.length}`);
  log(`  TOTAL ASSERTIONS EXECUTED:  ${finalMasterHealth.totalAssertionsExecuted}`);
  log(`  TOTAL ASSERTIONS PASSED:    ${finalMasterHealth.totalAssertionsPassed}`);
  log(`  TOTAL ASSERTIONS FAILED:    ${finalMasterHealth.totalAssertionsFailed}`);
  log(`================================================================`);

  if (hasFailed) {
    errLog(`MASTER TEST STATUS: FAILED (${finalMasterHealth.failedModulesCount} failed modules, ${finalMasterHealth.skippedCount} skipped, ${finalMasterHealth.totalAssertionsFailed} failed assertions, ${testIntegrityFailuresCount} test integrity failures, ${failedP213.length} P2-13 failures)`);
  } else {
    log(`MASTER TEST STATUS: 100% PASSED (${finalMasterHealth.executedCount}/${finalMasterHealth.registeredCount} modules, ${finalMasterHealth.totalAssertionsPassed} assertions)`);
  }

  // Step 7: Enforce final process exit status
  exitStrategy(exitCode);

  return {
    manifestPath,
    manifestWritten,
    masterHealth: finalMasterHealth,
    exitCode,
    failureReport: {
      failedIntegrity: finalFailedIntegrity,
      failedP213,
      failedModules
    },
    reportOutput
  };
}

// Standalone CLI runner entrypoint for isolated child processes
if (typeof process !== 'undefined' && process.argv && process.argv.length > 1) {
  const isDirectRun = process.argv.some(arg => arg.includes('masterTestFinalizer'));
  if (isDirectRun) {
    const configIndex = process.argv.indexOf('--config');
    if (configIndex !== -1 && process.argv[configIndex + 1]) {
      const configPath = process.argv[configIndex + 1];
      const raw = fs.readFileSync(configPath, 'utf8');
      const params = JSON.parse(raw);
      finalizeMasterTestRun(params);
    }
  }
}
