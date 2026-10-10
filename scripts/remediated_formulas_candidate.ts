import { FormulaItem } from '../src/types';

export const RAW_FORMULAS_REMEDIATED: FormulaItem[] = [
  // 1. LAUNDRY_LIQUID: Heavy-Duty Liquid Laundry Detergent
  {
    "id": "hd-liquid-laundry",
    "name": "Heavy-Duty Liquid Laundry Detergent (Commercial Standard)",
    "category": "Liquid Laundry",
    "targetPH": 8.5,
    "batchSizeKg": 100,
    "description": "High-performance liquid laundry formulation with dual-anionic & nonionic surfactant system and chelating builders.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 65.42,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 8,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Detergent Acid"
      },
      {
        "id": "3",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 1.88,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "LABSA Neutralizer"
      },
      {
        "id": "4",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 12,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Foaming & Cleaning Agent"
      },
      {
        "id": "5",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 6,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Grease & Oil Removal"
      },
      {
        "id": "6",
        "name": "Triethanolamine 99% (TEA)",
        "category": "Neutralizer / Base",
        "percent": 0.5,
        "activePercent": 99,
        "costPerKg": 3.2,
        "function": "Alkalinity Buffer"
      },
      {
        "id": "7",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 3,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Water Softener"
      },
      {
        "id": "8",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 1.8,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Viscosity Modifier"
      },
      {
        "id": "9",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "10",
        "name": "Optical Brightener CBS-X (Tinopal CBS-X)",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 35,
        "function": "Whitening Agent"
      },
      {
        "id": "11",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 0.8,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Scent"
      }
    ]
  },

  // 2. LAUNDRY_LIQUID: Economy Commercial Laundry Liquid
  {
    "id": "eco-laundry-liquid",
    "name": "Economy Commercial Laundry Liquid",
    "category": "Liquid Laundry",
    "targetPH": 8.8,
    "batchSizeKg": 100,
    "description": "Value-engineered liquid laundry detergent with reliable soil removal and balanced cost.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 77.27,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 6.5,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Detergent Acid"
      },
      {
        "id": "3",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 1.53,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "LABSA Neutralizer"
      },
      {
        "id": "4",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 10,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Foaming Agent"
      },
      {
        "id": "5",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Alkalinity Reserve"
      },
      {
        "id": "6",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2.2,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Viscosity Modifier"
      },
      {
        "id": "7",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Chelator"
      },
      {
        "id": "8",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "9",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 0.4,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Scent"
      }
    ]
  },

  // 3. LAUNDRY_LIQUID: Premium Front-Load Matic Enzyme Laundry Gel
  {
    "id": "matic-frontload-enzyme-laundry",
    "name": "Premium Front-Load Matic Enzyme Laundry Gel",
    "category": "Liquid Laundry",
    "targetPH": 8.2,
    "batchSizeKg": 100,
    "description": "Controlled-suds front load matic liquid detergent with multi-enzyme stain breakdown system.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 57.65,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 10,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Cleaning Surfactant"
      },
      {
        "id": "3",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 2.35,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "LABSA Neutralizer"
      },
      {
        "id": "4",
        "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO)",
        "category": "Nonionic Surfactant",
        "percent": 12,
        "activePercent": 100,
        "costPerKg": 2.9,
        "function": "Low-Foam Detergency"
      },
      {
        "id": "5",
        "name": "APG 1214 (Lauryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 5,
        "activePercent": 50,
        "costPerKg": 2.5,
        "function": "Plant Co-Surfactant"
      },
      {
        "id": "6",
        "name": "GLDA 47% Liquid (Dissolvine GL-47)",
        "category": "Builder / Chelator",
        "percent": 3,
        "activePercent": 47,
        "costPerKg": 2.2,
        "function": "Eco Chelation"
      },
      {
        "id": "7",
        "name": "Monopropylene Glycol 99.5% (MPG / Propylene Glycol)",
        "category": "Solvent & Hydrotrope",
        "percent": 4,
        "activePercent": 99,
        "costPerKg": 2.4,
        "function": "Enzyme Stabilizer"
      },
      {
        "id": "8",
        "name": "Protease Liquid (Savinase / Alcalase)",
        "category": "Enzymes",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 14,
        "function": "Protein Stain Breakdown"
      },
      {
        "id": "9",
        "name": "Silicone Antifoam Emulsion 30%",
        "category": "Additive & Performance",
        "percent": 0.4,
        "activePercent": 30,
        "costPerKg": 6.5,
        "function": "Front-Load Suds Suppressor"
      },
      {
        "id": "10",
        "name": "Xanthan Gum 200 Mesh",
        "category": "Polymer & Thickener",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 7.5,
        "function": "Rheology Modifier"
      },
      {
        "id": "11",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "12",
        "name": "Triethanolamine 99% (TEA)",
        "category": "Neutralizer / Base",
        "percent": 1.5,
        "activePercent": 99,
        "costPerKg": 3.2,
        "function": "Enzyme Buffer"
      },
      {
        "id": "13",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Scent"
      }
    ]
  },

  // 4. LAUNDRY_POWDER: Economy Commercial Washing Powder
  {
    "id": "eco-washing-powder",
    "name": "Economy Commercial Washing Powder",
    "category": "Powder Laundry",
    "targetPH": 10.5,
    "batchSizeKg": 100,
    "description": "High-bulk commercial laundry powder formulated with active soda ash and balanced builders.",
    "ingredients": [
      {
        "id": "1",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 26,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Alkalinity & Saponification"
      },
      {
        "id": "2",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 11,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Detergent Acid"
      },
      {
        "id": "3",
        "name": "Sodium Hydroxide 99% Flakes",
        "category": "Neutralizer / Base",
        "percent": 1.35,
        "activePercent": 99,
        "costPerKg": 0.95,
        "function": "LABSA Neutralizer"
      },
      {
        "id": "4",
        "name": "Sodium Silicate Liquid (2.4 Ratio)",
        "category": "Alkaline Builder",
        "percent": 5,
        "activePercent": 40,
        "costPerKg": 0.4,
        "function": "Corrosion Inhibitor & Agglomeration"
      },
      {
        "id": "5",
        "name": "Sodium Tripolyphosphate 94% (STPP)",
        "category": "Builder / Chelator",
        "percent": 6,
        "activePercent": 94,
        "costPerKg": 1.8,
        "function": "Calcium Chelation"
      },
      {
        "id": "6",
        "name": "Sodium Sulfate Anhydrous",
        "category": "Additive & Performance",
        "percent": 38.65,
        "activePercent": 100,
        "costPerKg": 0.12,
        "function": "Bulking Carrier"
      },
      {
        "id": "7",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 11,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Processing Filler"
      },
      {
        "id": "8",
        "name": "Optical Brightener CBS-X (Tinopal CBS-X)",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 35,
        "function": "Whitening Agent"
      },
      {
        "id": "9",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Scent"
      }
    ]
  },

  // 5. LAUNDRY_POWDER: Standard Active Detergent Powder (Already VALID)
  {
    "id": "standard-active-laundry-powder",
    "name": "Standard Active Detergent Powder",
    "category": "Powder Laundry",
    "targetPH": 10.2,
    "batchSizeKg": 100,
    "description": "General-purpose washing powder with zeolite builder system and active oxygen bleaching system.",
    "ingredients": [
      {
        "id": "1",
        "name": "Sodium Carbonate (Soda Ash Dense)",
        "category": "Alkaline Builder",
        "percent": 28,
        "activePercent": 100,
        "costPerKg": 0.48,
        "function": "Alkalinity Builder"
      },
      {
        "id": "2",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 12,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Surfactant"
      },
      {
        "id": "3",
        "name": "Zeolite 4A Builder Powder",
        "category": "Alkaline Builder",
        "percent": 10,
        "activePercent": 100,
        "costPerKg": 0.85,
        "function": "Phosphate-Free Builder"
      },
      {
        "id": "4",
        "name": "Sodium Silicate Liquid (2.4 Ratio)",
        "category": "Alkaline Builder",
        "percent": 6,
        "activePercent": 40,
        "costPerKg": 0.4,
        "function": "Anti-Corrosion & Processing"
      },
      {
        "id": "5",
        "name": "Sodium Percarbonate (Active Oxygen Bleach)",
        "category": "Bleach & Oxidizer",
        "percent": 5,
        "activePercent": 100,
        "costPerKg": 1.6,
        "function": "Oxygen Bleaching"
      },
      {
        "id": "6",
        "name": "TAED Bleach Activator (Tetraacetylethylenediamine)",
        "category": "Bleach & Oxidizer",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 4.2,
        "function": "Low-Temp Bleach Catalyst"
      },
      {
        "id": "7",
        "name": "Sodium Sulfate Anhydrous",
        "category": "Additive & Performance",
        "percent": 35.5,
        "activePercent": 100,
        "costPerKg": 0.12,
        "function": "Carrier"
      },
      {
        "id": "8",
        "name": "Optical Brightener CBS-X (Tinopal CBS-X)",
        "category": "Optical Brightener & Dye",
        "percent": 2,
        "activePercent": 100,
        "costPerKg": 35,
        "function": "Optical Brightener"
      }
    ]
  },

  // 6. LAUNDRY_POWDER: Premium Concentrated Oxy-Enzyme Washing Powder
  {
    "id": "premium-oxy-enzyme-powder",
    "name": "Premium Concentrated Oxy-Enzyme Washing Powder",
    "category": "Powder Laundry",
    "targetPH": 10.2,
    "batchSizeKg": 100,
    "description": "High-tier concentrated detergent powder combining enzymatic action with active oxygen stain removal.",
    "ingredients": [
      {
        "id": "1",
        "name": "Sodium Carbonate (Soda Ash Dense)",
        "category": "Alkaline Builder",
        "percent": 26,
        "activePercent": 100,
        "costPerKg": 0.48,
        "function": "Alkalinity Builder"
      },
      {
        "id": "2",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 10,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Surfactant"
      },
      {
        "id": "3",
        "name": "SLS 95% Needles (Sodium Lauryl Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 3,
        "activePercent": 95,
        "costPerKg": 2.4,
        "function": "High Foam & Flash Lather"
      },
      {
        "id": "4",
        "name": "Sodium Percarbonate (Active Oxygen Bleach)",
        "category": "Bleach & Oxidizer",
        "percent": 10,
        "activePercent": 100,
        "costPerKg": 1.6,
        "function": "Bleaching Agent"
      },
      {
        "id": "5",
        "name": "TAED Bleach Activator (Tetraacetylethylenediamine)",
        "category": "Bleach & Oxidizer",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 4.2,
        "function": "Bleach Activator"
      },
      {
        "id": "6",
        "name": "Zeolite 4A Builder Powder",
        "category": "Alkaline Builder",
        "percent": 12,
        "activePercent": 100,
        "costPerKg": 0.85,
        "function": "Calcium Ion Exchanger"
      },
      {
        "id": "7",
        "name": "Carboxymethyl Cellulose Technical (CMC)",
        "category": "Polymer & Thickener",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 3.8,
        "function": "Anti-Redeposition Agent"
      },
      {
        "id": "8",
        "name": "Sodium Sulfate Anhydrous",
        "category": "Additive & Performance",
        "percent": 32.5,
        "activePercent": 100,
        "costPerKg": 0.12,
        "function": "Standardizing Carrier"
      },
      {
        "id": "9",
        "name": "Optical Brightener CBS-X (Tinopal CBS-X)",
        "category": "Optical Brightener & Dye",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 35,
        "function": "Fluorescent Brightener"
      },
      {
        "id": "10",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fragrance"
      }
    ]
  },

  // 7. DISHWASH_MANUAL: Premium Concentrated Manual Dishwashing Liquid
  {
    "id": "manual-dishwash-gel",
    "name": "Premium Concentrated Manual Dishwashing Liquid",
    "category": "Manual Dishwash",
    "targetPH": 6.8,
    "batchSizeKg": 100,
    "description": "High-active grease-cutting hand dishwashing liquid with skin emollient system.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 61.19,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 18,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "High-Foaming Cleanser"
      },
      {
        "id": "3",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 6,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Primary Grease-Cutting Surfactant"
      },
      {
        "id": "4",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 1.41,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "Stoichiometric LABSA Neutralizer"
      },
      {
        "id": "5",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 7,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Foam Booster & Mildness"
      },
      {
        "id": "6",
        "name": "Cocamide MEA 90% (CMEA)",
        "category": "Nonionic Surfactant",
        "percent": 2,
        "activePercent": 90,
        "costPerKg": 3.4,
        "function": "Foam Stabilizer"
      },
      {
        "id": "7",
        "name": "Glycerin 99.5% USP",
        "category": "Solvent & Hydrotrope",
        "percent": 1,
        "activePercent": 99,
        "costPerKg": 1.8,
        "function": "Skin Conditioner"
      },
      {
        "id": "8",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2.2,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Salt Gel Thickener"
      },
      {
        "id": "9",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.1,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "pH Buffer"
      },
      {
        "id": "10",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "11",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Lemon Fragrance"
      }
    ]
  },

  // 8. DISHWASH_MANUAL: Eco-Friendly Lime Dishwashing Gel
  {
    "id": "eco-lime-dishwash-gel",
    "name": "Eco-Friendly Lime Dishwashing Gel",
    "category": "Manual Dishwash",
    "targetPH": 7.0,
    "batchSizeKg": 100,
    "description": "Commercial lime manual dishwash formulated with balanced anionic-amphoteric surfactants.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 72.84,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 14,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Primary Foamer"
      },
      {
        "id": "3",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 4.5,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Grease Cutting Acid"
      },
      {
        "id": "4",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 1.06,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "LABSA Neutralizer"
      },
      {
        "id": "5",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 3.0,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Foam Stability"
      },
      {
        "id": "6",
        "name": "Cocamide DEA 85% (CDEA / CDE)",
        "category": "Nonionic Surfactant",
        "percent": 1.5,
        "activePercent": 85,
        "costPerKg": 2.8,
        "function": "Viscosity & Foam"
      },
      {
        "id": "7",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Salt Viscosity Builder"
      },
      {
        "id": "8",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.1,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "pH Buffer"
      },
      {
        "id": "9",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "10",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 0.9,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Lime Fragrance"
      }
    ]
  },

  // 9. DISHWASH_MANUAL: Ultra-Gentle APG Plant-Based Dishwash
  {
    "id": "ultra-gentle-apg-dishwash",
    "name": "Ultra-Gentle APG Plant-Based Dishwash",
    "category": "Manual Dishwash",
    "targetPH": 6.5,
    "batchSizeKg": 100,
    "description": "Sulfate-free dermatologically mild manual dish cleaner powered by alkyl polyglucosides.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 57.8,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 16,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Plant Cleanser"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 14,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Mild Amphoteric Surfactant"
      },
      {
        "id": "4",
        "name": "Sodium Lauryl Sarcosinate 30%",
        "category": "Anionic Surfactant",
        "percent": 6,
        "activePercent": 30,
        "costPerKg": 3.1,
        "function": "Mild Anionic Co-Foamer"
      },
      {
        "id": "5",
        "name": "Glycerin 99.5% USP",
        "category": "Solvent & Hydrotrope",
        "percent": 2.5,
        "activePercent": 99,
        "costPerKg": 1.8,
        "function": "Skin Emollient"
      },
      {
        "id": "6",
        "name": "Xanthan Gum 200 Mesh",
        "category": "Polymer & Thickener",
        "percent": 0.8,
        "activePercent": 100,
        "costPerKg": 7.5,
        "function": "Hydrocolloid Thickener"
      },
      {
        "id": "7",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.8,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Chelator & Buffer"
      },
      {
        "id": "8",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.1,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Acid Buffer"
      },
      {
        "id": "9",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "10",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 0.9,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fragrance"
      }
    ]
  },

  // 10. DISHWASH_AUTOMATIC: Commercial Machine Dishwash Liquid Detergent
  {
    "id": "auto-dish-liquid",
    "name": "Commercial Machine Dishwash Liquid Detergent",
    "category": "Automatic Dishwasher",
    "targetPH": 10.5,
    "batchSizeKg": 100,
    "description": "Heavy-duty commercial automatic dishwasher liquid formulated with low-foaming surfactants and silicates.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 70.8,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "Potassium Hydroxide 45% Liquid",
        "category": "Neutralizer / Base",
        "percent": 1.2,
        "activePercent": 45,
        "costPerKg": 1.1,
        "function": "Alkalinity Saponifier"
      },
      {
        "id": "3",
        "name": "Sodium Silicate Liquid (2.4 Ratio)",
        "category": "Alkaline Builder",
        "percent": 10,
        "activePercent": 40,
        "costPerKg": 0.4,
        "function": "Glassware Protection & Alkalinity"
      },
      {
        "id": "4",
        "name": "Sodium Tripolyphosphate 94% (STPP)",
        "category": "Builder / Chelator",
        "percent": 10,
        "activePercent": 94,
        "costPerKg": 1.8,
        "function": "Calcium Chelation"
      },
      {
        "id": "5",
        "name": "Pluronic Low-Foam Nonionic EO/PO (PE 6400)",
        "category": "Nonionic Surfactant",
        "percent": 5,
        "activePercent": 100,
        "costPerKg": 4.5,
        "function": "Zero-Foam Sheeting Surfactant"
      },
      {
        "id": "6",
        "name": "Acrysol 33 (ASE Polymer 30%)",
        "category": "Polymer & Thickener",
        "percent": 2.5,
        "activePercent": 30,
        "costPerKg": 4.2,
        "function": "Alkali-Swellable Suspension Polymer"
      },
      {
        "id": "7",
        "name": "Aesthetic Colorant & Liquid Dye Solution",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 8,
        "function": "Color"
      }
    ]
  },

  // 11. DISHWASH_AUTOMATIC: Enzyme Auto-Dishwashing Gel
  {
    "id": "auto-dish-enzyme-gel",
    "name": "Enzyme Auto-Dishwashing Gel",
    "category": "Automatic Dishwasher",
    "targetPH": 9.2,
    "batchSizeKg": 100,
    "description": "Phosphate-free automatic dish gel utilizing enzymes and eco-friendly GLDA chelator.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 64.9,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Alkaline Builder & pH Buffer"
      },
      {
        "id": "3",
        "name": "GLDA 47% Liquid (Dissolvine GL-47)",
        "category": "Builder / Chelator",
        "percent": 8,
        "activePercent": 47,
        "costPerKg": 2.2,
        "function": "Biodegradable Hardness Chelator"
      },
      {
        "id": "4",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 6,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Scale Prevention"
      },
      {
        "id": "5",
        "name": "Pluronic Low-Foam Nonionic EO/PO (PE 6400)",
        "category": "Nonionic Surfactant",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 4.5,
        "function": "Zero-Foam Detergent"
      },
      {
        "id": "6",
        "name": "LAE-3 (C12-15 Alcohol Ethoxylate 3EO)",
        "category": "Nonionic Surfactant",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Low-Foam Defoaming Co-Surfactant"
      },
      {
        "id": "7",
        "name": "Acrysol 33 (ASE Polymer 30%)",
        "category": "Polymer & Thickener",
        "percent": 3,
        "activePercent": 30,
        "costPerKg": 4.2,
        "function": "Viscosity & Sheeting"
      },
      {
        "id": "8",
        "name": "Glycerin 99.5% USP",
        "category": "Solvent & Hydrotrope",
        "percent": 5,
        "activePercent": 99,
        "costPerKg": 1.8,
        "function": "Enzyme Hydrotrope"
      },
      {
        "id": "9",
        "name": "Protease Liquid (Savinase / Alcalase)",
        "category": "Enzymes",
        "percent": 1.8,
        "activePercent": 100,
        "costPerKg": 14,
        "function": "Food Soil Digestion"
      },
      {
        "id": "10",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "11",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.7,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Lemon Scent"
      }
    ]
  },

  // 12. DISHWASH_AUTOMATIC / RINSE_AID: Commercial Dishwasher Rinse Aid & Sheeting Agent
  {
    "id": "commercial-dishwasher-rinse-aid",
    "name": "Commercial Dishwasher Rinse Aid & Sheeting Agent",
    "category": "Automatic Dishwasher",
    "targetPH": 2.8,
    "batchSizeKg": 100,
    "description": "Acidic non-foaming rinse aid and sheeting agent utilizing low-foaming EO/PO polymers.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 74.0,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 4.5,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Acidic Descaler & Water Spot Preventer"
      },
      {
        "id": "3",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "pH Buffer"
      },
      {
        "id": "4",
        "name": "Pluronic Low-Foam Nonionic EO/PO (PE 6400)",
        "category": "Nonionic Surfactant",
        "percent": 12.0,
        "activePercent": 100,
        "costPerKg": 4.5,
        "function": "Rapid Sheeting & Zero Foam Agent"
      },
      {
        "id": "5",
        "name": "Isopropanol 99% (IPA / Isopropyl Alcohol)",
        "category": "Solvent & Hydrotrope",
        "percent": 4.0,
        "activePercent": 99,
        "costPerKg": 1.6,
        "function": "Drying Accelerator"
      },
      {
        "id": "6",
        "name": "Sodium Cumene Sulfonate 40% (SCS 40)",
        "category": "Solvent & Hydrotrope",
        "percent": 3.5,
        "activePercent": 40,
        "costPerKg": 1.9,
        "function": "Coupling Hydrotrope"
      },
      {
        "id": "7",
        "name": "Acid Blue 9 Liquid Colorant",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 6.5,
        "function": "Aesthetic Tint"
      }
    ]
  },

  // 13. FLOOR_CLEANER: Pine Disinfectant Floor Cleaner (Already VALID)
  {
    "id": "pine-disinfectant-floor-cleaner",
    "name": "Pine Disinfectant Floor Cleaner",
    "category": "Floor Cleaner",
    "targetPH": 8.0,
    "batchSizeKg": 100,
    "description": "Traditional pine oil quaternary disinfectant floor cleaner for deodorizing and grease removal.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 85.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Benzalkonium Chloride 80% (BKC 80)",
        "category": "Cationic Surfactant",
        "percent": 2.5,
        "activePercent": 80,
        "costPerKg": 4.8,
        "function": "Biocide & Quaternary Disinfectant"
      },
      {
        "id": "3",
        "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO)",
        "category": "Nonionic Surfactant",
        "percent": 3,
        "activePercent": 100,
        "costPerKg": 2.9,
        "function": "Compatible Nonionic Emulsifier"
      },
      {
        "id": "4",
        "name": "Natural Pine Oil (85%)",
        "category": "Solvent & Hydrotrope",
        "percent": 4,
        "activePercent": 85,
        "costPerKg": 5.2,
        "function": "Pine Deodorizer & Degreaser"
      },
      {
        "id": "5",
        "name": "Isopropanol 99% (IPA / Isopropyl Alcohol)",
        "category": "Solvent & Hydrotrope",
        "percent": 3,
        "activePercent": 99,
        "costPerKg": 1.6,
        "function": "Solvent Clarifier"
      },
      {
        "id": "6",
        "name": "Aesthetic Colorant & Liquid Dye Solution",
        "category": "Optical Brightener & Dye",
        "percent": 2,
        "activePercent": 100,
        "costPerKg": 8,
        "function": "Emerald Green Dye"
      }
    ]
  },

  // 14. FLOOR_CLEANER: Neutral Floor Cleaner & Restorer
  {
    "id": "neutral-floor-cleaner-restorer",
    "name": "Neutral Floor Cleaner & Restorer",
    "category": "Floor Cleaner",
    "targetPH": 7.2,
    "batchSizeKg": 100,
    "description": "pH-neutral floor maintenance detergent engineered for high-gloss marble, granite, and polished tiles.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 84.75,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 6,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Residue-Free Nonionic Cleanser"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 4,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Surface Wetting"
      },
      {
        "id": "4",
        "name": "GLDA 47% Liquid (Dissolvine GL-47)",
        "category": "Builder / Chelator",
        "percent": 1.5,
        "activePercent": 47,
        "costPerKg": 2.2,
        "function": "Chelator"
      },
      {
        "id": "5",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.35,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Neutral pH Buffer"
      },
      {
        "id": "6",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "7",
        "name": "Isopropanol 99% (IPA / Isopropyl Alcohol)",
        "category": "Solvent & Hydrotrope",
        "percent": 2.0,
        "activePercent": 99,
        "costPerKg": 1.6,
        "function": "Fast Evaporation"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.3,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fragrance"
      }
    ]
  },

  // 15. FLOOR_CLEANER: Multi-Surface Lavender Floor Cleaner
  {
    "id": "multi-surface-lavender-floor",
    "name": "Multi-Surface Lavender Floor Cleaner",
    "category": "Floor Cleaner",
    "targetPH": 7.8,
    "batchSizeKg": 100,
    "description": "Streak-free scented floor cleaner for tile, vinyl, and sealed hardwood surfaces.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 87.75,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 4,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Detergency & Lather"
      },
      {
        "id": "3",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Oil Dispersion"
      },
      {
        "id": "4",
        "name": "Tetrasodium EDTA 39% Liquid",
        "category": "Builder / Chelator",
        "percent": 1,
        "activePercent": 39,
        "costPerKg": 1.9,
        "function": "Hard Water Chelation"
      },
      {
        "id": "5",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.15,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "pH Neutralizer"
      },
      {
        "id": "6",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Viscosity Stabilizer"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Lavender Scent"
      }
    ]
  },

  // 16. MULTIPURPOSE_CLEANER: All-Purpose Surface Cleaner Spray
  {
    "id": "all-purpose-spray-cleaner",
    "name": "All-Purpose Surface Cleaner Spray",
    "category": "Multipurpose Cleaner",
    "targetPH": 8.5,
    "batchSizeKg": 100,
    "description": "Ready-to-use spray-and-wipe cleaner for counters, appliances, and non-porous surfaces.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 86.4,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 5.0,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Degreasing Nonionic Surfactant"
      },
      {
        "id": "3",
        "name": "Propylene Glycol Monomethyl Ether (PM Solvent)",
        "category": "Solvent & Hydrotrope",
        "percent": 3,
        "activePercent": 100,
        "costPerKg": 2.5,
        "function": "Grease Dissolving Solvent"
      },
      {
        "id": "4",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 2,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Builder & Buffer"
      },
      {
        "id": "5",
        "name": "Sodium Xylene Sulfonate 40% (SXS 40)",
        "category": "Solvent & Hydrotrope",
        "percent": 1.5,
        "activePercent": 40,
        "costPerKg": 1.7,
        "function": "Coupling Hydrotrope"
      },
      {
        "id": "6",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Citrus Fresh Scent"
      }
    ]
  },

  // 17. MULTIPURPOSE_CLEANER: Eco-Citrus APG Multi-Surface Cleaner
  {
    "id": "eco-citrus-apg-cleaner",
    "name": "Eco-Citrus APG Multi-Surface Cleaner",
    "category": "Multipurpose Cleaner",
    "targetPH": 8.0,
    "batchSizeKg": 100,
    "description": "Plant-derived multi-surface spray utilizing natural citrus terpenes and APG surfactants.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 81.05,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 7,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Renewable Nonionic Detergent"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 4,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Foaming & Soil Lift"
      },
      {
        "id": "4",
        "name": "D-Limonene (Natural Citrus Terpene 95%)",
        "category": "Solvent & Hydrotrope",
        "percent": 2.5,
        "activePercent": 95,
        "costPerKg": 7.5,
        "function": "Natural Terpene Degreaser"
      },
      {
        "id": "5",
        "name": "GLDA 47% Liquid (Dissolvine GL-47)",
        "category": "Builder / Chelator",
        "percent": 2,
        "activePercent": 47,
        "costPerKg": 2.2,
        "function": "Sustainable Chelator"
      },
      {
        "id": "6",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.35,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "pH Neutralizer"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Orange Oil Fragrance"
      }
    ]
  },

  // 18. MULTIPURPOSE_CLEANER: Economy Household All-Purpose Cleaner
  {
    "id": "economy-household-apc",
    "name": "Economy Household All-Purpose Cleaner",
    "category": "Multipurpose Cleaner",
    "targetPH": 9.0,
    "batchSizeKg": 100,
    "description": "Economical dilution cleaner for general floor, countertop, and tile sanitation.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 88.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 6,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Primary Cleaning Surfactant"
      },
      {
        "id": "3",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Grease Solubilizer"
      },
      {
        "id": "4",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Mild Alkaline Builder"
      },
      {
        "id": "5",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.9,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Buffer & Chelator"
      },
      {
        "id": "6",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Citrus Bouquet"
      }
    ]
  },

  // 19. TOILET_CLEANER: Thickened HCl Acidic Toilet Bowl Cleaner
  {
    "id": "thick-hcl-toilet-cleaner",
    "name": "Thickened HCl Acidic Toilet Bowl Cleaner",
    "category": "Toilet Cleaner",
    "targetPH": 0.5,
    "batchSizeKg": 100,
    "description": "Heavy descaling toilet bowl cleaner utilizing inhibited hydrochloric acid and cling rheology.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 88.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Hydrochloric Acid 33% (HCl Technical)",
        "category": "Acid & Descaler",
        "percent": 3.5,
        "activePercent": 33,
        "costPerKg": 0.35,
        "function": "Heavy Mineral Acid Descaler"
      },
      {
        "id": "3",
        "name": "Tallow Amine Ethoxylate / Amine Oxide Acid Thickener",
        "category": "Polymer & Thickener",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 6.8,
        "function": "Acid-Stable Cling Rheology Modifier"
      },
      {
        "id": "4",
        "name": "Acid Corrosion Inhibitor (Propargyl Alcohol Derivative)",
        "category": "Additive & Performance",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 18,
        "function": "Pipe & Enamel Corrosion Protector"
      },
      {
        "id": "5",
        "name": "Acid Blue 9 Liquid Colorant",
        "category": "Optical Brightener & Dye",
        "percent": 5.0,
        "activePercent": 100,
        "costPerKg": 6.5,
        "function": "Indicator Dye"
      }
    ]
  },

  // 20. TOILET_CLEANER: Eco-Friendly Organic Acid Toilet Cleaner
  {
    "id": "eco-organic-acid-toilet-cleaner",
    "name": "Eco-Friendly Organic Acid Toilet Cleaner",
    "category": "Toilet Cleaner",
    "targetPH": 2.0,
    "batchSizeKg": 100,
    "description": "Safe, biodegradable toilet bowl descaler powered by organic acid system and plant gums.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 80.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 8.0,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Organic Limescale Dissolver"
      },
      {
        "id": "3",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Buffer to Target pH 2.0"
      },
      {
        "id": "4",
        "name": "LAE-7 (C12-15 Alcohol Ethoxylate 7EO)",
        "category": "Nonionic Surfactant",
        "percent": 3.5,
        "activePercent": 100,
        "costPerKg": 2.9,
        "function": "Detergent & Wetting Agent"
      },
      {
        "id": "5",
        "name": "Xanthan Gum 200 Mesh",
        "category": "Polymer & Thickener",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 7.5,
        "function": "Bowl Cling Thickener"
      },
      {
        "id": "6",
        "name": "Acid Blue 9 Liquid Colorant",
        "category": "Optical Brightener & Dye",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 6.5,
        "function": "Aesthetic Color"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 4.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Pine Fragrance"
      }
    ]
  },

  // 21. TOILET_CLEANER: Economy Viscous Acid Toilet Bowl Cleaner
  {
    "id": "economy-viscous-acid-bowl",
    "name": "Economy Viscous Acid Toilet Bowl Cleaner",
    "category": "Toilet Cleaner",
    "targetPH": 0.5,
    "batchSizeKg": 100,
    "description": "High-value acidic descaler with surfactant cling for commercial washroom sanitation.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 88.0,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Hydrochloric Acid 33% (HCl Technical)",
        "category": "Acid & Descaler",
        "percent": 4.5,
        "activePercent": 33,
        "costPerKg": 0.35,
        "function": "Mineral Acid Descaler"
      },
      {
        "id": "3",
        "name": "Cetrimonium Chloride 29% (CTAC)",
        "category": "Cationic Surfactant",
        "percent": 5.0,
        "activePercent": 29,
        "costPerKg": 2.2,
        "function": "Acid-Compatible Cationic Surfactant & Biocide"
      },
      {
        "id": "4",
        "name": "Acid Corrosion Inhibitor (Propargyl Alcohol Derivative)",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 18,
        "function": "Corrosion Inhibitor"
      },
      {
        "id": "5",
        "name": "Acid Blue 9 Liquid Colorant",
        "category": "Optical Brightener & Dye",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 6.5,
        "function": "Indicator Tint"
      }
    ]
  },

  // 22. BATHROOM_CLEANER: Bathroom Soap Scum & Scale Remover
  {
    "id": "soap-scum-scale-remover",
    "name": "Bathroom Soap Scum & Scale Remover",
    "category": "Bathroom Cleaner",
    "targetPH": 2.8,
    "batchSizeKg": 100,
    "description": "High-potency organic acid spray targeting calcium soap scum and stubborn hard water deposits.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 83.2,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 4.5,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Limescale Chelating Acid"
      },
      {
        "id": "3",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "pH Buffer"
      },
      {
        "id": "4",
        "name": "Glycolic Acid 70% Liquid",
        "category": "Acid & Descaler",
        "percent": 1.5,
        "activePercent": 70,
        "costPerKg": 4.8,
        "function": "Soap Scum Dissolver"
      },
      {
        "id": "5",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 5.0,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Foaming & Soil Disperser"
      },
      {
        "id": "6",
        "name": "Dipropylene Glycol n-Butyl Ether (DPnB Solvent)",
        "category": "Solvent & Hydrotrope",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 3.6,
        "function": "Hydrophobic Penetrant"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.7,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fresh Ocean Scent"
      }
    ]
  },

  // 23. BATHROOM_CLEANER: Foam-Action Acidic Tile Cleaner (Already VALID)
  {
    "id": "foam-action-tile-cleaner",
    "name": "Foam-Action Acidic Tile Cleaner",
    "category": "Bathroom Cleaner",
    "targetPH": 3.2,
    "batchSizeKg": 100,
    "description": "Trigger-spray clinging foam cleaner for ceramic tiles, porcelain sinks, and fiberglass enclosures.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 89,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Lactic Acid 88% Liquid",
        "category": "Acid & Descaler",
        "percent": 4,
        "activePercent": 88,
        "costPerKg": 3.2,
        "function": "Natural Alpha-Hydroxy Acid Descaler"
      },
      {
        "id": "3",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 3,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Nonionic Detergent"
      },
      {
        "id": "4",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 2,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Acid-Stable Clinging Foam Booster"
      },
      {
        "id": "5",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Eucalyptus Mint Scent"
      }
    ]
  },

  // 24. BATHROOM_CLEANER: Acid-Free Disinfectant Bathroom Spray
  {
    "id": "acid-free-disinfectant-bathroom",
    "name": "Acid-Free Disinfectant Bathroom Spray",
    "category": "Bathroom Cleaner",
    "targetPH": 9.5,
    "batchSizeKg": 100,
    "description": "Alkaline quaternary ammonium sanitizing spray formulated safely for polished marble, travertine, and chrome fixtures.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 89.2,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Benzalkonium Chloride 80% (BKC 80)",
        "category": "Cationic Surfactant",
        "percent": 2.0,
        "activePercent": 80,
        "costPerKg": 4.8,
        "function": "Broad-Spectrum Quaternary Biocide"
      },
      {
        "id": "3",
        "name": "Tetrasodium EDTA 39% Liquid",
        "category": "Builder / Chelator",
        "percent": 2.0,
        "activePercent": 39,
        "costPerKg": 1.9,
        "function": "Chelator & Biocide Synergist"
      },
      {
        "id": "4",
        "name": "Sodium Bicarbonate",
        "category": "Alkaline Builder",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 0.55,
        "function": "Buffering Agent (pH 9.5)"
      },
      {
        "id": "5",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 4.0,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Quat-Compatible Nonionic Detergent"
      },
      {
        "id": "6",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.3,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Clean Linen Fragrance"
      }
    ]
  },

  // 25. GLASS_CLEANER: Anti-Fog Glass & Mirror Cleaner
  {
    "id": "anti-fog-glass-cleaner",
    "name": "Anti-Fog Glass & Mirror Cleaner",
    "category": "Glass / Window Cleaner",
    "targetPH": 9.5,
    "batchSizeKg": 100,
    "description": "Streak-free volatile window spray with anti-fog polymer coating to prevent bathroom mirror condensation.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 85.05,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "Isopropanol 99% (IPA / Isopropyl Alcohol)",
        "category": "Solvent & Hydrotrope",
        "percent": 8.0,
        "activePercent": 99,
        "costPerKg": 1.6,
        "function": "Rapid Evaporating Solvent"
      },
      {
        "id": "3",
        "name": "Ethylene Glycol Monobutyl Ether (Butyl Cellosolve / EGBE)",
        "category": "Solvent & Hydrotrope",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 2.7,
        "function": "Coupling Solvent"
      },
      {
        "id": "4",
        "name": "SLS 30% Liquid",
        "category": "Anionic Surfactant",
        "percent": 3.0,
        "activePercent": 30,
        "costPerKg": 1.1,
        "function": "Glass Wetting Agent"
      },
      {
        "id": "5",
        "name": "Ammonium Hydroxide 25% (Ammonia Water)",
        "category": "Neutralizer / Base",
        "percent": 0.4,
        "activePercent": 25,
        "costPerKg": 0.8,
        "function": "Volatile Streak-Free Alkalinity"
      },
      {
        "id": "6",
        "name": "Anti-Fog Hydrophilic Surface Polymer",
        "category": "Polymer & Thickener",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 22,
        "function": "Hydrophilic Anti-Condensation Sheeting"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.05,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Acid Blue 9 Liquid Colorant",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 6.5,
        "function": "Traditional Blue Hue"
      }
    ]
  },

  // 26. GLASS_CLEANER: Ammonia-Free Eco-Friendly Glass Spray
  {
    "id": "ammonia-free-eco-glass",
    "name": "Ammonia-Free Eco-Friendly Glass Spray",
    "category": "Glass / Window Cleaner",
    "targetPH": 9.0,
    "batchSizeKg": 100,
    "description": "Ammonia-free streak-free glass spray safe for tinted automotive windows and optical displays.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 89.25,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Ethanol 96% Denatured",
        "category": "Solvent & Hydrotrope",
        "percent": 6.5,
        "activePercent": 96,
        "costPerKg": 1.4,
        "function": "Volatile Drying Alcohol"
      },
      {
        "id": "3",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 1.6,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Streak-Free Bio-Surfactant"
      },
      {
        "id": "4",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 0.1,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Alkaline Buffer"
      },
      {
        "id": "5",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Chelating Agent"
      },
      {
        "id": "6",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.05,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Light Crisp Scent"
      }
    ]
  },

  // 27. GLASS_CLEANER: Economy Commercial Blue Window Spray
  {
    "id": "economy-blue-window-spray",
    "name": "Economy Commercial Blue Window Spray",
    "category": "Glass / Window Cleaner",
    "targetPH": 9.5,
    "batchSizeKg": 100,
    "description": "High-volume commercial window cleaner with fast flash-off and zero film formation.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 92.45,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Isopropanol 99% (IPA / Isopropyl Alcohol)",
        "category": "Solvent & Hydrotrope",
        "percent": 4.5,
        "activePercent": 99,
        "costPerKg": 1.6,
        "function": "Volatile Drying Solvent"
      },
      {
        "id": "3",
        "name": "Ammonium Hydroxide 25% (Ammonia Water)",
        "category": "Neutralizer / Base",
        "percent": 0.4,
        "activePercent": 25,
        "costPerKg": 0.8,
        "function": "Volatile Soil Alkaline Cut"
      },
      {
        "id": "4",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 1.2,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Glass Wetting & Soil Lift"
      },
      {
        "id": "5",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.05,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "6",
        "name": "Acid Blue 9 Liquid Colorant",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 6.5,
        "function": "Classic Blue Hue"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 0.9,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fresh Scent"
      }
    ]
  },

  // 28. FABRIC_SOFTENER: Encapsulated Long-Lasting Fragrance Fabric Softener
  {
    "id": "encapsulated-fragrance-softener",
    "name": "Encapsulated Long-Lasting Fragrance Fabric Softener",
    "category": "Fabric Softener",
    "targetPH": 3.5,
    "batchSizeKg": 100,
    "description": "Premium conditioning rinse aid formulated with cationic esterquats and fragrance encapsulation technology.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 86.65,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Continuous Phase"
      },
      {
        "id": "2",
        "name": "Esterquat 90% (Di-Tallow Esterquat)",
        "category": "Cationic Surfactant",
        "percent": 7.5,
        "activePercent": 90,
        "costPerKg": 2.4,
        "function": "Biodegradable Cationic Softening Agent"
      },
      {
        "id": "3",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.25,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Acid Buffer (pH 3.5)"
      },
      {
        "id": "4",
        "name": "Calcium Chloride 74% Flakes",
        "category": "Additive & Performance",
        "percent": 1,
        "activePercent": 74,
        "costPerKg": 0.45,
        "function": "Electrolyte Viscosity Reducer"
      },
      {
        "id": "5",
        "name": "Cationic Polymer Thickening Emulsion",
        "category": "Polymer & Thickener",
        "percent": 1.5,
        "activePercent": 30,
        "costPerKg": 5.5,
        "function": "Cationic Rheology Modifier"
      },
      {
        "id": "6",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "7",
        "name": "Aesthetic Colorant & Liquid Dye Solution",
        "category": "Optical Brightener & Dye",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 8,
        "function": "Pastel Pink Dye"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Encapsulated Perfume"
      }
    ]
  },

  // 29. FABRIC_SOFTENER: Ultra-Concentrate Fabric Softener
  {
    "id": "ultra-concentrate-softener",
    "name": "Ultra-Concentrate Fabric Softener",
    "category": "Fabric Softener",
    "targetPH": 3.2,
    "batchSizeKg": 100,
    "description": "Triple-concentrated fabric conditioner with amino-silicone fiber protectants.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 79.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Esterquat 90% (Di-Tallow Esterquat)",
        "category": "Cationic Surfactant",
        "percent": 11.0,
        "activePercent": 90,
        "costPerKg": 2.4,
        "function": "High-Concentrate Cationic Softening Agent"
      },
      {
        "id": "3",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.3,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Acid Emulsion Buffer (pH 3.2)"
      },
      {
        "id": "4",
        "name": "Amino-Functional Silicone Emulsion (35%)",
        "category": "Additive & Performance",
        "percent": 2.5,
        "activePercent": 35,
        "costPerKg": 8.5,
        "function": "Fiber Lubricant & Ironing Aid"
      },
      {
        "id": "5",
        "name": "Calcium Chloride 74% Flakes",
        "category": "Additive & Performance",
        "percent": 1.6,
        "activePercent": 74,
        "costPerKg": 0.45,
        "function": "Viscosity Depressant"
      },
      {
        "id": "6",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 5.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Concentrated Floral Oil"
      }
    ]
  },

  // 30. FABRIC_SOFTENER: Economy Commercial Fabric Conditioner
  {
    "id": "economy-fabric-conditioner",
    "name": "Economy Commercial Fabric Conditioner",
    "category": "Fabric Softener",
    "targetPH": 3.5,
    "batchSizeKg": 100,
    "description": "Standard commercial laundromat fabric conditioner for static elimination and fabric softening.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 89.65,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "Esterquat 90% (Di-Tallow Esterquat)",
        "category": "Cationic Surfactant",
        "percent": 5.5,
        "activePercent": 90,
        "costPerKg": 2.4,
        "function": "Cationic Softener"
      },
      {
        "id": "3",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.25,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Acid Buffering Agent"
      },
      {
        "id": "4",
        "name": "Styrene/Acrylates Opacifier 30%",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 30,
        "costPerKg": 2.8,
        "function": "Milky Appearance"
      },
      {
        "id": "5",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "6",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fresh Soft Scent"
      }
    ]
  },

  // 31. HAND_WASH: Antibacterial Pearl Handwash
  {
    "id": "antibacterial-handwash-soap",
    "name": "Antibacterial Pearl Handwash",
    "category": "Hand Wash",
    "targetPH": 6.0,
    "batchSizeKg": 100,
    "description": "Hygiene handwash liquid combining chloroxylenol antimicrobial protection with rich skin conditioners.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 73.18,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 12,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Primary Foaming Cleanser"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 6,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Mild Amphoteric Surfactant"
      },
      {
        "id": "4",
        "name": "Chloroxylenol 99% (PCMX)",
        "category": "Preservative & Biocide",
        "percent": 0.5,
        "activePercent": 99,
        "costPerKg": 12,
        "function": "Antibacterial Active"
      },
      {
        "id": "5",
        "name": "Glycerin 99.5% USP",
        "category": "Solvent & Hydrotrope",
        "percent": 2,
        "activePercent": 99,
        "costPerKg": 1.8,
        "function": "Humectant Emollient"
      },
      {
        "id": "6",
        "name": "Glycol Distearate (EGDS Pearlizer)",
        "category": "Additive & Performance",
        "percent": 2,
        "activePercent": 100,
        "costPerKg": 3.8,
        "function": "Pearly Sheen"
      },
      {
        "id": "7",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Salt Gel Builder"
      },
      {
        "id": "8",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.8,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Skin Buffer (pH 6.0)"
      },
      {
        "id": "9",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.02,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Fine pH Adjuster"
      },
      {
        "id": "10",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Soothing Fragrance"
      }
    ]
  },

  // 32. HAND_WASH: Sulfate-Free Nourishing Hand Wash
  {
    "id": "sulfate-free-nourishing-handwash",
    "name": "Sulfate-Free Nourishing Hand Wash",
    "category": "Hand Wash",
    "targetPH": 5.8,
    "batchSizeKg": 100,
    "description": "Ultra-mild sulfate-free cleanser formulated with glucosides, betaines, and isethionates.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 64.05,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 12,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Sulfate-Free Glucoside"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 12,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Mild Amphoteric Foam"
      },
      {
        "id": "4",
        "name": "Sodium Cocoyl Isethionate 85% (SCI)",
        "category": "Anionic Surfactant",
        "percent": 4,
        "activePercent": 85,
        "costPerKg": 5.5,
        "function": "Creamy Dense Foam"
      },
      {
        "id": "5",
        "name": "D-Panthenol 99% (Pro-Vitamin B5)",
        "category": "Additive & Performance",
        "percent": 1,
        "activePercent": 99,
        "costPerKg": 28,
        "function": "Skin Barrier Vitamin"
      },
      {
        "id": "6",
        "name": "Glycerin 99.5% USP",
        "category": "Solvent & Hydrotrope",
        "percent": 3,
        "activePercent": 99,
        "costPerKg": 1.8,
        "function": "Moisture Binding"
      },
      {
        "id": "7",
        "name": "PEG-120 Methyl Glucose Dioleate Thickener",
        "category": "Polymer & Thickener",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 16,
        "function": "Nonionic Thickener"
      },
      {
        "id": "8",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.8,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Buffer"
      },
      {
        "id": "9",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.05,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "Skin pH Adjuster (pH 5.8)"
      },
      {
        "id": "10",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "11",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Almond Blossom Scent"
      }
    ]
  },

  // 33. HAND_WASH: Economy Pearl Liquid Hand Soap
  {
    "id": "economy-pearl-handwash",
    "name": "Economy Pearl Liquid Hand Soap",
    "category": "Hand Wash",
    "targetPH": 6.2,
    "batchSizeKg": 100,
    "description": "Standard high-lather commercial hand soap for public washroom dispensing.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 80.22,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 10,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Primary Lather Cleanser"
      },
      {
        "id": "3",
        "name": "Cocamide DEA 85% (CDEA / CDE)",
        "category": "Nonionic Surfactant",
        "percent": 2,
        "activePercent": 85,
        "costPerKg": 2.8,
        "function": "Foam Density & Thickener"
      },
      {
        "id": "4",
        "name": "Glycol Distearate (EGDS Pearlizer)",
        "category": "Additive & Performance",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 3.8,
        "function": "White Pearl Effect"
      },
      {
        "id": "5",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Salt Gelation"
      },
      {
        "id": "6",
        "name": "Citric Acid Anhydrous",
        "category": "Builder / Chelator",
        "percent": 0.18,
        "activePercent": 100,
        "costPerKg": 1.3,
        "function": "pH Neutralizer (to pH 6.2)"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 3.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fresh Floral Perfume"
      }
    ]
  },

  // 34. KITCHEN_DEGREASER: Heavy-Duty Caustic Oven & Grill Cleaner
  {
    "id": "heavy-duty-caustic-oven-cleaner",
    "name": "Heavy-Duty Caustic Oven & Grill Cleaner",
    "category": "Kitchen Degreaser",
    "targetPH": 13.5,
    "batchSizeKg": 100,
    "description": "Commercial caustic degreaser engineered to saponify baked-on carbon and grease at alkaline pH 13.5.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 71.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 5.0,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "Caustic Grease Saponifier"
      },
      {
        "id": "3",
        "name": "Sodium Metasilicate Pentahydrate",
        "category": "Alkaline Builder",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 1.1,
        "function": "Alkaline Builder & Metal Protector"
      },
      {
        "id": "4",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 6.0,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Alkali-Stable Nonionic Wetting Agent"
      },
      {
        "id": "5",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 8.0,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Alkali-Stable Glucoside Surfactant"
      },
      {
        "id": "6",
        "name": "Diethylene Glycol Monobutyl Ether (Butyl Diglycol / BDG)",
        "category": "Solvent & Hydrotrope",
        "percent": 3.0,
        "activePercent": 100,
        "costPerKg": 3.2,
        "function": "Heavy Carbon Solvent Penetrant"
      },
      {
        "id": "7",
        "name": "Sodium Xylene Sulfonate 40% (SXS 40)",
        "category": "Solvent & Hydrotrope",
        "percent": 2.5,
        "activePercent": 40,
        "costPerKg": 1.7,
        "function": "Alkali Hydrotrope"
      },
      {
        "id": "8",
        "name": "Xanthan Gum 200 Mesh",
        "category": "Polymer & Thickener",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 7.5,
        "function": "Vertical Cling Agent"
      },
      {
        "id": "9",
        "name": "Aesthetic Colorant & Liquid Dye Solution",
        "category": "Optical Brightener & Dye",
        "percent": 0.5,
        "activePercent": 100,
        "costPerKg": 8,
        "function": "Warning Tint"
      }
    ]
  },

  // 35. KITCHEN_DEGREASER: Commercial Solvent Kitchen Degreaser
  {
    "id": "solvent-kitchen-degreaser",
    "name": "Commercial Solvent Kitchen Degreaser",
    "category": "Kitchen Degreaser",
    "targetPH": 12.5,
    "batchSizeKg": 100,
    "description": "Fast-acting restaurant hood and fryer degreaser coupling butyl ethers with alkaline builders.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 74.0,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "Potassium Hydroxide 45% Liquid",
        "category": "Neutralizer / Base",
        "percent": 4.0,
        "activePercent": 45,
        "costPerKg": 1.1,
        "function": "Soluble Alkaline Builder"
      },
      {
        "id": "3",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 7.0,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Primary Degreasing Nonionic"
      },
      {
        "id": "4",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 4.0,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Anionic Emulsifier"
      },
      {
        "id": "5",
        "name": "Ethylene Glycol Monobutyl Ether (Butyl Cellosolve / EGBE)",
        "category": "Solvent & Hydrotrope",
        "percent": 5.0,
        "activePercent": 100,
        "costPerKg": 2.7,
        "function": "Grease Penetrating Solvent"
      },
      {
        "id": "6",
        "name": "Tetrasodium EDTA 39% Liquid",
        "category": "Builder / Chelator",
        "percent": 2.5,
        "activePercent": 39,
        "costPerKg": 1.9,
        "function": "Water Conditioning Chelator"
      },
      {
        "id": "7",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 3.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Masking Fragrance"
      }
    ]
  },

  // 36. KITCHEN_DEGREASER: Eco-Citrus Solvent-Free Degreaser
  {
    "id": "eco-citrus-solvent-free-degreaser",
    "name": "Eco-Citrus Solvent-Free Degreaser",
    "category": "Kitchen Degreaser",
    "targetPH": 11.5,
    "batchSizeKg": 100,
    "description": "Heavy-duty kitchen degreaser formulated with bio-based alkyl glucosides and citrus terpenes.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 68.5,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Carrier"
      },
      {
        "id": "2",
        "name": "APG 0810 (Caprylyl/Capryl Glucoside 50%)",
        "category": "Nonionic Surfactant",
        "percent": 14.0,
        "activePercent": 50,
        "costPerKg": 2.6,
        "function": "Bio-Based Nonionic Surfactant"
      },
      {
        "id": "3",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 5.0,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Grease Emulsifying Anionic"
      },
      {
        "id": "4",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 3.5,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Alkaline Saponifier & Buffer"
      },
      {
        "id": "5",
        "name": "Potassium Hydroxide 45% Liquid",
        "category": "Neutralizer / Base",
        "percent": 1.5,
        "activePercent": 45,
        "costPerKg": 1.1,
        "function": "Alkali Booster"
      },
      {
        "id": "6",
        "name": "D-Limonene (Natural Citrus Terpene 95%)",
        "category": "Solvent & Hydrotrope",
        "percent": 4.0,
        "activePercent": 95,
        "costPerKg": 7.5,
        "function": "Natural Terpene Degreaser"
      },
      {
        "id": "7",
        "name": "GLDA 47% Liquid (Dissolvine GL-47)",
        "category": "Builder / Chelator",
        "percent": 2.5,
        "activePercent": 47,
        "costPerKg": 2.2,
        "function": "Biodegradable Chelator"
      },
      {
        "id": "8",
        "name": "Aesthetic Colorant & Liquid Dye Solution",
        "category": "Optical Brightener & Dye",
        "percent": 1.0,
        "activePercent": 100,
        "costPerKg": 8,
        "function": "Warm Orange Dye"
      }
    ]
  },

  // 37. CAR_SHAMPOO: Touchless Snow Foam Car Shampoo (Alkaline Pre-Wash)
  {
    "id": "touchless-snow-foam-car-shampoo",
    "name": "Touchless Snow Foam Car Shampoo",
    "category": "Car Shampoo",
    "targetPH": 10.5,
    "batchSizeKg": 100,
    "description": "High-expansion alkaline snow foam for non-contact pre-wash film removal via pressure cannon.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 68.4,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Continuous Phase"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 12.0,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Dense Foam Architecture"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 6.0,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Foam Stability & Film Cling"
      },
      {
        "id": "4",
        "name": "Disodium Laureth Sulfosuccinate (DLS 40%)",
        "category": "Anionic Surfactant",
        "percent": 4.0,
        "activePercent": 40,
        "costPerKg": 2.7,
        "function": "Flash Lather & Hydrodynamic Lift"
      },
      {
        "id": "5",
        "name": "Cocamide DEA 85% (CDEA / CDE)",
        "category": "Nonionic Surfactant",
        "percent": 2.0,
        "activePercent": 85,
        "costPerKg": 2.8,
        "function": "Foam Dense Emulsifier"
      },
      {
        "id": "6",
        "name": "Sodium Metasilicate Pentahydrate",
        "category": "Alkaline Builder",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 1.1,
        "function": "Road Traffic Film Cut (pH 10.5)"
      },
      {
        "id": "7",
        "name": "Sodium Carbonate (Soda Ash Light)",
        "category": "Alkaline Builder",
        "percent": 1.5,
        "activePercent": 100,
        "costPerKg": 0.45,
        "function": "Alkaline Buffer"
      },
      {
        "id": "8",
        "name": "GLDA 47% Liquid (Dissolvine GL-47)",
        "category": "Builder / Chelator",
        "percent": 2.0,
        "activePercent": 47,
        "costPerKg": 2.2,
        "function": "Hard Water Film Chelator"
      },
      {
        "id": "9",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "10",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Cherry Foam Scent"
      }
    ]
  },

  // 38. CAR_SHAMPOO: Premium Wash & Wax Car Shampoo
  {
    "id": "wash-and-wax-car-shampoo",
    "name": "Premium Wash & Wax Car Shampoo",
    "category": "Car Shampoo",
    "targetPH": 7.2,
    "batchSizeKg": 100,
    "description": "High-lubricity pH-neutral auto wash leaving a protective carnauba water-beading sheen.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 70.9,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Continuous Phase"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 12.0,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "High-Lubricity Cleanser"
      },
      {
        "id": "3",
        "name": "CAPB 30% (Cocamidopropyl Betaine)",
        "category": "Amphoteric Surfactant",
        "percent": 5.0,
        "activePercent": 30,
        "costPerKg": 1.6,
        "function": "Lather & Foam Builder"
      },
      {
        "id": "4",
        "name": "Carnauba Wax Microemulsion 20%",
        "category": "Additive & Performance",
        "percent": 4.0,
        "activePercent": 20,
        "costPerKg": 6.8,
        "function": "Hydrophobic Water-Beading Polymer"
      },
      {
        "id": "5",
        "name": "LAE-9 (C12-15 Alcohol Ethoxylate 9EO)",
        "category": "Nonionic Surfactant",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 2.8,
        "function": "Dirt Emulsifier"
      },
      {
        "id": "6",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2.0,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Salt Gel Thickener"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 3.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Tropical Fragrance"
      }
    ]
  },

  // 39. CAR_SHAMPOO: Economy Commercial Auto Wash Liquid
  {
    "id": "economy-auto-wash-liquid",
    "name": "Economy Commercial Auto Wash Liquid",
    "category": "Car Shampoo",
    "targetPH": 7.2,
    "batchSizeKg": 100,
    "description": "High-foaming commercial bucket auto wash with slick lubricity and easy rinsing.",
    "ingredients": [
      {
        "id": "1",
        "name": "Demineralized Water (Aqua)",
        "category": "Solvent & Hydrotrope",
        "percent": 80.6,
        "activePercent": 100,
        "costPerKg": 0.02,
        "function": "Solvent Base"
      },
      {
        "id": "2",
        "name": "SLES 70% (Sodium Lauryl Ether Sulfate)",
        "category": "Anionic Surfactant",
        "percent": 10.0,
        "activePercent": 70,
        "costPerKg": 1.85,
        "function": "Foaming Detergent"
      },
      {
        "id": "3",
        "name": "LABSA 96% (Acid Slurry)",
        "category": "Anionic Surfactant",
        "percent": 3.0,
        "activePercent": 96,
        "costPerKg": 2.1,
        "function": "Road Film Cleaning Acid"
      },
      {
        "id": "4",
        "name": "Sodium Hydroxide 50% Liquid (Caustic Soda Lye)",
        "category": "Neutralizer / Base",
        "percent": 0.70,
        "activePercent": 50,
        "costPerKg": 0.65,
        "function": "Stoichiometric LABSA Neutralizer"
      },
      {
        "id": "5",
        "name": "Sodium Citrate Dihydrate",
        "category": "Builder / Chelator",
        "percent": 0.6,
        "activePercent": 100,
        "costPerKg": 1.4,
        "function": "Neutral Buffer (pH 7.2)"
      },
      {
        "id": "6",
        "name": "Sodium Chloride (Vacuum Salt)",
        "category": "Additive & Performance",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 0.15,
        "function": "Viscosity Salt Builder"
      },
      {
        "id": "7",
        "name": "Kathon CG (CMIT/MIT 1.5%)",
        "category": "Preservative & Biocide",
        "percent": 0.1,
        "activePercent": 1.5,
        "costPerKg": 12,
        "function": "Preservative"
      },
      {
        "id": "8",
        "name": "Commercial Perfume & Essential Fragrance Compound",
        "category": "Additive & Performance",
        "percent": 2.5,
        "activePercent": 100,
        "costPerKg": 15,
        "function": "Fresh Wash Scent"
      }
    ]
  }
];
