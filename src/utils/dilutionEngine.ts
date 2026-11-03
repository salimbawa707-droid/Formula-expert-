export interface DilutionResult {
  v1: number;
  waterNeeded: number;
  addedWater: number;
  targetVolume: number;
  targetStrength?: number;
  sourceConcentration?: number;
  isValid: boolean;
  errorMessage?: string;
}

export function calculateDilution(c1: number | { c1: number; c2: number; v2: number }, c2Arg?: number, v2Arg?: number): DilutionResult {
  let rawC1: any;
  let rawC2: any;
  let rawV2: any;

  if (typeof c1 === 'object' && c1 !== null) {
    rawC1 = (c1 as any).c1 ?? (c1 as any).sourceConcentration;
    rawC2 = (c1 as any).c2 ?? (c1 as any).targetStrength ?? (c1 as any).targetConcentration;
    rawV2 = (c1 as any).v2 ?? (c1 as any).targetVolume;
  } else {
    rawC1 = c1;
    rawC2 = c2Arg;
    rawV2 = v2Arg;
  }

  if (
    rawC1 === null || rawC1 === undefined || rawC1 === '' ||
    rawC2 === null || rawC2 === undefined || rawC2 === '' ||
    rawV2 === null || rawV2 === undefined || rawV2 === ''
  ) {
    return {
      v1: 0,
      waterNeeded: 0,
      addedWater: 0,
      targetVolume: 0,
      sourceConcentration: 0,
      targetStrength: 0,
      isValid: false,
      errorMessage: "Concentration and volume parameters must be valid numeric values."
    };
  }

  const c1Num = Number(rawC1);
  const c2Num = Number(rawC2);
  const v2Num = Number(rawV2);

  if (isNaN(c1Num) || isNaN(c2Num) || isNaN(v2Num)) {
    return {
      v1: 0,
      waterNeeded: 0,
      addedWater: 0,
      targetVolume: 0,
      sourceConcentration: 0,
      targetStrength: 0,
      isValid: false,
      errorMessage: "Concentration and volume parameters must be valid numeric values."
    };
  }

  if (c1Num <= 0 || v2Num <= 0 || c2Num < 0) {
    return {
      v1: 0,
      waterNeeded: 0,
      addedWater: 0,
      targetVolume: Math.max(0, v2Num),
      sourceConcentration: Math.max(0, c1Num),
      targetStrength: Math.max(0, c2Num),
      isValid: false,
      errorMessage: c1Num <= 0
        ? "Source concentration (C1) must be greater than 0%."
        : v2Num <= 0
        ? "Target volume (V2) must be greater than 0 L."
        : "Target concentration (C2) cannot be negative."
    };
  }

  if (c2Num > c1Num) {
    return {
      v1: 0,
      waterNeeded: 0,
      addedWater: 0,
      targetVolume: v2Num,
      sourceConcentration: c1Num,
      targetStrength: c2Num,
      isValid: false,
      errorMessage: "Target concentration (C2) cannot exceed source concentration (C1) in a dilution process."
    };
  }

  // Standard dilution equation: C1 * V1 = C2 * V2 => V1 = (C2 * V2) / C1
  const v1 = (c2Num * v2Num) / c1Num;
  const waterNeeded = Math.max(0, v2Num - v1);

  return {
    v1: Number(Number(v1.toFixed(4))),
    waterNeeded: Number(Number(waterNeeded.toFixed(4))),
    addedWater: Number(Number(waterNeeded.toFixed(4))),
    targetVolume: v2Num,
    sourceConcentration: c1Num,
    targetStrength: c2Num,
    isValid: true
  };
}

export function convertUnit(val: number, from: string, to: string): number {
  if (from === 'kg' && to === 'g') return val * 1000;
  if (from === 'g' && to === 'kg') return val / 1000;
  if (from === 'lb' && to === 'kg') return val * 0.45359237;
  if (from === 'kg' && to === 'lb') return val / 0.45359237;
  return val;
}
