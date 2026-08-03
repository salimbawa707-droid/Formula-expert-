import { Chemical } from "../types";

export const BUILDERS_CHELATORS: Chemical[] = [
  {
    id: "soda-ash",
    commonName: "Sodium Carbonate (Soda Ash)",
    chemicalName: "Sodium Carbonate",
    iupacName: "sodium carbonate",
    casNumber: "497-19-8",
    molecularFormula: "Na2CO3",
    molecularWeight: "105.99 g/mol",
    inciName: "Sodium Carbonate",
    tradeNames: ["Soda Ash Light", "Soda Ash Dense", "Solvay Soda"],
    synonyms: ["Washing Soda", "Soda Crystals", "Disodium Carbonate"],
    category: "Builders",
    suppliers: ["Tata Chemicals Ltd.", "Solvay", "Nirma", "Ciner Resources"],
    marketNames: {
      indian: "Khar (Soda Ash)",
      international: "Soda Ash Light / Dense",
      hindi: "सोडा ऐश (धावन सोडा)"
    },
    physicalProperties: {
      appearance: "Fine powder (Light) or granular (Dense) solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "11.2 - 11.6 (1% aqueous solution)",
      density: "0.53 g/cm³ (Light), 0.95 g/cm³ (Dense)",
      viscosity: "Solid",
      solubility: "Soluble in water (~215 g/L at 20°C). Insoluble in alcohol.",
      boilingPoint: "1600°C",
      meltingPoint: "851°C",
      shelfLife: "36 Months (must keep dry)",
      storageConditions: "Store in tight bags in a cool, dry place. Avoid moisture as it reacts to form hard lumps (cakes)."
    },
    functionalInfo: {
      whatIsIt: "Inorganic alkaline sodium salt. Sourced from Trona mineral ore or synthesized via the Solvay ammonia-soda process.",
      whyUsed: "Acts as a powerful builder and alkaline buffer in laundry powders. Neutralizes acid soils, increases washing water pH (enabling saponification of fats), and precipitates water hardness ions (Calcium/Magnesium) as insoluble carbonates.",
      advantages: [
        "Highly effective and extremely cheap alkalinity source",
        "Aids in dry powder formulation flowability (carrier for liquids)",
        "Precipitates calcium hardness efficiently",
        "Stable mineral builder, non-combustible"
      ],
      limitations: [
        "Extremely high pH can irritate skin if handled directly or in hand-wash",
        "Precipitated calcium carbonate can deposit on fabrics over time (requires co-builders like sodium polyacrylates to suspend particles)",
        "Not suitable for liquid detergents due to solubility limits and precipitation risks"
      ],
      alternatives: ["Sodium Bicarbonate", "Sodium Silicate", "Zeolite A", "STPP"],
      ecoFriendliness: "Natural mineral origin. Mineralizes into bicarbonate. No bioaccumulation. No aquatic toxicity."
    },
    dosage: {
      minimum: "5.0%",
      recommended: "15.0%",
      premium: "30.0%",
      maximum: "60.0%",
      household: "15% - 40% in dry laundry powders",
      industrial: "20% - 50% in heavy-duty powder degreasers"
    },
    performance: {
      cleaning: 8,
      foam: 1, // does not foam
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 2, // harsh
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Inorganic mineral, does not undergo biodegradation but neutralizes naturally in soil/water into bicarbonate",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Daphnia) ~ 250 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Dust Respirator", "Safety Glasses", "Rubber Gloves"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Wash eyes with warm water. Shake out dust from nostrils and rinse mouth with water.",
      msdsSummary: "Mild irritant. Dust can irritate nose, throat, and eyes. Sacks should be kept sealed in dry storage."
    }
  },
  {
    id: "sodium-gluconate",
    commonName: "Sodium Gluconate",
    chemicalName: "Sodium D-gluconate",
    iupacName: "sodium;(2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanoate",
    casNumber: "527-07-1",
    molecularFormula: "C6H11NaO7",
    molecularWeight: "218.14 g/mol",
    inciName: "Sodium Gluconate",
    tradeNames: ["Sodium Gluconate Technical Grade", "Gluconal GP"],
    synonyms: ["Gluconic Acid Sodium Salt"],
    category: "Chelating Agents",
    suppliers: ["Roquette Frères", "Jungbunzlauer", "ADM", "Shandong Kunda"],
    marketNames: {
      indian: "Sodium Gluconate Powder",
      international: "Sodium Gluconate FCC/Tech",
      hindi: "सोडियम ग्लूकोनेट"
    },
    physicalProperties: {
      appearance: "Crystalline powder or granules",
      color: "White to Off-white",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "6.5 - 7.5 (10% aqueous solution)",
      density: "1.76 g/cm³",
      viscosity: "Solid (not applicable)",
      solubility: "Highly soluble in water (~600 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "206°C",
      shelfLife: "36 Months",
      storageConditions: "Store in a dry, cool area. Keep packaging sealed to avoid moisture absorption (hygroscopic)."
    },
    functionalInfo: {
      whatIsIt: "Sodium salt of gluconic acid, produced by fermentation of glucose.",
      whyUsed: "Outstanding bio-based chelating agent (sequestering agent) that binds hard water ions (Calcium, Magnesium, Iron) in highly alkaline solutions. It is widely preferred as an eco-friendly replacement for EDTA, NTA, and phosphates (STPP) in laundry and dishwashing detergents.",
      advantages: [
        "100% bio-based and fully biodegradable",
        "Synergistic performance with polyacrylates for anti-scaling",
        "Highly stable in high-alkalinity formulations (such as bottle washing, industrial degreasers)",
        "Corrosion inhibition properties for steel and copper"
      ],
      limitations: [
        "Weaker chelating power than EDTA at neutral or acidic pH",
        "Can act as a nutrient for bacteria if preservatives are insufficient",
        "Higher formulation cost than mineral phosphates"
      ],
      alternatives: ["Tetrasodium EDTA", "GLDA (tetrasodium glutamate diacetate)", "Sodium Citrate", "IDS"],
      ecoFriendliness: "Perfect eco profile. Ready biodegradability (>98% in 48h). Non-toxic to aquatic life. Carbon-neutral raw material."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "0.5%",
      premium: "2.0%",
      maximum: "5.0%",
      household: "0.5% - 1.5% in premium eco-laundry liquids",
      industrial: "1.0% - 4.0% in CIP (Clean-In-Place) alkaline cleaners"
    },
    performance: {
      cleaning: 6,
      foam: 1, // does not foam
      oilRemoval: 4,
      greaseCutting: 5,
      skinMildness: 10, // extremely mild / non-irritating
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>99% in 5 days)",
      plantBasedPct: 100, // made from corn starch/glucose
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L (virtually non-toxic)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Dust Mask (if handling bulk powder)", "Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None (Non-hazardous substance)"],
      precautionaryStatements: [
        "P262: Do not get in eyes, on skin, or on clothing."
      ],
      firstAid: "Rinse eyes with water as a precaution. Wash skin with water.",
      msdsSummary: "Non-toxic, food-grade chemical. Highly safe for skin contact, handling, and environmental discharge."
    }
  },
  {
    id: "sodium-bicarbonate",
    commonName: "Sodium Bicarbonate",
    chemicalName: "Sodium Hydrogen Carbonate",
    iupacName: "sodium hydrogen carbonate",
    casNumber: "144-55-8",
    molecularFormula: "NaHCO3",
    molecularWeight: "84.01 g/mol",
    inciName: "Sodium Bicarbonate",
    tradeNames: ["Baking Soda", "Bicarb of Soda", "Solvay Bicarbonate"],
    synonyms: ["Acid Sodium Carbonate", "Sodium Acid Carbonate"],
    category: "Builders",
    suppliers: ["Solvay", "Tata Chemicals", "Nirma", "Church & Dwight"],
    marketNames: {
      indian: "Meetha Soda (Baking Soda)",
      international: "Sodium Bicarbonate Tech/Food",
      hindi: "मीठा सोडा (बेकिंग सोडा)"
    },
    physicalProperties: {
      appearance: "Fine crystalline white powder",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "8.2 - 8.5 (1% aqueous solution)",
      density: "2.20 g/cm³",
      viscosity: "Solid",
      solubility: "Soluble in water (~96 g/L at 20°C). Insoluble in ethanol.",
      boilingPoint: "N/A",
      meltingPoint: "50°C (decomposes into sodium carbonate)",
      shelfLife: "36 Months",
      storageConditions: "Store in cool, dry conditions. Highly sensitive to moisture absorption."
    },
    functionalInfo: {
      whatIsIt: "Mildly alkaline, ecological sodium hydrogen carbonate salt sourced from natural minerals or the Solvay process.",
      whyUsed: "Used as a mild pH buffer, builder, deodorizer, and effervescing agent in laundry powders, carpet deodorizers, bath bombs, and safe eco-cleaners.",
      advantages: [
        "Extremely mild on skin and eyes (hypoallergenic)",
        "Outstanding natural deodorizer (absorbs acidic odors)",
        "Provides gentle mechanical scrubbing action in creams",
        "100% natural, green, and food-grade safety profile"
      ],
      limitations: [
        "Very weak alkaline builder compared to Soda Ash",
        "Does not provide sufficient grease-cutting saponification when used alone"
      ],
      alternatives: ["Sodium Sesquicarbonate", "Sodium Carbonate", "Borax"],
      ecoFriendliness: "Incredible. Natural mineral, totally non-toxic, eco-preferred buffer."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "20.0%",
      maximum: "50.0%",
      household: "5% - 15% in baby clothes washing powders and fabric buffers",
      industrial: "10% - 35% in mild commercial dry carpet cleaners"
    },
    performance: {
      cleaning: 5,
      foam: 1,
      oilRemoval: 4,
      greaseCutting: 4,
      skinMildness: 10,
      hardWater: 6
    },
    sustainability: {
      biodegradability: "Mineral compound, decomposes into safe water, carbon dioxide, and sodium ions",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 7000 mg/L (non-toxic)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with clean water as a precaution.",
      msdsSummary: "Highly safe household kitchen mineral. Completely non-toxic."
    }
  },
  {
    id: "sodium-metasilicate",
    commonName: "Sodium Metasilicate",
    chemicalName: "Disodium Metasilicate Pentahydrate",
    iupacName: "disodium metasilicate pentahydrate",
    casNumber: "10213-79-3",
    molecularFormula: "Na2SiO3·5H2O",
    molecularWeight: "212.14 g/mol",
    inciName: "Sodium Metasilicate",
    tradeNames: ["Metasilicate Pentahydrate", "Drymet", "Crystamet"],
    synonyms: ["Disodium Metasilicate", "Soluble Glass Powder"],
    category: "Builders",
    suppliers: ["PQ Corporation", "Solvay", "Kiran Global Chem", "CGC Inc."],
    marketNames: {
      indian: "Metasilicate Powder (Pentahydrate)",
      international: "Sodium Metasilicate Pentahydrate",
      hindi: "सोडियम मेटासिलिकेट"
    },
    physicalProperties: {
      appearance: "Free-flowing white granules or crystals",
      color: "White",
      odor: "Odorless",
      activeMatter: "57% SiO2/Na2O active builder content",
      pH: "12.4 - 12.8 (1% aqueous solution)",
      density: "1.75 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~350 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "72°C (pentahydrate melts in its own crystallization water)",
      shelfLife: "24 Months",
      storageConditions: "Highly hygroscopic and strongly alkaline. Store in multi-ply moisture-proof bags."
    },
    functionalInfo: {
      whatIsIt: "Highly alkaline inorganic sodium silicate builder.",
      whyUsed: "Used as a powerful heavy-duty builder, corrosion inhibitor, and grease saponifier in industrial washing powders, automatic dishwash tablets, and metal degreasers.",
      advantages: [
        "Exceptional alkalinity source for intense grease breakdown",
        "Incredible corrosion inhibition on glass and metal surfaces (prevents steel etching)",
        "Outstanding soil suspension and anti-redeposition synergy",
        "Aids in dry powder structural rigidity"
      ],
      limitations: [
        "Highly corrosive and caustic, causing severe skin irritation if mismanaged",
        "Precipitates under acidic pH, forming insoluble silica gel"
      ],
      alternatives: ["Sodium Carbonate", "STPP", "Sodium Orthosilicate"],
      ecoFriendliness: "Purely mineral. Dissolves into natural soluble silica and sodium ions. Safe for environments."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "15.0%",
      maximum: "35.0%",
      household: "3% - 10% in commercial automatic dishwasher powders",
      industrial: "10% - 30% in high-pH vehicle and engine degreasers"
    },
    performance: {
      cleaning: 10,
      foam: 1,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 1,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Inorganic mineral, converts to natural amorphous silica",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 210 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Goggles", "Neoprene Gloves", "N95 Dust Mask", "Lab Apron"],
      ghsClassification: ["Skin Corrosion (Category 1B)", "Serious Eye Damage (Category 1)", "Specific Target Organ Toxicity (Category 3)"],
      hazardStatements: ["H314: Causes severe skin burns and eye damage", "H335: May cause respiratory irritation"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear protective gloves/clothing/eye protection."
      ],
      firstAid: "Extremely urgent. Flush eyes or skin immediately with flowing water for 15 minutes. Seek emergency medical aid.",
      msdsSummary: "Highly caustic alkaline salt. Sacks must be kept tightly dry; dissolves rapidly with heat release."
    }
  },
  {
    id: "stpp",
    commonName: "STPP (Sodium Tripolyphosphate)",
    chemicalName: "Pentasodium Triphosphate",
    iupacName: "pentasodium triphosphate",
    casNumber: "7758-29-4",
    molecularFormula: "Na5P3O10",
    molecularWeight: "367.86 g/mol",
    inciName: "Pentasodium Triphosphate",
    tradeNames: ["STPP Powder", "Thermphos", "Albright STPP"],
    synonyms: ["Pentasodium Tripolyphosphate", "Sodium Triphosphate"],
    category: "Builders",
    suppliers: ["Aditya Birla Chemicals", "Solvay", "ICL Phosphate", "Prayon"],
    marketNames: {
      indian: "STPP (Phosphate Builder)",
      international: "STPP Tech Grade",
      hindi: "एसटीपीपी (फास्फेट पाउडर)"
    },
    physicalProperties: {
      appearance: "White free-flowing powder or granules",
      color: "White",
      odor: "Odorless",
      activeMatter: "94% Min (purity)",
      pH: "9.5 - 10.2 (1% aqueous solution)",
      density: "0.85 g/cm³",
      viscosity: "Solid",
      solubility: "Soluble in water (~150 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "622°C",
      shelfLife: "36 Months",
      storageConditions: "Store in tightly closed dry bags. Keep protected from moisture to prevent hydration clumping."
    },
    functionalInfo: {
      whatIsIt: "High-performance polyphosphate mineral builder.",
      whyUsed: "Historically the absolute king of detergent builders. Sequesters both calcium and magnesium hardness, peptizes soils, acts as an anti-redeposition agent, and stabilizes formulation pH. **Banned in domestic detergents in many nations due to eutrophication of waterways.**",
      advantages: [
        "Unparalleled dual calcium/magnesium sequestering power",
        "Disperses and suspends dirt particles perfectly",
        "Exceptional synergism with anionic surfactants",
        "Improves washing efficiency dramatically at very low cost"
      ],
      limitations: [
        "Causes environmental eutrophication (excessive algae blooms) in fresh water",
        "Banned or strictly capped in household laundry detergents globally"
      ],
      alternatives: ["Zeolite 4A", "Sodium Citrate", "GLDA", "Sodium Gluconate"],
      ecoFriendliness: "Poor. Primary trigger for freshwater eutrophication. Heavily restricted."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "10.0%",
      premium: "25.0%",
      maximum: "40.0%",
      household: "Capped or banned; used at 5% - 15% where legally permitted",
      industrial: "10% - 30% in commercial car wash and institutional powders"
    },
    performance: {
      cleaning: 10,
      foam: 1,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 6,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Does not biodegrade; hydrolyzes slowly in water into natural orthophosphate nutrients",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "D"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Relatively non-hazardous mineral dust. Environmental discharge must be strictly managed."
    }
  },
  {
    id: "tsp",
    commonName: "TSP (Trisodium Phosphate)",
    chemicalName: "Trisodium Orthophosphate",
    iupacName: "trisodium phosphate",
    casNumber: "7601-54-9",
    molecularFormula: "Na3PO4",
    molecularWeight: "163.94 g/mol",
    inciName: "Trisodium Phosphate",
    tradeNames: ["TSP Crystals", "Anhydrous TSP", "Albright TSP"],
    synonyms: ["Sodium Phosphate Tribasic", "Orthophosphate Tribasic"],
    category: "Builders",
    suppliers: ["Aditya Birla Chemicals", "Prayon", "ICL Phosphate", "Dow Chemical"],
    marketNames: {
      indian: "TSP Powder (Trisodium)",
      international: "Trisodium Phosphate Anhydrous / Crystalline",
      hindi: "टीएसपी (ट्राईसोडियम फास्फेट)"
    },
    physicalProperties: {
      appearance: "White crystalline powder or granular solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "98% Min",
      pH: "11.8 - 12.4 (1% aqueous solution)",
      density: "1.62 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~120 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "73°C (crystalline decomposes)",
      shelfLife: "36 Months",
      storageConditions: "Keep bags sealed tightly in dry warehouses. Highly alkaline."
    },
    functionalInfo: {
      whatIsIt: "Highly alkaline orthophosphate builder.",
      whyUsed: "Used as a powerful alkaline cleaner, builder, and wall wash preparation agent in industrial paint prep, heavy degreasers, and soot-removing detergents.",
      advantages: [
        "Intense grease and organic oil cutting action",
        "Softens water efficiently by precipitating hardness",
        "Saponifies oily deposits instantly",
        "Excellent mechanical concrete cleaner"
      ],
      limitations: [
        "Causes high environmental eutrophication (restricted like STPP)",
        "Extremely high pH can corrode skin and metals like aluminum easily"
      ],
      alternatives: ["Sodium Metasilicate", "Sodium Carbonate", "STPP"],
      ecoFriendliness: "Poor. High phosphate release causes environmental damage."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "15.0%",
      maximum: "30.0%",
      household: "Used primarily in heavy outdoor driveway and deck scrubbers",
      industrial: "5% - 25% in professional alkaline degreasers"
    },
    performance: {
      cleaning: 9,
      foam: 1,
      oilRemoval: 9,
      greaseCutting: 10,
      skinMildness: 2,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Does not biodegrade; converts to natural phosphate minerals",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 220 mg/L",
      greenRating: "D"
    },
    safety: {
      ppe: ["Safety Glasses", "Heavy Duty Nitrile Gloves", "Dust Mask"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)", "Specific Target Organ Toxicity (Category 3)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage", "H335: May cause respiratory irritation"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Flush eyes or skin immediately with running water for 15 minutes. Seek medical aid.",
      msdsSummary: "Strongly alkaline salt. Corrosive to skin under moisture."
    }
  },
  {
    id: "zeolite-4a",
    commonName: "Zeolite 4A",
    chemicalName: "Sodium Aluminosilicate (4A Type)",
    iupacName: "sodium aluminosilicate 4A",
    casNumber: "1318-02-1",
    molecularFormula: "Na12[(AlO2)12(SiO2)12]·27H2O",
    molecularWeight: "2191.0 g/mol (macro unit)",
    inciName: "Zeolite",
    tradeNames: ["Zeolite 4A", "Valfor 100", "Doucil"],
    synonyms: ["Hydrated Sodium Aluminosilicate Type A", "Detergent Zeolite"],
    category: "Builders",
    suppliers: ["PQ Corporation", "Albemarle", "Tata Chemicals", "Zeochem"],
    marketNames: {
      indian: "Zeolite Builder Powder",
      international: "Zeolite 4A Detergent Grade",
      hindi: "जिओलाइट ४ए (बिल्डर पाउडर)"
    },
    physicalProperties: {
      appearance: "Extremely fine, insoluble white powder",
      color: "White",
      odor: "Odorless",
      activeMatter: "98% Min (Purity)",
      pH: "10.0 - 10.8 (1% dispersion in water)",
      density: "0.45 g/cm³",
      viscosity: "Solid",
      solubility: "Completely insoluble in water and organic solvents; forms fine dispersion",
      boilingPoint: "N/A",
      meltingPoint: "> 1000°C",
      shelfLife: "36 Months",
      storageConditions: "Store in a dry, ventilated area. Avoid inhaling dust. Keep sacks sealed."
    },
    functionalInfo: {
      whatIsIt: "Hydrated synthetic crystalline sodium aluminosilicate with a porous 3D cage structure.",
      whyUsed: "The primary eco-friendly, phosphate-free solid builder used in laundry washing powders. Its porous molecular cages trap calcium hardness ions via a highly efficient ion-exchange mechanism.",
      advantages: [
        "100% green, non-eutrophic phosphate-free builder",
        "Highly efficient calcium ion exchange",
        "Prevents the deposition of minerals on clothes in combination with polyacrylates",
        "Acts as an excellent carrier and absorbent for liquid surfactants"
      ],
      limitations: [
        "Completely insoluble in water, leaving trace gray dust deposits on dark fabrics if formula has poor dispersion polymers",
        "Extremely slow magnesium ion exchange (requires citric acid co-builders)",
        "Unsuitable for liquid detergents"
      ],
      alternatives: ["STPP", "Sodium Carbonate", "Sodium Citrate", "Layered Silicates"],
      ecoFriendliness: "Perfect eco profile. Natural aluminosilicate mineral, zero aquatic toxicity, fully green."
    },
    dosage: {
      minimum: "5.0%",
      recommended: "15.0%",
      premium: "30.0%",
      maximum: "50.0%",
      household: "15% - 35% in green phosphate-free washing powders",
      industrial: "Not typically used in high-clarity industrial washes"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 5,
      greaseCutting: 5,
      skinMildness: 9,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Natural mineral, does not biodegrade but integrates harmlessly into natural clay sediment",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L (totally safe)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Dust Mask (N95)", "Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P261: Avoid breathing dust."],
      firstAid: "Blow nose if inhaled. Wash eyes with clean water.",
      msdsSummary: "Insoluble safe mineral dust. Control dry inhalation."
    }
  },
  {
    id: "sodium-citrate",
    commonName: "Sodium Citrate (Trisodium Citrate)",
    chemicalName: "Trisodium 2-hydroxypropane-1,2,3-tricarboxylate",
    iupacName: "trisodium 2-hydroxypropane-1,2,3-tricarboxylate",
    casNumber: "6132-04-3",
    molecularFormula: "C6H5Na3O7·2H2O",
    molecularWeight: "294.10 g/mol",
    inciName: "Sodium Citrate",
    tradeNames: ["Trisodium Citrate Dihydrate", "Citrosodine", "Jungbunzlauer Citrate"],
    synonyms: ["Citric Acid Trisodium Salt", "Trisodium Citrate"],
    category: "Builders",
    suppliers: ["Jungbunzlauer", "Cargill", "ADM", "Weifang Ensign"],
    marketNames: {
      indian: "Citrate Powder (Trisodium)",
      international: "Trisodium Citrate Dihydrate FCC",
      hindi: "सोडियम साइट्रेट"
    },
    physicalProperties: {
      appearance: "White crystalline powder or granular crystals",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "7.5 - 9.0 (10% aqueous solution)",
      density: "1.76 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~720 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "150°C (loses crystallization water)",
      shelfLife: "36 Months",
      storageConditions: "Store in a cool, dry place. Keep protected from moisture."
    },
    functionalInfo: {
      whatIsIt: "Fully renewable bio-based organic sodium builder and chelating agent produced by neutralizing plant-fermented citric acid with sodium hydroxide.",
      whyUsed: "Used as the primary eco-friendly builder and sequestering agent in premium green liquid laundry detergents, automatic dishwashing gels, and baby washes.",
      advantages: [
        "100% bio-based and exceptionally rapidly biodegradable",
        "Highly water-soluble, forming crystal-clear liquid formulas",
        "Outstanding calcium/magnesium binding under warm laundry conditions",
        "Highly skin-friendly, food-grade safety profile"
      ],
      limitations: [
        "Slightly lower building efficiency compared to STPP or EDTA on a weight basis",
        "Can act as a bacterial food source if formula lacks adequate preservation"
      ],
      alternatives: ["Sodium Gluconate", "GLDA", "Zeolite 4A"],
      ecoFriendliness: "Exemplary. Zero ecotoxicity, rapid biodegradation, carbon-neutral origin."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "12.0%",
      maximum: "20.0%",
      household: "3% - 10% in premium liquid laundry and dish gels",
      industrial: "4% - 15% in eco-friendly commercial detergents"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 5,
      greaseCutting: 6,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 48 hours)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 18,000 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Highly safe, biodegradable food-grade mineral builder."
    }
  },
  {
    id: "sodium-sulfate",
    commonName: "Sodium Sulfate",
    chemicalName: "Sodium Sulfate Anhydrous",
    iupacName: "sodium sulfate",
    casNumber: "7757-82-6",
    molecularFormula: "Na2SO4",
    molecularWeight: "142.04 g/mol",
    inciName: "Sodium Sulfate",
    tradeNames: ["Sodium Sulfate Anhydrous", "Glauber's Salt Anhydrous", "Solvay Sulfate"],
    synonyms: ["Disodium Sulfate", "Thenardite"],
    category: "Builders",
    suppliers: ["Tata Chemicals", "Nirma", "Solvay", "Sichuan Nafine"],
    marketNames: {
      indian: "Khara (Sodium Sulfate Filler)",
      international: "Sodium Sulfate Anhydrous 99%",
      hindi: "सोडियम सल्फेट (खारा पाउडर)"
    },
    physicalProperties: {
      appearance: "Fine white powder or crystalline solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "6.0 - 8.0 (10% aqueous solution)",
      density: "2.68 g/cm³",
      viscosity: "Solid",
      solubility: "Soluble in water (~200 g/L at 20°C)",
      boilingPoint: "1429°C",
      meltingPoint: "884°C",
      shelfLife: "36 Months",
      storageConditions: "Store in dry warehouses. Highly stable. Protect from moisture."
    },
    functionalInfo: {
      whatIsIt: "Neutral, inorganic sodium salt mineral.",
      whyUsed: "Used primarily as a standardized filler, flow aid, and carrier in powdered laundry detergents. It standardizes active matter levels and keeps powder granules free-flowing and dry.",
      advantages: [
        "Incredibly cheap, non-reactive raw material",
        "Improves dry powder flow properties, preventing sticky clumping",
        "Increases formulation bulk density",
        "Neutral pH"
      ],
      limitations: [
        "No direct cleaning, degreasing, or softening action",
        "High amounts increase laundry powder volume without increasing efficacy (consumer filler)"
      ],
      alternatives: ["Sodium Chloride", "Dolomite Powder", "Sodium Carbonate"],
      ecoFriendliness: "Natural mineral origin. Standard sulfate nutrient in water systems."
    },
    dosage: {
      minimum: "5.0%",
      recommended: "20.0%",
      premium: "10.0% (premium uses less filler, more active builders)",
      maximum: "60.0%",
      household: "15% - 45% in economy and standard laundry powders",
      industrial: "10% - 30% in powdered commercial car washes"
    },
    performance: {
      cleaning: 1,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 8,
      hardWater: 2
    },
    sustainability: {
      biodegradability: "Inorganic mineral, neutralizes naturally in environmental soil/sediments",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 13,000 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as a precaution.",
      msdsSummary: "Highly safe, inert powder filler. Maintain dust control."
    }
  },
  {
    id: "sodium-chloride",
    commonName: "Sodium Chloride (Salt)",
    chemicalName: "Sodium Chloride",
    iupacName: "sodium chloride",
    casNumber: "7647-14-5",
    molecularFormula: "NaCl",
    molecularWeight: "58.44 g/mol",
    inciName: "Sodium Chloride",
    tradeNames: ["Common Salt", "Vacuum Salt", "Detergent Salt", "Tata Salt"],
    synonyms: ["Halite", "Rock Salt", "Table Salt"],
    category: "Builders",
    suppliers: ["Tata Chemicals", "Nirma", "Cargill", "K+S Group"],
    marketNames: {
      indian: "Namak (Common Salt)",
      international: "Sodium Chloride Industrial / Pure Grade",
      hindi: "नमक (साधारण नमक)"
    },
    physicalProperties: {
      appearance: "Crystalline white granules or powder",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "6.5 - 7.5 (10% aqueous solution)",
      density: "2.16 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~360 g/L at 20°C)",
      boilingPoint: "1413°C",
      meltingPoint: "801°C",
      shelfLife: "Indefinite (stable if dry)",
      storageConditions: "Store in dry place. Highly hygroscopic in high humidity."
    },
    functionalInfo: {
      whatIsIt: "Highly pure mineral sodium salt.",
      whyUsed: "Used primarily as an extremely cost-efficient viscosity modifier (thickening electrolyte) in liquid ether-sulfate systems (SLES thickening curve). Also used as an economy filler in powdered laundry detergents.",
      advantages: [
        "Incredibly cheap and accessible viscosity builder",
        "Thickens SLES/CAPB liquids rapidly via ionic micelle transition",
        "Neutral pH, non-flammable"
      ],
      limitations: [
        "Over-addition (>2.5%) crashes viscosity ('over-salting' effect)",
        "Increases formulation corrosive properties on metal parts",
        "Lacks active soil cleaning power"
      ],
      alternatives: ["Ammonium Chloride", "Sodium Sulfate", "Crothix Liquid"],
      ecoFriendliness: "Natural mineral. Increases salinity of fresh water if discharged in massive industrial quantities."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "1.2% (viscosity peak)",
      premium: "1.5%",
      maximum: "3.0% (overdose risks product separation)",
      household: "0.5% - 2.0% in liquid handwash and dishwash soaps",
      industrial: "5% - 15% as economy filler in cheap laundry powders"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 7,
      hardWater: 2
    },
    sustainability: {
      biodegradability: "Inorganic mineral, does not biodegrade",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 7600 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Extremely safe kitchen compound. Non-irritating under normal conditions."
    }
  },
  {
    id: "potassium-carbonate",
    commonName: "Potassium Carbonate",
    chemicalName: "Potassium Carbonate Anhydrous",
    iupacName: "potassium carbonate",
    casNumber: "584-08-7",
    molecularFormula: "K2CO3",
    molecularWeight: "138.21 g/mol",
    inciName: "Potassium Carbonate",
    tradeNames: ["Potash Anhydrous", "Pearl Ash", "Karbopotas"],
    synonyms: ["Salt of Tartar", "Dipotassium Carbonate"],
    category: "Builders",
    suppliers: ["Armand Products", "UNID Co.", "Evonik Industries", "Gujarat Alkalies"],
    marketNames: {
      indian: "Potash Carbonate Powder",
      international: "Potassium Carbonate Tech Grade",
      hindi: "पोटेशियम कार्बोनेट"
    },
    physicalProperties: {
      appearance: "Granular white solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "11.5 - 12.0 (1% aqueous solution)",
      density: "2.43 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~1120 g/L at 20°C). Insoluble in alcohol.",
      boilingPoint: "N/A",
      meltingPoint: "891°C",
      shelfLife: "36 Months",
      storageConditions: "Extremely deliquescent (absorbs massive humidity to liquefy). Store in tightly sealed moisture-proof containers."
    },
    functionalInfo: {
      whatIsIt: "Highly alkaline inorganic potassium salt.",
      whyUsed: "Used as a high-solubility alkaline builder and pH buffer in liquid detergents and liquid laundry soaps. Provides significantly higher water solubility limits compared to Sodium Carbonate, preventing cold precipitation.",
      advantages: [
        "Incredible water solubility, perfect for heavy concentrated liquid detergents",
        "Superb alkaline buffering, saponifies oily grease rapidly",
        "Precipitates calcium minerals efficiently",
        "Sourced from mineral deposits"
      ],
      limitations: [
        "Highly hygroscopic (will liquefy in air if dry powder pack is left open)",
        "More expensive than Sodium Carbonate (Soda Ash)"
      ],
      alternatives: ["Sodium Carbonate", "Monoethanolamine (MEA)", "Potassium Hydroxide"],
      ecoFriendliness: "Natural mineral origin. Enriches potassium levels in soils. Safe."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "10.0%",
      maximum: "20.0%",
      household: "2% - 8% in heavy-duty concentrated laundry liquids",
      industrial: "5% - 15% in liquid commercial grease scrubbers"
    },
    performance: {
      cleaning: 8,
      foam: 1,
      oilRemoval: 8,
      greaseCutting: 9,
      skinMildness: 3,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Inorganic mineral, neutralizes in soil/water into potassium bicarbonate",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Daphnia) ~ 630 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Dust Mask"],
      ghsClassification: ["Skin Irritation (Category 2)", "Eye Irritation (Category 2A)", "Specific Target Organ Toxicity (Category 3)"],
      hazardStatements: ["H315: Causes skin irritation", "H319: Causes serious eye irritation", "H335: May cause respiratory irritation"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Rinse skin/eyes with large volumes of water for 15 minutes. Blow nose if dust inhaled.",
      msdsSummary: "Highly hygroscopic and alkaline. Avoid handling bulk powder without gloves."
    }
  },
  {
    id: "sodium-sesquicarbonate",
    commonName: "Sodium Sesquicarbonate",
    chemicalName: "Trisodium Hydrogen Dicarbonate",
    iupacName: "trisodium hydrogen dicarbonate dihydrate",
    casNumber: "533-96-0",
    molecularFormula: "Na3H(CO3)2·2H2O",
    molecularWeight: "226.03 g/mol",
    inciName: "Sodium Sesquicarbonate",
    tradeNames: ["Sesquicarbonate Tech", "Trona Sesqui", "Solvay Sesqui"],
    synonyms: ["Sodium Sesqui", "Natural Trona Mineral"],
    category: "Builders",
    suppliers: ["Solvay", "Tata Chemicals", "Genesis Alkali", "Ciner Resources"],
    marketNames: {
      indian: "Sesquicarbonate Powder",
      international: "Sodium Sesquicarbonate Dihydrate",
      hindi: "सोडियम सेसक्विकार्बोनेट"
    },
    physicalProperties: {
      appearance: "White crystalline needles or granules",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "9.8 - 10.2 (1% aqueous solution)",
      density: "2.11 g/cm³",
      viscosity: "Solid",
      solubility: "Soluble in water (~150 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "Decomposes above 70°C",
      shelfLife: "36 Months",
      storageConditions: "Store in cool, dry conditions. Far more resistant to caking than Soda Ash."
    },
    functionalInfo: {
      whatIsIt: "Mild, natural double-salt of sodium carbonate and sodium bicarbonate.",
      whyUsed: "Used as a gentle alkaline builder, pH stabilizer, and powder texturizer in baby laundry powders, bath salts, and mild domestic dishwashes.",
      advantages: [
        "Much milder than Soda Ash, yet has higher cleaning alkalinity than Baking Soda",
        "Highly free-flowing needles, does not cake easily under moderate moisture",
        "Fully natural mineral sourced from ecological Trona deposits",
        "Dissolves rapidly and completely without leaving residues"
      ],
      limitations: [
        "Slightly lower building strength compared to Soda Ash",
        "Higher cost per kg compared to standard Soda Ash/Salt blends"
      ],
      alternatives: ["Sodium Carbonate", "Sodium Bicarbonate", "Borax"],
      ecoFriendliness: "Exemplary. Natural mineral, safe, green builder."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "10.0%",
      premium: "20.0%",
      maximum: "40.0%",
      household: "5% - 20% in mild baby laundry powders and bath salts",
      industrial: "10% - 30% in gentle textile cleaning powders"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 8,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Inorganic mineral, neutralizes in soils harmlessly",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 300 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes with water for 10 minutes. Wash skin.",
      msdsSummary: "Highly safe double-salt buffer. Much gentler than pure Soda Ash."
    }
  },
  {
    id: "borax",
    commonName: "Borax (Sodium Tetraborate Decahydrate)",
    chemicalName: "Disodium Tetraborate Decahydrate",
    iupacName: "sodium tetraborate decahydrate",
    casNumber: "1303-96-4",
    molecularFormula: "Na2B4O7·10H2O",
    molecularWeight: "381.37 g/mol",
    inciName: "Sodium Borate",
    tradeNames: ["Borax Decahydrate", "Three Elephant Borax", "Rio Tinto Borate"],
    synonyms: ["Sodium Tetraborate", "Disodium Borate Decahydrate", "Suhaga"],
    category: "Builders",
    suppliers: ["U.S. Borax (Rio Tinto)", "Borax Argentina", "Eti Maden", "Searles Valley"],
    marketNames: {
      indian: "Suhaga (Borax Powder)",
      international: "Borax Decahydrate Tech",
      hindi: "सुहागा (बोरेक्स पाउडर)"
    },
    physicalProperties: {
      appearance: "Soft crystalline white powder or granular solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "9.2 - 9.5 (1% aqueous solution)",
      density: "1.73 g/cm³",
      viscosity: "Solid",
      solubility: "Moderately soluble in cold water (~50 g/L at 20°C); highly soluble in hot water",
      boilingPoint: "320°C (loses water)",
      meltingPoint: "75°C (decomposes in crystallization water)",
      shelfLife: "36 Months",
      storageConditions: "Store in a cool, dry place. Keep protected from moisture."
    },
    functionalInfo: {
      whatIsIt: "Natural, alkaline boron-based mineral compound.",
      whyUsed: "Used as a classic laundry booster, pH buffer, mild builder, stain remover, and enzyme stabilizer in household laundry powders and liquid laundry formulations.",
      advantages: [
        "Superb natural stain booster (effectively removes wine, grass, and tea stains)",
        "Excellent pH buffer at a very mild skin-safe range (pH ~9.2)",
        "Exceptional natural enzyme stabilizer in liquid laundry bases",
        "Inhibits mold, mildew, and bacteria growth"
      ],
      limitations: [
        "Under GHS classification, boron compounds have reproductive toxicity warnings (restricted in EU cosmetic and consumer limits)",
        "Sparse cold solubility requires formulation care"
      ],
      alternatives: ["Sodium Citrate", "Sodium Sesquicarbonate", "Sodium Gluconate"],
      ecoFriendliness: "Natural earth-mined mineral. Safe in micro-quantities; excess boron in soil can inhibit sensitive plant growth."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "10.0%",
      maximum: "15.0%",
      household: "3% - 8% in laundry washing powders and boosters",
      industrial: "5% - 12% in commercial spot removers"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 5,
      greaseCutting: 6,
      skinMildness: 7,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Inorganic mineral, does not biodegrade; converts to natural environmental borates",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 74 mg/L",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Reproductive Toxicity (Category 1B)"],
      hazardStatements: ["H319: Causes serious eye irritation", "H360FD: May damage fertility. May damage the unborn child."],
      precautionaryStatements: [
        "P201: Obtain special instructions before use.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Flush eyes immediately with warm water. Avoid dust inhalation.",
      msdsSummary: "Highly effective mineral but carries GHS reproductive warnings. Keep away from food and children."
    }
  },
  {
    id: "edta-acid",
    commonName: "EDTA (Acid form)",
    chemicalName: "Ethylenediaminetetraacetic Acid",
    iupacName: "2-[2-[bis(carboxymethyl)amino]ethyl-(carboxymethyl)amino]acetic acid",
    casNumber: "60-00-4",
    molecularFormula: "C10H16N2O8",
    molecularWeight: "292.24 g/mol",
    inciName: "EDTA",
    tradeNames: ["EDTA Acid", "Dissolvine H-Complex", "Versene Acid"],
    synonyms: ["EDTA Pure Acid", "Diaminoethane-tetraacetic Acid"],
    category: "Chelating Agents",
    suppliers: ["BASF SE", "Nouryon", "Dow Chemical", "Fushun Shunyuan"],
    marketNames: {
      indian: "EDTA Acid Powder",
      international: "EDTA Pure Acid Tech",
      hindi: "ईडीटीए एसिड"
    },
    physicalProperties: {
      appearance: "White crystalline powder",
      color: "White",
      odor: "Odorless",
      activeMatter: "99% Min",
      pH: "2.5 - 3.0 (saturated solution)",
      density: "0.86 g/cm³",
      viscosity: "Solid",
      solubility: "Very sparsely soluble in water (~0.5 g/L at 20°C); highly soluble in alkaline water once neutralized (NaOH addition)",
      boilingPoint: "N/A",
      meltingPoint: "240°C (decomposes)",
      shelfLife: "36 Months",
      storageConditions: "Store in cool, dry place. Acidic powder; avoid metal storage."
    },
    functionalInfo: {
      whatIsIt: "High-affinity organic polyamino carboxylic chelating acid.",
      whyUsed: "Used as an extremely powerful chelating agent (sequestering agent) that binds and locks hard-water metal ions (Calcium, Magnesium, Iron, Copper). It prevents water hardness from degrading surfactant foaming and cleaning performance.",
      advantages: [
        "Exceptional chelating strength across wide pH and temperatures",
        "Locks down catalytic heavy metals (Iron/Copper), preventing fragrance and preservative oxidation",
        "Significantly boosts surfactant cleaning efficiency",
        "Prevents scale build-up on machinery"
      ],
      limitations: [
        "Very poor biodegredation profile, stays in environmental waterways, mobilizing heavy metal sediments",
        "Acid form is insoluble in water without adding alkalis (caustic soda) to neutralize it"
      ],
      alternatives: ["GLDA", "MGDA", "Sodium Gluconate", "Citric Acid"],
      ecoFriendliness: "Poor. High environmental persistence. Mobilizes heavy metals."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.5%",
      premium: "1.5%",
      maximum: "3.0%",
      household: "0.2% - 0.8% in laundry liquids and surface sprays",
      industrial: "0.5% - 2.0% in institutional and boiler cleansers"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 4,
      skinMildness: 8,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Poor (<10% OECD 301B). Highly persistent.",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 150 mg/L",
      greenRating: "D"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Specific Target Organ Toxicity (Category 2)"],
      hazardStatements: ["H319: Causes serious eye irritation", "H373: May cause damage to organs through prolonged exposure."],
      precautionaryStatements: [
        "P260: Do not breathe dust.",
        "P280: Wear eye protection."
      ],
      firstAid: "Flush eyes with clean water for 15 minutes. Wash skin with water.",
      msdsSummary: "Highly efficient chelant but persistent in rivers. Best replaced with green GLDA."
    }
  },
  {
    id: "tetrasodium-edta",
    commonName: "Tetrasodium EDTA",
    chemicalName: "Tetrasodium Ethylenediaminetetraacetate",
    iupacName: "tetrasodium 2-[2-[bis(carboxylatomethyl)amino]ethyl-(carboxylatomethyl)amino]acetate",
    casNumber: "64-02-8",
    molecularFormula: "C10H12N2Na4O8",
    molecularWeight: "380.17 g/mol",
    inciName: "Tetrasodium EDTA",
    tradeNames: ["Versene 100", "Dissolvine Na", "Trilon B"],
    synonyms: ["EDTA Tetrasodium Salt", "EDTA Na4"],
    category: "Chelating Agents",
    suppliers: ["BASF SE", "Nouryon", "Dow Chemical", "Fushun Shunyuan"],
    marketNames: {
      indian: "EDTA Na4 (Tetrasodium Powder)",
      international: "Tetrasodium EDTA 99% / 40% Liquid",
      hindi: "टेट्रासोडियम ईडीटीए"
    },
    physicalProperties: {
      appearance: "White crystalline powder or clear liquid (40% solution)",
      color: "White opaque solid / color liquid",
      odor: "Odorless",
      activeMatter: "99% Min (Powder), 38% - 40% (Liquid)",
      pH: "11.0 - 11.8 (1% aqueous solution)",
      density: "0.86 g/cm³ (powder)",
      viscosity: "Solid / 20 cPs (Liquid)",
      solubility: "Completely soluble in water (~500 g/L at 20°C)",
      boilingPoint: "105°C (Liquid)",
      meltingPoint: "> 300°C",
      shelfLife: "36 Months",
      storageConditions: "Store in a cool dry area. Highly stable. Protect from high moisture."
    },
    functionalInfo: {
      whatIsIt: "Neutralized alkaline sodium salt of EDTA.",
      whyUsed: "Used as a powerful water soluble chelating agent in liquid hand soaps, shampoos, and high-pH laundry liquids. Locks hard water ions and heavy metals with high affinity.",
      advantages: [
        "Extremely soluble in water, blends instantly into liquid batches",
        "Phenomenal calcium and magnesium binding capacity",
        "Increases preservative and biocide stability",
        "Maintains stable clarity in liquid detergents"
      ],
      limitations: [
        "Non-biodegradable, mobilizing toxic heavy metals in river ecosystems",
        "Alkaline pH can affect formula acidity balance"
      ],
      alternatives: ["GLDA", "MGDA", "Sodium Citrate"],
      ecoFriendliness: "Poor. Environmental persistence makes it non-eco-friendly."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.4%",
      premium: "1.0%",
      maximum: "2.5%",
      household: "0.2% - 0.6% in liquid dishwashing and handwash",
      industrial: "0.5% - 2.0% in institutional sanitizers and cleaners"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 4,
      skinMildness: 8,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Very poor biological breakdown. Persistent pollutant.",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 121 mg/L",
      greenRating: "D"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (if powder)"],
      ghsClassification: ["Acute Toxicity (Category 4 - Oral)", "Serious Eye Damage (Category 1)", "Specific Target Organ Toxicity (Category 2)"],
      hazardStatements: ["H302: Harmful if swallowed", "H318: Causes serious eye damage", "H373: May cause damage to organs through prolonged exposure"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with warm water for 15 minutes. Call doctor.",
      msdsSummary: "Highly alkaline chelator. Standard eye protective gear is mandatory."
    }
  },
  {
    id: "glda",
    commonName: "GLDA",
    chemicalName: "Tetrasodium Glutamate Diacetate",
    iupacName: "tetrasodium 2-[bis(carboxylatomethyl)amino]pentanedioate",
    casNumber: "51981-21-6",
    molecularFormula: "C9H9NNa4O8",
    molecularWeight: "351.13 g/mol",
    inciName: "Tetrasodium Glutamate Diacetate",
    tradeNames: ["Dissolvine GL-47-S", "GLDA 47% Liquid", "Akzo GLDA"],
    synonyms: ["N,N-Bis(carboxymethyl)-L-glutamic Acid Tetrasodium Salt", "L-Glutamic acid diacetic acid tetrasodium salt"],
    category: "Chelating Agents",
    suppliers: ["Nouryon", "BASF SE", "Jungbunzlauer", "Hebei Smart"],
    marketNames: {
      indian: "GLDA Green Chelating Agent (Liquid)",
      international: "GLDA 47% Active Liquid",
      hindi: "जीएलडीए (ग्रीन चेलेटिंग एजेंट)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to Pale Straw",
      odor: "Faint, characteristic",
      activeMatter: "46% - 48% (rest is water)",
      pH: "11.0 - 12.0 (1% aqueous solution)",
      density: "1.30 g/cm³",
      viscosity: "20 - 50 cPs",
      solubility: "Completely soluble in water in all ratios",
      boilingPoint: "105°C",
      meltingPoint: "-5°C",
      shelfLife: "24 Months",
      storageConditions: "Highly stable. Store in original plastic packaging. Highly alkaline."
    },
    functionalInfo: {
      whatIsIt: "Ultra-premium, 100% biodegradable and bio-based green chelating agent synthesized from natural, fermented L-glutamic acid (corn starch/sugar beet derivatives).",
      whyUsed: "Used as the absolute premier ecological, phosphate-free, and EDTA-free chelator in green liquid laundry detergents, automatic dishwashing tabs, household sprays, and baby washes. Exceptional binding capacity for calcium and magnesium under alkaline laundry conditions.",
      advantages: [
        "Exceptional ecological profile (>60% bio-based carbon, readily biodegradable)",
        "Outstanding calcium, magnesium, and transition metal (Iron/Copper) binding",
        "Significantly boosts surfactant foaming and washing efficiency",
        "Excellent high temperature and high pH structural stability"
      ],
      limitations: [
        "Higher cost per kg compared to synthetic EDTA Na4",
        "Extremely high alkalinity in raw concentrate"
      ],
      alternatives: ["MGDA", "Tetrasodium EDTA", "Sodium Gluconate", "Sodium Citrate"],
      ecoFriendliness: "Exemplary. Fully biodegradable, non-accumulative, plant-sourced."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "0.8%",
      premium: "2.5%",
      maximum: "5.0%",
      household: "0.5% - 2.0% in premium green laundry and dishwash liquids",
      industrial: "1.0% - 4.0% in eco-friendly industrial cleaning bases"
    },
    performance: {
      cleaning: 8,
      foam: 1,
      oilRemoval: 4,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>80% OECD 301D in 28 days)",
      plantBasedPct: 86,
      petroleumBasedPct: 14,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L (highly safe)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Corrosive to Metals (Category 1)"],
      hazardStatements: ["H290: May be corrosive to metals"],
      precautionaryStatements: [
        "P234: Keep only in original container.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Rinse eyes thoroughly with water for several minutes. Wash skin.",
      msdsSummary: "Highly safe and gentle green chelator. Extremely low risk compared to EDTA."
    }
  },
  {
    id: "mgda",
    commonName: "MGDA",
    chemicalName: "Trisodium Methylglycinediacetate",
    iupacName: "trisodium 2-[bis(carboxylatomethyl)amino]propanoate",
    casNumber: "164462-16-2",
    molecularFormula: "C7H8NNa3O6",
    molecularWeight: "271.11 g/mol",
    inciName: "Trisodium Dicarboxymethyl Alaninate",
    tradeNames: ["Trilon M Liquid", "Dissolvine M-40", "MGDA 40%"],
    synonyms: ["Alanine Diacetic Acid Trisodium Salt", "Methylglycinediacetic acid trisodium salt"],
    category: "Chelating Agents",
    suppliers: ["BASF SE", "Nouryon", "Hebei Smart Chemicals", "Fushun Shunyuan"],
    marketNames: {
      indian: "MGDA Green Chelator Liquid",
      international: "MGDA 40% Active Liquid",
      hindi: "एमजीडीए (ग्रीन चेलेटिंग एजेंट)"
    },
    physicalProperties: {
      appearance: "Clear, straw colored liquid",
      color: "Light Yellow",
      odor: "Faint, characteristic",
      activeMatter: "38% - 41%",
      pH: "11.0 - 12.0 (1% aqueous solution)",
      density: "1.30 g/cm³",
      viscosity: "20 - 45 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "105°C",
      meltingPoint: "-5°C",
      shelfLife: "24 Months",
      storageConditions: "Store in tightly closed original HDPE containers. Deliquescent if powder."
    },
    functionalInfo: {
      whatIsIt: "High-affinity, rapidly biodegradable green chelating agent derived from natural L-alanine amino acid.",
      whyUsed: "Used as the ultimate eco-friendly calcium and scale-buster in high-performance automatic dishwashing tablets, eco-laundry detergents, and hard surface cleaners. Widely preferred in EU markets for phosphate replacement.",
      advantages: [
        "The fastest bio-degrading organic chelant on the market",
        "Exceptional calcium and lime-scale dissolution power (surpasses EDTA at high temperatures)",
        "Excellent stability under highly alkaline conditions and bleaching systems",
        "Very safe toxicology profile"
      ],
      limitations: [
        "Highly expensive raw material",
        "Raw liquid is highly alkaline (requires neutralization)"
      ],
      alternatives: ["GLDA", "Tetrasodium EDTA", "Sodium Citrate"],
      ecoFriendliness: "Exemplary. Extremely rapid biodegradation, completely non-toxic, eco-preferred."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "0.8%",
      premium: "2.0%",
      maximum: "5.0%",
      household: "0.5% - 2.5% in premium eco dishwasher tablet and gels",
      industrial: "1.0% - 4.0% in boiler scaling and CIP commercial systems"
    },
    performance: {
      cleaning: 8,
      foam: 1,
      oilRemoval: 4,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>90% OECD 301D in 14 days)",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Corrosive to Metals (Category 1)"],
      hazardStatements: ["H290: May be corrosive to metals"],
      precautionaryStatements: [
        "P234: Keep only in original container.",
        "P280: Wear eye protection."
      ],
      firstAid: "Rinse eyes immediately with water. Wash skin.",
      msdsSummary: "Highly safe organic amino chelant. Excellent ecological credentials."
    }
  },
  {
    id: "dtpa",
    commonName: "DTPA",
    chemicalName: "Pentasodium Pentetate",
    iupacName: "pentasodium [bis[2-[bis(carboxylatomethyl)amino]ethyl]amino]acetate",
    casNumber: "140-01-2",
    molecularFormula: "C14H18N3Na5O10",
    molecularWeight: "503.25 g/mol",
    inciName: "Pentasodium Pentetate",
    tradeNames: ["Versenex 80", "Dissolvine D-40", "Trilon C"],
    synonyms: ["Pentasodium Diethylenetriaminepentaacetate", "DTPA Na5"],
    category: "Chelating Agents",
    suppliers: ["Dow Chemical", "Nouryon", "BASF SE", "Fushun Shunyuan"],
    marketNames: {
      indian: "EDTA DTPA Metal Chelator",
      international: "DTPA Pentasodium 40% Liquid",
      hindi: "डीटीपीए (पेंटासोडियम)"
    },
    physicalProperties: {
      appearance: "Clear straw colored liquid",
      color: "Light Amber",
      odor: "Faint, amine-like",
      activeMatter: "39% - 41%",
      pH: "11.0 - 11.8 (1% aqueous solution)",
      density: "1.31 g/cm³",
      viscosity: "20 - 45 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "105°C",
      meltingPoint: "-5°C",
      shelfLife: "36 Months",
      storageConditions: "Highly stable. Store in original plastic packaging."
    },
    functionalInfo: {
      whatIsIt: "Extremely high-stability polyamino carboxylic sodium chelating agent.",
      whyUsed: "Used primarily to chelate transition metals like Iron, Copper, and Manganese in bleaching systems (hydrogen peroxide and percarbonates). It prevents trace transition metals from catalytically decomposing bleaching agents during storage and active washing.",
      advantages: [
        "Far stronger binding affinity for Iron/Manganese than EDTA or Citrates",
        "Protects chemical bleaching systems from rapid catalytic degradation",
        "Prevents heavy fabric browning and yellow staining",
        "Stable at high active temperatures"
      ],
      limitations: [
        "Extremely poor biodegradation profile (highly persistent like EDTA)",
        "Restricted in standard organic/eco formulations"
      ],
      alternatives: ["GLDA", "MGDA", "Sodium Citrate"],
      ecoFriendliness: "Poor. High aquatic persistence. Mobilizes heavy metals."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.3% (excellent for peroxide bleach stabilizing)",
      premium: "0.8%",
      maximum: "1.5%",
      household: "0.1% - 0.5% in bleaching laundry powders and stain sprays",
      industrial: "0.3% - 1.0% in commercial textile whitening and paper mills"
    },
    performance: {
      cleaning: 6,
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 4,
      skinMildness: 8,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Very poor biological degradation. Extremely stable and persistent.",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 245 mg/L",
      greenRating: "D"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Eye Irritation (Category 2A)", "Reproductive Toxicity (Category 2)"],
      hazardStatements: ["H332: Harmful if inhaled", "H319: Causes serious eye irritation", "H361d: Suspected of damaging the unborn child"],
      precautionaryStatements: [
        "P201: Obtain special instructions before use.",
        "P280: Wear protective gloves/clothing/eye protection."
      ],
      firstAid: "Flush eyes with water for 15 minutes. Wash skin immediately. Avoid mist inhalation.",
      msdsSummary: "Highly substantive chelant. Carry reproductive caution, handle with appropriate protection."
    }
  },
  {
    id: "citric-acid",
    commonName: "Citric Acid Anhydrous",
    chemicalName: "Citric Acid",
    iupacName: "2-hydroxypropane-1,2,3-tricarboxylic acid",
    casNumber: "77-92-9",
    molecularFormula: "C6H8O7",
    molecularWeight: "192.12 g/mol",
    inciName: "Citric Acid",
    tradeNames: ["Citric Acid Anhydrous", "Citric Acid Monohydrate", "Ensign Citric"],
    synonyms: ["Anhydrous Citric Acid", "Lemon Acid"],
    category: "Chelating Agents",
    suppliers: ["Jungbunzlauer", "Cargill", "ADM", "Weifang Ensign"],
    marketNames: {
      indian: "Nimbu Sat (Citric Acid)",
      international: "Citric Acid Anhydrous USP/FCC",
      hindi: "नींबू का सत (साइट्रिक एसिड)"
    },
    physicalProperties: {
      appearance: "Translucent white crystals or crystalline powder",
      color: "White",
      odor: "Odorless, highly sour taste",
      activeMatter: "99.5% Min",
      pH: "1.8 - 2.2 (1% aqueous solution)",
      density: "1.66 g/cm³",
      viscosity: "Solid",
      solubility: "Extremely soluble in water (~1470 g/L at 20°C)",
      boilingPoint: "N/A",
      meltingPoint: "153°C",
      shelfLife: "36 Months",
      storageConditions: "Store in a cool dry area. Mildly hygroscopic; keep bags tightly sealed to avoid solid baking caking."
    },
    functionalInfo: {
      whatIsIt: "Highly pure, bio-based organic acid produced by fungal fermentation of sugar/glucose substrates.",
      whyUsed: "Used as the absolute standard eco-friendly pH adjuster (acidifier), descaler, mild chelating agent, and preservative booster in household and cosmetic liquid formulated products.",
      advantages: [
        "100% bio-based, exceptionally rapid biodegradation, natural food acid",
        "Outstanding limescale buster and hard-water soap scum dissolver",
        "Safe, non-toxic, and hypoallergenic",
        "Boosts preservative efficiency by lowering formulation pH"
      ],
      limitations: [
        "Highly acidic and irritating to skin/eyes in raw concentrated crystal form",
        "Relatively weak chelating constant at neutral/alkaline pH"
      ],
      alternatives: ["Lactic Acid", "Gluconic Acid", "Sulfamic Acid"],
      ecoFriendliness: "Exemplary. Zero aquatic toxicity, completely green, carbon-neutral."
    },
    dosage: {
      minimum: "0.1% (as required for pH adjustment)",
      recommended: "1.0%",
      premium: "5.0% (as active descaler)",
      maximum: "15.0%",
      household: "0.2% - 1.5% as pH adjuster; 5% - 10% in active toilet/tub descalers",
      industrial: "5% - 12% in professional rust and CIP descaling compounds"
    },
    performance: {
      cleaning: 8,
      foam: 1,
      oilRemoval: 4,
      greaseCutting: 5,
      skinMildness: 8,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 24 hours)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 440 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Skin Irritation (Category 2)"],
      hazardStatements: ["H315: Causes skin irritation", "H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection/protective gloves.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush skin or eyes with clean water for 10 minutes. Blow nose if dust inhaled.",
      msdsSummary: "Highly safe food acid. Avoid eye contact with concentrated crystals."
    }
  }
];
