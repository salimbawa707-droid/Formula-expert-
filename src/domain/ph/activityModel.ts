/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - ACTIVITY MODEL & THERMODYNAMICS
 * ============================================================================
 * Computes ionic strength, ion activity coefficients (Davies / Debye-Hückel),
 * temperature-dependent water autoionization Kw(T), and reports model validity.
 * ============================================================================
 */

import { ActivityModelType, ModelValidityLevel } from './types';

export class ActivityModel {
  /**
   * Computes Debye-Hückel parameter A as a function of temperature in °C.
   * Standard value A = 0.5092 at 25°C (298.15 K).
   */
  static getDebyeHuckelA(temperatureC: number = 25.0): number {
    return 0.4918 + 0.000678 * temperatureC;
  }

  /**
   * Computes temperature-dependent water autoionization constant Kw.
   * At 25°C, Kw = 1.008e-14 (pKw = 13.9965).
   */
  static getWaterAutoionizationKw(temperatureC: number = 25.0): number {
    const T_K = temperatureC + 273.15;
    // Harned & Robinson thermodynamic equation for pKw of water:
    // pKw = 4470.99 / T_K - 6.0875 + 0.01706 * T_K
    const pKw = 4470.99 / T_K - 6.0875 + 0.01706 * T_K;
    return Math.pow(10, -pKw);
  }

  /**
   * Davies equation for calculating ion activity coefficient gamma_z.
   * Valid up to I ~ 0.5 M.
   */
  static daviesGamma(ionicStrength: number, charge: number, temperatureC: number = 25.0): number {
    if (ionicStrength <= 1e-6 || charge === 0) return 1.0;
    const zSq = charge * charge;
    const A = ActivityModel.getDebyeHuckelA(temperatureC);
    const sqrtI = Math.sqrt(ionicStrength);
    // Davies: log10(gamma) = -A * z^2 * ( sqrt(I)/(1 + sqrt(I)) - 0.3 * I )
    const logGamma = -A * zSq * ((sqrtI / (1.0 + sqrtI)) - 0.3 * ionicStrength);
    const gamma = Math.pow(10, logGamma);
    // Prevent numerical unphysical extremes
    return Math.max(0.01, Math.min(2.0, gamma));
  }

  /**
   * Extended Debye-Hückel equation for ion activity coefficient gamma_z.
   * log10(gamma) = -A * z^2 * sqrt(I) / (1 + B * a * sqrt(I))
   * Valid for dilute solutions (I <= 0.1 M).
   * Parameter B ≈ 0.3281 (10^8 cm^-1 mol^-1/2 L^1/2) at 25°C.
   * Default ion-size parameter a ≈ 3.5 Å (typical for small hydrated ions like Na+, Cl-, H+).
   */
  static extendedDebyeHuckelGamma(
    ionicStrength: number,
    charge: number,
    ionSizeAngstrom: number = 3.5,
    temperatureC: number = 25.0
  ): number {
    if (ionicStrength <= 1e-6 || charge === 0) return 1.0;
    const zSq = charge * charge;
    const A = ActivityModel.getDebyeHuckelA(temperatureC);
    const B = 0.3281; // standard B parameter at 25°C
    const sqrtI = Math.sqrt(ionicStrength);
    const denom = 1.0 + B * ionSizeAngstrom * sqrtI;
    const logGamma = (-A * zSq * sqrtI) / Math.max(0.001, denom);
    const gamma = Math.pow(10, logGamma);
    return Math.max(0.01, Math.min(2.0, gamma));
  }

  /**
   * Authoritative applicability routing for activity models.
   * Strictly distinguishes dilute Extended Debye-Hückel (I <= 0.1 M),
   * standard Davies (0.1 M < I <= 0.5 M), high-ionic screening (0.5 M < I <= 1.5 M),
   * and concentrated out-of-domain regime (I > 1.5 M).
   */
  static getIonActivityCoefficient(
    ionicStrength: number,
    charge: number,
    activityModel: ActivityModelType = 'davies',
    temperatureC: number = 25.0,
    ionSizeAngstrom: number = 3.5
  ): {
    gamma: number;
    routingRegime: 'IDEAL' | 'EXTENDED_DEBYE_HUCKEL_DILUTE' | 'DAVIES_STANDARD' | 'DAVIES_TRANSITION' | 'SEMI_EMPIRICAL_SCREENING' | 'OUT_OF_DOMAIN_CONCENTRATED_ELECTROLYTE';
    isOutOfDomain: boolean;
  } {
    if (activityModel === 'ideal' || ionicStrength <= 1e-6 || charge === 0) {
      return { gamma: 1.0, routingRegime: 'IDEAL', isOutOfDomain: false };
    }

    if (activityModel === 'debye_huckel') {
      if (ionicStrength <= 0.10) {
        return {
          gamma: ActivityModel.extendedDebyeHuckelGamma(ionicStrength, charge, ionSizeAngstrom, temperatureC),
          routingRegime: 'EXTENDED_DEBYE_HUCKEL_DILUTE',
          isOutOfDomain: false
        };
      }
      if (ionicStrength <= 0.50) {
        // Transition to Davies because standard Debye-Hückel without linear empirical parameter degrades above 0.1 M
        return {
          gamma: ActivityModel.daviesGamma(ionicStrength, charge, temperatureC),
          routingRegime: 'DAVIES_TRANSITION',
          isOutOfDomain: false
        };
      }
      if (ionicStrength <= 1.50) {
        return {
          gamma: ActivityModel.daviesGamma(ionicStrength, charge, temperatureC),
          routingRegime: 'SEMI_EMPIRICAL_SCREENING',
          isOutOfDomain: false
        };
      }
      return {
        gamma: ActivityModel.daviesGamma(ionicStrength, charge, temperatureC),
        routingRegime: 'OUT_OF_DOMAIN_CONCENTRATED_ELECTROLYTE',
        isOutOfDomain: true
      };
    }

    // Default 'davies' routing
    if (ionicStrength <= 0.50) {
      return {
        gamma: ActivityModel.daviesGamma(ionicStrength, charge, temperatureC),
        routingRegime: 'DAVIES_STANDARD',
        isOutOfDomain: false
      };
    }
    if (ionicStrength <= 1.50) {
      return {
        gamma: ActivityModel.daviesGamma(ionicStrength, charge, temperatureC),
        routingRegime: 'SEMI_EMPIRICAL_SCREENING',
        isOutOfDomain: false
      };
    }
    return {
      gamma: ActivityModel.daviesGamma(ionicStrength, charge, temperatureC),
      routingRegime: 'OUT_OF_DOMAIN_CONCENTRATED_ELECTROLYTE',
      isOutOfDomain: true
    };
  }

  /**
   * Calculates ionic strength I = 0.5 * sum(c_i * z_i^2).
   */
  static calculateIonicStrength(ions: Array<{ concentrationMolar: number; charge: number }>): number {
    let sum = 0;
    for (const ion of ions) {
      if (ion.concentrationMolar > 0 && ion.charge !== 0) {
        sum += ion.concentrationMolar * ion.charge * ion.charge;
      }
    }
    return 0.5 * sum;
  }

  /**
   * Evaluates the scientific validity regime of the activity model based on ionic strength.
   */
  static evaluateModelValidity(ionicStrength: number, activityModel: ActivityModelType): {
    level: ModelValidityLevel;
    notes: string[];
  } {
    const notes: string[] = [];

    if (ionicStrength > 1.50) {
      notes.push(`Concentrated electrolyte regime (I = ${ionicStrength.toFixed(4)} M > 1.5 M). Outside standard dilute activity model range; predictive uncertainty increases.`);
      return { level: 'OUT_OF_RANGE', notes };
    }

    if (activityModel === 'ideal') {
      notes.push('Ideal solution model active (activity coefficients gamma = 1.0).');
      if (ionicStrength > 0.05) {
        return { level: 'MODERATE', notes };
      }
      return { level: 'HIGH', notes };
    }

    if (ionicStrength <= 0.10) {
      notes.push(`Dilute ionic regime (I = ${ionicStrength.toFixed(4)} M). Extended Debye-Hückel / Davies model is highly accurate.`);
      return { level: 'HIGH', notes };
    }

    if (ionicStrength <= 0.50) {
      notes.push(`Moderate electrolyte regime (I = ${ionicStrength.toFixed(4)} M). Davies model is well-behaved.`);
      return { level: 'MODERATE', notes };
    }

    if (ionicStrength <= 1.50) {
      notes.push(`High ionic strength regime (I = ${ionicStrength.toFixed(4)} M). Ion-pairing and specific ion interactions may introduce ±0.1-0.2 pH deviation.`);
      return { level: 'LOW', notes };
    }

    notes.push(`Concentrated electrolyte regime (I = ${ionicStrength.toFixed(4)} M > 1.5 M). Outside standard dilute activity model range; predictive uncertainty increases.`);
    return { level: 'OUT_OF_RANGE', notes };
  }
}
