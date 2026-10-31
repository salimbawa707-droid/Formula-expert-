import { describe, expect, it } from 'bun:test';
import { calculatePowderMoistureAndDryMatter } from '../powderEngine/powderMoistureDryMatter';
import { FormulationIngredient } from '../../types';

describe('Powder Moisture Engine: Lab-Only Evidence', () => {
  const ingredients: FormulationIngredient[] = [
    { name: 'Soda Ash', percentage: 50 },
    { name: 'Sodium Sulfate', percentage: 50 }
  ];
  
  const massBalance = {
    assignedPercentage: 100,
    unassignedPercentage: 0,
    formulaTotalPct: 100,
    status: 'BALANCED' as const,
    missingPercentage: 0,
    excessPercentage: 0,
    statusMessage: 'Balanced',
    source: 'CALCULATED' as const
  };

  it('should return INSUFFICIENT_DATA when measuredMoisturePct is missing', () => {
    const result = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100);
    expect(result.moisturePct).toBeNull();
    expect(result.moistureStatus).toBe('INSUFFICIENT_DATA');
  });

  it('should accept valid laboratory moisture (e.g., 5%)', () => {
    const result = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100, {
      measuredMoisturePct: 5.0
    });
    expect(result.moisturePct).toBe(5.0);
    expect(result.dryMatterPct).toBe(95.0);
    expect(result.moistureStatus).toBe('MEASURED');
    expect(result.dryMatterStatus).toBe('DERIVED');
  });

  it('should reject moisture > 100%', () => {
    const result = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100, {
      measuredMoisturePct: 101.0
    });
    expect(result.moisturePct).toBeNull();
    expect(result.moistureStatus).toBe('INSUFFICIENT_DATA');
  });

  it('should reject negative moisture', () => {
    const result = calculatePowderMoistureAndDryMatter(ingredients, massBalance, 100, {
      measuredMoisturePct: -1.0
    });
    expect(result.moisturePct).toBeNull();
    expect(result.moistureStatus).toBe('INSUFFICIENT_DATA');
  });
});
