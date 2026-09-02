import { FormulaItem } from '../types';

export const FORMULAS: FormulaItem[] = [
  {
    id: 'hd-liquid-laundry',
    name: 'Heavy-Duty Liquid Laundry Detergent',
    category: 'Laundry Detergents',
    targetPH: 8.5,
    batchSizeKg: 100,
    description: 'High-performance liquid laundry formulation with dual-anionic & nonionic surfactant system and chelating builders.',
    ingredients: [
      { id: '1', name: 'Deionized Water', category: 'Solvent', percent: 62.5, activePercent: 0, costPerKg: 0.05, function: 'Solvent Base' },
      { id: '2', name: 'LABSA (Linear Alkylbenzene Sulfonic Acid)', category: 'Anionic Surfactant', percent: 8.0, activePercent: 96, costPerKg: 2.10, function: 'Primary Detergent Acid' },
      { id: '3', name: 'Sodium Hydroxide (NaOH 50%)', category: 'Neutralizer / Base', percent: 2.1, activePercent: 50, costPerKg: 0.65, function: 'LABSA Neutralizing Agent' },
      { id: '4', name: 'SLES (Sodium Lauryl Ether Sulfate 70%)', category: 'Anionic Surfactant', percent: 12.0, activePercent: 70, costPerKg: 1.85, function: 'Foaming & Cleaning Agent' },
      { id: '5', name: 'Linear Alcohol Ethoxylate (LAE-9)', category: 'Nonionic Surfactant', percent: 6.0, activePercent: 100, costPerKg: 2.80, function: 'Grease & Oil Removal' },
      { id: '6', name: 'Triethanolamine (TEA 99%)', category: 'Neutralizer / Buffer', percent: 1.5, activePercent: 99, costPerKg: 2.40, function: 'Alkalinity & Buffer' },
      { id: '7', name: 'Sodium Citrate', category: 'Builder / Chelator', percent: 3.0, activePercent: 100, costPerKg: 1.20, function: 'Water Softening Builder' },
      { id: '8', name: 'Sodium Chloride', category: 'Viscosity Modifier', percent: 1.8, activePercent: 100, costPerKg: 0.20, function: 'Viscosity Builder' },
      { id: '9', name: 'Preservative (Isothiazolinone blend)', category: 'Preservative', percent: 0.1, activePercent: 100, costPerKg: 12.00, function: 'Microbial Protection' },
      { id: '10', name: 'Fragrance & Optical Brightener', category: 'Additive', percent: 0.5, activePercent: 100, costPerKg: 18.00, function: 'Scent & Brightness' }
    ],
    instructions: [
      'Charge 80% of water into main mixing vessel and begin medium agitation.',
      'Slowly add LABSA while mixing until evenly dispersed.',
      'Neutralize with NaOH 50% solution slowly while monitoring batch temperature (< 45°C) and pH.',
      'Add SLES 70% and stir until fully dissolved and clear.',
      'Premix LAE-9 with remaining water and blend into main batch.',
      'Add Sodium Citrate and TEA, stirring for 15 minutes.',
      'Adjust pH to target 8.5 ± 0.3.',
      'Slurry Sodium Chloride and add incrementally to reach target viscosity (800–1200 cPs).',
      'Add preservative and fragrance below 35°C.'
    ]
  },
  {
    id: 'manual-dishwash-gel',
    name: 'Premium Concentrated Manual Dishwashing Liquid',
    category: 'Dishwashing',
    targetPH: 6.8,
    batchSizeKg: 100,
    description: 'Ultra grease-cutting high-foaming hand dishwash formula with skin emollients.',
    ingredients: [
      { id: '1', name: 'Deionized Water', category: 'Solvent', percent: 61.2, activePercent: 0, costPerKg: 0.05, function: 'Solvent Base' },
      { id: '2', name: 'SLES (70%)', category: 'Anionic Surfactant', percent: 18.0, activePercent: 70, costPerKg: 1.85, function: 'Primary Foamer' },
      { id: '3', name: 'LABSA (96%)', category: 'Anionic Surfactant', percent: 6.0, activePercent: 96, costPerKg: 2.10, function: 'Grease Cutting' },
      { id: '4', name: 'Sodium Hydroxide (50%)', category: 'Neutralizer', percent: 1.5, activePercent: 50, costPerKg: 0.65, function: 'Neutralizer' },
      { id: '5', name: 'CAPB (Cocamidopropyl Betaine 30%)', category: 'Amphoteric Surfactant', percent: 7.0, activePercent: 30, costPerKg: 2.30, function: 'Foam Stabilizer & Mildness' },
      { id: '6', name: 'CMEA (Cocamide MEA)', category: 'Viscosity & Foam Booster', percent: 2.0, activePercent: 100, costPerKg: 3.10, function: 'Foam Booster' },
      { id: '7', name: 'Glycerin', category: 'Humectant', percent: 1.0, activePercent: 100, costPerKg: 1.50, function: 'Hand Softening' },
      { id: '8', name: 'Sodium Chloride', category: 'Thickeners', percent: 2.5, activePercent: 100, costPerKg: 0.20, function: 'Viscosity Builder' },
      { id: '9', name: 'Citric Acid', category: 'pH Adjuster', percent: 0.3, activePercent: 100, costPerKg: 1.40, function: 'pH Control' },
      { id: '10', name: 'Dye, Fragrance & Preservative', category: 'Additives', percent: 0.5, activePercent: 100, costPerKg: 15.00, function: 'Aesthetics' }
    ],
    instructions: [
      'Charge water into batch mixer.',
      'Add LABSA and neutralize with NaOH to pH ~7.',
      'Melt CMEA into warm SLES and add to batch.',
      'Blend in CAPB and Glycerin.',
      'Adjust pH with Citric Acid to 6.5–7.0.',
      'Thicken with salt to 1500–2500 cPs.'
    ]
  }
];
