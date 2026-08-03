import { calculateCleaningPerformance, calculateActiveSurfactants, calculateRawSurfactants, calculateWaterHardnessTolerance } from "./calculators";

export type MachineProfile = 
  | 'front_load'
  | 'top_load'
  | 'hand_wash'
  | 'semi_auto'
  | 'fully_auto'
  | 'commercial'
  | 'industrial';

export interface MachineProfileInfo {
  id: MachineProfile;
  name: string;
  icon: string;
  targetFoamCategory: 'Low Foam (Controlled)' | 'Medium Foam' | 'High Flash Foam' | 'Ultra-Low / Zero Foam';
  targetFoamMm: string;
  agitationType: string;
  mechanicalAction: string;
  waterUsagePerKg: string;
  description: string;
  primaryRisk: string;
}

export const MACHINE_PROFILES: Record<MachineProfile, MachineProfileInfo> = {
  front_load: {
    id: 'front_load',
    name: 'Front Load Automatic',
    icon: '🧺',
    targetFoamCategory: 'Low Foam (Controlled)',
    targetFoamMm: '15 - 45 mm',
    agitationType: 'Horizontal Tumbling (Tumble Action)',
    mechanicalAction: 'High mechanical drop force with low water liquor ratio',
    waterUsagePerKg: '6.0 - 8.0 L/kg fabric',
    description: 'Requires strict low-foaming profile to prevent drum suds-lock and pump cavitation.',
    primaryRisk: 'Excessive foam causes suds-lock, incomplete rinsing, and sensor abort errors.'
  },
  top_load: {
    id: 'top_load',
    name: 'Top Load Automatic',
    icon: '🌀',
    targetFoamCategory: 'Medium Foam',
    targetFoamMm: '50 - 90 mm',
    agitationType: 'Vertical Impeller / Agitator Vanes',
    mechanicalAction: 'High water volume shear agitation',
    waterUsagePerKg: '12.0 - 16.0 L/kg fabric',
    description: 'Benefits from medium cushion foam to suspend floating soil without overwhelming overflow drainage.',
    primaryRisk: 'Low foam may cause fabric harshness; excessive foam causes spin drainage drag.'
  },
  hand_wash: {
    id: 'hand_wash',
    name: 'Hand Wash / Bucket Wash',
    icon: '🧼',
    targetFoamCategory: 'High Flash Foam',
    targetFoamMm: '110 - 160 mm',
    agitationType: 'Manual Hand Rubbing & Squeezing',
    mechanicalAction: 'Low mechanical action reliant on chemical detergent power & rich lather cushion',
    waterUsagePerKg: '15.0 - 20.0 L/kg fabric',
    description: 'Requires high flash foam height, luxurious feel, skin mildness (pH 6.5-7.5), and quick rinse ability.',
    primaryRisk: 'Dermal irritation from high free alkalinity; slow rinsing wasting water.'
  },
  semi_auto: {
    id: 'semi_auto',
    name: 'Semi-Automatic Twin Tub',
    icon: '🧺',
    targetFoamCategory: 'Medium Foam',
    targetFoamMm: '60 - 100 mm',
    agitationType: 'Pulsator Disc Agitation',
    mechanicalAction: 'Moderate shear with separate spin extraction tub',
    waterUsagePerKg: '10.0 - 14.0 L/kg fabric',
    description: 'Robust medium-foam system tolerant of variable water hardness and manual transfer.',
    primaryRisk: 'High foam carryover into spin tub causing unbalanced spin noise.'
  },
  fully_auto: {
    id: 'fully_auto',
    name: 'Fully Automatic Universal',
    icon: '⚡',
    targetFoamCategory: 'Low Foam (Controlled)',
    targetFoamMm: '20 - 50 mm',
    agitationType: 'Multi-Directional Pulsator & Tumble',
    mechanicalAction: 'Smart sensor-controlled wash cycles',
    waterUsagePerKg: '7.0 - 10.0 L/kg fabric',
    description: 'Balanced low-to-medium foam profile compatible with modern fuzzylogic sensors.',
    primaryRisk: 'Sensor error due to persistent foam during optical clarity check.'
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial OPL (On-Premise)',
    icon: '🏢',
    targetFoamCategory: 'Low Foam (Controlled)',
    targetFoamMm: '10 - 30 mm',
    agitationType: 'Large Diameter Industrial Tumbler',
    mechanicalAction: 'Heavy mechanical impact with steam/hot wash capability (60-80°C)',
    waterUsagePerKg: '5.0 - 7.0 L/kg fabric',
    description: 'Designed for hotel, hospital, and restaurant linen with heavy grease and blood stain loads.',
    primaryRisk: 'Foam overflow in high-capacity pumps and grease re-deposition.'
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial Continuous Tunnel Wash',
    icon: '🏭',
    targetFoamCategory: 'Ultra-Low / Zero Foam',
    targetFoamMm: '0 - 15 mm',
    agitationType: 'Archimedean Screw Tunnel Press',
    mechanicalAction: 'High pressure counter-current continuous wash zones',
    waterUsagePerKg: '3.0 - 5.0 L/kg fabric',
    description: 'Zero/ultra-low foam required for continuous counter-flow pumps and hydraulic press extraction.',
    primaryRisk: 'Any foam causes pump air-lock, press pad failure, and water recycling system failure.'
  }
};

export interface MachineRecommendation {
  id: string;
  title: string;
  category: 'Foam Control & Defoamer' | 'Surfactant Optimization' | 'Rinse Efficiency' | 'Fabric & Machine Safety' | 'Builder & Alkalinity';
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
    foamMm: string;
    cleaningScore: string;
    rinseCycles: string;
    machineSafety: string;
    costImpact: string;
  };
}

export interface MachineAnalysisResult {
  machineInfo: MachineProfileInfo;
  estimatedFoamHeightMm: number;
  foamCategoryMatch: boolean;
  cleaningPerformance: ReturnType<typeof calculateCleaningPerformance>;
  activeSurfactantPct: number;
  rawSurfactantPct: number;
  isHighAnionicRisk: boolean;
  isDefoamerPresent: boolean;
  recommendations: MachineRecommendation[];
  industrialNotes: string[];
}

export function analyzeMachineProfile(
  ingredients: any[],
  profileKey: MachineProfile = 'front_load',
  autoBalanceWater: boolean = true
): MachineAnalysisResult {
  const machineInfo = MACHINE_PROFILES[profileKey] || MACHINE_PROFILES.front_load;

  // Utilize existing scientific calculators
  const cleaningPerformance = calculateCleaningPerformance(ingredients);
  const activeSurfactantPct = calculateActiveSurfactants(ingredients);
  const rawSurfactantPct = calculateRawSurfactants(ingredients);

  // Analyze surfactant blend composition
  let totalAnionic = 0;
  let totalNonionic = 0;
  let totalAmphoteric = 0;
  let isDefoamerPresent = false;

  ingredients.forEach((i) => {
    const n = (i.name || "").toLowerCase();
    const pct = Number(i.percentage) || 0;
    const act = (Number(i.activeMatterPct) || 100) / 100;

    if (n.includes("labsa") || n.includes("sles") || n.includes("sls") || n.includes("aos") || n.includes("sulfonate") || n.includes("sulfate")) {
      totalAnionic += pct * act;
    } else if (n.includes("c12-15") || n.includes("ethoxylate") || n.includes("nonionic") || n.includes("apg") || n.includes("glucoside") || n.includes("alchol ethoxylate")) {
      totalNonionic += pct * act;
    } else if (n.includes("capb") || n.includes("betaine") || n.includes("amine oxide")) {
      totalAmphoteric += pct * act;
    }

    if (n.includes("defoamer") || n.includes("silicone") || n.includes("simethicone") || n.includes("dimethicone") || n.includes("antifoam")) {
      isDefoamerPresent = true;
    }
  });

  // Calculate estimated foam height (mm) based on anionic, amphoteric, and defoamer presence
  let estimatedFoamHeightMm = Math.round(totalAnionic * 14 + totalAmphoteric * 18 - (isDefoamerPresent ? 45 : 0));
  estimatedFoamHeightMm = Math.max(5, Math.min(180, estimatedFoamHeightMm));

  const recommendations: MachineRecommendation[] = [];
  const industrialNotes: string[] = [];

  // Check compatibility with selected machine profile
  const isFrontLoadOrAuto = profileKey === 'front_load' || profileKey === 'fully_auto' || profileKey === 'commercial' || profileKey === 'industrial';
  const isHighAnionicRisk = isFrontLoadOrAuto && totalAnionic > 6.0 && !isDefoamerPresent;

  let foamCategoryMatch = true;

  // --- 1. FRONT LOAD / FULLY AUTOMATIC RECOMMENDATIONS ---
  if (isFrontLoadOrAuto) {
    if (estimatedFoamHeightMm > 50 || isHighAnionicRisk) {
      foamCategoryMatch = false;
      industrialNotes.push(`Foam Alert: High anionic surfactant ratio (${totalAnionic.toFixed(1)}% active) creates ${estimatedFoamHeightMm} mm foam height, exceeding front-load drum limit (45 mm).`);

      if (!isDefoamerPresent) {
        recommendations.push({
          id: "rec-add-defoamer",
          title: "Add Organo-Silicone Antifoam Emulsion (0.15% - 0.30%)",
          category: "Foam Control & Defoamer",
          reason: `Prevent drum suds-lock and pump cavitation in ${machineInfo.name}.`,
          scientificExplanation: "Organo-modified polydimethylsiloxane droplets spread rapidly across air-water micellar interfaces, reducing film surface tension and causing catastrophic foam lamellae collapse without suppressing detergency.",
          advantages: [
            "Reduces foam height by 60 - 80% within seconds",
            "Eliminates suds-lock risk and sensor aborts in front-load washers",
            "Requires ultra-low dosage (0.15% - 0.30%)"
          ],
          disadvantages: [
            "Requires uniform emulsification during high-shear mixing"
          ],
          confidenceScore: 98,
          suggestedAction: "add",
          targetIngredientName: "Water / Aqua",
          suggestedIngredientName: "Silicone Antifoam Emulsion (20% Active)",
          suggestedPct: 0.2,
          expectedImpact: {
            foamMm: "Reduced from 95 mm → 25 mm (Controlled)",
            cleaningScore: "Maintained 100% detergency",
            rinseCycles: "Saves 1 - 2 rinse cycles (30L water saved)",
            machineSafety: "100% Protection against pump cavitation",
            costImpact: "+₹1.40/kg batch cost"
          }
        });
      }

      if (totalNonionic < 2.0) {
        recommendations.push({
          id: "rec-[#0f766e]-nonionic",
          title: "Increase Non-Ionic Surfactant Ratio (Alcohol Ethoxylate 7EO)",
          category: "Surfactant Optimization",
          reason: "Non-ionic ethoxylates provide low-foaming, superior oily soil emulsification in low-water front-load washes.",
          scientificExplanation: "Non-ionic surfactants lack ionic charge repulsion, forming low-foam mixed micelles with anionics that dramatically lower interfacial tension against grease.",
          advantages: [
            "Low-foaming oily & sebum stain removal",
            "Insensitive to water hardness ions (Ca2+/Mg2+)",
            "Prevents redeposition on synthetic fabrics"
          ],
          disadvantages: [
            "Requires warm wash water (30-40°C) for peak cloud point performance"
          ],
          confidenceScore: 94,
          suggestedAction: "add",
          targetIngredientName: "Water / Aqua",
          suggestedIngredientName: "C12-15 Alcohol Ethoxylate 7EO",
          suggestedPct: 2.5,
          expectedImpact: {
            foamMm: "Suppresses foam volume by mixed micelle formation",
            cleaningScore: "+24% grease & oil removal",
            rinseCycles: "Easy rinse profile",
            machineSafety: "Optimized for tumbling action",
            costImpact: "+₹2.20/kg"
          }
        });
      }
    }
  }

  // --- 2. HAND WASH RECOMMENDATIONS ---
  if (profileKey === 'hand_wash') {
    if (estimatedFoamHeightMm < 90) {
      foamCategoryMatch = false;
      recommendations.push({
        id: "rec-boost-handwash-foam",
        title: "Boost Flash Foam & Skin Mildness with CAPB / CDEA",
        category: "Surfactant Optimization",
        reason: `Hand wash formulations require rich foam cushion (120+ mm) to provide user sensory perception and fabric lubrication.`,
        scientificExplanation: "Cocoamidopropyl Betaine (CAPB) forms tightly packed zwitterionic-anionic complex micelles with SLES/LABSA, dramatically increasing foam volume, foam half-life, and skin mildness.",
        advantages: [
          "Creates dense, luxurious flash foam cushion",
          "Reduces dermal skin irritation index (Zein test reduction)",
          "Provides soft hand feel during bucket washing"
        ],
        disadvantages: [
          "Requires extra rinse water if over-dosed (>4%)"
        ],
        confidenceScore: 96,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Cocoamidopropyl Betaine (CAPB 30%)",
        suggestedPct: 2.0,
        expectedImpact: {
          foamMm: "Increased to 135 mm (Rich Flash Foam)",
          cleaningScore: "Enhanced particulate soil suspension",
          rinseCycles: "Standard bucket rinse",
          machineSafety: "100% Skin Safe (pH 6.8 - 7.5)",
          costImpact: "+₹1.60/kg"
        }
      });
    }
  }

  // --- 3. INDUSTRIAL / COMMERCIAL LAUNDRY RECOMMENDATIONS ---
  if (profileKey === 'industrial' || profileKey === 'commercial') {
    if (totalAnionic > 10.0) {
      recommendations.push({
        id: "rec-industrial-builder",
        title: "Upgrade Alkalinity & Metasilicate Builder Ratio",
        category: "Builder & Alkalinity",
        reason: "Industrial tunnel and OPL washers require high saponification power for heavy oil, fat, and protein stains.",
        scientificExplanation: "Sodium Metasilicate provides high alkaline reserve (pH 10.5 - 11.5) that saponifies fatty acids into soluble soaps while providing anticorrosion passivation on stainless steel drums.",
        advantages: [
          "Saponifies heavy food fat, grease, and industrial oil stains",
          "Protects industrial washer metal parts from corrosion",
          "Prevents soil re-deposition during tunnel press extraction"
        ],
        disadvantages: [
          "High pH requires acidic sour rinse (citric acid) in final cycle"
        ],
        confidenceScore: 95,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Sodium Metasilicate Pentahydrate",
        suggestedPct: 3.0,
        expectedImpact: {
          foamMm: "Ultra-low foam",
          cleaningScore: "+35% heavy industrial stain removal",
          rinseCycles: "Requires sour neutralization rinse",
          machineSafety: "Anti-corrosive stainless steel protection",
          costImpact: "+₹1.80/kg"
        }
      });
    }
  }

  if (industrialNotes.length === 0) {
    industrialNotes.push(`Formula evaluated for ${machineInfo.name} (${machineInfo.agitationType}). Target foam height: ${machineInfo.targetFoamMm}.`);
  }

  return {
    machineInfo,
    estimatedFoamHeightMm,
    foamCategoryMatch,
    cleaningPerformance,
    activeSurfactantPct,
    rawSurfactantPct,
    isHighAnionicRisk,
    isDefoamerPresent,
    recommendations,
    industrialNotes
  };
}
