/**
 * OPEN-REFERENCE EMPIRICAL BENCHMARK — REGRESSION SUITE
 *
 * Locks the agreement between the app's engines and openly licensed published
 * measurements (IUPAC 2002 pH standards, PSDI/NIST CMC records, Sandia P2SURF
 * binary-mixture CMC data). Component-level reference benchmark only: it does
 * not provide matched finished-formula lab evidence and never grants LAB_VALIDATED.
 */
import fs from 'fs';
import path from 'path';
import {
  OPEN_REFERENCE_FILES,
  OPEN_REFERENCE_ROOT,
  parseCsv,
  runMixedCmcBenchmark,
  runPhStandardsBenchmark,
  runPureCmcBenchmark,
  sha256File
} from '../openReferenceBenchmark';
import { OPEN_BENCHMARK_IDEAL_MIXING_BIAS } from '../../data/experimentalReferenceData';
import { calculateMixedCMC, getIngredientCmcData, idealMixedCmcFromMoleFractions } from '../calculators';

export interface OpenReferenceTestResult {
  name: string;
  passed: boolean;
  message?: string;
  actual?: any;
  expected?: any;
}

export function runOpenReferenceBenchmarkTestSuite(): { total: number; passed: number; failed: number; results: OpenReferenceTestResult[] } {
  const results: OpenReferenceTestResult[] = [];
  const assert = (name: string, condition: boolean, actual?: any, expected?: any) => {
    results.push({ name, passed: condition, message: condition ? 'PASSED' : `FAILED: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, actual, expected });
  };

  // --- Dataset integrity --------------------------------------------------
  const manifest = JSON.parse(fs.readFileSync(path.join(OPEN_REFERENCE_ROOT, 'data-manifest.json'), 'utf8'));
  for (const rel of Object.values(OPEN_REFERENCE_FILES)) {
    const entry = (manifest.datasets as any[]).find(d => d.path === rel);
    assert(`manifest lists ${rel}`, !!entry, !!entry, true);
    if (entry) assert(`sha256 matches manifest for ${rel}`, sha256File(rel) === entry.sha256, sha256File(rel), entry.sha256);
  }
  assert('SURFPRO (CC BY-NC-SA) is not used as an open benchmark source',
    !JSON.stringify(manifest.datasets).toLowerCase().includes('surfpro'), false, false);

  // --- pH vs IUPAC 2002 standards -----------------------------------------
  const ph = runPhStandardsBenchmark();
  assert('6 IUPAC standards at 25 C are engine-supported', ph.summary25C.n === 6, ph.summary25C.n, 6);
  for (const r of ph.results.filter(x => x.temperatureC === 25)) {
    assert(`Davies pH within ±0.05 of IUPAC ${r.standardId}`, Math.abs(r.daviesError) <= 0.05, r.daviesPH, r.referencePH);
    assert(`Davies is closer than ideal for ${r.standardId}`, Math.abs(r.daviesError) <= Math.abs(r.idealError), r.daviesError, r.idealError);
  }
  assert('Davies 25 C mean absolute error ≤ 0.02 pH', ph.summary25C.daviesMAE <= 0.02, ph.summary25C.daviesMAE, '≤0.02');
  assert('Ideal model shows the documented positive offset (>0.1 pH MAE) on buffer standards', ph.summary25C.idealMAE > 0.1, ph.summary25C.idealMAE, '>0.1');
  assert('Davies within ±0.2 pH of all supported standards at 10 and 40 C (pKa temperature dependence not modelled)',
    ph.results.every(r => Math.abs(r.daviesError) <= 0.2), ph.summaryAllTemperatures.daviesMaxAbsError, '≤0.2');

  // --- Pure CMC vs PSDI/NIST -----------------------------------------------
  const pure = runPureCmcBenchmark();
  const byKey = Object.fromEntries(pure.results.map(r => [r.appKey, r]));
  for (const key of ['SLS', 'LABSA', 'Amine Oxide', 'BKC']) {
    assert(`${key} CMC default within 2x of NIST homolog reference`, byKey[key]?.verdict === 'WITHIN_2X', byKey[key]?.logRatioAppOverReference, '|log ratio| ≤ 0.301');
  }
  assert('CAPB comparison is flagged as weak proxy, not passed as validated', byKey.CAPB?.verdict === 'NOT_COMPARABLE_WEAK_PROXY', byKey.CAPB?.verdict, 'NOT_COMPARABLE_WEAK_PROXY');
  const ddao = getIngredientCmcData('Lauramine Oxide');
  assert('Lauramine oxide carries NIST reference evidence', ddao?.referenceEvidence?.evidenceId === 'PSDI-CMC-C21-62005-27C', ddao?.referenceEvidence?.evidenceId, 'PSDI-CMC-C21-62005-27C');
  const cao = getIngredientCmcData('Cocamidopropylamine Oxide');
  assert('Cocamidopropylamine oxide is not silently mapped to the C12 DDAO reference', !cao?.referenceEvidence, cao?.referenceEvidence?.evidenceId, undefined);

  // --- Mixed CMC vs P2SURF ---------------------------------------------------
  const mixed = runMixedCmcBenchmark();
  assert('P2SURF benchmark has ≥300 evaluable intermediate points', mixed.evaluablePoints >= 300, mixed.evaluablePoints, '≥300');
  for (const cls of ['anionic-anionic', 'cationic-cationic', 'nonionic-nonionic']) {
    const c = mixed.byClass.find(x => x.pairClass === cls);
    assert(`Ideal Clint rule MAE ≤ 0.15 log for same-charge class ${cls}`, !!c && c.idealMAELog <= 0.15, c?.idealMAELog, '≤0.15');
  }
  const anCat = mixed.byClass.find(x => x.pairClass === 'anionic-cationic');
  assert('Anionic-cationic ideal rule overestimates measured CMC by >10x (strong synergy)', !!anCat && anCat.medianLogBias > 1, anCat?.medianLogBias, '>1');
  for (const c of mixed.byClass) {
    const constant = OPEN_BENCHMARK_IDEAL_MIXING_BIAS[c.pairClass];
    assert(`Bias constant for ${c.pairClass} matches recomputation from the dataset`,
      !!constant && Math.abs(constant.medianLogBias - c.medianLogBias) < 0.006 && constant.points === c.points && constant.systems === c.systems,
      c, constant);
  }

  // --- Task 4 paired P2SURF rows evaluated through the app's Clint helper -----
  const clintLedgerPath = path.join(OPEN_REFERENCE_ROOT, 'cmc_mixed', 'ideal_clint_pair_ledger.csv');
  const clintLedger = parseCsv(fs.readFileSync(clintLedgerPath, 'utf8'));
  const clintPairs = clintLedger.filter(r => r.decision === 'INCLUDED' && r.row_role === 'MIXTURE_OBSERVATION');
  assert('Task 4 ledger includes 347 eligible mixture observations and excludes endpoint inputs from scoring',
    clintPairs.length === 347 && clintLedger.filter(r => r.row_role === 'PURE_ENDPOINT_INPUT').length === 124,
    { mixtures: clintPairs.length, endpoints: clintLedger.filter(r => r.row_role === 'PURE_ENDPOINT_INPUT').length },
    { mixtures: 347, endpoints: 124 });
  for (const row of clintPairs) {
    const appPrediction = idealMixedCmcFromMoleFractions([
      { moleFraction: Number(row.normalized_x1), cmc: Number(row.pure_cmc_component_1_uM) },
      { moleFraction: Number(row.normalized_x2), cmc: Number(row.pure_cmc_component_2_uM) }
    ]);
    const ledgerPrediction = Number(row.prediction_cmc_uM);
    assert(`App Clint helper reproduces ${row.source_record_id} from its linked P2SURF endpoints`,
      Number.isFinite(appPrediction) && Math.abs(appPrediction - ledgerPrediction) <= Math.max(1e-8, ledgerPrediction * 1e-12),
      appPrediction, ledgerPrediction);
  }
  assert('Task 4 pair ledger preserves the source dataset row count and leaves incomplete endpoint systems excluded',
    clintLedger.length === 979 && clintLedger.filter(r => r.decision === 'EXCLUDED' && r.exclusion_reason.includes('MISSING_PURE_ENDPOINT')).length === 28,
    { rows: clintLedger.length, missingEndpointRows: clintLedger.filter(r => r.decision === 'EXCLUDED' && r.exclusion_reason.includes('MISSING_PURE_ENDPOINT')).length },
    { rows: 979, missingEndpointRows: 28 });

  // --- Mole-fraction behaviour of the app's mixed-CMC calculation ------------
  assert('idealMixedCmcFromMoleFractions returns the pure value for a single component',
    Math.abs(idealMixedCmcFromMoleFractions([{ moleFraction: 1, cmc: 8.2 }]) - 8.2) < 1e-9, idealMixedCmcFromMoleFractions([{ moleFraction: 1, cmc: 8.2 }]), 8.2);
  const equimolar = idealMixedCmcFromMoleFractions([{ moleFraction: 0.5, cmc: 1 }, { moleFraction: 0.5, cmc: 4 }]);
  assert('Equimolar Clint mix of 1 and 4 mM is 1.6 mM', Math.abs(equimolar - 1.6) < 1e-9, equimolar, 1.6);
  const mix = calculateMixedCMC([{
    id: 'formula-row-sls',
    canonicalIngredientId: 'sls-needles',
    name: 'SLS 95% Needles (Sodium Lauryl Sulfate)',
    category: 'Anionic Surfactant',
    casNumber: '151-21-3',
    percentage: 10,
    activeMatterPct: 100,
    activeMatterInputSource: 'USER_ENTERED'
  }]);
  const sls = mix.available ? mix.components.find(c => c.canonicalChemicalKey === 'SDS') : undefined;
  assert('Exact catalog SLS identity resolves to the source-backed pure-component CMC',
    mix.available && !!sls && sls.moleFraction === 1, mix.available ? sls : mix.eligibilityReasons, 'SDS component at x=1');
  assert('Name-only commercial amine oxide cannot silently inherit the pure C12 DDAO reference',
    !calculateMixedCMC([{
      id: 'formula-row-oxide',
      name: 'Lauramine Oxide',
      category: 'Nonionic Surfactant',
      casNumber: '1643-20-5',
      percentage: 10,
      activeMatterPct: 30
    }]).available, 'blocked', 'identity metadata required');

  const passed = results.filter(r => r.passed).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}
