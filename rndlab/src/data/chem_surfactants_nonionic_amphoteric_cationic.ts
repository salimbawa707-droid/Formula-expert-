import { Chemical } from "../types";

export const NONIONIC_AMPHOTERIC_CATIONIC_SURFACTANTS: Chemical[] = [
  {
    id: "capb",
    commonName: "CAPB (Cocamidopropyl Betaine) 30%",
    chemicalName: "Cocamidopropyl Betaine",
    iupacName: "{[3-(dodecanoylamino)propyl](dimethyl)ammonio}acetate",
    casNumber: "61789-40-0",
    molecularFormula: "C19H38N2O3",
    molecularWeight: "342.52 g/mol",
    inciName: "Cocamidopropyl Betaine",
    tradeNames: ["CAPB 30%", "Tego Betain", "Dehyton PK", "Galaxy CAPB"],
    synonyms: ["Coco Amido Propyl Betaine", "Coco Alkyldimethyl Betaine"],
    category: "Amphoteric Surfactants",
    suppliers: ["Evonik Industries", "Galaxy Surfactants", "Solvay S.A.", "Clariant"],
    marketNames: {
      indian: "Betaine (CAPB)",
      international: "CAPB 30 / 35",
      hindi: "बीटेन (सीएपीबी)"
    },
    physicalProperties: {
      appearance: "Clear, thin liquid",
      color: "Pale Yellow to Water-white",
      odor: "Faint, sweetish",
      activeMatter: "28% - 32% (rest is water and NaCl around 5%)",
      pH: "5.0 - 7.0 (as is)",
      density: "1.04 g/cm³",
      viscosity: "100 - 300 cPs",
      solubility: "Completely soluble in water, alcohol, and surfactants",
      boilingPoint: "100°C",
      meltingPoint: "-2°C",
      shelfLife: "24 Months",
      storageConditions: "Store in original sealed containers above 5°C to avoid crystallization. Stable over wide pH ranges."
    },
    functionalInfo: {
      whatIsIt: "Zwitterionic (amphoteric) surfactant made from coconut oil fatty acids reacted with dimethylaminopropylamine (DMAPA) and sodium monochloroacetate.",
      whyUsed: "Used as a secondary surfactant to boost foam quality, stabilize foam under high oil load, reduce skin irritation of anionic surfactants (like SLES/LABSA), and build viscosity in salt-thickened formulas.",
      advantages: [
        "Exceptional mildness to skin and eyes",
        "Excellent foam conditioning properties",
        "Stable across extremely wide pH range (acid to alkaline)",
        "Acts as an antistatic and conditioning agent"
      ],
      limitations: [
        "Expensive relative to anionic surfactants",
        "Low individual detergency (must be used in combination with LABSA/SLES)",
        "Trace amidoamine impurities can occasionally cause minor contact allergies in hypersensitive individuals"
      ],
      alternatives: ["Cocamidopropyl Hydroxysultaine (CAPHS)", "Coco Betaine", "Lauryl Glucoside"],
      ecoFriendliness: "Highly biodegradable, very low environmental impact, plant-derived lipid tail."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 5% in mild dishwash and hand wash liquids",
      industrial: "1% - 3% in specialty automotive shampoos"
    },
    performance: {
      cleaning: 5,
      foam: 9,
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 9,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% OECD 301E)",
      plantBasedPct: 80,
      petroleumBasedPct: 20,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "EC50 (Daphnia) ~ 1.9 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Skin Irritation (Category 2)"],
      hazardStatements: ["H319: Causes serious eye irritation", "H315: Causes skin irritation"],
      precautionaryStatements: [
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes.",
        "P337+P313: If eye irritation persists: Get medical advice/attention."
      ],
      firstAid: "Flush eyes with plenty of water. Wash skin with soap and water if irritated.",
      msdsSummary: "Relatively non-hazardous. Avoid contact with eyes in raw form. Easily handled and blended."
    }
  },
  {
    id: "lauryl-glucoside",
    commonName: "Lauryl Glucoside",
    chemicalName: "Lauryl D-glucoside",
    iupacName: "(2R,3R,4S,5S,6R)-2-(dodecyloxy)-6-(hydroxymethyl)oxane-3,4,5-triol",
    casNumber: "110615-47-9",
    molecularFormula: "C18H36O6",
    molecularWeight: "348.48 g/mol",
    inciName: "Lauryl Glucoside",
    tradeNames: ["Plantacare 1200", "Glucopon 600", "Galaxy Lauryl Glucoside"],
    synonyms: ["Dodecyl Glucoside", "Lauryl Polyglucoside"],
    category: "Nonionic Surfactants",
    suppliers: ["BASF SE", "Galaxy Surfactants", "Dow Chemical", "Clariant"],
    marketNames: {
      indian: "Lauryl Glucoside (50% Active)",
      international: "Lauryl Glucoside 50% Liquid",
      hindi: "लॉरिल ग्लूकोसाइड"
    },
    physicalProperties: {
      appearance: "Cloudy, viscous liquid/paste",
      color: "Light Yellow",
      odor: "Faint, characteristic",
      activeMatter: "50% - 53%",
      pH: "11.5 - 12.5 (20% aqueous solution)",
      density: "1.08 g/cm³",
      viscosity: "2000 - 4000 cPs (at 40°C)",
      solubility: "Soluble in water, forming stable micellar structures",
      boilingPoint: "> 100°C",
      meltingPoint: "10°C",
      shelfLife: "24 Months",
      storageConditions: "Store between 15°C and 35°C. Solidifies easily if cold; warm gently and mix well to homogenize before use."
    },
    functionalInfo: {
      whatIsIt: "100% natural, biodegradable nonionic Alkyl Polyglucoside (APG) surfactant synthesized from coconut-derived fatty alcohols and corn starch-derived glucose.",
      whyUsed: "Used as a mild co-surfactant in ecological laundry liquids, baby soaps, and dishwash formulations. Provides excellent soil suspension, grease cutting, and low skin irritation.",
      advantages: [
        "100% bio-based, ultra-sustainable",
        "Exceptional mildness to skin and eyes",
        "Superb compatibility with other surfactants",
        "Increases formulation viscosity in combination with anionic systems"
      ],
      limitations: [
        "Highly viscous paste at low temperatures, difficult to pump",
        "Very high raw pH (alkaline) requires pH neutralization to 5.0 - 7.0 in formulated finished products"
      ],
      alternatives: ["Coco Glucoside", "Decyl Glucoside", "CAPB"],
      ecoFriendliness: "Highly biodegradable under aerobic and anaerobic conditions. Non-toxic to aquatic systems."
    },
    dosage: {
      minimum: "1.5%",
      recommended: "5.0%",
      premium: "12.0%",
      maximum: "20.0%",
      household: "3% - 8% in green household detergents and dishwash",
      industrial: "5% - 15% in mild cosmetic/clinical formulations"
    },
    performance: {
      cleaning: 8,
      foam: 7,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Extremely rapid biodegradation (>98% in 14 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 3.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with large volumes of water. Wash skin with soap.",
      msdsSummary: "Highly alkaline raw material. Avoid contact with eyes before neutralization."
    }
  },
  {
    id: "coco-glucoside",
    commonName: "Coco Glucoside",
    chemicalName: "Coco Glucoside",
    iupacName: "coco glucoside",
    casNumber: "141464-42-8",
    molecularFormula: "C16H32O6 (average)",
    molecularWeight: "320.42 g/mol",
    inciName: "Coco-Glucoside",
    tradeNames: ["Plantacare 818", "Glucopon 425", "Galaxy Coco Glucoside"],
    synonyms: ["Coco Alkyl Glucoside", "Coconut Polyglucoside"],
    category: "Nonionic Surfactants",
    suppliers: ["BASF SE", "Galaxy Surfactants", "Dow Chemical", "Croda"],
    marketNames: {
      indian: "Coco Glucoside (50% Active)",
      international: "Coco-Glucoside 50% Active",
      hindi: "कोको ग्लूकोसाइड"
    },
    physicalProperties: {
      appearance: "Viscous, translucent liquid",
      color: "Light Yellow",
      odor: "Faint, characteristic sweet",
      activeMatter: "50% - 52%",
      pH: "11.5 - 12.5 (20% aqueous solution)",
      density: "1.07 g/cm³",
      viscosity: "1000 - 2500 cPs (at 25°C)",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "5°C",
      shelfLife: "24 Months",
      storageConditions: "Keep in a cool dry area above 15°C to avoid crystallization. Neutralize pH before final bottling."
    },
    functionalInfo: {
      whatIsIt: "100% natural biodegradable nonionic surfactant synthesized from coconut oil fatty alcohol and starch-derived glucose.",
      whyUsed: "Used as an exceptionally mild foaming surfactant in sulfate-free shampoos, body washes, and eco-detergents.",
      advantages: [
        "Zero skin/eye irritation, highly recommended for babies",
        "Increases foam density and volume in blend systems",
        "Excellent wetting and emulsifying action",
        "Fully sustainable and eco-certified"
      ],
      limitations: [
        "Slightly lower viscosity-building power compared to Lauryl Glucoside",
        "Strongly alkaline in raw form, requires pH adjustment"
      ],
      alternatives: ["Lauryl Glucoside", "Decyl Glucoside", "CAPB"],
      ecoFriendliness: "Exemplary biodegradation. Completely safe for marine discharge."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0%",
      premium: "10.0%",
      maximum: "20.0%",
      household: "2% - 6% in baby detergents and dish liquids",
      industrial: "4% - 12% in eco-friendly foaming cleansers"
    },
    performance: {
      cleaning: 7,
      foam: 8,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>98% OECD 301D)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 5.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear eye protection and gloves.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with warm water. Wash skin with water.",
      msdsSummary: "Highly alkaline raw fluid. Always wear protective eye goggles during initial dilution and blending."
    }
  },
  {
    id: "decyl-glucoside",
    commonName: "Decyl Glucoside",
    chemicalName: "Decyl D-glucoside",
    iupacName: "(2R,3R,4S,5S,6R)-2-(decyloxy)-6-(hydroxymethyl)oxane-3,4,5-triol",
    casNumber: "58846-77-8",
    molecularFormula: "C16H32O6",
    molecularWeight: "320.42 g/mol",
    inciName: "Decyl Glucoside",
    tradeNames: ["Plantacare 2000", "Oramix NS 10", "Galaxy Decyl Glucoside"],
    synonyms: ["Decyl Polyglucoside", "Decyl Ether of Corn Glucose"],
    category: "Nonionic Surfactants",
    suppliers: ["BASF SE", "Galaxy Surfactants", "Dow Chemical", "Seppic"],
    marketNames: {
      indian: "Decyl Glucoside (50% Active)",
      international: "Decyl Glucoside 50% Liquid",
      hindi: "डेसिल ग्लूकोसाइड"
    },
    physicalProperties: {
      appearance: "Hazy to clear yellow-amber liquid",
      color: "Light Yellow",
      odor: "Mild, sweetish, natural",
      activeMatter: "50% - 52%",
      pH: "11.5 - 12.5 (20% aqueous solution)",
      density: "1.06 g/cm³",
      viscosity: "1000 - 2000 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "5°C",
      shelfLife: "24 Months",
      storageConditions: "Store between 15°C and 30°C. Protect from freezing."
    },
    functionalInfo: {
      whatIsIt: "Highly eco-friendly nonionic Alkyl Polyglucoside (APG) made from renewable plant starch and decyl alcohol.",
      whyUsed: "Used as a mild, fast-foaming primary or secondary surfactant in organic cosmetics, baby washes, and premium green household spray cleaners.",
      advantages: [
        "Incredible skin and mucosal mildness",
        "Generates dense, rapid, rich flash foam",
        "Highly biodegradable and ecologically sound",
        "Cleans without stripping natural lipid barriers"
      ],
      limitations: [
        "Lacks individual viscosity-building power",
        "Alkaline raw pH requires acidification (citric acid addition)"
      ],
      alternatives: ["Coco Glucoside", "Lauryl Glucoside", "CAPB"],
      ecoFriendliness: "Superb environmental safety. Highly biodegradable. Lowest aquatic toxicity among APGs."
    },
    dosage: {
      minimum: "1.5%",
      recommended: "5.0%",
      premium: "10.0%",
      maximum: "18.0%",
      household: "2% - 6% in baby dishwashers and mild liquid cleansers",
      industrial: "4% - 10% in eco-shampoos and gentle facial gels"
    },
    performance: {
      cleaning: 7,
      foam: 9,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% OECD 301D)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 8.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves/clothing/eye protection/face protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes instantly with clean water for 15 minutes. Wash skin with soap.",
      msdsSummary: "Highly alkaline raw material. Exercise standard eye protection."
    }
  },
  {
    id: "caprylyl-capryl-glucoside",
    commonName: "Caprylyl/Capryl Glucoside",
    chemicalName: "Caprylyl/Capryl Glucoside",
    iupacName: "caprylyl/capryl glucoside",
    casNumber: "68515-73-1",
    molecularFormula: "C14H28O6 (average)",
    molecularWeight: "292.37 g/mol",
    inciName: "Caprylyl/Capryl Glucoside",
    tradeNames: ["Oramix CG 110", "Glucopon 215", "Plantacare 810"],
    synonyms: ["C8-C10 Alkyl Glucoside", "Octyl/Decyl Polyglucoside"],
    category: "Nonionic Surfactants",
    suppliers: ["BASF SE", "Galaxy Surfactants", "Dow Chemical", "Seppic"],
    marketNames: {
      indian: "Caprylyl/Capryl Glucoside (60% Active)",
      international: "Octyl/Decyl Glucoside 60%",
      hindi: "कैप्रिलील कोको ग्लूकोसाइड"
    },
    physicalProperties: {
      appearance: "Clear, amber-brown liquid",
      color: "Light Amber",
      odor: "Slight, natural characteristic",
      activeMatter: "58% - 62%",
      pH: "11.5 - 12.5 (10% aqueous solution)",
      density: "1.15 g/cm³",
      viscosity: "500 - 1500 cPs",
      solubility: "Soluble in water, stable in highly concentrated salt and alkaline systems",
      boilingPoint: "100°C",
      meltingPoint: "0°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool dry conditions. Highly stable in cold."
    },
    functionalInfo: {
      whatIsIt: "Highly effective, short-chain Alkyl Polyglucoside (APG) nonionic surfactant produced from corn-derived glucose and C8-C10 plant fatty alcohols.",
      whyUsed: "Used as a high-performance, non-foaming or low-foaming solubilizer, wetting agent, and detergent booster in glass cleaners, industrial cleaners, and pesticide dispersants.",
      advantages: [
        "Incredible solubilizing power for oils and fragrances",
        "Outstanding alkaline stability (highly stable in caustic solutions)",
        "Excellent wetting and low streak-leaving residue on hard surfaces",
        "100% renewable natural carbon profile"
      ],
      limitations: [
        "Produces flash foam which is less stable than long-chain glucoside foams",
        "Raw alkaline pH requires citric acid neutralization"
      ],
      alternatives: ["Decyl Glucoside", "SXS (Hydrotrope)", "Alcohol Ethoxylates"],
      ecoFriendliness: "Superb. Ready biodegradability, exceptionally low marine hazard profile."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 5% in glass, tile, and surface sprays",
      industrial: "4% - 10% in industrial alkaline degreasers"
    },
    performance: {
      cleaning: 8,
      foam: 6,
      oilRemoval: 8,
      greaseCutting: 9,
      skinMildness: 9,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>99% OECD 301D)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 11.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes thoroughly with running water immediately. Wash skin.",
      msdsSummary: "Highly alkaline raw material. Avoid contact before formulation neutralization."
    }
  },
  {
    id: "cetearyl-glucoside",
    commonName: "Cetearyl Glucoside",
    chemicalName: "Cetearyl D-glucoside",
    iupacName: "cetearyl D-glucoside",
    casNumber: "246159-33-9",
    molecularFormula: "C24H48O6 (average)",
    molecularWeight: "432.63 g/mol",
    inciName: "Cetearyl Glucoside",
    tradeNames: ["Montanov 68", "Tego Care CG 90"],
    synonyms: ["Cetostearyl Glucoside", "Cetearyl Polyglucoside"],
    category: "Nonionic Surfactants",
    suppliers: ["Seppic", "Evonik Industries", "Croda", "BASF SE"],
    marketNames: {
      indian: "Cetearyl Glucoside Powder",
      international: "Cetearyl Glucoside Emulsifier",
      hindi: "सिटेरिल ग्लूकोसाइड"
    },
    physicalProperties: {
      appearance: "White waxy flakes or pellets",
      color: "White to Off-white",
      odor: "Faint, fatty",
      activeMatter: "95% - 99% (Solid wax)",
      pH: "5.5 - 7.5 (1% aqueous solution)",
      density: "0.94 g/cm³",
      viscosity: "Solid (creates liquid crystal emulsions)",
      solubility: "Insoluble in cold water; dispersible in hot water; soluble in hot oils (oil-phase emulsifier)",
      boilingPoint: "> 250°C",
      meltingPoint: "65°C - 72°C",
      shelfLife: "36 Months",
      storageConditions: "Store in dark, cool, dry environment. Protect from moisture."
    },
    functionalInfo: {
      whatIsIt: "Premium, oil-in-water natural emulsifier synthesized from palm/coconut-derived fatty alcohol and glucose.",
      whyUsed: "Used primarily in premium barrier creams, hand conditioners, and liquid-crystal fabric softeners to build thick, elegant, moisturizing emulsions.",
      advantages: [
        "Promotes liquid-crystal structure mimicking skin lipid barriers",
        "Exceptional hydration and long-lasting skin feel",
        "100% natural, green certified",
        "High tolerance for salts and active ingredients in emulsion"
      ],
      limitations: [
        "Requires heat (hot-mix process) to melt and emulsify (65-75°C)",
        "Relatively expensive specialty raw material"
      ],
      alternatives: ["Glyceryl Stearate", "Ceteareth-20", "Sorbitan Stearate"],
      ecoFriendliness: "Readily biodegradable, entirely plant-derived, very safe."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "5.0%",
      maximum: "8.0%",
      household: "2% - 5% in premium protective skin-care barrier gels",
      industrial: "2% - 6% in thick premium conditioning creams"
    },
    performance: {
      cleaning: 2,
      foam: 2,
      oilRemoval: 5,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Fully biodegradable within 14-28 days",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None (Non-hazardous)"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with clean water as a precaution.",
      msdsSummary: "Highly safe and edible-grade plant emulsifying wax. Hypoallergenic."
    }
  },
  {
    id: "ae-3",
    commonName: "Alcohol Ethoxylate AE-3",
    chemicalName: "Lauryl Alcohol Ethoxylate (3 Mole)",
    iupacName: "2-[2-(2-dodecyloxyethoxy)ethoxy]ethanol",
    casNumber: "9002-92-0",
    molecularFormula: "C18H38O4 (average)",
    molecularWeight: "318.49 g/mol",
    inciName: "Laureth-3",
    tradeNames: ["AEO-3", "Laureth-3", "Empilan KB 3", "Surfonic L12-3"],
    synonyms: ["PEG-3 Lauryl Ether", "Ethoxylated Lauryl Alcohol (3EO)"],
    category: "Nonionic Surfactants",
    suppliers: ["India Glycols Ltd.", "Dow Chemical", "Clariant", "Huntsman"],
    marketNames: {
      indian: "AE-3 Non-Ionic (3 Mole)",
      international: "Laureth-3 (AEO-3)",
      hindi: "अल्कोहल एथॉक्सीलेट एई-३"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid",
      color: "Colorless",
      odor: "Mild, characteristic",
      activeMatter: "99% Min",
      pH: "5.5 - 7.0 (1% aqueous solution)",
      density: "0.93 g/cm³",
      viscosity: "20 - 45 cPs",
      solubility: "Insoluble to dispersible in water; highly soluble in oils and organic solvents",
      boilingPoint: "> 250°C",
      meltingPoint: "5°C",
      shelfLife: "24 Months",
      storageConditions: "Keep container tightly closed in cool conditions. Stable under standard storage."
    },
    functionalInfo: {
      whatIsIt: "Lipophilic (oil-soluble) nonionic surfactant made by reacting dodecyl alcohol with 3 moles of ethylene oxide.",
      whyUsed: "Used as an oil-phase emulsifier, anti-foamer, and oil solubilizer in liquid laundry, industrial degreasers, and dry-cleaning solvents.",
      advantages: [
        "Phenomenal co-emulsifier for heavy oils and greases",
        "Reduces high foaming tendencies in spray cleaners",
        "Outstanding wet-out and surface tension reduction",
        "Highly biodegradable"
      ],
      limitations: [
        "Insoluble in water when used alone (requires co-surfactants like SLES or LABSA)",
        "Low HLB (hydrophile-lipophile balance) of ~8.0"
      ],
      alternatives: ["C12-13 Pareth-3", "Sorbitan Monooleate", "AE-5"],
      ecoFriendliness: "Readily biodegradable, moderate aquatic toxicity."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1% - 3% in oil-cutting liquid dishwashers",
      industrial: "2% - 6% in heavy mechanical engine degreasers"
    },
    performance: {
      cleaning: 7,
      foam: 3,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 7,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301B)",
      plantBasedPct: 75,
      petroleumBasedPct: 25,
      vocStatus: "Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.2 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Serious Eye Damage (Category 1)", "Acute Aquatic Hazard (Category 1)"],
      hazardStatements: ["H318: Causes serious eye damage", "H400: Very toxic to aquatic life"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear eye protection/face protection."
      ],
      firstAid: "Rinse eyes immediately with water for 15 minutes. Wash skin with soap.",
      msdsSummary: "Highly irritating to eyes. Avoid discharge into aquatic waterways."
    }
  },
  {
    id: "ae-5",
    commonName: "Alcohol Ethoxylate AE-5",
    chemicalName: "Lauryl Alcohol Ethoxylate (5 Mole)",
    iupacName: "laureth-5",
    casNumber: "9002-92-0",
    molecularFormula: "C22H46O6 (average)",
    molecularWeight: "406.6 g/mol",
    inciName: "Laureth-5",
    tradeNames: ["AEO-5", "Laureth-5", "Surfonic L12-5"],
    synonyms: ["PEG-5 Lauryl Ether", "Ethoxylated Lauryl Alcohol (5EO)"],
    category: "Nonionic Surfactants",
    suppliers: ["India Glycols Ltd.", "Dow Chemical", "Clariant", "Huntsman"],
    marketNames: {
      indian: "AE-5 Non-Ionic (5 Mole)",
      international: "Laureth-5 (AEO-5)",
      hindi: "अल्कोहल एथॉक्सीलेट एई-५"
    },
    physicalProperties: {
      appearance: "Slightly hazy liquid",
      color: "Colorless to Pale Yellow",
      odor: "Faint, typical",
      activeMatter: "99% Min",
      pH: "5.5 - 7.0 (1% aqueous solution)",
      density: "0.95 g/cm³",
      viscosity: "30 - 60 cPs",
      solubility: "Partially soluble to dispersible in water",
      boilingPoint: "> 250°C",
      meltingPoint: "10°C",
      shelfLife: "24 Months",
      storageConditions: "Store in original sealed containers."
    },
    functionalInfo: {
      whatIsIt: "Nonionic surfactant synthesized by ethoxylating natural dodecyl alcohol with 5 moles of ethylene oxide.",
      whyUsed: "Used as a powerful wetting agent and grease emulsifier in household liquid detergents and industrial laundry formulations.",
      advantages: [
        "Incredible soil penetration and oil suspension",
        "Low-foaming character, perfect for high-speed washing machines",
        "Synergizes beautifully with LABSA and SLES",
        "Excellent biodegradability"
      ],
      limitations: [
        "Requires mechanical agitation or co-surfactants to dissolve fully in cold water",
        "Intermediate water/oil HLB of ~10.5"
      ],
      alternatives: ["AE-3", "AE-7"],
      ecoFriendliness: "Highly biodegradable, standard aquatic warning."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "6.0%",
      maximum: "12.0%",
      household: "2% - 5% in liquid front-load laundry gels",
      industrial: "3% - 8% in commercial fabric cleaning systems"
    },
    performance: {
      cleaning: 8,
      foam: 4,
      oilRemoval: 10,
      greaseCutting: 9,
      skinMildness: 7,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301B)",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.4 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Serious Eye Damage (Category 1)", "Acute Aquatic Hazard (Category 1)"],
      hazardStatements: ["H318: Causes serious eye damage", "H400: Very toxic to aquatic life"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear eye protection."
      ],
      firstAid: "Flush eyes instantly with clean water. Wash skin.",
      msdsSummary: "Eye irritant. Exercise standard chemical care."
    }
  },
  {
    id: "ae-7",
    commonName: "Alcohol Ethoxylate AE-7",
    chemicalName: "Lauryl Alcohol Ethoxylate (7 Mole)",
    iupacName: "laureth-7",
    casNumber: "9002-92-0",
    molecularFormula: "C26H54O8 (average)",
    molecularWeight: "494.7 g/mol",
    inciName: "Laureth-7",
    tradeNames: ["AEO-7", "Laureth-7", "Surfonic L12-7", "Empilan KB 7"],
    synonyms: ["PEG-7 Lauryl Ether", "Ethoxylated Lauryl Alcohol (7EO)"],
    category: "Nonionic Surfactants",
    suppliers: ["India Glycols Ltd.", "Dow Chemical", "Clariant", "Huntsman"],
    marketNames: {
      indian: "AE-7 Non-Ionic (7 Mole)",
      international: "Laureth-7 (AEO-7)",
      hindi: "अल्कोहल एथॉक्सीलेट एई-७"
    },
    physicalProperties: {
      appearance: "Clear liquid to paste (solidifies in winter)",
      color: "Colorless",
      odor: "Mild, characteristic",
      activeMatter: "99% Min",
      pH: "5.5 - 7.0 (1% aqueous solution)",
      density: "0.97 g/cm³",
      viscosity: "50 - 90 cPs",
      solubility: "Completely soluble in water, forms clear solution",
      boilingPoint: "> 250°C",
      meltingPoint: "15°C",
      shelfLife: "24 Months",
      storageConditions: "Store in warm conditions during winter to prevent solidification."
    },
    functionalInfo: {
      whatIsIt: "Highly water-soluble nonionic surfactant made by reacts dodecyl alcohol with 7 moles of ethylene oxide.",
      whyUsed: "The standard primary nonionic surfactant used in liquid laundry detergents, hard surface cleaners, and emulsifiers. Provides exceptional oily dirt emulsification and soil wetting.",
      advantages: [
        "Incredible cleaning and oil-dissolving action",
        "Fully soluble in cold water, forming beautiful clear mixtures",
        "Extremely stable in hard water and high electrolyte solutions",
        "High biodegradability profile"
      ],
      limitations: [
        "Has a lower foam profile compared to anionics like SLES",
        "Cloud Point is approx 55°C, meaning it can cloud at high wash temperatures"
      ],
      alternatives: ["AE-9", "AE-5", "APG"],
      ecoFriendliness: "Highly biodegradable, moderate aquatic toxicity."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 6% in liquid laundry and household degreasers",
      industrial: "4% - 10% in commercial pressure wash chemicals"
    },
    performance: {
      cleaning: 9,
      foam: 5,
      oilRemoval: 10,
      greaseCutting: 9,
      skinMildness: 7,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301B)",
      plantBasedPct: 65,
      petroleumBasedPct: 35,
      vocStatus: "Very Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.5 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with clean water. Wash skin.",
      msdsSummary: "Highly irritating to eyes. Solidifies easily if cold; warm gently before pumping."
    }
  },
  {
    id: "lae-9",
    commonName: "Lauryl Alcohol Ethoxylate (9 Mole)",
    chemicalName: "Lauryl Alcohol Ethoxylate (9EO)",
    iupacName: "2-[2-[2-[2-[2-[2-[2-[2-[2-(dodecyloxy)ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethanol",
    casNumber: "9002-92-0",
    molecularFormula: "C30H62O10 (average)",
    molecularWeight: "582.8 g/mol",
    inciName: "Laureth-9",
    tradeNames: ["AEO-9", "Laureth-9", "LAE-9", "Empilan KB 9", "Surfonic L12-9"],
    synonyms: ["Dodecyl Alcohol Ethoxylate", "PEG-9 Lauryl Ether", "Ethoxylated Lauryl Alcohol"],
    category: "Nonionic Surfactants",
    hlb: "13.3",
    suppliers: ["India Glycols Ltd.", "Dow Chemical", "Clariant", "Huntsman Corporation"],
    marketNames: {
      indian: "Non-Ionic Booster (9 Mole)",
      international: "Laureth-9 (AEO-9)",
      hindi: "नॉन-आयनिक बूस्टर (9 मोल)"
    },
    physicalProperties: {
      appearance: "Hazy liquid to paste (solidifies below 20°C)",
      color: "Colorless to Pale Yellow",
      odor: "Faint, characteristic",
      activeMatter: "99% Min",
      pH: "5.5 - 7.0 (1% aqueous solution)",
      density: "0.98 g/cm³",
      viscosity: "80 - 120 cPs (at 40°C)",
      solubility: "Completely soluble in water, forming a clear solution. Outstanding emulsifying action.",
      boilingPoint: "> 250°C",
      meltingPoint: "20°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool, dry conditions. If frozen, warm gently to liquefy before use without losing active properties."
    },
    functionalInfo: {
      whatIsIt: "Nonionic surfactant synthesized by ethoxylation of plant-derived or synthetic dodecyl alcohol with 9 moles of ethylene oxide.",
      whyUsed: "Outstanding wetting agent, emulsifier, and grease cutter. Unlike anionic surfactants, nonionic surfactants do not ionize in water, making them highly stable in hard water, highly synergistic with SLES/LABSA, and perfect for removing oily soils and sebum.",
      advantages: [
        "Incredible grease-cutting and fat-emulsification power",
        "Extremely stable in hard water (unaffected by calcium/magnesium)",
        "Acts as a low-foaming co-surfactant to control excessive foam",
        "Biodegradable and highly compatible with both anionic and cationic ingredients"
      ],
      limitations: [
        "Has a Cloud Point (approx 70-80°C in water) where it becomes insoluble if overheated",
        "Moderately expensive raw material compared to LABSA/SLES",
        "Produces less foam compared to anionic surfactants (requires SLES for high foaming)"
      ],
      alternatives: ["Alkyl Polyglucoside (APG)", "Cocamide DEA", "Alcohol Ethoxylate (7 Mole)"],
      ecoFriendliness: "Highly biodegradable (>90% OECD 301B). Moderate aquatic toxicity, but breaks down very rapidly in wastewater treatment systems."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "6.0%",
      maximum: "12.0%",
      household: "2% - 5% in liquid laundry detergents and dishwash",
      industrial: "4% - 10% in heavy-duty degreasers and vehicle cleaners"
    },
    performance: {
      cleaning: 9,
      foam: 5,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 7,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily biodegradable under aerobic conditions",
      plantBasedPct: 60,
      petroleumBasedPct: 40,
      vocStatus: "Very Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.5 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves (Nitrile)", "Lab Coat"],
      ghsClassification: ["Acute Toxicity (Category 4 - Oral)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H318: Causes serious eye damage", "H401: Toxic to aquatic life"],
      precautionaryStatements: [
        "P280: Wear eye protection/face protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses.",
        "P310: Immediately call a POISON CENTER or doctor/physician."
      ],
      firstAid: "Immediately flush eyes with water for 15 minutes and consult a doctor. Wash skin with soap and water.",
      msdsSummary: "Highly irritating to eyes. Can solidify at lower temperatures (winter), requiring gentle heating or drum warmers before pumping."
    }
  },
  {
    id: "fae",
    commonName: "Fatty Alcohol Ethoxylates (General)",
    chemicalName: "C12-15 Alcohol Ethoxylate",
    iupacName: "C12-15 alcohol ethoxylate",
    casNumber: "68131-39-5",
    molecularFormula: "C28H58O9 (average)",
    molecularWeight: "538.7 g/mol",
    inciName: "C12-15 Pareth-7",
    tradeNames: ["Neodol 25-7", "Genapol LA 070", "Surfonic L24-7"],
    synonyms: ["Synthetic Alcohol Ethoxylate", "LaurylMyristyl Ethoxylate"],
    category: "Nonionic Surfactants",
    suppliers: ["Shell Chemicals", "Dow Chemical", "Sasol", "India Glycols Ltd."],
    marketNames: {
      indian: "FAE Non-Ionic Surfactant",
      international: "C12-15 Pareth-7",
      hindi: "फैटी अल्कोहल एथॉक्सीलेट"
    },
    physicalProperties: {
      appearance: "Hazy liquid to waxy solid paste",
      color: "White to Colorless",
      odor: "Faint, characteristic soap-like",
      activeMatter: "99% Min",
      pH: "5.5 - 7.5 (1% aqueous solution)",
      density: "0.96 g/cm³",
      viscosity: "40 - 80 cPs (at 40°C)",
      solubility: "Completely soluble in water, forming clear solutions",
      boilingPoint: "> 260°C",
      meltingPoint: "18°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool dry conditions. If frozen, warm gently to liquefy before processing."
    },
    functionalInfo: {
      whatIsIt: "High-performance nonionic surfactant synthesized by ethoxylating natural or synthetic C12-C15 fatty alcohols with 7-9 moles of ethylene oxide.",
      whyUsed: "Used as the absolute backbone emulsifier and grease cutter in high-end concentrated liquid laundry detergents, industrial degreasers, and wetting formulations.",
      advantages: [
        "Incredible oil-emulsification and fat degradation power",
        "Outstanding hard-water stability (immune to high mineral counts)",
        "Excellent synergistic co-cleaning in combination with SLES and LABSA",
        "Fully biodegradable under aerobic systems"
      ],
      limitations: [
        "Lower foaming output than anionic surfactants (requires co-surfactants for foam)",
        "Can become cloudy (Cloud Point) if formulation heated above 50-60°C"
      ],
      alternatives: ["Lauryl Alcohol Ethoxylate (AE-7)", "Alkyl Polyglucoside (APG)", "Nonyl Phenol Ethoxylate"],
      ecoFriendliness: "Highly biodegradable, standard aquatic warning."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 6% in high-efficiency liquid laundry and multi-surface sprayers",
      industrial: "5% - 12% in commercial laundry detergents and engine grease cutters"
    },
    performance: {
      cleaning: 9,
      foam: 5,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 7,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>90% OECD 301B)",
      plantBasedPct: 50,
      petroleumBasedPct: 50,
      vocStatus: "Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.3 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Acute Toxicity (Category 4 - Oral)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear eye protection/face protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with warm water for 15 minutes. Wash skin.",
      msdsSummary: "Highly irritating to eyes. Warm solid drum carefully in hot room if crystallized."
    }
  },
  {
    id: "np-9",
    commonName: "Nonyl Phenol Ethoxylate NP-9",
    chemicalName: "Nonylphenol Ethoxylate (9EO)",
    iupacName: "2-[2-[2-[2-[2-[2-[2-[2-[2-(4-nonylphenoxy)ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethoxy]ethanol",
    casNumber: "127087-87-0",
    molecularFormula: "C33H60O10 (average)",
    molecularWeight: "616.82 g/mol",
    inciName: "Nonoxynol-9",
    tradeNames: ["NP-9", "Tergitol NP-9", "Surfonic N-95", "Alkasurf NP-9"],
    synonyms: ["NPE-9", "Ethoxylated Nonylphenol", "Polyethylene Glycol Nonylphenyl Ether"],
    category: "Nonionic Surfactants",
    suppliers: ["Dow Chemical", "Huntsman Corporation", "Stepan Company", "SABIC"],
    marketNames: {
      indian: "NP-9 Non-Ionic (Nylon Nine)",
      international: "Nonylphenol Ethoxylate 9EO",
      hindi: "एनपी-९ (नॉन-आयनिक)"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy viscous liquid",
      color: "Water-white to Pale Yellow",
      odor: "Slight, aromatic chemical",
      activeMatter: "99% Min",
      pH: "5.0 - 8.0 (1% aqueous solution)",
      density: "1.06 g/cm³",
      viscosity: "200 - 300 cPs",
      solubility: "Soluble in water, glycols, and organic solvents",
      boilingPoint: "> 250°C",
      meltingPoint: "5°C",
      shelfLife: "36 Months",
      storageConditions: "Highly stable. Store in steel or plastic drums. Non-hygroscopic."
    },
    functionalInfo: {
      whatIsIt: "High-performance, petroleum-derived nonionic surfactant produced by reacting nonylphenol with 9 moles of ethylene oxide.",
      whyUsed: "Outstanding industrial emulsifier, degreaser, and wetting agent. Widely used in industrial laundry, vehicle washes, agrochemical sprays, and metalworking fluids. **Banned in several consumer product markets due to environmental persistence of degradation metabolites.**",
      advantages: [
        "Unrivaled grease cutting and asphalt/tar emulsification",
        "Highly stable in extremely hard water, acids, and alkaline systems",
        "Outstanding cold-water wetting performance",
        "Very low cost compared to fatty alcohol ethoxylates"
      ],
      limitations: [
        "Degrades into nonylphenol, which is a known endocrine disruptor and highly toxic to aquatic organisms",
        "Banned or highly restricted in EU/US consumer formulations (requires substitution with LAE-9 or FAE)"
      ],
      alternatives: ["Lauryl Alcohol Ethoxylate (9 Mole)", "C12-15 Pareth-7", "Tridecyl Alcohol Ethoxylate"],
      ecoFriendliness: "Poor. Endocrine disruptor metabolite. Strictly regulated."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "10.0%",
      maximum: "20.0%",
      household: "Used strictly in specialty outdoor grease-cleaners only",
      industrial: "5% - 15% in heavy mechanical parts washers and engine degreasers"
    },
    performance: {
      cleaning: 10,
      foam: 6,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 4,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Slow bio-elimination. Metabolite (nonylphenol) is highly persistent and bioaccumulative.",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Very Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.0 mg/L (highly toxic)",
      greenRating: "D"
    },
    safety: {
      ppe: ["Splash Goggles", "Nitrile Gloves", "Lab Coat", "Vapor Respirator (if heated)"],
      ghsClassification: ["Acute Toxicity (Category 4 - Oral)", "Serious Eye Damage (Category 1)", "Chronic Aquatic Hazard (Category 2)"],
      hazardStatements: ["H302: Harmful if swallowed", "H318: Causes serious eye damage", "H411: Toxic to aquatic life with long-lasting effects"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Flush eyes immediately with water for 15 minutes. Wash skin with soap and water.",
      msdsSummary: "Highly toxic to aquatic life. Strictly control waste discharge. Best replaced with green alcohol ethoxylates."
    }
  },
  {
    id: "np-10",
    commonName: "Nonyl Phenol Ethoxylate NP-10",
    chemicalName: "Nonylphenol Ethoxylate (10EO)",
    iupacName: "nonylphenol ethoxylate (10EO)",
    casNumber: "127087-87-0",
    molecularFormula: "C35H64O11 (average)",
    molecularWeight: "660.87 g/mol",
    inciName: "Nonoxynol-10",
    tradeNames: ["NP-10", "Tergitol NP-10", "Surfonic N-100"],
    synonyms: ["NPE-10", "Ethoxylated Nonylphenol (10EO)"],
    category: "Nonionic Surfactants",
    suppliers: ["Dow Chemical", "Huntsman Corporation", "Stepan Company", "SABIC"],
    marketNames: {
      indian: "NP-10 Non-Ionic (Nylon Ten)",
      international: "Nonylphenol Ethoxylate 10EO",
      hindi: "एनपी-१० (नॉन-आयनिक)"
    },
    physicalProperties: {
      appearance: "Viscous clear liquid (paste in cold)",
      color: "Water-white to Pale Yellow",
      odor: "Slight, aromatic chemical",
      activeMatter: "99% Min",
      pH: "5.0 - 8.0 (1% aqueous solution)",
      density: "1.06 g/cm³",
      viscosity: "240 - 350 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "> 250°C",
      meltingPoint: "10°C",
      shelfLife: "36 Months",
      storageConditions: "Keep closed in cool, dry warehouse."
    },
    functionalInfo: {
      whatIsIt: "Petroleum-derived nonionic ethoxylated surfactant with 10 moles of ethylene oxide attached to nonylphenol.",
      whyUsed: "Highly water-soluble industrial detergent, scouring agent, and oil emulsifier. **Restricted in many consumer formulations due to ecotoxicity of degradation products.**",
      advantages: [
        "Superior water solubility and cold-temperature wetting speed",
        "Outstanding grease-dissolving emulsification profile",
        "Highly stable in high electrolyte and strong alkaline bases",
        "Effective surface tension reduction"
      ],
      limitations: [
        "Slow biodegradation of endocrine-disrupting metabolites",
        "Restricted in Europe and Americas for domestic products"
      ],
      alternatives: ["Lauryl Alcohol Ethoxylate (9 Mole)", "C12-15 Pareth-9"],
      ecoFriendliness: "Poor. Endocrine-active metabolite, harmful to marine ecosystems."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "Used strictly in commercial cleaning products",
      industrial: "5% - 12% in commercial scouring and metal clean"
    },
    performance: {
      cleaning: 10,
      foam: 6,
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 4,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Slow bio-elimination. Metabolites persist in rivers.",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 1.3 mg/L",
      greenRating: "D"
    },
    safety: {
      ppe: ["Splash Goggles", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H318: Causes serious eye damage", "H411: Toxic to aquatic life with long lasting effects"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear eye protection."
      ],
      firstAid: "Flush eyes thoroughly with water for 15 minutes. Wash skin.",
      msdsSummary: "Highly hazardous aquatic discharge. Must be handled with chemical precautions."
    }
  },
  {
    id: "peg-7-cocoate",
    commonName: "PEG-7 Glyceryl Cocoate",
    chemicalName: "PEG-7 Glyceryl Cocoate",
    iupacName: "PEG-7 glyceryl cocoate",
    casNumber: "68201-46-7",
    molecularFormula: "C23H46O10 (average)",
    molecularWeight: "482.6 g/mol",
    inciName: "PEG-7 Glyceryl Cocoate",
    tradeNames: ["Cetiol HE", "Tegosoft GC", "Emanon HE-80"],
    synonyms: ["Polyethylene Glycol (7) Glyceryl Monococoate"],
    category: "Nonionic Surfactants",
    suppliers: ["BASF SE", "Evonik Industries", "Kao Corporation", "Croda"],
    marketNames: {
      indian: "PEG-7 Glyceryl Cocoate",
      international: "PEG-7 Glyceryl Cocoate Solubilizer",
      hindi: "पीईजी-७ ग्लिसराइल कोकोएट"
    },
    physicalProperties: {
      appearance: "Clear, hydrophilic thin oil",
      color: "Water-white to Pale Yellow",
      odor: "Faint, characteristic fatty",
      activeMatter: "98% Min",
      pH: "5.5 - 6.5 (5% aqueous solution)",
      density: "1.05 g/cm³",
      viscosity: "150 - 250 cPs",
      solubility: "Completely soluble in water and surfactant systems",
      boilingPoint: "> 200°C",
      meltingPoint: "-5°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool, dry place. Keep protected from moisture."
    },
    functionalInfo: {
      whatIsIt: "Highly hydrophilic, water-soluble emollient, superfatting agent, and co-emulsifier synthesized by ethoxylating glyceryl cocoate with 7 moles of ethylene oxide.",
      whyUsed: "Used primarily in premium hand washes, body washes, and mild liquid detergents to prevent skin dryness, act as a gentle oil solubilizer, and provide a silky skin feel.",
      advantages: [
        "Outstanding skin conditioning and moisturization (superfatting)",
        "Fully water-soluble, forming crystal-clear liquid formulations",
        "Reduces skin dryness from anionic surfactants",
        "Acts as a mild solubilizer for fragrance and essential oils"
      ],
      limitations: [
        "Relatively expensive specialty raw material",
        "Slightly reduces high foaming output of primary anionics"
      ],
      alternatives: ["PEG-40 Hydrogenated Castor Oil", "Coco Glucoside", "Glycerin"],
      ecoFriendliness: "Highly biodegradable, plant-derived coconut fatty acid backbone."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1% - 3% in premium liquid hand soaps and body wash",
      industrial: "2% - 5% in specialty conditioning cleaners"
    },
    performance: {
      cleaning: 5,
      foam: 4,
      oilRemoval: 6,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301B)",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L (very safe)",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None (Non-hazardous)"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as a precaution.",
      msdsSummary: "Highly safe, gentle cosmetic-grade emollient. Non-irritating."
    }
  },
  {
    id: "peg-40-hco",
    commonName: "PEG-40 Hydrogenated Castor Oil",
    chemicalName: "PEG-40 Hydrogenated Castor Oil",
    iupacName: "PEG-40 hydrogenated castor oil",
    casNumber: "61788-85-0",
    molecularFormula: "C57H110O15 (average)",
    molecularWeight: "1031.5 g/mol",
    inciName: "PEG-40 Hydrogenated Castor Oil",
    tradeNames: ["Cremophor CO 40", "Eumulgin CO 40", "Nikko HCO-40"],
    synonyms: ["Polyethylene Glycol (40) Hydrogenated Castor Oil"],
    category: "Nonionic Surfactants",
    suppliers: ["BASF SE", "Evonik Industries", "Croda", "Galaxy Surfactants"],
    marketNames: {
      indian: "PEG-40 Hydrogenated Castor Oil",
      international: "PEG-40 HCO Solubilizer",
      hindi: "पीईजी-४० हाइड्रोजनीकृत अरंडी का तेल"
    },
    physicalProperties: {
      appearance: "Viscous paste or semi-solid wax (liquefies above 30°C)",
      color: "White to Pale Cream",
      odor: "Faint, characteristic oily",
      activeMatter: "99% Min",
      pH: "6.0 - 7.0 (5% aqueous solution)",
      density: "1.03 g/cm³",
      viscosity: "200 - 450 cPs (at 40°C)",
      solubility: "Completely soluble in water, creating clear solutions. Soluble in oils.",
      boilingPoint: "> 250°C",
      meltingPoint: "30°C",
      shelfLife: "24 Months",
      storageConditions: "Store in tightly sealed containers. Warm gently to liquefy before use."
    },
    functionalInfo: {
      whatIsIt: "Highly efficient nonionic solubilizer and o/w emulsifier synthesized by reacting hydrogenated castor oil with 40 moles of ethylene oxide.",
      whyUsed: "Used primarily to solubilize fragrance oils, essential oils, and oil-soluble vitamins into clear water-based detergent formulations without causing haziness.",
      advantages: [
        "Outstanding solubilizing efficiency for delicate perfumes and oils",
        "Creates completely crystal-clear water solutions",
        "Acts as a mild emollient and superfatting modifier",
        "Highly stable across wide pH ranges"
      ],
      limitations: [
        "Highly viscous, requires warming to handle in cold processing",
        "Relatively high cost compared to standard surfactants"
      ],
      alternatives: ["Polysorbate 20", "PEG-7 Glyceryl Cocoate", "Caprylyl/Capryl Glucoside"],
      ecoFriendliness: "Highly biodegradable, vegetable castor-oil derived core."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "1.0%",
      premium: "3.0%",
      maximum: "5.0%",
      household: "0.5% - 2.0% in clear liquid hand soap and body washes",
      industrial: "1.0% - 3.0% in fragrance-heavy sprayers"
    },
    performance: {
      cleaning: 4,
      foam: 4,
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>85% OECD 301B)",
      plantBasedPct: 60,
      petroleumBasedPct: 40,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None (Non-hazardous)"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as a precaution.",
      msdsSummary: "Extremely safe cosmetic solubilizing wax. Heat gently to liquefy."
    }
  },
  {
    id: "lauramine-oxide",
    commonName: "Lauramine Oxide",
    chemicalName: "Lauryldimethylamine Oxide",
    iupacName: "dodecyl(dimethyl)amine oxide",
    casNumber: "1643-20-5",
    molecularFormula: "C14H31NO",
    molecularWeight: "229.4 g/mol",
    inciName: "Lauramine Oxide",
    tradeNames: ["Ammonyx LO", "Empigen OB", "Macat AO-12"],
    synonyms: ["LDAO", "Dodecyldimethylamine Oxide", "Lauryl Dimethyl Amine Oxide"],
    category: "Amphoteric Surfactants",
    suppliers: ["Stepan Company", "Huntsman Corporation", "Kao Corporation", "Clariant"],
    marketNames: {
      indian: "Amine Oxide (LO 30%)",
      international: "Lauramine Oxide 30%",
      hindi: "लॉरामाइन ऑक्साइड"
    },
    physicalProperties: {
      appearance: "Clear, thin liquid",
      color: "Water-white to Pale Straw",
      odor: "Faint, characteristic sweet",
      activeMatter: "29% - 31% (rest is water)",
      pH: "6.5 - 8.5 (10% aqueous solution)",
      density: "0.97 g/cm³",
      viscosity: "30 - 100 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "24 Months",
      storageConditions: "Store in original plastic containers. Highly stable in hypochlorite bleach solutions."
    },
    functionalInfo: {
      whatIsIt: "Highly stable amphoteric/nonionic amine oxide surfactant made by oxidizing lauryldimethylamine with hydrogen peroxide.",
      whyUsed: "Used as an exceptional foam stabilizer, viscosity builder, and grease cutter in dishwash liquids and bleach-based institutional disinfectants (bleach stable).",
      advantages: [
        "Complete structural stability in concentrated sodium hypochlorite (bleach)",
        "Generates dense, rich, cream-like foam structures",
        "Strong grease-stripping and cleaning boost",
        "Significantly milder than SLS or LABSA"
      ],
      limitations: [
        "Relatively high cost compared to SLES",
        "Behaves as cationic under highly acidic pH conditions, which can restrict anionic compatibility if pH falls below 3"
      ],
      alternatives: ["Cocamine Oxide", "CAPB", "Coco Glucoside"],
      ecoFriendliness: "Highly biodegradable, minimal toxic residue in wastewater treatment."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 6% in high-tier manual dishwashing liquids",
      industrial: "3% - 10% in foaming bleach sprays and sanitizers"
    },
    performance: {
      cleaning: 8,
      foam: 10,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 8,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% OECD 301D)",
      plantBasedPct: 75,
      petroleumBasedPct: 25,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 2.5 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear eye protection and gloves.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with warm water for 15 minutes. Wash skin.",
      msdsSummary: "Highly stable bleach co-surfactant. Avoid eye splash."
    }
  },
  {
    id: "cocamine-oxide",
    commonName: "Cocamine Oxide",
    chemicalName: "Cocamidopropylamine Oxide",
    iupacName: "cocamidopropylamine oxide",
    casNumber: "68155-09-9",
    molecularFormula: "C19H40N2O2 (average)",
    molecularWeight: "328.5 g/mol",
    inciName: "Cocamidopropylamine Oxide",
    tradeNames: ["Ammonyx CO", "Empigen OS", "Galaxy Amine Oxide"],
    synonyms: ["Coco Amido Propyl Amine Oxide", "Cocamine Oxide Liquid"],
    category: "Amphoteric Surfactants",
    suppliers: ["Stepan Company", "Galaxy Surfactants", "Croda", "Huntsman"],
    marketNames: {
      indian: "Cocamine Amine Oxide (CAO 30%)",
      international: "Cocamine Oxide 30% Active",
      hindi: "कोकामाइन ऑक्साइड"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to Pale Yellow",
      odor: "Faint, sweet amide",
      activeMatter: "29% - 31%",
      pH: "6.0 - 8.0 (as is)",
      density: "0.98 g/cm³",
      viscosity: "40 - 120 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool dry conditions. Highly stable in bleach."
    },
    functionalInfo: {
      whatIsIt: "Amphoteric surfactant made by oxidizing cocamidopropyl dimethylamine with hydrogen peroxide.",
      whyUsed: "Used as a secondary foaming booster, thickener, and mild skin conditioner in shampoos, hand washes, and commercial dishwash.",
      advantages: [
        "Superb foam boosting and stabilization in high fats",
        "Significantly builds viscosity in salt systems",
        "Highly stable in sodium hypochlorite (bleach) formulas",
        "Milder on skin tissues compared to standard oxides"
      ],
      limitations: [
        "Expensive raw material compared to CAPB",
        "Low individual oil-cutting power"
      ],
      alternatives: ["Lauramine Oxide", "CAPB", "Coco Glucoside"],
      ecoFriendliness: "Highly biodegradable, plant-derived lipid chain."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "6.0%",
      maximum: "12.0%",
      household: "2% - 5% in premium manual dishwashing liquids",
      industrial: "2% - 8% in heavy foaming bleach cleansers"
    },
    performance: {
      cleaning: 7,
      foam: 10,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 8,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>94% OECD 301E)",
      plantBasedPct: 80,
      petroleumBasedPct: 20,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 3.1 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear eye protection and gloves.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with clean water. Wash skin.",
      msdsSummary: "Highly stable foam-boosting amine oxide. Low toxic hazard."
    }
  },
  {
    id: "coco-betaine",
    commonName: "Coco Betaine",
    chemicalName: "Cocodimethylbetaine",
    iupacName: "2-[dodecyl(dimethyl)azaniumyl]acetate",
    casNumber: "68424-94-2",
    molecularFormula: "C16H33NO2 (average)",
    molecularWeight: "271.44 g/mol",
    inciName: "Coco-Betaine",
    tradeNames: ["Dehyton AB 30", "Genagen KB", "Empigen BB"],
    synonyms: ["Coco Alkyldimethyl Betaine", "Alkyl Betaine"],
    category: "Amphoteric Surfactants",
    suppliers: ["BASF SE", "Clariant", "Huntsman", "Galaxy Surfactants"],
    marketNames: {
      indian: "Coco Betaine (30% Active)",
      international: "Coco-Betaine 30%",
      hindi: "कोको बीटेन"
    },
    physicalProperties: {
      appearance: "Clear, water-white to straw liquid",
      color: "Pale Yellow to Colorless",
      odor: "Faint, characteristic sweetish",
      activeMatter: "29% - 31% (contains approx 5% sodium chloride)",
      pH: "6.0 - 8.0 (as is)",
      density: "1.03 g/cm³",
      viscosity: "50 - 150 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-2°C",
      shelfLife: "24 Months",
      storageConditions: "Keep in a cool dry place above 5°C to prevent crystallization."
    },
    functionalInfo: {
      whatIsIt: "True alkyl betaine amphoteric surfactant made by reacting alkyl dimethyl amine directly with sodium monochloroacetate (contains no amidoamine linking group).",
      whyUsed: "Used as an extremely mild co-surfactant and foaming booster in baby shampoos, face washes, and ultra-mild eco-detergents. Unlike CAPB, it contains zero risk of trace amidoamine allergies.",
      advantages: [
        "Ultimate skin mildness with zero amidoamine allergen risk",
        "Generates dense, rich, highly stable lather structures",
        "Extremely stable across extremely wide pH levels",
        "Excellent viscosity building synergy with salt"
      ],
      limitations: [
        "Relatively expensive compared to standard CAPB",
        "Lacks primary stain-removal power (must be blended)"
      ],
      alternatives: ["CAPB", "Coco Glucoside", "Sodium Cocoamphoacetate"],
      ecoFriendliness: "Exceptional. Fully biodegradable, highly renewable plant-lipid head."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.5%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 6% in baby dishwash and mild laundry soaps",
      industrial: "2% - 10% in cleanroom electronic and medical detergents"
    },
    performance: {
      cleaning: 5,
      foam: 9,
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% OECD 301D)",
      plantBasedPct: 90,
      petroleumBasedPct: 10,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 2.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes thoroughly with water for 15 minutes. Wash skin.",
      msdsSummary: "Highly skin-compatible, ultra-safe amphoteric surfactant."
    }
  },
  {
    id: "sodium-cocoamphoacetate",
    commonName: "Sodium Cocoamphoacetate",
    chemicalName: "Sodium Cocoamphoacetate",
    iupacName: "sodium 2-[2-(cocoyl-hydroxyethylamino)ethylamino]acetate",
    casNumber: "68334-21-4",
    molecularFormula: "C18H31N2NaO3 (average)",
    molecularWeight: "354.4 g/mol",
    inciName: "Sodium Cocoamphoacetate",
    tradeNames: ["Miranol C2M Conc NP", "Dehyton MC", "Rewoteric AM C"],
    synonyms: ["Cocoamphoacetate Sodium Salt", "Amphoacetate Surfactant"],
    category: "Amphoteric Surfactants",
    suppliers: ["Solvay S.A.", "BASF SE", "Evonik Industries", "Galaxy Surfactants"],
    marketNames: {
      indian: "Cocoamphoacetate (CAA 40%)",
      international: "Sodium Cocoamphoacetate 40%",
      hindi: "सोडियम कोकोएम्फोएसीटेट"
    },
    physicalProperties: {
      appearance: "Slightly viscous yellow liquid",
      color: "Light Amber to Pale Straw",
      odor: "Faint, characteristic sweet amine",
      activeMatter: "38% - 41% (contains salt)",
      pH: "8.0 - 9.5 (10% aqueous solution)",
      density: "1.09 g/cm³",
      viscosity: "100 - 500 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "24 Months",
      storageConditions: "Store above 10°C to avoid cold gel phase separation."
    },
    functionalInfo: {
      whatIsIt: "Ultra-mild zwitterionic (amphoteric) imidazoline-derivative surfactant synthesized from coconut fatty acid, aminoethylethanolamine, and sodium monochloroacetate.",
      whyUsed: "Used as a primary foaming surfactant in premium hypoallergenic baby shampoos, ultra-sensitive skin cleansers, and high-end non-irritating hand washes.",
      advantages: [
        "Incredible safety profile (historically used in tear-free shampoos)",
        "Generates dense, rich, highly conditioning lather",
        "Reduces skin tightness and dryness dramatically",
        "Fully stable across wide pH spectrum"
      ],
      limitations: [
        "Highly expensive raw material",
        "Weak individual degreasing power"
      ],
      alternatives: ["CAPB", "Coco Betaine", "Lauryl Glucoside"],
      ecoFriendliness: "Superb. Ready biodegradability, natural coconut carbon base."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "6.0%",
      premium: "15.0%",
      maximum: "30.0%",
      household: "4% - 10% in premium baby detergents and hand washes",
      industrial: "5% - 15% in high-end cosmetic formulations"
    },
    performance: {
      cleaning: 6,
      foam: 9,
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>97% OECD 301D)",
      plantBasedPct: 80,
      petroleumBasedPct: 20,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 15.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Serious Eye Irritation (Category 2)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Rinse eyes thoroughly with water. Wash skin.",
      msdsSummary: "Highly skin-compatible mild surfactant liquid. Excellent toxicity rating."
    }
  },
  {
    id: "disodium-cocoamphodiacetate",
    commonName: "Disodium Cocoamphodiacetate",
    chemicalName: "Disodium Cocoamphodiacetate",
    iupacName: "disodium cocoamphodiacetate",
    casNumber: "68650-39-5",
    molecularFormula: "C20H32N2Na2O5 (average)",
    molecularWeight: "426.45 g/mol",
    inciName: "Disodium Cocoamphodiacetate",
    tradeNames: ["Miranol C2M Conc NP", "Dehyton DC", "Empigen CDR60"],
    synonyms: ["Cocoamphodiacetate Disodium Salt", "Amphoteric-2"],
    category: "Amphoteric Surfactants",
    suppliers: ["Solvay S.A.", "BASF SE", "Evonik Industries", "Galaxy Surfactants"],
    marketNames: {
      indian: "Cocoamphodiacetate (CAD 40%)",
      international: "Disodium Cocoamphodiacetate 40%",
      hindi: "डाईसोडियम कोकोएम्फोडाईएसीटेट"
    },
    physicalProperties: {
      appearance: "Viscous clear liquid",
      color: "Amber-yellow",
      odor: "Faint, characteristic sweetish",
      activeMatter: "38% - 40% (contains sodium chloride)",
      pH: "8.0 - 9.0 (10% aqueous solution)",
      density: "1.10 g/cm³",
      viscosity: "200 - 800 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "24 Months",
      storageConditions: "Store above 10°C. Protect from freezing and excessive heat."
    },
    functionalInfo: {
      whatIsIt: "Extremely mild imidazoline-derived dicarboxylic zwitterionic surfactant.",
      whyUsed: "Used primarily in pediatric cleansers, premium face washes, and ultra-mild clinical skin cleansers where zero skin/eye irritation and dense conditioning lather are required.",
      advantages: [
        "The absolute standard for tear-free eye products",
        "Outstanding conditioning lather structure",
        "Significantly buffers the harshness of anionic surfactants",
        "Excellent stability over wide pH ranges"
      ],
      limitations: [
        "Extremely expensive specialty surfactant",
        "Weak cleaning power when used alone"
      ],
      alternatives: ["Sodium Cocoamphoacetate", "CAPB", "Coco Betaine"],
      ecoFriendliness: "Superb. Ready biodegradability, eco-safe, coconut oil lipid base."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "15.0%",
      maximum: "35.0%",
      household: "5% - 12% in baby body wash and clinical detergents",
      industrial: "5% - 20% in high-end cosmetic cleaning creams"
    },
    performance: {
      cleaning: 5,
      foam: 9,
      oilRemoval: 5,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>97% OECD 301D)",
      plantBasedPct: 80,
      petroleumBasedPct: 20,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 18.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None (Non-hazardous)"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water if splashed.",
      msdsSummary: "Highly gentle, non-irritating amphoteric surfactant. Extremely safe."
    }
  },
  {
    id: "cetrimonium-chloride",
    commonName: "Cetrimonium Chloride",
    chemicalName: "Cetyltrimethylammonium Chloride",
    iupacName: "hexadecyl(trimethyl)azanium chloride",
    casNumber: "112-02-7",
    molecularFormula: "C19H42ClN",
    molecularWeight: "320.00 g/mol",
    inciName: "Cetrimonium Chloride",
    tradeNames: ["Dehyquart A-CA", "Arquad 16-29", "Genamin CTAC"],
    synonyms: ["CTAC", "Cetyl Trimethyl Ammonium Chloride", "C16 Quat"],
    category: "Cationic Surfactants",
    suppliers: ["BASF SE", "Nouryon", "Clariant", "Croda"],
    marketNames: {
      indian: "CTAC Conditioner Liquid (30% Active)",
      international: "Cetrimonium Chloride 30%",
      hindi: "सिट्रीमोनियम क्लोराइड"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to Pale Straw",
      odor: "Mild alcohol-like, characteristic",
      activeMatter: "28% - 30% (contains isopropyl alcohol/water)",
      pH: "3.0 - 5.0 (as is)",
      density: "0.97 g/cm³",
      viscosity: "10 - 40 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "95°C",
      meltingPoint: "-1°C",
      shelfLife: "24 Months",
      storageConditions: "Store in plastic or glass container. Acidic quat; corrosive to mild steel."
    },
    functionalInfo: {
      whatIsIt: "Cationic quaternary ammonium surfactant (quat) synthesized from cetyl alcohol and methyl chloride.",
      whyUsed: "Used primarily in hair conditioners, fabric softeners, and antistatic laundry rinses. Its positive charge adsorbs onto negatively charged fibers (fabrics/hair), neutralizing static and providing exceptional softness.",
      advantages: [
        "Incredible antistatic and fabric-softening performance",
        "Plates out on fibers, leaving a silky hydrophobic barrier",
        "Aids in detangling and smoothness",
        "Acts as a mild biocide/preservative booster"
      ],
      limitations: [
        "Highly incompatible with anionic surfactants (such as LABSA or SLES). Blending them causes immediate precipitation (complexation) resulting in a thick white insoluble sludge.",
        "Relatively expensive compared to nonionics"
      ],
      alternatives: ["Behentrimonium Chloride", "Stearalkonium Chloride", "Esterquat"],
      ecoFriendliness: "Moderate. Highly toxic to aquatic organisms, but binds tightly to soil/organic matter where it slowly degrades."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "6.0%",
      maximum: "10.0%",
      household: "2% - 5% in liquid fabric softeners (cationic phase)",
      industrial: "3% - 6% in professional hair conditioning creams"
    },
    performance: {
      cleaning: 2,
      foam: 3,
      oilRemoval: 4,
      greaseCutting: 4,
      skinMildness: 6,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Inherently biodegradable, slow aerobic breakdown",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Contains VOC (due to trace IPA)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 0.5 mg/L (highly toxic)",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Goggles", "Chemical Resistant Gloves", "Lab Coat"],
      ghsClassification: ["Skin Corrosion (Category 1C)", "Serious Eye Damage (Category 1)", "Acute Aquatic Hazard (Category 1)"],
      hazardStatements: ["H314: Causes severe skin burns and eye damage", "H318: Causes serious eye damage", "H400: Very toxic to aquatic life"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Flush skin or eyes immediately with massive amounts of clean water for 15 minutes. Seek medical advice.",
      msdsSummary: "Acidic cationic surfactant. Strictly avoid direct contact and do not co-mix with raw anionic surfactants."
    }
  },
  {
    id: "behentrimonium-chloride",
    commonName: "Behentrimonium Chloride",
    chemicalName: "Behenyltrimethylammonium Chloride",
    iupacName: "docosyl(trimethyl)azanium chloride",
    casNumber: "17301-53-0",
    molecularFormula: "C25H54ClN",
    molecularWeight: "404.16 g/mol",
    inciName: "Behentrimonium Chloride",
    tradeNames: ["Genamin KDMP", "Incroquat BTMC-85", "Dehyquart Behenyl"],
    synonyms: ["BTMC", "Behenyl Trimethyl Ammonium Chloride", "C22 Quat"],
    category: "Cationic Surfactants",
    suppliers: ["Clariant", "Croda", "BASF SE", "Evonik Industries"],
    marketNames: {
      indian: "BTMC Conditioner Flakes (85% Active)",
      international: "Behentrimonium Chloride 85% Flakes",
      hindi: "बेहेंट्रीमोनियम क्लोराइड"
    },
    physicalProperties: {
      appearance: "White waxy flakes or needles",
      color: "White to Off-white",
      odor: "Mild alcohol-like, characteristic",
      activeMatter: "83% - 86% (rest is isopropyl alcohol)",
      pH: "6.0 - 8.0 (1% in water/IPA mixture)",
      density: "0.89 g/cm³",
      viscosity: "Solid (at 20°C)",
      solubility: "Insoluble in cold water; soluble in hot water/oils above 75°C",
      boilingPoint: "82°C (IPA release)",
      meltingPoint: "75°C - 80°C",
      shelfLife: "36 Months",
      storageConditions: "Store in a dry cool place away from open flames (contains flammable trace IPA)."
    },
    functionalInfo: {
      whatIsIt: "Highly substantive cationic quaternary ammonium surfactant derived from rapeseed oil (behenyl C2 docosanol fatty chain).",
      whyUsed: "Used as an ultra-premium conditioning agent and fabric softener. Its long C22 carbon chain provides unparalleled lubricity, static neutralization, and a soft, non-greasy feel.",
      advantages: [
        "Outstanding conditioning and detangling power",
        "Significantly superior softness performance compared to Cetrimonium Chloride",
        "Leaves an exceptionally elegant silky feel",
        "Vegetable-derived hydrophobic chain"
      ],
      limitations: [
        "Highly incompatible with anionic surfactants (precipitates instantly)",
        "Requires heating to 75-80°C in the oil/conditioning phase to process"
      ],
      alternatives: ["Cetrimonium Chloride", "Stearalkonium Chloride", "Esterquat"],
      ecoFriendliness: "Inherently biodegradable, high aquatic toxicity, vegetable-sourced."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "8.0%",
      household: "1% - 3% in premium concentrated fabric softeners",
      industrial: "2% - 5% in high-end salon hair treatment creams"
    },
    performance: {
      cleaning: 2,
      foam: 2,
      oilRemoval: 4,
      greaseCutting: 4,
      skinMildness: 8,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Inherently biodegradable under environmental conditions",
      plantBasedPct: 85,
      petroleumBasedPct: 15,
      vocStatus: "Contains VOC (IPA component)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 0.3 mg/L (highly toxic)",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat", "Respirator (if handling hot vapors)"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H315: Causes skin irritation", "H318: Causes serious eye damage", "H228: Flammable solid"],
      precautionaryStatements: [
        "P210: Keep away from heat, hot surfaces, sparks, open flames. No smoking.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Rinse eyes immediately with water for 15 minutes. Wash skin thoroughly.",
      msdsSummary: "Flammable waxy solid due to isopropyl alcohol content. Handle far from ignition sources."
    }
  },
  {
    id: "benzalkonium-chloride",
    commonName: "Benzalkonium Chloride (BKC)",
    chemicalName: "Alkyldimethylbenzylammonium Chloride",
    iupacName: "benzyl-decyl-dimethylazanium chloride",
    casNumber: "8001-54-5",
    molecularFormula: "C21H38ClN (average)",
    molecularWeight: "340.0 g/mol",
    inciName: "Benzalkonium Chloride",
    tradeNames: ["BKC 50%", "BKC 80%", "Barquat MB-50", "Gardiquat"],
    synonyms: ["BAC", "Alkyl Dimethyl Benzyl Ammonium Chloride", "Quaternary Ammonium Compounds"],
    category: "Cationic Surfactants",
    suppliers: ["Lonza Group", "Stepan Company", "Kao Corporation", "Galaxy Surfactants"],
    marketNames: {
      indian: "BKC Disinfectant (50% Liquid)",
      international: "Benzalkonium Chloride 50% / 80%",
      hindi: "बेंज़ालकोनियम क्लोराइड (बीकेसी)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to Pale Straw",
      odor: "Faint aromatic, almond-like",
      activeMatter: "49% - 51%",
      pH: "6.5 - 8.5 (10% aqueous solution)",
      density: "0.98 g/cm³",
      viscosity: "50 - 150 cPs",
      solubility: "Completely soluble in water, alcohol, and polar solvents",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "36 Months",
      storageConditions: "Store in cool dry conditions. Keep protected from light. Cationic quat; corrosive to mild steel."
    },
    functionalInfo: {
      whatIsIt: "High-potency quaternary ammonium cationic surfactant and biocide synthesized by reacting alkyl dimethylamine with benzyl chloride.",
      whyUsed: "Used primarily as the active germicidal biocide in floor cleaners, sanitizers, surface disinfectants, laundry sanitizers, and hand sanitizers. Highly effective against bacteria, algae, and enveloped viruses.",
      advantages: [
        "Broad-spectrum antimicrobial, bactericidal, and virucidal efficacy",
        "Extremely stable in storage and across wide pH levels",
        "Combines light cleaning with high sanitization",
        "Very low odor threshold compared to chlorine bleach"
      ],
      limitations: [
        "Completely incompatible with anionic surfactants (precipitates into inactive sticky sludge)",
        "Can cause skin irritation if left on skin in high concentrations (>0.1%)",
        "Requires nonionic surfactants (like AE-7 or NP-9) for cleaning synergy"
      ],
      alternatives: ["Didecyldimethylammonium Chloride (DDAC)", "Sodium Hypochlorite", "Chlorhexidine Gluconate"],
      ecoFriendliness: "Slow biodegradation, highly toxic to aquatic environments."
    },
    dosage: {
      minimum: "0.5% (as stabilizer/booster)",
      recommended: "2.5% (typical floor disinfectant active dosage)",
      premium: "4.0%",
      maximum: "10.0% (concentrate)",
      household: "1.0% - 3.0% in home floor disinfectant liquids",
      industrial: "2.0% - 5.0% in hospital grade sanitizer concentrates"
    },
    performance: {
      cleaning: 5,
      foam: 6,
      oilRemoval: 5,
      greaseCutting: 5,
      skinMildness: 4,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Inherently biodegradable, slow biological breakdown",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 0.28 mg/L (highly toxic)",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Goggles", "Chemical Resistant Gloves", "Lab Coat", "Face Shield (handling bulk concentrate)"],
      ghsClassification: ["Acute Toxicity (Category 3 - Oral)", "Skin Corrosion (Category 1B)", "Serious Eye Damage (Category 1)", "Acute Aquatic Hazard (Category 1)"],
      hazardStatements: ["H301: Toxic if swallowed", "H314: Causes severe skin burns and eye damage", "H400: Very toxic to aquatic life"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear protective gloves/clothing/eye protection.",
        "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER."
      ],
      firstAid: "Extremely urgent. Wash skin or eyes immediately with running water for 15 minutes. Call poison control.",
      msdsSummary: "Highly toxic disinfectant concentrate. Handle with strict chemical precautions and never co-mix with soaps."
    }
  },
  {
    id: "ddac",
    commonName: "Didecyldimethylammonium Chloride (DDAC)",
    chemicalName: "Didecyldimethylammonium Chloride",
    iupacName: "didecyl(dimethyl)azanium chloride",
    casNumber: "7173-51-5",
    molecularFormula: "C22H48ClN",
    molecularWeight: "362.08 g/mol",
    inciName: "Didecyldimonium Chloride",
    tradeNames: ["Bardac 2250", "Bardac 2280", "Quaternium-12"],
    synonyms: ["DDAC", "Didecyl Dimethyl Ammonium Chloride", "Dialkyl Quat"],
    category: "Cationic Surfactants",
    suppliers: ["Lonza Group", "Stepan Company", "Evonik Industries", "Mason Chemical"],
    marketNames: {
      indian: "DDAC Antiviral Liquid (50% Active)",
      international: "DDAC 50% / 80% Active",
      hindi: "डाईडेसिलडाईमिथाइलअमोनियम क्लोराइड"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white to Light Yellow",
      odor: "Faint alcohol-like, typical",
      activeMatter: "49% - 51% (contains water/IPA)",
      pH: "6.0 - 8.0 (10% aqueous solution)",
      density: "0.95 g/cm³",
      viscosity: "40 - 100 cPs",
      solubility: "Completely soluble in water and alcohols",
      boilingPoint: "98°C",
      meltingPoint: "-1°C",
      shelfLife: "36 Months",
      storageConditions: "Store in dry cool conditions. Highly stable. Corrosive to mild metals."
    },
    functionalInfo: {
      whatIsIt: "Premium dialkyl-substituted quaternary ammonium surfactant and heavy-duty disinfectant synthesized from didecylmethylamine and methyl chloride.",
      whyUsed: "Used as an advanced, high-performance sanitizer and disinfectant in institutional floor cleaners, food processing plants, hospital disinfection sprays, and timber preservation treatments. Provides superior hard-water performance compared to BKC.",
      advantages: [
        "Incredible germicidal efficacy against highly resistant bacterial strains and viruses",
        "Retains antimicrobial activity even in extremely hard water and heavy dirt load",
        "Provides excellent wet-out and light cationic cleaning",
        "Very low corrosion rates on hard surfaces"
      ],
      limitations: [
        "Highly incompatible with anionic soaps (neutralizes antimicrobial efficacy completely)",
        "Relatively expensive specialty biocide quat"
      ],
      alternatives: ["Benzalkonium Chloride (BKC)", "Sodium Hypochlorite", "Glutaraldehyde"],
      ecoFriendliness: "Slow environmental degradation, highly toxic to marine environments."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0% (typical institutional disinfectant dosage)",
      premium: "3.5%",
      maximum: "8.0%",
      household: "0.5% - 1.5% in antiviral surface spray sanitizers",
      industrial: "2.0% - 5.0% in heavy hospital and farm sanitizing washes"
    },
    performance: {
      cleaning: 5,
      foam: 5,
      oilRemoval: 5,
      greaseCutting: 5,
      skinMildness: 5,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Inherently biodegradable, slow biological degradation",
      plantBasedPct: 50,
      petroleumBasedPct: 50,
      vocStatus: "Contains VOC (IPA component)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 0.19 mg/L (extremely toxic)",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Goggles", "Chemical Resistant Gloves (Nitrile)", "Lab Coat", "Face Shield"],
      ghsClassification: ["Acute Toxicity (Category 3 - Oral)", "Skin Corrosion (Category 1B)", "Serious Eye Damage (Category 1)", "Acute Aquatic Hazard (Category 1)"],
      hazardStatements: ["H301: Toxic if swallowed", "H314: Causes severe skin burns and eye damage", "H400: Very toxic to aquatic life"],
      precautionaryStatements: [
        "P273: Avoid release to the environment.",
        "P280: Wear protective gloves and eye protection.",
        "P301+P310: IF SWALLOWED: Call a doctor immediately."
      ],
      firstAid: "Extremely urgent. Flush skin/eyes immediately with water for 15 minutes. Consult medical professional.",
      msdsSummary: "Highly toxic quat concentrate. Do not discharge waste directly into lakes or rivers."
    }
  },
  {
    id: "ae-12",
    commonName: "Alcohol Ethoxylate AE-12",
    chemicalName: "Polyoxyethylene (12) Lauryl Ether",
    iupacName: "3,6,9,12,15,18,21,24,27,30,33,36-dodecaoxaoctatetryacontan-1-ol",
    casNumber: "9002-92-0",
    molecularFormula: "C36H74O13",
    molecularWeight: "714.96 g/mol",
    inciName: "Laureth-12",
    tradeNames: ["Genapol LA 120", "Brij L12", "Empilan KM 12"],
    synonyms: ["Laureth-12", "PEG-12 Lauryl Ether", "AE-12", "Alcohol Ethoxylate (12 Mole)"],
    category: "Nonionic Surfactants",
    suppliers: ["Clariant", "Kao Corporation", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Alcohol Ethoxylate 12 Mole",
      international: "Laureth-12"
    },
    physicalProperties: {
      appearance: "Waxy solid or paste",
      color: "White",
      odor: "Faint, characteristic sweet odor",
      activeMatter: "99% Min (standard industrial active range)",
      pH: "Typical Range: 5.5 - 7.0 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.01 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: 50 - 100 cPs (at 45°C) (Typical Range — Varies by Supplier/Grade)",
      solubility: "Soluble in water, forming clear viscous solutions",
      shelfLife: "24 Months",
      storageConditions: "Store in a dry cool place. Keep container sealed."
    },
    functionalInfo: {
      whatIsIt: "High molecular weight nonionic surfactant synthesized by ethoxylating lauryl alcohol with 12 moles of ethylene oxide.",
      whyUsed: "Used as an emulsifier, wetting agent, and solubilizer in high-performance household and industrial liquid detergents, laundry powders, and glass cleaners. Highly hydrophilic compared to AE-7.",
      advantages: [
        "Outstanding grease solubilization and dispersion",
        "High water solubility and chemical stability",
        "Excellent compatibility with cationic and anionic systems",
        "Provides robust foam stabilization"
      ],
      limitations: [
        "Solid or paste form requires melting/heating in processing",
        "High foaming (requires defoamer in mechanical washing)"
      ],
      alternatives: ["Alcohol Ethoxylate AE-9", "Nonyl Phenol Ethoxylate NP-10"],
      ecoFriendliness: "Highly biodegradable under aerobic and anaerobic conditions."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0%",
      premium: "10.0%",
      maximum: "15.0%",
      household: "2% - 8%",
      industrial: "4% - 12%"
    },
    performance: {
      cleaning: 8,
      foam: 6,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 7,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301D)",
      plantBasedPct: 60,
      petroleumBasedPct: 40,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "EC50 (Daphnia) ~ 2.5 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Gloves"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Eye Irritation (Category 2A)"],
      hazardStatements: ["H302: Harmful if swallowed", "H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection/face protection."
      ],
      firstAid: "Rinse eyes immediately with water. Wash skin.",
      msdsSummary: "Highly safe and biodegradable ethoxylated nonionic surfactant."
    },
    chargeType: "Nonionic",
    hlb: "14.5",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Clariant", "Kao Corporation"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "polysorbate-20",
    commonName: "Polysorbate 20",
    chemicalName: "Polyoxyethylene (20) Sorbitan Monolaurate",
    iupacName: "2-[2-[3,4-bis(2-hydroxyethoxy)oxolan-2-yl]-2-(2-hydroxyethoxy)ethoxy]ethyl dodecanoate",
    casNumber: "9005-64-5",
    molecularFormula: "C58H114O26",
    molecularWeight: "1227.54 g/mol",
    inciName: "Polysorbate 20",
    tradeNames: ["Tween 20", "Sorbax PML-20", "Eumulgin SML 20"],
    synonyms: ["Tween 20", "PEG-20 Sorbitan Monolaurate", "Sorbitan Monolaurate Ethoxylated"],
    category: "Nonionic Surfactants",
    suppliers: ["Croda", "BASF SE", "Kao Corporation", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Polysorbate 20 (Tween 20)",
      international: "Tween 20 Liquid"
    },
    physicalProperties: {
      appearance: "Viscous liquid",
      color: "Pale Yellow to Amber",
      odor: "Faint, characteristic odor",
      activeMatter: "99% Min (standard active range)",
      pH: "Typical Range: 5.5 - 7.5 (10% aqueous solution) (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.10 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: 300 - 500 cPs (Typical Range — Varies by Supplier/Grade)",
      solubility: "Soluble in water, alcohol, insoluble in mineral oils",
      shelfLife: "36 Months",
      storageConditions: "Store in cool dry conditions. Highly stable."
    },
    functionalInfo: {
      whatIsIt: "Highly hydrophilic nonionic surfactant composed of sorbitol ethoxylated with 20 moles of ethylene oxide, esterified with lauric acid.",
      whyUsed: "Used primarily as an emulsifier, essential oil solubilizer, and mild co-surfactant in premium cosmetic hand washes, baby shampoos, and clear liquid household sprays.",
      advantages: [
        "Incredibly mild, non-irritating to skin and eyes",
        "Superior solubilizer for delicate fragrances and essential oils",
        "Fully bio-based fatty acid tail",
        "Excellent synergy with anionic surfactants"
      ],
      limitations: [
        "High cost compared to standard ethoxylates",
        "Low detergent power on heavy industrial greases"
      ],
      alternatives: ["PEG-40 Hydrogenated Castor Oil", "Decyl Glucoside"],
      ecoFriendliness: "Highly biodegradable, low environmental toxicity."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1% - 4%",
      industrial: "1% - 5%"
    },
    performance: {
      cleaning: 5,
      foam: 5,
      oilRemoval: 6,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301D)",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L (very low toxicity)",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses"],
      ghsClassification: ["Not Classified as Hazardous under GHS"],
      hazardStatements: [],
      precautionaryStatements: [],
      firstAid: "Rinse with water.",
      msdsSummary: "Extremely safe cosmetic-grade nonionic surfactant."
    },
    chargeType: "Nonionic",
    hlb: "16.7",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Croda", "BASF SE"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "polysorbate-80",
    commonName: "Polysorbate 80",
    chemicalName: "Polyoxyethylene (20) Sorbitan Monooleate",
    iupacName: "2-[2-[3,5-bis(2-hydroxyethoxy)oxolan-2-yl]-2-(2-hydroxyethoxy)ethoxy]ethyl (E)-octadec-9-enoate",
    casNumber: "9005-65-6",
    molecularFormula: "C64H124O26",
    molecularWeight: "1310.0 g/mol",
    inciName: "Polysorbate 80",
    tradeNames: ["Tween 80", "Eumulgin SMO 20", "Sorbax PMO-20"],
    synonyms: ["Tween 80", "PEG-20 Sorbitan Monooleate", "Sorbitan Monooleate Ethoxylated"],
    category: "Nonionic Surfactants",
    suppliers: ["Croda", "BASF SE", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Polysorbate 80 (Tween 80)",
      international: "Tween 80 Liquid"
    },
    physicalProperties: {
      appearance: "Viscous amber liquid",
      color: "Amber",
      odor: "Characteristic faint fatty odor",
      activeMatter: "99% Min",
      pH: "Typical Range: 5.0 - 7.5 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.07 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: 350 - 550 cPs (Typical Range — Varies by Supplier/Grade)",
      solubility: "Soluble in water and alcohol, insoluble in mineral oils",
      shelfLife: "36 Months",
      storageConditions: "Store in a cool dry place. Avoid direct sunlight."
    },
    functionalInfo: {
      whatIsIt: "Hydrophilic nonionic surfactant and emulsifier produced by ethoxylating sorbitan esterified with oleic acid.",
      whyUsed: "Used as an outstanding emulsifier for heavier vegetable/mineral oils, fragrance stabilizer, and mildness booster in car shampoos, hand cleaners, and high-performance degreasers.",
      advantages: [
        "Highly efficient at emulsifying oils, waxes, and silicones",
        "Exceptionally gentle on skin and mucous membranes",
        "Promotes stable oil-in-water emulsions",
        "Highly stable in hard water"
      ],
      limitations: [
        "Relatively expensive compared to linear alcohol ethoxylates",
        "Moderate foam builder"
      ],
      alternatives: ["Polysorbate 20", "PEG-40 Hydrogenated Castor Oil"],
      ecoFriendliness: "Highly biodegradable, very low environmental hazard."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.5%",
      premium: "6.0%",
      maximum: "12.0%",
      household: "1% - 5%",
      industrial: "2% - 8%"
    },
    performance: {
      cleaning: 6,
      foam: 4,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301D)",
      plantBasedPct: 75,
      petroleumBasedPct: 25,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses"],
      ghsClassification: ["Not Classified as Hazardous under GHS"],
      hazardStatements: [],
      precautionaryStatements: [],
      firstAid: "Rinse skin or eyes with water.",
      msdsSummary: "Highly safe and biodegradable cosmetic nonionic surfactant."
    },
    chargeType: "Nonionic",
    hlb: "15.0",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Croda", "BASF SE"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "span-60",
    commonName: "Sorbitan Monostearate (Span 60)",
    chemicalName: "Sorbitan Monostearate",
    iupacName: "[(2R)-2-[(3S,4R)-3,4-dihydroxyoxolan-2-yl]-2-hydroxyethyl] octadecanoate",
    casNumber: "1338-41-6",
    molecularFormula: "C24H46O6",
    molecularWeight: "430.62 g/mol",
    inciName: "Sorbitan Stearate",
    tradeNames: ["Span 60", "Emsorb 2505", "Glycomul S"],
    synonyms: ["Span 60", "Sorbitan Stearate", "Sorbitan Monooctadecanoate"],
    category: "Nonionic Surfactants",
    suppliers: ["Croda", "Lonza", "Clariant", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Sorbitan Monostearate (Span 60)",
      international: "Span 60 Powder"
    },
    physicalProperties: {
      appearance: "Waxy solid powder or flakes",
      color: "Light Cream to Yellowish",
      odor: "Faint, characteristic fatty odor",
      activeMatter: "99% Min",
      pH: "Typical Range: 5.0 - 7.0 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.0 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "N/A (Solid)",
      solubility: "Insoluble in cold water, soluble in warm oils/ethanol",
      shelfLife: "36 Months",
      storageConditions: "Store in dry cool conditions below 30°C."
    },
    functionalInfo: {
      whatIsIt: "Hydrophobic (lipophilic) nonionic surfactant and emulsifier produced by esterifying sorbitol with stearic acid.",
      whyUsed: "Used as a powerful co-emulsifier to stabilize water-in-oil emulsions, creams, and solid wax blocks in vehicle polishes, laundry fabric softeners, and industrial leather cleaners.",
      advantages: [
        "100% plant-derived fatty acid tail",
        "Highly efficient at stabilizing low-HLB formulations",
        "Provides rich velvety texture and viscosity to creams",
        "Highly skin-compatible"
      ],
      limitations: [
        "Not soluble in water on its own (requires co-surfactants to disperse)",
        "Zero foaming power"
      ],
      alternatives: ["Glyceryl Monostearate", "Sorbitan Oleate"],
      ecoFriendliness: "Completely biodegradable, non-toxic to aquatic life."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "8.0%",
      household: "1% - 3% in wax polishes",
      industrial: "2% - 5% in softeners and textile oils"
    },
    performance: {
      cleaning: 3,
      foam: 1,
      oilRemoval: 5,
      greaseCutting: 4,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% in 28 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "Very low toxicity",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses"],
      ghsClassification: ["Not Classified as Hazardous"],
      hazardStatements: [],
      precautionaryStatements: [],
      firstAid: "Wash skin/eyes with water.",
      msdsSummary: "Safe, non-toxic cosmetic food-grade emulsifier solid."
    },
    chargeType: "Nonionic",
    hlb: "4.7",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Croda", "Lonza"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "span-80",
    commonName: "Sorbitan Oleate (Span 80)",
    chemicalName: "Sorbitan Monooleate",
    iupacName: "[(2R)-2-[(3S,4R)-3,4-dihydroxyoxolan-2-yl]-2-hydroxyethyl] (E)-octadec-9-enoate",
    casNumber: "1338-43-8",
    molecularFormula: "C24H44O6",
    molecularWeight: "428.6 g/mol",
    inciName: "Sorbitan Oleate",
    tradeNames: ["Span 80", "Emsorb 2500", "Glycomul O"],
    synonyms: ["Span 80", "Sorbitan Monooleate", "Sorbitan Mono-9-octadecenoate"],
    category: "Nonionic Surfactants",
    suppliers: ["Croda", "Lonza", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Sorbitan Monooleate (Span 80)",
      international: "Span 80 Liquid"
    },
    physicalProperties: {
      appearance: "Viscous amber liquid",
      color: "Amber",
      odor: "Faint, characteristic fatty odor",
      activeMatter: "99% Min",
      pH: "Typical Range: 5.5 - 7.5 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 0.99 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: 800 - 1200 cPs (Typical Range — Varies by Supplier/Grade)",
      solubility: "Insoluble in water, soluble in organic solvents and oils",
      shelfLife: "36 Months",
      storageConditions: "Store in cool dry conditions. Highly stable."
    },
    functionalInfo: {
      whatIsIt: "Lipophilic (hydrophobic) nonionic surfactant ester of sorbitan and natural oleic acid.",
      whyUsed: "Used as a primary water-in-oil emulsifier and dispersing agent in agricultural sprays, metalworking fluids, degreasers, and automotive cream polishes.",
      advantages: [
        "Excellent at dispersing pigments and insoluble powders in oils",
        "Natural plant-derived fatty acid tail",
        "Extremely stable in acidic and alkaline emulsions",
        "Very skin friendly"
      ],
      limitations: [
        "Insoluble in water",
        "No foaming capability"
      ],
      alternatives: ["Sorbitan Monostearate", "Glyceryl Monooleate"],
      ecoFriendliness: "Highly biodegradable, non-toxic."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "4.0%",
      maximum: "8.0%",
      household: "1% - 3%",
      industrial: "2% - 5%"
    },
    performance: {
      cleaning: 4,
      foam: 1,
      oilRemoval: 6,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301D)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "Very low toxicity",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses"],
      ghsClassification: ["Not Classified as Hazardous under GHS"],
      hazardStatements: [],
      precautionaryStatements: [],
      firstAid: "Rinse eyes/skin with water.",
      msdsSummary: "Highly safe and biodegradable lipophilic nonionic liquid."
    },
    chargeType: "Nonionic",
    hlb: "4.3",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Croda", "Lonza"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "sucrose-cocoate",
    commonName: "Sucrose Cocoate",
    chemicalName: "Sucrose Cocoate",
    iupacName: "sucrose cocoate",
    casNumber: "91081-38-8",
    molecularFormula: "C24H44O12 (average)",
    molecularWeight: "524.6 g/mol (average)",
    inciName: "Sucrose Cocoate",
    tradeNames: ["Tego Soft LSE 65 K", "Sucrodet CO-15", "Esterlac Cocoate"],
    synonyms: ["Sucrose Coconut Fatty Acid Esters", "Saccharose Monococoate"],
    category: "Nonionic Surfactants",
    suppliers: ["Evonik Industries", "Croda", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Sucrose Cocoate Liquid",
      international: "Tego Soft LSE 65 K"
    },
    physicalProperties: {
      appearance: "Viscous, paste-like liquid",
      color: "Pale Yellow to Amber",
      odor: "Mild, characteristic sweet odor",
      activeMatter: "63% - 67% (rest is water)",
      pH: "Typical Range: 6.5 - 7.5 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.15 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: 5000 - 15000 cPs (Typical Range — Varies by Supplier/Grade)",
      solubility: "Completely soluble in water",
      shelfLife: "24 Months",
      storageConditions: "Store in closed containers above 10°C to avoid solidification. Mix well before use."
    },
    functionalInfo: {
      whatIsIt: "100% natural, eco-friendly nonionic surfactant ester synthesized from sucrose (sugar beet/cane) and coconut oil fatty acids.",
      whyUsed: "Used as an exceptionally mild foaming surfactant, lipid refatter, and skin conditioner in baby washes, organic facial cleansers, and eco-friendly household dishwash liquids.",
      advantages: [
        "100% bio-based, ultra-sustainable",
        "Provides excellent skin refatting and soft feel",
        "Significantly reduces skin irritation of anionic surfactants",
        "Completely PEG-free and sulfate-free"
      ],
      limitations: [
        "Extremely high viscosity paste is difficult to handle cold",
        "High cost relative to synthetic nonionics"
      ],
      alternatives: ["Coco Glucoside", "Lauryl Glucoside"],
      ecoFriendliness: "Superb. Completely and rapidly biodegradable, non-toxic to aquatic life."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1% - 4%",
      industrial: "1% - 5%"
    },
    performance: {
      cleaning: 6,
      foam: 6,
      oilRemoval: 6,
      greaseCutting: 6,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (100% in 28 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "EC50 (Daphnia) > 100 mg/L (virtually non-toxic)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses"],
      ghsClassification: ["Not Classified as Hazardous"],
      hazardStatements: [],
      precautionaryStatements: [],
      firstAid: "Rinse with water.",
      msdsSummary: "Highly safe and edible grade natural sugar surfactant."
    },
    chargeType: "Nonionic",
    hlb: "15.0",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Evonik Industries", "Croda"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "sucrose-stearate",
    commonName: "Sucrose Stearate",
    chemicalName: "Sucrose Monostearate",
    iupacName: "[(2R,3R,4S,5S,6R)-2-[(2S,3S,4S,5R)-3,4-dihydroxy-2,5-bis(hydroxymethyl)oxolan-2-yl]oxy-3,5-dihydroxy-6-(hydroxymethyl)oxan-4-yl] octadecanoate",
    casNumber: "25168-73-4",
    molecularFormula: "C30H56O12",
    molecularWeight: "608.76 g/mol",
    inciName: "Sucrose Stearate",
    tradeNames: ["Sisterna SP70", "Ryoto Sugar Ester S-1570", "Crodesta F160"],
    synonyms: ["Sucrose Monostearate", "Sucrose Esters of Fatty Acids", "Saccharose Monostearate"],
    category: "Nonionic Surfactants",
    suppliers: ["Croda", "Sisterna", "Mitsubishi Chemical", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Sucrose Stearate Pure",
      international: "Sucrose Stearate SP70"
    },
    physicalProperties: {
      appearance: "Fine powder or granules",
      color: "White to off-white",
      odor: "Odorless or very faint fat aroma",
      activeMatter: "95% Min",
      pH: "Typical Range: 6.0 - 8.0 (1% in water) (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.12 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "N/A (Solid)",
      solubility: "Dispersible in cold water, soluble in hot water and oils",
      shelfLife: "24 Months",
      storageConditions: "Store in a dry cool place. Keep container tightly sealed."
    },
    functionalInfo: {
      whatIsIt: "High molecular weight sugar-based nonionic emulsifier and surfactant synthesized from cane sugar and natural stearic acid.",
      whyUsed: "Used as a mild co-emulsifier, thickening stabilizer, and skin refatting agent in eco-friendly household detergents, premium fabric softeners, and baby cosmetic wipes.",
      advantages: [
        "100% bio-based, completely food-grade safety profile",
        "Superb mildness, eliminates skin redness",
        "Excellent emulsifier stability across different temperatures",
        "Creates highly luxurious texture"
      ],
      limitations: [
        "Solid powder is slow to dissolve without hot water (50-60°C)",
        "Premium ingredient with a high cost"
      ],
      alternatives: ["Sorbitan Monostearate", "Glyceryl Stearate"],
      ecoFriendliness: "Superb. Rapidly biodegradable, zero aquatic hazard."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.5%",
      premium: "6.0%",
      maximum: "10.0%",
      household: "1% - 4%",
      industrial: "2% - 6%"
    },
    performance: {
      cleaning: 5,
      foam: 3,
      oilRemoval: 6,
      greaseCutting: 5,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>98% in 28 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "Zero aquatic hazard",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses"],
      ghsClassification: ["Not Classified as Hazardous under GHS"],
      hazardStatements: [],
      precautionaryStatements: [],
      firstAid: "Rinse with water.",
      msdsSummary: "Highly safe edible sugar ester emulsifier."
    },
    chargeType: "Nonionic",
    hlb: "15.0",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Sisterna", "Mitsubishi Chemical"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  }
];

