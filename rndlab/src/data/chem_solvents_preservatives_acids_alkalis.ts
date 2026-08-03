import { Chemical } from "../types";

export const SOLVENTS_PRESERVATIVES_ACIDS_ALKALIS: Chemical[] = [
  {
    id: "ethanol",
    commonName: "Ethanol (Ethyl Alcohol)",
    chemicalName: "Ethanol",
    iupacName: "ethanol",
    casNumber: "64-17-5",
    molecularFormula: "C2H6O",
    molecularWeight: "46.07 g/mol",
    inciName: "Alcohol",
    tradeNames: ["SD Alcohol 40", "Denatured Spirit", "Ethyl Alcohol 96%", "Absolute Ethanol"],
    synonyms: ["Ethyl Alcohol", "Grain Alcohol", "Drinking Alcohol"],
    category: "Solvents",
    suppliers: ["India Glycols", "Godavari Biorefineries", "Cargill", "ADM"],
    marketNames: {
      indian: "Spirit (Ethanol / Alcohol)",
      international: "Denatured Ethanol 96% / 99%",
      hindi: "इथेनॉल (अल्कोहल)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white",
      odor: "Characteristic sweetish, alcoholic",
      activeMatter: "96% or 99.9% active solvent",
      pH: "7.0 (neutral)",
      density: "0.789 g/cm³",
      viscosity: "1.2 cPs",
      solubility: "Completely miscible in water, ether, and organic solvents",
      boilingPoint: "78.37°C",
      meltingPoint: "-114°C",
      shelfLife: "36 Months",
      storageConditions: "Highly flammable. Store in tightly closed containers in a cool, well-ventilated fire-safe warehouse away from heat, sparks, and open flames."
    },
    functionalInfo: {
      whatIsIt: "Simple organic alcohol produced by fermentation of sugars (molasses, sugarcane, corn starch) or hydration of ethylene.",
      whyUsed: "Used as a volatile **solvent, solubilizer, and preservative booster** in premium glass cleaners, quick-drying surface sanitizers, concentrated liquid detergents, and hand rub gels. It reduces formulation viscosity, lowers cloud points, and dissolves hydrophobic essential oils and fragrances.",
      advantages: [
        "Rapid drying without leaving streaks or residues (ideal for mirrors)",
        "Excellent antibacterial and sanitizing properties (at 60% - 80% doses)",
        "100% bio-based, natural, and exceptionally rapidly biodegradable",
        "Acts as a powerful viscosity depressant in concentrated soap mixtures"
      ],
      limitations: [
        "Highly flammable liquid with low flashpoint (~13°C), requiring explosion-proof facility mixing",
        "High concentrations can dry skin if formulated without emollient humectants",
        "Heavily taxed and strictly regulated/licensed in many jurisdictions unless denatured with bittering chemicals"
      ],
      alternatives: ["Isopropanol (IPA)", "Monopropylene Glycol (MPG)", "Propyl Alcohol"],
      ecoFriendliness: "Exemplary. Carbon-neutral plant-fermented origin, zero environmental persistence, non-toxic."
    },
    dosage: {
      minimum: "0.5% (as solubilizer)",
      recommended: "3.0% (as detergent viscosity modifier)",
      premium: "10.0% (in premium mirror cleaners)",
      maximum: "75.0% (in hand sanitizers)",
      household: "1.0% - 5.0% in liquid dish soaps; 5% - 12% in blue glass cleaners",
      industrial: "10% - 40% in quick-drying industrial electronics degreasers"
    },
    performance: {
      cleaning: 7,
      foam: 1, // depresses foam slightly
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 6, // drying
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>99% in 24 hours)",
      plantBasedPct: 100, // sugarcane fermented
      petroleumBasedPct: 0,
      vocStatus: "High VOC (highly volatile solvent)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Antistatic clothing in bulk mixing", "Explosion-proof ventilation"],
      ghsClassification: ["Flammable Liquids (Category 2)", "Eye Irritation (Category 2A)"],
      hazardStatements: ["H225: Highly flammable liquid and vapor", "H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P210: Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        "P233: Keep container tightly closed.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes with water. If inhaled in high amounts, move person to fresh air.",
      msdsSummary: "Highly flammable. Fire safety is of paramount importance during bulk storage. Denatured grades contain denatonium benzoate to make it strictly undrinkable."
    }
  },
  {
    id: "isopropanol",
    commonName: "Isopropanol (IPA)",
    chemicalName: "Isopropyl Alcohol",
    iupacName: "propan-2-ol",
    casNumber: "67-63-0",
    molecularFormula: "C3H8O",
    molecularWeight: "60.10 g/mol",
    inciName: "Isopropyl Alcohol",
    tradeNames: ["IPA 99%", "Isopropyl Alcohol Technical", "Rubbing Alcohol", "Isopropanol"],
    synonyms: ["Dimethyl Carbinol", "2-Propanol", "Sec-Propyl Alcohol"],
    category: "Solvents",
    suppliers: ["Deepak Fertilisers", "Dow Chemical", "Shell Chemical", "ExxonMobil Chemical"],
    marketNames: {
      indian: "IPA (Isopropanol Solvent)",
      international: "Isopropyl Alcohol 99%",
      hindi: "आईपीए (आइसोप्रोपिल अल्कोहल)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white",
      odor: "Sharp, pungent, typical medicinal alcohol odor",
      activeMatter: "99.8% active solvent",
      pH: "7.0",
      density: "0.785 g/cm³",
      viscosity: "2.1 cPs",
      solubility: "Completely miscible in water and organic solvents",
      boilingPoint: "82.6°C",
      meltingPoint: "-89°C",
      shelfLife: "36 Months",
      storageConditions: "Highly flammable. Store in tightly closed containers in a cool, well-ventilated fire-safe warehouse away from heat and sparks."
    },
    functionalInfo: {
      whatIsIt: "Secondary aliphatic organic alcohol synthesized by hydration of propylene.",
      whyUsed: "Used as a rapid-evaporating **solvent, disinfectant, and grease cutter** in windshield washers, glass cleaners, disinfectant sprays, electronics cleaners, and industrial degreasers. Evaporates faster than ethanol and is exceptionally powerful at dissolving heavy grease, grease resins, and fingerprints.",
      advantages: [
        "Extremely fast evaporation rate (zero residue)",
        "Powerful organic degreaser and glue-dissolver",
        "Incredible disinfectant and antiseptic power (optimal at 70% dose)",
        "Does not streak on glass or metallic finishes"
      ],
      limitations: [
        "Highly flammable (flashpoint ~12°C)",
        "Strong, medicinal odor is highly noticeable and requires masking perfumes",
        "Inhalation of high vapors can cause dizziness and drowsiness"
      ],
      alternatives: ["Ethanol", "Monopropylene Glycol", "Butyl Glycol"],
      ecoFriendliness: "Highly biodegradable, low environmental impact, safe once diluted."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "15.0%",
      maximum: "80.0%",
      household: "2.0% - 8.0% in wind-shield wash and premium spray-and-wipe surface cleansers",
      industrial: "10% - 50% in fast-evaporating industrial mechanical solvent washes"
    },
    performance: {
      cleaning: 8,
      foam: 1, // foam suppressant
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 5, // drying
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% OECD 301)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "High VOC (highly volatile solvent)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 9000 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves (long contact)", "Antistatic garments", "Adequate local ventilation"],
      ghsClassification: ["Flammable Liquids (Category 2)", "Eye Irritation (Category 2A)", "Specific Target Organ Toxicity (Category 3 - Narcotic)"],
      hazardStatements: ["H225: Highly flammable liquid and vapor", "H319: Causes serious eye irritation", "H336: May cause drowsiness or dizziness"],
      precautionaryStatements: [
        "P210: Keep away from open flames. No smoking.",
        "P261: Avoid breathing vapors.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Move person to fresh air if dizzy. Flush eyes with clean water immediately.",
      msdsSummary: "Highly flammable organic solvent. Ensure perfect grounding of all mixing equipment to prevent static spark fire."
    }
  },
  {
    id: "mpg",
    commonName: "Monopropylene Glycol (MPG)",
    chemicalName: "1,2-Propanediol",
    iupacName: "propane-1,2-diol",
    casNumber: "57-55-6",
    molecularFormula: "C3H8O2",
    molecularWeight: "76.09 g/mol",
    inciName: "Propylene Glycol",
    tradeNames: ["Propylene Glycol USP", "Dow PG", "MPG Industrial", "Emery PG"],
    synonyms: ["Propylene Glycol", "1,2-Dihydroxypropane", "Methyl Glycol"],
    category: "Solvents",
    suppliers: ["Dow Chemical", "Shell Chemical", "Manali Petrochemicals", "LyondellBasell"],
    marketNames: {
      indian: "Propylene Glycol (MPG)",
      international: "Monopropylene Glycol Tech/USP",
      hindi: "प्रोपलीन ग्लाइकोल (एमपीजी साल्वेंट)"
    },
    physicalProperties: {
      appearance: "Clear viscous hygroscopic liquid",
      color: "Water-white",
      odor: "Odorless or very faint",
      activeMatter: "99.5% Min",
      pH: "6.5 - 7.5 (neutral)",
      density: "1.036 g/cm³",
      viscosity: "42 cPs (moderately viscous liquid)",
      solubility: "Completely miscible with water, acetone, chloroform, and alcohols.",
      boilingPoint: "187.6°C (very low volatility)",
      meltingPoint: "-59°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool dry warehouse. Highly hygroscopic; keep barrels sealed tight."
    },
    functionalInfo: {
      whatIsIt: "Organic diol alcohol compound.",
      whyUsed: "Used as a non-volatile **coupling solvent, humectant, and enzyme stabilizer** in concentrated liquid laundry detergents, liquid hand soaps, and cosmetic washes. It prevents enzymes (like Protease) from self-destructing in liquid formulation storage by locking their shape until diluted in wash water.",
      advantages: [
        "Unbeatable enzymatic stabilizer for premium liquid washes",
        "Increases formula freeze-thaw stability (antifreeze properties)",
        "Zero VOC, high flashpoint (99°C), extremely safe to store and mix",
        "Fully skin-safe and hydrating humectant"
      ],
      limitations: [
        "Adds significant raw material cost",
        "Adds viscosity to liquid mixes, which requires careful formulation balancing"
      ],
      alternatives: ["Sorbitol", "Glycerin", "Dipropylene Glycol (DPG)"],
      ecoFriendliness: "Exceptional. Rapidly biodegradable, non-toxic to aquatic life, safe."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0% (optimal enzyme stabilization)",
      premium: "10.0%",
      maximum: "20.0%",
      household: "2.0% - 6.0% in concentrated 3x liquid laundry soaps",
      industrial: "5.0% - 15% as coupling stabilizer in commercial liquid products"
    },
    performance: {
      cleaning: 4,
      foam: 1, // foam dampening
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 10, // extremely mild humectant
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 5 days)",
      plantBasedPct: 100, // typically bio-sourced from soybean/corn glycerin hydrogenation
      petroleumBasedPct: 0,
      vocStatus: "Exempt VOC (low volatility)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 40,000 mg/L (virtually harmless)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as a precaution.",
      msdsSummary: "Highly safe, non-toxic humectant solvent. Food-grade and cosmetic-grade safety."
    }
  },
  {
    id: "glycerin",
    commonName: "Glycerin (Glycerol)",
    chemicalName: "1,2,3-Propanetriol",
    iupacName: "propane-1,2,3-triol",
    casNumber: "56-81-5",
    molecularFormula: "C3H8O3",
    molecularWeight: "92.09 g/mol",
    inciName: "Glycerin",
    tradeNames: ["Glycerin Refined CP/USP", "Wilmar Glycerin", "Godrej Glycerol"],
    synonyms: ["Glycerol", "Glycyl Alcohol", "Trihydroxypropane"],
    category: "Solvents",
    suppliers: ["Godrej Industries", "Wilmar International", "Cargill", "KLK OLEO"],
    marketNames: {
      indian: "Glycerin Refined 99.5% (Veg)",
      international: "Glycerol USP Vegetable Grade",
      hindi: "ग्लिसरीन (ग्लिसरॉल)"
    },
    physicalProperties: {
      appearance: "Extremely thick, syrupy clear liquid",
      color: "Water-white",
      odor: "Odorless, sweet taste",
      activeMatter: "99.5% Min vegetable active",
      pH: "6.5 - 7.5 (neutral)",
      density: "1.261 g/cm³",
      viscosity: "1412 cPs (highly viscous, thick syrup)",
      solubility: "Completely soluble in water and alcohols. Insoluble in oils.",
      boilingPoint: "290°C",
      meltingPoint: "17.8°C",
      shelfLife: "36 Months",
      storageConditions: "Extremely hygroscopic. Absorbs massive water vapor from air. Store in original sealed tight drums in dry place."
    },
    functionalInfo: {
      whatIsIt: "Simple organic triol compound, produced as a fully natural by-product of soap saponification and vegetable oil biodiesel splitting.",
      whyUsed: "Used as a natural **humectant, skin-softener, and viscosity stabilizer** in liquid hand soaps, hand sanitizers, and wool-washing detergents. It forms a protective barrier on skin, preventing the harsh lipid-stripping action of strong anionic surfactants.",
      advantages: [
        "100% natural, vegetable-derived, highly renewable",
        "Incredible skin mildness, soothing and healing dry skin",
        "Excellent non-volatile viscosity builder and coupling solvent",
        "Acts as a mild natural preservation booster (lowers water activity)"
      ],
      limitations: [
        "Extremely high viscosity makes cold bulk pumping difficult in production",
        "Overdosage (>5.0%) leaves a sticky, tacky skin feel on hands after washing",
        "Does not provide direct dirt-cleaning or grease-cutting action"
      ],
      alternatives: ["Monopropylene Glycol", "Sorbitol", "PEG-7 Glyceryl Cocoate"],
      ecoFriendliness: "Outstanding. Plant-derived, completely green, biodegradable, non-toxic."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0% (ideal handwash emollient)",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1.0% - 3.0% in liquid handwash and premium organic dishwash",
      industrial: "2.0% - 6.0% in specialty industrial moisturizing hand rubs"
    },
    performance: {
      cleaning: 2,
      foam: 1, // foam stabilizer (small amount) / reduces foam (at >15%)
      oilRemoval: 3,
      greaseCutting: 3,
      skinMildness: 10, // maximum skin safety
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>99% in 48 hours)",
      plantBasedPct: 100, // coconut/palm oil sourced
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 54,000 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution.",
      msdsSummary: "Extremely safe, food-grade natural chemical. Highly skin friendly."
    }
  },
  {
    id: "mit-bit",
    commonName: "MIT / BIT Preservative",
    chemicalName: "Methylisothiazolinone & Benzisothiazolinone Blend",
    iupacName: "2-methyl-1,2-thiazol-3-one;1,2-benzothiazol-3-one",
    casNumber: "2682-20-4 & 2634-33-5",
    molecularFormula: "C4H5NOS & C7H5NOS",
    molecularWeight: "115.15 g/mol & 151.19 g/mol",
    inciName: "Methylisothiazolinone (and) Benzisothiazolinone",
    tradeNames: ["Kathon CG", "Proxel GXL", "Acticide MBS", "Neolone"],
    synonyms: ["Isothiazolinone preservative", "BIT/MIT Blend", "Industrial Biocide"],
    category: "Preservatives",
    suppliers: ["Thor GmbH", "LANXESS", "DuPont (Nouryon)", "Dow Chemical"],
    marketNames: {
      indian: "BIT / MIT Liquid Preservative (Kathon)",
      international: "Acticide MBS / Proxel BIT-MIT",
      hindi: "प्रिजर्वेटिव तरल (सड़ने से रोकने वाला)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to Amber-yellow",
      odor: "Faint, characteristic odor",
      activeMatter: "9.5% - 10.0% active biocide solution",
      pH: "4.0 - 6.0 (as is)",
      density: "1.03 g/cm³",
      viscosity: "10 - 25 cPs",
      solubility: "Completely soluble in water and alcohols",
      boilingPoint: "100°C",
      meltingPoint: "-3°C",
      shelfLife: "24 Months",
      storageConditions: "Store in tightly closed original containers between 5°C and 30°C. Protect from direct sunlight and contact with strong reducing agents."
    },
    functionalInfo: {
      whatIsIt: "Highly potent broad-spectrum heterocyclic organic biocide blend.",
      whyUsed: "Used as the absolute industrial standard **preservative** in liquid laundry detergents, liquid handwashes, and dish soaps. It destroys bacteria, mold, yeast, and fungi inside the product, preventing microbial decomposition, color changes, gas bloating, and putrid foul odors during shelf storage.",
      advantages: [
        "Incredibly broad-spectrum efficacy against Gram-positive & Gram-negative bacteria, molds, and yeasts",
        "Highly effective at extremely tiny micro-doses (0.05% - 0.15% total formula weight)",
        "Stable across wide pH ranges (pH 3.0 - 9.5) and high temperatures",
        "Fully soluble, does not affect formulation color, clarity, or foam"
      ],
      limitations: [
        "Strong skin sensitizer in concentrated raw state; can cause contact dermatitis if raw chemical touches skin without thick PPE",
        "Strictly capped at very low legal maximum concentration levels in cosmetic leave-on and rinse-off products"
      ],
      alternatives: ["Sodium Benzoate", "DMDM Hydantoin", "Phenoxyethanol", "Formalin (Formaldehyde)"],
      ecoFriendliness: "Rapidly degrades in environment once diluted; highly toxic to aquatic life in raw concentrated form."
    },
    dosage: {
      minimum: "0.03%",
      recommended: "0.08% (standard effective preservation)",
      premium: "0.15%",
      maximum: "0.20%",
      household: "0.05% - 0.10% in liquid laundry, floor cleaners, and dishwashing soaps",
      industrial: "0.08% - 0.18% in commercial institutional cleaning bases"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 5, // potential sensitizer if overdosed
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Fully biodegradable once diluted in active sewage treatment systems (half-life < 24 hours)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Daphnia) ~ 1.2 mg/L (toxic in concentrate)",
      greenRating: "C"
    },
    safety: {
      ppe: ["Chemical Splash Goggles", "Heavy Nitrile/Neoprene Gloves", "Lab Coat", "Face Shield (if splashing risk)"],
      ghsClassification: ["Acute Toxicity (Category 3 - Oral/Dermal)", "Skin Corrosion (Category 1B)", "Skin Sensitization (Category 1)", "Acute Aquatic Toxicity (Category 1)"],
      hazardStatements: [
        "H314: Causes severe skin burns and eye damage",
        "H317: May cause an allergic skin reaction",
        "H301+H311: Toxic if swallowed or in contact with skin",
        "H400: Very toxic to aquatic life"
      ],
      precautionaryStatements: [
        "P280: Wear protective gloves/clothing/eye protection.",
        "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER/doctor.",
        "P303+P361+P353: IF ON SKIN: Take off immediately all contaminated clothing.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Extremely urgent. Wash skin or eyes immediately with flowing water for 15 minutes. See a doctor immediately.",
      msdsSummary: "Highly toxic in concentrated raw form. Always add at the very end of the formulation process when batch temperatures have cooled below 40°C."
    }
  },
  {
    id: "sodium-benzoate",
    commonName: "Sodium Benzoate",
    chemicalName: "Sodium Benzoate",
    iupacName: "sodium benzoate",
    casNumber: "532-32-1",
    molecularFormula: "C7H5NaO2",
    molecularWeight: "144.11 g/mol",
    inciName: "Sodium Benzoate",
    tradeNames: ["Sodium Benzoate FCC", "Purox S", "Kalama Sodium Benzoate"],
    synonyms: ["Benzoic Acid Sodium Salt", "Sodium Benzoate Powder"],
    category: "Preservatives",
    suppliers: ["LANXESS", "Fushun Chemical", "Emerald Kalama Chemical", "Wuhan Youji"],
    marketNames: {
      indian: "Sodium Benzoate Powder (Preservative)",
      international: "Sodium Benzoate Granular / Powder",
      hindi: "सोडियम बेंजोएट (खाद्य प्रिजर्वेटिव)"
    },
    physicalProperties: {
      appearance: "White crystalline powder or granular dustless spheres",
      color: "White",
      odor: "Odorless or very faint",
      activeMatter: "99.0% Min",
      pH: "7.5 - 8.5 (10% aqueous solution)",
      density: "1.44 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~550 g/L at 20°C). Sparingly soluble in alcohol.",
      boilingPoint: "N/A",
      meltingPoint: "> 300°C",
      shelfLife: "36 Months",
      storageConditions: "Store in cool dry warehouse. Keep protected from moisture."
    },
    functionalInfo: {
      whatIsIt: "Organic sodium salt of benzoic acid, commonly sourced from natural botanical origins or synthesized from toluene.",
      whyUsed: "Used as a safe, food-grade and eco-friendly **preservative** in eco-labeled liquid detergents, hand washes, baby wipes, and organic dishwashing soaps. Outstanding efficacy against yeasts and molds in formulations adjusted to a mildly acidic pH (optimal at pH < 5.5, where it converts to active benzoic acid).",
      advantages: [
        "100% biodegradable, food-grade, extremely safe and non-sensitizing",
        "Provides amazing anti-fungal and anti-mold shelf protection",
        "Highly water soluble, leaving products crystal clear",
        "Eco-preferred preservative approved by green labels"
      ],
      limitations: [
        "Virtually inactive at pH > 6.0 (requires formulation acidification below pH 5.5 to work)",
        "Incompatible with strong oxidizing agents",
        "Weak performance against some Pseudomonas bacteria (often combined with Potassium Sorbate or BIT)"
      ],
      alternatives: ["Potassium Sorbate", "MIT/BIT", "Phenoxyethanol"],
      ecoFriendliness: "Exemplary. Fully biodegradable, non-toxic, safe for aquatic species."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.5%",
      premium: "1.0%",
      maximum: "1.5%",
      household: "0.3% - 0.8% in green liquid dish soaps and infant washes (at pH 4.5 - 5.5)",
      industrial: "0.5% - 1.2% in mild organic surface sprays"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 10, // food-grade safety
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>99% in 24 hours)",
      plantBasedPct: 100, // can be bio-derived
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 400 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (during bulk transfers)"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Highly safe organic salt. Eye contact with pure powder causes transient stinging."
    }
  },
  {
    id: "dmdm-hydantoin",
    commonName: "DMDM Hydantoin",
    chemicalName: "1,3-Bis(hydroxymethyl)-5,5-dimethylimidazolidine-2,4-dione",
    iupacName: "1,3-bis(hydroxymethyl)-5,5-dimethylimidazolidine-2,4-dione",
    casNumber: "6440-58-0",
    molecularFormula: "C7H12N2O4",
    molecularWeight: "188.18 g/mol",
    inciName: "DMDM Hydantoin",
    tradeNames: ["Glydant", "DMDMH 55%", "Mackstat DM", "Nipaguard DMDMH"],
    synonyms: ["DMDMH Liquid", "Dimethyloldimethyl Hydantoin"],
    category: "Preservatives",
    suppliers: ["Lonza", "Clariant", "KCI", "Lubrizol"],
    marketNames: {
      indian: "DMDMH Preservative (Glydant)",
      international: "DMDM Hydantoin 55% Liquid",
      hindi: "डीएमडीएमएच प्रिजर्वेटिव (लिक्विड)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to pale yellow",
      odor: "Faint characteristic, formaldehyde-like",
      activeMatter: "54% - 56% active aqueous solution",
      pH: "6.5 - 7.5 (as is)",
      density: "1.15 g/cm³",
      viscosity: "10 - 25 cPs",
      solubility: "Highly soluble in water and polar alcohols",
      boilingPoint: "100°C",
      meltingPoint: "-5°C",
      shelfLife: "24 Months",
      storageConditions: "Store in tight HDPE containers above 10°C (sensitive to cold precipitation). Keep sealed."
    },
    functionalInfo: {
      whatIsIt: "Formaldehyde-donor organic antimicrobial preservative compound.",
      whyUsed: "Used as a highly cost-effective **preservative** in standard liquid dishwashing detergents, liquid hand soaps, car washes, and institutional cleaners. It works by slowly releasing microscopic, trace amounts of formaldehyde into the formulation water, instantly destroying bacterial cell walls.",
      advantages: [
        "Extremely cheap and highly potent preservative",
        "Exceptional performance against Gram-negative and Gram-positive bacteria",
        "Stays highly active at elevated temperatures and across broad pH ranges (pH 3.0 - 10.0)",
        "Water-thin liquid, mixes effortlessly into formulations"
      ],
      limitations: [
        "Releases formaldehyde (GHS classified carcinogen and sensitizer), making it restricted or banned in premium baby and organic/green formulations",
        "Can cause skin reactions in individuals allergic to formaldehyde",
        "Strict regulatory limit of 0.6% max concentration in rinse-off cosmetics"
      ],
      alternatives: ["MIT/BIT", "Sodium Benzoate", "Phenoxyethanol"],
      ecoFriendliness: "Moderate. Biodegrades readily in municipal sludge systems; safe once diluted."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.3% (typical effective dose)",
      premium: "0.5%",
      maximum: "0.6%",
      household: "0.2% - 0.4% in standard economy dishwashing liquids and car shampoos",
      industrial: "0.3% - 0.5% in commercial janitorial floor cleaners"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 6,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% OECD 301)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 170 mg/L",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Skin Sensitization (Category 1)", "Eye Irritation (Category 2A)"],
      hazardStatements: ["H317: May cause an allergic skin reaction", "H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Rinse eyes or skin thoroughly with water for 15 minutes. Wash with soap.",
      msdsSummary: "Highly stable and cheap biocide. Releases formaldehyde; keep strictly below maximum dose guidelines."
    }
  },
  {
    id: "hydrochloric-acid",
    commonName: "Hydrochloric Acid (Muriatic Acid)",
    chemicalName: "Hydrochloric Acid",
    iupacName: "chlorane",
    casNumber: "7647-01-0",
    molecularFormula: "HCl",
    molecularWeight: "36.46 g/mol",
    inciName: "Hydrochloric Acid",
    tradeNames: ["Muriatic Acid 32%", "Acid-HCl", "Concentrated Hydrochloric Acid"],
    synonyms: ["Hydrogen Chloride Aqueous", "Spirits of Salt"],
    category: "Acids",
    suppliers: ["Grasim Industries Ltd.", "GACL", "Gujarat Alkalies", "Olin Corporation"],
    marketNames: {
      indian: "Tezaab (Muriatic Acid 32%)",
      international: "Hydrochloric Acid 32% - 35% Tech",
      hindi: "हाइड्रोक्लोरिक एसिड (तेजाब)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid, fuming",
      color: "Colorless to pale straw yellow (tech grade has trace iron yellowing)",
      odor: "Pungent, suffocating, highly irritating acid gas odor",
      activeMatter: "30% - 33% aqueous hydrogen chloride solution",
      pH: "< 1.0 (extremely acidic)",
      density: "1.16 g/cm³",
      viscosity: "1.5 cPs",
      solubility: "Completely miscible with water in all ratios with heat release",
      boilingPoint: "108°C",
      meltingPoint: "-30°C",
      shelfLife: "36 Months (stable if stored in vapor-proof plastic containers)",
      storageConditions: "Highly corrosive. Store in thick acid-proof FRP or HDPE tanks in a cool, dark, dedicated acid-resistant bunker. Exhaust ventilation is mandatory as fuming vapors corrode steel structures rapidly."
    },
    functionalInfo: {
      whatIsIt: "Extremely strong mineral inorganic acid produced by absorbing hydrogen chloride gas in purified water.",
      whyUsed: "Used as the primary active **limescale-remover, rust-cutter, and sanitizer** in industrial and economy domestic toilet bowl cleaners (typically formulated at 10% active acid). It dissolves calcium carbonate scale instantly with carbon dioxide effervescence, and reacts with rust (iron oxide) to form highly soluble iron chlorides.",
      advantages: [
        "Fastest-acting and cheapest mineral acid for descaling and toilet scrubbing",
        "Excellent uric acid stone and toilet stain breakdown",
        "Possesses natural sanitizing and sanitization properties by dropping local pH below 1.0"
      ],
      limitations: [
        "Extremely corrosive to skin and eyes, causes rapid, severe acid chemical burns",
        "Highly destructive to metals; corrodes stainless steel, copper, iron, and chrome platings instantly, generating explosive hydrogen gas",
        "Vapors are highly fuming and toxic to lungs; must never be mixed with bleach (releases lethal Chlorine gas)"
      ],
      alternatives: ["Sulfamic Acid (safer, non-fuming solid)", "Phosphoric Acid", "Citric Acid"],
      ecoFriendliness: "Mineral acid; neutralizes naturally in sewage lines once reacted with household alkaline waters."
    },
    dosage: {
      minimum: "1.0% (as pH adjuster)",
      recommended: "10.0% (standard domestic toilet cleaners)",
      premium: "15.0%",
      maximum: "30.0% (concentrated masonry wash)",
      household: "8.0% - 12% in standard blue toilet bowl liquids",
      industrial: "15% - 25% in heavy-duty concrete and steel mill pickling washes"
    },
    performance: {
      cleaning: 10, // maximum mineral scale cutting
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 1, // highly destructive to living tissue
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Mineral acid; does not biodegrade. Reacts with minerals in the environment to form harmless chloride salts",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 282 mg/L (due to local pH drop)",
      greenRating: "D"
    },
    safety: {
      ppe: ["Full acid-resistant face shield", "Thick Neoprene gauntlets (gloves)", "Acid-proof rubber boots", "Chemical apron", "Respirator with acid gas cartridges"],
      ghsClassification: ["Skin Corrosion (Category 1A)", "Serious Eye Damage (Category 1)", "Specific Target Organ Toxicity (Category 3 - Respiratory)"],
      hazardStatements: ["H314: Causes severe skin burns and eye damage", "H335: May cause respiratory irritation", "H290: May be corrosive to metals"],
      precautionaryStatements: [
        "P260: Do not breathe acid vapors.",
        "P280: Wear protective gloves/clothing/eye protection/face protection.",
        "P301+P330+P331: IF SWALLOWED: Rinse mouth. Do NOT induce vomiting.",
        "P303+P361+P353: IF ON SKIN: Rinse skin with massive water.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for at least 20 minutes."
      ],
      firstAid: "Extremely urgent. Flush eyes or skin immediately with running water for 30 minutes. Seek emergency medical aid. Do NOT use sodium bicarbonate directly on skin burns without massive water wash first (neutralization heat can worsen burns).",
      msdsSummary: "Highly corrosive mineral acid. Never inhale fumes. Always add acid slowly to water, never water to concentrated acid."
    }
  },
  {
    id: "sulfamic-acid",
    commonName: "Sulfamic Acid",
    chemicalName: "Sulfamic Acid",
    iupacName: "sulfamic acid",
    casNumber: "5329-14-6",
    molecularFormula: "H3NO3S",
    molecularWeight: "97.10 g/mol",
    inciName: "Sulfamic Acid",
    tradeNames: ["Sulfamic Acid Descaler", "Amidosulfonic Acid", "Sulfamidic Acid"],
    synonyms: ["Amidosulfuric Acid", "Sulfacid", "Solid Muriatic Acid"],
    category: "Acids",
    suppliers: ["Sichuan Sanjian", "Nandadeep Chemicals", "Gujarat Alkalies", "LANXESS"],
    marketNames: {
      indian: "Sulfamic Acid Solid Descaler",
      international: "Sulfamic Acid Technical Grade 99%",
      hindi: "सल्फामिक एसिड (ठोस तेजाब)"
    },
    physicalProperties: {
      appearance: "White crystalline non-hygroscopic solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "99.5% Min",
      pH: "1.2 (1% aqueous solution)",
      density: "2.15 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~213 g/L at 20°C). Slowly hydrolyzes to ammonium bisulfate in hot water.",
      boilingPoint: "N/A (decomposes at 205°C)",
      meltingPoint: "205°C",
      shelfLife: "36 Months (very stable dry powder, does not absorb humidity)",
      storageConditions: "Store in cool dry warehouse. Solid is stable; protect from strong alkalis and oxidizers."
    },
    functionalInfo: {
      whatIsIt: "Strong dry mineral acid compound synthesized from urea and oleum.",
      whyUsed: "Used as a high-performance **solid descaler and pH adjuster** in premium domestic descaling powders (coffeemaker cleansers), industrial boiler descalers, milk stone removers in dairies, and safe toilet bowl cleaners. Highly preferred over hydrochloric acid because it is a non-fuming solid, making handling infinitely safer, and has significantly lower corrosive effects on stainless steel and copper.",
      advantages: [
        "Incredibly safe dry solid; non-fuming, does not release irritating acid vapors",
        "Highly efficient limescale and metal-oxide (rust) dissolution",
        "Significantly less corrosive to metals (especially stainless steel and copper) than HCl",
        "Non-hygroscopic solid, packs beautifully in cheap plastic pouches"
      ],
      limitations: [
        "Slightly higher raw material cost than Hydrochloric Acid",
        "Slowly hydrolyzes into ammonium bisulfate in aqueous solution over long storage if temperatures exceed 50°C"
      ],
      alternatives: ["Hydrochloric Acid", "Citric Acid", "Phosphoric Acid"],
      ecoFriendliness: "Low environmental persistence. Neutralizes and breaks down into safe ammonium and sulfate minerals."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "10.0%",
      maximum: "20.0%",
      household: "2% - 10% in household coffeemaker/kettle powder descalers",
      industrial: "5% - 15% in commercial dairy CIP scale flushes"
    },
    performance: {
      cleaning: 9, // outstanding scale buster
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 2,
      skinMildness: 5, // solid is irritating but safe when handled with care
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Mineral compound; decomposes into ammonium sulfate nutrients in soil",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 70 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Rubber Gloves", "Dust Mask (during bulk pouring)"],
      ghsClassification: ["Skin Irritation (Category 2)", "Eye Irritation (Category 2A)", "Chronic Aquatic Toxicity (Category 3)"],
      hazardStatements: ["H315: Causes skin irritation", "H319: Causes serious eye irritation", "H412: Harmful to aquatic life with long lasting effects"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Flush eyes or skin thoroughly with clean water for 10 minutes. Seek medical aid if irritation persists.",
      msdsSummary: "Dry solid acid. Far safer than liquid mineral acids; handle with standard gloves and eye safety."
    }
  },
  {
    id: "oxalic-acid",
    commonName: "Oxalic Acid",
    chemicalName: "Ethanedioic Acid Dihydrate",
    iupacName: "ethanedioic acid dihydrate",
    casNumber: "6153-56-6",
    molecularFormula: "C2H2O4·2H2O",
    molecularWeight: "126.07 g/mol",
    inciName: "Oxalic Acid",
    tradeNames: ["Oxalic Acid Dihydrate", "Rust Remover Solid", "Ethanedioic Acid"],
    synonyms: ["Dicarboxylic Acid", "Wood Bleaching Solid"],
    category: "Acids",
    suppliers: ["Ube Industries", "Clariant", "Star Oxochem", "Wujiang Qingyun"],
    marketNames: {
      indian: "Oxalic Acid (Rust Clean Powder)",
      international: "Oxalic Acid Dihydrate 99.6% Tech",
      hindi: "ऑक्सालिक एसिड (जंग साफ करने वाला पाउडर)"
    },
    physicalProperties: {
      appearance: "White crystalline solid",
      color: "White",
      odor: "Odorless",
      activeMatter: "99.5% Min",
      pH: "1.3 (1% aqueous solution)",
      density: "1.65 g/cm³",
      viscosity: "Solid",
      solubility: "Soluble in water (~100 g/L at 20°C); highly soluble in ethanol",
      boilingPoint: "N/A (sublimes at 150°C)",
      meltingPoint: "101.5°C",
      shelfLife: "36 Months",
      storageConditions: "Store in a cool dry area. Keep protected from moisture. Keep locked away as it is highly toxic if swallowed."
    },
    functionalInfo: {
      whatIsIt: "Simple organic dicarboxylic acid occurring naturally in plants like spinach and rhubarb.",
      whyUsed: "Used as a highly specialized **rust remover, metal polish, and wood bleaching agent** in industrial and domestic cleaners. Oxalic acid has an exceptional, unique affinity for iron. It chemically chelates insoluble ferric iron (rust) into an extremely water-soluble complex, lifting rust stains from porcelain, fabrics, and concrete with unmatched speed.",
      advantages: [
        "Unrivaled performance at removing rust and iron-water stains from toilet bowls and sinks",
        "Excellent bleaching agent for grayed outdoor wood decks",
        "Provides gentle shining and polishing of brass, copper, and bronze surfaces",
        "Highly crystalline solid, easy to dose"
      ],
      limitations: [
        "Highly toxic if swallowed (absorbs calcium in blood to form insoluble calcium oxalate crystals, triggering rapid kidney failure)",
        "Precipitates calcium in hard water as insoluble white calcium oxalate (requires co-builders)"
      ],
      alternatives: ["Citric Acid", "Phosphoric Acid", "Hydrochloric Acid"],
      ecoFriendliness: "Organic acid, fully biodegradable in the environment."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "10.0%",
      maximum: "15.0%",
      household: "2% - 8% in heavy rust-removing toilet powders and laundry spot treatments",
      industrial: "5% - 12% in professional marble polishing and boat fiberglass hull cleansers"
    },
    performance: {
      cleaning: 8,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 2,
      skinMildness: 4, // toxic and irritating
      hardWater: 4 // precipitates calcium
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 48 hours)",
      plantBasedPct: 100, // natural organic acid
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Daphnia) ~ 137 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Heavy Duty Rubber Gloves", "Dust Mask (mandatory to avoid inhaling fine crystals)"],
      ghsClassification: ["Acute Toxicity (Category 4 - Oral/Dermal)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302+H312: Harmful if swallowed or in contact with skin", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P262: Do not get in eyes, on skin, or on clothing.",
        "P280: Wear protective gloves and eye protection.",
        "P301+P312: IF SWALLOWED: Call a POISON CENTER or doctor if you feel unwell."
      ],
      firstAid: "If swallowed, drink massive amounts of water or milk to precipitate calcium, seek emergency hospitalization immediately. Wash eyes or skin with water for 15 minutes.",
      msdsSummary: "Highly toxic solid. Store under lock and key away from food. Avoid breathing dust."
    }
  },
  {
    id: "potassium-hydroxide",
    commonName: "Potassium Hydroxide (Caustic Potash)",
    chemicalName: "Potassium Hydroxide",
    iupacName: "potassium hydroxide",
    casNumber: "1310-58-3",
    molecularFormula: "KOH",
    molecularWeight: "56.11 g/mol",
    inciName: "Potassium Hydroxide",
    tradeNames: ["Caustic Potash Flakes", "KOH Lye (45%)", "Potassium Hydrate"],
    synonyms: ["Potash Lye", "KOH Flakes"],
    category: "Alkalis",
    suppliers: ["Gujarat Alkalies", "UNID", "Olin Corporation", "Evonik Industries"],
    marketNames: {
      indian: "Caustic Potash Flakes",
      international: "Potassium Hydroxide Flakes / Lye 45%",
      hindi: "कॉस्टिक पोटाश (पोटेशियम हाइड्रोक्साइड)"
    },
    physicalProperties: {
      appearance: "White flakes or clear liquid (lye)",
      color: "White opaque solid / color liquid",
      odor: "Odorless",
      activeMatter: "90% Min (Flakes), 45-48% (Liquid)",
      pH: "14.0 (1% aqueous solution)",
      density: "2.04 g/cm³",
      viscosity: "N/A (solid), ~15 cPs (Liquid)",
      solubility: "Highly exothermic dissolution in water (~1210 g/L at 20°C)",
      boilingPoint: "1327°C",
      meltingPoint: "360°C",
      shelfLife: "Indefinite (if protected from air/moisture)",
      storageConditions: "Store in tightly closed original containers. Highly deliquescent (will liquefy within minutes of exposure to humid air). Keep locked."
    },
    functionalInfo: {
      whatIsIt: "Highly caustic strong inorganic alkaline base.",
      whyUsed: "Used as a premium **neutralizer, grease-saponifier, and alkali builder** in liquid soaps and heavy-duty industrial degreasers. Neutralizing sulfonic acids or fatty acids with Potassium Hydroxide yields Potassium soaps, which have significantly higher water solubility limits than Sodium soaps (NaOH neutralised), preventing gel separation and clumping in cold climates.",
      advantages: [
        "Produces liquid products with incredible clarity and freeze-thaw stability",
        "Strongest alkali for slicing through heavy polymerized oil, grease, and fats",
        "Extremely exothermic dissolution provides heat to break concrete soils"
      ],
      limitations: [
        "Extremely hazardous, corrosive, causes severe chemical skin burns",
        "Significantly more expensive than Caustic Soda (NaOH)"
      ],
      alternatives: ["Sodium Hydroxide", "Triethanolamine (TEA)"],
      ecoFriendliness: "Purely mineral. Increases pH of water bodies if discharged raw. Saponifies and neutralizes harmlessly in formulated soaps."
    },
    dosage: {
      minimum: "0.5% (as required for pH/neutralization)",
      recommended: "1.9% (to neutralize 10% LABSA)",
      premium: "Variable",
      maximum: "12.0% (concentrated oven cleaners)",
      household: "Used strictly for liquid soap batching and liquid laundry pH balancing",
      industrial: "2.0% - 10.0% in heavy-duty commercial oven and grill cleaning gels"
    },
    performance: {
      cleaning: 10,
      foam: 1,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 1, // highly caustic
      hardWater: 5
    },
    sustainability: {
      biodegradability: "Mineral base, does not biodegrade. Reacts with CO2 to form harmless potassium carbonate mineral",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 80 mg/L",
      greenRating: "C"
    },
    safety: {
      ppe: ["Full chemical goggles", "Heavy Neoprene gloves", "Rubber boots", "Face shield", "Sleeve protectors"],
      ghsClassification: ["Skin Corrosion (Category 1A)", "Serious Eye Damage (Category 1)", "Acute Toxicity (Category 4 - Oral)"],
      hazardStatements: ["H314: Causes severe skin burns and eye damage", "H302: Harmful if swallowed"],
      precautionaryStatements: [
        "P280: Wear protective gloves/clothing/eye protection.",
        "P301+P330+P331: IF SWALLOWED: Rinse mouth. Do NOT induce vomiting.",
        "P303+P361+P353: IF ON SKIN: Rinse skin with massive water."
      ],
      firstAid: "Rinse skin or eyes immediately with flowing water for 30 minutes. Seek emergency medical aid.",
      msdsSummary: "Highly corrosive caustic alkali. Keep tightly sealed in dry drums. Generates massive heat when dissolving in water."
    }
  },
  {
    id: "triethanolamine",
    commonName: "Triethanolamine (TEA)",
    chemicalName: "2,2',2''-Nitrilotriethanol",
    iupacName: "2-[bis(2-hydroxyethyl)amino]ethanol",
    casNumber: "102-71-6",
    molecularFormula: "C6H15NO3",
    molecularWeight: "149.19 g/mol",
    inciName: "Triethanolamine",
    tradeNames: ["TEA 99%", "Dow TEA", "SABIC TEA", "Huntsman TEA"],
    synonyms: ["TEA", "Trolamine", "Trihydroxytriethylamine"],
    category: "Alkalis",
    suppliers: ["Dow Chemical", "Huntsman Corporation", "SABIC", "Reliance Industries"],
    marketNames: {
      indian: "TEA (Triethanolamine 99%)",
      international: "Triethanolamine 99% Pure / Tech",
      hindi: "टीईए (ट्राइएथनोलेमाइन क्षारीय तरल)"
    },
    physicalProperties: {
      appearance: "Viscous hygroscopic thin liquid",
      color: "Water-white to Pale Straw Yellow (darkens to amber over exposure to light and air)",
      odor: "Faint, ammonia-like",
      activeMatter: "99% Min active amine",
      pH: "10.5 (1% aqueous solution)",
      density: "1.124 g/cm³",
      viscosity: "590 cPs (highly viscous thin liquid)",
      solubility: "Completely soluble in water, methanol, and acetone",
      boilingPoint: "335.4°C (extremely low volatility)",
      meltingPoint: "21.6°C",
      shelfLife: "24 Months (sensitive to oxygen; turns brown over time)",
      storageConditions: "Store in cool dry warehouse. Protect from light, air, and moisture. Store in stainless steel or HDPE tanks."
    },
    functionalInfo: {
      whatIsIt: "Tertiary amine and organic triol compound, synthesized by reacting ethylene oxide with ammonia.",
      whyUsed: "Used as a premium, highly skin-safe **organic neutralizer, pH buffer, and emulsifier booster** in liquid hand washes, cosmetic creams, car polishes, and sensitive laundry detergents. Neutralizing LABSA (sulfonic acid) with Triethanolamine yields TEA-LAS, an ultra-mild, extremely water-soluble surfactant that does not dry skin, making it standard for high-end cosmetic hand washes.",
      advantages: [
        "Extremely mild neutralizer, reducing skin irritation of anionic surfactants dramatically",
        "Yields ultra-soluble surfactant salts, ensuring crystal-clear low-temperature liquid stability",
        "Acts as an outstanding corrosion inhibitor for steel and brass inside packaging",
        "High flashpoint (179°C), extremely safe to handle and store"
      ],
      limitations: [
        "Highly expensive neutralizer compared to Caustic Soda (NaOH)",
        "Much larger molecular weight means it requires 3.7 times more mass to neutralize LABSA compared to caustic soda, increasing formulation costs",
        "Forming amines in formulations with nitrates can potentially form trace nitrosamines (GHS warning)"
      ],
      alternatives: ["Monoethanolamine (MEA)", "Sodium Hydroxide", "Aminomethyl Propanol (AMP-95)"],
      ecoFriendliness: "Moderately biodegradable, low aquatic toxicity, low environmental impact."
    },
    dosage: {
      minimum: "0.5% (as pH buffer)",
      recommended: "4.5% - 5.0% (typical amount required to neutralize 10% LABSA)",
      premium: "Variable",
      maximum: "10.0%",
      household: "2.0% - 6.0% in cosmetic liquid hand soaps and wool detergents",
      industrial: "1.0% - 5.0% in metal cutting fluids and automobile polishes"
    },
    performance: {
      cleaning: 6,
      foam: 4,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 9, // extremely mild organic alkali
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Exempt VOC (due to extremely high boiling point)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 11,000 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS (pure amine is mildly irritating to eyes)"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution. Wash skin.",
      msdsSummary: "Highly stable and safe organic amine. Highly mild; avoid long skin contact with concentrate. Turns amber with light exposure."
    }
  },
  {
    id: "dolomite-powder",
    commonName: "Dolomite Powder",
    chemicalName: "Calcium Magnesium Carbonate",
    iupacName: "calcium magnesium dicarbonate",
    casNumber: "16389-88-1",
    molecularFormula: "CaMg(CO3)2",
    molecularWeight: "184.40 g/mol",
    inciName: "Dolomite",
    tradeNames: ["Dolomite Micronised", "Dolomite Superfine", "Mineral Filler D"],
    synonyms: ["Dolomitic Limestone", "Calcium Magnesium Carbonate Mineral"],
    category: "Fillers",
    suppliers: ["Imerys", "Sibelco", "Wolkem", "Local Indian Mineral Mills"],
    marketNames: {
      indian: "Dolomite Powder (Chuna/Filler)",
      international: "Dolomite Powder Micronised",
      hindi: "डोलोमाइट पाउडर (डिटर्जेंट पाउडर फिलर)"
    },
    physicalProperties: {
      appearance: "Superfine dry powder",
      color: "Bright White to Creamy White",
      odor: "Odorless",
      activeMatter: "98% Min pure mineral",
      pH: "9.0 - 9.5 (saturated slurry in water)",
      density: "2.84 g/cm³",
      viscosity: "Solid",
      solubility: "Completely insoluble in water and organic solvents; dissolves with effervescence in acids",
      boilingPoint: "N/A",
      meltingPoint: "730°C (decomposes into CaO and MgO)",
      shelfLife: "Indefinite",
      storageConditions: "Store in a dry, ventilated warehouse. Extremely stable mineral."
    },
    functionalInfo: {
      whatIsIt: "Fully natural earth-mined sedimentary carbonate mineral composed of calcium magnesium carbonate.",
      whyUsed: "Used as an extremely cheap **abrasive filler and solid carrier** in powdered laundry detergents and scouring scouring cream scrub bars. It standardizes active matter levels in economy powders, increases bulk density, and provides a mild mechanical scrubbing abrasive force.",
      advantages: [
        "Incredibly cheap, inert mineral filler",
        "Increases powder bulk density, reducing packaging bag volume",
        "Provides gentle mechanical scrubbing polishing on hard surfaces",
        "100% natural, green, and non-toxic mineral origin"
      ],
      limitations: [
        "Completely insoluble in water; over-addition (>15%) leaves heavy, messy white mineral chalk residues on clothes and in washing tubs",
        "Adds zero chemical cleaning, foaming, or water-softening power"
      ],
      alternatives: ["Sodium Sulfate", "Calcium Carbonate", "Diatomaceous Earth"],
      ecoFriendliness: "Exemplary. Natural sedimentary earth mineral, totally non-toxic, integrates harmlessly into soil sediments."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "15.0%",
      premium: "0.0% (premium brands avoid insoluble mineral fillers)",
      maximum: "40.0%",
      household: "5.0% - 25% in economy-grade laundry washing powders and cleaning bars",
      industrial: "10% - 35% in heavy mechanical powder scrubbers"
    },
    performance: {
      cleaning: 2, // mechanical abrasion only
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 2,
      skinMildness: 9, // inert mineral
      hardWater: 2
    },
    sustainability: {
      biodegradability: "Inorganic mineral; does not biodegrade. Integrates naturally into soil clay structure",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L (perfectly safe)",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "N95 Dust Mask (mandatory to prevent dust inhalation during bulk pouring)"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P261: Avoid breathing dust."],
      firstAid: "Rinse eyes with water as precaution. Blow nose if dust inhaled.",
      msdsSummary: "Highly safe natural mineral. Control mineral dust inhalation in bulk production."
    }
  },
  {
    id: "silicone-antifoam",
    commonName: "Silicone Antifoam Emulsion",
    chemicalName: "Polydimethylsiloxane (PDMS) Emulsion",
    iupacName: "poly(dimethylsiloxane) emulsion",
    casNumber: "63148-62-9",
    molecularFormula: "(C2H6OSi)n",
    molecularWeight: "15,000 - 100,000 g/mol (polymer)",
    inciName: "Dimethicone",
    tradeNames: ["SAG 1570", "Xiameter AFE-0010", "Dowsil Antifoam", "Wacker SD"],
    synonyms: ["Silicone Defoamer Emulsion", "PDMS Defoamer", "Anti-foam Agent"],
    category: "Foam Control",
    suppliers: ["Dow Silicones (Xiameter)", "Wacker Chemie", "Momentive Performance Materials", "Shin-Etsu"],
    marketNames: {
      indian: "Silicone Defoamer Emulsion (Foam Killer)",
      international: "Silicone Antifoam 10% / 30% Emulsion",
      hindi: "सिलिकॉन डिफोमर (झाग मिटाने वाला तरल)"
    },
    physicalProperties: {
      appearance: "Milky white viscous liquid emulsion",
      color: "White",
      odor: "Odorless or faint characteristic",
      activeMatter: "10% or 30% active polydimethylsiloxane dispersion",
      pH: "6.5 - 7.5 (neutral)",
      density: "1.01 g/cm³",
      viscosity: "500 - 1500 cPs",
      solubility: "Completely dispersible in water, forms stable milky dilution",
      boilingPoint: "100°C",
      meltingPoint: "0°C",
      shelfLife: "24 Months",
      storageConditions: "Do not freeze. Store above 5°C and below 40°C in tightly sealed original plastic barrels. Stir slightly before dosing."
    },
    functionalInfo: {
      whatIsIt: "High-molecular-weight organosilicon polymer (PDMS) dispersed as a fine emulsion in water using nonionic emulsifiers.",
      whyUsed: "Used as a highly potent **foam killer and defoamer** in low-foam laundry detergents (designed for automatic front-loading washing machines), carpet extraction shampoo gels, and industrial tank rinses. It has an extremely low surface tension, allowing it to spread rapidly across foam bubble walls, causing them to thin and rupture instantly.",
      advantages: [
        "Phenomenal defoaming potency, killing foam instantly at tiny micro-doses (0.02% - 0.2%)",
        "Prevents foam overflow in automatic washing machines (protects electrical circuit boards)",
        "Fully stable across wide pH (pH 2.0 - 12.0) and high temperature ranges",
        "Does not discolor or affect cleaning chemistry performance"
      ],
      limitations: [
        "Overdosage (>0.5%) can leave faint silicone oil spots on fabrics or cause formula clouding",
        "High cost per kg (requires very precise micrometer dosing in production)",
        "Poor bio-degradability (though it degrades into safe silica minerals under soil soil exposure)"
      ],
      alternatives: ["Paraffin Wax Defoamers", "Block Polyethers (EO/PO copolymers)"],
      ecoFriendliness: "Chemically inert. Adheres to soil sludge and safely decomposes in clay sediments into natural silica, water, and carbon dioxide."
    },
    dosage: {
      minimum: "0.01%",
      recommended: "0.08% (highly effective for front-load detergents)",
      premium: "0.20%",
      maximum: "0.50%",
      household: "0.05% - 0.15% in front-loading automatic washing liquids",
      industrial: "0.10% - 0.30% in high-pressure carpet steam extraction detergents"
    },
    performance: {
      cleaning: 2,
      foam: 1, // maximum foam killer
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 10, // highly inert and cosmetic safe
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Poor organic biodegradation, but degrades mineralogically in soils into amorphous silica",
      plantBasedPct: 0,
      petroleumBasedPct: 100, // synthetic silicone
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / liquid silicone polymer",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS regulations"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution.",
      msdsSummary: "Highly safe, inert silicone emulsion. Extremely non-hazardous. Stir slightly before batch dosing."
    }
  }
];
