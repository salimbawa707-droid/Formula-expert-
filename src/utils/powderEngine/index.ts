import {
  PowderEngineInput,
  PowderFormulationReport
} from './types';
import { calculatePowderMassBalance } from './powderMassBalance';
import { calculatePowderMoistureAndDryMatter } from './powderMoistureDryMatter';
import { classifyAllPowderIngredients } from './powderIngredientClassification';
import { calculatePowderActiveMatter } from './powderActiveMatter';
import {
  calculatePowderAlkalinity,
  calculatePowderBuilderSystem,
  calculatePowderChelationSystem
} from './powderBuilderChelationAlkalinity';
import {
  calculatePowderAngleOfRepose,
  calculatePowderCakingAndHygroscopicity,
  calculatePowderDensity,
  calculatePowderFlowability,
  calculatePowderParticleSize
} from './powderPhysicalProperties';
import { calculatePowderHardWaterPerformance, calculatePowderPH } from './powderPHHardWater';
import {
  calculatePowderCleaningPerformance,
  calculatePowderDissolution,
  calculatePowderFoam,
  calculatePowderSafety,
  calculatePowderStability
} from './powderPerformanceStabilitySafety';
import { calculatePowderCosting } from './powderCosting';
import { evaluatePowderVerdict } from './powderVerdict';

export * from './types';
export {
  calculatePowderMassBalance,
  calculatePowderMoistureAndDryMatter,
  classifyAllPowderIngredients,
  calculatePowderActiveMatter,
  calculatePowderBuilderSystem,
  calculatePowderChelationSystem,
  calculatePowderAlkalinity,
  calculatePowderDensity,
  calculatePowderFlowability,
  calculatePowderAngleOfRepose,
  calculatePowderParticleSize,
  calculatePowderCakingAndHygroscopicity,
  calculatePowderPH,
  calculatePowderHardWaterPerformance,
  calculatePowderDissolution,
  calculatePowderFoam,
  calculatePowderCleaningPerformance,
  calculatePowderStability,
  calculatePowderSafety,
  calculatePowderCosting,
  evaluatePowderVerdict
};

/**
 * Authoritative Master Evaluator for the Powder Formulation Engine.
 * Strictly isolated from Liquid Formulation Engine assumptions.
 */
export function evaluatePowderFormulation(input: PowderEngineInput): PowderFormulationReport {
  const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
  const productCategory = input.productCategory || 'Laundry Powder';
  const batchSizeKg = (input.batchSizeKg !== undefined && input.batchSizeKg > 0) ? input.batchSizeKg : 100;
  const waterHardnessPpm = (input.waterHardnessPpm !== undefined && input.waterHardnessPpm >= 0) ? input.waterHardnessPpm : 150;
  const washDoseG = (input.washDoseG !== undefined && input.washDoseG > 0) ? input.washDoseG : 50;
  const washVolumeL = (input.washLiquorVolumeL !== undefined && input.washLiquorVolumeL > 0) ? input.washLiquorVolumeL : 10;
  const labMeasurements = input.labMeasurements;

  // 1. Mass Balance
  const massBalance = calculatePowderMassBalance(ingredients);

  // 2. Functional Classification
  const classification = classifyAllPowderIngredients(ingredients);

  // 3. Active Matter
  const activeMatter = calculatePowderActiveMatter(classification.ingredients);

  // 4. Moisture & Dry Matter
  const moistureAndDryMatter = calculatePowderMoistureAndDryMatter(ingredients, massBalance, batchSizeKg, labMeasurements);

  // 5. Builder System
  const builderSystem = calculatePowderBuilderSystem(classification.ingredients);

  // 6. Chelation & Sequestration
  const chelationSequestration = calculatePowderChelationSystem(classification.ingredients, washDoseG, washVolumeL);

  // 7. Alkalinity
  const alkalinity = calculatePowderAlkalinity(classification.ingredients, labMeasurements);

  // 8. Density
  const density = calculatePowderDensity(classification.ingredients, labMeasurements);

  // 9. Flowability & Carr / Hausner
  const flowability = calculatePowderFlowability(density, labMeasurements);

  // 10. Angle of Repose
  const angleOfRepose = calculatePowderAngleOfRepose(labMeasurements);

  // 11. Particle Size
  const particleSize = calculatePowderParticleSize(labMeasurements);

  // 12. Caking & Hygroscopicity
  const { caking: cakingHygroscopicity, hygroscopicity } = calculatePowderCakingAndHygroscopicity(classification.ingredients);

  // 13. Powder pH (1% Aqueous Test Basis)
  const powderPH = calculatePowderPH(classification.ingredients, productCategory, labMeasurements);

  // 14. Hard Water Performance
  const hardWater = calculatePowderHardWaterPerformance(classification.ingredients, waterHardnessPpm, washDoseG, washVolumeL);

  // 15. Dissolution & Dispersibility
  const dissolutionDispersibility = calculatePowderDissolution(classification.ingredients, labMeasurements);

  // 16. Foam Profile
  const foam = calculatePowderFoam(classification.ingredients, productCategory, labMeasurements);

  // 17. Cleaning Performance Screening
  const cleaningPerformance = calculatePowderCleaningPerformance(classification.ingredients, activeMatter.totalSurfactantActivePct, labMeasurements);

  // 18. Stability
  const stability = calculatePowderStability(classification.ingredients);

  // 19. Safety
  const safety = calculatePowderSafety(classification.ingredients);

  // 20. Costing
  const costing = calculatePowderCosting(classification.ingredients, batchSizeKg, washDoseG);

  // 21. Verdict & Expert Reasoner
  const verdict = evaluatePowderVerdict({
    massBalance,
    activeMatter,
    builderSystem,
    alkalinity,
    caking: cakingHygroscopicity,
    powderPH,
    stability,
    safety,
    productCategory
  });

  return {
    massBalance,
    classification,
    activeMatter,
    moistureAndDryMatter,
    builderSystem,
    chelationSequestration,
    alkalinity,
    density,
    flowability,
    angleOfRepose,
    particleSize,
    cakingHygroscopicity,
    hygroscopicity,
    powderPH,
    hardWater,
    dissolutionDispersibility,
    foam,
    cleaningPerformance,
    stability,
    safety,
    costing,
    verdict
  };
}
