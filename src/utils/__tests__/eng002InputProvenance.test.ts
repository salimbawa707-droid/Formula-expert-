import {
  calculateMixedCMC,
  getIngredientCmcData,
  idealMixedCmcFromMoleFractions
} from '../calculators';
import { buildEng002CatalogEligibilityReport, validateEng002PureComponentReference } from '../eng002InputProvenance';

type Result = { name: string; passed: boolean; actual?: unknown; expected?: unknown };
export function runEng002InputProvenanceTestSuite(): { total: number; passed: number; failed: number; results: Result[] } {
  const results: Result[] = [];
  const assert = (name: string, passed: boolean, actual?: unknown, expected?: unknown) =>
    results.push({ name, passed, actual, expected });
  const throws = (fn: () => unknown): boolean => {
    try { fn(); return false; } catch { return true; }
  };
  const sds = (overrides: Record<string, unknown> = {}) => ({
    id: 'row-sls',
    canonicalIngredientId: 'sls-needles',
    name: 'SLS 95% Needles (Sodium Lauryl Sulfate)',
    category: 'Anionic Surfactant',
    casNumber: '151-21-3',
    percentage: 10,
    activeMatterPct: 95,
    activeMatterInputSource: 'CATALOG_DEFAULT' as const,
    ...overrides
  });

  const missingMw = validateEng002PureComponentReference({cmcMolar: 0.0082, cmcUnit: 'M'});
  const missingCmc = validateEng002PureComponentReference({molecularWeightGPerMol: 288.3, cmcUnit: 'M'});
  assert('Missing molecular weight is a distinct unsupported reference condition', missingMw.includes('MISSING_OR_INVALID_MOLECULAR_WEIGHT'), missingMw, 'MISSING_OR_INVALID_MOLECULAR_WEIGHT');
  assert('Missing pure-component CMC is a distinct unsupported reference condition', missingCmc.includes('MISSING_OR_INVALID_PURE_COMPONENT_CMC'), missingCmc, 'MISSING_OR_INVALID_PURE_COMPONENT_CMC');

  const source = getIngredientCmcData('Sodium dodecyl sulfate');
  assert('SDS pure CMC is tagged source-backed', source?.dataProvenance === 'SOURCE_BACKED', source?.dataProvenance, 'SOURCE_BACKED');
  const legacy = getIngredientCmcData('SLES 70%');
  assert('Legacy SLES mapping is tagged heuristic screening', legacy?.dataProvenance === 'HEURISTIC_SCREENING', legacy?.dataProvenance, 'HEURISTIC_SCREENING');

  const catalogReport = buildEng002CatalogEligibilityReport();
  assert('Every canonical surfactant catalog record is dispositioned', catalogReport.records.length === catalogReport.catalogRecordCount && catalogReport.catalogRecordCount === 162, catalogReport.catalogRecordCount, 162);
  assert('Only the eight exact SLS/SDS commercial records are conditionally partial', catalogReport.counts.PARTIALLY_SUPPORTED === 8, catalogReport.counts.PARTIALLY_SUPPORTED, 8);
  assert('No catalog record is fully supported without a lot-specific active assay', catalogReport.counts.FULLY_SUPPORTED === 0, catalogReport.counts.FULLY_SUPPORTED, 0);
  assert('All other catalog surfactants are blocked pending exact pure-CMC/MW evidence', catalogReport.counts.INSUFFICIENT_INPUTS === 154, catalogReport.counts.INSUFFICIENT_INPUTS, 154);

  const solution = calculateMixedCMC(sds({
    canonicalIngredientId: 'sls-30',
    name: 'SLS 30% Liquid',
    activeMatterPct: 30,
    activeMatterInputSource: 'SOURCE_BACKED',
    activeMatterEvidenceId: 'TEST_FIXTURE_ONLY_COA_REFERENCE',
    activeMatterEvidenceUrl: 'TEST_FIXTURE_ONLY_SOURCE_LOCATION'
  }) as any);
  assert('A synthetic source-linked solution fixture exercises the fully supported input status', solution.available && solution.eligibilityStatus === 'FULLY_SUPPORTED', solution.available ? solution.eligibilityStatus : solution.eligibilityReasons, 'FULLY_SUPPORTED');
  assert('10% raw solution at 30% active yields 3% active surfactant', solution.available && Math.abs(solution.components[0].activeMassPct - 3) < 1e-12, solution.available ? solution.components[0].activeMassPct : undefined, 3);
  assert('Single-component SDS CMC is 8.2 mM and converts to 2364.06 mg/L using 288.3 g/mol', solution.available && Math.abs(solution.molar - 8.2) < 1e-9 && Math.abs(solution.ppm - 2364.06) < 1e-6, solution.available ? {mM: solution.molar, mgL: solution.ppm} : solution.eligibilityReasons, {mM: 8.2, mgL: 2364.06});

  const partial = calculateMixedCMC(sds({activeMatterInputSource: 'USER_ENTERED'}) as any);
  assert('User-entered active matter remains explicitly partial', partial.available && partial.eligibilityStatus === 'PARTIALLY_SUPPORTED', partial.available ? partial.eligibilityStatus : partial.eligibilityReasons, 'PARTIALLY_SUPPORTED');

  const missingActive = calculateMixedCMC(sds({activeMatterPct: undefined, activeMatterInputSource: 'UNKNOWN'}) as any);
  assert('Missing active matter does not fall back to the catalog default', !missingActive.available && missingActive.eligibilityReasons.some(x => x.includes('active matter is missing')), missingActive.available ? 'available' : missingActive.eligibilityReasons, 'explicit missing-input reason');
  const explicitZero = calculateMixedCMC(sds({activeMatterPct: 0, activeMatterInputSource: 'USER_ENTERED'}) as any);
  assert('Explicit zero active matter is distinct from missing input', !explicitZero.available && explicitZero.eligibilityReasons.some(x => x.includes('explicitly entered as 0%')), explicitZero.available ? 'available' : explicitZero.eligibilityReasons, 'explicit zero reason');
  const invalidDose = calculateMixedCMC(sds({percentage: -1}) as any);
  assert('Negative as-supplied dose is rejected', !invalidDose.available && invalidDose.eligibilityReasons.some(x => x.includes('invalid formula mass percentage')), invalidDose.available ? 'available' : invalidDose.eligibilityReasons, 'invalid dose reason');
  const invalidActive = calculateMixedCMC(sds({activeMatterPct: 101}) as any);
  assert('Active matter above 100% is rejected', !invalidActive.available && invalidActive.eligibilityReasons.some(x => x.includes('active matter') && x.includes('invalid')), invalidActive.available ? 'available' : invalidActive.eligibilityReasons, 'invalid active matter reason');

  const mixed = calculateMixedCMC([
    sds({percentage: 1, activeMatterPct: 100, activeMatterInputSource: 'USER_ENTERED'}),
    {
      id: 'row-ddao',
      name: 'Dimethyldodecylamine oxide',
      category: 'Amphoteric Surfactant',
      casNumber: '1643-20-5',
      identityType: 'SINGLE_SUBSTANCE',
      percentage: 1,
      activeMatterPct: 100,
      activeMatterInputSource: 'USER_ENTERED'
    } as any
  ]);
  const nSds = 1 / 288.3;
  const nDdao = 1 / 229.4;
  const expectedSdsX = nSds / (nSds + nDdao);
  const expectedMixedMmolL = 1 / (expectedSdsX / 8.2 + (1 - expectedSdsX) / 2.1);
  assert('Equal active masses are converted to independently computed species mole fractions', mixed.available && Math.abs(mixed.components.find(x => x.canonicalChemicalKey === 'SDS')!.moleFraction - expectedSdsX) < 1e-9, mixed.available ? mixed.components : mixed.eligibilityReasons, expectedSdsX);
  assert('Mixed pure-component Clint result uses the hand-calculated molar composition', mixed.available && Math.abs(mixed.molar - expectedMixedMmolL) < 1e-9, mixed.available ? mixed.molar : mixed.eligibilityReasons, expectedMixedMmolL);
  assert('The mixed prediction remains a model prediction with limitations', mixed.available && mixed.classification === 'Theoretical Ideal Baseline' && mixed.eligibilityStatus === 'PARTIALLY_SUPPORTED', mixed.available ? [mixed.classification, mixed.eligibilityStatus] : mixed.eligibilityReasons, ['Theoretical Ideal Baseline', 'PARTIALLY_SUPPORTED']);

  const unsupportedMix = calculateMixedCMC([
    sds(),
    { id: 'capb-row', name: 'CAPB 30% (Cocamidopropyl Betaine)', category: 'Amphoteric Surfactant', percentage: 2, activeMatterPct: 30 } as any
  ]);
  assert('Unsupported surfactant blocks the whole mixture instead of being silently omitted', !unsupportedMix.available && unsupportedMix.components.length === 0, unsupportedMix.available ? unsupportedMix.components : unsupportedMix.eligibilityReasons, 'unavailable with no components');

  const duplicate = calculateMixedCMC([
    sds({id: 'row-1', percentage: 5, activeMatterPct: 100}),
    { id: 'row-2', name: 'Sodium dodecyl sulfate', category: 'Anionic Surfactant', casNumber: '151-21-3', identityType: 'SINGLE_SUBSTANCE', percentage: 5, activeMatterPct: 100 } as any
  ]);
  assert('Duplicate records and exact chemical aliases aggregate as one component', duplicate.available && duplicate.components.length === 1 && duplicate.components[0].moleFraction === 1, duplicate.available ? duplicate.components : duplicate.eligibilityReasons, 'one SDS component at x=1');

  const wrongCas = calculateMixedCMC(sds({casNumber: '151-21-4'}) as any);
  assert('Conflicting catalog CAS is blocked', !wrongCas.available && wrongCas.eligibilityReasons.some(x => x.includes('conflicting CAS')), wrongCas.available ? 'available' : wrongCas.eligibilityReasons, 'identity conflict');
  const nameOnly = calculateMixedCMC({name: 'Sodium Lauryl Sulfate', category: 'Anionic Surfactant', percentage: 5, activeMatterPct: 100} as any);
  assert('Name-only aliases cannot establish exact species identity', !nameOnly.available && nameOnly.eligibilityReasons.some(x => x.includes('Exact chemical identity')), nameOnly.available ? 'available' : nameOnly.eligibilityReasons, 'identity gate');
  const noCmcMw = calculateMixedCMC({name: 'Unknown surfactant', category: 'Anionic Surfactant', casNumber: '99999-99-9', identityType: 'SINGLE_SUBSTANCE', percentage: 5, activeMatterPct: 100} as any);
  assert('Missing source CMC and molecular weight return an explicit unsupported result', !noCmcMw.available && noCmcMw.eligibilityReasons.some(x => x.includes('No curated pure-CMC and molecular-weight')), noCmcMw.available ? 'available' : noCmcMw.eligibilityReasons, 'no source reference');

  const noSurfactant = calculateMixedCMC([{name: 'Deionized Water', category: 'Solvent / Carrier', percentage: 100, activeMatterPct: 0} as any]);
  assert('A formula with no supported surfactant reports insufficient inputs', !noSurfactant.available && noSurfactant.eligibilityStatus === 'INSUFFICIENT_INPUTS', noSurfactant, 'INSUFFICIENT_INPUTS');

  const mixedUnits = idealMixedCmcFromMoleFractions([
    { moleFraction: 0.5, cmc: 1, cmcUnit: 'mM' },
    { moleFraction: 0.5, cmc: 0.004, cmcUnit: 'M' }
  ]);
  assert('Mixed M and mM inputs normalize to 1.6 mM by hand calculation', Math.abs(mixedUnits - 1.6) < 1e-12, mixedUnits, 1.6);
  const withinTolerance = idealMixedCmcFromMoleFractions([
    { moleFraction: 0.5005, cmc: 1 }, { moleFraction: 0.5005, cmc: 4 }
  ]);
  assert('Fraction sums within 0.00101 tolerance are normalized', Math.abs(withinTolerance - 1.6) < 1e-12, withinTolerance, 1.6);
  assert('Fraction sums outside 0.00101 tolerance are rejected', throws(() => idealMixedCmcFromMoleFractions([
    { moleFraction: 0.501, cmc: 1 }, { moleFraction: 0.501, cmc: 4 }
  ])), 'throws', 'sum 1.002 rejected');
  assert('Missing, non-finite, and non-positive CMC values are rejected', throws(() => idealMixedCmcFromMoleFractions([{moleFraction: 1, cmc: 0}])) && throws(() => idealMixedCmcFromMoleFractions([{moleFraction: 1, cmc: Number.NaN}])), 'throws', 'CMC > 0 and finite');
  assert('Non-finite or negative mole fractions are rejected', throws(() => idealMixedCmcFromMoleFractions([{moleFraction: -0.1, cmc: 1}, {moleFraction: 1.1, cmc: 4}])), 'throws', 'mole fraction in [0,1]');
  assert('All equation inputs must use supported units', throws(() => idealMixedCmcFromMoleFractions([{moleFraction: 1, cmc: 1, cmcUnit: 'ppm' as any}])), 'throws', 'M or mM only');

  const failed = results.filter(result => !result.passed);
  return { total: results.length, passed: results.length - failed.length, failed: failed.length, results };
}
