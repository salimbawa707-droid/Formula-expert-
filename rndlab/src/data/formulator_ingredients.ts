export interface FormulatorIngredient {
  name: string;
  hlbValue: number | null;
  costPerKg: number;
  activeMatterPct: number;
  role: string;
  type?: string;
}

export const STANDARD_SURFACTANTS: FormulatorIngredient[] = [
  { name: "LABSA (90%)", hlbValue: 11.5, costPerKg: 135, activeMatterPct: 90, role: "Anionic Surfactant" },
  { name: "SLES (70%)", hlbValue: 13.0, costPerKg: 110, activeMatterPct: 70, role: "Anionic Surfactant" },
  { name: "CAPB (30%)", hlbValue: 12.0, costPerKg: 95, activeMatterPct: 30, role: "Amphoteric Surfactant" },
  { name: "AOS (Alpha Olefin Sulfonate 38%)", hlbValue: 12.0, costPerKg: 120, activeMatterPct: 38, role: "Anionic Surfactant" },
  { name: "AOS Powder (92%)", hlbValue: 12.0, costPerKg: 230, activeMatterPct: 92, role: "Anionic Surfactant" },
  { name: "SLS Needle (Sodium Lauryl Sulfate 92%)", hlbValue: 40.0, costPerKg: 240, activeMatterPct: 92, role: "Anionic Surfactant & Foamer" },
  { name: "SLS Liquid (Sodium Lauryl Sulfate 30%)", hlbValue: 40.0, costPerKg: 90, activeMatterPct: 30, role: "Anionic Surfactant & Foamer" },
  { name: "Tween 20 (Polysorbate)", hlbValue: 16.7, costPerKg: 280, activeMatterPct: 100, role: "Non-ionic Emulsifier" },
  { name: "Tween 80 (Polysorbate)", hlbValue: 15.0, costPerKg: 260, activeMatterPct: 100, role: "Non-ionic Emulsifier" },
  { name: "Span 80 (Sorbitan Oleate)", hlbValue: 4.3, costPerKg: 240, activeMatterPct: 100, role: "Lipophilic Emulsifier" },
  { name: "Span 20 (Sorbitan Laurate)", hlbValue: 8.6, costPerKg: 250, activeMatterPct: 100, role: "Lipophilic Emulsifier" },
  { name: "Glyceryl Monostearate (GMS)", hlbValue: 3.8, costPerKg: 180, activeMatterPct: 100, role: "Lipophilic Co-Emulsifier" },
  { name: "Cocamide DEA (CDE)", hlbValue: 13.5, costPerKg: 160, activeMatterPct: 100, role: "Non-ionic Foam Booster" },
  { name: "Cocamide MEA (CME)", hlbValue: 11.5, costPerKg: 210, activeMatterPct: 95, role: "Non-ionic Thickener & Foam Stabilizer" },
  { name: "Nonylphenol Ethoxylate (NP-9)", hlbValue: 13.0, costPerKg: 190, activeMatterPct: 100, role: "Non-ionic Detergent" },
  { name: "Nonylphenol Ethoxylate (NP-6)", hlbValue: 10.9, costPerKg: 185, activeMatterPct: 100, role: "Non-ionic Emulsifier" },
  { name: "Nonylphenol Ethoxylate (NP-10)", hlbValue: 13.3, costPerKg: 195, activeMatterPct: 100, role: "Non-ionic Detergent" },
  { name: "Alfox 200 (Nonylphenol 9.5EO)", hlbValue: 13.0, costPerKg: 190, activeMatterPct: 100, role: "Non-ionic Detergent / Degreaser" },
  { name: "Linear Alcohol Ethoxylate (LAE-9)", hlbValue: 13.3, costPerKg: 185, activeMatterPct: 100, role: "Non-ionic Detergent" },
  { name: "Linear Alcohol Ethoxylate (LAE-7)", hlbValue: 12.1, costPerKg: 180, activeMatterPct: 100, role: "Non-ionic Detergent / Wetting Agent" },
  { name: "Linear Alcohol Ethoxylate (LAE-3)", hlbValue: 8.0, costPerKg: 175, activeMatterPct: 100, role: "Lipophilic Wetting Agent" },
  { name: "Benzalkonium Chloride (BKC 50%)", hlbValue: 15.0, costPerKg: 150, activeMatterPct: 50, role: "Cationic Disinfectant Surfactant" },
  { name: "Benzalkonium Chloride (BKC 80%)", hlbValue: 15.0, costPerKg: 220, activeMatterPct: 80, role: "Cationic Disinfectant Surfactant" },
  { name: "Cetrimonium Chloride (CTAC 30%)", hlbValue: 15.8, costPerKg: 130, activeMatterPct: 30, role: "Cationic Emulsifier & Conditioner" },
  { name: "Behentrimonium Chloride (BTAC 80%)", hlbValue: 14.5, costPerKg: 350, activeMatterPct: 80, role: "Cationic Conditioning Agent" },
  { name: "Lauryl Amine Oxide (LDAO 30%)", hlbValue: 14.2, costPerKg: 115, activeMatterPct: 30, role: "Amphoteric Foam Stabilizer" },
  { name: "Coco Amine Oxide (30%)", hlbValue: 13.8, costPerKg: 110, activeMatterPct: 30, role: "Amphoteric Foam Stabilizer" },
  { name: "Disodium Laureth Sulfosuccinate (DLS 40%)", hlbValue: 12.6, costPerKg: 190, activeMatterPct: 40, role: "Mild Anionic Surfactant" },
  { name: "Sodium Lauroyl Sarcosinate (Sarkosyl 30%)", hlbValue: 13.5, costPerKg: 180, activeMatterPct: 30, role: "Mild Amino-Acid Surfactant" },
  { name: "Sodium Lauroyl Methyl Isethionate (SLMI 85%)", hlbValue: 12.0, costPerKg: 580, activeMatterPct: 85, role: "Sulfate-Free Premium Surfactant" },
  { name: "PEG-40 Hydrogenated Castor Oil", hlbValue: 15.0, costPerKg: 310, activeMatterPct: 100, role: "Non-ionic Fragrance Solubilizer" },
  { name: "Ceteareth-20", hlbValue: 15.2, costPerKg: 220, activeMatterPct: 100, role: "Non-ionic Emulsifying Wax" },
  { name: "Ceteareth-25", hlbValue: 16.2, costPerKg: 240, activeMatterPct: 100, role: "Non-ionic Emulsifying Wax" },
  { name: "Cetyl Alcohol", hlbValue: 1.0, costPerKg: 150, activeMatterPct: 100, role: "Emulsion Stabilizer & Thickener" },
  { name: "Stearyl Alcohol", hlbValue: 1.0, costPerKg: 165, activeMatterPct: 100, role: "Emulsion Stabilizer & Thickener" },
  { name: "Sorbitan Monostearate (Span 60)", hlbValue: 4.7, costPerKg: 220, activeMatterPct: 100, role: "Lipophilic Emulsifier" },
  { name: "DHTDMAC (Esterquat 75%)", hlbValue: 10.0, costPerKg: 175, activeMatterPct: 75, role: "Cationic Softener Agent" },
  { name: "PEG-150 Distearate", hlbValue: 18.5, costPerKg: 450, activeMatterPct: 100, role: "Non-ionic Polymeric Thickener" }
];

export const ECO_PLANT_INGREDIENTS: FormulatorIngredient[] = [
  // Plant-based Surfactants
  { name: "Coco Glucoside (50%)", hlbValue: 12.5, costPerKg: 150, activeMatterPct: 50, role: "Plant-based Non-ionic Surfactant", type: "surfactant" },
  { name: "Lauryl Glucoside (50%)", hlbValue: 12.0, costPerKg: 160, activeMatterPct: 50, role: "Plant-based Non-ionic Surfactant", type: "surfactant" },
  { name: "Decyl Glucoside (50%)", hlbValue: 13.0, costPerKg: 155, activeMatterPct: 50, role: "Plant-based Non-ionic Surfactant", type: "surfactant" },
  { name: "Caprylyl/Capryl Glucoside (60%)", hlbValue: 13.5, costPerKg: 180, activeMatterPct: 60, role: "Plant-based Non-ionic Surfactant & Solubilizer", type: "surfactant" },
  { name: "Sodium Methyl Cocoyl Taurate (95%)", hlbValue: 14.5, costPerKg: 380, activeMatterPct: 95, role: "Plant-derived Amino Acid Surfactant", type: "surfactant" },
  { name: "Sodium Cocoyl Isethionate (SCI 85%)", hlbValue: 11.0, costPerKg: 420, activeMatterPct: 85, role: "Plant-derived Anionic Cleansing Powder", type: "surfactant" },
  { name: "Sodium Cocoyl Glutamate (30%)", hlbValue: 14.0, costPerKg: 280, activeMatterPct: 30, role: "Plant-derived Gentle Amino Acid Surfactant", type: "surfactant" },
  { name: "Disodium Cocoyl Glutamate (30%)", hlbValue: 14.2, costPerKg: 290, activeMatterPct: 30, role: "Plant-derived Gentle Amino Acid Surfactant", type: "surfactant" },
  { name: "Sodium Lauroyl Oat Amino Acids (30%)", hlbValue: 13.8, costPerKg: 480, activeMatterPct: 30, role: "Mild Oats-derived Protein Surfactant", type: "surfactant" },
  { name: "Methyl Ester Sulfonate (MES 70%)", hlbValue: 12.8, costPerKg: 170, activeMatterPct: 70, role: "Plant-derived Anionic Surfactant", type: "surfactant" },
  { name: "Soapnut Extract (Saponin 40%)", hlbValue: 13.5, costPerKg: 120, activeMatterPct: 40, role: "Botanical Wild-Harvested Surfactant", type: "surfactant" },
  { name: "Sodium Lauryl Sulfoacetate (SLSA 65%)", hlbValue: 11.8, costPerKg: 320, activeMatterPct: 65, role: "Plant-derived Mild Surfactant", type: "surfactant" },

  // Natural Eco-Builders & Chelators
  { name: "Sodium Hydroxide Flakes (98%)", hlbValue: null, costPerKg: 45, activeMatterPct: 98, role: "pH Adjuster / Neutralizing Alkali", type: "builder" },
  { name: "Sodium Hydroxide Lye (50%)", hlbValue: null, costPerKg: 35, activeMatterPct: 50, role: "pH Adjuster / Neutralizing Alkali", type: "builder" },
  { name: "Sodium Hydroxide Lye (33%)", hlbValue: null, costPerKg: 28, activeMatterPct: 33, role: "pH Adjuster / Neutralizing Alkali", type: "builder" },
  { name: "Sodium Gluconate", hlbValue: null, costPerKg: 120, activeMatterPct: 0, role: "Eco Chelator (Corn-derived)", type: "builder" },
  { name: "Sodium Citrate", hlbValue: null, costPerKg: 85, activeMatterPct: 0, role: "Natural Builder & pH Buffer (Citrus-derived)", type: "builder" },
  { name: "Potassium Citrate", hlbValue: null, costPerKg: 110, activeMatterPct: 0, role: "Eco pH Buffer & Builder", type: "builder" },
  { name: "Citric Acid (50% soln)", hlbValue: null, costPerKg: 90, activeMatterPct: 0, role: "Natural pH Adjuster (Citrus-derived)", type: "builder" },
  { name: "GLDA (Dissolvine GL 47%)", hlbValue: null, costPerKg: 195, activeMatterPct: 0, role: "Green Biodegradable Chelator (L-Glutamic acid based)", type: "builder" },
  { name: "MGDA (Trilon M 40%)", hlbValue: null, costPerKg: 210, activeMatterPct: 0, role: "High-Performance Green Builder (Alanine-based)", type: "builder" },
  { name: "Sodium Bicarbonate (Baking Soda)", hlbValue: null, costPerKg: 55, activeMatterPct: 0, role: "Natural Deodorizing Builder & Buffer", type: "builder" },
  { name: "Sodium Sesquicarbonate", hlbValue: null, costPerKg: 75, activeMatterPct: 0, role: "Eco Mineral Buffer & Builder", type: "builder" },
  { name: "Borax (Sodium Tetraborate Decahydrate)", hlbValue: null, costPerKg: 95, activeMatterPct: 0, role: "Eco Mineral Bleaching Builder", type: "builder" },
  { name: "Sodium Carbonate (Soda Ash)", hlbValue: null, costPerKg: 45, activeMatterPct: 0, role: "Mineral Alkalinity Builder", type: "builder" },
  { name: "Lactic Acid (80%)", hlbValue: null, costPerKg: 150, activeMatterPct: 0, role: "Natural Mild Antibacterial & pH Adjuster", type: "builder" },

  // Eco Additives & Rheology
  { name: "Enzyme Blend (Protease/Lipase)", hlbValue: null, costPerKg: 350, activeMatterPct: 0, role: "Bio-Enzymatic Stain Breaker", type: "additive" },
  { name: "Amylase Enzyme (Single Strength)", hlbValue: null, costPerKg: 380, activeMatterPct: 0, role: "Bio-Enzymatic Starch Stain Eraser", type: "additive" },
  { name: "Cellulase Enzyme (Anti-pilling)", hlbValue: null, costPerKg: 420, activeMatterPct: 0, role: "Bio-Enzymatic Fabric Care & Smoothness", type: "additive" },
  { name: "Mannanase Enzyme", hlbValue: null, costPerKg: 480, activeMatterPct: 0, role: "Bio-Enzymatic Gum Stain Remover", type: "additive" },
  { name: "Xanthan Gum (Natural)", hlbValue: null, costPerKg: 420, activeMatterPct: 0, role: "Botanical Bio-polymer Thickener", type: "additive" },
  { name: "Guar Gum (Natural)", hlbValue: null, costPerKg: 160, activeMatterPct: 0, role: "Plant-derived Rheology Modifier", type: "additive" },
  { name: "Cationic Guar Gum", hlbValue: null, costPerKg: 350, activeMatterPct: 0, role: "Plant-derived Softness & Conditioning Polymer", type: "additive" },
  { name: "Lemongrass Essential Oil", hlbValue: null, costPerKg: 1200, activeMatterPct: 0, role: "Natural Active Aroma & Antiseptic", type: "additive" },
  { name: "Tea Tree Essential Oil", hlbValue: null, costPerKg: 1800, activeMatterPct: 0, role: "Natural Antiseptic & Antibacterial", type: "additive" },
  { name: "Peppermint Essential Oil", hlbValue: null, costPerKg: 1500, activeMatterPct: 0, role: "Natural Cooling Scent & Preservative Booster", type: "additive" },
  { name: "Eucalyptus Essential Oil", hlbValue: null, costPerKg: 1100, activeMatterPct: 0, role: "Botanical Deodorizer & Insect Repeller", type: "additive" },
  { name: "Sweet Orange Essential Oil", hlbValue: null, costPerKg: 1300, activeMatterPct: 0, role: "Botanical Solvent & Degreasing Aroma", type: "additive" },
  { name: "Pine Oil (Steam Distilled 85%)", hlbValue: null, costPerKg: 220, activeMatterPct: 0, role: "Botanical Solvent & Natural Disinfectant", type: "additive" },
  { name: "Vegetable Glycerin", hlbValue: null, costPerKg: 110, activeMatterPct: 0, role: "Plant-derived Humectant & Stabilizer", type: "additive" },
  { name: "Sorbitol (70% solution)", hlbValue: null, costPerKg: 85, activeMatterPct: 0, role: "Plant-derived Enzyme Protector & Humectant", type: "additive" },
  { name: "Sodium Benzoate", hlbValue: null, costPerKg: 110, activeMatterPct: 0, role: "Eco-Friendly Safe Food-Grade Preservative", type: "additive" },
  { name: "Potassium Sorbate", hlbValue: null, costPerKg: 140, activeMatterPct: 0, role: "Eco-Friendly Safe Food-Grade Preservative", type: "additive" },
  { name: "Kathon CG (Preservative)", hlbValue: null, costPerKg: 180, activeMatterPct: 0, role: "Synthetic Broad-Spectrum Preservative", type: "additive" },
  { name: "DMDM Hydantoin", hlbValue: null, costPerKg: 160, activeMatterPct: 0, role: "High-pH Formaldehyde-Donor Preservative", type: "additive" },
  { name: "Phenoxyethanol", hlbValue: null, costPerKg: 150, activeMatterPct: 0, role: "Gentle Eco-Friendly Preservative", type: "additive" },
  { name: "Sodium Chloride (Natural Salt)", hlbValue: null, costPerKg: 15, activeMatterPct: 0, role: "Natural Viscosity Thickener", type: "additive" }
];
