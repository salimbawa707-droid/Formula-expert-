import { StandardUnit } from './types';

/**
 * Validates a numerical value against NaN, Infinity, and extreme values.
 */
export function isValidNumber(val: any): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

/**
 * Checks if target, min, and max specification ranges are mathematically coherent.
 * Returns error string if invalid, or null if valid.
 */
export function validateSpecificationRange(
  min?: number,
  max?: number,
  target?: number,
  allowNegative: boolean = false
): string | null {
  if (min !== undefined) {
    if (!isValidNumber(min)) return 'Minimum specification must be a valid finite number.';
    if (!allowNegative && min < 0) return 'Minimum specification cannot be negative for this parameter.';
  }

  if (max !== undefined) {
    if (!isValidNumber(max)) return 'Maximum specification must be a valid finite number.';
    if (!allowNegative && max < 0) return 'Maximum specification cannot be negative for this parameter.';
  }

  if (min !== undefined && max !== undefined) {
    if (min > max) {
      return `Invalid range: Minimum (${min}) cannot exceed Maximum (${max}).`;
    }
  }

  if (target !== undefined) {
    if (!isValidNumber(target)) return 'Target value must be a valid finite number.';
    if (!allowNegative && target < 0) return 'Target value cannot be negative for this parameter.';
    if (min !== undefined && target < min) {
      return `Target (${target}) is set below the Minimum allowed limit (${min}).`;
    }
    if (max !== undefined && target > max) {
      return `Target (${target}) is set above the Maximum allowed limit (${max}).`;
    }
  }

  return null;
}

/**
 * Converts a value from source unit to target unit safely.
 * Throws or returns undefined if incompatible.
 */
export function convertUnitValue(value: number, fromUnit: StandardUnit, toUnit: StandardUnit): number | undefined {
  if (!isValidNumber(value)) return undefined;
  if (fromUnit === toUnit) return value;

  // Density conversions
  if (fromUnit === 'g/mL' && toUnit === 'kg/m³') return value * 1000;
  if (fromUnit === 'kg/m³' && toUnit === 'g/mL') return value / 1000;

  // Time conversions
  if (fromUnit === 'seconds' && toUnit === 'minutes') return value / 60;
  if (fromUnit === 'minutes' && toUnit === 'seconds') return value * 60;

  // Concentration conversions (g/L vs ppm - 1 g/L = 1000 ppm)
  if (fromUnit === 'g/L' && toUnit === 'ppm') return value * 1000;
  if (fromUnit === 'ppm' && toUnit === 'g/L') return value / 1000;

  // Currency conversions (if same currency)
  if (fromUnit === '₹/kg' && toUnit === '₹/kg') return value;
  if (fromUnit === '$/kg' && toUnit === '$/kg') return value;

  // Incompatible units
  return undefined;
}

/**
 * Formats a number with appropriate decimal places for display without mutating intermediate math.
 */
export function formatParameterValue(val: number | undefined, unit: StandardUnit, decimals: number = 2): string {
  if (val === undefined || !isValidNumber(val)) return 'INSUFFICIENT_DATA';
  
  const formatted = Number(val.toFixed(decimals));
  if (unit === 'none') return `${formatted}`;
  if (unit === 'pH units') return `${formatted} pH`;
  return `${formatted} ${unit}`;
}
