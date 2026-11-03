import {
  ClassifiedIngredient,
  PowderAlkalinityReport,
  PowderBuilderReport,
  PowderChelationReport,
  PowderLabMeasurementInputs
} from './types';
import { getChelatorBindingCapacity } from '../chelatorEngine';

/**
 * Powder Builder System Engine
 * 
 * Rules:
 * - Strict separation between: BUILDER, CHELATOR, SEQUESTRANT, ALKALINITY CONTRIBUTOR.
 * - Sodium Carbonate is a precipitation builder and alkalinity contributor, NOT a true chelator.
 * - Zeolite 4A is an ion-exchange aluminosilicate builder.
 * - Polycarboxylates are polymeric co-builders / anti-encrustation agents.
 */
export function calculatePowderBuilderSystem(classifiedIngredients: ClassifiedIngredient[]): PowderBuilderReport {
  const builderIngredients: PowderBuilderReport['builderIngredients'] = [];
  let totalBuilderPct = 0;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    if (ing.functionalClass === 'Builder (Precipitation / Ion-Exchange)') {
      let type = 'Precipitation Builder';
      let mechanism: 'Precipitation' | 'Ion-Exchange' | 'Polymeric Co-Builder' | 'Other' = 'Precipitation';

      if (name.includes('zeolite')) {
        type = 'Ion-Exchange Insoluble Aluminosilicate Builder (Zeolite 4A)';
        mechanism = 'Ion-Exchange';
      } else if (name.includes('stpp') || name.includes('tripolyphosphate')) {
        type = 'Soluble Polyphosphate Sequestrant & Dispersing Builder';
        mechanism = 'Other';
      } else if (name.includes('carbonate') || name.includes('soda ash')) {
        type = 'Alkaline Precipitation Builder (Forms Insoluble CaCO₃)';
        mechanism = 'Precipitation';
      } else if (name.includes('silicate') || name.includes('metasilicate')) {
        type = 'Alkaline Silicate Builder & Corrosion Inhibitor';
        mechanism = 'Precipitation';
      }

      builderIngredients.push({
        name: ing.name,
        percentage: Number(ing.inputPercentage.toFixed(2)),
        type,
        mechanism
      });
      totalBuilderPct += ing.inputPercentage;
    } else if (ing.functionalClass === 'Anti-redeposition Polymer') {
      // Acrylic/maleic polymers act as polymeric co-builders and threshold inhibitors
      builderIngredients.push({
        name: ing.name,
        percentage: Number(ing.inputPercentage.toFixed(2)),
        type: 'Polymeric Co-Builder (Threshold Anti-Encrustation & Soil Dispersant)',
        mechanism: 'Polymeric Co-Builder'
      });
      totalBuilderPct += ing.inputPercentage;
    }
  });

  const mechanism = builderIngredients.length > 0
    ? 'Solid inorganic builders soften wash liquor via chemical precipitation of insoluble calcium carbonate (Soda Ash) and/or solid-state aluminosilicate cation exchange (Zeolite 4A). Co-builders prevent fabric encrustation.'
    : 'No primary inorganic builders detected in formulation.';

  return {
    totalBuilderPct: Number(totalBuilderPct.toFixed(2)),
    builderIngredients,
    mechanism,
    notes: 'Builder != Chelator. Precipitation builders reduce free Ca²⁺ by forming solid precipitates (e.g. CaCO₃), whereas soluble chelators form water-soluble coordination complexes.',
    source: builderIngredients.length > 0 ? 'CALCULATED' : 'NOT_APPLICABLE'
  };
}

/**
 * Powder Chelation & Sequestration Engine
 * 
 * Rules:
 * - Only true soluble organic chelating agents (GLDA, MGDA, EDTA, Citrate, Phosphonates) are evaluated.
 * - Do NOT display "0 ppm capacity" as a fake validated measurement when unmeasured.
 * - Distinguish: Measured capacity, Validated database capacity, Calculated capacity, Unknown capacity.
 */
export function calculatePowderChelationSystem(
  classifiedIngredients: ClassifiedIngredient[],
  washDoseG?: number,
  washVolumeL?: number
): PowderChelationReport {
  const chelatorIngredients: PowderChelationReport['chelatorIngredients'] = [];
  let totalChelatorPct = 0;
  let totalCaCapacityMg = 0;
  let hasInsufficientActiveMatter = false;
  let hasValidatedData = false;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    if (ing.functionalClass === 'Chelating Agent / Soluble Sequestrant') {
      let type = 'Soluble Organic Sequestrant';

      const rawActivePct = ing.activeMatterPct;
      const validActivePct =
        typeof rawActivePct === 'number' &&
        Number.isFinite(rawActivePct) &&
        rawActivePct >= 0 &&
        rawActivePct <= 100
          ? rawActivePct
          : null;

      let rawCapacity = ing.chelatingCapacityMgPerGram;
      let evidenceId = ing.chelatingCapacityEvidenceId;
      let capacityBasis = ing.chelatingCapacityBasis;

      if (rawCapacity === undefined || !evidenceId) {
        const lookup = getChelatorBindingCapacity(ing.name, validActivePct !== null ? validActivePct : undefined);
        if (lookup.status === 'VALID' && lookup.capacityMgCaCO3PerGram !== null) {
          rawCapacity = lookup.capacityMgCaCO3PerGram;
          evidenceId = lookup.evidenceId;
          capacityBasis = capacityBasis || 'COMMERCIAL_PRODUCT';
        }
      }

      const validCapacity =
        typeof rawCapacity === 'number' &&
        Number.isFinite(rawCapacity) &&
        rawCapacity >= 0 &&
        Boolean(evidenceId?.trim()) &&
        (capacityBasis === 'ACTIVE_MATERIAL' ||
         capacityBasis === 'COMMERCIAL_PRODUCT');

      let capacityMgPerGram: number | undefined = undefined;
      let capacityStatus = 'Validated capacity evidence or active matter unavailable.';

      if (validActivePct === null || !validCapacity) {
        hasInsufficientActiveMatter = true;
      } else {
        capacityMgPerGram = rawCapacity;
        capacityStatus = `Traceable capacity evidence (${evidenceId}): ${rawCapacity} mg CaCO₃/g (${capacityBasis})`;
        const rawIngredientGrams = typeof washDoseG === 'number' ? washDoseG * (ing.inputPercentage / 100) : 0;
        const capacityBasisGrams =
          capacityBasis === 'ACTIVE_MATERIAL' || ing.activeMatterPct !== undefined
            ? rawIngredientGrams * (validActivePct / 100)
            : rawIngredientGrams;
        totalCaCapacityMg += capacityBasisGrams * rawCapacity;
        hasValidatedData = true;
      }

      chelatorIngredients.push({
        name: ing.name,
        percentage: Number(ing.inputPercentage.toFixed(2)),
        type,
        capacityStatus,
        capacityMgPerGram
      });
      totalChelatorPct += ing.inputPercentage;
    }
  });

  if (hasInsufficientActiveMatter) {
    return {
      totalChelatorPct: Number(totalChelatorPct.toFixed(2)),
      chelatorIngredients,
      hasValidatedData: false,
      calciumCapacityMgPerDose: undefined,
      capacityStatus: 'INSUFFICIENT_DATA: Missing or invalid active matter percentage or capacity evidence for one or more chelators.',
      source: 'INSUFFICIENT_DATA'
    };
  }

  if (chelatorIngredients.length === 0) {
    return {
      totalChelatorPct: 0,
      chelatorIngredients: [],
      hasValidatedData: false,
      calciumCapacityMgPerDose: undefined,
      capacityStatus: 'No soluble organic chelating agents (GLDA/EDTA/MGDA/Citrate) present. Builder system relies on carbonate precipitation or aluminosilicate ion-exchange.',
      source: 'NOT_APPLICABLE'
    };
  }

  if (typeof washDoseG !== 'number' || !Number.isFinite(washDoseG) || washDoseG <= 0 ||
      typeof washVolumeL !== 'number' || !Number.isFinite(washVolumeL) || washVolumeL <= 0) {
    return {
      totalChelatorPct: Number(totalChelatorPct.toFixed(2)),
      chelatorIngredients,
      hasValidatedData: false,
      calciumCapacityMgPerDose: undefined,
      capacityStatus: 'NOT_EVALUATED: explicit wash dose (g) and final wash-liquor volume (L) are required to report per-wash chelation capacity. Ingredient-level evidence does not establish a per-wash result.',
      source: 'INSUFFICIENT_DATA'
    };
  }

  const calciumCapacityMgPerDose = hasValidatedData ? Number(totalCaCapacityMg.toFixed(1)) : undefined;
  const capacityStatus = hasValidatedData
    ? `Validated stoichiometric chelation capacity: ${calciumCapacityMgPerDose} mg CaCO₃ per ${washDoseG}g wash dose in ${washVolumeL}L wash liquor.`
    : 'Validated capacity data unavailable for this specific chelator grade.';

  return {
    totalChelatorPct: Number(totalChelatorPct.toFixed(2)),
    chelatorIngredients,
    hasValidatedData,
    calciumCapacityMgPerDose,
    capacityStatus,
    source: hasValidatedData ? 'CALCULATED' : 'INSUFFICIENT_DATA'
  };
}

/**
 * Powder Alkalinity Engine
 * 
 * Rules:
 * - Treated separately from pH.
 * - Calculates stoichiometric % Na2O equivalent (alkaline reserve).
 * - Supports laboratory titration input (measuredReserveAlkalinityPctNa2O).
 * - Does NOT infer exact alkalinity from pH alone.
 */
export function calculatePowderAlkalinity(
  classifiedIngredients: ClassifiedIngredient[],
  labInputs?: PowderLabMeasurementInputs
): PowderAlkalinityReport {
  const alkalineIngredients: PowderAlkalinityReport['alkalineIngredients'] = [];
  let totalAlkalinePct = 0;
  let estimatedNa2O = 0;

  classifiedIngredients.forEach((ing) => {
    const name = ing.name.toLowerCase();
    const pct = ing.inputPercentage;

    if (
      ing.isAlkalinitySource ||
      name.includes('carbonate') ||
      name.includes('soda ash') ||
      name.includes('metasilicate') ||
      name.includes('hydroxide') ||
      name.includes('caustic') ||
      name.includes('silicate')
    ) {
      // Stoichiometric Na2O equivalent (Molecular weights: Na2O = 61.98 g/mol)
      // Na2CO3 (105.99 g/mol) -> 61.98 / 105.99 = 0.5848 (58.48% Na2O eq)
      // Na2SiO3 anhydrous (122.06 g/mol) -> 61.98 / 122.06 = 0.5078 (50.78% Na2O eq)
      // NaOH (39.997 g/mol) -> 0.5 * 61.98 / 39.997 = 0.7748 (77.48% Na2O eq)
      let contribution = 0;
      if (name.includes('soda ash') || name.includes('sodium carbonate')) {
        contribution = pct * 0.5848;
      } else if (name.includes('metasilicate')) {
        contribution = pct * 0.5078;
      } else if (name.includes('sodium hydroxide') || name.includes('caustic')) {
        contribution = pct * 0.7748;
      } else if (name.includes('sodium silicate')) {
        contribution = pct * 0.35; // Standard 2.0-2.4 ratio silicate powder
      }

      estimatedNa2O += contribution;
      totalAlkalinePct += pct;

      alkalineIngredients.push({
        name: ing.name,
        percentage: Number(pct.toFixed(2)),
        contributionNa2O: Number(contribution.toFixed(2))
      });
    }
  });

  const estimatedNa2OEquivalentPct = Number(estimatedNa2O.toFixed(2));
  const measuredAlkalinity = labInputs?.measuredReserveAlkalinityPctNa2O;

  let reserveStatus = '';
  if (measuredAlkalinity !== undefined && measuredAlkalinity > 0) {
    reserveStatus = `Measured laboratory reserve alkalinity is ${measuredAlkalinity.toFixed(2)}% Na₂O equivalent (Acidimetric titration to methyl orange / pH 4.0).`;
  } else if (totalAlkalinePct > 20) {
    reserveStatus = `High alkaline reserve (${estimatedNa2OEquivalentPct}% Na₂O equivalent). Saponifies fatty soils, neutralizes acidic dirt, and activates ionic builders.`;
  } else if (totalAlkalinePct > 5) {
    reserveStatus = `Moderate alkaline reserve (${estimatedNa2OEquivalentPct}% Na₂O equivalent). Suitable for standard multi-fabric laundry wash.`;
  } else {
    reserveStatus = 'Low / mild alkaline reserve. Delicate or neutral powder matrix.';
  }

  return {
    totalAlkalineContributorsPct: Number(totalAlkalinePct.toFixed(2)),
    alkalineIngredients,
    estimatedNa2OEquivalentPct,
    measuredAlkalinityPctNa2O: measuredAlkalinity,
    measuredAlkalinityMethod: measuredAlkalinity !== undefined ? 'Acidimetric Titration to Methyl Orange End-point (pH 4.0)' : undefined,
    alkalineReserveStatus: reserveStatus,
    source: measuredAlkalinity !== undefined ? 'MEASURED' : alkalineIngredients.length > 0 ? 'CALCULATED' : 'NOT_APPLICABLE'
  };
}
