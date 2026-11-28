/**
 * Phase 5B-2 — bounded primary-neutralization arithmetic.
 *
 * This module deliberately accepts already-derived total reactive-equivalent
 * intervals. It does not infer assay, equivalent capacity, or chemistry from
 * ingredient names. A chemistry adapter must establish those inputs and their
 * common batch basis before calling this module.
 *
 * Independent acid/base intervals are evaluated as coherent endpoint scenarios.
 * The returned envelope is a conservative arithmetic envelope, not a claim
 * that every endpoint combination is chemically attainable.
 */

export type IntervalEvidenceStatus = 'BOUNDED_INPUT' | 'INSUFFICIENT_DATA' | 'INVALID_INPUT';
export type NeutralizationScenarioStatus =
  | 'NO_REACTION'
  | 'UNDER_NEUTRALIZED'
  | 'FULLY_NEUTRALIZED'
  | 'BASE_EXCESS';

export interface ReactiveEquivalentIntervalInput {
  id: string;
  name: string;
  /** Total batch reactive equivalents, mol-equivalent. */
  lowerEq: number;
  nominalEq: number;
  upperEq: number;
  evidenceRef: string;
  basis: string;
}

export interface NeutralizationInterval {
  lower: number;
  nominal: number;
  upper: number;
}

export interface NeutralizationIntervalReport {
  status: IntervalEvidenceStatus;
  classification: NeutralizationScenarioStatus | 'AMBIGUOUS_REACTION_SYSTEM' | 'INSUFFICIENT_DATA';
  acidEquivalents: NeutralizationInterval | null;
  baseEquivalents: NeutralizationInterval | null;
  reactionExtent: NeutralizationInterval | null;
  residualAcidEquivalents: NeutralizationInterval | null;
  residualBaseEquivalents: NeutralizationInterval | null;
  neutralizationFraction: NeutralizationInterval | null;
  waterGeneratedGrams: NeutralizationInterval | null;
  scenarioClassifications: NeutralizationScenarioStatus[];
  inputEvidence: Array<{ id: string; evidenceRef: string; basis: string }>;
  missingInputs: string[];
  warnings: string[];
  releaseEligible: false;
}

const finiteNonNegative = (n: number): boolean => Number.isFinite(n) && n >= 0;
const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);
const round = (n: number): number => Number(n.toFixed(9));

function validateInputs(
  inputs: ReactiveEquivalentIntervalInput[],
  label: string,
  missing: string[],
  errors: string[]
): void {
  if (!Array.isArray(inputs)) {
    errors.push(label + ' inputs must be an array');
    return;
  }
  for (const item of inputs) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() ||
        typeof item.name !== 'string' || !item.name.trim()) {
      errors.push(label + ' input requires non-empty id and name');
      continue;
    }
    if (![item.lowerEq, item.nominalEq, item.upperEq].every(finiteNonNegative)) {
      errors.push(label + ' ' + item.name + ' has non-finite or negative equivalent values');
      continue;
    }
    if (!(item.lowerEq <= item.nominalEq && item.nominalEq <= item.upperEq)) {
      errors.push(label + ' ' + item.name + ' interval must satisfy lower <= nominal <= upper');
    }
    if (typeof item.evidenceRef !== 'string' || !item.evidenceRef.trim() ||
        typeof item.basis !== 'string' || !item.basis.trim()) {
      missing.push(label + ' ' + item.name + ' requires evidence reference and equivalent basis');
    }
  }
}

function classify(acid: number, base: number, epsilon: number): NeutralizationScenarioStatus {
  if (acid <= epsilon && base <= epsilon) return 'NO_REACTION';
  if (Math.abs(acid - base) <= epsilon) return 'FULLY_NEUTRALIZED';
  return base < acid ? 'UNDER_NEUTRALIZED' : 'BASE_EXCESS';
}

function intervalFrom(min: number, nominal: number, max: number): NeutralizationInterval {
  return { lower: round(min), nominal: round(nominal), upper: round(max) };
}

/**
 * Calculates the bounded arithmetic envelope for primary acid/base reaction.
 * Every supplied input must already be expressed as total batch equivalents
 * on the same basis. Unknown or unreferenced evidence fails closed.
 */
export function calculatePrimaryNeutralizationInterval(
  acids: ReactiveEquivalentIntervalInput[],
  bases: ReactiveEquivalentIntervalInput[],
  epsilon = 1e-9
): NeutralizationIntervalReport {
  const missingInputs: string[] = [];
  const errors: string[] = [];
  if (!finiteNonNegative(epsilon)) errors.push('epsilon must be finite and non-negative');
  validateInputs(acids, 'Acid', missingInputs, errors);
  validateInputs(bases, 'Base', missingInputs, errors);

  const all = [...(Array.isArray(acids) ? acids : []), ...(Array.isArray(bases) ? bases : [])];
  const basisSet = new Set(all.map(x => x?.basis).filter(Boolean));
  if (basisSet.size > 1) errors.push('All reactive-equivalent inputs must use the same equivalent basis');
  if (all.length === 0) missingInputs.push('At least one identified primary acid or base input');

  const fail = (status: 'INSUFFICIENT_DATA' | 'INVALID_INPUT'): NeutralizationIntervalReport => ({
    status,
    classification: 'INSUFFICIENT_DATA',
    acidEquivalents: null,
    baseEquivalents: null,
    reactionExtent: null,
    residualAcidEquivalents: null,
    residualBaseEquivalents: null,
    neutralizationFraction: null,
    waterGeneratedGrams: null,
    scenarioClassifications: [],
    inputEvidence: all.map(x => ({ id: x.id, evidenceRef: x.evidenceRef || '', basis: x.basis || '' })),
    missingInputs: [...missingInputs],
    warnings: [...errors],
    releaseEligible: false
  });

  if (errors.length) return fail('INVALID_INPUT');
  if (missingInputs.length) return fail('INSUFFICIENT_DATA');

  const acid = {
    lower: sum(acids.map(x => x.lowerEq)),
    nominal: sum(acids.map(x => x.nominalEq)),
    upper: sum(acids.map(x => x.upperEq))
  };
  const base = {
    lower: sum(bases.map(x => x.lowerEq)),
    nominal: sum(bases.map(x => x.nominalEq)),
    upper: sum(bases.map(x => x.upperEq))
  };

  // Reaction extent is min(acid, base). Residual envelopes use interval
  // subtraction with physical clipping, not nominal-only subtraction.
  const extent = {
    lower: Math.min(acid.lower, base.lower),
    nominal: Math.min(acid.nominal, base.nominal),
    upper: Math.min(acid.upper, base.upper)
  };
  const acidResidual = {
    lower: Math.max(0, acid.lower - base.upper),
    nominal: Math.max(0, acid.nominal - base.nominal),
    upper: Math.max(0, acid.upper - base.lower)
  };
  const baseResidual = {
    lower: Math.max(0, base.lower - acid.upper),
    nominal: Math.max(0, base.nominal - acid.nominal),
    upper: Math.max(0, base.upper - acid.lower)
  };

  const fraction = {
    lower: acid.upper <= epsilon ? 0 : Math.max(0, Math.min(1, base.lower / acid.upper)),
    nominal: acid.nominal <= epsilon ? 0 : Math.max(0, Math.min(1, base.nominal / acid.nominal)),
    upper: acid.lower <= epsilon
      ? (base.upper > epsilon ? 1 : 0)
      : Math.max(0, Math.min(1, base.upper / acid.lower))
  };

  // Scenario pairings: low acid with high base; nominal with nominal;
  // high acid with low base. These deliberately expose classification ambiguity.
  const scenarioClassifications = [
    classify(acid.lower, base.upper, epsilon),
    classify(acid.nominal, base.nominal, epsilon),
    classify(acid.upper, base.lower, epsilon)
  ];
  const uniqueClassifications = [...new Set(scenarioClassifications)];
  const classification = uniqueClassifications.length === 1
    ? uniqueClassifications[0]
    : 'AMBIGUOUS_REACTION_SYSTEM';

  return {
    status: 'BOUNDED_INPUT',
    classification,
    acidEquivalents: intervalFrom(acid.lower, acid.nominal, acid.upper),
    baseEquivalents: intervalFrom(base.lower, base.nominal, base.upper),
    reactionExtent: intervalFrom(extent.lower, extent.nominal, extent.upper),
    residualAcidEquivalents: intervalFrom(acidResidual.lower, acidResidual.nominal, acidResidual.upper),
    residualBaseEquivalents: intervalFrom(baseResidual.lower, base.nominal, baseResidual.upper),
    neutralizationFraction: intervalFrom(fraction.lower, fraction.nominal, fraction.upper),
    waterGeneratedGrams: intervalFrom(extent.lower * 18.01528, extent.nominal * 18.01528, extent.upper * 18.01528),
    scenarioClassifications,
    inputEvidence: all.map(x => ({ id: x.id, evidenceRef: x.evidenceRef, basis: x.basis })),
    missingInputs: [],
    warnings: [
      'Arithmetic interval only: upstream chemistry must prove each equivalent bound and common batch basis.',
      'Classification envelope uses three paired endpoint scenarios; it is not a proof of all-domain monotonicity.',
      'This report is not a pH prediction, laboratory result, or formula release approval.'
    ],
    releaseEligible: false
  };
}
