import { FormulationIngredient } from '../../types';
import { ClassifiedIngredient, FunctionalGroupSummary, PowderFunctionalClass } from './types';
import { UNIVERSAL_INGREDIENTS } from '../../data/universalIngredientLibrary';

export function classifyPowderIngredient(ing: FormulationIngredient): ClassifiedIngredient {
  const name = (ing.name || '').trim();
  const lowerName = name.toLowerCase();
  const rawRole = (ing.role || ing.category || ing.function || '').toLowerCase();
  const pct = Number((ing as any)?.percentage ?? (ing as any)?.percent ?? (ing as any)?.percentageInFormula ?? 0) || 0;
  const cost = Number(ing.costPerKg ?? 0) || 0;
  
  // Try matching against universal ingredient library for master metadata
  const masterItem = UNIVERSAL_INGREDIENTS.find(
    u => u.name.toLowerCase() === lowerName || (ing.id && u.id === ing.id)
  );

  let activeDefault: number | undefined;
  const rawActive = ing.activeMatterPct ?? ing.activePercent ?? (ing as any)?.activeMatter ?? (ing as any)?.purity;
  if (rawActive !== undefined && rawActive !== null && !isNaN(Number(rawActive))) {
    activeDefault = Number(rawActive);
  } else if (masterItem?.activeDefault !== undefined) {
    activeDefault = masterItem.activeDefault;
  } else {
    // Pure standard dry minerals, builders, salts and colorants default to 100% active/purity.
    // Unknown surfactants, specialty blends, or proprietary pastes without purity remain undefined (INSUFFICIENT_DATA).
    const isPureSolidMineral =
      lowerName.includes('soda ash') ||
      lowerName.includes('sodium carbonate') ||
      lowerName.includes('sodium sulfate') ||
      lowerName.includes('sodium sulphate') ||
      lowerName.includes('sodium chloride') ||
      lowerName.includes('zeolite') ||
      lowerName.includes('optical brightener') ||
      lowerName.includes('fragrance') ||
      lowerName.includes('colorant') ||
      lowerName.includes('dye');

    if (isPureSolidMineral) {
      activeDefault = 100;
    } else {
      activeDefault = undefined;
    }
  }

  let functionalClass: PowderFunctionalClass = 'Other';

  // 1. Surfactants
  if (
    lowerName.includes('labsa') ||
    lowerName.includes('linear alkylbenzene sulfonic') ||
    lowerName.includes('acid slurry') ||
    lowerName.includes('sles') ||
    lowerName.includes('sodium laureth sulfate') ||
    lowerName.includes('sodium lauryl ether sulfate') ||
    lowerName.includes('sls') ||
    lowerName.includes('sodium lauryl sulfate') ||
    lowerName.includes('aos') ||
    lowerName.includes('alpha olefin sulfonate') ||
    lowerName.includes('sas') ||
    lowerName.includes('secondary alkane sulfonate') ||
    rawRole.includes('anionic surfactant') ||
    (rawRole.includes('anionic') && !rawRole.includes('polymer'))
  ) {
    functionalClass = 'Anionic Surfactant';
  } else if (
    lowerName.includes('ethoxylate') ||
    lowerName.includes('lae') ||
    lowerName.includes('alcohol ethoxylate') ||
    lowerName.includes('apg') ||
    lowerName.includes('alkyl polyglucoside') ||
    lowerName.includes('coco glucoside') ||
    lowerName.includes('lauryl glucoside') ||
    lowerName.includes('decyl glucoside') ||
    lowerName.includes('nonylphenol') ||
    lowerName.includes('lutensol') ||
    rawRole.includes('nonionic surfactant') ||
    rawRole.includes('nonionic')
  ) {
    functionalClass = 'Nonionic Surfactant';
  } else if (
    lowerName.includes('betaine') ||
    lowerName.includes('capb') ||
    lowerName.includes('cocamidopropyl betaine') ||
    lowerName.includes('amine oxide') ||
    lowerName.includes('sultaine') ||
    rawRole.includes('amphoteric')
  ) {
    functionalClass = 'Amphoteric Surfactant';
  } else if (
    lowerName.includes('bkc') ||
    lowerName.includes('benzalkonium') ||
    lowerName.includes('quat') ||
    lowerName.includes('esterquat') ||
    lowerName.includes('cetrimonium') ||
    rawRole.includes('cationic')
  ) {
    functionalClass = 'Cationic Surfactant';
  } else if (
    lowerName.includes('surfactant') ||
    rawRole.includes('surfactant')
  ) {
    functionalClass = 'Anionic Surfactant';
  }
  // 2. Builders (Precipitation / Ion-Exchange) — Distinct from Soluble Chelators
  else if (
    lowerName.includes('soda ash') ||
    lowerName.includes('sodium carbonate') ||
    lowerName.includes('zeolite') ||
    lowerName.includes('stpp') ||
    lowerName.includes('tripolyphosphate') ||
    lowerName.includes('sodium bicarbonate') ||
    lowerName.includes('sodium sesquicarbonate') ||
    (rawRole.includes('builder') && !rawRole.includes('chelator') && !rawRole.includes('sequestrant'))
  ) {
    functionalClass = 'Builder (Precipitation / Ion-Exchange)';
  }
  // 3. Chelating Agents / Soluble Sequestrants (Soluble stoichiometric complexing agents)
  else if (
    lowerName.includes('edta') ||
    lowerName.includes('glda') ||
    lowerName.includes('mgda') ||
    lowerName.includes('dissolvine') ||
    lowerName.includes('trilon') ||
    lowerName.includes('ids') ||
    lowerName.includes('iminodisuccinate') ||
    lowerName.includes('citrate') ||
    lowerName.includes('sodium citrate') ||
    lowerName.includes('phosphonate') ||
    lowerName.includes('hedp') ||
    lowerName.includes('dtpmp') ||
    lowerName.includes('atmp') ||
    rawRole.includes('chelator') ||
    rawRole.includes('chelating') ||
    rawRole.includes('sequestrant')
  ) {
    functionalClass = 'Chelating Agent / Soluble Sequestrant';
  }
  // 4. Alkalinity Contributors / Alkali
  else if (
    lowerName.includes('sodium metasilicate') ||
    lowerName.includes('caustic soda') ||
    lowerName.includes('sodium hydroxide') ||
    lowerName.includes('potassium hydroxide') ||
    rawRole.includes('alkali') ||
    rawRole.includes('alkalinity')
  ) {
    functionalClass = 'Alkalinity Contributor';
  }
  // 5. Fillers / Bulking Agents
  else if (
    lowerName.includes('sodium sulfate') ||
    lowerName.includes('sodium sulphate') ||
    lowerName.includes('salt') ||
    lowerName.includes('sodium chloride') ||
    lowerName.includes('glauber') ||
    lowerName.includes('anhydrous sulfate') ||
    rawRole.includes('filler') ||
    rawRole.includes('bulking')
  ) {
    functionalClass = 'Filler / Bulking Agent';
  }
  // 6. Bleaching Agents
  else if (
    lowerName.includes('percarbonate') ||
    lowerName.includes('sodium percarbonate') ||
    lowerName.includes('perborate') ||
    lowerName.includes('sodium perborate') ||
    lowerName.includes('peracid') ||
    rawRole.includes('bleach') && !rawRole.includes('activator')
  ) {
    functionalClass = 'Bleaching Agent';
  }
  // 7. Bleach Activators
  else if (
    lowerName.includes('taed') ||
    lowerName.includes('tetraacetylethylenediamine') ||
    lowerName.includes('nobs') ||
    rawRole.includes('bleach activator')
  ) {
    functionalClass = 'Bleach Activator';
  }
  // 8. Optical Brighteners
  else if (
    lowerName.includes('brightener') ||
    lowerName.includes('optical bright') ||
    lowerName.includes('cbs-x') ||
    lowerName.includes('tinopal') ||
    lowerName.includes('dms') ||
    rawRole.includes('brightener')
  ) {
    functionalClass = 'Optical Brightener';
  }
  // 9. Enzymes
  else if (
    lowerName.includes('protease') ||
    lowerName.includes('amylase') ||
    lowerName.includes('lipase') ||
    lowerName.includes('cellulase') ||
    lowerName.includes('mannanase') ||
    lowerName.includes('enzyme') ||
    lowerName.includes('savinase') ||
    lowerName.includes('stainzyme') ||
    rawRole.includes('enzyme')
  ) {
    functionalClass = 'Enzyme';
  }
  // 10. Polymers (Anti-redeposition & Soil Release)
  else if (
    lowerName.includes('polyacrylate') ||
    lowerName.includes('sokalan') ||
    lowerName.includes('acrylic-maleic') ||
    lowerName.includes('cmc') ||
    lowerName.includes('carboxymethyl cellulose') ||
    rawRole.includes('anti-redeposition')
  ) {
    functionalClass = 'Anti-redeposition Polymer';
  } else if (
    lowerName.includes('soil release') ||
    lowerName.includes('texcare') ||
    rawRole.includes('soil release')
  ) {
    functionalClass = 'Soil Release Polymer';
  }
  // 11. Fragrance & Colorants
  else if (
    lowerName.includes('fragrance') ||
    lowerName.includes('perfume') ||
    lowerName.includes('scent') ||
    lowerName.includes('essential oil') ||
    rawRole.includes('fragrance') ||
    rawRole.includes('perfume')
  ) {
    functionalClass = 'Fragrance';
  } else if (
    lowerName.includes('color') ||
    lowerName.includes('dye') ||
    lowerName.includes('speckle') ||
    lowerName.includes('pigment') ||
    rawRole.includes('colorant') ||
    rawRole.includes('dye')
  ) {
    functionalClass = 'Colorant';
  }
  // 12. Processing Aids & Anti-caking
  else if (
    lowerName.includes('sodium silicate') ||
    lowerName.includes('silicate powder') ||
    lowerName.includes('water glass') ||
    rawRole.includes('processing aid')
  ) {
    functionalClass = 'Processing Aid';
  } else if (
    lowerName.includes('fumed silica') ||
    lowerName.includes('silica') ||
    lowerName.includes('aerosil') ||
    lowerName.includes('anti-caking') ||
    lowerName.includes('anticaking') ||
    rawRole.includes('anti-caking')
  ) {
    functionalClass = 'Anti-caking Agent';
  } else if (lowerName.includes('carrier') || rawRole.includes('carrier')) {
    functionalClass = 'Carrier';
  }

  const isSurfactant = functionalClass.includes('Surfactant');
  const isBuilder = functionalClass === 'Builder (Precipitation / Ion-Exchange)';
  const isChelator = functionalClass === 'Chelating Agent / Soluble Sequestrant';
  const isAlkalinitySource = functionalClass === 'Alkalinity Contributor' || lowerName.includes('soda ash') || lowerName.includes('sodium carbonate');
  const isFiller = functionalClass === 'Filler / Bulking Agent';

  return {
    id: ing.id,
    name: ing.name || 'Unnamed Ingredient',
    inputPercentage: pct,
    activeMatterPct: activeDefault,
    functionalClass,
    isSurfactant,
    isBuilder,
    isChelator,
    isAlkalinitySource,
    isFiller,
    costPerKg: cost
  };
}

export function classifyAllPowderIngredients(ingredients: FormulationIngredient[]): {
  ingredients: ClassifiedIngredient[];
  groupSummaries: FunctionalGroupSummary[];
} {
  const safeList = Array.isArray(ingredients) ? ingredients : [];
  const classified = safeList.map(classifyPowderIngredient);

  const groupMap = new Map<PowderFunctionalClass, { total: number; names: string[] }>();

  classified.forEach(c => {
    const existing = groupMap.get(c.functionalClass) || { total: 0, names: [] };
    existing.total += c.inputPercentage;
    existing.names.push(c.name);
    groupMap.set(c.functionalClass, existing);
  });

  const groupSummaries: FunctionalGroupSummary[] = Array.from(groupMap.entries()).map(([functionalClass, data]) => ({
    functionalClass,
    totalPercentage: Number(data.total.toFixed(4)),
    ingredientCount: data.names.length,
    ingredientNames: data.names
  }));

  // Sort groups with highest percentages first
  groupSummaries.sort((a, b) => b.totalPercentage - a.totalPercentage);

  return {
    ingredients: classified,
    groupSummaries
  };
}
