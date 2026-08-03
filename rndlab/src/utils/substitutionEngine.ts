export type RegionalMarket = 'global' | 'india' | 'middle_east' | 'africa' | 'europe' | 'southeast_asia';

export type SubstitutionObjective = 
  | 'all'
  | 'cost_reduction'
  | 'eco_upgrade'
  | 'performance_boost'
  | 'regulatory_compliance'
  | 'hard_water_boost';

export interface RegionalInfo {
  suitabilityScore: number; // 1-100
  note: string;
  typicalSupplier?: string;
}

export interface IngredientSubstitutionRule {
  id: string;
  targetIngredientPattern: string; // regex or substring matching target
  targetCategory: string;
  substituteName: string;
  substituteInci?: string;
  substitutionType: 'Direct Swap' | 'Equivalent Active' | 'Green Upgrade' | 'Regional Alternative' | 'Cost Saver';
  replacementRatio: number; // e.g. 1.0 means 1:1, 1.2 means use 1.2x of substitute
  reason: string;
  advantages: string[];
  disadvantages: string[];
  costDeltaPct: number; // negative means cheaper, positive means more expensive
  performanceDeltaPct: number;
  phImpact: string;
  foamImpact: string;
  cleaningImpact: string;
  viscosityImpact: string;
  stabilityImpact: string;
  ecoImpact: string;
  confidenceScore: number; // 0-100%
  warning?: string;
  regionalData: Record<RegionalMarket, RegionalInfo>;
  primaryObjective: SubstitutionObjective;
}

export const REGIONAL_MARKET_LABELS: Record<RegionalMarket, { name: string; flag: string; description: string }> = {
  global: { name: "Global Standard", flag: "🌐", description: "Worldwide standard supply chain availability" },
  india: { name: "India Subcontinent", flag: "🇮🇳", description: "High availability of LABSA, Soda Ash, SLES, Salt, and Bio-Glycerin" },
  middle_east: { name: "Middle East & GCC", flag: "🇦🇪", description: "Abundant Petrochemical Ethoxylates, Caustic Soda, high-heat stability focus" },
  africa: { name: "Africa Continent", flag: "🇿🇦", description: "Palm oleochemicals, soda ash, economical bulk surfactant blends" },
  europe: { name: "Europe (EU / UK)", flag: "🇪🇺", description: "REACH compliant, STPP & NP-9 banned, high demand for APGs & GLDA" },
  southeast_asia: { name: "South East Asia", flag: "🇸🇬", description: "Palm Kernel Oil derivatives, MES, APGs, tropical high humidity stability" }
};

export const SUBSTITUTION_RULES: IngredientSubstitutionRule[] = [
  // 1. LABSA Alternatives
  {
    id: "sub-labsa-aos",
    targetIngredientPattern: "labsa",
    targetCategory: "Surfactants (Anionic)",
    substituteName: "Alpha Olefin Sulfonate (AOS 38%)",
    substituteInci: "Sodium C14-16 Olefin Sulfonate",
    substitutionType: "Cost Saver",
    replacementRatio: 1.15,
    reason: "AOS provides superior hard water tolerance and skin mildness compared to LABSA while maintaining high foam height.",
    advantages: [
      "Excellent flash foam in hard water conditions",
      "Easier neutralization (pre-neutralized liquid)",
      "Milder skin feel than linear alkylbenzene sulfonate"
    ],
    disadvantages: [
      "Slightly lower sebum removal on cotton fabrics than pure LABSA",
      "Requires higher fluid volume due to 38% commercial concentration vs 90% LABSA"
    ],
    costDeltaPct: -8,
    performanceDeltaPct: +2,
    phImpact: "Neutral (pH 7-8). Eliminates acidic neutralization step required for LABSA.",
    foamImpact: "Higher initial flash foam; excellent stability in hard water.",
    cleaningImpact: "Equal particulate soil removal; slightly lower grease emulsification at high oil loads.",
    viscosityImpact: "Moderately thins viscosity; requires salt (NaCl) or CAPB boost.",
    stabilityImpact: "Superior cold-water clarity; no precipitate formation below 10°C.",
    ecoImpact: "100% Readily Biodegradable; lower aquatic toxicity than un-neutralized sulfonic acid.",
    confidenceScore: 92,
    primaryObjective: "hard_water_boost",
    regionalData: {
      global: { suitabilityScore: 85, note: "Widely available globally." },
      india: { suitabilityScore: 95, note: "Extremely popular cost-effective substitute produced locally in Gujarat/Maharashtra." },
      middle_east: { suitabilityScore: 88, note: "Readily imported with good heat stability." },
      africa: { suitabilityScore: 90, note: "Preferred for budget dishwash and shampoo formulations." },
      europe: { suitabilityScore: 80, note: "Replaced partially by APG/amino acid surfactants in ultra-eco lines." },
      southeast_asia: { suitabilityScore: 92, note: "Abundant supply from regional oleochemical refiners." }
    }
  },
  {
    id: "sub-labsa-mes",
    targetIngredientPattern: "labsa",
    targetCategory: "Surfactants (Anionic)",
    substituteName: "Methyl Ester Sulfonate (MES 80%)",
    substituteInci: "Sodium Methyl 2-Sulfolaurate",
    substitutionType: "Green Upgrade",
    replacementRatio: 0.95,
    reason: "100% bio-based plant-derived anionic surfactant offering higher detergency than LABSA at equal active concentration.",
    advantages: [
      "Derived 100% from Palm/Coconut renewable feedstocks",
      "Outstanding calcium/magnesium hard water tolerance",
      "Lower carbon footprint than petroleum LABSA"
    ],
    disadvantages: [
      "Requires temperature-controlled dissolving (>50°C during compounding)",
      "Narrower pH stability window (pH 5.5 - 9.0)"
    ],
    costDeltaPct: -12,
    performanceDeltaPct: +6,
    phImpact: "Maintains neutral to slightly alkaline pH; avoid pH > 10.5 to prevent hydrolysis.",
    foamImpact: "Dense micro-foam, slightly slower flash foaming.",
    cleaningImpact: "Superior particulate and oil removal on synthetic polyester fabrics.",
    viscosityImpact: "Builds structured paste network; reduces polymer thickener requirements.",
    stabilityImpact: "Excellent powder flowability and liquid clarity at room temperature.",
    ecoImpact: "100% Renewable Carbon Index (RCI); rapidly biodegradable.",
    confidenceScore: 88,
    primaryObjective: "eco_upgrade",
    regionalData: {
      global: { suitabilityScore: 82, note: "Growing market share in eco laundry." },
      india: { suitabilityScore: 88, note: "Increasing domestic production from palm oil imports." },
      middle_east: { suitabilityScore: 70, note: "Petrochemical LABSA remains more dominant locally." },
      africa: { suitabilityScore: 85, note: "Economical substitute for laundry detergent pastes." },
      europe: { suitabilityScore: 95, note: "High demand due to EU bio-based content targets." },
      southeast_asia: { suitabilityScore: 98, note: "Primary production hub (Malaysia & Indonesia); lowest regional pricing." }
    }
  },

  // 2. SLES Alternatives
  {
    id: "sub-sles-apg",
    targetIngredientPattern: "sles",
    targetCategory: "Surfactants (Anionic)",
    substituteName: "Coco Glucoside (APG 0810 50%)",
    substituteInci: "Coco Glucoside",
    substitutionType: "Green Upgrade",
    replacementRatio: 1.1,
    reason: "100% bio-based non-ionic surfactant completely free of 1,4-Dioxane, Ethylene Oxide, and Sulfates.",
    advantages: [
      "Zero 1,4-Dioxane impurities & 100% sulfate-free",
      "Ultra-mild on skin and mucous membranes",
      "Excellent synergistic cleaning with anionic surfactants"
    ],
    disadvantages: [
      "Slightly higher raw material cost",
      "High natural pH (11.5 - 12.5) requires pH reduction during batching"
    ],
    costDeltaPct: 15,
    performanceDeltaPct: +4,
    phImpact: "Raises raw batch pH; requires citric acid adjustment to target range.",
    foamImpact: "Rich, stable foam cushion; highly compatible with pump foamers.",
    cleaningImpact: "Outstanding degreasing and soil dispersion.",
    viscosityImpact: "Does not respond to NaCl salt thickening; requires associative polymer (e.g. PEG-120 Methyl Glucose Dioleate) or Xanthan.",
    stabilityImpact: "Outstanding electrolyte stability; resistant to hard water precipitation.",
    ecoImpact: "Ecocert & COSMOS approved; 100% plant-derived from coconut oil and glucose.",
    confidenceScore: 95,
    primaryObjective: "eco_upgrade",
    regionalData: {
      global: { suitabilityScore: 92, note: "Gold standard for eco-certified formulations." },
      india: { suitabilityScore: 82, note: "Widely used in premium sulfate-free handwash and baby laundry." },
      middle_east: { suitabilityScore: 80, note: "Gaining popularity in luxury hotel amenities." },
      africa: { suitabilityScore: 75, note: "Higher cost limits usage to specialty organic lines." },
      europe: { suitabilityScore: 98, note: "Mandatory choice for EU Ecolabel certified formulations." },
      southeast_asia: { suitabilityScore: 94, note: "Abundant regional refining capacity." }
    }
  },
  {
    id: "sub-sles-sls",
    targetIngredientPattern: "sles",
    targetCategory: "Surfactants (Anionic)",
    substituteName: "Sodium Lauryl Sulfate (SLS 30% / Needles)",
    substituteInci: "Sodium Lauryl Sulfate",
    substitutionType: "Cost Saver",
    replacementRatio: 0.9,
    reason: "Provides sharper flash foam and higher immediate wetting than SLES where ethoxylation is not strictly required.",
    advantages: [
      "Higher active surfactant content per kg",
      "Cheaper processing cost per active unit",
      "Immediate fast-clearing foam profile"
    ],
    disadvantages: [
      "Higher skin irritation potential than ethoxylated SLES 2EO",
      "Higher Krafft point (can cloud in cold climates below 15°C)"
    ],
    costDeltaPct: -10,
    performanceDeltaPct: +3,
    phImpact: "Neutral (pH 7-8). Fully compatible.",
    foamImpact: "Taller initial foam height, faster foam generation.",
    cleaningImpact: "High oil removal rate, sharp surface tension reduction.",
    viscosityImpact: "Responds very strongly to salt (NaCl) thickening.",
    stabilityImpact: "May crystallize at low ambient storage temperatures (<12°C).",
    ecoImpact: "Readily biodegradable, readily available from coconut/palm alcohol.",
    confidenceScore: 90,
    primaryObjective: "cost_reduction",
    regionalData: {
      global: { suitabilityScore: 88, note: "Standard workhorse surfactant." },
      india: { suitabilityScore: 92, note: "Standard ingredient in washing powders and industrial cleaners." },
      middle_east: { suitabilityScore: 90, note: "Widely stocked in industrial chemical hubs." },
      africa: { suitabilityScore: 94, note: "Primary affordable foamer for local dishwashing liquids." },
      europe: { suitabilityScore: 75, note: "Partially replaced by mild ethoxylated or sulfate-free surfactants." },
      southeast_asia: { suitabilityScore: 90, note: "Direct local supply from oleochemical plants." }
    }
  },

  // 3. LAE-9 / Nonionic Alternatives
  {
    id: "sub-lae9-c12pareth7",
    targetIngredientPattern: "lae-9",
    targetCategory: "Surfactants (Nonionic)",
    substituteName: "C12-15 Pareth-7 (Ethoxylated Alcohol 7EO)",
    substituteInci: "C12-15 Pareth-7",
    substitutionType: "Equivalent Active",
    replacementRatio: 1.0,
    reason: "Optimal 7-mole ethoxylate replacement for LAE-9 offering lower cloud point and superior oily stain removal in cold water wash cycles.",
    advantages: [
      "Better cold-water oil and grease solubilization (Cloud point ~48°C)",
      "Lower aqueous viscosity for easier bulk pumping",
      "1:1 drop-in replacement in liquid laundry detergents"
    ],
    disadvantages: [
      "Slightly lower water solubility at elevated temperatures (>60°C)"
    ],
    costDeltaPct: -5,
    performanceDeltaPct: +5,
    phImpact: "Neutral non-ionic. No pH shift.",
    foamImpact: "Controlled low-to-medium foam suitable for front-load automatic washing machines.",
    cleaningImpact: "Superior removal of motor oil, grease, and sebum on synthetic fibers.",
    viscosityImpact: "Slightly lowers batch viscosity, easing pouring and dispensing.",
    stabilityImpact: "Clear isotropic liquid across 5°C to 45°C range.",
    ecoImpact: "Readily biodegradable under aerobic and anaerobic test guidelines.",
    confidenceScore: 96,
    primaryObjective: "performance_boost",
    regionalData: {
      global: { suitabilityScore: 95, note: "Industry standard non-ionic for automatic detergent." },
      india: { suitabilityScore: 90, note: "Widely imported and locally blended." },
      middle_east: { suitabilityScore: 98, note: "Massively produced by regional petrochemical plants." },
      africa: { suitabilityScore: 88, note: "Standard raw material for liquid detergent manufacturers." },
      europe: { suitabilityScore: 95, note: "Fully REACH compliant." },
      southeast_asia: { suitabilityScore: 92, note: "Commonly specified by regional formulators." }
    }
  },

  // 4. Builder / Chelator Substitutions (STPP & EDTA replacements)
  {
    id: "sub-stpp-citrate-glda",
    targetIngredientPattern: "stpp",
    targetCategory: "Builders & Chelators",
    substituteName: "Trisodium Citrate + GLDA (Green Chelator Blend)",
    substituteInci: "Sodium Citrate & Tetrasodium Glutamate Diacetate",
    substitutionType: "Green Upgrade",
    replacementRatio: 1.0,
    reason: "100% Phosphate-free, eco-compliant builder system that eliminates aquatic eutrophication while preserving heavy calcium/magnesium binding.",
    advantages: [
      "Zero Phosphate contribution (prevents algal blooms)",
      "100% Biodegradable & non-toxic to aquatic life",
      "Excellent buffering capacity around pH 8.0 - 9.0",
      "EU Ecolabel and EPA Safer Choice compliant"
    ],
    disadvantages: [
      "Slightly higher raw material cost than industrial STPP",
      "Requires GLDA co-chelator to match STPP's iron/manganese sequestration"
    ],
    costDeltaPct: 8,
    performanceDeltaPct: +1,
    phImpact: "Provides smooth alkaline buffering; maintains stable pH without harsh spikes.",
    foamImpact: "No adverse effect on foam stability.",
    cleaningImpact: "Prevents graying and particulate re-deposition equal to STPP.",
    viscosityImpact: "Neutral effect on fluid rheology.",
    stabilityImpact: "Does not form insoluble chalky precipitates during long storage.",
    ecoImpact: "100% Biodegradable; zero water body pollution.",
    confidenceScore: 94,
    warning: "STPP is strictly banned in Europe and North America laundry applications due to environmental regulations.",
    primaryObjective: "regulatory_compliance",
    regionalData: {
      global: { suitabilityScore: 90, note: "Mandatory transition for green formulation." },
      india: { suitabilityScore: 85, note: "Rapidly replacing STPP in urban premium brands." },
      middle_east: { suitabilityScore: 82, note: "Increasingly specified in commercial laundry." },
      africa: { suitabilityScore: 78, note: "STPP still used in budget markets, but citrate is expanding." },
      europe: { suitabilityScore: 100, note: "STPP is legally banned; Citrate+GLDA is the gold standard." },
      southeast_asia: { suitabilityScore: 90, note: "Adopted across export-grade eco detergent lines." }
    }
  },
  {
    id: "sub-edta-glda",
    targetIngredientPattern: "edta",
    targetCategory: "Builders & Chelators",
    substituteName: "Tetrasodium Glutamate Diacetate (GLDA 47%)",
    substituteInci: "Tetrasodium Glutamate Diacetate",
    substitutionType: "Green Upgrade",
    replacementRatio: 1.0,
    reason: "Readily biodegradable, bio-based chelation agent derived from natural MSG (monosodium glutamate) replacing bio-accumulative EDTA.",
    advantages: [
      "High binding capacity for Ca2+, Mg2+, Cu2+, and Fe3+",
      "Readily biodegradable (>60% in 28 days OECD 301)",
      "High solubility over wide pH range (pH 2 - 12)",
      "Does not bioaccumulate in groundwater or food chains"
    ],
    disadvantages: [
      "Slightly higher cost per kg than raw EDTA powder"
    ],
    costDeltaPct: 12,
    performanceDeltaPct: +3,
    phImpact: "Alkaline liquid (pH ~11.5); minor neutralization may be needed if used at >2%.",
    foamImpact: "Neutral.",
    cleaningImpact: "Protects peroxide bleach and enzymes from metal ion degradation.",
    viscosityImpact: "No viscosity alteration.",
    stabilityImpact: "Prevents discoloration, rancidity, and precipitation in hard water.",
    ecoImpact: "Over 80% bio-based carbon index; OECD 301D readily biodegradable.",
    confidenceScore: 96,
    primaryObjective: "regulatory_compliance",
    regionalData: {
      global: { suitabilityScore: 94, note: "Top recommendation for sustainable chelators." },
      india: { suitabilityScore: 86, note: "Imported specialty chemical, growing adoption in personal care and laundry." },
      middle_east: { suitabilityScore: 88, note: "Used in high-end water treatment and cleaning formulations." },
      africa: { suitabilityScore: 80, note: "Edta substitution progressing in export formulations." },
      europe: { suitabilityScore: 99, note: "Standard EDTA replacement choice across EU." },
      southeast_asia: { suitabilityScore: 92, note: "High regional availability from major chemical distributors." }
    }
  },

  // 5. Hydrotrope & Solvent Alternatives
  {
    id: "sub-sxs-propylene-glycol",
    targetIngredientPattern: "sxs",
    targetCategory: "Solvents & Water Carriers",
    substituteName: "Propylene Glycol + Glycerin Blend",
    substituteInci: "Propylene Glycol & Glycerin",
    substitutionType: "Equivalent Active",
    replacementRatio: 0.85,
    reason: "Replaces aromatic xylene sulfonate with non-toxic, eco-friendly alcohol coupling solvents that boost freeze-thaw clarity and enzymatic enzyme stability.",
    advantages: [
      "Stabilizes incorporated enzymes (Protease/Amylase) during storage",
      "Eliminates aromatic hydrocarbon sulfonate odor",
      "Improves low-temperature pourability and freeze-thaw recovery"
    ],
    disadvantages: [
      "Higher raw material cost than bulk SXS 40%"
    ],
    costDeltaPct: 10,
    performanceDeltaPct: +4,
    phImpact: "Completely neutral (pH 7.0).",
    foamImpact: "Slightly reduces excess uncontrolled foam.",
    cleaningImpact: "Enhances dye transfer inhibition and optical clarity.",
    viscosityImpact: "Reduces stringy gel structures, giving smooth Newtonian liquid flow.",
    stabilityImpact: "Excellent freeze-thaw stability (-5°C to 50°C).",
    ecoImpact: "100% Non-hazardous to aquatic life; bio-glycerin is renewable.",
    confidenceScore: 91,
    primaryObjective: "eco_upgrade",
    regionalData: {
      global: { suitabilityScore: 90, note: "Standard solvent system for heavy duty liquid detergents." },
      india: { suitabilityScore: 92, note: "Bio-glycerin is extremely abundant and cheap in India from biodiesel production." },
      middle_east: { suitabilityScore: 88, note: "Widely available pharmaceutical-grade propylene glycol." },
      africa: { suitabilityScore: 85, note: "Glycerin blend is cost-effective locally." },
      europe: { suitabilityScore: 96, note: "Preferred eco-friendly hydrotrope coupling agent." },
      southeast_asia: { suitabilityScore: 94, note: "Refined palm-glycerin readily available at low cost." }
    }
  },

  // 6. Preservative Alternatives
  {
    id: "sub-formalin-phenoxyethanol",
    targetIngredientPattern: "formalin",
    targetCategory: "Preservatives",
    substituteName: "Phenoxyethanol + Ethylhexylglycerin (PE-EHG)",
    substituteInci: "Phenoxyethanol & Ethylhexylglycerin",
    substitutionType: "Green Upgrade",
    replacementRatio: 0.5,
    reason: "Completely replaces carcinogenic Formaldehyde/Formalin donors with a broad-spectrum, gentle preservative system.",
    advantages: [
      "100% Free of carcinogenic Formaldehyde emissions",
      "Broad spectrum inhibition against bacteria, yeast, and fungi",
      "Stable across pH 3.0 to 10.0 and temperatures up to 80°C"
    ],
    disadvantages: [
      "Higher unit cost per kg than raw industrial Formalin solution"
    ],
    costDeltaPct: 25,
    performanceDeltaPct: +8,
    phImpact: "Completely neutral. Unaffected by alkaline pH.",
    foamImpact: "Zero effect on foam profile.",
    cleaningImpact: "No interference with cleaning active matter.",
    viscosityImpact: "No impact on formula rheology.",
    stabilityImpact: "Long shelf life (>36 months); no yellowing over time.",
    ecoImpact: "Safe for human contact, non-sensitizing, regulatory compliant globally.",
    confidenceScore: 98,
    warning: "Formalin (Formaldehyde 37%) is classified as a Category 1B Carcinogen and strictly restricted in household items.",
    primaryObjective: "regulatory_compliance",
    regionalData: {
      global: { suitabilityScore: 96, note: "Global recommendation for safe preservation." },
      india: { suitabilityScore: 88, note: "Formalin being phased out across reputable Indian manufacturers." },
      middle_east: { suitabilityScore: 90, note: "Standard choice for compliance with GSO regulations." },
      africa: { suitabilityScore: 82, note: "Higher cost, but necessary for international safety compliance." },
      europe: { suitabilityScore: 100, note: "Formaldehyde is strictly banned under Annex III/V EU Cosmetic & Detergent regulations." },
      southeast_asia: { suitabilityScore: 95, note: "Adopted across regional consumer goods giants." }
    }
  },

  // 7. Viscosity & Foam Booster Alternatives (Cocamide DEA Replacement)
  {
    id: "sub-cde-capb-hpmc",
    targetIngredientPattern: "cocamide dea",
    targetCategory: "Electrolytes & Viscosity Modifiers",
    substituteName: "CAPB (30%) + HPMC / Xanthan Polymer",
    substituteInci: "Cocamidopropyl Betaine & Hydroxypropyl Methylcellulose",
    substitutionType: "Green Upgrade",
    replacementRatio: 1.0,
    reason: "Replaces diethanolamine (DEA) secondary amides linked to nitrosamine impurities with safe amphoteric betaine and cellulose thickeners.",
    advantages: [
      "100% Nitrosamine-free & DEA-free safety profile",
      "Synergistic skin mildness and flash foaming",
      "Independent control of viscosity (via cellulose) and foam (via betaine)"
    ],
    disadvantages: [
      "Requires pre-hydrating the HPMC polymer in warm water during batching"
    ],
    costDeltaPct: 2,
    performanceDeltaPct: +5,
    phImpact: "Neutral (pH 6-8).",
    foamImpact: "Creamy, dense foam structure with enhanced stability.",
    cleaningImpact: "Maintains foam cushioning and dirt suspension.",
    viscosityImpact: "Provides rich shear-thinning thixotropic gel body.",
    stabilityImpact: "Prevents phase separation at elevated temperatures (45°C).",
    ecoImpact: "Non-hazardous, non-toxic to aquatic organisms.",
    confidenceScore: 94,
    warning: "Cocamide DEA is listed under California Proposition 65 due to potential diethanolamine impurities.",
    primaryObjective: "regulatory_compliance",
    regionalData: {
      global: { suitabilityScore: 92, note: "Standard replacement for DEA-free formulations." },
      india: { suitabilityScore: 90, note: "CAPB is locally manufactured in large volumes at competitive prices." },
      middle_east: { suitabilityScore: 88, note: "High demand in personal handwash and dishwashing formulations." },
      africa: { suitabilityScore: 85, note: "Economical substitute when combined with local salt/CAPB." },
      europe: { suitabilityScore: 98, note: "DEA-containing ingredients strongly discouraged or restricted." },
      southeast_asia: { suitabilityScore: 95, note: "CAPB and cellulose polymers are widely manufactured regionally." }
    }
  }
];

export function findSubstitutionsForFormula(ingredients: any[], currentRegion: RegionalMarket = 'global', targetObjective: SubstitutionObjective = 'all'): {
  recommendations: {
    rule: IngredientSubstitutionRule;
    originalIngredient: any;
    recommendedQtyPct: number;
    estimatedCostImpactPerKg: number;
    regionalInfo: RegionalInfo;
  }[];
  potentialSavingsPct: number;
  overallEcoScoreGain: number;
} {
  const recommendations: any[] = [];
  let totalCostDeltaSum = 0;
  let totalEcoScoreGainSum = 0;

  ingredients.forEach(ing => {
    const ingNameLower = (ing.name || "").toLowerCase();
    
    // Find matching substitution rules
    const matchingRules = SUBSTITUTION_RULES.filter(rule => {
      const patternMatch = ingNameLower.includes(rule.targetIngredientPattern.toLowerCase());
      const objectiveMatch = targetObjective === 'all' || rule.primaryObjective === targetObjective;
      return patternMatch && objectiveMatch;
    });

    matchingRules.forEach(rule => {
      const origPct = Number(ing.percentage) || 0;
      const recommendedQtyPct = Number((origPct * rule.replacementRatio).toFixed(2));
      const origCostPerKg = Number(ing.costPerKg) || 0; // Rule #8: no invented default; 0 if user has not entered a price
      const estimatedCostImpactPerKg = Number(((origCostPerKg * (rule.costDeltaPct / 100)) * (origPct / 100)).toFixed(3));
      
      const regInfo = rule.regionalData[currentRegion] || rule.regionalData.global;

      recommendations.push({
        rule,
        originalIngredient: ing,
        recommendedQtyPct,
        estimatedCostImpactPerKg,
        regionalInfo: regInfo
      });

      totalCostDeltaSum += rule.costDeltaPct;
      if (rule.substitutionType === 'Green Upgrade') {
        totalEcoScoreGainSum += 12;
      }
    });
  });

  const potentialSavingsPct = recommendations.length > 0 ? Math.round(totalCostDeltaSum / recommendations.length) : 0;
  const overallEcoScoreGain = Math.min(30, totalEcoScoreGainSum);

  return {
    recommendations,
    potentialSavingsPct,
    overallEcoScoreGain
  };
}
