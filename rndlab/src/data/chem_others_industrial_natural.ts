import { Chemical } from "../types";

export const OTHERS_INDUSTRIAL_NATURAL: Chemical[] = [
  {
    id: "pine-oil",
    commonName: "Pine Oil 85%",
    chemicalName: "Pine Oil",
    iupacName: "[(1R,4R)-4-methyl-1-propan-2-yl-1-cyclohex-2-enyl] acetate (mixed terpene alcohols)",
    casNumber: "8002-09-3",
    molecularFormula: "C10H18O (approx average)",
    molecularWeight: "154.25 g/mol",
    inciName: "Pinus Palustris Oil",
    tradeNames: ["Pine Oil 85%", "Glidco Pine Oil", "Yarmor Pine Oil"],
    synonyms: ["Terpene Alcohol Blend", "Pine Needle Oil", "Deodorizing Pine Oil"],
    category: "Fragrance Ingredients",
    suppliers: ["Sarasvati Chemicals", "Sumitomo Chemical", "Symrise", "DRT (Anthea)"],
    marketNames: {
      indian: "Pine Oil (Phenyl Oil)",
      international: "Pine Oil 85% / 65% Tech",
      hindi: "पाइन ऑयल (फिनाइल का तेल)"
    },
    physicalProperties: {
      appearance: "Clear mobile oil-soluble liquid",
      color: "Water-white to pale straw yellow",
      odor: "Intense, penetrating, fresh pine forest odor",
      activeMatter: "85% Min terpene alcohols",
      pH: "6.0 - 7.0 (dispersed in water)",
      density: "0.93 g/cm³",
      viscosity: "5 - 12 cPs",
      solubility: "Insoluble in water; highly soluble in alcohols and ether. Forms milky white emulsions in water when blended with castor oil soap neutralizer (standard phenyle formulation).",
      boilingPoint: "195°C",
      meltingPoint: "<-10°C",
      shelfLife: "24 Months",
      storageConditions: "Combustible liquid. Store in cool, well-ventilated warehouse away from heat, sparks, and open flames. Store in epoxy-coated steel or HDPE drums."
    },
    functionalInfo: {
      whatIsIt: "Fully natural essential oil solvent extracted by steam distillation from pinewood stumps and needles.",
      whyUsed: "Used as the active **disinfectant, solvent, and deodorizer** in classic milky white household floor phenyles, heavy industrial degreasers, and pine sanitizers. It has naturally high anti-bacterial activity, cuts through heavy grease easily, and leaves an intense, long-lasting woodsy deodorizing aroma.",
      advantages: [
        "Incredible natural antibacterial, antimicrobial, and insect-repelling properties",
        "Powerful organic grease solvent (readily dissolves heavy pine saps, tars, and waxes)",
        "100% natural, plant-derived, renewable resource",
        "Unique aesthetic; forms a dense milky white emulsion upon dilution in water"
      ],
      limitations: [
        "Combustible liquid with a moderate flashpoint (~78°C)",
        "Completely insoluble in water unless pre-emulsified with soaps or nonionic surfactants",
        "High amounts can cause skin irritation in concentrated raw form"
      ],
      alternatives: ["d-Limonene", "Eucalyptus Oil", "Chloroxylenol (PCMX)"],
      ecoFriendliness: "Highly biodegradable, natural forest product. Toxic to aquatic life in raw oil concentrate."
    },
    dosage: {
      minimum: "1.0% (as fragrance)",
      recommended: "5.0% (standard floor disinfectants)",
      premium: "12.0% (high-strength white phenyl concentrates)",
      maximum: "25.0%",
      household: "2.0% - 8.0% in home floor cleaners and white phenyl emulsions",
      industrial: "5.0% - 20% in professional workshop grease-cleaning formulas"
    },
    performance: {
      cleaning: 8,
      foam: 3,
      oilRemoval: 9,
      greaseCutting: 9,
      skinMildness: 5,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Readily Biodegradable (>90% OECD 301)",
      plantBasedPct: 100, // pine stump distillate
      petroleumBasedPct: 0,
      vocStatus: "Low VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 18 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Chemical Resistant Gloves", "Lab Coat", "Appropriate ventilation"],
      ghsClassification: ["Flammable Liquids (Category 4)", "Acute Toxicity (Category 4 - Oral)", "Skin Irritation (Category 2)", "Skin Sensitization (Category 1)", "Aspiration Hazard (Category 1)"],
      hazardStatements: ["H227: Combustible liquid", "H302: Harmful if swallowed", "H315: Causes skin irritation", "H317: May cause an allergic skin reaction", "H304: May be fatal if swallowed and enters airways"],
      precautionaryStatements: [
        "P210: Keep away from flames/hot surfaces. No smoking.",
        "P280: Wear protective gloves and eye protection.",
        "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER or doctor."
      ],
      firstAid: "Do NOT induce vomiting if swallowed (aspiration hazard). See doctor immediately. Wash skin with soap and water.",
      msdsSummary: "Combustible, skin-irritating natural oil. Highly prized for white phenyles. Emulsify using Turkey Red Oil (sulfated castor oil) or soap bases."
    }
  },
  {
    id: "d-limonene",
    commonName: "d-Limonene",
    chemicalName: "1-Methyl-4-(prop-1-en-2-yl)cyclohex-1-ene",
    iupacName: "(4R)-1-methyl-4-prop-1-en-2-ylcyclohexene",
    casNumber: "5989-27-5",
    molecularFormula: "C10H16",
    molecularWeight: "136.24 g/mol",
    inciName: "Limonene",
    tradeNames: ["Orange Terpenes", "d-Limonene Tech", "Citrus Solvent"],
    synonyms: ["Orange Terpene", "Carvene", "4-Isopropenyl-1-methylcyclohexene"],
    category: "Fragrance Ingredients",
    suppliers: ["Florida Chemical Company", "Symrise", "Firmenich", "Anthea Aromatics"],
    marketNames: {
      indian: "Orange Terpene (Limonene)",
      international: "d-Limonene Technical Grade",
      hindi: "डी-लिमोनीन (संतरे का विलायक)"
    },
    physicalProperties: {
      appearance: "Clear mobile liquid solvent",
      color: "Water-white to pale yellow",
      odor: "Intense, fresh, uplifting orange/citrus peel aroma",
      activeMatter: "96% Min pure terpene",
      pH: "N/A (oil solvent)",
      density: "0.84 g/cm³",
      viscosity: "1 cPs",
      solubility: "Insoluble in water; soluble in alcohols, ether, and petroleum solvents",
      boilingPoint: "176°C",
      meltingPoint: "-74°C",
      shelfLife: "18 Months (prone to oxidation, keep airtight)",
      storageConditions: "Flammable liquid. Store in tightly closed containers in a cool, well-ventilated fire-safe warehouse. Keep drums nitrogen-blanketed if possible to prevent rancid peroxide oxidation."
    },
    functionalInfo: {
      whatIsIt: "Fully natural monoterpene hydrocarbon solvent extracted from cold-pressed orange peels during citrus juice processing.",
      whyUsed: "Used as an ultra-premium **natural solvent, degreaser, and fragrance booster** in eco-friendly surface sprays, heavy-duty tar/grease removers, and liquid dish gels. It has unparalleled organic solvent action, dissolving sticky adhesives, asphalt, chewing gum, and polymerized kitchen grease within seconds.",
      advantages: [
        "Unrivaled natural solvent and oil-dissolving performance",
        "Exceptional citrus-orange aromatherapy scent profile",
        "100% bio-based, natural, carbon-neutral, and fully biodegradable",
        "Replaces chlorinated and petroleum-derived hazardous solvents"
      ],
      limitations: [
        "Flammable liquid (flashpoint ~48°C)",
        "Under GHS, it is classified as a skin sensitizer, requiring strict maximum dosing levels in skin-contact soaps",
        "Prone to oxidation over storage, producing sticky peroxides"
      ],
      alternatives: ["Pine Oil", "Ester Solvents", "Butyl Glycol"],
      ecoFriendliness: "Excellent green profile. Derived entirely from citrus waste. Rapidly biodegradable. High aquatic toxicity in raw state."
    },
    dosage: {
      minimum: "0.2% (as fragrance)",
      recommended: "3.0% (as active green cleaning solvent)",
      premium: "8.0%",
      maximum: "20.0%",
      household: "0.5% - 4.0% in premium citrus dishwashing gels and kitchen sprays",
      industrial: "5.0% - 15% in bio-based heavy parts degreasers and adhesive strippers"
    },
    performance: {
      cleaning: 9,
      foam: 1, // foam killer
      oilRemoval: 10,
      greaseCutting: 10,
      skinMildness: 6, // potential sensitizer
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 14 days)",
      plantBasedPct: 100, // 100% orange peel
      petroleumBasedPct: 0,
      vocStatus: "Low-to-Medium VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 0.7 mg/L (toxic to fish in raw oil state)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Nitrile Gloves", "Lab Coat", "Fire safe mixing grounding"],
      ghsClassification: ["Flammable Liquids (Category 3)", "Skin Irritation (Category 2)", "Skin Sensitization (Category 1)", "Aspiration Hazard (Category 1)", "Acute Aquatic Toxicity (Category 1)"],
      hazardStatements: ["H226: Flammable liquid and vapor", "H315: Causes skin irritation", "H317: May cause an allergic skin reaction", "H304: May be fatal if swallowed and enters airways", "H400: Very toxic to aquatic life"],
      precautionaryStatements: [
        "P210: Keep away from sparks and open flames. No smoking.",
        "P280: Wear protective gloves and eye protection.",
        "P301+P310: IF SWALLOWED: Immediately call a POISON CENTER or doctor."
      ],
      firstAid: "Do NOT induce vomiting (aspiration risk). Flush skin or eyes immediately with water. See a doctor.",
      msdsSummary: "Highly active citrus terpene. Prone to oxidation; store in dark steel or amber HDPE bottles under nitrogen blanket."
    }
  },
  {
    id: "acid-blue-9",
    commonName: "Acid Blue 9 (Patent Blue)",
    chemicalName: "Disodium 3-[[N-ethyl-4-[[4-[ethyl-(3-sulfonatophenyl)methyl]azaniumylidene]cyclohexa-2,5-dien-1-ylidene]methyl]anilino]methyl]benzenesulfonate",
    iupacName: "disodium;3-[[ethyl-[4-[[4-[ethyl-[(3-sulfonatophenyl)methyl]amino]phenyl]-(2-sulfonatonaphthalen-1-yl)methylidene]cyclohexa-2,5-dien-1-ylidene]methyl]amino]methyl]benzenesulfonate",
    casNumber: "3844-45-9",
    molecularFormula: "C37H34N2Na2O9S3",
    molecularWeight: "792.85 g/mol",
    inciName: "CI 42090",
    tradeNames: ["Brilliant Blue FCF", "Food Blue 2", "CI Acid Blue 9", "Ranipal Blue Dye"],
    synonyms: ["FD&C Blue No. 1", "CI Acid Blue 9", "Triarylmethane Dye Blue"],
    category: "Colorants",
    suppliers: ["Sensient Technologies", "Clariant", "Neelikon Dyestuffs", "Local Indian Dye Houses"],
    marketNames: {
      indian: "Ranipal Neel (Acid Blue 9)",
      international: "Acid Blue 9 Tech / FDA Grade",
      hindi: "एसिड ब्लू ९ (डिटर्जेंट नीला रंग)"
    },
    physicalProperties: {
      appearance: "Dark purplish-blue crystalline powder",
      color: "Purplish-blue solid; forms rich sapphire blue solution in water",
      odor: "Odorless",
      activeMatter: "85% Min dye active",
      pH: "6.0 - 8.0 (1% aqueous solution)",
      density: "1.48 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~200 g/L at 20°C). Moderately soluble in ethanol.",
      boilingPoint: "N/A",
      meltingPoint: "283°C (decomposes)",
      shelfLife: "60 Months (extremely stable dry powder)",
      storageConditions: "Store in tightly closed original containers in cool, dry warehouse. Keep protected from moisture and strong light."
    },
    functionalInfo: {
      whatIsIt: "Highly stable, organic triarylmethane water-soluble synthetic dye.",
      whyUsed: "Used as the absolute industry standard **colorant** in liquid dishwashing detergents, liquid hand soaps, blue glass cleaners, and blue toilet bowl liquids. It provides a striking, premium transparent sapphire blue aesthetic to formulations and acts as an indicator color in institutional formulas.",
      advantages: [
        "Incredible tinctorial coloring power (extremely tiny micro-doses around 0.001% - 0.005% yield deep blue hues)",
        "Perfect water solubility, leaving products completely transparent and sediment-free",
        "Highly stable across wide pH ranges (pH 3.0 - 11.0)",
        "Fully safe and FDA approved for cosmetic use"
      ],
      limitations: [
        "Fades slowly over prolonged exposure to direct sunlight (UV fading in transparent bottles)",
        "Slowly bleached by chlorine and strong oxidizing oxygen bleaches over time"
      ],
      alternatives: ["Acid Blue 80", "Liquitint Blue", "Reactive Blue 19"],
      ecoFriendliness: "Highly diluted in finished use; low aquatic toxicity, low environmental impact."
    },
    dosage: {
      minimum: "0.0002% (very light tint)",
      recommended: "0.002% (perfect transparent blue)",
      premium: "0.010%",
      maximum: "0.050%",
      household: "0.001% - 0.005% in hand soap, dishwash, and blue floor cleaners",
      industrial: "0.005% - 0.02% in commercial car washes"
    },
    performance: {
      cleaning: 1, // coloring only
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 10, // cosmetic-grade safety
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Moderate; photolyzes under sunlight in environmental waters",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 200 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Disposable light Gloves (to avoid staining hands blue)"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin with soap to remove blue dye staining.",
      msdsSummary: "Highly safe, non-toxic cosmetic-grade organic dye. Extremely concentrated coloring; handle with immense care to avoid staining warehouse floors."
    }
  },
  {
    id: "fluorescein-sodium",
    commonName: "Fluorescein Sodium (Acid Yellow 73)",
    chemicalName: "Fluorescein Sodium",
    iupacName: "disodium;2-(3-oxo-6-sulfonatochromen-9-yl)benzoate",
    casNumber: "518-47-8",
    molecularFormula: "C20H10Na2O5",
    molecularWeight: "376.27 g/mol",
    inciName: "CI 45350",
    tradeNames: ["Uranine", "Acid Yellow 73", "Fluorescein LT", "Yellow Dye FCF"],
    synonyms: ["D&C Yellow No. 8", "Fluorescent Yellow Uranine", "CI 45350"],
    category: "Colorants",
    suppliers: ["Sensient Technologies", "Clariant", "Neelikon Dyestuffs", "Sigma-Aldrich"],
    marketNames: {
      indian: "Uranine Powder (Fluorescent Yellow)",
      international: "Fluorescein Sodium / Uranine Tech",
      hindi: "यूरेनिन पाउडर (चमकीला पीला रंग)"
    },
    physicalProperties: {
      appearance: "Dark reddish-orange crystalline powder",
      color: "Reddish-orange dry solid; forms intense fluorescent yellow-green solution in water under light",
      odor: "Odorless",
      activeMatter: "98% Min dye active",
      pH: "7.0 - 9.0 (1% aqueous solution)",
      density: "1.41 g/cm³",
      viscosity: "Solid",
      solubility: "Highly soluble in water (~500 g/L at 20°C). Soluble in alcohol.",
      boilingPoint: "N/A",
      meltingPoint: "> 300°C",
      shelfLife: "60 Months",
      storageConditions: "Highly hygroscopic. Store in cool, dry, dark warehouse. Keep sealed tightly."
    },
    functionalInfo: {
      whatIsIt: "Highly water-soluble organic xanthene dye characterized by intense fluorescence.",
      whyUsed: "Used as a highly visible **tracing dye and fluorescent indicator** in institutional leak testers, automotive radiator washes, sewer line tracking, and bright fluorescent toilet bowl cleansers. Shows an intense green fluorescence under sunlight or UV blacklights.",
      advantages: [
        "Incredibly high fluorescent visibility at extremely low doses (parts per billion)",
        "Perfect water solubility with high chemical stability",
        "Excellent indicator dye for sewer tracing and mechanical leakage",
        "Safe and dermatologically non-toxic"
      ],
      limitations: [
        "Highly sensitive to acidic pH; loses fluorescence completely if pH drops below 5.0",
        "Extremely fast staining of concrete, clothes, and skin if dry dust gets wet"
      ],
      alternatives: ["Acid Yellow 3", "Pyranine (solvent green 7)"],
      ecoFriendliness: "Highly diluted in tracing uses; totally safe, non-accumulative, rapidly photolyzes."
    },
    dosage: {
      minimum: "0.0001% (as light tracer)",
      recommended: "0.001% (standard fluorescent yellow-green)",
      premium: "0.005%",
      maximum: "0.020%",
      household: "0.0005% - 0.002% in fluorescent yellow handwash and institutional floor cleaners",
      industrial: "0.001% - 0.010% in water line tracing and leak detecting flushes"
    },
    performance: {
      cleaning: 1,
      foam: 1,
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 10,
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>95% under photolytic sunlight breakdown)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 342 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Disposable gloves", "Dust Mask"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water. Wash skin with warm water to remove orange/green stain.",
      msdsSummary: "Highly safe organic dye. Extremely visible; handle carefully to avoid accidental bright green staining of factory clothing."
    }
  },
  {
    id: "soapnut-extract",
    commonName: "Soapnut (Reetha) Extract",
    chemicalName: "Sapindus Mukorossi Fruit Extract",
    iupacName: "sapindus mukorossi fruit extract (saponin rich)",
    casNumber: "90106-29-3",
    molecularFormula: "Complex Natural Mixture (Saponin Macromolecules)",
    molecularWeight: "700 - 1200 g/mol (various saponin glycosides)",
    inciName: "Sapindus Mukorossi Fruit Extract",
    tradeNames: ["Reetha Extract Powder", "Soapnut Extract 40%", "OrganiFoam Reetha"],
    synonyms: ["Soapberry Extract", "Saponin Extract Powder", "Reetha Powder"],
    category: "Natural Ingredients",
    suppliers: ["Bio-Botanica", "Sabo S.p.A.", "Herbal Extracts India", "Indena"],
    marketNames: {
      indian: "Reetha Extract (Soapnut Saponin)",
      international: "Sapindus Mukorossi Soapnut Saponin 40%",
      hindi: "रीठा एक्स्ट्रैक्ट (प्राकृतिक झाग पाउडर)"
    },
    physicalProperties: {
      appearance: "Fine free-flowing hygroscopic powder",
      color: "Light brown to Tan",
      odor: "Characteristic, sweetish fruit-vinegar odor",
      activeMatter: "40% Min Saponins (rest is natural plant sugars and fibers)",
      pH: "4.5 - 6.0 (5% aqueous solution)",
      density: "0.48 g/cm³ (bulk density)",
      viscosity: "Solid",
      solubility: "Highly soluble in warm water, forming a dark amber, foaming colloidal solution.",
      boilingPoint: "N/A",
      meltingPoint: "Decomposes",
      shelfLife: "24 Months",
      storageConditions: "Highly hygroscopic. Absorbs ambient moisture to turn into sticky black syrup. Store in tightly sealed moisture-proof bags under cool, dry conditions."
    },
    functionalInfo: {
      whatIsIt: "Fully natural plant-derived surfactant extract rich in triterpenoid saponins, harvested from the dried fruits of the *Sapindus mukorossi* tree.",
      whyUsed: "Used as the primary natural **foaming agent and mild surfactant** in premium eco-friendly, organic laundry liquids, baby clothes washes, hypoallergenic hand soaps, and pet shampoos. Saponins possess natural, gentle surface tension lowering properties that wash fabrics without stripping natural oils.",
      advantages: [
        "100% natural, certified organic, plant-derived, renewable raw material",
        "Outstanding hypoallergenic safety profile (ideal for severe eczema and baby clothes)",
        "Provides rich, stable, creamy biological foam",
        "Has natural mild antimicrobial and antifungal fabric sanitization properties"
      ],
      limitations: [
        "Low grease cutting and heavy soil degreasing power compared to LABSA/SLES",
        "Formulation water turns brown/amber, preventing clear or bright colored liquid designs",
        "Extremely expensive compared to synthetic surfactants; prone to rapid bacterial decay if preservative is weak"
      ],
      alternatives: ["Lauryl Glucoside", "Coco Glucoside", "Shikakai Extract", "Saponaria Officinalis Extract"],
      ecoFriendliness: "Exemplary. Fully botanical, carbon-neutral, ready biodegradability (>99% in 48h), zero aquatic toxicity."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0%",
      premium: "15.0%",
      maximum: "30.0%",
      household: "3.0% - 10.0% in eco-laundry liquids and baby bottle washes",
      industrial: "Not used in high-efficiency industrial degreasers"
    },
    performance: {
      cleaning: 6,
      foam: 8,
      oilRemoval: 5,
      greaseCutting: 4,
      skinMildness: 10, // maximum skin mildness
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Extremely rapid bio-elimination (>99% in 48 hours)",
      plantBasedPct: 100, // purely soapnut tree fruit
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / organic botanical",
      aquaticToxicity: "LC50 (Fish) > 1000 mg/L (very safe)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Dust Mask (during bulk transfer of fine powder to avoid sneezing)"],
      ghsClassification: ["Not classified as hazardous according to GHS"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P232: Protect from moisture."],
      firstAid: "Rinse eyes with water as precaution. Blow nose if dust inhaled.",
      msdsSummary: "Extremely safe plant extract. Highly hygroscopic; keep bags tightly sealed. Fine dust triggers sneezing reflex."
    }
  },
  {
    id: "acetic-acid",
    commonName: "Vinegar (Acetic Acid)",
    chemicalName: "Acetic Acid",
    iupacName: "ethanoic acid",
    casNumber: "64-19-7",
    molecularFormula: "C2H4O2",
    molecularWeight: "60.05 g/mol",
    inciName: "Acetic Acid",
    tradeNames: ["Glacial Acetic Acid", "White Vinegar 10%", "Vinegar Concentrate"],
    synonyms: ["Ethanoic Acid", "Vinegar Acid", "Glacial Acid"],
    category: "Natural Ingredients",
    suppliers: ["Lotte Chemical", "Celanese", "Jubilant Life Sciences", "Local Food Distillers"],
    marketNames: {
      indian: "Sirka (Vinegar / Acetic Acid)",
      international: "Acetic Acid Glacial / White Vinegar 10%",
      hindi: "सिरका (एसिटिक एसिड)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Water-white",
      odor: "Pungent, highly sour, characteristic vinegar smell",
      activeMatter: "99.8% (Glacial) or 10% - 15% (Vinegar Concentrate)",
      pH: "2.4 (1% aqueous solution)",
      density: "1.05 g/cm³",
      viscosity: "1.2 cPs",
      solubility: "Completely miscible with water, alcohols, and ether",
      boilingPoint: "118.1°C",
      meltingPoint: "16.6°C (solidifies to ice-like crystal in cold weather)",
      shelfLife: "36 Months",
      storageConditions: "Corrosive and combustible liquid. Store Glacial Acetic Acid strictly in acid-resistant, cool, fire-safe rooms away from strong alkalis and oxidizers."
    },
    functionalInfo: {
      whatIsIt: "Simple organic carboxylic acid, produced naturally by acetous fermentation of ethanol by *Acetobacter* bacteria.",
      whyUsed: "Used as an outstanding **natural acidifier, glass descaler, and fabric rinse-aid** in ecological household cleaners, laundry softeners, and window sprays. It dissolves soap scum and hard water calcium deposits, neutralizes alkaline laundry residues on fabrics (reducing static cling), and leaves glass surfaces streak-free.",
      advantages: [
        "100% bio-based, natural, and exceptionally rapidly biodegradable",
        "Exceptional streak-free glass and mirror cleaning performance",
        "Neutralizes laundry wash water to soften fabrics naturally without wax buildup",
        "Highly safe and food-grade safety profile once diluted"
      ],
      limitations: [
        "Glacial Acetic Acid (99%) is highly corrosive and dangerous, with strong choking vapors",
        "Leaves an intense, pungent vinegar odor that is difficult to fully mask with perfumes",
        "Corrodes metals like copper and carbon steel easily"
      ],
      alternatives: ["Citric Acid (odorless solid)", "Lactic Acid", "Glycolic Acid"],
      ecoFriendliness: "Exemplary. Fully botanical, carbon-neutral, zero persistent footprint, non-toxic."
    },
    dosage: {
      minimum: "0.2% (as pH buffer)",
      recommended: "3.0%",
      premium: "8.0% (as active fabric vinegar-rinse)",
      maximum: "15.0%",
      household: "2.0% - 6.0% in glass cleaners and natural fabric softeners",
      industrial: "5.0% - 12% in commercial restaurant stainless-steel polishes"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 4,
      greaseCutting: 4,
      skinMildness: 8, // safe once diluted; pure glacial is corrosive
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>99% in 24 hours)",
      plantBasedPct: 100, // biomass alcohol fermented
      petroleumBasedPct: 0,
      vocStatus: "Medium VOC (volatile organic acid)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 75 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Goggles", "Nitrile Gloves", "Adequate ventilation (respirator if handling bulk glacial form)"],
      ghsClassification: ["Flammable Liquids (Category 3)", "Skin Corrosion (Category 1A)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H226: Flammable liquid and vapor", "H314: Causes severe skin burns and eye damage"],
      precautionaryStatements: [
        "P210: Keep away from open flames. No smoking.",
        "P280: Wear protective gloves and eye protection.",
        "P303+P361+P353: IF ON SKIN: Rinse immediately with water.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for 15 minutes."
      ],
      firstAid: "Extremely urgent if concentrated. Flush eyes/skin immediately with running water. Seek medical help if burned.",
      msdsSummary: "Highly corrosive organic acid in pure form. Solidifies at 16°C (glacial). Ensures safe, non-corrosive dilutions inside consumer sprays."
    }
  },
  {
    id: "polyquaternium-7",
    commonName: "Polyquaternium-7",
    chemicalName: "Copolymer of Diallyldimethylammonium Chloride and Acrylamide",
    iupacName: "2-propen-1-aminium, N,N-dimethyl-N-2-propen-1-yl-, chloride, polymer with 2-propenamide",
    casNumber: "26590-05-6",
    molecularFormula: "(C8H16ClN)x·(C3H5NO)y",
    molecularWeight: "1,000,000 - 3,000,000 g/mol",
    inciName: "Polyquaternium-7",
    tradeNames: ["Merquat 550", "Salcare SC10", "Galaxy PQ7", "Conditioner PQ7"],
    synonyms: ["DADMAC/Acrylamide Copolymer", "Cationic Conditioning Polymer"],
    category: "Fabric Care Additives",
    suppliers: ["Lubrizol", "BASF SE", "Galaxy Surfactants", "Solvay"],
    marketNames: {
      indian: "PQ7 Conditioning Liquid",
      international: "Polyquaternium-7 10% Active Liquid",
      hindi: "पीक्यू७ कंडीशनर (सॉफ्टनर तरल)"
    },
    physicalProperties: {
      appearance: "Thick viscous clear liquid",
      color: "Water-white",
      odor: "Faint, characteristic acrylic",
      activeMatter: "9.5% - 10.5% (rest is water)",
      pH: "6.5 - 7.5 (neutral)",
      density: "1.02 g/cm³",
      viscosity: "8000 - 15000 cPs (highly viscous polymer liquid)",
      solubility: "Completely soluble in water, forming a clear, slippery solution",
      boilingPoint: "100°C",
      meltingPoint: "0°C",
      shelfLife: "24 Months",
      storageConditions: "Do not freeze. Store in original plastic barrels in a dry place."
    },
    functionalInfo: {
      whatIsIt: "Highly substantive cationic copolymer of DADMAC and acrylamide.",
      whyUsed: "Used as a premium **fabric conditioning and softening additive** in liquid laundry detergents and wool washes. Its positive (cationic) charges bind substantively to the negatively charged cotton fibers, smoothing the microscopic fabric fibers, reducing static cling, and leaving clothes with a silky, velvet-like hand-feel.",
      advantages: [
        "Adds remarkable softening and fiber smoothing performance to liquid soaps",
        "Significantly reduces static shock cling in dried fabrics",
        "Outstanding low-temperature water solubility; remains perfectly transparent in liquid detergent bottles",
        "Extremely mild on skin; commonly used in baby washes"
      ],
      limitations: [
        "Petroleum based synthetic polymer",
        "Poor raw biological degradation",
        "Can cause minor foam reduction if formulated at excessively high doses"
      ],
      alternatives: ["Esterquat Softener", "Cationic Guar Gum", "Dimethicone Emulsion"],
      ecoFriendliness: "Low ecotoxicity. Binds tightly to fabric and environmental clay sediments."
    },
    dosage: {
      minimum: "0.2%",
      recommended: "1.0% (as raw liquid, equivalent to 0.1% active polymer)",
      premium: "2.5%",
      maximum: "4.0%",
      household: "0.5% - 2.0% in premium liquid fabric softeners and 2-in-1 laundry liquids",
      industrial: "1.0% - 3.0% in commercial hotel linen conditioning washes"
    },
    performance: {
      cleaning: 2,
      foam: 4, // stabilizes foam slightly in SLES mixes
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 10, // cosmetic standard softness
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Poor biological degradation, but highly removed in sewage sludge adsorption",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic / soluble polymer",
      aquaticToxicity: "LC50 (Fish) ~ 120 mg/L",
      greenRating: "B"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves", "Lab Coat"],
      ghsClassification: ["Not classified as hazardous according to GHS regulations"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution.",
      msdsSummary: "Highly safe and gentle cosmetic conditioning polymer. Viscous liquid; spillages are highly slippery."
    }
  },
  {
    id: "esterquat",
    commonName: "Esterquat (Softener Cationic)",
    chemicalName: "Di-(Tallow Carboxyethyl) Hydroxyethyl Methylammonium Methosulfate",
    iupacName: "methyl-bis(2-hydroxyethyl)-[2-[(1-oxooctadecyl)oxy]ethyl]ammonium methyl sulfate",
    casNumber: "91995-81-2",
    molecularFormula: "C39H79NO7S (approx average)",
    molecularWeight: "706.11 g/mol",
    inciName: "Dipalmitoylethyl Hydroxyethylmonium Methosulfate",
    tradeNames: ["Rewoquat WE 18", "Stepantex VK90", "Dehyquart L80", "Esterquat L90"],
    synonyms: ["Cationic Ester Quat", "Fabric Softener Active", "Ester Quaternary Ammonium Salt"],
    category: "Fabric Care Additives",
    suppliers: ["Evonik Industries", "Stepan Company", "Kao Corporation", "BASF SE"],
    marketNames: {
      indian: "Esterquat Paste (Fabric Softener Base)",
      international: "Esterquat 90% Paste",
      hindi: "एस्टरक्वाट पेस्ट (कपड़ा सॉफ्टनर बेस)"
    },
    physicalProperties: {
      appearance: "Hazy thick paste (requires heating to melt)",
      color: "Pale yellow to white translucent",
      odor: "Characteristic sweet fatty amine-like odor",
      activeMatter: "88% - 91% (dissolved in isopropanol carrier around 10%)",
      pH: "2.5 - 3.5 (5% aqueous dispersion)",
      density: "0.96 g/cm³",
      viscosity: "Very high paste (solid-like at 20°C; melts to mobile liquid above 45°C)",
      solubility: "Insoluble in cold water; disperses beautifully in warm water (40°C - 50°C) under high shear to form thick, stable, milky fabric softener emulsions.",
      boilingPoint: "N/A",
      meltingPoint: "38°C",
      shelfLife: "24 Months",
      storageConditions: "Store strictly below 35°C in cool, ventilated warehouse away from flames. Paste is flammable due to IPA solvent carrier."
    },
    functionalInfo: {
      whatIsIt: "Cationic quaternary ammonium salt containing biodegradable ester linkages, synthesized from tallow fatty acids and triethanolamine, followed by methylation.",
      whyUsed: "Used as the absolute world-standard active **fabric softening agent** in commercial and domestic fabric softeners (such as Comfort or Downy). It plates out substantively on textiles, providing unbeatable fluffiness, skin comfort, water absorption, and static dissipation.",
      advantages: [
        "Unbeatable fabric softening and fluffy fluffiness performance",
        "Significantly superior environmental biodegradation compared to older toxic distearyl quats (DHTDMAC)",
        "Dramatically reduces fabric static shock cling and fabric wrinkling, making ironing effortless",
        "Sourced from semi-renewable natural tallow lipids"
      ],
      limitations: [
        "Highly cationic; completely incompatible with anionic surfactants (such as SLES or LABSA) inside a single wash (precipitates out immediately to form sticky black scum). Must be used in the final rinse cycle ONLY.",
        "Requires industrial high-shear heating and mixing equipment to disperse raw paste into water stable milky softeners"
      ],
      alternatives: ["Polyquaternium-7", "Cationic Silicones", "Imidazolinium Quats"],
      ecoFriendliness: "Excellent biological degradation. The ester bonds hydrolyze rapidly in municipal sludge, completely removing aquatic toxicity."
    },
    dosage: {
      minimum: "2.0% (as raw paste, yielding ~4.0% standard domestic liquid softener)",
      recommended: "8.0%",
      premium: "18.0% (concentrated fabric softeners)",
      maximum: "25.0%",
      household: "4.0% - 15% dispersed in household liquid softeners",
      industrial: "5.0% - 20% in commercial laundry conditioning softeners"
    },
    performance: {
      cleaning: 1, // does not clean; purely conditions
      foam: 1, // foam suppressant
      oilRemoval: 1,
      greaseCutting: 1,
      skinMildness: 10, // exceptionally soft on skin
      hardWater: 9
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>90% OECD 301D in 14 days)",
      plantBasedPct: 75, // tallow fat core
      petroleumBasedPct: 25,
      vocStatus: "Low VOC (contains minor IPA solvent)",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Daphnia) ~ 1.5 mg/L (biodegrades so fast it has low river risk)",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Chemical Gloves", "Lab Coat", "Avoid breathing hot vapors when melting paste"],
      ghsClassification: ["Flammable Solids (Category 2)", "Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H228: Flammable solid", "H315: Causes skin irritation", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P210: Keep away from hot surfaces and open flames. No smoking.",
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Flush eyes thoroughly with water for 15 minutes. Wash skin with soap and water.",
      msdsSummary: "Highly substantive cationic paste. Keep away from heat and anionic surfactants. Disperse in warm water around 45°C."
    }
  },
  {
    id: "sodium-percarbonate",
    commonName: "Sodium Percarbonate (Oxygen Bleach)",
    chemicalName: "Sodium Carbonate Sesquiperhydrate",
    iupacName: "sodium carbonate--hydrogen peroxide (2:3)",
    casNumber: "15630-89-4",
    molecularFormula: "2Na2CO3·3H2O2",
    molecularWeight: "314.02 g/mol",
    inciName: "Sodium Carbonate Peroxide",
    tradeNames: ["Oxi-Clean Active", "Sodium Percarbonate Coated", "Solvay Oxyper"],
    synonyms: ["Solid Hydrogen Peroxide", "Sodium Carbonate Sesquiperhydrate", "Oxy-Bleach Powder"],
    category: "Bleaching System",
    suppliers: ["Solvay", "Evonik Industries", "Kemira Oyj", "Hodogaya Chemical"],
    marketNames: {
      indian: "Oxy Bleach Powder (Percarbonate)",
      international: "Sodium Percarbonate Coated Grade",
      hindi: "ऑक्सीजन ब्लीच पाउडर (सोडियम परकार्बोनेट)"
    },
    physicalProperties: {
      appearance: "Free-flowing white crystalline granules",
      color: "White",
      odor: "Odorless",
      activeMatter: "13.5% Min active oxygen (equivalent to 27.5% hydrogen peroxide)",
      pH: "10.4 - 10.6 (1% aqueous solution)",
      density: "0.90 g/cm³ (bulk density)",
      viscosity: "Solid",
      solubility: "Soluble in water (~140 g/L at 20°C). Reacts instantly to release active hydrogen peroxide and sodium carbonate.",
      boilingPoint: "N/A",
      meltingPoint: "Decomposes above 60°C",
      shelfLife: "18 Months (coated grade is stable; highly sensitive to heat and moisture)",
      storageConditions: "Strong oxidizer. Store in a cool, dry, exceptionally well-ventilated warehouse strictly below 30°C. Protect from moisture and direct sunlight. Keep away from combustible materials, acids, and metal catalysts."
    },
    functionalInfo: {
      whatIsIt: "Inorganic addition compound of sodium carbonate and hydrogen peroxide, coated with protective sodium silicate/sulfate layers for storage stability.",
      whyUsed: "Used as the primary **active oxygen bleaching agent and stain remover** in premium color-safe laundry powders, nappy sanitizers, and dishwasher tabs. Dissolving in water releases hydrogen peroxide, which bleaches organic stains (wine, juice, tea, coffee, grass) via oxidation without bleaching fabric colors (unlike chlorine).",
      advantages: [
        "Outstanding color-safe bleaching and stain removal performance",
        "Environmentally exemplary (decomposes into safe water, oxygen, and soda ash)",
        "Dual action; provides cleaning alkalinity (soda ash) and bleaching power",
        "Disinfects and sanitizes fabrics naturally"
      ],
      limitations: [
        "Highly sensitive to moisture; raw powder degrades rapidly in storage if formulation contains moisture (requires fully coated grade and dry ingredients)",
        "Optimal bleaching triggers only at wash temperatures above 60°C unless a bleach activator (TAED) is formulated",
        "Unstable in liquid water formulations (limited strictly to dry powders)"
      ],
      alternatives: ["Sodium Hypochlorite (chlorine bleach - liquid)", "Sodium Perborate (restricted due to boron toxicity)"],
      ecoFriendliness: "Exemplary. Decomposes completely into safe natural minerals and oxygen. Non-eutrophic."
    },
    dosage: {
      minimum: "2.0%",
      recommended: "8.0% (standard oxy wash powders)",
      premium: "20.0% (premium spot stain powders)",
      maximum: "45.0%",
      household: "5% - 25% in color-safe laundry washing powders and nappy sanitizers",
      industrial: "10% - 30% in commercial hospital linen sanitizers"
    },
    performance: {
      cleaning: 9, // superb organic stain removal
      foam: 1,
      oilRemoval: 4,
      greaseCutting: 5,
      skinMildness: 6, // oxidizer
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Mineral compound; decomposes completely into oxygen, water, and sodium carbonate",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Daphnia) ~ 4.9 mg/L (active peroxide)",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Goggles", "Chemical Gloves", "Dust Mask", "Cotton clothing"],
      ghsClassification: ["Oxidizing Solids (Category 2)", "Acute Toxicity (Category 4 - Oral)", "Serious Eye Damage (Category 1)"],
      hazardStatements: ["H272: May intensify fire; oxidizer", "H302: Harmful if swallowed", "H318: Causes serious eye damage"],
      precautionaryStatements: [
        "P210: Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
        "P220: Keep away from clothing and other combustible materials.",
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Flush eyes immediately with warm water for 15 minutes. Wash skin. Seek medical help if swallowed.",
      msdsSummary: "Powerful oxidizer. Never mix with organic solvents or combustible fuels. Always use coated grades for storage stability in washing powders."
    }
  },
  {
    id: "sodium-hypochlorite",
    commonName: "Liquid Bleach (Sodium Hypochlorite)",
    chemicalName: "Sodium Hypochlorite",
    iupacName: "sodium hypochlorite",
    casNumber: "7681-52-9",
    molecularFormula: "NaClO",
    molecularWeight: "74.44 g/mol",
    inciName: "Sodium Hypochlorite",
    tradeNames: ["Chlorine Bleach 12%", "Hypo Liquid", "Clorox Active"],
    synonyms: ["Soda Bleach", "Liquid Chlorine", "Antiformin"],
    category: "Bleaching System",
    suppliers: ["Grasim Industries Ltd.", "GACL", "Olin Corporation", "Occidental Chemical"],
    marketNames: {
      indian: "Ala (Liquid Chlorine Bleach)",
      international: "Sodium Hypochlorite 10% - 12% Industrial",
      hindi: "क्लोरीन ब्लीच (हाइपो तरल)"
    },
    physicalProperties: {
      appearance: "Clear thin liquid",
      color: "Pale greenish-yellow",
      odor: "Pungent, highly characteristic chlorine smell",
      activeMatter: "10% - 12% active chlorine (domestic retail is usually 4% - 5%)",
      pH: "12.0 - 13.0 (strongly alkaline stabilizer lye)",
      density: "1.20 g/cm³",
      viscosity: "2 - 5 cPs",
      solubility: "Completely miscible with water in all ratios",
      boilingPoint: "101°C (decomposes)",
      meltingPoint: "-5°C",
      shelfLife: "6 Months (highly unstable; degrades in active chlorine by 1-2% per month over heat and light exposure)",
      storageConditions: "Strong oxidizer and corrosive liquid. Store in cool, dark, dedicated ventilated warehouses in opaque HDPE barrels. Keep away from acids, ammonia, and organic chemicals."
    },
    functionalInfo: {
      whatIsIt: "Highly reactive inorganic chlorine-based oxidizing salt, stabilized with trace sodium hydroxide.",
      whyUsed: "Used as the absolute world-standard **active chlorine bleaching agent, stain remover, and disinfectant** in household white liquid bleaches, mildew removers, and institutional sanitizers. It destroys organic stains (blood, grass, mildew, mold) and kills 99.9% of bacteria, viruses, and fungi instantly via rapid oxidation.",
      advantages: [
        "Unbeatable, rapid stain bleaching performance on pure white fabrics",
        "Incredible broad-spectrum antimicrobial sanitization and mold destruction",
        "Highly water-soluble liquid, ready to bottle",
        "Extremely cost-efficient raw material"
      ],
      limitations: [
        "Highly corrosive; causes severe skin irritation and chemical eye damage",
        "Strongly attacks and bleaches colored fabrics (destroys dyes completely, limited strictly to pure whites)",
        "Severely incompatible with acids; releases highly lethal Chlorine gas instantly if pH drops below 10.0. Also incompatible with ammonia (releases explosive chloramines)."
      ],
      alternatives: ["Sodium Percarbonate (color-safe solid bleach)", "Hydrogen Peroxide Liquid"],
      ecoFriendliness: "Highly reactive; breaks down rapidly in municipal sewers into harmless sodium chloride (common salt) and water."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "4.0% (standard household white bleach)",
      premium: "10.0% (heavy-duty sanitizing lye)",
      maximum: "15.0%",
      household: "3.0% - 6.0% in home liquid bleaches and mold removers",
      industrial: "5.0% - 12% in institutional dairy and swimming pool sanitizers"
    },
    performance: {
      cleaning: 9,
      foam: 1,
      oilRemoval: 5,
      greaseCutting: 6,
      skinMildness: 1, // highly caustic/reactive
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Mineral compound; decomposes rapidly in municipal sewer water into common salt and oxygen",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 0.06 mg/L (highly toxic in raw state)",
      greenRating: "C"
    },
    safety: {
      ppe: ["Safety Splash Goggles", "Thick Nitrile/Neoprene Gloves", "Rubber Apron", "Good local exhaust ventilation"],
      ghsClassification: ["Skin Corrosion (Category 1B)", "Serious Eye Damage (Category 1)", "Specific Target Organ Toxicity (Category 3 - Respiratory)", "Acute Aquatic Toxicity (Category 1)"],
      hazardStatements: ["H314: Causes severe skin burns and eye damage", "H335: May cause respiratory irritation", "H400: Very toxic to aquatic life", "EUH031: Contact with acids liberates toxic gas"],
      precautionaryStatements: [
        "P260: Do not breathe mists/vapors.",
        "P273: Avoid release to the environment.",
        "P280: Wear protective gloves and eye protection.",
        "P303+P361+P353: IF ON SKIN: Rinse immediately with water.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for 15 minutes."
      ],
      firstAid: "Extremely urgent. Flush skin/eyes immediately with running water for 15 minutes. See doctor. Never inhale vapors.",
      msdsSummary: "Highly unstable oxidizer. Never mix with acids or ammonia. Degrades over heat; store in dark, cool place and use within 6 months."
    }
  },
  {
    id: "taed",
    commonName: "TAED (Bleach Activator)",
    chemicalName: "Tetraacetylethylenediamine",
    iupacName: "N,N'-ethane-1,2-diylbis(N-acetylacetamide)",
    casNumber: "10543-57-4",
    molecularFormula: "C10H16N2O4",
    molecularWeight: "228.25 g/mol",
    inciName: "Tetraacetylethylenediamine",
    tradeNames: ["Mykon ATC Blue", "Warwick TAED", "TAED Granules"],
    synonyms: ["N,N'-Ethylenebis(diacetamide)", "Tetra-acetyl Ethylene Diamine"],
    category: "Bleaching System",
    suppliers: ["Weychem (Warwick Chemicals)", "Clariant", "Lubrizol", "Various premium detergent chemical houses"],
    marketNames: {
      indian: "TAED Activator Granules (Blue/Green)",
      international: "TAED 92% Coated Granules",
      hindi: "टीएईडी (ब्लीच एक्टिवेटर दाने)"
    },
    physicalProperties: {
      appearance: "Free-flowing granular solid (often dyed bright blue, green, or pink for visual aesthetics in powder)",
      color: "White, Blue, or Green granules",
      odor: "Odorless or faint acetic",
      activeMatter: "90% - 94% active (rest is protective polymer coating)",
      pH: "4.5 - 6.5 (10% dispersion in water)",
      density: "0.55 g/cm³ (bulk density)",
      viscosity: "Solid",
      solubility: "Sparingly soluble in cold water; dissolves rapidly in active wash water once temperature exceeds 30°C.",
      boilingPoint: "N/A",
      meltingPoint: "152°C",
      shelfLife: "24 Months",
      storageConditions: "Store in cool, dry conditions. Keep protected from moisture to prevent hydrolytic degradation."
    },
    functionalInfo: {
      whatIsIt: "Coated organic amide bleach activator compound.",
      whyUsed: "Used as a vital **bleach activator** in premium washing powders and automatic dishwashing tablets. At wash temperatures below 40°C, oxygen bleach (sodium percarbonate) alone is slow to release bleaching oxygen. TAED reacts chemically with dissolved percarbonate to form **peracetic acid** in the wash water, a powerful color-safe bleaching agent that whitens and sanitizes fabrics perfectly at cold temperatures (20°C - 30°C).",
      advantages: [
        "Enables oxygen bleaches to remove tough stains at cold, energy-saving wash temperatures (30°C)",
        "Formulates into dry washing powders safely without pre-reacting (due to protective coating)",
        "Fully organic, biodegradable, and exceptionally safe",
        "Significantly boosts sanitary fabric disinfection at low temperatures"
      ],
      limitations: [
        "Highly expensive specialty chemical granules",
        "Ineffective when used without an active oxygen oxygen bleach donor like percarbonate",
        "Unstable in liquid detergents"
      ],
      alternatives: ["DOBA", "NOBS (Sodium Nonanoyloxybenzenesulfonate)"],
      ecoFriendliness: "Exemplary. Fully biodegradable. Decomposes into safe, natural metabolites."
    },
    dosage: {
      minimum: "0.5%",
      recommended: "2.5% (standard active oxygen activation)",
      premium: "5.0%",
      maximum: "8.0%",
      household: "1.5% - 4.0% in premium white washing powders and dishwasher tablets",
      industrial: "2.0% - 6.0% in low-temperature sanitizing commercial laundries"
    },
    performance: {
      cleaning: 8, // boosts bleach stain removal
      foam: 1,
      oilRemoval: 2,
      greaseCutting: 2,
      skinMildness: 9,
      hardWater: 8
    },
    sustainability: {
      biodegradability: "Ready Biodegradability (>98% in 7 days)",
      plantBasedPct: 0,
      petroleumBasedPct: 100,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) > 500 mg/L",
      greenRating: "A+"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Gloves"],
      ghsClassification: ["Not classified as hazardous according to GHS regulations"],
      hazardStatements: ["None"],
      precautionaryStatements: ["P262: Do not get in eyes, on skin, or on clothing."],
      firstAid: "Rinse eyes with water as precaution.",
      msdsSummary: "Highly safe and biodegradable organic activator. Coated granules prevent dusting and skin sensitization."
    }
  },
  {
    id: "sodium-silicate",
    commonName: "Sodium Silicate Liquid (Water Glass)",
    chemicalName: "Sodium Silicate Liquid",
    iupacName: "disodium trisilicate (liquid ratio)",
    casNumber: "1344-09-8",
    molecularFormula: "Na2O·xSiO2 (where ratio x = 2.0 - 3.2)",
    molecularWeight: "122.06 g/mol (base anhydrous)",
    inciName: "Sodium Silicate",
    tradeNames: ["Water Glass", "Sodium Silicate Liquid 103°", "Kiran Liquid Silicate"],
    synonyms: ["Liquid Glass", "Soluble Glass", "Sodium Silicate 2.4 Ratio"],
    category: "Corrosion Inhibitors",
    suppliers: ["Kiran Global Chem", "PQ Corporation", "CGC Inc.", "Local Silicate Mills"],
    marketNames: {
      indian: "Pighla Kanch (Liquid Silicate)",
      international: "Sodium Silicate Liquid Neutral Grade",
      hindi: "सोडियम सिलिकेट तरल"
    },
    physicalProperties: {
      appearance: "Thick viscous, heavy sticky liquid",
      color: "Water-white to slightly grey translucent",
      odor: "Odorless",
      activeMatter: "40% - 42% active sodium silicate (rest is water)",
      pH: "11.2 - 11.8 (1% aqueous solution)",
      density: "1.38 g/cm³",
      viscosity: "200 - 600 cPs (highly viscous heavy syrup)",
      solubility: "Soluble in water, forming a highly alkaline viscous solution.",
      boilingPoint: "101°C",
      meltingPoint: "-1°C",
      shelfLife: "24 Months (must keep tightly closed to prevent carbonation caking)",
      storageConditions: "Alkaline liquid. Store in original thick steel or HDPE drums. Exposure to air causes CO2 absorption, forming a solid hard glass-like silica crust."
    },
    functionalInfo: {
      whatIsIt: "Inorganic alkaline silicate glass polymer solution, manufactured by melting high-purity silica sand with soda ash at 1400°C, followed by steam dissolution.",
      whyUsed: "Used as a vital **corrosion inhibitor, alkaline builder, and structural binder** in laundry washing powders and automatic dishwashing gels. It plates out as an ultra-thin protective monomolecular layer on washing machine metal parts, pump impellers, and household pipes, preventing corrosion and rust from chlorine or high alkalinity. In powders, it acts as a key binder that keeps spray-dried granules solid and non-crushable.",
      advantages: [
        "Outstanding metal and glass corrosion inhibition (stops metal etching)",
        "Prevents redeposition of inorganic soils and clays onto fabrics",
        "Dramatically improves dry detergent powder structural stability and hardness",
        "Extremely cost-efficient source of buffering alkalinity"
      ],
      limitations: [
        "Highly sticky; difficult to pump and clean in factories when cold",
        "Causes a hard crust if left to dry in open air",
        "Precipitates out in acidic conditions to form insoluble silica gels"
      ],
      alternatives: ["Sodium Carbonate", "Zeolite A", "Layered Silicates"],
      ecoFriendliness: "Natural mineral origin. Dissolves harmlessly into natural silica sediments."
    },
    dosage: {
      minimum: "1.0%",
      recommended: "5.0% (as raw active liquid)",
      premium: "10.0%",
      maximum: "15.0%",
      household: "2.0% - 6.0% in laundry powders and automatic dishwashing liquids",
      industrial: "5.0% - 12% in commercial vehicle washes and institutional degreasers"
    },
    performance: {
      cleaning: 7,
      foam: 1,
      oilRemoval: 5,
      greaseCutting: 6,
      skinMildness: 5, // alkaline
      hardWater: 7
    },
    sustainability: {
      biodegradability: "Mineral compound; converts to natural amorphous clay silica",
      plantBasedPct: 0,
      petroleumBasedPct: 0,
      vocStatus: "Zero VOC",
      microplasticStatus: "Non-microplastic",
      aquaticToxicity: "LC50 (Fish) ~ 310 mg/L",
      greenRating: "A"
    },
    safety: {
      ppe: ["Safety Glasses", "Light Nitrile Gloves", "Lab Coat"],
      ghsClassification: ["Skin Irritation (Category 2)", "Serious Eye Damage (Category 1)", "Specific Target Organ Toxicity (Category 3)"],
      hazardStatements: ["H315: Causes skin irritation", "H318: Causes serious eye damage", "H335: May cause respiratory irritation"],
      precautionaryStatements: [
        "P280: Wear protective gloves and eye protection.",
        "P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes."
      ],
      firstAid: "Rinse eyes or skin thoroughly with clean water for 15 minutes. Highly sticky; clean spills quickly.",
      msdsSummary: "Highly alkaline viscous liquid. Avoid long direct skin contact to prevent drying and irritation. Extremely slippery when spilled."
    }
  }
];
