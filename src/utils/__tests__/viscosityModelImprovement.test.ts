import { ViscosityEngine } from '../viscosityEngine';
import { FormulationIngredient } from '../../types';

export function runViscosityModelImprovementTestSuite() {
  const results: { name: string; passed: boolean; actual: any; expected: any }[] = [];

  function assert(name: string, condition: boolean, actual: any, expected: any) {
    results.push({ name, passed: condition, actual, expected });
  }

  // 1. Baseline: SLES-based dishwash
  const slesDishwash: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, category: 'Anionic Surfactant' }, // 7% active
    { name: 'CAPB 30%', percentage: 4, category: 'Amphoteric Surfactant' }, // 1.2% active
    { name: 'Sodium Chloride', percentage: 1.5, category: 'Electrolyte' },
    { name: 'Water', percentage: 84.5, category: 'Solvent' }
  ];
  const reportSles = ViscosityEngine.evaluateViscosity(slesDishwash);

  // 2. Baseline: LABSA-based dishwash
  const labsaDishwash: FormulationIngredient[] = [
    { name: 'LABSA 90%', percentage: 7.7, category: 'Anionic Surfactant' }, // 7% active
    { name: 'CAPB 30%', percentage: 4, category: 'Amphoteric Surfactant' }, // 1.2% active
    { name: 'Sodium Chloride', percentage: 1.5, category: 'Electrolyte' },
    { name: 'Water', percentage: 86.8, category: 'Solvent' }
  ];
  const reportLabsa = ViscosityEngine.evaluateViscosity(labsaDishwash);

  assert('SLES vs LABSA baseline prediction (SLES formulation is structured)', reportSles.viscosityCp > 100, { slesCp: reportSles.viscosityCp }, 'SLES Cp > 100');
  assert('LABSA vs LABSA baseline prediction (LABSA formulation is structured)', reportLabsa.viscosityCp > 100, { labsaCp: reportLabsa.viscosityCp }, 'LABSA Cp > 100');

  // 3. Unknown surfactant: Should return lower confidence
  const unknownSurfactant: FormulationIngredient[] = [
    { name: 'Exotic-Non-Existent-Chemical', percentage: 10, category: 'Unknown' } // Explicitly trigger missing
  ];
  const reportUnknown = ViscosityEngine.evaluateViscosity(unknownSurfactant);
  assert('Unknown surfactant confidence is Low', reportUnknown.confidence === 'Low' || reportUnknown.confidence === 'Medium', reportUnknown.confidence, 'Low or Medium');

  // 4. Powder/Solid inapplicability
  const powder: FormulationIngredient[] = [
    { name: 'Soda Ash', percentage: 100, category: 'Builder' }
  ];
  const reportPowder = ViscosityEngine.evaluateViscosity(powder, { productCategory: 'Washing Powder' });
  assert('Powder viscosity is not applicable', reportPowder.viscosityCp === 0 && reportPowder.isFluid === false, { cp: reportPowder.viscosityCp, isFluid: reportPowder.isFluid }, '0 and false');

  console.log('Results:', results);
  return results;
}

runViscosityModelImprovementTestSuite();
