/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - NUMERICAL EQUILIBRIUM SOLVER
 * ============================================================================
 * High-precision safeguarded root-finder solving the electroneutrality charge
 * balance equation F(pH) = 0 using Safeguarded Newton-Raphson with bracketed bisection fallback.
 * ============================================================================
 */

import { EquilibriumSystem } from './equilibriumSystem';
import { NormalizedComposition, NumericalSolverResult, SolverStepLog } from './types';

export class NumericalEquilibriumSolver {
  static readonly DEFAULT_TOLERANCE = 1e-7;
  static readonly DEFAULT_MAX_ITERATIONS = 50;
  static readonly MIN_PH_BOUND = -1.0;
  static readonly MAX_PH_BOUND = 15.0;

  /**
   * Solves the charge balance equation F(pH) = 0 for the given composition.
   */
  static solve(
    composition: NormalizedComposition,
    temperatureC: number = 25.0,
    options?: { tolerance?: number; maxIterations?: number; initialGuess?: number }
  ): NumericalSolverResult {
    const tol = options?.tolerance ?? NumericalEquilibriumSolver.DEFAULT_TOLERANCE;
    const maxIter = options?.maxIterations ?? NumericalEquilibriumSolver.DEFAULT_MAX_ITERATIONS;

    // Evaluate charge balance function wrapper
    const f = (phVal: number): number => {
      const evalRes = EquilibriumSystem.evaluateChargeBalance(phVal, composition, temperatureC);
      return evalRes.residual;
    };

    // 1. Initial bracketing search
    let a = NumericalEquilibriumSolver.MIN_PH_BOUND;
    let b = NumericalEquilibriumSolver.MAX_PH_BOUND;
    let fa = f(a);
    let fb = f(b);

    // Safeguard check: if either boundary is already within tolerance
    if (Math.abs(fa) <= tol) {
      return {
        pH: Number(a.toFixed(4)),
        status: 'CONVERGED',
        converged: true,
        iterations: 1,
        residual: fa,
        stepSize: 0,
        method: 'Boundary solution'
      };
    }
    if (Math.abs(fb) <= tol) {
      return {
        pH: Number(b.toFixed(4)),
        status: 'CONVERGED',
        converged: true,
        iterations: 1,
        residual: fb,
        stepSize: 0,
        method: 'Boundary solution'
      };
    }

    // Since F(pH) is monotonically decreasing with pH (dF/dpH < 0),
    // fa should be positive (acidic) and fb should be negative (alkaline).
    // If not bracketed due to extreme composition, expand or clamp
    if (fa * fb > 0) {
      // Check if neutral pH gives 0 residual (pure water or perfectly balanced inert)
      const f7 = f(7.0);
      if (Math.abs(f7) < 1e-6) {
        return {
          pH: 7.00,
          status: 'CONVERGED',
          converged: true,
          iterations: 1,
          residual: f7,
          stepSize: 0,
          method: 'Neutral equivalence'
        };
      }

      // If both negative or both positive, try wider search
      let foundBracket = false;
      const searchPoints = [-3.0, -1.0, 0.0, 2.0, 4.0, 7.0, 10.0, 12.0, 14.0, 16.0];
      for (let i = 0; i < searchPoints.length - 1; i++) {
        const p1 = searchPoints[i];
        const p2 = searchPoints[i + 1];
        const fp1 = f(p1);
        const fp2 = f(p2);
        if (fp1 * fp2 <= 0) {
          a = p1;
          b = p2;
          fa = fp1;
          fb = fp2;
          foundBracket = true;
          break;
        }
      }

      if (!foundBracket) {
        return {
          pH: Math.abs(fa) < Math.abs(fb) ? a : b,
          status: 'NON_CONVERGED',
          converged: false,
          iterations: 0,
          residual: Math.min(Math.abs(fa), Math.abs(fb)),
          stepSize: 0,
          method: 'Failed to bracket root'
        };
      }
    }

    // 2. Safeguarded Newton-Raphson Solver with Bracketed Bisection Fallback
    let currentPH = options?.initialGuess !== undefined
      ? Math.max(a, Math.min(b, options.initialGuess))
      : 7.0;

    let fCurrent = f(currentPH);
    let iterations = 0;
    let stepSize = 0;
    const stepLogs: SolverStepLog[] = [];

    // Initialize bracketing variables
    let low = fa > 0 ? a : b;
    let high = fa > 0 ? b : a;
    let fLow = f(low);

    while (iterations < maxIter) {
      iterations++;

      // Check convergence criteria
      if (Math.abs(fCurrent) <= tol || Math.abs(high - low) <= 1e-6) {
        return {
          pH: Number(currentPH.toFixed(4)),
          status: 'CONVERGED',
          converged: true,
          iterations,
          residual: fCurrent,
          stepSize,
          method: 'Safeguarded Newton-Raphson with Bracketed Bisection Fallback',
          log: stepLogs
        };
      }

      // Calculate numerical derivative via central difference
      const eps = 1e-4;
      const df = (f(currentPH + eps) - f(currentPH - eps)) / (2 * eps);

      let nextPH: number;
      let methodUsed: 'newton' | 'bisection' = 'newton';

      if (Math.abs(df) > 1e-12) {
        // Newton step
        const delta = -fCurrent / df;
        const candidate = currentPH + delta;

        // Check if candidate lies safely inside the bracket [min(low, high), max(low, high)]
        const minB = Math.min(low, high);
        const maxB = Math.max(low, high);

        if (candidate > minB && candidate < maxB && Math.abs(delta) < Math.abs(high - low)) {
          // Robustness: limit step to 80% of bracket width to prevent erratic oscillation
          const limit = 0.8 * Math.abs(high - low);
          nextPH = currentPH + Math.max(-limit, Math.min(limit, delta));
          stepSize = Math.abs(nextPH - currentPH);
          methodUsed = 'newton';
        } else {
          // Fall back to bisection
          nextPH = 0.5 * (low + high);
          stepSize = Math.abs(nextPH - currentPH);
          methodUsed = 'bisection';
        }
      } else {
        // Bisection fallback
        nextPH = 0.5 * (low + high);
        stepSize = Math.abs(nextPH - currentPH);
        methodUsed = 'bisection';
      }

      // Evaluate new residual
      const fNext = f(nextPH);

      stepLogs.push({
        iteration: iterations,
        currentPH: nextPH,
        residual: fNext,
        stepSize,
        method: methodUsed
      });

      // Update bracket
      if (fNext * fLow > 0) {
        low = nextPH;
        fLow = fNext;
      } else {
        high = nextPH;
      }

      currentPH = nextPH;
      fCurrent = fNext;
    }

    // Max iterations reached
    const converged = Math.abs(fCurrent) <= tol * 10;
    return {
      pH: Number(currentPH.toFixed(4)),
      status: converged ? 'CONVERGED' : 'NON_CONVERGED',
      converged,
      iterations,
      residual: fCurrent,
      stepSize,
      method: 'Safeguarded Newton-Raphson with Bracketed Bisection Fallback',
      log: stepLogs
    };
  }
}
