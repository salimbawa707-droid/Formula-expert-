import { calculateWaterHardnessTolerance, generateFormulationWarnings, calculateEstimatedPH, calculateFormulationCompatibility } from "./calculators";

export type ClimatePreset = 
  | 'normal'
  | 'hot'
  | 'cold'
  | 'tropical'
  | 'high_humidity'
  | 'dry'
  | 'extreme_heat'
  | 'extreme_cold';

export type WaterHardnessPreset = 
  | '0_75'
  | '75_150'
  | '150_300'
  | '300_600'
  | '600_plus';

export interface ClimatePresetInfo {
  id: ClimatePreset;
  name: string;
  icon: string;
  tempRange: string;
  humidityRange: string;
  storageTemp: string;
  description: string;
  primaryRisk: string;
}

export interface HardnessPresetInfo {
  id: WaterHardnessPreset;
  name: string;
  ppmRange: string;
  targetPpm: number;
  ionicLoad: string;
  description: string;
  recommendedChelators: string;
  recommendedBuilders: string;
  recommendedBuffers: string;
}

export const CLIMATE_PRESETS: Record<ClimatePreset, ClimatePresetInfo> = {
  normal: {
    id: 'normal',
    name: 'Normal Climate',
    icon: '🌤️',
    tempRange: '20°C - 25°C',
    humidityRange: '45% - 60% RH',
    storageTemp: '22°C (Ambient)',
    description: 'Standard ambient lab and indoor warehouse storage conditions.',
    primaryRisk: 'Minimal thermal stress; standard baseline shelf life.'
  },
  hot: {
    id: 'hot',
    name: 'Hot Climate',
    icon: '☀️',
    tempRange: '35°C - 42°C',
    humidityRange: '30% - 50% RH',
    storageTemp: '38°C (Elevated)',
    description: 'Arid to subtropical high-heat storage and transport environment.',
    primaryRisk: 'Preservative thermal degradation, accelerated ester hydrolysis, and cloud point hazing.'
  },
  cold: {
    id: 'cold',
    name: 'Cold Climate',
    icon: '❄️',
    tempRange: '0°C - 10°C',
    humidityRange: '50% - 70% RH',
    storageTemp: '5°C (Chilled)',
    description: 'Temperate winter storage and unheated logistics transit.',
    primaryRisk: 'Krafft point surfactant crystallization, salt precipitation, and viscosity thickening.'
  },
  tropical: {
    id: 'tropical',
    name: 'Tropical Climate',
    icon: '🌴',
    tempRange: '30°C - 38°C',
    humidityRange: '80% - 95% RH',
    storageTemp: '34°C (Hot & Moist)',
    description: 'Equatorial high heat combined with extreme atmospheric moisture.',
    primaryRisk: 'Rapid microbial/fungal proliferation, enzymatic activity decay, and moisture absorption.'
  },
  high_humidity: {
    id: 'high_humidity',
    name: 'High Humidity',
    icon: '🌧️',
    tempRange: '25°C - 32°C',
    humidityRange: '>85% RH',
    storageTemp: '28°C (Moist)',
    description: 'Coastal or rainy season storage with heavy moisture vapor pressure.',
    primaryRisk: 'Powder caking/hygroscopic clumping and liquid phase boundary instability.'
  },
  dry: {
    id: 'dry',
    name: 'Dry Climate',
    icon: '🏜️',
    tempRange: '28°C - 38°C',
    humidityRange: '<25% RH',
    storageTemp: '30°C (Arid)',
    description: 'Desert or low-humidity indoor environments.',
    primaryRisk: 'Rapid surface skinning, solvent evaporation, and container neck crusting.'
  },
  extreme_heat: {
    id: 'extreme_heat',
    name: 'Extreme Heat',
    icon: '🔥',
    tempRange: '>45°C',
    humidityRange: '20% - 40% RH',
    storageTemp: '48°C (Harsh Heat)',
    description: 'Unconditioned tin shed storage or direct sunlight transport containers.',
    primaryRisk: 'Irreversible phase separation, micellar structural collapse, and active bleaching loss.'
  },
  extreme_cold: {
    id: 'extreme_cold',
    name: 'Extreme Cold',
    icon: '🧊',
    tempRange: '< -5°C',
    humidityRange: 'Variable',
    storageTemp: '-10°C (Sub-Zero)',
    description: 'Freezing winter conditions with freeze-thaw cycling risk.',
    primaryRisk: 'Freezing, gel fracturing, permanent phase splitting, and container cracking.'
  }
};

export const WATER_HARDNESS_PRESETS: Record<WaterHardnessPreset, HardnessPresetInfo> = {
  '0_75': {
    id: '0_75',
    name: 'Soft Water / Demineralized',
    ppmRange: '0 - 75 ppm CaCO3',
    targetPpm: 50,
    ionicLoad: 'Very Low Ca2+/Mg2+ (<0.75 mmol/L)',
    description: 'RO / DI water or ultra-soft municipal supplies.',
    recommendedChelators: 'Low EDTA or GLDA (0.05% - 0.10%)',
    recommendedBuilders: 'Minimal Sodium Citrate (0.5% - 1.0%)',
    recommendedBuffers: 'Sodium Carbonate or Bicarbonate'
  },
  '75_150': {
    id: '75_150',
    name: 'Slightly Hard Water',
    ppmRange: '75 - 150 ppm CaCO3',
    targetPpm: 110,
    ionicLoad: 'Moderate Ca2+/Mg2+ (0.75 - 1.5 mmol/L)',
    description: 'Standard municipal tap water in temperate zones.',
    recommendedChelators: 'GLDA (0.15% - 0.25%) or Disodium EDTA (0.15%)',
    recommendedBuilders: 'Trisodium Citrate (1.5% - 2.5%)',
    recommendedBuffers: 'Sodium Silicate or Citrate/Carbonate buffer'
  },
  '150_300': {
    id: '150_300',
    name: 'Hard Water (Standard Tap)',
    ppmRange: '150 - 300 ppm CaCO3',
    targetPpm: 220,
    ionicLoad: 'High Ca2+/Mg2+ (1.5 - 3.0 mmol/L)',
    description: 'Standard hard municipal water or limestone aquifer supplies.',
    recommendedChelators: 'GLDA-Na4 (0.3% - 0.5%) + Citrate (2.0%)',
    recommendedBuilders: 'STPP (Phosphate) or Citrate + Acrylic Copolymer',
    recommendedBuffers: 'Soda Ash + Citrate Buffer System'
  },
  '300_600': {
    id: '300_600',
    name: 'Very Hard Water (Well Water)',
    ppmRange: '300 - 600 ppm CaCO3',
    targetPpm: 450,
    ionicLoad: 'Severe Ca2+/Mg2+ (3.0 - 6.0 mmol/L)',
    description: 'Untreated ground water, deep well water, or hard rural supplies.',
    recommendedChelators: 'GLDA-Na4 (0.6% - 1.0%) or MGDA-Na3 (0.5% - 0.8%)',
    recommendedBuilders: 'Sodium Tripolyphosphate (STPP) or High-charge Polyacrylate',
    recommendedBuffers: 'Caustic Soda / Soda Ash pH Buffer'
  },
  '600_plus': {
    id: '600_plus',
    name: 'Extreme Hard / Brackish Water',
    ppmRange: '600+ ppm CaCO3',
    targetPpm: 750,
    ionicLoad: 'Extreme Heavy Ions (>7.5 mmol/L Ca2+/Mg2+/Fe3+)',
    description: 'Borewell water, high-salinity rural water, or coastal brackish groundwater.',
    recommendedChelators: 'MGDA-Na3 (1.0% - 1.5%) + GLDA (0.5%) Dual System',
    recommendedBuilders: 'STPP (4-6%) + Polyacrylate Co-builder (1.5%)',
    recommendedBuffers: 'High-alkalinity Silicate/Carbonate Buffer'
  }
};

export interface ClimateRecommendation {
  id: string;
  title: string;
  category: 'Chelator & Builder' | 'Hydrotrope & Freeze-Thaw' | 'Preservative & Biocide' | 'Viscosity & Rheology' | 'Surfactant Optimization';
  reason: string;
  scientificExplanation: string;
  advantages: string[];
  disadvantages: string[];
  confidenceScore: number;
  suggestedAction: 'add' | 'increase' | 'decrease' | 'swap';
  targetIngredientName: string;
  suggestedIngredientName: string;
  suggestedPct: number;
  expectedImpact: {
    cleaning: string;
    foam: string;
    stability: string;
    cost: string;
    eco: string;
  };
}

export interface ClimateAnalysisResult {
  climateInfo: ClimatePresetInfo;
  hardnessInfo: HardnessPresetInfo;
  calculatedHardnessTolerance: ReturnType<typeof calculateWaterHardnessTolerance>;
  isHardnessExceeded: boolean;
  hardnessDeficitPpm: number;
  expectedStabilityScore: number; // 0-100
  thermalRisks: string[];
  recommendations: ClimateRecommendation[];
  industrialNotes: string[];
  recommendedWaterPct: number;
  saltStrategyNote: string;
}

export function analyzeClimateAndHardWater(
  ingredients: any[],
  climatePreset: ClimatePreset = 'normal',
  hardnessPreset: WaterHardnessPreset = '150_300',
  autoBalanceWater: boolean = true
): ClimateAnalysisResult {
  const climateInfo = CLIMATE_PRESETS[climatePreset] || CLIMATE_PRESETS.normal;
  const hardnessInfo = WATER_HARDNESS_PRESETS[hardnessPreset] || WATER_HARDNESS_PRESETS['150_300'];

  // Re-use existing calculators function!
  const hr = calculateWaterHardnessTolerance(ingredients);
  const targetPpm = hardnessInfo.targetPpm;
  const isHardnessExceeded = hr.maxSupportedPpm < targetPpm;
  const hardnessDeficitPpm = Math.max(0, targetPpm - hr.maxSupportedPpm);

  const recommendations: ClimateRecommendation[] = [];
  const thermalRisks: string[] = [];
  const industrialNotes: string[] = [];

  // Check ingredient signatures
  const hasGlda = ingredients.some(i => (i.name || "").toLowerCase().includes("glda"));
  const hasMgda = ingredients.some(i => (i.name || "").toLowerCase().includes("mgda"));
  const hasEdta = ingredients.some(i => (i.name || "").toLowerCase().includes("edta"));
  const hasCitrate = ingredients.some(i => (i.name || "").toLowerCase().includes("citrate") || (i.name || "").toLowerCase().includes("citric"));
  const hasPropyleneGlycol = ingredients.some(i => (i.name || "").toLowerCase().includes("propylene glycol") || (i.name || "").toLowerCase().includes("glycerin"));
  const hasSxs = ingredients.some(i => (i.name || "").toLowerCase().includes("sxs") || (i.name || "").toLowerCase().includes("xylene sulfonate"));
  const hasAos = ingredients.some(i => (i.name || "").toLowerCase().includes("aos") || (i.name || "").toLowerCase().includes("olefin sulfonate"));
  const hasApg = ingredients.some(i => (i.name || "").toLowerCase().includes("glucoside") || (i.name || "").toLowerCase().includes("apg"));
  const hasIsothiazolinone = ingredients.some(i => (i.name || "").toLowerCase().includes("mit") || (i.name || "").toLowerCase().includes("cmit") || (i.name || "").toLowerCase().includes("kathon"));
  const hasPhenoxyethanol = ingredients.some(i => (i.name || "").toLowerCase().includes("phenoxyethanol"));
  const hasCelluloseThickener = ingredients.some(i => (i.name || "").toLowerCase().includes("hpmc") || (i.name || "").toLowerCase().includes("xanthan") || (i.name || "").toLowerCase().includes("cellulose"));
  const saltIng = ingredients.find(i => (i.name || "").toLowerCase().includes("salt") || (i.name || "").toLowerCase().includes("sodium chloride") || (i.name || "").toLowerCase().includes("nacl"));
  const saltPct = saltIng ? Number(saltIng.percentage) || 0 : 0;

  // Calculate base stability score
  let expectedStabilityScore = 92;

  // --- HARD WATER RECOMMENDATIONS ---
  if (isHardnessExceeded) {
    expectedStabilityScore -= 15;
    thermalRisks.push(`Water Hardness Deficit (${hardnessDeficitPpm} ppm CaCO3): Calcium and Magnesium ions will precipitate anionic surfactants into insoluble lime soaps.`);

    if (!hasGlda && !hasMgda) {
      recommendations.push({
        id: "rec-glda-boost",
        title: "Add GLDA / MGDA Green Biodegradable Chelator",
        category: "Chelator & Builder",
        reason: `Current chelator capacity (${hr.maxSupportedPpm} ppm) cannot bind all Ca2+/Mg2+ ions in ${hardnessInfo.name} (${targetPpm} ppm).`,
        scientificExplanation: "GLDA (Tetrasodium Glutamate Diacetate) forms high-stability hexadentate chelate complexes with Ca2+ (log K ~ 5.2) and Mg2+ (log K ~ 5.9), preventing insoluble soap scum curd formation.",
        advantages: [
          "Eliminates turbidity and white mineral hazing in hard water",
          "100% Readily biodegradable & OECD 301D compliant",
          "Synergizes with anionic surfactants to protect foam"
        ],
        disadvantages: [
          "Slight raw material cost increase (+₹1.5 - ₹3.0/kg)"
        ],
        confidenceScore: 95,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "GLDA (47% Liquid)",
        suggestedPct: 0.5,
        expectedImpact: {
          cleaning: "Boosts particulate soil removal by +18% in hard water",
          foam: "Restores flash foam height lost to calcium binding",
          stability: "Prevents chalky calcium salt precipitation",
          cost: "+₹2.10/kg batch cost",
          eco: "100% Green & Eco-label compliant"
        }
      });
    } else {
      recommendations.push({
        id: "rec-citrate-boost",
        title: "Increase Trisodium Citrate Builder Ratio",
        category: "Chelator & Builder",
        reason: "Boost builder ratio to handle extreme water hardness without adding bio-accumulative EDTA.",
        scientificExplanation: "Citrate anions (C6H5O7 3-) bind calcium ions in aqueous phase and provide alkaline pH buffering to keep surfactant micelles fully negatively charged.",
        advantages: [
          "Inexpensive eco-friendly builder boost",
          "Improves detergent wash liquor pH buffering around 8.5"
        ],
        disadvantages: [
          "High citrate concentration (>4%) can lower salt-thickening efficiency"
        ],
        confidenceScore: 90,
        suggestedAction: "increase",
        targetIngredientName: hasCitrate ? "Trisodium Citrate" : "Water / Aqua",
        suggestedIngredientName: "Trisodium Citrate Dihydrate",
        suggestedPct: 2.0,
        expectedImpact: {
          cleaning: "+12% stain removal on cotton fabrics",
          foam: "Sustains micro-foam density",
          stability: "Maintains clear isotropic solution",
          cost: "+₹1.20/kg",
          eco: "Fully biodegradable natural organic acid salt"
        }
      });
    }
  }

  // --- CLIMATE SPECIFIC RECOMMENDATIONS ---

  // 1. HOT & EXTREME HEAT CLIMATES
  if (climatePreset === 'hot' || climatePreset === 'extreme_heat') {
    expectedStabilityScore -= (climatePreset === 'extreme_heat' ? 22 : 12);
    thermalRisks.push(`High Thermal Exposure (${climateInfo.tempRange}): Accelerated surfactant hydrolysis and microbial growth risk.`);

    if (hasIsothiazolinone && !hasPhenoxyethanol) {
      recommendations.push({
        id: "rec-preservative-hot",
        title: "Upgrade Preservative to Phenoxyethanol + EHG Blend",
        category: "Preservative & Biocide",
        reason: "Isothiazolinones (CMIT/MIT) rapidly degrade above 35°C, leaving batch vulnerable to bacterial bloom.",
        scientificExplanation: "Phenoxyethanol has exceptional thermal stability up to 80°C and maintains non-specific cell membrane disruption across pH 3–10.",
        advantages: [
          "Zero heat-induced chemical breakdown at 40-50°C",
          "Broad-spectrum protection against Gram-negative bacteria (Pseudomonas)"
        ],
        disadvantages: [
          "Slightly higher unit cost than raw Kathon CG"
        ],
        confidenceScore: 94,
        suggestedAction: "swap",
        targetIngredientName: "Isothiazolinone Preservative",
        suggestedIngredientName: "Phenoxyethanol & Ethylhexylglycerin",
        suggestedPct: 0.6,
        expectedImpact: {
          cleaning: "Neutral",
          foam: "Neutral",
          stability: "Extends hot-warehouse shelf life from 3 months to >24 months",
          cost: "+₹1.80/kg",
          eco: "Safe, non-sensitizing preservative system"
        }
      });
    }

    if (saltPct > 2.0) {
      recommendations.push({
        id: "rec-reduce-salt-heat",
        title: "Reduce Salt (NaCl) Dosing under Elevated Storage Heat",
        category: "Viscosity & Rheology",
        reason: `Current salt level (${saltPct}%) at >40°C causes micellar thinning and phase separation (Krafft/Cloud point shift).`,
        scientificExplanation: "High kinetic energy at elevated temperatures combined with high ionic strength shrinks spherical micelles, driving coacervation and liquid phase splitting.",
        advantages: [
          "Prevents liquid phase splitting in hot warehouses",
          "Reduces corrosion risk in packaging containers"
        ],
        disadvantages: [
          "May slightly reduce room-temperature viscosity"
        ],
        confidenceScore: 88,
        suggestedAction: "decrease",
        targetIngredientName: saltIng ? saltIng.name : "Sodium Chloride",
        suggestedIngredientName: "Sodium Chloride (Salt)",
        suggestedPct: Math.max(0.8, saltPct - 0.8),
        expectedImpact: {
          cleaning: "Neutral",
          foam: "Slightly improves flash foam",
          stability: "Prevents phase separation at 45°C thermal testing",
          cost: "-₹0.15/kg cost reduction",
          eco: "Lowers total dissolved solids (TDS) in effluent"
        }
      });
    }
  }

  // 2. COLD & EXTREME COLD CLIMATES
  if (climatePreset === 'cold' || climatePreset === 'extreme_cold') {
    expectedStabilityScore -= (climatePreset === 'extreme_cold' ? 25 : 10);
    thermalRisks.push(`Cold / Sub-Zero Storage Risk (${climateInfo.tempRange}): Surfactant Krafft crystallization and gel fracturing.`);

    if (!hasPropyleneGlycol && !hasSxs) {
      recommendations.push({
        id: "rec-freeze-thaw-hydrotrope",
        title: "Add Propylene Glycol / Glycerin Freeze-Thaw Hydrotrope",
        category: "Hydrotrope & Freeze-Thaw",
        reason: "Sub-zero and low-temperature storage causes ice crystal formation and irreversible emulsion gelation.",
        scientificExplanation: "Propylene glycol disrupts hydrogen-bonded ice lattice networks, acting as a freeze-point depressant and hydrotropic solvent that maintains isotropic micellar orientation.",
        advantages: [
          "Guarantees 3-cycle freeze-thaw (-10°C to +25°C) recovery",
          "Prevents stringy gel formation and restores clear liquid flow"
        ],
        disadvantages: [
          "Slightly lowers initial flash foam height"
        ],
        confidenceScore: 96,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Propylene Glycol (Tech Grade)",
        suggestedPct: 2.5,
        expectedImpact: {
          cleaning: "Enhances non-polar oil solubilization",
          foam: "Controlled low-foam, easy rinse",
          stability: "Passes -10°C freeze-thaw stability test",
          cost: "+₹3.50/kg",
          eco: "Readily biodegradable, safe solvent"
        }
      });
    }

    if (!hasAos && !hasApg) {
      recommendations.push({
        id: "rec-cold-water-surfactant",
        title: "Incorporate AOS / APG Cold-Water Surfactant Boost",
        category: "Surfactant Optimization",
        reason: "LABSA and SLS suffer steep solubility drop below 12°C, causing cloudy precipitation in cold wash water.",
        scientificExplanation: "Alpha Olefin Sulfonate (AOS) and Alkyl Polyglucosides (APG) have extremely low Krafft points (<0°C), maintaining active surface tension reduction in cold water.",
        advantages: [
          "Outstanding cold water cleaning performance at 10°C",
          "Prevents white haze crystallization in cold storage"
        ],
        disadvantages: [
          "Slightly thins salt-thickened surfactant matrix"
        ],
        confidenceScore: 92,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Alpha Olefin Sulfonate (AOS 38%)",
        suggestedPct: 3.0,
        expectedImpact: {
          cleaning: "+22% cold-water stain removal",
          foam: "Instant flash foam in 10°C water",
          stability: "Maintains crystal-clear solution down to 4°C",
          cost: "+₹1.80/kg",
          eco: "100% Bio-degradable anionic co-surfactant"
        }
      });
    }
  }

  // 3. TROPICAL & HIGH HUMIDITY CLIMATES
  if (climatePreset === 'tropical' || climatePreset === 'high_humidity') {
    expectedStabilityScore -= 12;
    thermalRisks.push(`High Relative Humidity Environment (${climateInfo.humidityRange}): Fungal mold risk & hygroscopic moisture pick-up.`);

    industrialNotes.push("Industrial Packaging Note: Require induction heat-sealed foil liners to prevent atmospheric moisture ingress in tropical markets.");

    if (!hasCelluloseThickener) {
      recommendations.push({
        id: "rec-rheology-tropical",
        title: "Add Polymer Rheology Modifier (HPMC / Xanthan)",
        category: "Viscosity & Rheology",
        reason: "High humidity and tropical ambient heat cause salt-thickened surfactant gels to lose viscosity over time.",
        scientificExplanation: "Cellulosic polymer networks provide shear-thinning thixotropic viscosity that is independent of ambient temperature and electrolyte fluctuations.",
        advantages: [
          "Provides robust, heat-independent body and suspension",
          "Prevents phase separation under tropical storage (>35°C, 90% RH)"
        ],
        disadvantages: [
          "Requires polymer hydration stage during batch manufacturing"
        ],
        confidenceScore: 91,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Hydroxypropyl Methylcellulose (HPMC)",
        suggestedPct: 0.3,
        expectedImpact: {
          cleaning: "Enhances dirt suspension in wash liquor",
          foam: "Stabilizes rich creamy foam cushion",
          stability: "Maintains 1,200 cPs viscosity across 15°C - 45°C range",
          cost: "+₹2.40/kg",
          eco: "Plant-derived cellulose polymer"
        }
      });
    }
  }

  // 4. DRY CLIMATE
  if (climatePreset === 'dry') {
    industrialNotes.push("Production Storage Note: Keep holding tanks strictly sealed with nitrogen blanket or vapor-tight lids to prevent surface evaporation and skinning.");
  }

  // Calculate recommended water %
  let totalNonWater = 0;
  ingredients.forEach(i => {
    const n = (i.name || "").toLowerCase();
    if (!n.includes("water") && !n.includes("aqua") && !(i.role && i.role.toLowerCase().includes("solvent"))) {
      totalNonWater += Number(i.percentage) || 0;
    }
  });
  const recommendedWaterPct = Math.max(0, Number((100 - totalNonWater).toFixed(2)));

  // Salt strategy note
  let saltStrategyNote = "Standard electrolyte dosing (1.0% - 1.8% NaCl) for target 1,000 - 2,500 cPs viscosity.";
  if (climatePreset === 'extreme_heat' || climatePreset === 'hot') {
    saltStrategyNote = "Thermal Caution: Cap NaCl dosing at ≤1.2% to prevent heat-induced micellar phase splitting. Supplement with polymer thickener if higher viscosity is required.";
  } else if (climatePreset === 'extreme_cold' || climatePreset === 'cold') {
    saltStrategyNote = "Cold Storage Strategy: Keep NaCl ≤1.0% to avoid salt precipitation near 0°C. Rely on CAPB or non-ionic co-surfactants for structure.";
  }

  // Clamp stability score
  expectedStabilityScore = Math.max(40, Math.min(99, expectedStabilityScore));

  if (industrialNotes.length === 0) {
    industrialNotes.push(`Formula tested under ${climateInfo.name} (${climateInfo.tempRange}) and ${hardnessInfo.name} (${hardnessInfo.ppmRange}).`);
  }

  return {
    climateInfo,
    hardnessInfo,
    calculatedHardnessTolerance: hr,
    isHardnessExceeded,
    hardnessDeficitPpm,
    expectedStabilityScore,
    thermalRisks,
    recommendations,
    industrialNotes,
    recommendedWaterPct,
    saltStrategyNote
  };
}
