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
  batchSizeKg?: number,
  labInputs?: PowderLabMeasurementInputs
): PowderMoistureReport {
  const validBatchSize =
    typeof batchSizeKg === 'number' &&
    Number.isFinite(batchSizeKg) &&
    batchSizeKg > 0;

  if (!validBatchSize) {
    return {
      totalFormulaMassKg: null,
      moistureMassKg: null,
      dryMatterMassKg: null,
      inherentMoisturePct: null,
      moisturePct: null,
      dryMatterPct: null,
      moistureStatus: 'INSUFFICIENT_DATA',
      dryMatterStatus: 'INSUFFICIENT_DATA',
      basisExplanation: 'Invalid or unavailable batch mass.',
      ingredientMoistureContributions: [],
      source: 'INSUFFICIENT_DATA'
    };
  }

  const totalFormulaMassKg = batchSizeKg;

  // 1. If laboratory measured moisture is provided
  if (labInputs?.measuredMoisturePct !== undefined && Number.isFinite(labInputs.measuredMoisturePct) && labInputs.measuredMoisturePct >= 0 && labInputs.measuredMoisturePct <= 100) {
    const moisturePct = Number(labInputs.measuredMoisturePct.toFixed(4));
    const dryMatterPct = Number(Math.max(0, 100 - moisturePct).toFixed(4));
    const moistureMassKg = Number((totalFormulaMassKg * (moisturePct / 100)).toFixed(6));
    const dryMatterMassKg = Number((totalFormulaMassKg * (dryMatterPct / 100)).toFixed(6));

    const testMethod = labInputs.moistureTestMethod?.trim() || undefined;
    const sampleMassG = labInputs.moistureSampleMassG;
    const dryingTempC = labInputs.moistureTempC;
    const dryingTimeMin = labInputs.moistureTimeMin;

    return {
      totalFormulaMassKg,
      moistureMassKg,
      dryMatterMassKg,
      inherentMoisturePct: moisturePct,
      moisturePct,
      dryMatterPct,
      moistureStatus: 'MEASURED',
      dryMatterStatus: 'DERIVED',
      testMethod,
      sampleMassG,
      dryingTempC,
      dryingTimeMin,
      basisExplanation: `Laboratory measured finished powder moisture is ${moisturePct}%${testMethod ? ` (${testMethod})` : ''}, yielding ${dryMatterPct}% Dry Matter.`,
      ingredientMoistureContributions: [],
      source: 'MEASURED'
    };
  }

  // 2. No valid lab measurement available. Return insufficient data.
  return {
    totalFormulaMassKg,
    moistureMassKg: null,
    dryMatterMassKg: null,
    inherentMoisturePct: null,
    moisturePct: null,
    dryMatterPct: null,
    moistureStatus: 'INSUFFICIENT_DATA',
    dryMatterStatus: 'INSUFFICIENT_DATA',
    testMethod: 'NONE',
    basisExplanation: 'Finished-product moisture measurement is unavailable. Ingredient-based estimation is not scientifically defensible.',
    ingredientMoistureContributions: [],
    source: 'INSUFFICIENT_DATA'
  };
}
