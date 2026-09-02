import { FormulationIngredient } from '../types';
import { getAuditedIngredientCategory, getTargetPHRange } from './calculators';
import { ActiveMatterEngine } from './activeMatterEngine';

export type ScientificBasisType = 'CALCULATED' | 'PREDICTIVE' | 'EMPIRICAL' | 'LABORATORY VERIFIED';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SanityIssue {
  id: string;
  issue: string;
  whyItMatters: string;
  scientificBasis: string;
  scientificType: ScientificBasisType;
  severity: SeverityLevel;
  whatToCheck: string;
}

export interface FormulationStrength {
  id: string;
  title: string;
  description: string;
  scientificBasis: string;
  scientificType: ScientificBasisType;
}

export interface ExpertRecommendation {
  id: string;
  problem: string;
  why: string;
  recommendedAction: string;
  expectedEffect: string;
  tradeOff: string;
  confidence: ConfidenceLevel;
  calculationBasis?: string;
}

export interface ProductCategoryContext {
  category: string;
  targetPHMin: number;
  targetPHMax: number;
  targetActiveMatterMin: number;
  foamExpectation: 'High Foam' | 'Controlled / Low Foam' | 'Moderate Foam' | 'Low / Streak-Free';
  notes: string;
}

export interface ExpertReasoningReport {
  sanityCheckPassed: boolean;
  overallStatus: 'PASS' | 'PASS WITH LIMITATIONS' | 'FAIL';
  summarySentence: string;
  totalIssuesCount: number;
  criticalIssuesCount: number;
  highIssuesCount: number;
  issues: SanityIssue[];
  strengths: FormulationStrength[];
  recommendations: ExpertRecommendation[];
  productCategoryContext: ProductCategoryContext;
}

export interface ExpertReasoningInput {
  ingredients: FormulationIngredient[];
  productCategory?: string;
  waterHardnessPpm?: number;
  batchSizeKg?: number;
  calculatedPH?: number;
  totalActiveMatter?: number;
  totalPercentage?: number;
  costPerKg?: number;
  cleaningScore?: number;
  hardnessSufficiency?: 'sufficient' | 'borderline' | 'insufficient';
  maxSupportedHardnessPpm?: number;
  compatibilityScore?: number;
  compatibilityAlerts?: Array<{ id: string; title: string; severity: 'High' | 'Medium' | 'Low' | 'Critical'; message: string }>;
  viscosityEstimate?: string;
}

export function getProductCategoryContext(categoryName: string = 'Laundry Liquid'): ProductCategoryContext {
  const cat = categoryName || 'Laundry Liquid';
  const targetPH = getTargetPHRange(cat);

  const cLower = cat.toLowerCase();
  if (cLower.includes('front') || cLower.includes('matic') || cLower.includes('auto')) {
    return {
      category: cat,
      targetPHMin: targetPH.min,
      targetPHMax: targetPH.max,
      targetActiveMatterMin: 12.0,
      foamExpectation: 'Controlled / Low Foam',
      notes: 'Front-load horizontal axis washing machines require suds suppression to prevent suds-lock and pump cavitation.'
    };
  }
  if (cLower.includes('dish') || cLower.includes('dishwash') || cLower.includes('utensil')) {
    return {
      category: cat,
      targetPHMin: targetPH.min,
      targetPHMax: targetPH.max,
      targetActiveMatterMin: 12.0,
      foamExpectation: 'High Foam',
      notes: 'Manual dishwash demands high stable foam, fast grease solubilization, and skin mildness (pH 6.0 - 7.8).'
    };
  }
  if (cLower.includes('glass') || cLower.includes('window')) {
    return {
      category: cat,
      targetPHMin: targetPH.min,
      targetPHMax: targetPH.max,
      targetActiveMatterMin: 1.0,
      foamExpectation: 'Low / Streak-Free',
      notes: 'Glass cleaners require low non-volatile residue (<2% actives) and fast evaporation to prevent smearing.'
    };
  }
  if (cLower.includes('floor') || cLower.includes('surface')) {
    return {
      category: cat,
      targetPHMin: targetPH.min,
      targetPHMax: targetPH.max,
      targetActiveMatterMin: 4.0,
      foamExpectation: 'Moderate Foam',
      notes: 'Hard surface cleaners require balanced degreasing, streak-free drying, and soil release without sticky residues.'
    };
  }
  if (cLower.includes('hand') || cLower.includes('delicate') || cLower.includes('wool')) {
    return {
      category: cat,
      targetPHMin: targetPH.min,
      targetPHMax: targetPH.max,
      targetActiveMatterMin: 10.0,
      foamExpectation: 'High Foam',
      notes: 'Hand wash detergents require neutral pH and high amphoteric/nonionic co-surfactants to avoid skin defatting.'
    };
  }
  if (cLower.includes('powder')) {
    return {
      category: cat,
      targetPHMin: targetPH.min,
      targetPHMax: targetPH.max,
      targetActiveMatterMin: 10.0,
      foamExpectation: 'Moderate Foam',
      notes: 'Powder detergents accommodate high inorganic builder loadings (Soda ash, STPP, Zeolites) with alkaline wash liquor.'
    };
  }

  // Default Top Load / General Laundry
  return {
    category: cat,
    targetPHMin: targetPH.min,
    targetPHMax: targetPH.max,
    targetActiveMatterMin: 10.0,
    foamExpectation: 'Moderate Foam',
    notes: 'General laundry liquid requiring robust particulate soil suspension, stain removal, and hard water tolerance.'
  };
}

/**
 * Main Expert Formulation Reasoning Engine
 * Operates purely on the current active formula state and existing verified calculations.
 * Never silently modifies formulas.
 */
export function evaluateExpertReasoning(input: ExpertReasoningInput): ExpertReasoningReport {
  const ingredients = Array.isArray(input.ingredients) ? input.ingredients : [];
  const productCat = input.productCategory || 'Laundry Liquid';
  const catContext = getProductCategoryContext(productCat);
  const waterHardness = Number(input.waterHardnessPpm ?? 150);

  const issues: SanityIssue[] = [];
  const strengths: FormulationStrength[] = [];
  const recommendations: ExpertRecommendation[] = [];

  // 1. Basic mass & active accounting
  let totalPct = 0;
  let totalActiveSurfactantPct = 0;
  let anionicActivePct = 0;
  let nonionicActivePct = 0;
  let amphotericActivePct = 0;
  let cationicActivePct = 0;
  let inorganicBuilderPct = 0;
  let organicChelatorPct = 0;
  let electrolytePct = 0;
  let waterPct = 0;
  let hasEnzyme = false;
  let hasBleach = false;
  let hasPreservative = false;
  let hasHydrotrope = false;

  const rawMaterialNames: string[] = [];
  const casEncountered = new Set<string>();
  const duplicateCompoundList: string[] = [];

  for (const ing of ingredients) {
    const rawPct = Number(ing.percentage ?? (ing as any).percent ?? 0);
    const activeRes = ActiveMatterEngine.resolveIngredientActive(ing);
    const activePurity = activeRes.activeMatterPct;
    const activePct = (rawPct * activePurity) / 100;
    const name = (ing.name || '').trim();
    const n = name.toLowerCase();
    const role = (ing.role || (ing as any).category || activeRes.category || getAuditedIngredientCategory(name)).toLowerCase();

    totalPct += rawPct;
    rawMaterialNames.push(name);

    if (ing.casNumber) {
      if (casEncountered.has(ing.casNumber)) {
        duplicateCompoundList.push(name);
      } else {
        casEncountered.add(ing.casNumber);
      }
    }

    // Single ingredient sanity
    if (rawPct < 0) {
      issues.push({
        id: `neg-qty-${ing.id}`,
        issue: `Negative quantity detected for ${name} (${rawPct}%)`,
        whyItMatters: 'Physical raw material mass cannot be negative.',
        scientificBasis: 'Conservation of mass balance.',
        scientificType: 'CALCULATED',
        severity: 'Critical',
        whatToCheck: 'Correct raw material percentage input to a non-negative value.'
      });
    }
    if (rawPct > 100) {
      issues.push({
        id: `over-100-${ing.id}`,
        issue: `Raw material ${name} exceeds 100% (${rawPct}%)`,
        whyItMatters: 'A single component cannot exceed 100% of the total batch weight.',
        scientificBasis: 'Batch formulation mass balance.',
        scientificType: 'CALCULATED',
        severity: 'Critical',
        whatToCheck: 'Normalize formulation ingredient proportions.'
      });
    }
    if (activePurity > 100 || activePurity < 0) {
      issues.push({
        id: `invalid-purity-${ing.id}`,
        issue: `Invalid active matter purity for ${name} (${activePurity}%)`,
        whyItMatters: 'Chemical raw material active matter percentage must be between 0% and 100%.',
        scientificBasis: 'Standard chemical assay specifications.',
        scientificType: 'CALCULATED',
        severity: 'Critical',
        whatToCheck: 'Verify commercial grade supplier specification certificate (COA).'
      });
    }

    // Role classification
    if (
      role.includes('anionic') ||
      n.includes('labsa') ||
      n.includes('sles') ||
      n.includes('sls') ||
      n.includes('aos') ||
      n.includes('sulfonic') ||
      n.includes('soap')
    ) {
      anionicActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    } else if (
      role.includes('nonionic') ||
      n.includes('lae') ||
      n.includes('ethoxylate') ||
      n.includes('glucoside') ||
      n.includes('apg') ||
      n.includes('cde') ||
      n.includes('polysorbate')
    ) {
      nonionicActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    } else if (
      role.includes('amphoteric') ||
      role.includes('zwitterionic') ||
      n.includes('capb') ||
      n.includes('betaine') ||
      n.includes('amine oxide')
    ) {
      amphotericActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    } else if (
      role.includes('cationic') ||
      n.includes('esterquat') ||
      n.includes('bkc') ||
      n.includes('benzalkonium') ||
      n.includes('ctac') ||
      n.includes('dhtdmac')
    ) {
      cationicActivePct += activePct;
      totalActiveSurfactantPct += activePct;
    }

    if (
      n.includes('soda ash') ||
      n.includes('carbonate') ||
      n.includes('stpp') ||
      n.includes('silicate') ||
      n.includes('zeolite') ||
      n.includes('sodium hydroxide') ||
      n.includes('potassium hydroxide')
    ) {
      inorganicBuilderPct += rawPct;
    }

    if (n.includes('citrate') || n.includes('citric acid') || n.includes('glda') || n.includes('edta') || n.includes('mgda') || n.includes('hepid')) {
      organicChelatorPct += activePct;
    }

    if (n.includes('salt') || n.includes('sodium chloride') || n.includes('sodium sulfate') || (n.includes('sulfate') && !n.includes('ether') && !n.includes('lauryl'))) {
      electrolytePct += rawPct;
    }

    if (n.includes('water') || n.includes('aqua') || n.includes('dm water') || n.includes('deionized water')) {
      waterPct += rawPct;
    }

    if (n.includes('protease') || n.includes('amylase') || n.includes('lipase') || n.includes('cellulase') || n.includes('enzyme') || n.includes('savinase')) {
      hasEnzyme = true;
    }

    if (n.includes('hypochlorite') || n.includes('peroxide') || n.includes('percarbonate') || n.includes('perborate') || n.includes('bleach')) {
      hasBleach = true;
    }

    if (
      n.includes('preservative') ||
      n.includes('isothiazolinone') ||
      n.includes('kathon') ||
      n.includes('benzoate') ||
      n.includes('phenoxyethanol') ||
      n.includes('dmdm') ||
      n.includes('formalin') ||
      n.includes('bronopol') ||
      n.includes('bit ') ||
      n.includes('bzt')
    ) {
      hasPreservative = true;
    }

    if (n.includes('sxs') || n.includes('xylene sulfonate') || n.includes('cumene') || n.includes('glycol') || n.includes('ethanol') || n.includes('ipa') || n.includes('isopropanol')) {
      hasHydrotrope = true;
    }
  }

  const effectivePH = Number(input.calculatedPH ?? 7.0);
  const effectiveTotalActive = Number(input.totalActiveMatter ?? totalActiveSurfactantPct);
  const effectiveHardnessSufficiency = input.hardnessSufficiency ?? 'sufficient';
  const effectiveMaxHardness = Number(input.maxSupportedHardnessPpm ?? 300);
  const effectiveCleaningScore = Number(input.cleaningScore ?? 75);

  // ==========================================
  // SANITY CHECKS & EXPERT REASONING ISSUES
  // ==========================================

  // 1. Total Mass Balance Check
  if (Math.abs(totalPct - 100) > 0.5 && ingredients.length > 0) {
    issues.push({
      id: 'mass-balance-skew',
      issue: `Formula total is ${totalPct.toFixed(2)}% (intended: 100.00%)`,
      whyItMatters: 'Deviation from 100% distorts actual in-use surfactant concentrations, active matter, and unit economics.',
      scientificBasis: 'Conservation of mass balance in batch blending.',
      scientificType: 'CALCULATED',
      severity: 'High',
      whatToCheck: 'Water balance or raw material percentages to ensure exact 100% sum.'
    });
    recommendations.push({
      id: 'rec-mass-balance',
      problem: `Total formula percentage equals ${totalPct.toFixed(2)}% instead of 100.00%.`,
      why: 'Batch scaling requires precise 100% mass balance to guarantee correct active solids delivery.',
      recommendedAction: totalPct < 100
        ? `Increase Water / Solvent by ${(100 - totalPct).toFixed(2)}% to balance formula to exactly 100.00%.`
        : `Reduce Water or highest percentage solvent by ${(totalPct - 100).toFixed(2)}% to normalize to 100.00%.`,
      expectedEffect: 'Accurate active matter, correct raw material unit cost, and exact batch scaling.',
      tradeOff: 'Minor dilution/concentration adjustment.',
      confidence: 'HIGH',
      calculationBasis: `Mass deficit/surplus: ${(100 - totalPct).toFixed(2)}%`
    });
  }

  // 2. Anionic + Cationic Incompatibility
  if (anionicActivePct > 0.5 && cationicActivePct > 0.5) {
    issues.push({
      id: 'anionic-cationic-precipitation',
      issue: 'Direct Anionic-Cationic Surfactant Incompatibility',
      whyItMatters: 'Oppositely charged polar heads form electroneutral, water-insoluble complex salts that precipitate immediately as sticky curds or flocculants, destroying both cleaning power and antimicrobial conditioning.',
      scientificBasis: 'Coulombic attraction and phase precipitation thermodynamics (Ksp insolubilization).',
      scientificType: 'CALCULATED',
      severity: 'Critical',
      whatToCheck: 'Remove cationic agents (e.g. BKC / Esterquats) or replace anionic surfactants with nonionic/amphoteric equivalents.'
    });
    recommendations.push({
      id: 'rec-anionic-cationic',
      problem: 'Coexistence of strong anionic and cationic surfactants.',
      why: 'Electrostatic precipitation neutralizes active micelles and creates haziness / sediment.',
      recommendedAction: 'Remove cationic quaternary ammonium / esterquat from this anionic formulation and formulate softeners/disinfectants in a dedicated rinse-cycle product.',
      expectedEffect: 'Restores clear single-phase micellar solution and full surfactant performance.',
      tradeOff: 'Softening or fabric conditioning cannot be combined in high-anionic wash liquor.',
      confidence: 'HIGH',
      calculationBasis: `Anionic actives (${anionicActivePct.toFixed(1)}%) + Cationic actives (${cationicActivePct.toFixed(1)}%)`
    });
  }

  // 3. Extreme pH / Neutralization Imbalance
  if (effectivePH < 3.0) {
    issues.push({
      id: 'extreme-acidic-ph',
      issue: `Severely Acidic Formulation (Equilibrium pH: ${effectivePH.toFixed(2)})`,
      whyItMatters: 'High unneutralized sulfonic acid (LABSA) causes rapid acid-catalyzed hydrolysis of ether sulfates (SLES), severe skin irritation, and corrosion to packaging and machinery.',
      scientificBasis: 'Proton activity and ester/ether cleavage kinetics.',
      scientificType: 'CALCULATED',
      severity: 'Critical',
      whatToCheck: 'Neutralizing alkali dosing (e.g. Caustic Soda 50% / TEA / Soda Ash).'
    });
    recommendations.push({
      id: 'rec-ph-acidic',
      problem: `Calculated pH (${effectivePH.toFixed(2)}) is below operational safety and target limits.`,
      why: 'Acidic surfactant slurries are unstable and non-compliant for standard detergent use.',
      recommendedAction: 'Add alkaline neutralizing agent (e.g. 50% Sodium Hydroxide or Triethanolamine) to achieve target pH (7.5 - 9.0).',
      expectedEffect: 'Complete stoichiometric neutralization of sulfonic acid into soluble sodium sulfonate surfactant.',
      tradeOff: 'Increases batch temperature (exothermic heat of neutralization) and requires controlled dosing.',
      confidence: 'HIGH',
      calculationBasis: `Current pH ${effectivePH.toFixed(2)} vs target ${catContext.targetPHMin} - ${catContext.targetPHMax}`
    });
  } else if (effectivePH > 12.0 && !productCat.toLowerCase().includes('degreaser') && !productCat.toLowerCase().includes('powder')) {
    issues.push({
      id: 'extreme-alkaline-ph',
      issue: `Excessive Caustic Alkalinity (Equilibrium pH: ${effectivePH.toFixed(2)})`,
      whyItMatters: 'High hydroxide ion concentration ($[OH^-] > 10^{-2}$ M) causes GHS Category 1 corrosive burns to skin/eyes, damages delicate fabrics (wool/silk), and rapidly denatures enzymes.',
      scientificBasis: 'Alkaline saponification of skin lipids and peptide bond hydrolysis.',
      scientificType: 'CALCULATED',
      severity: 'High',
      whatToCheck: 'Reduce caustic soda or add buffer acid (e.g. Citric acid).'
    });
    recommendations.push({
      id: 'rec-ph-alkaline',
      problem: `Calculated pH (${effectivePH.toFixed(2)}) exceeds domestic consumer safety threshold.`,
      why: 'Extreme alkalinity creates severe occupational handling risks and fabric damage.',
      recommendedAction: 'Reduce free caustic loading or buffer the system with 0.5 - 1.5% Citric Acid to bring pH into safe range.',
      expectedEffect: 'Safe user handling, improved enzymatic stability, and fabric fiber preservation.',
      tradeOff: 'Slight reduction in raw alkaline particulate soil saponification.',
      confidence: 'HIGH',
      calculationBasis: `Current pH ${effectivePH.toFixed(2)} vs target ${catContext.targetPHMin} - ${catContext.targetPHMax}`
    });
  }

  // 4. Hardness Chelation Deficit
  if (effectiveHardnessSufficiency === 'insufficient' || effectiveMaxHardness < waterHardness) {
    const deficit = Math.max(0, waterHardness - effectiveMaxHardness);
    issues.push({
      id: 'chelation-deficit',
      issue: `Hard Water Sequestration Deficit (${deficit} ppm CaCO₃ shortfall)`,
      whyItMatters: 'Unchelated $Ca^{2+}$ and $Mg^{2+}$ ions react with anionic surfactants to form insoluble calcium sulfonate/soap scum, drastically reducing foam and cleaning power.',
      scientificBasis: 'Divalent cation precipitation equilibrium with anionic surfactant monomers.',
      scientificType: 'CALCULATED',
      severity: 'High',
      whatToCheck: 'Builder/chelator loading (GLDA, Sodium Citrate, EDTA, STPP).'
    });
    recommendations.push({
      id: 'rec-chelation',
      problem: `Formula provides stoichiometric softening up to ${effectiveMaxHardness} ppm CaCO₃ (in 20g wash dose / 10L wash), below the ${waterHardness} ppm operational demand.`,
      why: 'In hard water, divalent Ca²⁺/Mg²⁺ ions compete with anionic surfactant monomers. In liquid detergents, chelators act as threshold co-builders and heavy-metal deactivators, while surfactants (SLES/LAE) provide calcium tolerance.',
      recommendedAction: 'Maintain 1.5% - 3.0% Sodium Citrate or 0.5% - 1.5% GLDA/MGDA as a threshold builder & transition-metal stabilizer. For complete stoichiometric softening of 10L at 150 ppm (1875 mg CaCO₃), 12.5g builder per dose (62.5% of formula) would be required; in liquid laundry, rely on threshold building combined with calcium-tolerant ethoxylated surfactants.',
      expectedEffect: 'Prevents transition-metal radical breakdown, disperses particulate soil, and protects surfactant micelles from calcium deactivation.',
      tradeOff: 'Higher chelator concentrations increase raw material formulation cost.',
      confidence: 'HIGH',
      calculationBasis: `Hardness demand: ${waterHardness} ppm vs stoichiometric capacity: ${effectiveMaxHardness} ppm (20g dose / 10L wash)`
    });
  }

  // 5. Excessive Electrolyte / Salting-Out Risk
  if (electrolytePct > 3.0 && totalActiveSurfactantPct > 5.0) {
    issues.push({
      id: 'electrolyte-salting-out',
      issue: `High Electrolyte / Salt Loading (${electrolytePct.toFixed(1)}% total salt)`,
      whyItMatters: 'Electrolytes screen ionic headgroup electrostatic repulsion. Beyond the peak micellar growth point, excess counter-ions cause severe surfactant desolvation, sudden viscosity collapse, and two-phase stratification (salting-out).',
      scientificBasis: 'DLVO double-layer compression and salting-out equilibrium (Hofmeister series).',
      scientificType: 'PREDICTIVE',
      severity: 'High',
      whatToCheck: 'Reduce inorganic salt (NaCl/Na₂SO₄) to optimum viscosity peak (typically 0.8% - 1.8%).'
    });
    recommendations.push({
      id: 'rec-electrolyte',
      problem: `Salt concentration (${electrolytePct.toFixed(1)}%) is approaching or exceeding the micellar transition threshold.`,
      why: 'High ionic strength disrupts micellar rod networks and causes phase splitting.',
      recommendedAction: 'Reduce Sodium Chloride / Sulfate addition to 1.0 - 1.5% and perform a benchtop salt-viscosity curve titration.',
      expectedEffect: 'Stabilizes single-phase clarity and eliminates phase separation risk.',
      tradeOff: 'May require polymeric rheology modifier if high viscosity is needed at low surfactant solids.',
      confidence: 'HIGH',
      calculationBasis: `Electrolyte loading: ${electrolytePct.toFixed(1)}%`
    });
  }

  // 6. Enzyme Compatibility (pH, Bleach, Stabilization)
  if (hasEnzyme) {
    if (effectivePH < 6.0 || effectivePH > 10.2) {
      issues.push({
        id: 'enzyme-ph-mismatch',
        issue: `Enzyme Inactivation Risk: pH (${effectivePH.toFixed(2)}) outside active catalytic window`,
        whyItMatters: 'Detergent enzymes (subtilisin proteases, amylases) denature and undergo irreversible loss of tertiary conformation outside pH 6.5 - 9.8.',
        scientificBasis: 'Enzyme conformational kinetics and catalytic triad ionization.',
        scientificType: 'PREDICTIVE',
        severity: 'High',
        whatToCheck: 'Adjust formulation pH to optimum catalytic plateau (pH 7.8 - 8.8).'
      });
      recommendations.push({
        id: 'rec-enzyme-ph',
        problem: `Enzymes present in formula at non-ideal pH ${effectivePH.toFixed(2)}.`,
        why: 'Enzyme catalytic efficiency drops >80% when protonation states deviate from optimum.',
        recommendedAction: 'Buffer formula to pH 7.8 - 8.6 using Citric acid / Borate / Citrate buffer.',
        expectedEffect: 'Preserves enzymatic stain-removal efficacy on protein, starch, and blood stains.',
        tradeOff: 'Requires precise pH adjustment during manufacturing batching.',
        confidence: 'HIGH',
        calculationBasis: `Formula pH ${effectivePH.toFixed(2)} vs enzyme stability window (6.5 - 9.8)`
      });
    }

    if (hasBleach && waterPct > 20) {
      issues.push({
        id: 'enzyme-bleach-oxidation',
        issue: 'Liquid Enzyme & Oxidizing Bleach Coexistence',
        whyItMatters: 'Dissolved oxidizers (hypochlorite, hydrogen peroxide) rapidly oxidize critical methionine and cysteine amino acid residues at the enzyme active site, destroying catalytic activity in liquid storage.',
        scientificBasis: 'Redox deactivation kinetics of protein side-chains.',
        scientificType: 'CALCULATED',
        severity: 'Critical',
        whatToCheck: 'Separate bleach into distinct powder or omit oxidizer in liquid enzyme systems.'
      });
      recommendations.push({
        id: 'rec-enzyme-bleach',
        problem: 'Strong oxidizer present with enzymes in an aqueous liquid formulation.',
        why: 'Liquid bleach deactivates enzymes within hours of blending.',
        recommendedAction: 'Remove liquid bleach from enzyme liquid or formulate as a two-part system / dry powder with coated percarbonate.',
        expectedEffect: 'Prevents total loss of enzyme investment and performance.',
        tradeOff: 'Liquid bleaching capability cannot be co-formulated with unprotected liquid enzymes.',
        confidence: 'HIGH'
      });
    }
  }

  // 7. Surfactant-Class Balance & Category Appropriateness
  if (catContext.foamExpectation === 'Controlled / Low Foam') {
    if (anionicActivePct > 10 && nonionicActivePct < 2) {
      issues.push({
        id: 'front-load-oversuds',
        issue: 'High Anionic Ratio in Front-Load / Low-Foam Application',
        whyItMatters: 'High anionic actives generate excessive low-density foam, causing machine suds-lock, reduced mechanical agitation, and water overflow in front-loading drums.',
        scientificBasis: 'Dynamic interfacial dilatational modulus of pure anionic vs nonionic systems.',
        scientificType: 'EMPIRICAL',
        severity: 'Medium',
        whatToCheck: 'Incorporate alcohol ethoxylates (LAE-9) or silicone antifoam to control foam volume.'
      });
      recommendations.push({
        id: 'rec-front-load-foam',
        problem: 'Formulation uses high anionic surfactants for a front-load detergent category without sufficient nonionic co-surfactants.',
        why: 'Anionic surfactants create high voluminous foam that impedes front-loader tumbling action.',
        recommendedAction: 'Shift surfactant ratio towards 60% Anionic / 40% Nonionic (e.g. add LAE-9 or Lutensol) or add 0.1% silicone suds suppressor.',
        expectedEffect: 'Controlled low-foam profile, improved mechanical cleaning action, and energy efficiency.',
        tradeOff: 'Nonionic surfactants may require higher dissolution temperatures during manufacturing.',
        confidence: 'HIGH',
        calculationBasis: `Anionic: ${anionicActivePct.toFixed(1)}% vs Nonionic: ${nonionicActivePct.toFixed(1)}%`
      });
    }
  }

  // 8. Hand-Wash / Skin Mildness Check
  if (catContext.foamExpectation === 'High Foam' || productCat.toLowerCase().includes('hand') || productCat.toLowerCase().includes('dish')) {
    if (anionicActivePct > 8 && amphotericActivePct < 0.5 && nonionicActivePct < 1.0) {
      issues.push({
        id: 'harsh-anionic-system',
        issue: 'Single-Surfactant Harshness: High Anionic without Mild Co-Surfactant',
        whyItMatters: 'Pure anionic micelles penetrate stratum corneum barrier lipids, causing severe skin dryness, erythema, and barrier disruption.',
        scientificBasis: 'Interactions of anionic micelles with stratum corneum proteins (Zein dissolution test).',
        scientificType: 'EMPIRICAL',
        severity: 'Medium',
        whatToCheck: 'Add 2-4% Cocamidopropyl Betaine (CAPB) or Alkyl Polyglucoside (APG).'
      });
      recommendations.push({
        id: 'rec-mildness',
        problem: 'Formulation relies on unbuffered anionic surfactant for direct skin-contact application.',
        why: 'Mixed micelles of anionic + amphoteric/nonionic lower monomer concentration and dramatically improve dermatological tolerance.',
        recommendedAction: 'Add 2.0% - 4.0% Cocamidopropyl Betaine (CAPB 30%) or Coco Glucoside to establish mixed micellar synergy.',
        expectedEffect: 'Dramatically improved skin mildness, richer flash foam, and enhanced viscosity response.',
        tradeOff: 'Minor raw material formulation cost adjustment.',
        confidence: 'HIGH',
        calculationBasis: `Anionic active: ${anionicActivePct.toFixed(1)}% | Amphoteric active: ${amphotericActivePct.toFixed(1)}%`
      });
    }
  }

  // 9. Preservative Absence in High Water Liquid
  if (waterPct > 35 && !hasPreservative && effectivePH >= 4.0 && effectivePH <= 9.8) {
    issues.push({
      id: 'missing-preservative',
      issue: 'Aqueous Liquid Lacks Broad-Spectrum Preservative System',
      whyItMatters: 'High water activity ($a_w > 0.95$) combined with biodegradable organic surfactants creates ideal substrate for bacterial and mold proliferation over 12-24 month shelf storage.',
      scientificBasis: 'Microbiological shelf-life kinetics and water activity thresholds.',
      scientificType: 'PREDICTIVE',
      severity: 'Medium',
      whatToCheck: 'Incorporate 0.05% - 0.15% broad-spectrum preservative (e.g. BIT, MIT/CMIT, or Sodium Benzoate at pH < 5.5).'
    });
    recommendations.push({
      id: 'rec-preservative',
      problem: 'High-water liquid formulation without a recognized antimicrobial preservative.',
      why: 'Microbial bioburden causes product haziness, viscosity breakdown, gas generation, and malodor.',
      recommendedAction: 'Add 0.05% - 0.10% Benzisothiazolinone (BIT 20%) or Phenoxyethanol blend suitable for the product pH (add post-neutralization below 40°C).',
      expectedEffect: 'Provides broad-spectrum antimicrobial protection against bacteria and fungi during shelf storage.',
      tradeOff: 'Preservative selection must comply with regional regulatory limits and pH compatibility.',
      confidence: 'HIGH'
    });
  }

  // 10. Duplicate Reactive Ingredients / Commercial Grade Consolidation
  if (duplicateCompoundList.length > 0) {
    issues.push({
      id: 'duplicate-commercial-grades',
      issue: `Dual Commercial Grade Addition: ${duplicateCompoundList.join(', ')}`,
      whyItMatters: 'Using multiple commercial concentrations or grades of the same chemical compound (identical CAS) in the same recipe creates manufacturing complexity without distinct chemical synergy.',
      scientificBasis: 'Raw material inventory rationalization.',
      scientificType: 'CALCULATED',
      severity: 'Low',
      whatToCheck: 'Consolidate into single preferred commercial concentration grade.'
    });
    recommendations.push({
      id: 'rec-duplicate-grades',
      problem: `Multiple commercial entries of the same chemical compound detected: ${duplicateCompoundList.join(', ')}.`,
      why: 'Standardizing on a single commercial grade simplifies bulk storage and dosing in plant production.',
      recommendedAction: 'Consolidate duplicate raw materials into the single primary plant grade (e.g., SLES 70% for logistics savings or SLES 28% for ease of pumping).',
      expectedEffect: 'Streamlined batch manufacturing and simplified inventory tracking.',
      tradeOff: 'Requires adjusting dilution water calculation.',
      confidence: 'HIGH'
    });
  }

  // 11. Concentrated Surfactant Viscosity / Gel Phase Risk
  if (totalActiveSurfactantPct > 35 && !hasHydrotrope && waterPct > 15) {
    issues.push({
      id: 'high-surfactant-gelation',
      issue: `High Active Surfactant Loading (${totalActiveSurfactantPct.toFixed(1)}%) without Hydrotrope`,
      whyItMatters: 'Surfactant active matter above ~32-35% in aqueous systems enters the hexagonal or lamellar liquid-crystalline phase boundary, causing severe gelation and pump blockage at room temperature.',
      scientificBasis: 'Lyotropic liquid crystal phase diagram and micellar packing parameters.',
      scientificType: 'PREDICTIVE',
      severity: 'Medium',
      whatToCheck: 'Add 2-5% hydrotrope (Sodium Xylene Sulfonate, Propylene Glycol, Ethanol).'
    });
    recommendations.push({
      id: 'rec-hydrotrope',
      problem: `High surfactant solids (${totalActiveSurfactantPct.toFixed(1)}%) without adequate hydrotropic coupling.`,
      why: 'Hydrotropes disrupt rigid liquid crystal lattices and lower the isotropic cloud point.',
      recommendedAction: 'Incorporate 2.0% - 4.0% Sodium Xylene Sulfonate (SXS 40%) or Propylene Glycol.',
      expectedEffect: 'Maintains free-flowing isotropic liquid viscosity across temperature variations (5°C - 45°C).',
      tradeOff: 'Adds minor formulation cost.',
      confidence: 'HIGH',
      calculationBasis: `Total active surfactant: ${totalActiveSurfactantPct.toFixed(1)}%`
    });
  }

  // 12. Active Matter Below Category Baseline
  if (effectiveTotalActive < catContext.targetActiveMatterMin && effectiveTotalActive > 0) {
    issues.push({
      id: 'low-active-matter',
      issue: `Sub-Optimal Total Active Solids (${effectiveTotalActive.toFixed(1)}% vs ≥${catContext.targetActiveMatterMin}% Benchmark)`,
      whyItMatters: `Cleaning performance for ${productCat} may fall below commercial efficacy benchmarks, requiring higher dosing per wash cycle.`,
      scientificBasis: 'Surfactant soil-carrying and emulsification capacity standards.',
      scientificType: 'PREDICTIVE',
      severity: 'Low',
      whatToCheck: 'Adjust surfactant concentration or optimize dosing instructions.'
    });
    recommendations.push({
      id: 'rec-low-active',
      problem: `Total active matter (${effectiveTotalActive.toFixed(1)}%) is below standard benchmark for ${productCat} (≥${catContext.targetActiveMatterMin}%).`,
      why: 'Lower active surfactant concentration reduces soil removal velocity and emulsion stability under heavy soil loads.',
      recommendedAction: `Increase primary surfactant concentration to achieve at least ${catContext.targetActiveMatterMin}% active matter.`,
      expectedEffect: 'Higher cleaning performance index (CPI) and market competitiveness.',
      tradeOff: 'Increases raw material cost per kg.',
      confidence: 'MEDIUM',
      calculationBasis: `Current active matter: ${effectiveTotalActive.toFixed(1)}% vs target min: ${catContext.targetActiveMatterMin}%`
    });
  }

  // ==========================================
  // FORMULATION STRENGTHS (Backed by Data)
  // ==========================================

  // 1. Surfactant Synergy
  if (anionicActivePct > 3 && (amphotericActivePct > 1 || nonionicActivePct > 1)) {
    strengths.push({
      id: 'str-surfactant-synergy',
      title: 'Synergistic Mixed Micellar Architecture',
      description: `Formula combines anionic (${anionicActivePct.toFixed(1)}%) with ${
        amphotericActivePct > 0 ? `amphoteric (${amphotericActivePct.toFixed(1)}%) ` : ''
      }${nonionicActivePct > 0 ? `nonionic (${nonionicActivePct.toFixed(1)}%)` : ''} surfactants. Lowers critical micelle concentration (CMC) and boosts dynamic soil release.`,
      scientificBasis: 'Mixed pseudophase micellar thermodynamics and reduced electrostatic headgroup repulsion.',
      scientificType: 'CALCULATED'
    });
  }

  // 2. Hard Water Protection
  if (effectiveHardnessSufficiency === 'sufficient' && effectiveMaxHardness >= waterHardness) {
    strengths.push({
      id: 'str-hardness-tolerance',
      title: 'Robust Hard Water Chelation Reserve',
      description: `Sequestration system protects active detergency up to ${effectiveMaxHardness} ppm CaCO₃, fully satisfying the operational ${waterHardness} ppm water hardness specification.`,
      scientificBasis: 'Stoichiometric calcium/magnesium chelation capacity.',
      scientificType: 'CALCULATED'
    });
  }

  // 3. pH Equilibrium Compliance
  if (effectivePH >= catContext.targetPHMin && effectivePH <= catContext.targetPHMax) {
    strengths.push({
      id: 'str-ph-target',
      title: 'Optimized Target Equilibrium pH',
      description: `Calculated equilibrium pH (${effectivePH.toFixed(2)}) is within standard commercial specifications (${catContext.targetPHMin} - ${catContext.targetPHMax}) for ${productCat}.`,
      scientificBasis: 'Newton-Raphson charge-balance equilibrium.',
      scientificType: 'CALCULATED'
    });
  }

  // 4. Cleaning Performance
  if (effectiveCleaningScore >= 75) {
    strengths.push({
      id: 'str-high-cpi',
      title: 'High Predicted Cleaning Performance Index',
      description: `Predicted Cleaning Performance Index (${effectiveCleaningScore}/100) indicates strong soil removal, emulsification, and particulate dispersion capacity.`,
      scientificBasis: 'Multi-factor empirical cleaning model (surfactant solids, synergy, builder alkalinity).',
      scientificType: 'PREDICTIVE'
    });
  }

  // 5. Preservation
  if (hasPreservative && waterPct > 20) {
    strengths.push({
      id: 'str-preservation',
      title: 'Microbiological Shelf Preservation',
      description: 'Preservative agent incorporated to protect aqueous phase integrity against bacterial and fungal contamination.',
      scientificBasis: 'Preservative chemical active presence.',
      scientificType: 'EMPIRICAL'
    });
  }

  // Calculate Overall Status
  const criticalCount = issues.filter(i => i.severity === 'Critical').length;
  const highCount = issues.filter(i => i.severity === 'High').length;

  let overallStatus: 'PASS' | 'PASS WITH LIMITATIONS' | 'FAIL' = 'PASS';
  let summarySentence = 'No major instability or compatibility conflict detected by current screening models; laboratory validation and batch release testing recommended.';

  if (criticalCount > 0) {
    overallStatus = 'FAIL';
    summarySentence = `Formula has ${criticalCount} critical chemical/physical conflict(s) that require correction before lab batching.`;
  } else if (highCount > 0 || issues.length > 0) {
    overallStatus = 'PASS WITH LIMITATIONS';
    summarySentence = `Formula screening indicates viable baseline with ${issues.length} flagged parameter(s) requiring laboratory optimization and verification.`;
  }

  return {
    sanityCheckPassed: criticalCount === 0,
    overallStatus,
    summarySentence,
    totalIssuesCount: issues.length,
    criticalIssuesCount: criticalCount,
    highIssuesCount: highCount,
    issues,
    strengths,
    recommendations,
    productCategoryContext: catContext
  };
}
