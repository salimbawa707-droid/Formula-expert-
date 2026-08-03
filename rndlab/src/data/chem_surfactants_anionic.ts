import { Chemical } from "../types";

export const ANIONIC_SURFACTANTS: Chemical[] = [
  {
    id: "labsa",
    commonName: "LABSA 90%",
    chemicalName: "Linear Alkyl Benzene Sulfonic Acid",
    iupacName: "4-(tridecan-3-yl)benzene-1-sulfonic acid",
    casNumber: "27176-87-0",
    molecularFormula: "C18H30O3S",
    molecularWeight: "326.49 g/mol",
    inciName: "Linear Alkylbenzene Sulfonic Acid",
    tradeNames: ["Acid Slurry", "LABSA", "Sulfonic Acid", "Linear Alkylbenzene Sulfonate"],
    synonyms: ["Dodecylbenzene Sulfonic Acid", "Laurylbenzene Sulfonic Acid"],
    category: "Anionic Surfactants",
    suppliers: ["Reliance Industries Ltd.", "Nirma Chemical Division", "Kao Corporation", "Stepan Company"],
    marketNames: {
      indian: "Acid Slurry (Kala Mal)",
      international: "LABSA 96%",
      hindi: "एसिड स्लरी (तेजाब)"
    },
    physicalProperties: {
      appearance: "Viscous Liquid",
      color: "Dark Brown / Amber",
      odor: "Pungent, characteristic",
      activeMatter: "90% Min (often 96% in premium commercial grades)",
      pH: "1.5 - 2.0 (1% aqueous solution)",
      density: "1.06 g/cm³",
      viscosity: "1500 - 2000 cPs",
      solubility: "Highly soluble in water, forms paste/gel at higher concentrations",
      boilingPoint: "315°C",
      meltingPoint: "10°C",
      shelfLife: "24 Months (keeps best in coated steel or HDPE containers)",
      storageConditions: "Store in dry, cool, well-ventilated areas. Exothermic reaction with alkalis."
    },
    functionalInfo: {
      whatIsIt: "Anionic surfactant synthesized by sulfonation of linear alkylbenzene (LAB) with sulfur trioxide or oleum.",
      whyUsed: "The absolute primary cleansing agent and foaming surfactant in commercial and industrial detergents due to its low cost, superb soil suspension, and compatibility with other surfactants after neutralization.",
      advantages: [
        "Highly cost-effective",
        "Excellent degreasing and stain removal",
        "Stable under acidic and alkaline conditions (after neutralization)",
        "Fully biodegradable under aerobic conditions"
      ],
      limitations: [
        "Extremely acidic and highly corrosive in its raw form",
        "Requires neutralization with alkalis (NaOH, KOH, or TEA) before product formulation",
        "Irritating to skin if not completely neutralized"
      ],
      alternatives: ["AOS (Alpha Olefin Sulfonate)", "Sodium Lauryl Sulfate (SLS)", "Methyl Ester Sulfonates (MES)"],
      ecoFriendliness: "High biodegradability (>90% OECD 301D). Moderate aquatic toxicity in unneutralized form, but very safe once neutralized and diluted."
    },
    dosage: {
      minimum: "3.0%",
      recommended: "8.0%",
      premium: "15.0%",
      maximum: "25.0%",
      household: "5% - 12% in dishwash and laundry liquids",
      industrial: "10% - 25% in heavy duty industrial degreasers"
    },
    performance: {
      cleaning: 9,
      foam: 8,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 3,
      hardWater: 5
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>90% in 28 days)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Low VOC (<1%)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "EC50 (Algae) ~ 9.0 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Goggles", "Chemical Resistant Gloves (Nitrile)", "Face Shield", "Acid-proof Apron"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Skin Corrosion (Category 1C)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H314: Causes severe skin burns and eye damage", "H302: Harmful if swallowed", "H412: Harmful to aquatic life with long-lasting effects"],
      precautionaryStatements: [
        "P260: Do not breathe dust/fume/gas/mist/vapors/spray.",
        "P280: Wear protective gloves/clothing/eye protection/face protection.",
        "P301+P330+P331: IF SWALLOWED: Rinse mouth. Do NOT induce vomiting."
      ],
      firstAid: "In case of skin contact, immediately flush skin with plenty of water for at least 15 minutes while removing contaminated clothing. For eye contact, flush eyes immediately with water for 15 minutes and seek urgent medical attention.",
      msdsSummary: "Highly acidic surfactant. Avoid direct contact. Always add LABSA to water during formulation, never water to acid, to prevent dangerous splashing."
    }
  },
  {
    id: "sles",
    commonName: "SLES (Sodium Lauryl Ether Sulfate) 70%",
    chemicalName: "Sodium Laureth Sulfate",
    iupacName: "sodium;2-(2-dodecyloxyethoxy)ethyl sulfate",
    casNumber: "9004-82-4",
    molecularFormula: "C14H29NaO5S",
    molecularWeight: "328.38 g/mol",
    inciName: "Sodium Laureth Sulfate",
    tradeNames: ["SLES 70%", "SLES Paste", "Texapon N70", "Empicol ESB 70"],
    synonyms: ["Sodium Lauryl Ether Sulfate", "Sodium Polyoxyethylene Lauryl Ether Sulfate"],
    category: "Anionic Surfactants",
    suppliers: ["BASF SE", "Galaxy Surfactants Ltd.", "Godrej Industries", "Stepan Company"],
    marketNames: {
      indian: "SLES Paste (70% Mal)",
      international: "SLES 2EO 70%",
      hindi: "एसएलईएस पेस्ट"
    },
    physicalProperties: {
      appearance: "Thick, gelatinous paste",
      color: "White to Pale Yellow, translucent",
      odor: "Mild, sweetish, typical",
      activeMatter: "68% - 72%",
      pH: "7.0 - 9.0 (10% aqueous solution)",
      density: "1.05 g/cm³",
      viscosity: "Very high (requires dilution/heating to pump)",
      solubility: "Highly soluble in water when heated/diluted",
      boilingPoint: "> 100°C",
      meltingPoint: "15°C",
      shelfLife: "24 Months",
      storageConditions: "Keep container tightly closed in a cool, well-ventilated space. Avoid freezing."
    },
    functionalInfo: {
      whatIsIt: "Ethoxylated anionic surfactant. Synthesized by ethoxylation of dodecyl alcohol, followed by sulfonation and neutralization with sodium hydroxide.",
      whyUsed: "Excellent foaming agent, viscosity booster, and primary co-surfactant. It is much milder to skin than Sodium Lauryl Sulfate (SLS) due to the ether group, making it standard for hand wash, dishwash, shampoo, and liquid laundry.",
      advantages: [
        "Outstanding foam density and stability",
        "Highly responsive to thickening with common salt (NaCl)",
        "Excellent emulsification of grease",
        "Significantly milder than SLS"
      ],
      limitations: [
        "Highly concentrated paste is difficult to dissolve without proper industrial dilution equipment",
        "Contains trace amounts of 1,4-dioxane (carcinogen side-product), requiring strict manufacturing controls",
        "Poor stability in very strong acidic environments (hydrolyzes)"
      ],
      alternatives: ["Sodium Lauryl Sulfate (SLS)", "APG (Alkyl Polyglucoside)", "Sodium Lauroyl Methyl Isethionate (SLMI)"],
      ecoFriendliness: "Highly biodegradable (OECD 301B). Moderate aquatic toxicity. Modern processing reduces 1,4-Dioxane limits to < 10 ppm."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "6.0%",
      premium: "12.0%",
      maximum: "20.0%",
      household: "4% - 10% in liquid hand soaps and household dishwashing liquids",
      industrial: "5% - 15% in car wash and light-duty industrial cleaners"
    },
    performance: {
      cleaning: 8,
      foam: 10,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 6,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Readily biodegradable under aerobic and anaerobic conditions",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 7.1 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Goggles", "Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage", "H412: Harmful to aquatic life with long-lasting effects"],
      precautionaryStatements: [
        "P280: Wear eye protection/face protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses if present."
      ],
      firstAid: "Immediately flush eyes with running water for 15 minutes. Wash skin thoroughly with soap and water.",
      msdsSummary: "Highly irritating in concentrated form. Dilute paste carefully by adding SLES to warm water under continuous stirring, never the other way around, to prevent gel lumps."
    }
  },
  {
    id: "sls",
    commonName: "Sodium Lauryl Sulfate (SLS)",
    chemicalName: "Sodium Dodecyl Sulfate",
    iupacName: "sodium dodecyl sulfate",
    casNumber: "151-21-3",
    molecularFormula: "C12H25NaO4S",
    molecularWeight: "288.38 g/mol",
    inciName: "Sodium Lauryl Sulfate",
    tradeNames: ["SLS Powder", "SLS Needles", "Texapon K12", "Emal 10G"],
    synonyms: ["Sodium Dodecyl Sulfate", "Lauryl Sodium Sulfate"],
    category: "Anionic Surfactants",
    suppliers: ["Galaxy Surfactants", "BASF SE", "Godrej Industries", "Stepan Company"],
    marketNames: {
      indian: "SLS Powder / Needles",
      international: "SLS Needle 92%",
      hindi: "एसएलएस पाउडर"
    },
    physicalProperties: {
      appearance: "White powder or cylindrical needles",
      color: "White",
      odor: "Faint, characteristic",
      activeMatter: "92% - 95% (Solid form)",
      pH: "7.5 - 10.0 (1% aqueous solution)",
      density: "1.1 g/cm³",
      viscosity: "N/A (Solid)",
      solubility: "Soluble in water (~150 g/L at 20°C)",
      boilingPoint: "> 200°C",
      meltingPoint: "206°C",
      shelfLife: "24 Months",
      storageConditions: "Store in a dry place. Dust is highly irritating; keep bags sealed tightly."
    },
    functionalInfo: {
      whatIsIt: "High-foaming anionic surfactant synthesized by sulfating dodecyl alcohol followed by neutralization with sodium hydroxide.",
      whyUsed: "Used for high-foaming powder detergents, carpet shampoos, car washes, and toothpastes where powerful flash foam and rapid degreasing are required.",
      advantages: [
        "Incredible flash foaming capacity",
        "Strong grease emulsification and wet-out",
        "Provides dry structure in powder formulations"
      ],
      limitations: [
        "Highly irritating to skin and eyes in concentrated forms",
        "Sensitive to hard water (calcium precipitations)",
        "Can cause skin dryness in hand-use formulations"
      ],
      alternatives: ["SLES", "AOS", "Sodium Cocoyl Isethionate"],
      ecoFriendliness: "Ready biodegradability (>95% OECD 301B). Moderately toxic to aquatic life."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "3.0%",
      premium: "8.0%",
      maximum: "15.0%",
      household: "2% - 6% in carpet and upholstery shampoo",
      industrial: "5% - 12% in foam-heavy vehicle washes"
    },
    performance: {
      cleaning: 9,
      foam: 10,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 2,
      hardWater: 4
    },
    sustainability: {
      biodegradability: "Readily biodegradable under aerobic conditions",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 4.6 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Dust Mask", "Safety Goggles", "Nitrile Gloves"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear protective gloves and eye protection."
      ],
      firstAid: "Wash eyes with water for 15 minutes. Wash skin with soap and water.",
      msdsSummary: "Highly irritating dust. Avoid inhalation of airborne powder."
    }
  },
  {
    id: "aos",
    commonName: "AOS (Alpha Olefin Sulfonate) 38%",
    chemicalName: "Sodium C14-16 Olefin Sulfonate",
    iupacName: "sodium C14-16 olefin sulfonate",
    casNumber: "68439-57-6",
    molecularFormula: "C14H27NaO3S (average)",
    molecularWeight: "314.4 g/mol",
    inciName: "Sodium C14-16 Olefin Sulfonate",
    tradeNames: ["AOS 38%", "AOS Liquid", "Bio-Terge AS-40", "Galaxy AOS"],
    synonyms: ["Alpha Olefin Sulfonate Liquid", "Sodium C14-16 Sulfonate"],
    category: "Anionic Surfactants",
    suppliers: ["Galaxy Surfactants", "Stepan Company", "Godrej Industries", "Kao Corporation"],
    marketNames: {
      indian: "AOS Liquid (38% Mal)",
      international: "AOS 40% Liquid",
      hindi: "एओएस लिक्विड"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid",
      color: "Pale Yellow",
      odor: "Mild, characteristic",
      activeMatter: "37% - 40%",
      pH: "7.0 - 9.0 (as is)",
      density: "1.06 g/cm³",
      viscosity: "100 - 300 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "0°C",
      shelfLife: "24 Months",
      storageConditions: "Store above 10°C to avoid crystallization or gel phase separation."
    },
    functionalInfo: {
      whatIsIt: "Sulfonated linear alpha-olefin mixture, mainly consisting of sodium alkene sulfonates and sodium hydroxyalkane sulfonates.",
      whyUsed: "Excellent foaming co-surfactant for liquid detergents, hand soaps, and car washes. Provides exceptional stability across a wide pH range and excels in hard water.",
      advantages: [
        "Outstanding performance in hard water",
        "Highly stable in acidic and alkaline conditions",
        "Better skin mildness compared to SLS",
        "Excellent wetting and cleaning boost"
      ],
      limitations: [
        "Does not thicken with salt as easily as SLES",
        "Slightly yellowish color compared to colorless SLES"
      ],
      alternatives: ["SLES", "LABSA", "Sodium Lauryl Sarcosinate"],
      ecoFriendliness: "Excellent eco-profile, readily biodegradable, low toxic residues."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "6.0%",
      premium: "12.0%",
      maximum: "20.0%",
      household: "3% - 10% in liquid laundry and car washing soaps",
      industrial: "5% - 15% in high-foaming commercial cleaners"
    },
    performance: {
      cleaning: 8,
      foam: 9,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 5,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily biodegradable (>90% OECD 301B)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 5.0 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Rinse eyes with running water for 15 minutes. Wash skin with soap.",
      msdsSummary: "Highly stable liquid. Avoid direct eye exposure."
    }
  },
  {
    id: "aos-powder",
    commonName: "AOS Powder (Alpha Olefin Sulfonate Powder)",
    chemicalName: "Sodium Alpha Olefin Sulfonate (Solid)",
    iupacName: "sodium alpha olefin sulfonate",
    casNumber: "68439-57-6",
    molecularFormula: "C14H27NaO3S (average)",
    molecularWeight: "314.4 g/mol",
    inciName: "Sodium C14-16 Olefin Sulfonate",
    tradeNames: ["AOS Powder 92%", "AOS Needle", "Texapon AS-90", "Galaxy AOS 90"],
    synonyms: ["Sodium Alpha Olefin Sulfonate Powder", "Solid AOS"],
    category: "Anionic Surfactants",
    suppliers: ["Galaxy Surfactants", "Stepan Company", "Godrej Industries", "Kao Corporation"],
    marketNames: {
      indian: "AOS Powder (92% Mal)",
      international: "AOS 90% Powder / Needles",
      hindi: "एओएस पाउडर"
    },
    physicalProperties: {
      appearance: "Free-flowing fine powder or needles",
      color: "White to Creamy White",
      odor: "Mild, sweetish, typical",
      activeMatter: "90% - 93% Min",
      pH: "8.0 - 10.5 (1% aqueous solution)",
      density: "0.45 g/cm³",
      viscosity: "N/A (Solid)",
      solubility: "Soluble in water (~100 g/L at 25°C)",
      boilingPoint: "> 200°C",
      meltingPoint: "195°C",
      shelfLife: "24 Months",
      storageConditions: "Hygroscopic powder. Keep dry in tightly sealed bags to prevent hard lump caking."
    },
    functionalInfo: {
      whatIsIt: "Highly concentrated dry form of sodium alpha olefin sulfonate.",
      whyUsed: "Extensively used in dry detergent powders, toilet blocks, and solid bubble baths where maximum active matter, superb foaming, and hard-water stability are needed without adding liquid water.",
      advantages: [
        "Extreme active concentration (>90%)",
        "Superior solubility and wetting speed compared to SLS powder",
        "Highly stable in highly alkaline formulations",
        "Provides rich, dense lather even in salty/hard water"
      ],
      limitations: [
        "Highly irritating fine dust (requires strict respiratory PPE)",
        "Slightly hygroscopic, absorbing ambient moisture easily"
      ],
      alternatives: ["SLS Powder", "Sodium Lauryl Sulfoacetate", "LABSA (Neutralized in-situ)"],
      ecoFriendliness: "Highly biodegradable, breaks down quickly without bioaccumulating."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0%",
      premium: "10.0%",
      maximum: "20.0%",
      household: "3% - 8% in high-tier washing powders",
      industrial: "5% - 15% in powdered car wash and pressure washer compounds"
    },
    performance: {
      cleaning: 9,
      foam: 9,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 5,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>90% in 28 days)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 4.5 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["N95 Dust Mask", "Safety Goggles", "Nitrile Gloves"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear eye and skin protection."
      ],
      firstAid: "Wash eyes with warm water. Shake dust out of nose/throat and rinse mouth with water.",
      msdsSummary: "Highly irritating fine powder. Handle under proper dust extraction ventilation."
    }
  },
  {
    id: "sxs",
    commonName: "Sodium Xylene Sulfonate (SXS)",
    chemicalName: "Sodium Xylenesulfonate",
    iupacName: "sodium dimethylbenzenesulfonate",
    casNumber: "1300-72-7",
    molecularFormula: "C8H9NaO3S",
    molecularWeight: "208.21 g/mol",
    inciName: "Sodium Xylenesulfonate",
    tradeNames: ["SXS 40%", "Stepanate SXS", "Eltesol SX40"],
    synonyms: ["Sodium dimethylbenzenesulfonate", "SXS Liquid"],
    category: "Hydrotropes",
    suppliers: ["Stepan Company", "Kao Corporation", "Huntsman", "Galaxy Surfactants"],
    marketNames: {
      indian: "SXS Hydrotrope (40% Liquid)",
      international: "SXS 40% Active",
      hindi: "सोडियम जायलीन सल्फोनेट"
    },
    physicalProperties: {
      appearance: "Clear, thin liquid",
      color: "Water-white to Amber-yellow",
      odor: "Slight, organic",
      activeMatter: "39% - 42%",
      pH: "7.0 - 9.0 (as is)",
      density: "1.17 g/cm³",
      viscosity: "10 - 25 cPs",
      solubility: "Miscible in all proportions with water",
      boilingPoint: "101°C",
      meltingPoint: "-5°C",
      shelfLife: "24 Months",
      storageConditions: "Keep in a cool place. Freezing can cause precipitation, which dissolves upon warming."
    },
    functionalInfo: {
      whatIsIt: "Anionic hydrotrope (solubilizing agent) synthesized by sulfonation of xylene with sulfuric acid or oleum, neutralized with sodium hydroxide.",
      whyUsed: "Used to increase the solubility of organic surfactants in liquid formulas, lower the cloud point of liquid detergents, and control viscosity without adding thickening salts.",
      advantages: [
        "Phenomenal solubilizing (coupling) agent",
        "Reduces formulation viscosity and gel-tendency",
        "Increases formula clarity and cold-weather stability",
        "Enhances formulation concentration limits"
      ],
      limitations: [
        "Does not contribute directly to cleaning or foam generation",
        "Relatively expensive compared to standard processing salts"
      ],
      alternatives: ["Sodium Cumene Sulfonate (SCS)", "Urea", "Propylene Glycol"],
      ecoFriendliness: "Readily biodegradable, minimal environmental impact, safe for standard treatment plants."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1.5% - 4.0% in concentrated dishwash and liquid laundry",
      industrial: "2.0% - 8.0% in heavy-duty commercial alkaline degreasers"
    },
    performance: {
      cleaning: 2,
      foam: 2,
      oilRemoval: 3,
      greaseCutting: 4,
      skinMildness: 8,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily biodegradable (>95% OECD 301B)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 400 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes with water for several minutes. Remove contacts if present.",
      msdsSummary: "Highly stable coupling hydrotrope. Very low risk when handled correctly."
    }
  },
  {
    id: "scs",
    commonName: "Sodium Cumene Sulfonate (SCS)",
    chemicalName: "Sodium Cumenesulfonate",
    iupacName: "sodium 2-phenylpropane-1-sulfonate",
    casNumber: "28348-53-0",
    molecularFormula: "C9H11NaO3S",
    molecularWeight: "222.24 g/mol",
    inciName: "Sodium Cumenesulfonate",
    tradeNames: ["SCS 40%", "Stepanate SCS", "Eltesol SC40"],
    synonyms: ["Sodium isopropylbenzenesulfonate", "SCS Liquid"],
    category: "Hydrotropes",
    suppliers: ["Stepan Company", "Kao Corporation", "Huntsman", "Ruetgers Organics"],
    marketNames: {
      indian: "SCS Liquid (40%)",
      international: "SCS 40% Hydrotrope",
      hindi: "सोडियम क्यूमीन सल्फोनेट"
    },
    physicalProperties: {
      appearance: "Clear liquid",
      color: "Water-white to Pale Straw",
      odor: "Slightly organic, characteristic",
      activeMatter: "39% - 41%",
      pH: "7.0 - 9.0 (as is)",
      density: "1.16 g/cm³",
      viscosity: "10 - 20 cPs",
      solubility: "Highly soluble in water in all ranges",
      boilingPoint: "101°C",
      meltingPoint: "-4°C",
      shelfLife: "24 Months",
      storageConditions: "Store in original plastic or lined steel drums above 5°C."
    },
    functionalInfo: {
      whatIsIt: "Highly efficient anionic hydrotrope synthesized by sulfonation of cumene (isopropylbenzene) with sulfuric acid/oleums, neutralized with caustic soda.",
      whyUsed: "Used primarily in liquid detergents to stabilize formulation temperature curves, lower cloud points, and coupling incompatible organic compounds in high-salt systems.",
      advantages: [
        "Highly efficient coupling agent (often works at lower dosages than SXS)",
        "Excellent high-electrolyte solubility",
        "Effectively solubilizes organic solvents and essential oils into water-based bases",
        "Prevents phase separation during cold storage"
      ],
      limitations: [
        "No direct detergency contribution",
        "Slightly higher cost than SXS"
      ],
      alternatives: ["Sodium Xylene Sulfonate (SXS)", "Sodium Toluene Sulfonate (STS)", "Urea"],
      ecoFriendliness: "Readily biodegradable, low aquatic toxicity, fully compliant with environmental criteria."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "1.5%",
      premium: "4.0%",
      maximum: "8.0%",
      household: "1.0% - 3.5% in heavy concentrated washing liquids",
      industrial: "2.0% - 6.0% in institutional and CIP dishwash formulas"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 4,
      skinMildness: 8,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily biodegradable under aerobic conditions",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 450 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with plenty of water. If skin irritation develops, wash with soap.",
      msdsSummary: "Highly stable hydrotrope coupling agent. Safe when normal lab practices are followed."
    }
  },
  {
    id: "sdbs",
    commonName: "Sodium Dodecylbenzene Sulfonate (SDBS)",
    chemicalName: "Sodium Dodecylbenzenesulfonate",
    iupacName: "sodium 4-dodecylbenzene-1-sulfonate",
    casNumber: "25155-30-0",
    molecularFormula: "C18H29NaO3S",
    molecularWeight: "348.48 g/mol",
    inciName: "Sodium Dodecylbenzenesulfonate",
    tradeNames: ["SDBS Powder", "Nansa HS90", "Soluble Las Powder"],
    synonyms: ["LAS Sodium Salt", "Sodium Laurylbenzene Sulfonate"],
    category: "Anionic Surfactants",
    suppliers: ["Galaxy Surfactants", "Nirma", "Kao Corporation", "Stepan Company"],
    marketNames: {
      indian: "LAS Powder (SDBS)",
      international: "SDBS 90% Powder / Needles",
      hindi: "सोडियम डॉडेसिलबेंजीन सल्फोनेट"
    },
    physicalProperties: {
      appearance: "White to cream colored powder or flakes",
      color: "White to Off-white",
      odor: "Characteristic, organic",
      activeMatter: "88% - 92% (Solid Las)",
      pH: "7.0 - 10.0 (1% aqueous solution)",
      density: "1.1 g/cm³",
      viscosity: "N/A (Solid)",
      solubility: "Soluble in water (~200 g/L at 25°C)",
      boilingPoint: "N/A",
      meltingPoint: "> 300°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool, dry conditions. Highly hygroscopic; protect from humidity."
    },
    functionalInfo: {
      whatIsIt: "Dry, neutralized sodium salt of Linear Alkyl Benzene Sulfonic Acid.",
      whyUsed: "Used directly in powdered laundry detergents, industrial powder cleansers, and dry cleaning cakes to provide strong anionic cleaning power, degreasing, and foaming.",
      advantages: [
        "Extremely high active surfactant content (approx 90%)",
        "Avoids the need to neutralize corrosive liquid LABSA during powder processing",
        "Outstanding stain suspension and oily grease cutting",
        "Provides robust dry structure in detergent tablets and bars"
      ],
      limitations: [
        "Highly irritating dust",
        "Prone to hard clumping in humid warehouses if sacks are punctured"
      ],
      alternatives: ["AOS Powder", "SLS Powder", "Sodium Lauryl Sulfoacetate"],
      ecoFriendliness: "Highly biodegradable, breaks down quickly under aerobic sewage treatment conditions."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "6.0%",
      premium: "15.0%",
      maximum: "25.0%",
      household: "5% - 15% in laundry washing powders and bars",
      industrial: "8% - 22% in dry industrial grease compounds"
    },
    performance: {
      cleaning: 9,
      foam: 8,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 3,
      hardWater: 5
    },
    sustainability: {
      biodegradability: "Readily biodegradable (>90% OECD 301D)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 3.2 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Goggles", "Dust Mask", "Nitrile Gloves"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear eye and skin protection."
      ],
      firstAid: "Flush eyes immediately with warm water for 15 minutes. Wash skin with soap and water.",
      msdsSummary: "Highly concentrated surfactant dust. Handle with standard dry transfer equipment."
    }
  },
  {
    id: "sci",
    commonName: "Sodium Cocoyl Isethionate (SCI)",
    chemicalName: "Sodium Cocoyl Isethionate",
    iupacName: "sodium 2-(cocoyloxy)ethanesulfonate",
    casNumber: "61789-32-0",
    molecularFormula: "C14H27NaO5S (average)",
    molecularWeight: "342.4 g/mol",
    inciName: "Sodium Cocoyl Isethionate",
    tradeNames: ["SCI Powder", "SCI Granules", "Hostapon SCI", "Jordapon CI"],
    synonyms: ["Baby Foam", "Coconut Isethionate Sodium Salt"],
    category: "Anionic Surfactants",
    suppliers: ["Clariant", "Innospec", "Galaxy Surfactants", "BASF SE"],
    marketNames: {
      indian: "SCI Powder (85% Active)",
      international: "SCI Powder / Granules",
      hindi: "सोडियम कोकोइल आइसिथियोनेट"
    },
    physicalProperties: {
      appearance: "Fine powder, chips, or granules",
      color: "White",
      odor: "Faint, sweet coconut-like",
      activeMatter: "80% - 85% Min",
      pH: "5.0 - 6.5 (10% aqueous solution)",
      density: "1.15 g/cm³",
      viscosity: "N/A (Solid)",
      solubility: "Sparsely soluble in cold water; highly soluble in warm water (> 40°C)",
      boilingPoint: "N/A",
      meltingPoint: "200°C",
      shelfLife: "24 Months",
      storageConditions: "Store in closed containers in a dry, ventilated warehouse."
    },
    functionalInfo: {
      whatIsIt: "Mild, sulfate-free anionic surfactant made from natural coconut fatty acids esterified with sodium isethionate.",
      whyUsed: "Outstanding mild surfactant used primarily in sulfate-free syndet soap bars, facial cleansers, liquid baby soaps, and premium hand washes where luxurious dense cream foam and ultimate skin mildness are required.",
      advantages: [
        "Virtually non-irritating to skin and eyes",
        "Produces dense, creamy, luxurious lather",
        "Leaves a velvety, hydrated, non-dry feel on skin",
        "Resists hard water precipitation completely"
      ],
      limitations: [
        "Significantly higher cost than standard anionic surfactants",
        "Low solubility in cold water, making clear cold liquid formulations difficult to build",
        "Requires heat to dissolve completely during processing"
      ],
      alternatives: ["Sodium Lauryl Sulfoacetate (SLSA)", "Disodium Laureth Sulfosuccinate (DLS)", "Sodium Methyl Cocoyl Taurate"],
      ecoFriendliness: "Highly biodegradable, completely plant-derived hydrophobic chain, safe for aquatic life."
    },
    dosage: {
      minimum: "3.0%",
      recommended: "10.0%",
      premium: "25.0%",
      maximum: "60.0%",
      household: "5% - 15% in liquid baby/hand wash",
      industrial: "15% - 50% in solid syndet bars and facial wash sticks"
    },
    performance: {
      cleaning: 7,
      foam: 10,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>95% OECD 301E)",
      plantBasedPct: 85,
      petroleumBasedPct: 15,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 10.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Dust Mask", "Safety Glasses", "Nitrile Gloves"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Chronic Aquatic Hazard (Category 3)"],
      hazardStatements: ["H319: Causes serious eye irritation", "H412: Harmful to aquatic life with long lasting effects"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes with water for several minutes. Wash skin with warm water.",
      msdsSummary: "Highly safe, mild surfactant powder. Minimize breathing powder dust."
    }
  },
  {
    id: "smct",
    commonName: "Sodium Methyl Cocoyl Taurate",
    chemicalName: "Sodium Methyl Cocoyl Taurate",
    iupacName: "sodium 2-[methyl(cocoyl)amino]ethanesulfonate",
    casNumber: "12765-39-8",
    molecularFormula: "C15H30NNaO4S (average)",
    molecularWeight: "367.46 g/mol",
    inciName: "Sodium Methyl Cocoyl Taurate",
    tradeNames: ["Tauranol MS-30", "Adinol CT", "Geropon TC"],
    synonyms: ["Sodium Cocoyl Methyl Taurate", "Methyl Taurate Anionic Surfactant"],
    category: "Anionic Surfactants",
    suppliers: ["Clariant", "Innospec", "Croda International", "Galaxy Surfactants"],
    marketNames: {
      indian: "Methyl Taurate Paste (30% Active)",
      international: "Sodium Methyl Cocoyl Taurate 30% Paste",
      hindi: "सोडियम मिथाइल कोकोइल टॉरेट"
    },
    physicalProperties: {
      appearance: "Thick, creamy paste or slurry",
      color: "White to Off-white",
      odor: "Characteristic, mild sweet amide",
      activeMatter: "29% - 32%",
      pH: "7.0 - 8.5 (10% aqueous solution)",
      density: "1.05 g/cm³",
      viscosity: "High paste consistency (pumpable with warming)",
      solubility: "Soluble in water under agitation",
      boilingPoint: "100°C",
      meltingPoint: "N/A",
      shelfLife: "24 Months",
      storageConditions: "Store in original plastic packaging above 15°C to prevent extreme thickening."
    },
    functionalInfo: {
      whatIsIt: "Ultra-premium, mild, sulfate-free anionic surfactant made from natural coconut fatty acids reacted with methyl taurine.",
      whyUsed: "Used primarily in high-end sulfate-free shampoos, facial washes, and premium liquid soaps to generate abundant, rich, creamy foam that remains highly stable even in the presence of natural hair and skin sebum.",
      advantages: [
        "Incredible foam stability in high oil loads",
        "Exceptional skin and eye mildness (non-stripping)",
        "Works exceptionally well in hard water",
        "Provides excellent wet combing and hair conditioning synergy"
      ],
      limitations: [
        "Very expensive raw material",
        "Difficult to formulate as a clear liquid without co-surfactants"
      ],
      alternatives: ["Sodium Cocoyl Isethionate (SCI)", "Disodium Laureth Sulfosuccinate", "Sodium Lauroyl Sarcosinate"],
      ecoFriendliness: "Highly biodegradable, plant-derived lipid, safe for sewage systems."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "15.0%",
      maximum: "30.0%",
      household: "4% - 12% in premium personal cleansers",
      industrial: "5% - 15% in high-performance cosmetic washes"
    },
    performance: {
      cleaning: 7,
      foam: 10,
      oilRemoval: 8,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>92% OECD 301B)",
      plantBasedPct: 80,
      petroleumBasedPct: 20,
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
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with plenty of running water. Wash skin with soap.",
      msdsSummary: "Highly skin-compatible premium surfactant paste. Stable and safe under normal use."
    }
  },
  {
    id: "dls",
    commonName: "Disodium Laureth Sulfosuccinate",
    chemicalName: "Disodium Laureth Sulfosuccinate",
    iupacName: "disodium 4-[2-(dodecyloxy)ethoxy]-4-oxo-2-sulfonatobutanoate",
    casNumber: "39354-45-5",
    molecularFormula: "C16H28Na2O7S (average)",
    molecularWeight: "410.43 g/mol",
    inciName: "Disodium Laureth Sulfosuccinate",
    tradeNames: ["DLS 40%", "Rewopol SB FA 30", "Texapon SB 3"],
    synonyms: ["Sulfosuccinate Laureth Ester Disodium Salt", "DLS Surfactant"],
    category: "Anionic Surfactants",
    suppliers: ["Evonik Industries", "Stepan Company", "Galaxy Surfactants", "Innospec"],
    marketNames: {
      indian: "Sulfosuccinate DLS (40% Liquid)",
      international: "Disodium Laureth Sulfosuccinate 40%",
      hindi: "डाईसोडियम लॉरेथ सल्फोसक्सिनेट"
    },
    physicalProperties: {
      appearance: "Clear to slightly cloudy liquid",
      color: "Water-white to Pale Yellow",
      odor: "Faint, sweet ester",
      activeMatter: "38% - 41%",
      pH: "5.5 - 7.0 (as is)",
      density: "1.10 g/cm³",
      viscosity: "50 - 200 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "102°C",
      meltingPoint: "-2°C",
      shelfLife: "18 Months (highly sensitive to pH-driven hydrolysis below pH 5 or above pH 7)",
      storageConditions: "Store in original drums. Maintain temperature strictly between 15°C and 30°C. Keep pH stabilized."
    },
    functionalInfo: {
      whatIsIt: "Extremely mild, sulfate-free anionic sulfosuccinate half-ester surfactant derived from ethoxylated lauryl alcohol and maleic anhydride.",
      whyUsed: "Used as a primary or secondary surfactant in baby shampoos, ultra-mild hand cleansers, and bubble baths to provide robust, creamy foaming without skin irritation.",
      advantages: [
        "One of the mildest anionic surfactants known to science",
        "Significantly reduces skin irritation from standard ether sulfates",
        "Produces excellent rich, creamy foam and wash performance",
        "Completely sulfate-free, biodegradable, and highly sustainable"
      ],
      limitations: [
        "Highly prone to hydrolysis (splitting) if formulated outside pH 5.0 - 7.0",
        "Hard to thicken with sodium chloride alone (requires associative thickeners)",
        "Moderately expensive raw material compared to SLES"
      ],
      alternatives: ["Sodium Lauryl Sulfoacetate (SLSA)", "Sodium Methyl Cocoyl Taurate", "Decyl Glucoside"],
      ecoFriendliness: "Excellent ecotox profile. Rapidly biodegradable, minimal aquatic hazard."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "15.0%",
      maximum: "35.0%",
      household: "4% - 10% in baby body washes and premium hand soap",
      industrial: "5% - 15% in high-end mild household liquid formulations"
    },
    performance: {
      cleaning: 7,
      foam: 9,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>96% OECD 301E)",
      plantBasedPct: 70,
      petroleumBasedPct: 30,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 15.0 mg/L (relatively low toxicity)",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Protective Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes immediately with large quantities of clean water. Wash skin with soap.",
      msdsSummary: "Highly gentle mild surfactant. Avoid extremely high temperatures during storage to prevent decomposition."
    }
  },
  {
    id: "slsa",
    commonName: "Sodium Lauryl Sulfoacetate (SLSA)",
    chemicalName: "Sodium Lauryl Sulfoacetate",
    iupacName: "sodium 2-(dodecyloxy)-2-oxoethane-1-sulfonate",
    casNumber: "1847-58-1",
    molecularFormula: "C14H27NaO5S",
    molecularWeight: "330.41 g/mol",
    inciName: "Sodium Lauryl Sulfoacetate",
    tradeNames: ["Lathanol LAL Powder", "SLSA Powder", "Nikkol LSA"],
    synonyms: ["Sulfoacetic Acid Lauryl Ester Sodium Salt", "Sodium Lauryl Sulfo Acetate"],
    category: "Anionic Surfactants",
    suppliers: ["Stepan Company", "Innospec", "Croda", "Galaxy Surfactants"],
    marketNames: {
      indian: "SLSA Powder (65% Active)",
      international: "SLSA Mild Powder / Needles",
      hindi: "सोडियम लॉरिल सल्फोएसीटेट"
    },
    physicalProperties: {
      appearance: "Fine crystalline powder or granules",
      color: "White",
      odor: "Faint, characteristic sweet odor",
      activeMatter: "65% - 70% (Detergent grades, rest is sodium chloride/sulfate)",
      pH: "5.5 - 7.5 (5% aqueous solution)",
      density: "1.18 g/cm³",
      viscosity: "N/A (Solid)",
      solubility: "Soluble in water (~35 g/L at 25°C). Dissolves fully in warm water.",
      boilingPoint: "N/A",
      meltingPoint: "215°C",
      shelfLife: "24 Months",
      storageConditions: "Store in a dry, ventilated area. Keep container tightly sealed (hygroscopic)."
    },
    functionalInfo: {
      whatIsIt: "Sulfate-free, highly mild, biodegradable anionic surfactant made by esterifying lauryl alcohol with chloroacetic acid, followed by sulfonation with sodium sulfite.",
      whyUsed: "Used primarily in solid bath powders, bath bombs, solid shampoo bars, and premium mild liquid cleansers to produce copious, dense, rich lather that is exceptionally skin-friendly.",
      advantages: [
        "100% sulfate-free, premium skin-friendly profile",
        "Generates dense, rich, highly luxurious flash foam",
        "Excellent wet-out and soil dispersion",
        "Provides amazing dry structural properties in dry/tablet formulas"
      ],
      limitations: [
        "Highly expensive specialty raw material",
        "Fine dust is highly irritating to breathe during processing"
      ],
      alternatives: ["Sodium Cocoyl Isethionate (SCI)", "Disodium Laureth Sulfosuccinate", "Sodium Lauryl Sulfate"],
      ecoFriendliness: "Highly biodegradable, plant-derived lauryl tail, very safe for aquatic life."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0%",
      premium: "20.0%",
      maximum: "50.0%",
      household: "3% - 10% in premium baby wash and skin creams",
      industrial: "10% - 40% in dry bath powders and syndet bars"
    },
    performance: {
      cleaning: 8,
      foam: 10,
      oilRemoval: 7,
      greaseCutting: 7,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% OECD 301D)",
      plantBasedPct: 80,
      petroleumBasedPct: 20,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 12.0 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["N95 Dust Mask", "Safety Glasses", "Rubber Gloves"],
      ghsClassification: ["Acute Toxicity (Category 4)", "Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H302: Harmful if swallowed", "H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P261: Avoid breathing dust.",
        "P280: Wear protective gloves/eye protection."
      ],
      firstAid: "Flush eyes with water immediately for 15 minutes. Wash skin with soap.",
      msdsSummary: "Highly gentle cosmetic surfactant. Fine dust must be controlled via localized exhaust hoods."
    }
  },
  {
    id: "sas",
    commonName: "Secondary Alkane Sulfonate (SAS)",
    chemicalName: "Sodium C14-17 Alkyl Sec Sulfonate",
    iupacName: "sodium C14-17 secondary alkane sulfonate",
    casNumber: "97489-15-1",
    molecularFormula: "C15H31NaO3S (average)",
    molecularWeight: "314.45 g/mol (average)",
    inciName: "Sodium C14-17 Alkyl Sec Sulfonate",
    tradeNames: ["Hostapur SAS 60", "Hostapur SAS 93", "Secondary Alkane Sulfonate"],
    synonyms: ["SAS", "Sodium Alkane Sulfonate", "Secondary Alkane Sulfonates"],
    category: "Anionic Surfactants",
    suppliers: ["Clariant", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "SAS 60% Liquid",
      international: "Hostapur SAS 60"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid",
      color: "Light Yellow",
      odor: "Faint, characteristic",
      activeMatter: "58% - 62% (SAS 60) or 92% (SAS 93)",
      pH: "Typical Range: 7.0 - 8.5 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.05 - 1.09 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: 50 - 150 cPs (Typical Range — Varies by Supplier/Grade)",
      solubility: "Completely soluble in water",
      shelfLife: "24 Months",
      storageConditions: "Store above 10°C to prevent turbidity or crystallization. Stable in highly alkaline and acidic conditions."
    },
    functionalInfo: {
      whatIsIt: "Anionic surfactant produced by sulfoxidation of n-paraffins. It exhibits excellent solubility, rapid wetting, and chemical stability.",
      whyUsed: "Used in household dishwash, heavy-duty liquid laundries, industrial hard surface cleaners, and alkaline cleaning formulations due to its outstanding wetting, degreasing, and stability over wide pH ranges.",
      advantages: [
        "Excellent grease emulsification and soil removal",
        "High tolerance to hard water",
        "Outstanding wetting power",
        "Highly stable in strong acids and alkalis"
      ],
      limitations: [
        "Relatively higher cost than SLES/LABSA",
        "Generates moderate to high foam (not ideal for low-foam machines unless defoamer is added)"
      ],
      alternatives: ["LABSA", "SLES", "AOS"],
      ecoFriendliness: "Highly biodegradable (>90% OECD 301D). Non-toxic to plants."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "12.0%",
      maximum: "20.0%",
      household: "2% - 10%",
      industrial: "5% - 20%"
    },
    performance: {
      cleaning: 9,
      foam: 7,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 5,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% in 28 days)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "EC50 (Algae) ~ 9.5 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Goggles", "Rubber Gloves"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves/eye protection."
      ],
      firstAid: "Flush eyes immediately with plenty of water. Wash skin with soap and water.",
      msdsSummary: "Avoid contact with concentrated form. Stable surfactant."
    },
    chargeType: "Anionic",
    hlb: "N/A",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Clariant", "Evidence Not Available — Requires Manual Verification"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "mes",
    commonName: "Methyl Ester Sulfonate (MES)",
    chemicalName: "Sodium Methyl 2-Sulfolaurate",
    iupacName: "sodium methyl 2-sulfododecanoate",
    casNumber: "93348-22-2",
    molecularFormula: "C13H25NaO5S",
    molecularWeight: "316.39 g/mol",
    inciName: "Sodium Methyl 2-Sulfolaurate",
    tradeNames: ["MES Paste", "Alpha-Step MC-48", "Sodium Methyl 2-Sulfolaurate"],
    synonyms: ["Alpha-sulfo methyl ester", "MES", "Sodium Methyl 2-Sulfolaurate & Disodium 2-Sulfolaurate"],
    category: "Anionic Surfactants",
    suppliers: ["Stepan Company", "Lion Corporation", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "MES Powder / Paste",
      international: "MES 70%"
    },
    physicalProperties: {
      appearance: "Flakes, powder, or thick paste",
      color: "Off-white to light yellow",
      odor: "Faint, characteristic fatty odor",
      activeMatter: "30% - 70% (depending on form)",
      pH: "Typical Range: 5.5 - 7.5 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.02 - 1.06 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: Very High Paste (Typical Range — Varies by Supplier/Grade)",
      solubility: "Soluble in warm water",
      shelfLife: "18 Months",
      storageConditions: "Store in a cool dry place. Prone to hydrolysis if stored at elevated temperatures or outside pH 5.0 - 9.0."
    },
    functionalInfo: {
      whatIsIt: "Highly eco-friendly, bio-based anionic surfactant synthesized by sulfonation of fatty acid methyl esters derived from natural oils (e.g., coconut or palm oil).",
      whyUsed: "Used in green laundry detergents, dishwashing liquids, and mild cosmetic washes as an ultra-biodegradable alternative to petroleum-based anionic surfactants like LABSA.",
      advantages: [
        "100% plant-derived renewable carbon source",
        "Outstanding biodegradability profile",
        "Highly tolerant to hard water",
        "Superb cleaning efficacy on grease and clay soils"
      ],
      limitations: [
        "Susceptible to hydrolysis at extreme pH levels",
        "Higher raw material cost",
        "Slower dissolution rate in cold water"
      ],
      alternatives: ["LABSA", "SLES", "Sodium Lauroyl Methyl Isethionate"],
      ecoFriendliness: "Superb eco profile. Rapidly biodegradable under both aerobic and anaerobic conditions."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "6.0%",
      premium: "15.0%",
      maximum: "25.0%",
      household: "3% - 10%",
      industrial: "5% - 15%"
    },
    performance: {
      cleaning: 8,
      foam: 6,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 8,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>95% OECD 301B)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 4.2 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Rubber Gloves"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P280: Wear protective gloves/eye protection."
      ],
      firstAid: "Flush eyes immediately with plenty of water. Wash skin with soap and water.",
      msdsSummary: "Highly biodegradable surfactant. Handle paste with care to avoid skin irritation."
    },
    chargeType: "Anionic",
    hlb: "N/A",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Stepan Company", "Lion Corporation"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "soap-noodles",
    commonName: "Soap Noodles",
    chemicalName: "Sodium Salts of Fatty Acids",
    iupacName: "sodium octadecanoate (and other fatty acid sodium salts)",
    casNumber: "61789-31-9",
    molecularFormula: "RCOONa (mixture)",
    molecularWeight: "270 - 300 g/mol (average)",
    inciName: "Sodium Palmate / Sodium Cocoate",
    tradeNames: ["Soap Noodles 80/20", "Standard Toilet Soap Base", "Pure Vegetable Soap Noodles"],
    synonyms: ["Soap Base", "Sodium Tallowate", "Sodium Cocoate", "Sodium Palmate Soap Noodles"],
    category: "Anionic Surfactants",
    suppliers: ["KLK OLEO", "Wilmar International", "IOI Oleochemicals", "Godrej Industries"],
    marketNames: {
      indian: "Soap Noodles (80:20)",
      international: "Soap Noodles 80/20"
    },
    physicalProperties: {
      appearance: "Solid, cylindrical or flat noodles",
      color: "White to cream",
      odor: "Characteristic fatty odor",
      activeMatter: "78% - 82% (rest is moisture/glycerin)",
      pH: "Typical Range: 9.5 - 11.0 (1% aqueous solution) (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.02 - 1.05 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "N/A (Solid)",
      solubility: "Soluble in hot water",
      shelfLife: "36 Months",
      storageConditions: "Store in cool dry conditions. Keep bags sealed to avoid loss of moisture (which makes soap brittle)."
    },
    functionalInfo: {
      whatIsIt: "Saponified vegetable oil fatty acids (usually 80% Palm Oil / 20% Coconut Oil) neutralized with sodium hydroxide.",
      whyUsed: "The primary structural base for solid toilet soap bars, laundry soap bars, and syndet blends. Acts as a lubricating cleansing agent and secondary foam builder.",
      advantages: [
        "100% natural and renewable vegetable source",
        "Highly cost-effective cleansing agent",
        "Provides perfect solid structure and hardness to extruded bars",
        "Excellent mild detergent action"
      ],
      limitations: [
        "Insoluble in cold, hard water (precipitates as calcium soap scum)",
        "Not suitable for low pH or acidic formulations (converts back to fatty acids)"
      ],
      alternatives: ["Sodium Cocoyl Isethionate (SCI)", "Sulfated Surfactants"],
      ecoFriendliness: "100% natural, fully biodegradable, minimal environmental footprint."
    },
    dosage: {
      minimum: "5.0%",
      recommended: "30.0%",
      premium: "80.0%",
      maximum: "95.0%",
      household: "10% - 90% in laundry soap bars",
      industrial: "5% - 20% as lubricant/cleanser in industrial wire drawing"
    },
    performance: {
      cleaning: 7,
      foam: 7,
      oilRemoval: 7,
      greaseCutting: 6,
      skinMildness: 7,
      hardWater: 2
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (100% in 14 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "Low aquatic toxicity",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Gloves"],
      ghsClassification: ["Mild Skin Irritation (Category 3)", "Eye Irritation (Category 2B)"],
      hazardStatements: ["H316: Causes mild skin irritation", "H320: Causes eye irritation"],
      precautionaryStatements: [
        "P305+P351+P338: IF IN EYES: Rinse carefully with water."
      ],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Highly safe vegetable soap base. Minimal GHS classification."
    },
    chargeType: "Anionic",
    hlb: "N/A",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["KLK OLEO", "Wilmar International", "Godrej Industries"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "potassium-soap",
    commonName: "Potassium Soap (Potassium Cocoate)",
    chemicalName: "Potassium Cocoate",
    iupacName: "potassium cocoate",
    casNumber: "61789-30-8",
    molecularFormula: "RCOOK (mixture)",
    molecularWeight: "250 - 280 g/mol (average)",
    inciName: "Potassium Cocoate",
    tradeNames: ["Potassium Cocoate 40%", "Liquid Coconut Soap", "Pure Potassium Soap"],
    synonyms: ["Potassium Soap", "Liquid Coconut Soap", "Potassium Cocoate"],
    category: "Anionic Surfactants",
    suppliers: ["Kao Corporation", "Lonza", "Innospec", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Potassium Cocoate Liquid",
      international: "Potassium Cocoate 40%"
    },
    physicalProperties: {
      appearance: "Clear to slightly amber liquid",
      color: "Light Amber",
      odor: "Characteristic coconut soap odor",
      activeMatter: "35% - 40% (rest is water)",
      pH: "Typical Range: 9.5 - 10.5 (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.03 - 1.05 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "Typical Range: < 100 cPs (Typical Range — Varies by Supplier/Grade)",
      solubility: "Completely soluble in water",
      shelfLife: "24 Months",
      storageConditions: "Store above 5°C. Lower temperatures may cause soap to haze or precipitate."
    },
    functionalInfo: {
      whatIsIt: "Potassium salt of coconut oil fatty acids, produced by saponifying whole coconut oil with potassium hydroxide (KOH).",
      whyUsed: "Used as a natural high-foaming surfactant in liquid hand soaps, surgical scrub soaps, body washes, and natural laundry liquids.",
      advantages: [
        "100% natural, plant-derived from coconut oil",
        "Generates dense, voluminous, rapid flash foam",
        "Provides excellent skin conditioning and soft feel",
        "Easily biodegradable"
      ],
      limitations: [
        "Sensitive to hard water (forms soap scum)",
        "High raw pH (alkaline) is required to keep soap soluble; not stable below pH 8.0"
      ],
      alternatives: ["Sodium Laureth Sulfate", "Ammonium Lauryl Sulfate", "Lauryl Glucoside"],
      ecoFriendliness: "Excellent eco-friendliness. 100% renewable coconut oil base."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "10.0%",
      premium: "30.0%",
      maximum: "50.0%",
      household: "5% - 25% in liquid soaps",
      industrial: "10% - 40% in natural spray cleaners"
    },
    performance: {
      cleaning: 7,
      foam: 9,
      oilRemoval: 7,
      greaseCutting: 6,
      skinMildness: 8,
      hardWater: 3
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>98% in 14 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "Low aquatic hazard",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Gloves"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Mild Skin Irritation (Category 3)"],
      hazardStatements: ["H319: Causes serious eye irritation", "H316: Causes mild skin irritation"],
      precautionaryStatements: [
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Flush eyes with clean water. Wash skin with water.",
      msdsSummary: "Highly safe natural liquid soap. Avoid extremely acidic mixtures."
    },
    chargeType: "Anionic",
    hlb: "N/A",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["Kao Corporation", "Lubrizol"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  },
  {
    id: "sodium-soap",
    commonName: "Sodium Soap (Sodium Cocoate)",
    chemicalName: "Sodium Cocoate",
    iupacName: "sodium cocoate",
    casNumber: "61789-31-9",
    molecularFormula: "RCOONa (mixture)",
    molecularWeight: "230 - 260 g/mol (average)",
    inciName: "Sodium Cocoate",
    tradeNames: ["Sodium Cocoate Paste", "Pure Coconut Sodium Soap"],
    synonyms: ["Sodium Soap", "Sodium Palm Kernylate", "Coconut Soap Sodium Salt"],
    category: "Anionic Surfactants",
    suppliers: ["KLK OLEO", "Godrej", "Evidence Not Available — Requires Manual Verification"],
    marketNames: {
      indian: "Sodium Cocoate Pure Soap",
      international: "Sodium Cocoate Solid/Paste"
    },
    physicalProperties: {
      appearance: "Waxy solid or thick paste",
      color: "White to pale yellow",
      odor: "Faint coconut fatty aroma",
      activeMatter: "60% - 98% (depending on moisture level)",
      pH: "Typical Range: 9.5 - 11.0 (1% solution) (Typical Range — Varies by Supplier/Grade)",
      density: "Typical Range: 1.04 g/cm³ (Typical Range — Varies by Supplier/Grade)",
      viscosity: "N/A (Solid/Semi-solid)",
      solubility: "Soluble in warm water",
      shelfLife: "36 Months",
      storageConditions: "Store in a dry cool place. Keep container closed to avoid drying."
    },
    functionalInfo: {
      whatIsIt: "Sodium salt of coconut oil fatty acids, produced by saponifying coconut oil with sodium hydroxide (NaOH).",
      whyUsed: "Used as a major cleaning, foaming, and emulsifying component in natural laundry soap bars, toilet soaps, and industrial solid cleaning blocks.",
      advantages: [
        "100% natural, plant-based",
        "Extremely high and rapid flash foam",
        "Strong grease and oil cutting power",
        "Excellent biodegradability"
      ],
      limitations: [
        "Prone to precipitation in hard water (calcium soap)",
        "Must be kept in alkaline pH (> 9.0) to remain stable"
      ],
      alternatives: ["Sodium Lauroyl Isethionate", "SLES"],
      ecoFriendliness: "100% plant-derived carbon. Ultra eco-friendly."
    },
    dosage: {
      minimum: "5.0%",
      recommended: "20.0%",
      premium: "70.0%",
      maximum: "95.0%",
      household: "5% - 80% in laundry bars",
      industrial: "10% - 30% in lubricants"
    },
    performance: {
      cleaning: 8,
      foam: 9,
      oilRemoval: 8,
      greaseCutting: 8,
      skinMildness: 6,
      hardWater: 3
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>98% in 10 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "Low aquatic hazard",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Gloves"],
      ghsClassification: ["Eye Irritation (Category 2A)", "Skin Irritation (Category 2)"],
      hazardStatements: ["H319: Causes serious eye irritation", "H315: Causes skin irritation"],
      precautionaryStatements: [
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Rinse eyes thoroughly with water. Wash skin.",
      msdsSummary: "Highly safe natural soap paste. Avoid acidic conditions which decompose it."
    },
    chargeType: "Anionic",
    hlb: "N/A",
    approxPrice: "Evidence Not Available — Requires Manual Verification",
    manufacturers: ["KLK OLEO", "Godrej"],
    reachStatus: "Evidence Not Available — Requires Manual Verification",
    epaStatus: "Evidence Not Available — Requires Manual Verification"
  }
];
