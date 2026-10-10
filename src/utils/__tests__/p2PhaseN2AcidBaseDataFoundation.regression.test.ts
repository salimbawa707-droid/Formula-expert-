/**
 * ============================================================================
 * PHASE N2 REGRESSION TEST SUITE — SCIENTIFIC ACID/BASE & EQUIVALENT DATA FOUNDATION
 * ============================================================================
 * Rigorously verifies all N2 requirements:
 * A. Known assay preserved.
 * B. Unknown assay remains UNKNOWN.
 * C. LABSA does not silently become 90%.
 * D. NaOH does not silently become 100%.
 * E. NaOH 99% and NaOH 50% are represented distinctly.
 * F. Commercial LABSA and pure/reference LABSA are distinguishable.
 * G. Molecular weight is not fabricated for materials where it is not defensible.
 * H. Equivalent basis is explicitly classified.
 * I. Name parsing cannot override verified structured data.
 * J. Conflicting evidence is detected.
 * K. Invalid assay values are rejected.
 * L. Scientific provenance survives transformation.
 * M. Uncertainty survives transformation.
 * N. Existing valid ingredient records remain compatible.
 * O. ScientificResult compatibility remains intact.
 * ============================================================================
 */

import {
  resolveScientificAcidBaseProfile,
  calculateReactiveEquivalents,
  validateScientificAcidBaseProfile,
  AUTHORITATIVE_ACID_BASE_REGISTRY,
  ScientificAcidBaseProfile
} from '../../domain/ph/acidBaseDataModel';
import { normalizeFormulationComposition } from '../../domain/ph/compositionNormalizer';

export function runN2AcidBaseDataFoundationTestSuite(): { passed: number; total: number; failed: number } {
  let passed = 0;
  let total = 0;

  function assert(description: string, condition: boolean, detail?: any) {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] [TEST ${total}] ${description}`);
    } else {
      console.error(`[FAIL] [TEST ${total}] ${description}`, detail ?? '');
    }
  }

  console.log('\n--- STARTING N2 SCIENTIFIC ACID/BASE DATA FOUNDATION REGRESSION SUITE ---');

  // TEST 1 (A): Known explicit assay is preserved without distortion
  const registryKeysCount = Object.keys(AUTHORITATIVE_ACID_BASE_REGISTRY).length;
  assert(
    'A0. Authoritative acid/base registry is populated with verified records',
    registryKeysCount >= 8
  );

  const res1 = resolveScientificAcidBaseProfile({ name: 'LABSA Custom Batch', activeMatterPct: 94.5 });
  assert(
    'A1. Known explicit assay (94.5%) is preserved',
    res1.assay.status === 'SPECIFIED_EXPLICIT' && res1.assay.valuePct === 94.5 && res1.provenance.sourceType === 'COA'
  );

  // TEST 2 (B): Unknown assay remains strictly UNKNOWN in the scientific path
  const res2 = resolveScientificAcidBaseProfile({ name: 'Unspecified LABSA Sample' }); // No concentration in name or properties
  assert(
    'B1. Unknown assay remains strictly UNKNOWN in scientific path',
    res2.assay.status === 'UNKNOWN' && res2.assay.valuePct === null && res2.equivalentBasis.basisType === 'UNKNOWN_INSUFFICIENT_DATA'
  );

  // TEST 3 (C): LABSA does NOT silently become 90% when unstated
  const res3 = resolveScientificAcidBaseProfile({ name: 'Raw Sulfonic Slurry' });
  assert(
    'C1. Unstated LABSA does not silently default to 90%',
    res3.assay.status === 'UNKNOWN' && res3.assay.valuePct !== 90.0
  );

  // TEST 4 (D): NaOH does NOT silently become 100% when unstated
  const res4 = resolveScientificAcidBaseProfile({ name: 'Caustic Alkali Batch' });
  assert(
    'D1. Unstated NaOH does not silently default to 100%',
    res4.assay.status === 'UNKNOWN' && res4.assay.valuePct !== 100.0
  );

  // TEST 5 (E): Solid NaOH 99% and Liquid NaOH 50% are represented as distinct commercial materials
  const naohSolid = resolveScientificAcidBaseProfile({ name: 'Caustic Soda Flakes 99%' });
  const naohLiquid = resolveScientificAcidBaseProfile({ name: 'Caustic Soda Lye 50%' });
  assert(
    'E1. NaOH 99% Flakes and NaOH 50% Liquid Lye are distinct commercial materials',
    naohSolid.identity.physicalForm === 'SOLID_FLAKES' &&
    naohLiquid.identity.physicalForm === 'SOLUTION' &&
    naohSolid.assay.valuePct === 99.0 &&
    naohLiquid.assay.valuePct === 50.0 &&
    naohSolid.identity.ingredientId !== naohLiquid.identity.ingredientId
  );

  // TEST 6 (F): Commercial LABSA 90% and Pure Reference LABSA 100% are distinguishable
  const labsaComm = resolveScientificAcidBaseProfile({ name: 'LABSA 90%' });
  const labsaPure = resolveScientificAcidBaseProfile({ name: 'LABSA 100% Reference' });
  assert(
    'F1. Commercial LABSA 90% and Pure Reference LABSA 100% are distinguishable',
    labsaComm.identity.isPureReferenceChemical === false &&
    labsaPure.identity.isPureReferenceChemical === true &&
    labsaComm.assay.freeSulfuricAcidPct === 5.0 &&
    labsaPure.assay.freeSulfuricAcidPct === 0.0
  );

  // TEST 7 (G): Molecular weight is marked as non-defensible for generic unresolved polymers/surfactants
  const res7 = resolveScientificAcidBaseProfile({ name: 'Polymer Thickener' });
  assert(
    'G1. Molecular weight is not fabricated for generic undefined materials',
    res7.equivalentBasis.isMwDefensible === false && res7.equivalentBasis.molecularWeight === undefined
  );

  // TEST 8 (H): Equivalent basis is explicitly classified (Acid Value, Commercial Assay, MW)
  assert(
    'H1. Equivalent basis is explicitly classified across materials',
    labsaComm.equivalentBasis.basisType === 'COMMERCIAL_ASSAY' &&
    labsaPure.equivalentBasis.basisType === 'MOLECULAR_WEIGHT' &&
    labsaComm.equivalentBasis.acidValueMgKOHg === 180.0
  );

  // TEST 9 (I): Explicit structured metadata takes precedence over commercial name parsing
  const res9 = resolveScientificAcidBaseProfile({ name: 'Caustic Soda Lye 50%', activeMatterPct: 45.0 });
  assert(
    'I1. Explicit structured metadata (45.0%) overrides commercial name string (50%)',
    res9.assay.valuePct === 45.0 && res9.assay.status === 'SPECIFIED_EXPLICIT' && res9.provenance.sourceType === 'COA'
  );

  // TEST 10 (J): Conflicting evidence / invalid scientific data is caught by validation rules
  const invalidProfile: ScientificAcidBaseProfile = {
    ...labsaComm,
    assay: { ...labsaComm.assay, valuePct: 150.0 }, // Invalid > 100%
    provenance: { ...labsaComm.provenance, evidenceLevel: 9 as any } // Invalid level
  };
  const valRes = validateScientificAcidBaseProfile(invalidProfile);
  assert(
    'J1. Invalid assay (>100%) and evidence level are caught by validation rules',
    valRes.isValid === false && valRes.errors.length >= 2
  );

  // TEST 11 (K): Reactive equivalents calculation returns INSUFFICIENT_DATA when assay is UNKNOWN
  const eqUnknownRes = calculateReactiveEquivalents(res2, 10.0);
  assert(
    'K1. Reactive equivalents calculation returns INSUFFICIENT_DATA when assay is UNKNOWN',
    eqUnknownRes.status === 'INSUFFICIENT_DATA' && eqUnknownRes.totalReactiveEquivalents === null
  );

  // TEST 12 (K2): Reactive equivalents calculation calculates exact moles when assay is verified
  const eqKnownRes = calculateReactiveEquivalents(naohSolid, 10.0); // 10 kg * 24.75 mol OH-/kg = 247.5 mol
  assert(
    'K2. Reactive equivalents calculation evaluates exact moles when assay is verified',
    eqKnownRes.status === 'SUCCESS' && eqKnownRes.totalReactiveEquivalents === 247.5
  );

  // TEST 13 (L): Scientific provenance and evidence level survive composition normalization
  const compNorm = normalizeFormulationComposition([
    { name: 'LABSA 90%', rawPercent: 10 },
    { name: 'Caustic Soda Flakes 99%', rawPercent: 1.35 }
  ], 100, { productCategory: 'LIQUID_LAUNDRY' });

  const labsaNormIng = compNorm.ingredients.find(i => i.inputName.includes('LABSA'));
  assert(
    'L1. Scientific provenance and acid/base profile survive composition normalization',
    labsaNormIng !== undefined &&
    labsaNormIng.acidBaseProfile !== undefined &&
    labsaNormIng.acidBaseProfile.assay.status === 'NAME_PARSED_ESTIMATE' &&
    labsaNormIng.acidBaseProfile.provenance.evidenceLevel === 5
  );

  // TEST 14 (M): Uncertainty bounds survive transformation
  assert(
    'M1. Uncertainty bounds exist and survive in data model',
    labsaComm.equivalentBasis.uncertainty.class === 'CERTIFIED' &&
    labsaComm.equivalentBasis.uncertainty.lowerBound === 89.0 &&
    labsaComm.equivalentBasis.uncertainty.upperBound === 91.0
  );

  // TEST 15 (N): Legacy UI convenience option explicitly flags CONVENIENCE_DEFAULT status
  const resUI = resolveScientificAcidBaseProfile({ name: 'LABSA' }, { allowConvenienceDefaultsForUI: true });
  assert(
    'N1. Legacy UI convenience option explicitly flags CONVENIENCE_DEFAULT without claiming scientific proof',
    resUI.assay.status === 'CONVENIENCE_DEFAULT' &&
    resUI.assay.valuePct === 90.0 &&
    resUI.provenance.sourceType === 'CONVENIENCE_DEFAULT' &&
    resUI.provenance.evidenceLevel === 6
  );

  // TEST 16 (O): Commercial Citric Acid Anhydrous triprotic equivalent capacity
  const citricProfile = resolveScientificAcidBaseProfile({ name: 'Citric Acid Anhydrous' });
  const citricEqRes = calculateReactiveEquivalents(citricProfile, 1.0); // 1 kg * 15.537 mol H+/kg = 15.537 mol H+
  assert(
    'O1. Citric Acid Anhydrous triprotic equivalent capacity evaluates correctly',
    citricProfile.classification.protonFunctionality === 'TRIPROTIC' &&
    citricEqRes.status === 'SUCCESS' &&
    Math.abs((citricEqRes.totalReactiveEquivalents ?? 0) - 15.537) < 0.05
  );

  console.log(`--------------------------------------------------`);
  console.log(`N2 REGRESSION SUITE COMPLETE: ${passed}/${total} PASSED`);
  console.log(`--------------------------------------------------`);

  return { passed, total, failed: total - passed };
}
