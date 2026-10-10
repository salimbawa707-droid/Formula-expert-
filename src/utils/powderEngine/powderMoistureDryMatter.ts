import { FormulationIngredient } from '../../types';
import {
  PowderLabMeasurementInputs,
  PowderMassBalanceReport,
  PowderMoistureContribution,
  PowderMoistureReport,
  ResultSource
} from './types';

/**
 * Powder Moisture & Dry Matter Engine
 * 
 * Accurately models and distinguishes:
 * 1. Formulation Mass Balance (Total raw materials assigned in batch)
 * 2. Inherent raw-material hydration / crystal moisture contributions
 * 3. Laboratory measured moisture (Loss on Drying @ 105°C / Karl Fischer Titration)
 * 4. Calculated Dry Matter Mass & Dry Matter Percentage:
 *    Dry Matter % = 100 - Moisture %
 *    Dry Matter Mass (kg) = Total Batch Mass (kg) * (Dry Matter % / 100)
 */
export function calculatePowderMoistureAndDryMatter(
  ingredients: FormulationIngredient[],
  massBalance: PowderMassBalanceReport,
  batchSizeKg: number = 100,
  labInputs?: PowderLabMeasurementInputs
): PowderMoistureReport {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  const totalFormulaMassKg = batchSizeKg > 0 ? batchSizeKg : 100;

  // 1. If laboratory measured moisture is provided
  if (labInputs?.measuredMoisturePct !== undefined && labInputs.measuredMoisturePct >= 0) {
    const moisturePct = Number(labInputs.measuredMoisturePct.toFixed(2));
    const dryMatterPct = Number(Math.max(0, 100 - moisturePct).toFixed(2));
    const moistureMassKg = Number((totalFormulaMassKg * (moisturePct / 100)).toFixed(3));
    const dryMatterMassKg = Number((totalFormulaMassKg * (dryMatterPct / 100)).toFixed(3));

    const testMethod = labInputs.moistureTestMethod || 'Loss on Drying at 105°C (ISO 760 / ASTM D1744)';
    const sampleMassG = labInputs.moistureSampleMassG || 10.0;
    const dryingTempC = labInputs.moistureTempC || 105;
    const dryingTimeMin = labInputs.moistureTimeMin || 60;

    return {
      totalFormulaMassKg,
      moistureMassKg,
      dryMatterMassKg,
      inherentMoisturePct: moisturePct,
      moisturePct,
      dryMatterPct,
      moistureStatus: 'MEASURED',
      dryMatterStatus: 'MEASURED',
      testMethod,
      sampleMassG,
      dryingTempC,
      dryingTimeMin,
      basisExplanation: `Laboratory measured finished powder moisture is ${moisturePct}% (${testMethod} on ${sampleMassG}g sample @ ${dryingTempC}°C for ${dryingTimeMin} min), yielding ${dryMatterPct}% Dry Matter (${dryMatterMassKg} kg dry solids per ${totalFormulaMassKg} kg batch).`,
      ingredientMoistureContributions: [],
      source: 'MEASURED'
    };
  }

  // 2. Calculate ingredient moisture contributions from known chemical raw material specs
  const contributions: PowderMoistureContribution[] = [];
  let inherentMoistureSum = 0;
  let knownIngredientsCount = 0;

  safeList.forEach((ing) => {
    const name = (ing.name || '').toLowerCase();
    const pctInFormula = Number((ing as any)?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0) || 0;
    if (pctInFormula <= 0) return;

    let ingredientMoisturePct = 0;
    let status: ResultSource = 'CALCULATED';

    if (name.includes('soda ash') || name.includes('sodium carbonate')) {
      ingredientMoisturePct = 0.5; // Commercial dense/light soda ash typical 0.2-0.5% max
      knownIngredientsCount++;
    } else if (name.includes('sodium sulfate') || name.includes('sodium chloride') || name.includes('salt')) {
      ingredientMoisturePct = 0.2; // Anhydrous salt typical 0.1-0.2% max
      knownIngredientsCount++;
    } else if (name.includes('zeolite')) {
      ingredientMoisturePct = 21.0; // Zeolite 4A contains ~20-22% bound crystalline water of hydration
      knownIngredientsCount++;
    } else if (name.includes('sodium silicate') && (name.includes('solid') || name.includes('powder') || name.includes('glass'))) {
      ingredientMoisturePct = 18.0; // Commercial hydrated disilicate powder ~18% moisture
      knownIngredientsCount++;
    } else if (name.includes('percarbonate')) {
      ingredientMoisturePct = 1.0; // Coated percarbonate typical ~1.0% moisture
      knownIngredientsCount++;
    } else if (name.includes('taed')) {
      ingredientMoisturePct = 1.5;
      knownIngredientsCount++;
    } else if (name.includes('labsa')) {
      const grade = Number((ing as any)?.activeMatterPct ?? (ing as any)?.activePercent ?? 90);
      ingredientMoisturePct = Math.max(0, 100 - grade); // Residual free water + sulfuric acid fraction
      knownIngredientsCount++;
    } else if (name.includes('sles')) {
      const grade = Number((ing as any)?.activeMatterPct ?? (ing as any)?.activePercent ?? 70);
      ingredientMoisturePct = Math.max(0, 100 - grade); // In slurry processing
      knownIngredientsCount++;
    } else if (name.includes('water') || name.includes('aqua')) {
      ingredientMoisturePct = 100.0;
      knownIngredientsCount++;
    } else if (name.includes('polymer') || name.includes('copolymer')) {
      ingredientMoisturePct = 6.0; // Standard spray-dried polycarboxylate powder ~6% moisture
      knownIngredientsCount++;
    } else if (name.includes('enzyme')) {
      ingredientMoisturePct = 5.0; // Encapsulated enzyme granulate ~5% moisture
      knownIngredientsCount++;
    } else if (name.includes('fragrance') || name.includes('perfume') || name.includes('speckle') || name.includes('cbs-x') || name.includes('brightener')) {
      ingredientMoisturePct = 0.5;
      knownIngredientsCount++;
    } else {
      ingredientMoisturePct = 1.0;
      status = 'ESTIMATED';
    }

    const moistureContributionPct = Number(((pctInFormula * ingredientMoisturePct) / 100).toFixed(3));
    inherentMoistureSum += moistureContributionPct;

    contributions.push({
      name: ing.name || 'Unnamed Ingredient',
      percentageInFormula: pctInFormula,
      ingredientMoisturePct,
      moistureContributionPct,
      status
    });
  });

  const formulaTotal = massBalance.formulaTotalPct > 0 ? massBalance.formulaTotalPct : 100;
  
  if (safeList.length === 0 || knownIngredientsCount === 0) {
    return {
      totalFormulaMassKg,
      moistureMassKg: 0,
      dryMatterMassKg: totalFormulaMassKg,
      inherentMoisturePct: 0,
      moisturePct: 0,
      dryMatterPct: 100,
      moistureStatus: 'INSUFFICIENT_DATA',
      dryMatterStatus: 'INSUFFICIENT_DATA',
      testMethod: 'Raw Material Crystal Water Stoichiometric Summation',
      basisExplanation: 'Insufficient validated moisture data for selected raw materials. Enter laboratory Loss on Drying (105°C) or Karl Fischer measurement.',
      ingredientMoistureContributions: [],
      source: 'INSUFFICIENT_DATA'
    };
  }

  // Normalized moisture % in the assigned finished blend
  const moisturePct = Number(((inherentMoistureSum / formulaTotal) * 100).toFixed(2));
  const dryMatterPct = Number(Math.max(0, 100 - moisturePct).toFixed(2));
  const moistureMassKg = Number((totalFormulaMassKg * (moisturePct / 100)).toFixed(3));
  const dryMatterMassKg = Number((totalFormulaMassKg * (dryMatterPct / 100)).toFixed(3));

  const hasEstimated = contributions.some((c) => c.status === 'ESTIMATED');
  const overallStatus: ResultSource = hasEstimated ? 'ESTIMATED' : 'CALCULATED';

  return {
    totalFormulaMassKg,
    moistureMassKg,
    dryMatterMassKg,
    inherentMoisturePct: moisturePct,
    moisturePct,
    dryMatterPct,
    moistureStatus: overallStatus,
    dryMatterStatus: overallStatus,
    testMethod: 'Calculated from Raw Material Crystal Hydration & Process Moisture Data',
    basisExplanation: `Calculated raw-material inherent moisture contribution is ${moisturePct}% (${moistureMassKg} kg moisture in ${totalFormulaMassKg} kg batch), yielding ${dryMatterPct}% Dry Matter (${dryMatterMassKg} kg dry solids). Note: Formula assignment % represents batch recipe loading, whereas Moisture % represents chemical water content.`,
    ingredientMoistureContributions: contributions,
    source: overallStatus
  };
}
