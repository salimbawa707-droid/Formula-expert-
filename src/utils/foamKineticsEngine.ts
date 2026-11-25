/**
 * ENG-005 — measured foam decay analysis.
 *
 * This module analyses measured time-series data only. It does NOT predict foam
 * formation or stability from a detergent recipe, ingredient list, surfactant
 * class, or water hardness. Its regressions are descriptive fits to supplied
 * observations and must not be treated as a calibrated formulation model.
 */

export interface FoamDecayPoint {
  timeSeconds: number;
  /** Measured top-of-foam height above a fixed reference, in mm. */
  foamTopHeightMm: number;
  /** Optional measured liquid meniscus height above the same reference, in mm. */
  liquidLevelHeightMm?: number;
  /** Optional mean bubble cross-sectional area, in mm². */
  meanBubbleAreaMm2?: number;
}

export interface FoamDecayReplicate {
  replicateId: string;
  points: FoamDecayPoint[];
}

export interface LinearFit {
  intercept: number;
  slope: number;
  rSquared: number | null;
  pointCount: number;
}

export interface FoamDecayAnalysisOptions {
  /**
   * Caller-supplied start of a justified late-time log regime.
   * The 12,000 s boundary reported by Izawa et al. (2026) is specific to their
   * experiment and must be passed explicitly; it is not a universal constant.
   */
  logRegimeStartSeconds?: number;
  /** Caller-supplied end of the interval used for a linear bubble-area fit. */
  bubbleAreaFitEndSeconds?: number;
}

export interface FoamDecayAnalysis {
  replicateId: string;
  pointCount: number;
  initialFoamHeightMm: number;
  finalFoamHeightMm: number;
  halfHeightTimeSeconds: number | null;
  lateLogHeightFit: LinearFit | null;
  bubbleAreaGrowthFit: LinearFit | null;
  warnings: string[];
  scope: 'MEASURED_SERIES_ANALYSIS_ONLY';
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number.`);
  }
}

function fitLinear(x: number[], y: number[]): LinearFit | null {
  if (x.length !== y.length || x.length < 2) return null;
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
  const denominator = x.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  if (denominator === 0) return null;

  const slope = x.reduce((sum, value, index) => sum + (value - meanX) * (y[index] - meanY), 0) / denominator;
  const intercept = meanY - slope * meanX;
  const residualSumSquares = y.reduce((sum, value, index) => sum + (value - (intercept + slope * x[index])) ** 2, 0);
  const totalSumSquares = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  const rSquared = totalSumSquares === 0
    ? (residualSumSquares === 0 ? 1 : null)
    : 1 - residualSumSquares / totalSumSquares;

  return { intercept, slope, rSquared, pointCount: x.length };
}

function interpolateHalfHeightTime(points: Array<{ timeSeconds: number; foamHeightMm: number }>): number | null {
  if (points.length < 2) return null;
  const target = points[0].foamHeightMm / 2;
  if (points[0].foamHeightMm === 0) return points[0].timeSeconds;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous.foamHeightMm >= target && current.foamHeightMm <= target) {
      const heightDelta = current.foamHeightMm - previous.foamHeightMm;
      if (heightDelta === 0) return current.timeSeconds;
      const fraction = (target - previous.foamHeightMm) / heightDelta;
      return previous.timeSeconds + fraction * (current.timeSeconds - previous.timeSeconds);
    }
  }
  return null;
}

export function analyzeFoamDecayReplicate(
  replicate: FoamDecayReplicate,
  options: FoamDecayAnalysisOptions = {}
): FoamDecayAnalysis {
  if (!replicate.replicateId.trim()) throw new Error('replicateId is required.');
  if (!Array.isArray(replicate.points) || replicate.points.length < 2) {
    throw new Error('At least two measured time points are required.');
  }
  if (options.logRegimeStartSeconds !== undefined) {
    assertFiniteNonNegative(options.logRegimeStartSeconds, 'logRegimeStartSeconds');
  }
  if (options.bubbleAreaFitEndSeconds !== undefined) {
    assertFiniteNonNegative(options.bubbleAreaFitEndSeconds, 'bubbleAreaFitEndSeconds');
  }

  const points = replicate.points.map((point, index) => {
    assertFiniteNonNegative(point.timeSeconds, `points[${index}].timeSeconds`);
    assertFiniteNonNegative(point.foamTopHeightMm, `points[${index}].foamTopHeightMm`);
    if (point.liquidLevelHeightMm !== undefined) {
      assertFiniteNonNegative(point.liquidLevelHeightMm, `points[${index}].liquidLevelHeightMm`);
    }
    if (point.meanBubbleAreaMm2 !== undefined) {
      assertFiniteNonNegative(point.meanBubbleAreaMm2, `points[${index}].meanBubbleAreaMm2`);
    }
    const foamHeightMm = point.foamTopHeightMm - (point.liquidLevelHeightMm ?? 0);
    if (foamHeightMm < 0) throw new Error('Liquid level cannot exceed foam top height.');
    return { ...point, foamHeightMm };
  }).sort((a, b) => a.timeSeconds - b.timeSeconds);

  for (let index = 1; index < points.length; index += 1) {
    if (points[index].timeSeconds === points[index - 1].timeSeconds) {
      throw new Error('Duplicate timeSeconds values are not allowed within a replicate.');
    }
  }

  const warnings: string[] = [];
  const logPoints = options.logRegimeStartSeconds === undefined
    ? []
    : points.filter(point => point.timeSeconds >= options.logRegimeStartSeconds! && point.timeSeconds > 0);
  const lateLogHeightFit = logPoints.length >= 3
    ? fitLinear(logPoints.map(point => Math.log10(point.timeSeconds)), logPoints.map(point => point.foamHeightMm))
    : null;

  if (options.logRegimeStartSeconds !== undefined && !lateLogHeightFit) {
    warnings.push('Insufficient distinct positive-time points for the requested late-time log fit.');
  }

  const bubblePoints = options.bubbleAreaFitEndSeconds === undefined
    ? []
    : points.filter(point => point.timeSeconds > 0 &&
      point.timeSeconds <= options.bubbleAreaFitEndSeconds! &&
      point.meanBubbleAreaMm2 !== undefined);
  const bubbleAreaGrowthFit = bubblePoints.length >= 3
    ? fitLinear(bubblePoints.map(point => point.timeSeconds), bubblePoints.map(point => point.meanBubbleAreaMm2!))
    : null;

  if (options.bubbleAreaFitEndSeconds !== undefined && !bubbleAreaGrowthFit) {
    warnings.push('Insufficient bubble-area observations for the requested linear growth fit.');
  }
  if (!points.some(point => point.liquidLevelHeightMm !== undefined)) {
    warnings.push('Foam height uses foamTopHeightMm directly because no liquid-level series was supplied.');
  }

  return {
    replicateId: replicate.replicateId,
    pointCount: points.length,
    initialFoamHeightMm: points[0].foamHeightMm,
    finalFoamHeightMm: points[points.length - 1].foamHeightMm,
    halfHeightTimeSeconds: interpolateHalfHeightTime(points),
    lateLogHeightFit,
    bubbleAreaGrowthFit,
    warnings,
    scope: 'MEASURED_SERIES_ANALYSIS_ONLY',
  };
}
