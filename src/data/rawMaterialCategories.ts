import { getAllUniversalIngredients, UniversalIngredient } from './universalIngredientLibrary';

export interface RawMaterialSubcategory {
  id: string;
  name: string;
  shortName: string;
  matches: (ing: UniversalIngredient) => boolean;
}

export interface RawMaterialCategoryDef {
  id: string;
  name: string;
  shortName: string;
  hindiHint: string;
  iconName: string; // Lucide icon identifier
  description: string;
  examples: string;
  badgeColor: string;
  accentBg: string;
  subcategories?: RawMaterialSubcategory[];
  matches: (ing: UniversalIngredient, subcategoryId?: string) => boolean;
}

export const RAW_MATERIAL_CATEGORIES: RawMaterialCategoryDef[] = [
  {
    id: 'ionic',
    name: 'Ionic Surfactants',
    shortName: 'Ionic',
    hindiHint: 'आयोनिक सर्फेक्टेंट्स (Anionic, Amphoteric, Cationic)',
    iconName: 'Zap',
    description: 'Charged primary & secondary detergency actives, lather boosters and conditioning quats.',
    examples: 'LABSA 90%/96%, SLES 70%/28%, SLS, AOS 38%, CAPB 30%, Lauryl Betaine, BKC 50%, Cetrimonium',
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-950/60',
    accentBg: 'from-amber-950/40 to-orange-950/20 border-amber-500/30',
    subcategories: [
      {
        id: 'all',
        name: 'All Ionic (101)',
        shortName: 'All',
        matches: () => true
      },
      {
        id: 'anionic',
        name: 'Anionic (LABSA, SLES, SLS, AOS)',
        shortName: 'Anionic',
        matches: (i) => {
          const c = (i.category || '').toLowerCase();
          const n = (i.name || '').toLowerCase();
          return c.includes('anionic') || n.includes('labsa') || n.includes('sles') || n.includes('sls') || n.includes('aos') || n.includes('sulfate') || n.includes('sulphonate') || n.includes('soap');
        }
      },
      {
        id: 'amphoteric',
        name: 'Amphoteric (CAPB, Betaine, Amine Oxide)',
        shortName: 'Amphoteric',
        matches: (i) => {
          const c = (i.category || '').toLowerCase();
          const n = (i.name || '').toLowerCase();
          return c.includes('amphoteric') || n.includes('betaine') || n.includes('capb') || n.includes('amine oxide');
        }
      },
      {
        id: 'cationic',
        name: 'Cationic (BKC, Quats, Esterquats)',
        shortName: 'Cationic',
        matches: (i) => {
          const c = (i.category || '').toLowerCase();
          const n = (i.name || '').toLowerCase();
          return c.includes('cationic') || n.includes('bkc') || n.includes('benzalkonium') || n.includes('quat') || n.includes('cetrimonium') || n.includes('esterquat');
        }
      }
    ],
    matches: (i, subcat) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      const isIonic = c.includes('anionic') || c.includes('cationic') || c.includes('amphoteric') ||
        n.includes('labsa') || n.includes('sles') || n.includes('sls') || n.includes('aos') ||
        n.includes('betaine') || n.includes('capb') || n.includes('bkc') || n.includes('quat') ||
        n.includes('sulfate') || n.includes('sulphonate') || n.includes('amine oxide') || n.includes('cetrimonium');
      if (!isIonic) return false;
      if (!subcat || subcat === 'all') return true;
      if (subcat === 'anionic') {
        return c.includes('anionic') || n.includes('labsa') || n.includes('sles') || n.includes('sls') || n.includes('aos') || n.includes('sulfate') || n.includes('sulphonate');
      }
      if (subcat === 'amphoteric') {
        return c.includes('amphoteric') || n.includes('betaine') || n.includes('capb') || n.includes('amine oxide');
      }
      if (subcat === 'cationic') {
        return c.includes('cationic') || n.includes('bkc') || n.includes('benzalkonium') || n.includes('quat') || n.includes('cetrimonium') || n.includes('esterquat');
      }
      return true;
    }
  },
  {
    id: 'nonionic',
    name: 'Nonionic Surfactants',
    shortName: 'Nonionic',
    hindiHint: 'नॉन-आयोनिक सर्फेक्टेंट्स (Ethoxylates, APG, DEA)',
    iconName: 'Droplets',
    description: 'Uncharged grease-cutting and emulsifying surfactants with robust hard-water tolerance.',
    examples: 'Alcohol Ethoxylate (7EO, 9EO), Lauryl Alcohol Ethoxylate, APG (Decyl/Coco Glucoside), Cocamide DEA, Poloxamer',
    badgeColor: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/60',
    accentBg: 'from-cyan-950/40 to-blue-950/20 border-cyan-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('nonionic') || n.includes('ethoxylate') || n.includes('apg') || n.includes('glucoside') || n.includes('cocamide') || n.includes('poloxamer') || n.includes('pluronic') || n.includes('tween') || n.includes('lae');
    }
  },
  {
    id: 'builders',
    name: 'Builders (Alkaline & Inorganic)',
    shortName: 'Builders',
    hindiHint: 'बिल्डर्स व अल्कलाइन साल्ट्स (Soda Ash, Silicate, TSP)',
    iconName: 'Building',
    description: 'Alkaline saponification builders, soil suspending salts and pH reserve contributors.',
    examples: 'Soda Ash (Dense & Light), Sodium Metasilicate (Penta & Anhydrous), Sodium Silicate Liquid, TSP, Borax',
    badgeColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
    accentBg: 'from-emerald-950/40 to-teal-950/20 border-emerald-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      // Exclude pure soluble chelation agents to avoid confusion
      if (n.includes('edta') || n.includes('citrate') || n.includes('glda') || n.includes('mgda') || n.includes('stpp')) return false;
      return c.includes('alkaline builder') || n.includes('soda ash') || n.includes('sodium carbonate') || n.includes('metasilicate') || n.includes('sodium silicate') || n.includes('potassium silicate') || n.includes('trisodium phosphate') || n.includes('borax') || n.includes('disodium phosphate');
    }
  },
  {
    id: 'chelators',
    name: 'Chelators & Sequestrants',
    shortName: 'Chelators',
    hindiHint: 'चिलेटर्स व वाटर सॉफ्टनर्स (Citrate, EDTA, STPP, GLDA)',
    iconName: 'Shield',
    description: 'Calcium and Magnesium hardness ion binding agents, scale inhibitors and crystal growth retardants.',
    examples: 'Sodium Citrate Dihydrate, Tetrasodium EDTA (99% & 39%), STPP 94%, GLDA 47%, MGDA 40%, Zeolite 4A, Phosphonates',
    badgeColor: 'text-indigo-300 border-indigo-500/40 bg-indigo-950/60',
    accentBg: 'from-indigo-950/40 to-purple-950/20 border-indigo-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      const r = (i.role || i.function || '').toLowerCase();
      return c.includes('chelator') || n.includes('citrate') || n.includes('edta') || n.includes('glda') || n.includes('mgda') || n.includes('stpp') || n.includes('phosphonate') || n.includes('dtpa') || n.includes('zeolite') || n.includes('gluconate') || r.includes('chelat') || r.includes('sequestrant');
    }
  },
  {
    id: 'thickeners',
    name: 'Thickeners & Polymers',
    shortName: 'Thickeners',
    hindiHint: 'थिकनर व रियोलॉजी पॉलिमर्स (Carbomer, Xanthan, HPMC)',
    iconName: 'Layers',
    description: 'Viscosity builders, yield stress rheology modifiers, anti-redeposition polymers and crystal modifiers.',
    examples: 'Carbomer 940, Xanthan Gum, HPMC, Sodium Polyacrylate, Polyquaternium-7, CMC, Acrylates Copolymer',
    badgeColor: 'text-purple-300 border-purple-500/40 bg-purple-950/60',
    accentBg: 'from-purple-950/40 to-pink-950/20 border-purple-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('polymer') || c.includes('thickener') || n.includes('carbomer') || n.includes('xanthan') || n.includes('hpmc') || n.includes('cellulose') || n.includes('polyacrylate') || n.includes('polyquaternium') || n.includes('acrylates');
    }
  },
  {
    id: 'enzymes',
    name: 'Enzymes',
    shortName: 'Enzymes',
    hindiHint: 'एंजाइम्स (Protease, Amylase, Lipase, Cellulase)',
    iconName: 'Activity',
    description: 'Biological catalytic stain digesters for blood, food starch, oil, fat and fabric anti-pilling.',
    examples: 'Protease (Savinase), Amylase (Stainzyme), Lipase, Cellulase, Mannanase, Liquid Multienzyme Complex',
    badgeColor: 'text-rose-300 border-rose-500/40 bg-rose-950/60',
    accentBg: 'from-rose-950/40 to-red-950/20 border-rose-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('enzyme') || n.includes('protease') || n.includes('amylase') || n.includes('lipase') || n.includes('cellulase') || n.includes('mannanase') || n.includes('savinase') || n.includes('stainzyme');
    }
  },
  {
    id: 'preservatives',
    name: 'Preservatives & Biocides',
    shortName: 'Preservatives',
    hindiHint: 'प्रिजर्वेटिव्स व बायोसाइड्स (Phenoxyethanol, Kathon, Benzoate)',
    iconName: 'ShieldCheck',
    description: 'Microbial stabilization agents, broad-spectrum bactericides and fungistatic shelf-life protectors.',
    examples: 'Phenoxyethanol, Kathon CG (CMIT/MIT), Sodium Benzoate, Potassium Sorbate, Bronopol, PCMX, DMDM Hydantoin',
    badgeColor: 'text-teal-300 border-teal-500/40 bg-teal-950/60',
    accentBg: 'from-teal-950/40 to-emerald-950/20 border-teal-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('preservative') || c.includes('biocide') || n.includes('kathon') || n.includes('phenoxyethanol') || n.includes('benzoate') || n.includes('sorbate') || n.includes('bronopol') || n.includes('pcmx') || n.includes('dmdm') || n.includes('isothiazolinone');
    }
  },
  {
    id: 'solvents',
    name: 'Solvents & Hydrotropes',
    shortName: 'Solvents',
    hindiHint: 'सॉल्वेंट्स व हाइड्रोप्रोप्स (SXS, Glycol, Glycerin, IPA)',
    iconName: 'Compass',
    description: 'Coupling hydrotropes, phase stabilizers, freeze-thaw depressants and heavy grease solvents.',
    examples: 'Sodium Xylene Sulfonate (SXS 40%), SCS 40%, Propylene Glycol, Glycerin, Ethanol 99%, Isopropanol (IPA), Butyl Glycol',
    badgeColor: 'text-blue-300 border-blue-500/40 bg-blue-950/60',
    accentBg: 'from-blue-950/40 to-cyan-950/20 border-blue-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('solvent') || c.includes('hydrotrope') || n.includes('sxs') || n.includes('scs') || n.includes('propylene glycol') || n.includes('glycerin') || n.includes('ethanol') || n.includes('isopropanol') || n.includes('glycol ether');
    }
  },
  {
    id: 'neutralizers',
    name: 'Neutralizers, Bases & Acids',
    shortName: 'Bases & Acids',
    hindiHint: 'न्यूट्रलाइजर्स, बेस व एसिड्स (Caustic Soda, KOH, TEA, Citric)',
    iconName: 'Scale',
    description: 'Alkaline neutralizers for acid slurries, buffering agents and acidic limescale descalers.',
    examples: 'Caustic Soda Flakes / 48% Lye, Potassium Hydroxide (KOH), Triethanolamine (TEA), Citric Acid, Sulfamic Acid, HCl',
    badgeColor: 'text-yellow-300 border-yellow-500/40 bg-yellow-950/60',
    accentBg: 'from-yellow-950/40 to-amber-950/20 border-yellow-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('neutralizer') || c.includes('base') || c.includes('acid') || c.includes('descaler') || n.includes('sodium hydroxide') || n.includes('potassium hydroxide') || n.includes('tea') || n.includes('mea') || n.includes('hydrochloric') || n.includes('sulfamic') || n.includes('phosphoric');
    }
  },
  {
    id: 'additives',
    name: 'Bleach, Dyes & Additives',
    shortName: 'Additives',
    hindiHint: 'ब्लीच, डाई, खुशबू व स्पेशल एडिटिव्स (Percarbonate, Tinopal, Perfumes)',
    iconName: 'Sparkles',
    description: 'Oxygen bleaching systems, optical fabric brighteners, water-soluble dyes, essential fragrances and pearlizers.',
    examples: 'Sodium Percarbonate, Hydrogen Peroxide 50%, Tinopal CBS-X, Fluorescent Dyes, Encapsulated Fragrances, EGMS',
    badgeColor: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-950/60',
    accentBg: 'from-fuchsia-950/40 to-purple-950/20 border-fuchsia-500/30',
    matches: (i) => {
      const c = (i.category || '').toLowerCase();
      const n = (i.name || '').toLowerCase();
      return c.includes('bleach') || c.includes('oxidizer') || c.includes('dye') || c.includes('brightener') || c.includes('additive') || n.includes('percarbonate') || n.includes('peroxide') || n.includes('tinopal') || n.includes('fragrance') || n.includes('color');
    }
  }
];

export function getCategoryDefinition(categoryId: string): RawMaterialCategoryDef | undefined {
  return RAW_MATERIAL_CATEGORIES.find(c => c.id === categoryId);
}

export function categorizeIngredientPrimary(ingredient: UniversalIngredient): RawMaterialCategoryDef {
  for (const cat of RAW_MATERIAL_CATEGORIES) {
    if (cat.matches(ingredient)) {
      return cat;
    }
  }
  return RAW_MATERIAL_CATEGORIES[RAW_MATERIAL_CATEGORIES.length - 1]; // Fallback to Additives
}

export function getIngredientsByMajorCategory(categoryId: string, subcategoryId?: string): UniversalIngredient[] {
  const all = getAllUniversalIngredients();
  if (!categoryId || categoryId === 'all') return all;
  const def = getCategoryDefinition(categoryId);
  if (!def) return all;
  return all.filter(ing => def.matches(ing, subcategoryId));
}

export function getGroupedIngredientsForSelect(): Record<string, UniversalIngredient[]> {
  const all = getAllUniversalIngredients();
  const grouped: Record<string, UniversalIngredient[]> = {};
  
  RAW_MATERIAL_CATEGORIES.forEach(cat => {
    grouped[cat.name] = [];
  });

  all.forEach(ing => {
    let assigned = false;
    for (const cat of RAW_MATERIAL_CATEGORIES) {
      if (cat.matches(ing)) {
        grouped[cat.name].push(ing);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const lastCat = RAW_MATERIAL_CATEGORIES[RAW_MATERIAL_CATEGORIES.length - 1].name;
      grouped[lastCat].push(ing);
    }
  });

  return grouped;
}
