import { analyzeFoamDecayReplicate } from '../foamKineticsEngine';

export function runFoamKineticsEngineTestSuite() {
  const results: Array<{ name: string; passed: boolean; actual?: unknown; expected?: unknown }> = [];
  const assert = (name: string, condition: boolean, actual?: unknown, expected?: unknown) =>
    results.push({ name, passed: condition, actual, expected });

  const result = analyzeFoamDecayReplicate({
    replicateId: 'synthetic-half-height',
    points: [
      { timeSeconds: 0, foamTopHeightMm: 100, liquidLevelHeightMm: 10 },
      { timeSeconds: 10, foamTopHeightMm: 80, liquidLevelHeightMm: 10 },
      { timeSeconds: 20, foamTopHeightMm: 60, liquidLevelHeightMm: 10 },
      { timeSeconds: 30, foamTopHeightMm: 50, liquidLevelHeightMm: 10 },
    ],
  });
  assert('Uses foam height above liquid meniscus', result.initialFoamHeightMm === 90, result.initialFoamHeightMm, 90);
  assert('Interpolates half-height time', result.halfHeightTimeSeconds === 25, result.halfHeightTimeSeconds, 25);
  assert('Marks output as measured-series analysis only', result.scope === 'MEASURED_SERIES_ANALYSIS_ONLY', result.scope);

  const logFit = analyzeFoamDecayReplicate({
    replicateId: 'log-fit',
    points: [12000, 20000, 40000, 80000].map(timeSeconds => ({
      timeSeconds,
      foamTopHeightMm: 100 - 10 * Math.log10(timeSeconds),
    })),
  }, { logRegimeStartSeconds: 12000 });
  assert('Fits source-configured logarithmic late regime', Math.abs((logFit.lateLogHeightFit?.slope ?? 0) - -10) < 1e-10, logFit.lateLogHeightFit?.slope, -10);
  assert('Log-fit R-squared is one for exact synthetic data', Math.abs((logFit.lateLogHeightFit?.rSquared ?? 0) - 1) < 1e-10, logFit.lateLogHeightFit?.rSquared, 1);

  const bubbleFit = analyzeFoamDecayReplicate({
    replicateId: 'bubble-growth',
    points: [100, 500, 1000, 2000].map(timeSeconds => ({
      timeSeconds,
      foamTopHeightMm: 50,
      meanBubbleAreaMm2: 0.07 + 0.00115 * timeSeconds,
    })),
  }, { bubbleAreaFitEndSeconds: 2000 });
  assert('Fits linear bubble-area growth in caller-selected interval', Math.abs((bubbleFit.bubbleAreaGrowthFit?.slope ?? 0) - 0.00115) < 1e-12, bubbleFit.bubbleAreaGrowthFit?.slope, 0.00115);

  let duplicateRejected = false;
  try {
    analyzeFoamDecayReplicate({ replicateId: 'duplicate', points: [
      { timeSeconds: 1, foamTopHeightMm: 10 },
      { timeSeconds: 1, foamTopHeightMm: 9 },
    ] });
  } catch { duplicateRejected = true; }
  assert('Rejects duplicate time values', duplicateRejected, duplicateRejected, true);

  let negativeRejected = false;
  try {
    analyzeFoamDecayReplicate({ replicateId: 'negative', points: [
      { timeSeconds: 1, foamTopHeightMm: -1 },
      { timeSeconds: 2, foamTopHeightMm: 2 },
    ] });
  } catch { negativeRejected = true; }
  assert('Rejects negative measured heights', negativeRejected, negativeRejected, true);

  let invertedLevelRejected = false;
  try {
    analyzeFoamDecayReplicate({ replicateId: 'inverted', points: [
      { timeSeconds: 1, foamTopHeightMm: 5, liquidLevelHeightMm: 6 },
      { timeSeconds: 2, foamTopHeightMm: 4, liquidLevelHeightMm: 3 },
    ] });
  } catch { invertedLevelRejected = true; }
  assert('Rejects liquid level above foam top', invertedLevelRejected, invertedLevelRejected, true);

  return { passed: results.filter(result => result.passed).length, failed: results.filter(result => !result.passed).length, results };
}
