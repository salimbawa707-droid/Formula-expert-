/**
 * Phase 5B-2 — strict profile-to-equivalent interval adapter.
 *
 * This adapter intentionally supports only pure, source-verified, strong,
 * monoprotic acids and mono-equivalent strong bases with explicit assay bounds
 * and defensible molecular weight. Commercial blends (including commercial
 * LABSA), weak/polyprotic systems, conditional builders and estimated assays
 * are withheld until their chemistry-specific capacity models are evidenced.
 */
import type { IngredientInput, FormulationIngredient } from '../../types';
import {
  resolveScientificAcidBaseProfile,
  type ScientificAcidBaseProfile
} from './acidBaseDataModel';
import {
  calculatePrimaryNeutralizationInterval,
  type ReactiveEquivalentIntervalInput,
  type NeutralizationIntervalReport
} from './neutralizationIntervalCalculations';

export interface NeutralizationProfileIntervalAdapterResult {
  status: 'READY_FOR_ARITHMETIC' | 'INSUFFICIENT_DATA' | 'INVALID_INPUT';
  report: NeutralizationIntervalReport | null;
  acidInputs: ReactiveEquivalentIntervalInput[];
  baseInputs: ReactiveEquivalentIntervalInput[];
  blockedIngredients: Array<{ name: string; reason: string }>;
  evidence: Array<{
    ingredientId: string;
    evidenceRef: string;
    sourceType: string;
    evidenceLevel: number;
    assayStatus: string;
  }>;
  warnings: string[];
  releaseEligible: false;
}

function resolveRawMassKg(
  ingredient: IngredientInput | FormulationIngredient,
  batchSizeKg: number
): number | null {
  const raw = ingredient as any;
  const direct = raw.rawKg ?? raw.weightKg;
  if (direct !== undefined && direct !== null) {
    const n = Number(direct);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const pct = raw.percentage ?? raw.percent ?? raw.percentageInFormula ?? raw.rawPercent;
  if (pct === undefined || pct === null || (typeof pct === 'string' && pct.trim() === '')) return null;
  const n = Number(pct);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return batchSizeKg * n / 100;
}

function isSupportedProfile(profile: ScientificAcidBaseProfile): string | null {
  if (!profile.validation.isValid) return 'Profile validation failed.';
  if (profile.identity.isPureReferenceChemical !== true) return 'Commercial/mixed material is not supported by this adapter.';
  if (profile.assay.status !== 'SOURCE_VERIFIED') return 'Assay is not source-verified.';
  if (profile.assay.sourceType === 'UNKNOWN' || !profile.provenance.source?.trim()) return 'Source provenance is missing.';
  if (profile.assay.valuePct === null || profile.assay.valuePct === undefined ||
      profile.assay.lowerBoundPct === null || profile.assay.lowerBoundPct === undefined ||
      profile.assay.upperBoundPct === null || profile.assay.upperBoundPct === undefined) {
    return 'Explicit lower, nominal and upper assay values are required.';
  }
  const { lowerBoundPct: lo, valuePct: mid, upperBoundPct: hi } = profile.assay;
  if (![lo, mid, hi].every(x => Number.isFinite(x) && x >= 0 && x <= 100) ||
      !(lo <= mid && mid <= hi)) return 'Assay interval is invalid.';
  if (!profile.equivalentBasis.isMwDefensible ||
      !Number.isFinite(profile.equivalentBasis.molecularWeight) ||
      (profile.equivalentBasis.molecularWeight ?? 0) <= 0) {
    return 'A defensible molecular weight is required.';
  }
  if (profile.classification.acidBaseClass === 'STRONG_ACID') {
    if (profile.classification.protonFunctionality !== 'MONOPROTIC' ||
        profile.classification.protonDonorCount !== 1) return 'Only explicitly monoprotic strong acids are supported.';
  } else if (profile.classification.acidBaseClass === 'STRONG_BASE') {
    if (profile.classification.protonFunctionality !== 'MONO_EQUIVALENT_BASE' ||
        profile.classification.protonAcceptorCount !== 1) return 'Only explicitly mono-equivalent strong bases are supported.';
  } else {
    return 'Only strong acid and strong base primary reactants are supported.';
  }
  return null;
}

function toEquivalentInput(
  profile: ScientificAcidBaseProfile,
  rawMassKg: number,
  displayName: string
): ReactiveEquivalentIntervalInput {
  const mw = profile.equivalentBasis.molecularWeight as number;
  const functionality = profile.classification.acidBaseClass === 'STRONG_ACID'
    ? profile.classification.protonDonorCount as number
    : profile.classification.protonAcceptorCount as number;
  const equivalentWeight = mw / functionality;
  const assay = profile.assay;
  const equivalents = (assayPct: number) => rawMassKg * 1000 *
    (assayPct / 100) / equivalentWeight;
  const evidenceRef = profile.provenance.evidenceId ||
    `registry:${profile.identity.ingredientId}:${profile.provenance.sourceType}:${profile.provenance.source}`;
  return {
    id: profile.identity.ingredientId,
    name: displayName,
    lowerEq: equivalents(assay.lowerBoundPct as number),
    nominalEq: equivalents(assay.valuePct as number),
    upperEq: equivalents(assay.upperBoundPct as number),
    evidenceRef,
    basis: 'mol-equivalent per batch'
  };
}

/**
 * Converts only defensible, source-verified reference profiles into total batch
 * equivalent intervals. Any unsupported primary reactant blocks the complete
 * interval rather than being dropped or treated as zero.
 */
export function adaptFormulaToPrimaryNeutralizationInterval(
  ingredients: Array<IngredientInput | FormulationIngredient>,
  batchSizeKg: number
): NeutralizationProfileIntervalAdapterResult {
  const acidInputs: ReactiveEquivalentIntervalInput[] = [];
  const baseInputs: ReactiveEquivalentIntervalInput[] = [];
  const blockedIngredients: Array<{ name: string; reason: string }> = [];
  const evidence: NeutralizationProfileIntervalAdapterResult['evidence'] = [];

  if (!Array.isArray(ingredients) || !Number.isFinite(batchSizeKg) || batchSizeKg <= 0) {
    return {
      status: 'INVALID_INPUT', report: null, acidInputs, baseInputs,
      blockedIngredients: [{ name: 'Formula', reason: 'Ingredients array and positive finite batch size are required.' }],
      evidence, warnings: ['No interval calculated.'], releaseEligible: false
    };
  }

  let primaryCount = 0;
  for (const ingredient of ingredients) {
    if (!ingredient || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
      blockedIngredients.push({ name: 'Unknown ingredient', reason: 'Ingredient identity is missing.' });
      continue;
    }
    const resolvedProfile = resolveScientificAcidBaseProfile(ingredient);\n    // Name parsing may downgrade a clearly identified pure reference to an\n    // estimated assay. Rehydrate only the exact canonical registry identity;\n    // the registry record, not the parsed display name, remains authoritative.\n    const registryProfile = AUTHORITATIVE_ACID_BASE_REGISTRY[resolvedProfile.identity.ingredientId];\n    const profile = registryProfile\n      ? JSON.parse(JSON.stringify(registryProfile)) as ScientificAcidBaseProfile\n      : resolvedProfile;
    const acid = profile.classification.acidBaseClass === 'STRONG_ACID';
    const base = profile.classification.acidBaseClass === 'STRONG_BASE';
    if (!acid && !base) continue;
    primaryCount += 1;

    const rawMassKg = resolveRawMassKg(ingredient, batchSizeKg);
    if (rawMassKg === null) {
      blockedIngredients.push({ name: ingredient.name, reason: 'Raw mass is missing or invalid.' });
      continue;
    }
    if (rawMassKg === 0) continue;

    const unsupported = isSupportedProfile(profile);
    if (unsupported) {
      blockedIngredients.push({ name: ingredient.name, reason: unsupported });
      continue;
    }

    const input = toEquivalentInput(profile, rawMassKg, ingredient.name);
    (acid ? acidInputs : baseInputs).push(input);
    evidence.push({
      ingredientId: profile.identity.ingredientId,
      evidenceRef: input.evidenceRef,
      sourceType: profile.provenance.sourceType,
      evidenceLevel: profile.provenance.evidenceLevel,
      assayStatus: profile.assay.status
    });
  }

  if (primaryCount === 0) {
    blockedIngredients.push({ name: 'Formula', reason: 'No identified strong monoprotic acid or mono-equivalent strong base reactant.' });
  }
  if (blockedIngredients.length) {
    return {
      status: 'INSUFFICIENT_DATA', report: null, acidInputs, baseInputs,
      blockedIngredients, evidence,
      warnings: ['At least one primary-reactant input is unsupported; no partial-formula interval is emitted.'],
      releaseEligible: false
    };
  }

  const report = calculatePrimaryNeutralizationInterval(acidInputs, baseInputs);
  return {
    status: report.status === 'BOUNDED_INPUT' ? 'READY_FOR_ARITHMETIC' : 'INSUFFICIENT_DATA',
    report, acidInputs, baseInputs, blockedIngredients, evidence,
    warnings: [
      'Supported scope is restricted to source-verified pure strong monoprotic acids and mono-equivalent strong bases.',
      'This is an equivalent interval only; it is not pH, aqueous speciation, laboratory validation or release approval.'
    ],
    releaseEligible: false
  };
}
