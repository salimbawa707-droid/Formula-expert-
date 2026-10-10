/**
 * ============================================================================
 * PHASE N3 — AUTHORITATIVE PRIMARY STOICHIOMETRIC NEUTRALIZATION ENGINE
 * ============================================================================
 * The single authoritative runtime source for:
 * 1. Primary acid/base neutralization stoichiometry (LABSA, Sulfuric Acid, NaOH, KOH, TEA, MEA)
 * 2. Stoichiometric reactive equivalent consumption and limiting reagent determination
 * 3. Primary neutralization fraction (0.0 to 1.0) and unreacted/excess equivalents
 * 4. Explicit PrimaryNeutralizationState model (FULLY_NEUTRALIZED, UNDER_NEUTRALIZED, BASE_EXCESS, ACID_EXCESS, INSUFFICIENT_DATA)
 * 5. Stoichiometric water generation derived from reaction extent (moles H+ + OH- -> H2O)
 * 6. ScientificResult<PrimaryNeutralizationState> SSOT integration
 *
 * ABSOLUTE SCIENTIFIC RULES:
 * - NO 0.135 multiplier shortcut.
 * - NO 0.32 powder shortcut.
 * - NO rawAcidKg * 61.0 water shortcut.
 * - NO heat / exotherm fabrication.
 * - NO inference of primary neutralization from final pH.
 * - UNKNOWN assay strictly triggers INSUFFICIENT_DATA.
 * ============================================================================
 */

import { FormulationIngredient, IngredientInput } from '../../types';
import { ScientificMaturity, ScientificResult } from '../scientificCertainty/types';
import {
  resolveScientificAcidBaseProfile,
  calculateReactiveEquivalents,
  ScientificAcidBaseProfile
} from './acidBaseDataModel';

/** Centralized numerical tolerance for floating point mole/equivalent noise */
export const STOICHIOMETRIC_EPSILON_EQ = 1e-6;

/**
 * Named constant for the stoichiometric relative tolerance.
 * Value: 1e-4 (0.01% relative difference).
 * Mathematical definition: |acidInitial - baseInitial| / max(acidInitial, baseInitial, 1e-6) <= STOICHIOMETRIC_RELATIVE_TOLERANCE
 * Reason: Captures floating-point precision noise at batch scales and COA measurement margins.
 * Boundary behavior: Ensures values close to 100% (e.g., 99.999% or 100.0001%) are correctly treated as stoichiometrically equivalent,
 * while values like 97.0% or 99.0% are correctly classified as non-equivalent (either under-neutralized or base excess).
 */
export const STOICHIOMETRIC_RELATIVE_TOLERANCE = 1e-4;

export type PrimaryNeutralizationStatus =
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA'
  | 'NO_REACTION'
  | 'UNDER_NEUTRALIZED'
  | 'FULLY_NEUTRALIZED'
  | 'BASE_EXCESS'
  | 'ACID_EXCESS'
  | 'AMBIGUOUS_REACTION_SYSTEM'
  | 'INVALID_INPUT';

export interface PrimaryReactionPair {
  acidName: string;
  baseName: string;
  acidFamily: string;
  baseFamily: string;
  acidEquivalentsInitial: number;
  baseEquivalentsInitial: number;
  acidEquivalentsConsumed: number;
  baseEquivalentsConsumed: number;
  acidEquivalentsResidual: number;
  baseEquivalentsResidual: number;
  limitingReagent: 'ACID' | 'BASE' | 'STOICHIOMETRIC_EQUIVALENCE' | 'NONE';
  neutralizationFraction: number; // 0.0 to 1.0 (clamped)
  status: PrimaryNeutralizationStatus;
  productName?: string;
  waterGeneratedGrams?: number | null;
}

export interface PrimaryNeutralizationState {
  status: PrimaryNeutralizationStatus;
  totalAcidEquivalentsInitial: number;
  totalBaseEquivalentsInitial: number;
  totalAcidEquivalentsConsumed: number;
  totalBaseEquivalentsConsumed: number;
  totalAcidEquivalentsResidual: number;
  totalBaseEquivalentsResidual: number;
  primaryNeutralizationFraction: number | null; // null if assay INSUFFICIENT_DATA
  excessAcidEquivalents: number;
  excessBaseEquivalents: number;
  limitingReagent: 'ACID' | 'BASE' | 'STOICHIOMETRIC_EQUIVALENCE' | 'NONE' | 'UNKNOWN';
  reactionPairs: PrimaryReactionPair[];
  unreactedPrimaryAcids: Array<{ name: string; residualEquivalents: number }>;
  unreactedPrimaryBases: Array<{ name: string; residualEquivalents: number }>;
  secondaryAcidsPresent: Array<{ name: string; equivalents: number }>;
  secondaryBasesPresent: Array<{ name: string; equivalents: number }>;
  waterGeneratedGrams: number | null; // Derived from true reaction extent (18.015 g/mol H2O)
  heatOfReactionKJ: number | null; // null unless explicit enthalpy data available
  calculationBasis: string;
  assayInputs: Array<{ name: string; status: string; valuePct: number | null; sourceType: string }>;
  missingInputs: string[];
  warnings: string[];
  assumptions: string[];
  limitations: string[];
}

export class StoichiometricNeutralizationEngine {
  /**
   * Evaluates Primary Stoichiometric Neutralization across a formulation batch.
   */
  public static evaluatePrimaryNeutralization(
    ingredients: Array<IngredientInput | FormulationIngredient>,
    batchSizeKg: number = 100
  ): ScientificResult<PrimaryNeutralizationState> {
    const timestamp = new Date().toISOString();
    const warnings: string[] = [];
    const assumptions: string[] = [
      'Primary stoichiometric neutralization operates on active proton-donor and proton-acceptor reactive equivalents.',
      'Primary reaction extent equals minimum(acidReactiveEquivalents, baseReactiveEquivalents) within numerical tolerance (1e-6 eq).',
      'Stoichiometric water generation is calculated as moles_reactive_H2O * 18.015 g/mol.',
      'Secondary acids (e.g. Citric Acid) and secondary buffers (e.g. Soda Ash) do not retroactively alter the stoichiometric reaction state of primary surfactants.'
    ];
    const limitations: string[] = [
      'Primary stoichiometric neutralization state represents extent of reaction before final aqueous thermodynamic equilibrium.',
      'Does not model temperature-dependent weak acid pKa shift curves or non-ideal activity coefficients at extreme ionic strength.',
      'Heat of reaction is reported as null unless explicit thermochemical enthalpy data is attached.'
    ];

    if (!Array.isArray(ingredients) || ingredients.length === 0 || batchSizeKg <= 0) {
      const emptyState: PrimaryNeutralizationState = {
        status: 'NO_REACTION',
        totalAcidEquivalentsInitial: 0,
        totalBaseEquivalentsInitial: 0,
        totalAcidEquivalentsConsumed: 0,
        totalBaseEquivalentsConsumed: 0,
        totalAcidEquivalentsResidual: 0,
        totalBaseEquivalentsResidual: 0,
        primaryNeutralizationFraction: null,
        excessAcidEquivalents: 0,
        excessBaseEquivalents: 0,
        limitingReagent: 'NONE',
        reactionPairs: [],
        unreactedPrimaryAcids: [],
        unreactedPrimaryBases: [],
        secondaryAcidsPresent: [],
        secondaryBasesPresent: [],
        waterGeneratedGrams: 0,
        heatOfReactionKJ: null,
        calculationBasis: 'EMPTY_FORMULA',
        assayInputs: [],
        missingInputs: [],
        warnings: ['No ingredients supplied or batch mass <= 0.'],
        assumptions,
        limitations
      };

      return {
        value: emptyState,
        unit: 'PrimaryNeutralizationState',
        property: 'PRIMARY_STOICHIOMETRIC_NEUTRALIZATION',
        maturity: 'MODEL_PREDICTION' as ScientificMaturity,
        validationStatus: 'UNVALIDATED',
        timestamp
      };
    }

    // Step 1: Process each ingredient into its N2 ScientificAcidBaseProfile
    const profiles = ingredients.map(ing => {
      const profile = resolveScientificAcidBaseProfile(ing);
      let rawMassKg = 0;
      if ((ing as any).rawKg !== undefined && (ing as any).rawKg > 0) {
        rawMassKg = (ing as any).rawKg;
      } else if ((ing as any).weightKg !== undefined && (ing as any).weightKg > 0) {
        rawMassKg = (ing as any).weightKg;
      } else {
        const pct = (ing as any).percentage ?? (ing as any).percent ?? (ing as any).percentageInFormula ?? (ing as any).rawPercent ?? 0;
        rawMassKg = (pct / 100) * batchSizeKg;
      }
      return { ing, profile, rawMassKg };
    });

    const missingInputs: string[] = [];
    const assayInputs: Array<{ name: string; status: string; valuePct: number | null; sourceType: string }> = [];

    // Step 2: Categorize into Primary Reactants vs Secondary/Buffers
    const primaryAcids: Array<{ name: string; profile: ScientificAcidBaseProfile; rawMassKg: number; eq: number }> = [];
    const primaryBases: Array<{ name: string; profile: ScientificAcidBaseProfile; rawMassKg: number; eq: number }> = [];
    const secondaryAcids: Array<{ name: string; profile: ScientificAcidBaseProfile; rawMassKg: number; eq: number }> = [];
    const secondaryBases: Array<{ name: string; profile: ScientificAcidBaseProfile; rawMassKg: number; eq: number }> = [];

    let hasInsufficientAssayData = false;

    for (const { ing, profile, rawMassKg } of profiles) {
      const name = ing.name || profile.identity.commonName || 'Unnamed Ingredient';
      assayInputs.push({
        name,
        status: profile.assay.status,
        valuePct: profile.assay.valuePct ?? null,
        sourceType: profile.provenance.sourceType
      });

      const family = profile.classification.acidBaseFamily;
      const acidBaseClass = profile.classification.acidBaseClass;

      // Identify Primary Acids (LABSA, Sulfuric, HCl, Sulfamic)
      const isPrimaryAcid = family === 'SULFONIC_ACID_LABSA' || family === 'STRONG_MINERAL_ACID' || acidBaseClass === 'STRONG_ACID';
      // Identify Primary Bases (NaOH, KOH, TEA, MEA)
      const isPrimaryBase = family === 'STRONG_BASE' || family === 'AMINE_BASE' || acidBaseClass === 'STRONG_BASE';

      // Secondary Acids (Citric, Formic, Polyacrylate)
      const isSecondaryAcid = family === 'CARBOXYLIC_WEAK_ACID' || acidBaseClass === 'WEAK_ACID';
      // Secondary Bases (Soda Ash, Silicate, Bicarbonate)
      const isSecondaryBase = family === 'CARBONATE' || family === 'SILICATE' || family === 'PHOSPHATE';

      if (rawMassKg > 0 && (isPrimaryAcid || isPrimaryBase)) {
        // UNKNOWN ASSAY FIREWALL: If primary reactant assay is UNKNOWN or INSUFFICIENT_DATA, block exact calculation!
        if (profile.assay.status === 'UNKNOWN' || profile.assay.status === 'INSUFFICIENT_DATA' || profile.assay.valuePct === null) {
          hasInsufficientAssayData = true;
          missingInputs.push(`Verified assay or commercial grade for primary reactant "${name}"`);
        }
      }

      const eqResult = calculateReactiveEquivalents(profile, rawMassKg);
      const eq = eqResult.totalReactiveEquivalents ?? 0;

      if (isPrimaryAcid) {
        primaryAcids.push({ name, profile, rawMassKg, eq });
      } else if (isPrimaryBase) {
        primaryBases.push({ name, profile, rawMassKg, eq });
      } else if (isSecondaryAcid) {
        secondaryAcids.push({ name, profile, rawMassKg, eq });
      } else if (isSecondaryBase) {
        // Soda Ash or Silicate can act as primary base in powder formulations IF no strong base (NaOH/KOH) is present
        if (primaryBases.length === 0 && primaryAcids.length > 0 && (family === 'CARBONATE' || family === 'SILICATE')) {
          primaryBases.push({ name, profile, rawMassKg, eq });
        } else {
          secondaryBases.push({ name, profile, rawMassKg, eq });
        }
      }
    }

    // Step 3: Handle Insufficient Assay Data Firewall
    if (hasInsufficientAssayData) {
      const stateInsufficient: PrimaryNeutralizationState = {
        status: 'INSUFFICIENT_DATA',
        totalAcidEquivalentsInitial: 0,
        totalBaseEquivalentsInitial: 0,
        totalAcidEquivalentsConsumed: 0,
        totalBaseEquivalentsConsumed: 0,
        totalAcidEquivalentsResidual: 0,
        totalBaseEquivalentsResidual: 0,
        primaryNeutralizationFraction: null, // Strictly null when assay is UNKNOWN
        excessAcidEquivalents: 0,
        excessBaseEquivalents: 0,
        limitingReagent: 'UNKNOWN',
        reactionPairs: [],
        unreactedPrimaryAcids: [],
        unreactedPrimaryBases: [],
        secondaryAcidsPresent: secondaryAcids.map(a => ({ name: a.name, equivalents: a.eq })),
        secondaryBasesPresent: secondaryBases.map(b => ({ name: b.name, equivalents: b.eq })),
        waterGeneratedGrams: null,
        heatOfReactionKJ: null,
        calculationBasis: 'INSUFFICIENT_DATA_FIREWALL',
        assayInputs,
        missingInputs,
        warnings: [
          'Primary acid or base assay is UNKNOWN. Refusing to manufacture an exact neutralization result without verified assay or commercial grade data.'
        ],
        assumptions,
        limitations
      };

      return {
        value: stateInsufficient,
        unit: 'PrimaryNeutralizationState',
        property: 'PRIMARY_STOICHIOMETRIC_NEUTRALIZATION',
        maturity: 'SOURCE_BACKED' as ScientificMaturity,
        validationStatus: 'DATA_INSUFFICIENT',
        limitations: missingInputs,
        timestamp
      };
    }

    // Step 4: Perform Pure Stoichiometric Neutralization Matching
    let totalAcidEquivalentsInitial = 0;
    primaryAcids.forEach(a => { totalAcidEquivalentsInitial += a.eq; });

    let totalBaseEquivalentsInitial = 0;
    primaryBases.forEach(b => { totalBaseEquivalentsInitial += b.eq; });

    if (totalAcidEquivalentsInitial <= STOICHIOMETRIC_EPSILON_EQ && totalBaseEquivalentsInitial <= STOICHIOMETRIC_EPSILON_EQ) {
      const stateNoReaction: PrimaryNeutralizationState = {
        status: 'NO_REACTION',
        totalAcidEquivalentsInitial: 0,
        totalBaseEquivalentsInitial: 0,
        totalAcidEquivalentsConsumed: 0,
        totalBaseEquivalentsConsumed: 0,
        totalAcidEquivalentsResidual: 0,
        totalBaseEquivalentsResidual: 0,
        primaryNeutralizationFraction: null,
        excessAcidEquivalents: 0,
        excessBaseEquivalents: 0,
        limitingReagent: 'NONE',
        reactionPairs: [],
        unreactedPrimaryAcids: [],
        unreactedPrimaryBases: [],
        secondaryAcidsPresent: secondaryAcids.map(a => ({ name: a.name, equivalents: a.eq })),
        secondaryBasesPresent: secondaryBases.map(b => ({ name: b.name, equivalents: b.eq })),
        waterGeneratedGrams: 0,
        heatOfReactionKJ: null,
        calculationBasis: 'NO_PRIMARY_REACTANTS',
        assayInputs,
        missingInputs: [],
        warnings: ['No primary reactive acid or base components found in formulation.'],
        assumptions,
        limitations
      };

      return {
        value: stateNoReaction,
        unit: 'PrimaryNeutralizationState',
        property: 'PRIMARY_STOICHIOMETRIC_NEUTRALIZATION',
        maturity: 'MODEL_PREDICTION' as ScientificMaturity,
        validationStatus: 'UNVALIDATED',
        timestamp
      };
    }

    // Reaction Extent = min(totalAcidEquivalentsInitial, totalBaseEquivalentsInitial)
    const reactionExtent = Math.min(totalAcidEquivalentsInitial, totalBaseEquivalentsInitial);
    const totalAcidEquivalentsConsumed = reactionExtent;
    const totalBaseEquivalentsConsumed = reactionExtent;

    const totalAcidEquivalentsResidual = Math.max(0, totalAcidEquivalentsInitial - reactionExtent);
    const totalBaseEquivalentsResidual = Math.max(0, totalBaseEquivalentsInitial - reactionExtent);

    // Primary Neutralization Fraction = consumedAcid / initialAcid (0.0 to 1.0)
    let primaryNeutralizationFraction = 1.0;
    if (totalAcidEquivalentsInitial > STOICHIOMETRIC_EPSILON_EQ) {
      const rawRatio = totalAcidEquivalentsConsumed / totalAcidEquivalentsInitial;
      if (rawRatio < -1e-6 || rawRatio > 1.0001) {
        warnings.push(`Stoichiometric anomaly detected: raw neutralization ratio (${rawRatio}) is outside expected physical bounds [0, 1].`);
      }
      primaryNeutralizationFraction = Math.max(0.0, Math.min(1.0, rawRatio));
    }

    // Excess Equivalents
    const excessAcidEquivalents = Math.max(0, totalAcidEquivalentsInitial - totalBaseEquivalentsInitial);
    const excessBaseEquivalents = Math.max(0, totalBaseEquivalentsInitial - totalAcidEquivalentsInitial);

    // Limiting Reagent & Status Determination
    const maxEq = Math.max(totalAcidEquivalentsInitial, totalBaseEquivalentsInitial, 1e-6);
    const relativeDiff = Math.abs(totalAcidEquivalentsInitial - totalBaseEquivalentsInitial) / maxEq;

    let limitingReagent: 'ACID' | 'BASE' | 'STOICHIOMETRIC_EQUIVALENCE' | 'NONE' = 'NONE';
    let status: PrimaryNeutralizationStatus = 'FULLY_NEUTRALIZED';

    if (relativeDiff <= STOICHIOMETRIC_RELATIVE_TOLERANCE) {
      limitingReagent = 'STOICHIOMETRIC_EQUIVALENCE';
      status = 'FULLY_NEUTRALIZED';
    } else if (totalBaseEquivalentsInitial < totalAcidEquivalentsInitial) {
      limitingReagent = 'BASE'; // Base is limiting, acid in excess
      status = 'UNDER_NEUTRALIZED';
    } else {
      limitingReagent = 'ACID'; // Acid is limiting, base in excess
      status = 'BASE_EXCESS';
    }

    // Reaction Pairing & Products
    const reactionPairs: PrimaryReactionPair[] = [];
    if (primaryAcids.length > 0 && primaryBases.length > 0) {
      const pAcid = primaryAcids[0];
      const pBase = primaryBases[0];

      let productName = 'Sodium Alkylbenzene Sulfonate (Surfactant Salt)';
      if (pAcid.profile.classification.acidBaseFamily === 'SULFONIC_ACID_LABSA') {
        if (pBase.name.toLowerCase().includes('potassium') || pBase.name.toLowerCase().includes('koh')) {
          productName = 'Potassium Alkylbenzene Sulfonate (K-LABS Salt)';
        } else if (pBase.name.toLowerCase().includes('triethanolamine') || pBase.name.toLowerCase().includes('tea')) {
          productName = 'TEA-Alkylbenzene Sulfonate (TEA-LABS Salt)';
        } else if (pBase.name.toLowerCase().includes('monoethanolamine') || pBase.name.toLowerCase().includes('mea')) {
          productName = 'MEA-Alkylbenzene Sulfonate (MEA-LABS Salt)';
        }
      }

      reactionPairs.push({
        acidName: pAcid.name,
        baseName: pBase.name,
        acidFamily: pAcid.profile.classification.acidBaseFamily,
        baseFamily: pBase.profile.classification.acidBaseFamily,
        acidEquivalentsInitial: Number(pAcid.eq.toFixed(5)),
        baseEquivalentsInitial: Number(pBase.eq.toFixed(5)),
        acidEquivalentsConsumed: Number(reactionExtent.toFixed(5)),
        baseEquivalentsConsumed: Number(reactionExtent.toFixed(5)),
        acidEquivalentsResidual: Number(Math.max(0, pAcid.eq - reactionExtent).toFixed(5)),
        baseEquivalentsResidual: Number(Math.max(0, pBase.eq - reactionExtent).toFixed(5)),
        limitingReagent,
        neutralizationFraction: Number(primaryNeutralizationFraction.toFixed(4)),
        status,
        productName,
        waterGeneratedGrams: Number((reactionExtent * 18.015).toFixed(2))
      });
    }

    // Calculate Stoichiometric Water Generation: 1 mol H+ + 1 mol OH- -> 1 mol H2O (18.015 g)
    const waterGeneratedGrams = Number((reactionExtent * 18.015).toFixed(2));

    const finalState: PrimaryNeutralizationState = {
      status,
      totalAcidEquivalentsInitial: Number(totalAcidEquivalentsInitial.toFixed(5)),
      totalBaseEquivalentsInitial: Number(totalBaseEquivalentsInitial.toFixed(5)),
      totalAcidEquivalentsConsumed: Number(totalAcidEquivalentsConsumed.toFixed(5)),
      totalBaseEquivalentsConsumed: Number(totalBaseEquivalentsConsumed.toFixed(5)),
      totalAcidEquivalentsResidual: Number(totalAcidEquivalentsResidual.toFixed(5)),
      totalBaseEquivalentsResidual: Number(totalBaseEquivalentsResidual.toFixed(5)),
      primaryNeutralizationFraction: Number(primaryNeutralizationFraction.toFixed(4)),
      excessAcidEquivalents: Number(excessAcidEquivalents.toFixed(5)),
      excessBaseEquivalents: Number(excessBaseEquivalents.toFixed(5)),
      limitingReagent,
      reactionPairs,
      unreactedPrimaryAcids: primaryAcids
        .filter(a => a.eq > reactionExtent + STOICHIOMETRIC_EPSILON_EQ)
        .map(a => ({ name: a.name, residualEquivalents: Number((a.eq - reactionExtent).toFixed(5)) })),
      unreactedPrimaryBases: primaryBases
        .filter(b => b.eq > reactionExtent + STOICHIOMETRIC_EPSILON_EQ)
        .map(b => ({ name: b.name, residualEquivalents: Number((b.eq - reactionExtent).toFixed(5)) })),
      secondaryAcidsPresent: secondaryAcids.map(a => ({ name: a.name, equivalents: Number(a.eq.toFixed(5)) })),
      secondaryBasesPresent: secondaryBases.map(b => ({ name: b.name, equivalents: Number(b.eq.toFixed(5)) })),
      waterGeneratedGrams,
      heatOfReactionKJ: null, // Null unless explicit thermochemical enthalpy data attached
      calculationBasis: 'DETERMINISTIC_STOICHIOMETRIC_REACTIVE_EQUIVALENTS',
      assayInputs,
      missingInputs: [],
      warnings,
      assumptions,
      limitations
    };

    return {
      value: finalState,
      unit: 'PrimaryNeutralizationState',
      property: 'PRIMARY_STOICHIOMETRIC_NEUTRALIZATION',
      maturity: 'MODEL_PREDICTION' as ScientificMaturity,
      validationStatus: 'UNVALIDATED',
      timestamp
    };
  }
}
