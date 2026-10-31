import { describe, expect, it } from 'bun:test';
import { calculatePowderChelationSystem } from '../powderEngine/powderBuilderChelationAlkalinity';
import { ClassifiedIngredient } from '../powderEngine/types';

describe('Powder Chelation Engine: Active Matter Integrity', () => {
  const chelator: ClassifiedIngredient = {
    name: 'GLDA-4Na',
    inputPercentage: 10,
    functionalClass: 'Chelating Agent / Soluble Sequestrant',
    isSurfactant: false,
    isBuilder: false,
    isChelator: true,
    isAlkalinitySource: false,
    isFiller: false,
    costPerKg: 1
  };

  it('should return INSUFFICIENT_DATA when activeMatterPct is missing', () => {
    const result = calculatePowderChelationSystem([{ ...chelator }]);
    expect(result.source).toBe('INSUFFICIENT_DATA');
  });

  it('should return INSUFFICIENT_DATA when activeMatterPct is null', () => {
    const result = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: null as any }]);
    expect(result.source).toBe('INSUFFICIENT_DATA');
  });

  it('should return INSUFFICIENT_DATA when activeMatterPct is NaN', () => {
    const result = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: NaN }]);
    expect(result.source).toBe('INSUFFICIENT_DATA');
  });

  it('should return INSUFFICIENT_DATA when activeMatterPct is negative', () => {
    const result = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: -1 }]);
    expect(result.source).toBe('INSUFFICIENT_DATA');
  });

  it('should return INSUFFICIENT_DATA when activeMatterPct is > 100', () => {
    const result = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 101 }]);
    expect(result.source).toBe('INSUFFICIENT_DATA');
  });

  it('should accept valid 47% active matter', () => {
    const result = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 47 }]);
    expect(result.source).toBe('CALCULATED');
    expect(result.hasValidatedData).toBe(true);
    expect(result.calciumCapacityMgPerDose).toBeDefined();
  });

  it('should accept 0% active matter as valid numeric 0', () => {
    const result = calculatePowderChelationSystem([{ ...chelator, activeMatterPct: 0 }]);
    expect(result.source).toBe('CALCULATED');
    expect(result.hasValidatedData).toBe(true);
    expect(result.calciumCapacityMgPerDose).toBe(0);
  });
});
