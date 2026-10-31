import { describe, expect, it } from 'bun:test';
import { calculateRequiredStockVolumeUl, generateExperimentProtocol } from '../experimentProtocolGenerator';
import { ExperimentIngredient, ExperimentDesign } from '../types';

describe('Laboratory Automation: Protocol Integrity & Scientific Conversion', () => {
  const baseIngredient: ExperimentIngredient = {
    canonicalIngredientId: 'ING-001',
    tradeName: 'Test Surfactant',
    inciName: 'Test Surfactant',
    concentrationInStockPercent: 10,
    targetFormulaPercent: 1,
    requiredVolumeUl: null,
    viscosityClass: 'LOW_AQUEOUS',
  };

  const validEvidence = {
    concentrationBasis: 'W_W' as const,
    stockDensityGPerMl: 1.05,
    stockDensityEvidenceId: 'REF-001',
    targetBatchMassG: 0.2, // 200 mg per well
  };

  describe('calculateRequiredStockVolumeUl', () => {
    it('should calculate valid W_W volume correctly', () => {
      // (0.2g * (1/100) / (10/100)) / 1.05 * 1000 = (0.2 * 0.01 / 0.1) / 1.05 * 1000 = 0.02 / 1.05 * 1000 = 19.05 ul
      const ing = { ...baseIngredient, conversionEvidence: validEvidence };
      const vol = calculateRequiredStockVolumeUl(ing);
      expect(vol).toBeCloseTo(19.05, 2);
    });

    it('should return null if conversionEvidence is missing', () => {
      const ing = { ...baseIngredient, conversionEvidence: undefined };
      expect(calculateRequiredStockVolumeUl(ing)).toBeNull();
    });

    it('should return null if stockDensity is missing', () => {
      const ing = { ...baseIngredient, conversionEvidence: { ...validEvidence, stockDensityGPerMl: undefined } };
      expect(calculateRequiredStockVolumeUl(ing)).toBeNull();
    });

    it('should return null if stockDensity evidence ID is missing', () => {
      const ing = { ...baseIngredient, conversionEvidence: { ...validEvidence, stockDensityEvidenceId: '' } };
      expect(calculateRequiredStockVolumeUl(ing)).toBeNull();
    });

    it('should return null if targetBatchMassG is missing', () => {
      const ing = { ...baseIngredient, conversionEvidence: { ...validEvidence, targetBatchMassG: undefined } };
      expect(calculateRequiredStockVolumeUl(ing)).toBeNull();
    });

    it('should return null for non-W_W basis (W_V, V_V)', () => {
      const ingWV = { ...baseIngredient, conversionEvidence: { ...validEvidence, concentrationBasis: 'W_V' as any } };
      const ingVV = { ...baseIngredient, conversionEvidence: { ...validEvidence, concentrationBasis: 'V_V' as any } };
      expect(calculateRequiredStockVolumeUl(ingWV)).toBeNull();
      expect(calculateRequiredStockVolumeUl(ingVV)).toBeNull();
    });

    it('should return null for invalid concentrations', () => {
      expect(calculateRequiredStockVolumeUl({ ...baseIngredient, concentrationInStockPercent: 0, conversionEvidence: validEvidence })).toBeNull();
      expect(calculateRequiredStockVolumeUl({ ...baseIngredient, concentrationInStockPercent: -1, conversionEvidence: validEvidence })).toBeNull();
      expect(calculateRequiredStockVolumeUl({ ...baseIngredient, concentrationInStockPercent: 101, conversionEvidence: validEvidence })).toBeNull();
    });

    it('should return null for invalid target percentages', () => {
      expect(calculateRequiredStockVolumeUl({ ...baseIngredient, targetFormulaPercent: -0.1, conversionEvidence: validEvidence })).toBeNull();
      expect(calculateRequiredStockVolumeUl({ ...baseIngredient, targetFormulaPercent: 101, conversionEvidence: validEvidence })).toBeNull();
    });

    it('should not introduce arbitrary 1 ul minimum', () => {
      // Very small percentage
      const ing = { 
        ...baseIngredient, 
        targetFormulaPercent: 0.001, 
        conversionEvidence: { ...validEvidence, targetBatchMassG: 0.1 } 
      };
      // (0.1 * 0.00001 / 0.1) / 1.05 * 1000 = 0.00001 / 1.05 * 1000 = 0.0095 ul
      const vol = calculateRequiredStockVolumeUl(ing);
      expect(vol).toBeLessThan(1.0);
      expect(vol).not.toBeNull();
      if (vol !== null) {
         expect(vol).toBeCloseTo(0.01, 2);
      }
    });
  });

  describe('Protocol Generation Blocking', () => {
    const experiment: ExperimentDesign = {
      id: 'EXP-BLOCK-TEST',
      name: 'Blocking Test',
      objective: 'Verify blocking',
      experimentType: 'FORMULATION_DISPENSE',
      productCategory: 'LAUNDRY_LIQUID',
      physicalForm: 'Liquid',
      targetScaleUl: 200,
      replicates: 3,
      ingredients: [
        { ...baseIngredient, tradeName: 'Missing Evidence Component' }
      ],
      constraints: [],
      processParameters: {
        mixingRequired: true,
        humanInputRequiredWarnings: [],
      },
      status: 'DESIGNED',
      createdAt: new Date().toISOString(),
      createdBy: 'Tester',
    };

    it('should block protocol generation and return INSUFFICIENT_DATA status when evidence is missing', () => {
      const protocol = generateExperimentProtocol(experiment);
      expect(protocol.validationResult.status).toBe('INSUFFICIENT_DATA');
      expect(protocol.commands.length).toBe(0);
      expect(protocol.validationResult.isValid).toBe(false);
      expect(protocol.validationResult.issues.some(i => i.code === 'MISSING_CONVERSION_EVIDENCE')).toBe(true);
      expect(protocol.protocolName).toContain('INSUFFICIENT DATA');
    });

    it('should generate valid protocol when all ingredients have evidence', () => {
      const validExperiment = {
        ...experiment,
        ingredients: [
          { ...baseIngredient, conversionEvidence: validEvidence }
        ]
      };
      const protocol = generateExperimentProtocol(validExperiment);
      expect(protocol.validationResult.status).toBe('VALID');
      expect(protocol.commands.length).toBeGreaterThan(0);
      expect(protocol.liquidTransfers.length).toBe(3); // 1 ing * 3 replicates
      expect(protocol.liquidTransfers[0].volumeUl).toBeCloseTo(19.05, 2);
    });
  });
});
