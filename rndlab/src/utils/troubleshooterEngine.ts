import { 
  calculateCleaningPerformance, 
  calculateActiveSurfactants, 
  calculateRawSurfactants, 
  calculateWaterHardnessTolerance,
  calculateFormulationCompatibility,
  generateFormulationWarnings,
  calculateEstimatedPH,
  getPreservativeWarning
} from "./calculators";

export type ProblemCategory = 
  | 'foam_issues'
  | 'cleaning_issues'
  | 'viscosity_issues'
  | 'stability_phase'
  | 'hard_water'
  | 'ph_drift'
  | 'preservative_shelf'
  | 'skin_mildness';

export interface ProblemDefinition {
  id: ProblemCategory;
  name: string;
  icon: string;
  description: string;
  symptoms: string[];
}

export const PROBLEM_DEFINITIONS: Record<ProblemCategory, ProblemDefinition> = {
  foam_issues: {
    id: 'foam_issues',
    name: 'Foam & Suds Problems (Excessive or Insufficient)',
    icon: '🫧',
    description: 'Suds-lock in washing machines, rapid foam collapse in hand wash, or persistent foam carryover during rinse.',
    symptoms: ['Suds-lock in drum', 'Flash foam failure', 'Foam overflow in wash', 'Incomplete foam rinse-out']
  },
  cleaning_issues: {
    id: 'cleaning_issues',
    name: 'Detergency & Stain Removal Failure',
    icon: '🧽',
    description: 'Inadequate removal of particulate dirt, greasy sebum, protein stains, or soil re-deposition on fabrics.',
    symptoms: ['Greasy film remains', 'Dull grey fabric after washing', 'Stain removal score < 70', 'Poor particulate suspension']
  },
  viscosity_issues: {
    id: 'viscosity_issues',
    name: 'Viscosity & Rheology Flaws (Too Thin or Gelling)',
    icon: '🧪',
    description: 'Watery viscosity, stringy gel formation, salt-curve over-dosing collapse, or temperature thinning.',
    symptoms: ['Watery consistency', 'Irreversible gelling during dilution', 'Salt-curve collapse', 'Shear-thinning loss']
  },
  stability_phase: {
    id: 'stability_phase',
    name: 'Phase Separation, Cloudiness & Sedimentation',
    icon: '⚗️',
    description: 'Layering/separation in storage, cloud point precipitation, surfactant coiling, or dye/fragrance bleeding.',
    symptoms: ['Top oil/surfactant layer', 'Bottom crystal precipitate', 'Hazy/turbid emulsion', 'Freeze-thaw phase split']
  },
  hard_water: {
    id: 'hard_water',
    name: 'Hard Water Invalidation (>200 ppm CaCO3)',
    icon: '💧',
    description: 'Loss of cleaning power, insoluble calcium/magnesium soap scum precipitation, or dulling of laundry in hard water.',
    symptoms: ['White scum ring in bucket', '50%+ loss of cleaning in tap water', 'Fabric stiffness', 'Surfactant inactivation']
  },
  ph_drift: {
    id: 'ph_drift',
    name: 'pH Instability & Buffer Breakdown',
    icon: '⚖️',
    description: 'pH dropping during shelf storage, excessive alkalinity damaging delicate fabrics, or out-of-spec active pH.',
    symptoms: ['pH drop below 6.0 over time', 'Caustic skin burning (pH > 11.5)', 'Enzyme inactivation', 'Color fading']
  },
  preservative_shelf: {
    id: 'preservative_shelf',
    name: 'Microbial Degradation & Shelf Life Failure',
    icon: '🛡️',
    description: 'Bacterial/fungal contamination, offensive odor development, preservative inactivation, or color darkening.',
    symptoms: ['Foul smell in bottle', 'Viscosity collapse over weeks', 'Black mold spots', 'Preservative hydrolysis']
  },
  skin_mildness: {
    id: 'skin_mildness',
    name: 'Skin Irritation & Dermal Toxicity High Risk',
    icon: '🤲',
    description: 'High free monomer SLES/LABSA irritation, skin tightness/dryness after hand washing, or high Zein protein score.',
    symptoms: ['Redness & hand dryness', 'High free anionic monomer concentration', 'Lack of zwitterionic buffering']
  }
};

export interface DiagnosticAction {
  id: string;
  title: string;
  category: string;
  rootCause: string;
  scientificExplanation: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  confidenceScore: number; // e.g. 95%
  suggestedAction: 'add' | 'increase' | 'decrease' | 'swap';
  targetIngredientName: string;
  suggestedIngredientName: string;
  suggestedPct: number;
  expectedImpact: {
    cleaning: string;
    foam: string;
    stability: string;
    pH: string;
    cost: string;
  };
  advantages: string[];
  disadvantages: string[];
}

export interface TroubleshooterDiagnosisResult {
  selectedProblem: ProblemDefinition;
  detectedWarnings: string[];
  cleaningPerformance: ReturnType<typeof calculateCleaningPerformance>;
  estimatedPH: number;
  activeSurfactants: number;
  rawSurfactants: number;
  actions: DiagnosticAction[];
  industrialNotes: string[];
}

export function runRootCauseTroubleshooter(
  ingredients: any[],
  problemCategory: ProblemCategory = 'cleaning_issues',
  autoBalanceWater: boolean = true
): TroubleshooterDiagnosisResult {
  const selectedProblem = PROBLEM_DEFINITIONS[problemCategory] || PROBLEM_DEFINITIONS.cleaning_issues;
  
  // Reuse existing core scientific calculators without changing them
  const cleaningPerformance = calculateCleaningPerformance(ingredients);
  const activeSurfactants = calculateActiveSurfactants(ingredients);
  const rawSurfactants = calculateRawSurfactants(ingredients);
  const phObj = calculateEstimatedPH('General', 'Formula', ingredients);
  const estimatedPH = phObj.estpH;
  const compatibilityResult = calculateFormulationCompatibility(ingredients, estimatedPH);
  const detectedWarnings = generateFormulationWarnings({ ingredients, pH: estimatedPH });
  const hardnessTolerance = calculateWaterHardnessTolerance(ingredients);

  let totalAnionic = 0;
  let totalNonionic = 0;
  let totalAmphoteric = 0;
  let totalSalt = 0;
  let isChelatorPresent = false;
  let isPreservativePresent = false;
  let isDefoamerPresent = false;

  ingredients.forEach((i) => {
    const n = (i.name || "").toLowerCase();
    const pct = Number(i.percentage) || 0;
    const act = (Number(i.activeMatterPct) || 100) / 100;

    if (n.includes("labsa") || n.includes("sles") || n.includes("sls") || n.includes("aos") || n.includes("sulfonate") || n.includes("sulfate")) {
      totalAnionic += pct * act;
    } else if (n.includes("c12-15") || n.includes("ethoxylate") || n.includes("nonionic") || n.includes("apg") || n.includes("glucoside") || n.includes("alcohol ethoxylate")) {
      totalNonionic += pct * act;
    } else if (n.includes("capb") || n.includes("betaine") || n.includes("amine oxide")) {
      totalAmphoteric += pct * act;
    }

    if (n.includes("salt") || n.includes("sodium chloride") || n.includes("magnesium sulfate")) {
      totalSalt += pct;
    }

    if (n.includes("edta") || n.includes("glda") || n.includes("citrate") || n.includes("mgda") || n.includes("phosphonate")) {
      isChelatorPresent = true;
    }

    if (n.includes("benzoate") || n.includes("isothiazolinone") || n.includes("phenoxyethanol") || n.includes("preservative") || n.includes("dmdm")) {
      isPreservativePresent = true;
    }

    if (n.includes("defoamer") || n.includes("silicone") || n.includes("antifoam")) {
      isDefoamerPresent = true;
    }
  });

  const actions: DiagnosticAction[] = [];
  const industrialNotes: string[] = [];

  // --- 1. FOAM ISSUES DIAGNOSIS ---
  if (problemCategory === 'foam_issues') {
    if (totalAnionic > 7.0 && !isDefoamerPresent) {
      actions.push({
        id: "diag-foam-excess",
        title: "Dose Organo-Silicone Antifoam (0.20%) to Eliminate Machine Suds-Lock",
        category: "Foam Control",
        rootCause: "Excess free anionic surfactant monomers forming high elastic foam lamellae under mechanical shear.",
        scientificExplanation: "High LABSA/SLES active ratio generates electrostatic stabilization of air bubbles in water. Organo-silicone particles migrate to the gas-liquid surface, displacing surfactant molecules and inducing fast film drainage.",
        severity: "Critical",
        confidenceScore: 97,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Silicone Antifoam Emulsion (20% Active)",
        suggestedPct: 0.20,
        expectedImpact: {
          cleaning: "100% Detergency maintained",
          foam: "Reduced foam height by 75% (No suds lock)",
          stability: "Phase stable",
          pH: "No pH shift",
          cost: "+₹1.40/kg"
        },
        advantages: ["Eliminates front-load machine sensor aborts", "Reduces rinse water demand by 30%"],
        disadvantages: ["Requires thorough dispersing during blending"]
      });
    }

    if (totalAnionic < 3.0 && totalAmphoteric < 0.5) {
      actions.push({
        id: "diag-foam-low",
        title: "Incorporate CAPB (2.0%) / SLES (3.0%) for Flash Foam Cushion",
        category: "Foam Enhancement",
        rootCause: "Insufficient anionic/zwitterionic surfactant active matter to form dense viscoelastic foam film.",
        scientificExplanation: "Amphoteric betaines synergize with anionic sulfates to form tightly ordered mixed micelles that lower critical micelle concentration (CMC) and build dense, long-lasting flash lather.",
        severity: "Warning",
        confidenceScore: 95,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Cocoamidopropyl Betaine (CAPB 30%)",
        suggestedPct: 2.0,
        expectedImpact: {
          cleaning: "+15% particulate soil suspension",
          foam: "+80 mm flash foam height",
          stability: "Improves low-temperature clarity",
          pH: "Maintains neutral buffer",
          cost: "+₹1.60/kg"
        },
        advantages: ["Provides rich, creamy hand-wash lather", "Reduces skin irritation profile"],
        disadvantages: ["Slight increase in total active surfactant cost"]
      });
    }
  }

  // --- 2. CLEANING ISSUES DIAGNOSIS ---
  if (problemCategory === 'cleaning_issues' || cleaningPerformance.cleaningScore < 70) {
    if (totalNonionic < 1.5) {
      actions.push({
        id: "diag-[#0f766e]-grease",
        title: "Introduce Alcohol Ethoxylate 7EO (2.5%) for Oily Soil Emulsification",
        category: "Detergency Optimization",
        rootCause: "Deficiency of non-ionic ethoxylates needed to lower oil-water interfacial tension below 1.0 mN/m.",
        scientificExplanation: "Non-ionic surfactants penetrate hydrophobic greasy sebum and food oils via roll-up mechanism, solubilizing stubborn lipid stains without ion repulsion constraints.",
        severity: "Warning",
        confidenceScore: 96,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "C12-15 Alcohol Ethoxylate 7EO",
        suggestedPct: 2.5,
        expectedImpact: {
          cleaning: "+28 Points Detergency Score Increase",
          foam: "Low-foaming greasy soil removal",
          stability: "Enhanced cloud point stability",
          pH: "Neutral effect",
          cost: "+₹2.20/kg"
        },
        advantages: ["Superior kitchen grease & shirt collar sebum removal", "Works efficiently in cold water"],
        disadvantages: ["Requires temperature check for cloud point > 55°C"]
      });
    }

    if (!isChelatorPresent) {
      actions.push({
        id: "diag-add-chelator-clean",
        title: "Add Eco-Friendly GLDA / EDTA Chelator (0.50%) to Deactivate Ca2+/Mg2+",
        category: "Detergency Optimization",
        rootCause: "Water hardness divalent cations (Ca2+/Mg2+) precipitating anionic surfactants into insoluble soap scum.",
        scientificExplanation: "Tetrasodium GLDA or EDTA forms 1:1 hexadentate chelate complexes with Ca2+ ions (log K > 6.0), preserving free anionic surfactant molecules for active stain removal.",
        severity: "Critical",
        confidenceScore: 98,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Tetrasodium GLDA (Dissolvine GL-47)",
        suggestedPct: 0.50,
        expectedImpact: {
          cleaning: "+32% Cleaning boost in hard tap water",
          foam: "Prevents foam collapse in hard water",
          stability: "Prevents calcium precipitate haziness",
          pH: "Slight alkaline boost",
          cost: "+₹0.90/kg"
        },
        advantages: ["Biodegradable green chelator", "Prevents greying of white clothes"],
        disadvantages: ["Requires precise pH control (> pH 6.5)"]
      });
    }
  }

  // --- 3. VISCOSITY ISSUES DIAGNOSIS ---
  if (problemCategory === 'viscosity_issues') {
    if (totalSalt > 2.0) {
      actions.push({
        id: "diag-salt-collapse",
        title: "Reduce Sodium Chloride Salt Ratio to <1.2% (Prevent Salt-Curve Overdose)",
        category: "Rheology Correction",
        rootCause: "Salt curve over-dosing pushing rod-like micelle network past maximum packing density into spherical phase collapse.",
        scientificExplanation: "Excess ionic strength shields surfactant headgroup charges too strongly, causing rod micelles to transition into branched or low-viscosity lamellar droplets with dramatic viscosity drop.",
        severity: "Critical",
        confidenceScore: 99,
        suggestedAction: "decrease",
        targetIngredientName: "Sodium Chloride / Salt",
        suggestedIngredientName: "Sodium Chloride / Salt",
        suggestedPct: 0.80,
        expectedImpact: {
          cleaning: "Restores micellar equilibrium",
          foam: "Stable foam texture",
          stability: "Prevents salt crystallization at 4°C",
          pH: "No effect",
          cost: "Saves ₹0.20/kg"
        },
        advantages: ["Restores thick honey-like liquid viscosity", "Prevents cold temperature cloudiness"],
        disadvantages: ["Requires careful salt curve titration in lab"]
      });
    } else if (activeSurfactants < 8.0) {
      actions.push({
        id: "diag-add-thickener",
        title: "Incorporate Xanthan Gum / HPMC Polymer (0.30%) or Amine Oxide",
        category: "Rheology Correction",
        rootCause: "Insufficient surfactant active matter (<8%) to form thick wormlike micelles without polymeric thickeners.",
        scientificExplanation: "Hydrophobically modified polymers build a 3D physical entanglement network in low-surfactant water phases, providing yield stress and elegant pouring viscosity.",
        severity: "Warning",
        confidenceScore: 94,
        suggestedAction: "add",
        targetIngredientName: "Water / Aqua",
        suggestedIngredientName: "Xanthan Gum (Industrial Grade)",
        suggestedPct: 0.35,
        expectedImpact: {
          cleaning: "Holds suspended enzyme beads or builders",
          foam: "Stabilizes foam bubble walls",
          stability: "Prevents phase separation",
          pH: "Stable pH 4 - 10",
          cost: "+₹1.10/kg"
        },
        advantages: ["Provides high shear-thinning pourability", "Cold-water processable"],
        disadvantages: ["Must be fully hydrated in water before adding surfactants"]
      });
    }
  }

  // --- 4. PHASE SEPARATION & STABILITY DIAGNOSIS ---
  if (problemCategory === 'stability_phase' || (compatibilityResult.alerts && compatibilityResult.alerts.length > 0)) {
    actions.push({
      id: "diag-hydrotrope-phase",
      title: "Dose SXS / Sodium CUMENE Sulfonate Hydrotrope (1.5%) for Phase Solubilization",
      category: "Phase Stabilization",
      rootCause: "High electrolyte/builder content forcing organic surfactants out of aqueous solution (salting-out effect).",
      scientificExplanation: "Sodium Xylene Sulfonate (SXS) disrupts structured water domains around surfactant hydrophobic tails, increasing mutual solubility and lowering phase cloud point.",
      severity: "Critical",
      confidenceScore: 97,
      suggestedAction: "add",
      targetIngredientName: "Water / Aqua",
      suggestedIngredientName: "Sodium Xylene Sulfonate (SXS 40%)",
      suggestedPct: 1.50,
      expectedImpact: {
        cleaning: "Maintains homogeneous active distribution",
        foam: "No foam penalty",
        stability: "Clear single-phase liquid from 4°C to 50°C",
        pH: "Neutral",
        cost: "+₹1.30/kg"
      },
      advantages: ["Resolves cloudiness and oil separation instantly", "Enhances freeze-thaw recovery"],
      disadvantages: ["Slightly lowers liquid viscosity (may require minor salt adjustment)"]
    });
  }

  // --- 5. HARD WATER DIAGNOSIS ---
  if (problemCategory === 'hard_water' || hardnessTolerance.maxSupportedPpm < 200) {
    actions.push({
      id: "diag-hard-water-builder",
      title: "Add Sodium Citrate / Builder System (1.5%) to Buffer 300+ ppm CaCO3 Hardness",
      category: "Hard Water Defense",
      rootCause: "Hard water Ca2+ and Mg2+ ions tying up anionic active matter and forming insoluble soap curds.",
      scientificExplanation: "Trisodium Citrate acts as a sacrificial builder and ion exchanger, sequestering multivalent hardness ions and maintaining high negative surface charge on fabric fibers.",
      severity: "Critical",
      confidenceScore: 98,
      suggestedAction: "add",
      targetIngredientName: "Water / Aqua",
      suggestedIngredientName: "Trisodium Citrate Dihydrate",
      suggestedPct: 1.50,
      expectedImpact: {
        cleaning: "+30% cleaning performance in 300 ppm hard water",
        foam: "Prevents foam suppression in tap water",
        stability: "Crystal clear solution",
        pH: "Buffers pH at optimal 8.0 - 8.5",
        cost: "+₹1.20/kg"
      },
      advantages: ["100% Biodegradable & food-grade safe", "Prevents fabric harshness"],
      disadvantages: ["Requires adequate water dissolved space"]
    });
  }

  // --- 6. PRESERVATIVE & SHELF LIFE DIAGNOSIS ---
  if (problemCategory === 'preservative_shelf' || !isPreservativePresent) {
    actions.push({
      id: "diag-add-preservative",
      title: "Incorporate Phenoxyethanol / Sodium Benzoate Broad-Spectrum Preservative (0.40%)",
      category: "Microbial Defense",
      rootCause: "High water activity (Aw > 0.92) without antimicrobial protection creating rapid bacterial/fungal bloom risk.",
      scientificExplanation: "Organic acid/alcohol preservative blends disrupt microbial cell membrane potential and deactivate respiratory enzymes, ensuring 24-month unopened shelf life.",
      severity: "Critical",
      confidenceScore: 99,
      suggestedAction: "add",
      targetIngredientName: "Water / Aqua",
      suggestedIngredientName: "Phenoxyethanol & Ethylhexylglycerin",
      suggestedPct: 0.40,
      expectedImpact: {
        cleaning: "Protects active enzyme & polymer integrity",
        foam: "No foam impact",
        stability: "Prevents bio-degradation viscosity loss",
        pH: "Effective in pH 3.0 - 8.5",
        cost: "+₹0.80/kg"
      },
      advantages: ["Passes USP <51> & ISO 11930 Antimicrobial Challenge Tests", "Paraben-free & Formaldehyde-free"],
      disadvantages: ["Must be added during cool-down phase (<45°C)"]
    });
  }

  // Fallback diagnostic if no actions match
  if (actions.length === 0) {
    actions.push({
      id: "diag-general-balance",
      title: "Optimize Water Balance and LABSA Neutralization Index",
      category: "General Formulation Polish",
      rootCause: "Minor imbalance in active surfactant to water ratio.",
      scientificExplanation: "Fine-tuning total solids to water ratio optimizes micellar shape factor and maximizes cleaning synergy.",
      severity: "Advisory",
      confidenceScore: 90,
      suggestedAction: "increase",
      targetIngredientName: "Water / Aqua",
      suggestedIngredientName: "Water / Aqua",
      suggestedPct: 80.0,
      expectedImpact: {
        cleaning: "Balanced detergency",
        foam: "Controlled foam",
        stability: "Stable",
        pH: "Target pH",
        cost: "Neutral"
      },
      advantages: ["Improves formula flowability", "Simplifies manufacturing"],
      disadvantages: ["None"]
    });
  }

  industrialNotes.push(`Diagnostic executed for problem: ${selectedProblem.name}. Evaluated ${ingredients.length} formulation components.`);
  industrialNotes.push(`Core scientific check: Estimated pH = ${estimatedPH.toFixed(2)}, Active Surfactants = ${activeSurfactants.toFixed(1)}%, Detergency Score = ${cleaningPerformance.cleaningScore}/100.`);

  return {
    selectedProblem,
    detectedWarnings,
    cleaningPerformance,
    estimatedPH,
    activeSurfactants,
    rawSurfactants,
    actions,
    industrialNotes
  };
}
