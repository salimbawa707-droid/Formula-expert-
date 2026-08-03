import { Chemical } from "../types";

export const POLYMERS_THICKENERS_ENZYMES: Chemical[] = [
  {
    id: "pvp",
    commonName: "PVP (Polyvinylpyrrolidone)",
    chemicalName: "Polyvinylpyrrolidone",
    iupacName: "poly(1-vinylpyrrolidin-2-one)",
    casNumber: "9003-39-8",
    molecularFormula: "(C6H9NO)n",
    molecularWeight: "40,000 - 360,000 g/mol (various K-grades)",
    inciName: "PVP",
    tradeNames: ["Luviskol", "Kollidon", "Sokalan HP 56", "Plasdone"],
    synonyms: ["Povidone", "Polyvidone", "1-Vinyl-2-pyrrolidone polymer"],
    category: "Polymers",
    suppliers: ["BASF SE", "Ashland", "Nippon Shokubai", "Boai NKY Pharmaceutical"],
    marketNames: {
      indian: "PVP K-30 / PVP K-90 Powder",
      international: "PVP K-30 Polymer",
      hindi: "पीवीपी पॉलीमर (रंग रोकने वाला)"
    },
    physicalProperties: {
      appearance: "Free-flowing hygroscopic powder",
      color: "White to Light Yellow",
      odor: "Odorless or faint characteristic",
      activeMatter: "95% Min",
      pH: "3.0 - 7.0 (5% aqueous solution)",
      density: "1.20 g/cm³",
      viscosity: "Solid (forms high-viscosity gels in water depending on K-value)",
      solubility: "Highly soluble in water, alcohol, and polar solvents. Insoluble in hydrocarbons.",
      boilingPoint: "N/A",
      meltingPoint: "150°C (decomposes)",
      shelfLife: "36 Months",
      storageConditions: "Highly hygroscopic. Store in cool, dry warehouse. Keep containers tightly sealed to prevent water absorption."
    },
    functionalInfo: {
      whatIsIt: "Synthetic nonionic water-soluble polymer produced by free-radical polymerization of N-vinylpyrrolidone.",
      whyUsed: "Used as a state-of-the-art **dye transfer inhibitor (DTI)** in laundry detergents. It acts as a molecular trap, binding 'bleeding' dyes in the wash water and preventing them from redepositing onto lighter colored fabrics.",
      advantages: [
        "Incredible dye-trapping and dye-transfer inhibition",
        "Keeps colored clothes vibrant and whites pure",
        "Fully soluble in liquid formulations without clouding",
        "Extremely safe, non-toxic, and skin-friendly"
      ],
      limitations: [
        "Relatively expensive specialty polymer",
        "Does not possess direct cleaning or stain-cutting power",
        "Moderate biodegradability under standard anaerobic digestions"
      ],
      alternatives: ["PVP-NO (Polyvinylpyrrolidone-N-oxide)", "Modified Polyacrylates"],
      ecoFriendliness: "Low ecotoxicity, does not bioaccumulate, but breaks down slowly in wastewater plants."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.4%",
      premium: "1.0%",
      maximum: "2.0%",
      household: "0.2% - 0.6% in color-care liquid laundry detergents",
      industrial: "0.3% - 1.0% in commercial hospital linen washes"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 10,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Slow bio-degradation but highly eliminated in sewer sludge adsorption",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Water-soluble polymer, does not form persistent microplastics",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (during bulk handling)"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution. Wash skin.",
      msdsSummary: "Highly safe pharmaceutical-grade polymer. Extremely low risk."
    }
  },
  {
    id: "sodium-polyacrylate",
    commonName: "Sodium Polyacrylate",
    chemicalName: "Sodium Polyacrylate Homopolymer",
    iupacName: "sodium poly(prop-2-enoate)",
    casNumber: "9003-04-7",
    molecularFormula: "(C3H3NaO2)n",
    molecularWeight: "4000 - 5000 g/mol (dispersant grade)",
    inciName: "Sodium Polyacrylate",
    tradeNames: ["Sokalan PA 25", "Acusol 445NG", "Alcosperse 602"],
    synonyms: ["Polyacrylic Acid Sodium Salt", "Sodium Polyacrylate Dispersant"],
    category: "Polymers",
    suppliers: ["BASF SE", "Dow Chemical", "Nouryon", "Arkema (Coatex)"],
    marketNames: {
      indian: "Polyacrylate Liquid (Dispersant)",
      international: "Sodium Polyacrylate 45% Liquid",
      hindi: "सोडियम पॉलीएक्रिलेट (एंटी-स्केलिंग तरल)"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid",
      color: "Pale Amber to Straw Yellow",
      odor: "Faint, acrylic",
      activeMatter: "44% - 46% (rest is water)",
      pH: "7.0 - 8.5 (as is)",
      density: "1.30 g/cm³",
      viscosity: "100 - 500 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-2°C",
      shelfLife: "24 Months",
      storageConditions: "Store above 5°C to avoid freezing. Keep containers sealed tightly."
    },
    functionalInfo: {
      whatIsIt: "Synthetic acrylic polymer salt optimized for inorganic soil dispersion.",
      whyUsed: "Used as an **anti-redeposition and anti-scaling agent** in washing powders and liquid detergents. It wraps around precipitated calcium and magnesium minerals, preventing them from adhering to clothing fibers or forming white water-stone (scale) deposits on washing machine heating coils.",
      advantages: [
        "Incredible calcium scale inhibition and dispersency",
        "Prevents ash deposition (greying) on clothes",
        "Boosts detergent powder spray drying structure",
        "Maintains liquid detergent clarity in hard water"
      ],
      limitations: [
        "Synthesized from petroleum-derived acrylic monomers",
        "Poor raw biological degradation (non-biodegradable, though eliminated in wastewater treatment via sludge adsorption)"
      ],
      alternatives: ["Sodium Citrate", "Inulin Derivatives", "Carboxymethyl Inulin"],
      ecoFriendliness: "Safe aquatic profile, low ecotoxicity. Binding properties help reduce total mineral salt releases."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "1.0%",
      premium: "3.0%",
      maximum: "5.0%",
      household: "0.5% - 2.0% in concentrated liquid laundry and automatic dishwashing gels",
      industrial: "1.5% - 4.0% in industrial bottle wash and high-temperature boiler cleansers"
    },
    performance: {
      cleaning: 5,
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 3,
      skinMildness: 9,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Poor (<10% OECD 301), but strongly binds to sewage sludge and gets filtered out safely",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Soluble polymer; non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 1000 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Highly stable liquid polymer. Non-hazardous, safe handling."
    }
  },
  {
    id: "maleic-acrylic-copolymer",
    commonName: "Maleic-Acrylic Copolymer",
    chemicalName: "Acrylic Acid-Maleic Anhydride Copolymer Sodium Salt",
    iupacName: "sodium prop-2-enoate;sodium (Z)-but-2-enedioate copolymer",
    casNumber: "52255-49-9",
    molecularFormula: "(C4H2Na2O4)x·(C3H3NaO2)y",
    molecularWeight: "70,000 g/mol (average)",
    inciName: "Sodium Acrylic Acid/MA Copolymer",
    tradeNames: ["Sokalan CP 5", "Acusol 505N", "Alcosperse 175"],
    synonyms: ["Acrylic Maleic Copolymer Sodium Salt", "Detergent Copolymer CP5"],
    category: "Polymers",
    suppliers: ["BASF SE", "Dow Chemical", "Nouryon", "Fine Organic Industries"],
    marketNames: {
      indian: "CP5 Copolymer Liquid",
      international: "Acrylic-Maleic Copolymer 40% Liquid",
      hindi: "सीपी५ कॉपोलीमर (एंटी-स्केलिंग)"
    },
    physicalProperties: {
      appearance: "Clear to slightly cloudy viscous liquid",
      color: "Light Amber",
      odor: "Faint, characteristic",
      activeMatter: "39% - 41%",
      pH: "7.0 - 8.0 (as is)",
      density: "1.28 g/cm³",
      viscosity: "1000 - 3000 cPs",
      solubility: "Completely soluble in water in all proportions",
      boilingPoint: "100°C",
      meltingPoint: "-3°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool dry warehouse. Protect from winter freezing."
    },
    functionalInfo: {
      whatIsIt: "Synthetic copolymer of maleic acid and acrylic acid, fully neutralized with sodium salt.",
      whyUsed: "Used as a heavy-duty **anti-scaling and soil-suspending agent** in automatic dishwasher detergents, industrial washing powders, and institutional laundry bases. Performs exceptionally well at high temperatures and high alkalinity.",
      advantages: [
        "Unbeatable calcium carbonate and calcium phosphate scale inhibition",
        "Phenomenal soil dispersing power under hot industrial washing conditions",
        "Prevents hard fabric incrustation and fabric graying",
        "Fully stable under chlorine bleach and strong peroxides"
      ],
      limitations: [
        "Petroleum based raw material",
        "Virtually non-biodegradability (OECD 301)"
      ],
      alternatives: ["Sodium Polyacrylate", "Modified Inulins"],
      ecoFriendliness: "Safe to wastewater plants due to flocculation and sewage sludge adsorption."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "4.0%",
      maximum: "8.0%",
      household: "1.0% - 3.0% in heavy-duty automated laundry powders",
      industrial: "2.0% - 6.0% in high-temp commercial dishwasher tabs"
    },
    performance: {
      cleaning: 6,
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 4,
      skinMildness: 9,
      hardWater: 10
    },
    sustainability: {
      biodegradability: "Poorly biodegradable, but rapidly eliminated in wastewater treatment via sedimentation",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Soluble polymer; non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 500 mg/L",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Highly stable and safe industrial copolymer. Highly non-toxic."
    }
  },
  {
    id: "hec",
    commonName: "HEC (Hydroxyethyl Cellulose)",
    chemicalName: "Hydroxyethyl Cellulose",
    iupacName: "hydroxyethyl cellulose",
    casNumber: "9004-62-0",
    molecularFormula: "C36H70O30 (approx average)",
    molecularWeight: "90,000 - 1,300,000 g/mol",
    inciName: "Hydroxyethylcellulose",
    tradeNames: ["Natrosol", "Cellosize", "Tylose H-Series", "Bermocoll"],
    synonyms: ["Cellulose 2-Hydroxyethyl Ether", "HEC Polymer"],
    category: "Thickeners",
    suppliers: ["Ashland Inc.", "Dow Chemical", "Shin-Etsu", "SE Tylose"],
    marketNames: {
      indian: "HEC Thickener Powder (Natrosol)",
      international: "Hydroxyethyl Cellulose High Viscosity",
      hindi: "एचईसी पाउडर (नेट्रोसोल गाढ़ापन बढ़ाने वाला)"
    },
    physicalProperties: {
      appearance: "Granular white to off-white powder",
      color: "White",
      odor: "Odorless",
      activeMatter: "98% Min",
      pH: "6.0 - 8.5 (1% aqueous solution)",
      density: "0.60 g/cm³ (bulk density)",
      viscosity: "Solid (forms 1500 - 5500 cPs gels at 1% in water)",
      solubility: "Soluble in hot or cold water, forming a clear, smooth pseudoplastic hydrogel.",
      boilingPoint: "N/A",
      meltingPoint: "290°C (decomposes)",
      shelfLife: "36 Months (extremely shelf-stable if dry)",
      storageConditions: "Store in original bags in dry, cool warehouse. Protect from high humidity."
    },
    functionalInfo: {
      whatIsIt: "Nonionic water-soluble polymer derived from natural wood-pulp cellulose reacted with ethylene oxide.",
      whyUsed: "Used as a premium nonionic **thickening and rheology modifier** in liquid detergents, acid toilet cleaners, and hand washes. Highly preferred over anionic polymers because its nonionic structure is perfectly stable across wide pH ranges (pH 2 - 12) and doesn't crash in salt or cationic softeners.",
      advantages: [
        "Exceptional thickening efficiency, yielding gorgeous, crystal-clear gels",
        "Highly stable in high-acid formulas (like sulfamic toilet cleansers)",
        "Derived from 100% natural, renewable wood pulp",
        "Superb skin feel, completely non-toxic and hypoallergenic"
      ],
      limitations: [
        "Requires heating or alkalizing (neutral pH 8.5+) to disperse and hydrate without forming sticky lumps (called fish-eyes)",
        "Susceptible to enzymatic degradation (cellulase enzymes in laundry will liquefy HEC gels)"
      ],
      alternatives: ["Xanthan Gum", "Acrylates Copolymer", "CMC"],
      ecoFriendliness: "Highly green. High biodegradation, plant-based source, zero environmental risk."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "0.8%",
      premium: "1.5%",
      maximum: "2.5%",
      household: "0.5% - 1.2% in clear liquid handwash and toilet cleaners",
      industrial: "0.4% - 1.5% in high-acid chemical descaling gels"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Slowly but fully biodegradable under aerobic sewer conditions",
      plantBasedPct: 85,
      petroleumBasedPct: 15,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / cellulose derivative",
      aquaticToxicity: "LC50 (Fish) > 5000 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Standard Dust Mask (when pouring powder)", "Safety Glasses"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P232: Protect from moisture."],
      firstAid: "Rinse eyes with water as precaution. Blow nose if dust inhaled.",
      msdsSummary: "Highly safe cosmetic grade polymer. Spillages are extremely slippery when wet; clean up immediately."
    }
  },
  {
    id: "xanthan-gum",
    commonName: "Xanthan Gum",
    chemicalName: "Xanthan Gum",
    iupacName: "xanthan gum",
    casNumber: "11138-66-2",
    molecularFormula: "C35H49O29 (approx unit)",
    molecularWeight: "1,000,000 - 2,000,000 g/mol",
    inciName: "Xanthan Gum",
    tradeNames: ["Keltrol", "Rhodopol", "Xanthural", "Jungbunzlauer Xanthan"],
    synonyms: ["Corn Sugar Gum", "Xantham Gum"],
    category: "Thickeners",
    suppliers: ["CP Kelco", "Jungbunzlauer", "Cargill", "Deasen Group"],
    marketNames: {
      indian: "Xanthan Gum Powder",
      international: "Xanthan Gum Food / Tech Grade",
      hindi: "जैंथन गम (प्राकृतिक गाढ़ापन बढ़ाने वाला)"
    },
    physicalProperties: {
      appearance: "Fine cream-colored powder",
      color: "Cream to Pale Yellow",
      odor: "Odorless or faint typical",
      activeMatter: "98% Min",
      pH: "6.0 - 8.0 (1% aqueous solution)",
      density: "0.65 g/cm³",
      viscosity: "Solid (highly pseudoplastic gel, 1200 - 1800 cPs at 1% in water)",
      solubility: "Soluble in hot or cold water, forming thick shear-thinning (pseudoplastic) hydrogels. Insoluble in alcohol.",
      boilingPoint: "N/A",
      meltingPoint: "Decomposes",
      shelfLife: "36 Months",
      storageConditions: "Store in dry, cool warehouse. Keep sealed tightly to prevent moisture clumping."
    },
    functionalInfo: {
      whatIsIt: "Natural anionic polysaccharide polymer produced by fermentation of glucose/sucrose by the bacterium *Xanthomonas campestris*.",
      whyUsed: "Used as a natural **thickener, stabilizer, and suspension agent** in organic liquid detergents, automatic dishwash gels, toilet descalers, and cream cleaners. Outstanding ability to suspend heavy abrasive powders (like calcium carbonate) in cream scrubs.",
      advantages: [
        "100% bio-based, natural, and exceptionally rapidly biodegradable",
        "Unique shear-thinning rheology (pumps/pours easily, yet clings perfectly to vertical walls)",
        "Extremely stable across extremely wide pH (pH 2 - 12) and high salt content",
        "Incredible suspension stability for physical particles"
      ],
      limitations: [
        "Yields slightly opaque or hazy gels, preventing use in crystal-clear liquids",
        "Prone to microbial decay if preservative system is weak",
        "Can have a slightly slimy or sticky skin feel compared to synthetic thickeners"
      ],
      alternatives: ["HEC", "Guar Gum", "Acrylates Copolymer"],
      ecoFriendliness: "Exemplary green profile. Fully organic, safe, renewable."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.5%",
      premium: "1.2%",
      maximum: "2.0%",
      household: "0.3% - 1.0% in natural/organic liquid laundry and dish gels",
      industrial: "0.5% - 1.5% in commercial acidic toilet descalers and abrasive creams"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>99% in 48 hours)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / natural polysaccharide",
      aquaticToxicity: "LC50 (Fish) > 10,000 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (during bulk transfer)"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P232: Protect from moisture."],
      firstAid: "Rinse eyes with water as precaution.",
      msdsSummary: "Highly safe, natural food grade polysaccharide. Extremely slippery when wet."
    }
  },
  {
    id: "acrylates-copolymer",
    commonName: "Acrylates Copolymer",
    chemicalName: "Alkali-Swellable Acrylic Emulsion (ASE)",
    iupacName: "ethyl prop-2-enoate;2-methylprop-2-enoic acid copolymer",
    casNumber: "25212-88-8",
    molecularFormula: "(C5H8O2·C4H6O2)x",
    molecularWeight: "300,000 - 800,000 g/mol",
    inciName: "Acrylates Copolymer",
    tradeNames: ["Acusol 820", "Carbopol Aqua SF-1", "Rheovis AT 120"],
    synonyms: ["Alkali-Swellable Emulsion (ASE)", "Acrylic Polymer Thickener"],
    category: "Thickeners",
    suppliers: ["Lubrizol", "Dow Chemical", "BASF SE", "3V Sigma"],
    marketNames: {
      indian: "SF-1 Thickener Liquid",
      international: "Acrylates Copolymer 30% Emulsion",
      hindi: "एक्रिलेट्स कॉपोलीमर (गाढ़ापन बढ़ाने वाला तरल)"
    },
    physicalProperties: {
      appearance: "Milky white thin liquid emulsion",
      color: "White",
      odor: "Mild, acrylic",
      activeMatter: "29% - 31% (rest is water)",
      pH: "2.2 - 3.8 (acidic emulsion)",
      density: "1.05 g/cm³",
      viscosity: "10 - 40 cPs (very low viscosity in acidic raw state; skyrockets once neutralized)",
      solubility: "Soluble in water after neutralization with an alkali to pH > 7.0",
      boilingPoint: "100°C",
      meltingPoint: "0°C",
      shelfLife: "18 Months",
      storageConditions: "Do not freeze. Keep container sealed tightly. Store above 5°C and below 40°C."
    },
    functionalInfo: {
      whatIsIt: "Anionic, alkali-swellable acrylic polymer emulsion (ASE).",
      whyUsed: "Used as a high-performance **rheology modifier and thickener** in crystal-clear liquid handwashes, pearlescent shower gels, and high-surfactant liquid dish washes. Viscosity triggers instantly when the pH is raised above 6.5, opening up the polymer chain.",
      advantages: [
        "Yields beautiful, glass-clear liquid gels of absolute premium quality",
        "Exceptional suspension of air bubbles, pearlescent beads, and exfoliants",
        "Enhances smooth flowable pouring aesthetics of liquid products",
        "Synergistic viscosity build-up with common salt"
      ],
      limitations: [
        "Completely crashes in viscosity if pH drops below 6.0",
        "Synthesized from petroleum-derived monomers",
        "Low tolerance to highly concentrated electrolytes (such as massive salt content)"
      ],
      alternatives: ["HEC", "Xanthan Gum", "PEG-150 Distearate"],
      ecoFriendliness: "Low aquatic toxicity. Strong sewage sludge adsorption filters it out."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "5.0% (as raw 30% emulsion, corresponding to 1.5% active polymer)",
      premium: "8.0%",
      maximum: "12.0%",
      household: "3.0% - 7.0% in high-clarity premium hand soap and dish gels",
      industrial: "Not typically used in extremely strong acidic or alkaline cleaners"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 9,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Poorly biodegradable, but eliminated from water via wastewater treatment adsorption",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Soluble polymer; non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS (raw emulsion is mildly acidic)"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution. Wash skin with soap and water.",
      msdsSummary: "Highly stable liquid thickener. Raw liquid is mildly acidic, handle with light PPE. Thickens spectacularly upon NaOH neutralization."
    }
  },
  {
    id: "protease",
    commonName: "Protease Enzyme",
    chemicalName: "Subtilisin Protease",
    iupacName: "subtilisin",
    casNumber: "9014-01-1",
    molecularFormula: "Macromolecule (Protein)",
    molecularWeight: "27,000 g/mol (approx protein structure)",
    inciName: "Protease",
    tradeNames: ["Savinase", "Esperase", "Purafect", "Opticlean"],
    synonyms: ["Serine Endopeptidase", "Detergent Protease", "Savinase Granules / Liquid"],
    category: "Enzymes",
    suppliers: ["Novozymes (Novonesis)", "DuPont (Danisco/IFF)", "BASF SE", "Amano Enzyme"],
    marketNames: {
      indian: "Protease Liquid (Protein Enzyme)",
      international: "Protease 16L / Savinase 16L",
      hindi: "प्रोटीज़ एंजाइम (दाग मिटाने वाला तरल)"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid (or speckled dust-free granules for powders)",
      color: "Light Brown",
      odor: "Faint, characteristic yeast-like/fermentation odor",
      activeMatter: "100% active protein enzymatic solution",
      pH: "7.0 - 9.0 (as is)",
      density: "1.08 g/cm³",
      viscosity: "10 - 30 cPs",
      solubility: "Completely soluble in water. Insoluble in organic solvents.",
      boilingPoint: "102°C",
      meltingPoint: "-2°C",
      shelfLife: "12 Months (sensitive to high heat, degrades in activity over time)",
      storageConditions: "Store strictly below 25°C (refrigerated storage at 4°C is optimal). Keep protected from direct heat and strong oxidizing agents."
    },
    functionalInfo: {
      whatIsIt: "Naturally derived catalytic protein (serine protease enzyme) produced by fermentation of *Bacillus licheniformis* or *Bacillus amyloliquefaciens*.",
      whyUsed: "Used as the ultimate bio-catalytic **stain remover** in laundry washing powders and liquids. It breaks down insoluble protein stains (blood, grass, egg, milk, sweat, cocoa, gravy) into highly water-soluble amino acids and peptides that are effortlessly washed away by surfactants.",
      advantages: [
        "Incredible stain removal on complex organic food and bodily stains",
        "Saves immense washing energy by cleaning perfectly at cold temperatures (20°C - 30°C)",
        "Biodegradable, completely natural, and eco-preferred",
        "Reduces total required surfactant levels in formulation"
      ],
      limitations: [
        "Highly sensitive to heat (denatures and dies permanently above 50°C)",
        "Can hydrolyze and destroy other proteins (like other enzymes) in liquid detergents unless an enzyme stabilizer (borax, MPG, or calcium) is present",
        "Unstable in the presence of strong chlorine bleach"
      ],
      alternatives: ["Sodium Percarbonate (chemical oxidizer)", "High pH caustic washes"],
      ecoFriendliness: "Exemplary. Fully biodegradable, non-toxic, reduces carbon footprint of laundry by enabling cold washes."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "0.6%",
      premium: "1.5%",
      maximum: "3.0%",
      household: "0.4% - 1.0% in premium liquid laundry and powder detergents",
      industrial: "Not typically used in highly caustic or high-temperature commercial laundries"
    },
    performance: {
      cleaning: 10, // unbeatable on protein stains
      foam: 1,
      oilRemoval: 3,
      greaseCutting: 2,
      skinMildness: 8, // safe in dilute wash; concentrate can irritate skin on long exposure
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 7 days, organic protein)",
      plantBasedPct: 100, // purely bio-fermented
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / protein",
      aquaticToxicity: "LC50 (Fish) ~ 25 mg/L (enzymatic activity quickly neutralizes in river water)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat", "Dust Mask (if handling powdered enzymes to prevent allergy)"],
      ghsClassification: ["Sensitization - Respiratory (Category 1)"],
      hazardStatements: ["H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled"],
      precautionaryStatements: [
        "P261: Avoid breathing dust/fume/gas/mist/vapors/spray.",
        "P284: [In case of inadequate ventilation] wear respiratory protection."
      ],
      firstAid: "If inhaled, move person to fresh air. If breathing is difficult, seek medical help. Wash skin or eyes with water.",
      msdsSummary: "Enzymes are natural proteins. Powdered dust is a strong sensitizer; handle liquid grades to completely avoid dust inhalation."
    }
  },
  {
    id: "amylase",
    commonName: "Amylase Enzyme",
    chemicalName: "Alpha-Amylase",
    iupacName: "alpha-amylase",
    casNumber: "9000-90-2",
    molecularFormula: "Protein Macromolecule",
    molecularWeight: "50,000 g/mol",
    inciName: "Amylase",
    tradeNames: ["Termamyl", "Stainzyme", "Purastar", "Amylase 12L"],
    synonyms: ["1,4-alpha-D-glucan glucanohydrolase", "Detergent Amylase"],
    category: "Enzymes",
    suppliers: ["Novozymes (Novonesis)", "DuPont (Danisco/IFF)", "BASF SE", "Amano Enzyme"],
    marketNames: {
      indian: "Amylase Liquid (Starch Enzyme)",
      international: "Amylase 12L / Termamyl",
      hindi: "एमाइलेज एंजाइम (स्टार्च दाग हटाने वाला)"
    },
    physicalProperties: {
      appearance: "Clear to hazy thin liquid",
      color: "Brown",
      odor: "Characteristic fermentation odor",
      activeMatter: "100% active protein",
      pH: "6.5 - 8.5 (as is)",
      density: "1.06 g/cm³",
      viscosity: "10 - 25 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "12 Months (refrigeration highly recommended)",
      storageConditions: "Store below 25°C. Highly sensitive to temperature and bleaching chemicals."
    },
    functionalInfo: {
      whatIsIt: "Bio-fermented catalytic enzyme that specifically hydrolyzes alpha-1,4-glucosidic bonds in starch polymers.",
      whyUsed: "Used to dissolve complex starch-based stains (rice, baby food, potato, porridge, custard, pasta, chocolate syrup, gravies) in laundry and automatic dishwashing detergents. Starch acts as an organic 'glue', capturing dirt; amylase melts this glue.",
      advantages: [
        "Specifically targets tough carbohydrate and starch-based stains",
        "Prevents starch buildup on fabrics (which causes a stiff skin-feel)",
        "Exceptional performance at low temperatures",
        "Fully organic and rapidly biodegradable"
      ],
      limitations: [
        "Unstable in formula pH values above 10.0 or below 6.0",
        "Deactivated by oxidizing bleach (requires enzymatic stabilizer)"
      ],
      alternatives: ["Hot water heavy alkaline wash"],
      ecoFriendliness: "Superb. Natural protein, eco-preferred bio-catalyst."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.4%",
      premium: "1.0%",
      maximum: "2.0%",
      household: "0.2% - 0.6% in premium liquid laundry and automatic dishwashing liquids",
      industrial: "Not typically used in harsh hot commercial washes"
    },
    performance: {
      cleaning: 9, // superb on starch
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 9,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 7 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / protein",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (if handling dusts)"],
      ghsClassification: ["Sensitization - Respiratory (Category 1)"],
      hazardStatements: ["H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled"],
      precautionaryStatements: [
        "P261: Avoid breathing dust/fume/gas/mist/vapors/spray.",
        "P284: [In case of inadequate ventilation] wear respiratory protection."
      ],
      firstAid: "Move person to fresh air. Rinse eyes or skin with water.",
      msdsSummary: "Highly safe protein. Avoid producing aerosol mists or dust inhalation."
    }
  },
  {
    id: "lipase",
    commonName: "Lipase Enzyme",
    chemicalName: "Triacylglycerol Lipase",
    iupacName: "triacylglycerol acylhydrolase",
    casNumber: "9001-62-1",
    molecularFormula: "Protein Macromolecule",
    molecularWeight: "32,000 g/mol",
    inciName: "Lipase",
    tradeNames: ["Lipolase", "Lipex", "Purafect Lipase"],
    synonyms: ["Glycerol Ester Hydrolase", "Detergent Lipase"],
    category: "Enzymes",
    suppliers: ["Novozymes (Novonesis)", "DuPont (Danisco/IFF)", "BASF SE", "Amano Enzyme"],
    marketNames: {
      indian: "Lipase Liquid (Oil Enzyme)",
      international: "Lipex 100L / Lipolase",
      hindi: "लाइपेज एंजाइम (वसा दाग हटाने वाला)"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid",
      color: "Light Brown",
      odor: "Faint characteristic fermentation odor",
      activeMatter: "100% active protein",
      pH: "7.0 - 9.0 (as is)",
      density: "1.05 g/cm³",
      viscosity: "10 - 25 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "12 Months (keep cool)",
      storageConditions: "Store below 25°C. Refrigerate if possible. Avoid heat and oxidizers."
    },
    functionalInfo: {
      whatIsIt: "Naturally fermented catalytic enzyme that hydrolyzes ester bonds of insoluble triglycerides (fats, sebum, and oils).",
      whyUsed: "Used as a high-performance **fat-cutting stain booster** in laundry detergents. It targets oil and grease stains (butter, cooking oil, grease, collar soil, cosmetic makeup, lipstick) during the active wash cycle.",
      advantages: [
        "Outstanding degradation of fatty food and cosmetic stains",
        "Continues cleaning fabrics even during the drying cycle (unique property of Lipase)",
        "Saves surfactant consumption in formulations",
        "Fully organic, green, renewable"
      ],
      limitations: [
        "Can sometimes generate a faint 'butyric acid' (fatty/sour) odor on clothes if fats are partially hydrolyzed but not fully rinsed away (overcome by optimized enzyme ratios)",
        "Degraded by high pH (>9.5) during hot washes"
      ],
      alternatives: ["Heavy anionic/nonionic surfactant blends"],
      ecoFriendliness: "Outstanding. Green biological catalyst."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.4%",
      premium: "1.0%",
      maximum: "2.0%",
      household: "0.2% - 0.5% in premium liquid laundry detergents",
      industrial: "Not used in hot commercial washes"
    },
    performance: {
      cleaning: 9, // superb on fatty food and lipstick
      foam: 1,
      oilRemoval: 10,
      greaseCutting: 9,
      skinMildness: 9,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 7 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / protein",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (if dry granules)"],
      ghsClassification: ["Sensitization - Respiratory (Category 1)"],
      hazardStatements: ["H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled"],
      precautionaryStatements: [
        "P261: Avoid breathing dust/fume/gas/mist/vapors/spray.",
        "P284: [In case of inadequate ventilation] wear respiratory protection."
      ],
      firstAid: "Move person to fresh air. Rinse eyes or skin with water.",
      msdsSummary: "Highly safe biological catalyst. Control inhalation."
    }
  },
  {
    id: "cellulase",
    commonName: "Cellulase Enzyme",
    chemicalName: "Endoglucanase / Cellulase",
    iupacName: "4-beta-D-glucan 4-glucanohydrolase",
    casNumber: "9012-54-8",
    molecularFormula: "Protein Macromolecule",
    molecularWeight: "45,000 g/mol",
    inciName: "Cellulase",
    tradeNames: ["Celluzyme", "Carezyme", "Puradax", "Endolase"],
    synonyms: ["Beta-Glucanase", "Detergent Cellulase"],
    category: "Enzymes",
    suppliers: ["Novozymes (Novonesis)", "DuPont (Danisco/IFF)", "BASF SE", "Amano Enzyme"],
    marketNames: {
      indian: "Cellulase Liquid (Fiber Care Enzyme)",
      international: "Carezyme 1000L / Celluzyme",
      hindi: "सेल्युलेज एंजाइम (कपड़ो की चमक बढ़ाने वाला)"
    },
    physicalProperties: {
      appearance: "Clear to slightly hazy liquid",
      color: "Brown",
      odor: "Faint characteristic fermentation odor",
      activeMatter: "100% active protein",
      pH: "6.0 - 8.0 (as is)",
      density: "1.04 g/cm³",
      viscosity: "10 - 25 cPs",
      solubility: "Completely soluble in water",
      boilingPoint: "100°C",
      meltingPoint: "-1°C",
      shelfLife: "12 Months",
      storageConditions: "Store below 25°C. Refrigerate if possible. Avoid heat and oxidizing bleaches."
    },
    functionalInfo: {
      whatIsIt: "Naturally bio-fermented enzyme that specifically hydrolyzes beta-1,4-glycosidic bonds in cellulose polymers.",
      whyUsed: "Used as a high-tech **fabric-care and color-rejuvenator** in premium laundry detergents. Instead of removing soil, cellulase clips away the micro-fibrils (fuzzy micro-lint) that break off cotton fibers during wear. This removes the fuzzy lint layer that traps dirt and scatters light, restoring vibrant colors and smoothing fabrics.",
      advantages: [
        "Restores dull colored clothes to their original bright, vibrant shades",
        "Prevents fabric pilling (lint balls) and keeps cotton fabrics soft",
        "Outstanding particulate soil removal (detaches dirt trapped in micro-fuzz)",
        "Biodegradable, natural, plant-supportive action"
      ],
      limitations: [
        "Overdosage or prolonged exposure to high-strength cellulase can physically weaken cotton fabric fibers over multiple washes",
        "Must be formulated at pH 6.5 - 8.5 for stable performance"
      ],
      alternatives: ["Cationic fabric softeners (which only coat the fibers, rather than trimming lint)"],
      ecoFriendliness: "Outstanding. Sourced from fermentation, completely green."
    },
    dosage: {
      minimum: "0.1%",
      recommended: "0.3%",
      premium: "0.8%",
      maximum: "1.5%",
      household: "0.2% - 0.5% in color-protection laundry formulations",
      industrial: "Not used in hot commercial washes"
    },
    performance: {
      cleaning: 5, // boosts wash aesthetics
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 9,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 7 days)",
      plantBasedPct: 100,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / protein",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (if dry granules)"],
      ghsClassification: ["Sensitization - Respiratory (Category 1)"],
      hazardStatements: ["H334: May cause allergy or asthma symptoms or breathing difficulties if inhaled"],
      precautionaryStatements: [
        "P261: Avoid breathing dust/fume/gas/mist/vapors/spray.",
        "P284: [In case of inadequate ventilation] wear respiratory protection."
      ],
      firstAid: "Move person to fresh air. Rinse skin/eyes with water.",
      msdsSummary: "Highly safe bio-catalyst. Avoid aerosol creation or breathing dust."
    }
  },
  {
    id: "dms-x",
    commonName: "Optical Brightener DMS-X",
    chemicalName: "Disodium 4,4'-bis[(4-anilino-6-morpholino-1,3,5-triazin-2-yl)amino]stilbene-2,2'-disulfonate",
    iupacName: "disodium;2-[4-[2-[4-[[4-anilino-6-(morpholin-4-yl)-1,3,5-triazin-2-yl]amino]-2-sulfonatophenyl]ethenyl]-3-sulfonatophenyl]amino]-6-(morpholin-4-yl)-1,3,5-triazin-4-yl]amino]benzene-1-sulfonate",
    casNumber: "16090-02-1",
    molecularFormula: "C40H38Na2N12O8S2",
    molecularWeight: "924.94 g/mol",
    inciName: "Disodium Anilinomorpholinotriazinylstilbene Sulfonate",
    tradeNames: ["Tinopal DMS-X", "Fluorescent Brightener 71", "Optiblanc 2B"],
    synonyms: ["Triazinylstilbene derivative", "FBA 71", "Optical Brightener DMA"],
    category: "Optical Brighteners",
    suppliers: ["BASF SE", "Archroma", "Huntsman Corporation", "Various dye manufacturers"],
    marketNames: {
      indian: "DMSX Whitener Powder (Ranipal)",
      international: "Tinopal DMS-X / Ranipal",
      hindi: "रानीपाल पाउडर (डिटर्जेंट ब्राइटनर)"
    },
    physicalProperties: {
      appearance: "Fine powder",
      color: "Light Yellow to Greenish Yellow",
      odor: "Odorless",
      activeMatter: "98% Min",
      pH: "7.5 - 9.0 (1% aqueous solution)",
      density: "1.45 g/cm³",
      viscosity: "Solid",
      solubility: "Sparingly soluble in cold water; soluble in hot water (~10 g/L at 80°C). Dissolves very well in surfactant slurries.",
      boilingPoint: "N/A",
      meltingPoint: "> 300°C",
      shelfLife: "36 Months",
      storageConditions: "Store in cool dry warehouse. Protect from light and moisture."
    },
    functionalInfo: {
      whatIsIt: "Stilbene-triazine derived organic fluorescent whitening agent (FWA) with a strong affinity for cotton and cellulose fabrics.",
      whyUsed: "Used as a classic **whitening and brightening agent** in laundry detergent powders. Absorbs UV light and emits blue light to mask yellowing on light-colored fabrics.",
      advantages: [
        "Highly cost-effective optical brightener for solid washing powders",
        "Excellent substantive absorption onto cotton and rayon fabric fibers",
        "Provides a very clean, crisp white look to clothes",
        "Stable in standard laundry bleaching systems"
      ],
      limitations: [
        "Very poor cold-water solubility (can form white spots or uneven staining if washing in ice-cold water)",
        "Lower solubility makes it difficult to use in concentrated clear liquid detergents (where CBS-X is preferred)"
      ],
      alternatives: ["CBS-X (much more water soluble in cold water)", "Optical Brightener OB"],
      ecoFriendliness: "Strong binding to fabric cellulose prevents it from entering natural wastewater systems in high levels."
    },
    dosage: {
      minimum: "0.02%",
      recommended: "0.12%",
      premium: "0.22%",
      maximum: "0.50%",
      household: "0.05% - 0.18% in standard economy washing powders",
      industrial: "0.10% - 0.25% in heavy-duty commercial laundries"
    },
    performance: {
      cleaning: 2,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 8,
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Poorly biodegradable, but photodegrades rapidly in surface water under natural sunlight",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 100 mg/L",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask"],
      ghsClassification: ["Serious Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Flush eyes with water for 15 minutes. Wash skin with soap and water.",
      msdsSummary: "Fine yellow-green dust. High caking sensitivity in humid air. Pre-disperse in hot water or active surfactant slurry."
    }
  },
  {
    id: "sodium-xylene-sulfonate",
    commonName: "Sodium Xylene Sulfonate (SXS)",
    chemicalName: "Sodium Xylene Sulfonate",
    iupacName: "sodium dimethylbenzenesulfonate",
    casNumber: "1300-72-7",
    molecularFormula: "C8H9NaO3S",
    molecularWeight: "208.21 g/mol",
    inciName: "Sodium Xylene Sulfonate",
    tradeNames: ["Eltesol SX40", "Stepanate SXS", "SXS 40%"],
    synonyms: ["SXS Liquid", "Xylenesulfonic Acid Sodium Salt", "SXS Powder"],
    category: "Hydrotropes",
    suppliers: ["Stepan Company", "Huntsman Corporation", "Clariant", "Kao Corporation"],
    marketNames: {
      indian: "SXS Hydrotrope Liquid",
      international: "Sodium Xylene Sulfonate 40% Liquid / 93% Powder",
      hindi: "एसएक्सएस (हाइड्रोट्रोप तरल)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid (40% solution) or white powder (93%)",
      color: "Water-white to pale straw",
      odor: "Faint, characteristic sweetish odor",
      activeMatter: "39% - 41% (Liquid), 93% Min (Powder)",
      pH: "7.0 - 9.0 (1% aqueous solution)",
      density: "1.16 g/cm³ (Liquid)",
      viscosity: "10 - 20 cPs",
      solubility: "Extremely soluble in water. Soluble in alcohols.",
      boilingPoint: "101°C (Liquid)",
      meltingPoint: "-3°C (Liquid)",
      shelfLife: "36 Months",
      storageConditions: "Store in sealed original plastic packaging. Extremely stable. Protect from winter freezing."
    },
    functionalInfo: {
      whatIsIt: "Short-chain aromatic anionic hydrotrope synthesized by sulfonation of mixed xylene isomers, followed by neutralization with sodium hydroxide.",
      whyUsed: "Used as a high-performance **hydrotrope and coupling agent** in liquid laundry detergents, liquid dishwashes, and hard surface spray cleaners. Hydrotropes do not clean by themselves, but they act as molecular compatibilizers. They prevent liquid formulations from separating into different layers (clouding or precipitation) by keeping hydrophobic surfactants, solvents, and inorganic salts perfectly dissolved in water, especially in concentrated formulas.",
      advantages: [
        "Outstanding coupling agent; lowers the Cloud Point of liquid detergents dramatically",
        "Reduces viscosity of thick concentrated surfactant mixes, making them easily pumpable",
        "Prevents phase separation and sediment over wide storage temperatures",
        "Extremely stable in highly acidic or highly alkaline solutions"
      ],
      limitations: [
        "Adds to formula cost without contributing direct cleaning, oil-cutting, or foaming power",
        "Can cause minor foam reduction if formulated at excessively high doses"
      ],
      alternatives: ["Sodium Cumene Sulfonate (SCS)", "Ammonium Xylene Sulfonate", "Sorbitol", "Ethanol"],
      ecoFriendliness: "Excellent. Readily biodegradable (>95% in 28 days), low aquatic toxicity, low environmental hazard."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.0%",
      premium: "5.0%",
      maximum: "10.0%",
      household: "1.0% - 4.0% in concentrated liquid laundry and dishwash bases",
      industrial: "2.0% - 8.0% in highly concentrated heavy alkali degreasers"
    },
    performance: {
      cleaning: 2,
      foam: 2,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 7,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Readily Biodegradability (>98% OECD 301B)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 1000 mg/L (highly safe)",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Rinse eyes with water. Wash skin with water.",
      msdsSummary: "Highly stable non-cleaning hydrotrope coupler. Safely used to adjust cloud points."
    }
  },
  {
    id: "sodium-cumene-sulfonate",
    commonName: "Sodium Cumene Sulfonate (SCS)",
    chemicalName: "Sodium Cumene Sulfonate",
    iupacName: "sodium 2-phenylpropane-1-sulfonate (mixed isomers)",
    casNumber: "28348-53-0",
    molecularFormula: "C9H11NaO3S",
    molecularWeight: "222.24 g/mol",
    inciName: "Sodium Cumene Sulfonate",
    tradeNames: ["Eltesol SC40", "Stepanate SCS", "SCS 40%"],
    synonyms: ["SCS Liquid", "Cumenesulfonic Acid Sodium Salt"],
    category: "Hydrotropes",
    suppliers: ["Stepan Company", "Huntsman Corporation", "Clariant", "Kao Corporation"],
    marketNames: {
      indian: "SCS Hydrotrope Liquid",
      international: "Sodium Cumene Sulfonate 40% Liquid / 93% Powder",
      hindi: "एससीएस (हाइड्रोट्रोप तरल)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid (40% solution) or white powder (93%)",
      color: "Water-white to Pale Straw",
      odor: "Faint characteristic odor",
      activeMatter: "39% - 41% (Liquid), 93% Min (Powder)",
      pH: "7.0 - 9.0 (1% aqueous solution)",
      density: "1.15 g/cm³ (Liquid)",
      viscosity: "10 - 20 cPs",
      solubility: "Extremely soluble in water. Soluble in alcohols.",
      boilingPoint: "101°C",
      meltingPoint: "-3°C",
      shelfLife: "36 Months",
      storageConditions: "Store in sealed original plastic containers. Protect from freezing."
    },
    functionalInfo: {
      whatIsIt: "Short-chain aromatic anionic hydrotrope synthesized by sulfonation of isopropylbenzene (cumene), followed by neutralization with sodium hydroxide.",
      whyUsed: "Used as a premium **hydrotrope and coupling agent** in heavy-duty concentrated liquid laundry detergents and liquid dish soaps. Cumene sulfonate has a slightly larger hydrophobic structure than Xylene sulfonate, giving it slightly superior coupling power for highly hydrophobic surfactants and solvents.",
      advantages: [
        "Superior coupling capacity for very heavy liquid formulations",
        "Outstanding cloud point reduction",
        "Prevents phase separation and liquid layering",
        "Highly stable across extreme pH ranges"
      ],
      limitations: [
        "Slightly higher cost per kg than Sodium Xylene Sulfonate (SXS)",
        "No direct cleaning or grease saponification action"
      ],
      alternatives: ["Sodium Xylene Sulfonate (SXS)", "Sodium Toluene Sulfonate", "Propylene Glycol"],
      ecoFriendliness: "Highly eco-friendly. Rapidly biodegradable, zero bioaccumulation, low ecotoxicity."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "1.8%",
      premium: "4.5%",
      maximum: "8.0%",
      household: "1.0% - 3.5% in premium liquid wash and automatic dish gels",
      industrial: "1.5% - 6.0% in concentrated commercial vehicle degreasers"
    },
    performance: {
      cleaning: 2,
      foam: 2,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 7,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Readily Biodegradability (>98% OECD 301B)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 1000 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Eye Irritation (Category 2A)"],
      hazardStatements: ["H319: Causes serious eye irritation"],
      precautionaryStatements: [
        "P280: Wear eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water."
      ],
      firstAid: "Rinse eyes with water. Wash skin.",
      msdsSummary: "Highly stable coupling hydrotrope. Extremely safe to store and handle."
    }
  }
];
