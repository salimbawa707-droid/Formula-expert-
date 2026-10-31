import { describe, expect, it } from 'bun:test';
import { getChelatorBindingCapacity, validateChelatorCapacity } from '../chelatorEngine';

describe('Chelator Binding Capacity: Correction 4 Integrity', () => {
  it('should validate valid capacity', () => {
    const res = validateChelatorCapacity(260, 'Citation A');
    expect(res.status).toBe('VALID');
    expect(res.capacityMgCaCO3PerGram).toBe(260);
  });

  it('should reject missing capacity', () => {
    const res = validateChelatorCapacity(null as any, 'Citation A');
    expect(res.status).toBe('INSUFFICIENT_DATA');
  });

  it('should reject missing evidenceId', () => {
    const res = validateChelatorCapacity(260, '');
    expect(res.status).toBe('INSUFFICIENT_DATA');
  });

  it('should return INSUFFICIENT_DATA for unknown ingredient', () => {
    const res = getChelatorBindingCapacity('Unknown Chelator');
    expect(res.status).toBe('INSUFFICIENT_DATA');
  });

  it('should return VALID for known ingredient with citation', () => {
    const res = getChelatorBindingCapacity('GLDA 47% Liquid');
    expect(res.status).toBe('VALID');
    expect(res.capacityMgCaCO3PerGram).toBe(137);
    expect(res.evidenceId).toBeDefined();
  });
});
