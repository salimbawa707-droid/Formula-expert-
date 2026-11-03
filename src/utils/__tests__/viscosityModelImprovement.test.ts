import { ViscosityEngine } from '../viscosityEngine';
import { FormulationIngredient } from '../../types';

export function runViscosityModelImprovementTestSuite() {
  const results: { name: string; passed: boolean; actual: any; expected: any }[] = [];

  function assert(name: string, condition: boolean, actual: any, expected: any) {
    results.push({ name, passed: condition, actual, expected });
  }

  // 1. Baseline: SLES-based dishwash
  const slesDishwash: FormulationIngredient[] = [
    { name: 'SLES 70%', percentage: 10, activeMatterPct: 70, category: 'Anionic Surfactant' }, // 7% active
    { name: 'CAPB 30%', percentage: 4, activeMatterPct: 30, category: 'Amphoteric Surfactant' }, // 1.2% active
    { name: 'Sodium Chloride', percentage: 1.5, category: 'Electrolyte' },
    { name: 'Water', percentage: 84.5, category: 'Solvent' }
  ];
  const reportSles = ViscosityEngine.evaluateViscosity(slesDishwash);

  // 2. Baseline: LABSA-based dishwash
  const labsaDishwash: FormulationIngredient[] = [
    { name: 'LABSA 90%', percentage: 7.7, activeMatterPct: 90, category: 'Anionic Surfactant' }, // 7% active
    { name: 'CAPB 30%', percentage: 4, category: 'Amphoteric Surfactant' }, // 1.2% active
    { name: 'Sodium Chloride', percentage: 1.5, category: 'Electrolyte' },
    { name: 'Water', percentage: 86.8, category: 'Solvent' }
  ];
  const reportLabsa = ViscosityEngine.evaluateViscosity(labsaDishwash);

  assert('SLES baseline with unassayed CAPB is withheld', reportSles.confidence === 'Low' && Number.isFinite(reportSles.viscosityCp) && reportSles.dataSource === 'model_derived', { confidence: reportSles.confidence, slesCp: reportSles.viscosityCp, diagnostics: reportSles.diagnostics }, 'Low-confidence model_derived screening only until CAPB assay and bench viscosity are verified');
  assert('LABSA baseline with unassayed CAPB and no neutralization evidence is withheld', reportLabsa.confidence === 'Low' && Number.isFinite(reportLabsa.viscosityCp) && reportLabsa.dataSource === 'model_derived', { confidence: reportLabsa.confidence, labsaCp: reportLabsa.viscosityCp, diagnostics: reportLabsa.diagnostics }, 'Low-confidence model_derived screening only; not a measured or verified viscosity');

  // 3. Unknown surfactant: Should return lower confidence
  const unknownSurfactant: FormulationIngredient[] = [
    { name: 'Exotic-Non-Existent-Chemical', percentage: 10, category: 'Unknown' } // Explicitly trigger missing
  ];
  const reportUnknown = ViscosityEngine.evaluateViscosity(unknownSurfactant);
  assert('Unknown surfactant is explicitly unsupported rather than assigned guessed rheology', reportUnknown.confidence === 'Unsupported' && !Number.isFinite(reportUnknown.viscosityCp), { confidence: reportUnknown.confidence, viscosityCp: reportUnknown.viscosityCp, diagnostics: reportUnknown.diagnostics }, 'Unsupported / unavailable');

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
