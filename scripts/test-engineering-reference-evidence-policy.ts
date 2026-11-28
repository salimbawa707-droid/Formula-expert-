import assert from 'node:assert/strict';
import type { EngineeringReferenceProfile } from '../src/data/universalIngredientLibrary';
import {
  ENGINEERING_REFERENCE_PROFILES,
  resolveEngineeringReferenceParameter,
  validateEngineeringReferenceProfile,
} from '../src/data/referenceEvidenceProfiles';

assert.equal(ENGINEERING_REFERENCE_PROFILES.length, 2);
for (const profile of ENGINEERING_REFERENCE_PROFILES) {
  const result = validateEngineeringReferenceProfile(profile);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.equal(profile.lotSpecific, false);
  assert.equal(profile.formulaApplicabilityApproved, false);
  assert.equal(profile.supplierIdentityVerified, false);
  assert.equal(profile.parameters.length, 0, 'identity-only evidence must not invent numeric grade properties');
  assert.equal(resolveEngineeringReferenceParameter(profile, 'activeMatterPct'), null);
}
const aos = ENGINEERING_REFERENCE_PROFILES.find((profile) => profile.profileId === 'ER-AOS-C14-16-001');
assert.deepEqual(aos?.ingredientIds, ['aos-38', 'aos-92']);
assert.ok(aos?.sourceReferences.some((source) => source.sourceId === 'STEPAN-BIOTERGE-AS40CGP'));
assert.ok(aos?.sourceReferences.every((source) => source.doesNotSupport.length > 0));

const estimated: EngineeringReferenceProfile = {
  profileId: 'TEST-ESTIMATE-001',
  profileVersion: '1.0.0',
  ingredientIds: ['test-grade'],
  scope: 'ENGINEERING_ESTIMATE',
  parameters: [{
    parameter: 'activeMatterPct',
    nominalValue: 38,
    lowerBound: 35,
    upperBound: 41,
    unit: '% w/w',
    basis: 'AS_SUPPLIED',
    evidenceClass: 'ENGINEERING_ESTIMATE',
    uncertaintyNote: 'Illustrative sensitivity interval only; not a supplier specification or measured assay.',
    useForPreliminaryCalculation: true,
    useForLotRelease: false,
  }],
  sourceReferences: [],
  limitations: ['Synthetic test fixture; not a real ingredient specification.'],
  supplierIdentityVerified: false,
  lotSpecific: false,
  formulaApplicabilityApproved: false,
};
assert.equal(validateEngineeringReferenceProfile(estimated).valid, true);
const resolved = resolveEngineeringReferenceParameter(estimated, 'activeMatterPct');
assert.equal(resolved?.nominalValue, 38);
assert.equal(resolved?.lowerBound, 35);
assert.equal(resolved?.upperBound, 41);
assert.equal(resolved?.preliminaryOnly, true);
assert.equal(resolved?.lotReleaseEligible, false);
assert.match(resolved?.warning ?? '', /Confirm the supplier grade and lot assay/);

const invalid: EngineeringReferenceProfile = {
  ...estimated,
  profileId: 'TEST-INVALID-002',
  parameters: [{
    ...estimated.parameters[0],
    lowerBound: 42,
    upperBound: 35,
    uncertaintyNote: '',
  }],
};
assert.equal(validateEngineeringReferenceProfile(invalid).valid, false);
assert.equal(resolveEngineeringReferenceParameter(invalid, 'activeMatterPct'), null);

console.log('ENGINEERING REFERENCE EVIDENCE POLICY PASS');
console.log(JSON.stringify({
  sourceBackedIdentityProfiles: ENGINEERING_REFERENCE_PROFILES.length,
  catalogVariantsLinked: 3,
  unsupportedNumericAssaysInvented: 0,
  lotReleaseApprovalsFromReferenceProfiles: 0,
  estimateSensitivityResolverTested: true,
}, null, 2));
