import { calculateDensity } from '../densityEngine';

export function runDensityEngineRegressionTestSuite() {
  const results: Array<{ name: string; passed: boolean; actual?: unknown; expected?: unknown }> = [];
  const assert = (name: string, passed: boolean, actual?: unknown, expected?: unknown) => {
    results.push({ name, passed, actual, expected });
  };

  const empty = calculateDensity([]);
  assert('Empty formula does not inherit pure-water density', empty.densityStatus === 'INSUFFICIENT_DATA' && Number.isNaN(empty.densityGPerCm3), empty.densityStatus, 'INSUFFICIENT_DATA');
  assert('Empty formula has no measured/predicted density value', Number.isNaN(empty.densityGPerCm3), empty.densityGPerCm3, 'NaN');

  const unknown = calculateDensity([
    { name: 'Water', percentage: 95 } as any,
    { name: 'Unregistered Proprietary Blend', percentage: 5 } as any
  ], 100);
  assert('Unknown component density blocks final mixture density', unknown.densityStatus === 'INSUFFICIENT_DATA', unknown.densityStatus, 'INSUFFICIENT_DATA');
  assert('Unknown component is explicitly reported', unknown.unknownDensityIngredients?.includes('Unregistered Proprietary Blend') === true, unknown.unknownDensityIngredients, ['Unregistered Proprietary Blend']);

  const referenceEstimate = calculateDensity([
    { name: 'Water', percentage: 95 } as any,
    { name: 'Sodium Carbonate', percentage: 5 } as any
  ], 100);
  assert('Generic reference densities are screening estimates, not high-confidence values', referenceEstimate.densityStatus === 'SCREENING_ESTIMATE' && referenceEstimate.confidence === 'LOW' && referenceEstimate.provenance === 'ESTIMATED', { status: referenceEstimate.densityStatus, confidence: referenceEstimate.confidence, provenance: referenceEstimate.provenance }, { status: 'SCREENING_ESTIMATE', confidence: 'LOW', provenance: 'ESTIMATED' });

  const unbalanced = calculateDensity([
    { name: 'Water', percentage: 95 } as any
  ], 100);
  assert('Unbalanced composition cannot yield final mixture density', unbalanced.densityStatus === 'INSUFFICIENT_DATA', unbalanced.densityStatus, 'INSUFFICIENT_DATA');

  const invalidBatch = calculateDensity([
    { name: 'Water', percentage: 100 } as any
  ], 0);
  assert('Invalid batch mass cannot be replaced with a water baseline', invalidBatch.densityStatus === 'INSUFFICIENT_DATA' && Number.isNaN(invalidBatch.densityGPerCm3), invalidBatch.densityStatus, 'INSUFFICIENT_DATA');

  const passed = results.filter(result => result.passed).length;
  return { passed, failed: results.length - passed, total: results.length, results };
}
