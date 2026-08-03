import { Formulation } from "../types";

export const FORMULAS: Formulation[] = [
  {
    id: "laundry-liquid-premium",
    name: "Premium Eco-Active Laundry Liquid",
    productType: "Laundry Liquid",
    grade: "Premium",
    targetCost: 120.00,
    actualCost: 98.50,
    activeMatter: 18.2,
    properties: {
      pH: "7.8 - 8.2",
      viscosity: "1800 - 2200 cPs",
      foamHeight: "Medium-Low (optimized for front & top load washers)",
      cleaningRating: 95,
      ecoRating: 90,
      compatibilityScore: 98
    },
    ingredients: [
      { name: "DM Water (Demineralized Water)", percentage: 67.55, role: "Solvent carrier", costPerKg: 2, activeMatterPct: 0 },
      { name: "LABSA (90% Active Slurry)", percentage: 10.00, role: "Anionic Surfactant / Primary Stain Remover", costPerKg: 135, activeMatterPct: 90 },
      { name: "Caustic Soda (NaOH Flakes) - pre-dissolved", percentage: 1.35, role: "Neutralizing agent for LABSA", costPerKg: 45, activeMatterPct: 0 },
      { name: "SLES (70% Paste)", percentage: 8.00, role: "Anionic Surfactant / Foam booster", costPerKg: 110, activeMatterPct: 70 },
      { name: "CAPB (30% Solution)", percentage: 5.00, role: "Amphoteric Surfactant / Skin protection & micellar stabiliser", costPerKg: 95, activeMatterPct: 30 },
      { name: "Coco Glucoside (50% Bio-surfactant)", percentage: 3.00, role: "Non-ionic Bio-surfactant / Greasy soil emulsifier", costPerKg: 160, activeMatterPct: 50 },
      { name: "Sodium Gluconate", percentage: 1.00, role: "Chelator / Heavy metal sequestering & water softening", costPerKg: 120, activeMatterPct: 0 },
      { name: "Sodium Polyacrylate (Anti-redeposition Polymer)", percentage: 0.80, role: "Anti-redeposition & Anti-grey polymer", costPerKg: 240, activeMatterPct: 0 },
      { name: "Optical Brightener CBS-X", percentage: 0.15, role: "Fluorescent Whitening Agent", costPerKg: 1200, activeMatterPct: 0 },
      { name: "Enzyme Blend (Protease/Lipase/Amylase)", percentage: 0.80, role: "Multi-enzyme / Biological stain breakdown", costPerKg: 350, activeMatterPct: 0 },
      { name: "Blue Dye & Fragrance (Ocean breeze)", percentage: 0.35, role: "Esthetics & aroma", costPerKg: 1500, activeMatterPct: 0 },
      { name: "Kathon CG (Preservative)", percentage: 0.10, role: "Preservative / Prevents bacterial growth", costPerKg: 250, activeMatterPct: 0 },
      { name: "Sodium Chloride (Salt) / Viscosity builder", percentage: 1.90, role: "Electrolyte thickening agent", costPerKg: 12, activeMatterPct: 0 }
    ],
    manufacturingMethod: [
      { order: 1, action: "Charge water into clean mixer. Start agitation at 60-80 RPM.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Ensure PPE is worn." },
      { order: 2, action: "Slowly add LABSA under continuous stirring. Stir until fully dissolved with no dark streaks visible.", mixingTime: "15 mins", mixingSpeed: "Medium (100 RPM)", temperature: "Ambient", safetyNote: "Highly acidic; avoid splashing." },
      { order: 3, action: "Gradually add Caustic Soda solution (pre-dissolved 1:3 in water) to neutralize LABSA. Monitor pH continuously until pH stays between 7.5 and 8.0.", mixingTime: "20 mins", mixingSpeed: "Medium", temperature: "Cooling needed (reaction generates heat)", safetyNote: "Exothermic reaction. Hot alkali can cause serious burns." },
      { order: 4, action: "Add SLES paste slowly. Stir thoroughly until all gel lumps are fully dissolved and the mixture is crystal clear.", mixingTime: "30 mins", mixingSpeed: "Medium", temperature: "Warm (35°C makes SLES dissolve faster)", safetyNote: "Avoid rapid stirring to prevent excessive foaming." },
      { order: 5, action: "Add CAPB and Coco Glucoside. Blend until homogeneous.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 6, action: "Incorporate Sodium Gluconate, Sodium Polyacrylate, and pre-dissolved Optical Brightener. Stir until fully integrated.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 7, action: "Cool batch below 35°C. Slowly blend in Enzyme, Fragrance, Color, and Preservative.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Below 35°C", safetyNote: "Adding enzymes at >40°C denatures and destroys them." },
      { order: 8, action: "Prepare a 15% Sodium Chloride solution in a separate tank. Add salt solution slowly in small portions. Viscosity will rise rapidly. Continue adding until target viscosity (~2000 cPs) is achieved.", mixingTime: "20 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Do not dump salt in dry form, and do not over-add, or viscosity will crash." }
    ],
    commonMistakes: [
      "Failing to neutralize the LABSA completely before adding SLES, which causes acid hydrolysis of SLES and destroys viscosity.",
      "Adding enzymes to the batch while it is still hot (above 40°C) from the exothermic neutralization phase, which deactivates enzymes.",
      "Agitating too rapidly, trapping millions of micro air bubbles. This makes the liquid look milky, cloudy, and opaque. It can take up to 48 hours in a holding tank for this foam to escape."
    ],
    troubleshootingNotes: [
      "If viscosity drops completely: check salt level. If you 'salted-out' (exceeded the peak of the salt curve), you must add a small amount of water and fresh surfactant (SLES) to dilute the electrolytes and rebuild micelle structure.",
      "If cloudiness occurs on standing: check for hard water issues. Ensure Sodium Gluconate is fully dissolved and active matter is correct. Or, add 1.0% Sodium Xylene Sulfonate (SXS) hydrotrope to couple the surfactants."
    ],
    packagingCompatibility: "PET or HDPE bottles. Highly stable. Avoid contact with galvanized iron or aluminum."
  },
  {
    id: "dishwash-liquid-standard",
    name: "Standard Heavy-Duty Lemon Dishwash Liquid",
    productType: "Dishwash Liquid",
    grade: "Standard",
    targetCost: 55.00,
    actualCost: 42.80,
    activeMatter: 11.5,
    properties: {
      pH: "6.8 - 7.2 (skin-neutral)",
      viscosity: "2000 - 2500 cPs",
      foamHeight: "High & Dense (rich active suds)",
      cleaningRating: 82,
      ecoRating: 75,
      compatibilityScore: 99
    },
    ingredients: [
      { name: "DM Water", percentage: 76.60, role: "Solvent carrier", costPerKg: 2, activeMatterPct: 0 },
      { name: "LABSA (90%)", percentage: 6.50, role: "Anionic Surfactant / Primary degreasing", costPerKg: 135, activeMatterPct: 90 },
      { name: "Caustic Soda (NaOH Flakes)", percentage: 0.90, role: "Neutralizing agent", costPerKg: 45, activeMatterPct: 0 },
      { name: "SLES (70%)", percentage: 5.00, role: "Anionic Surfactant / Foaming and viscosity", costPerKg: 110, activeMatterPct: 70 },
      { name: "CAPB (30%)", percentage: 3.00, role: "Amphoteric Surfactant / Skin mildness & foam stabilizer", costPerKg: 95, activeMatterPct: 30 },
      { name: "Sodium Citrate", percentage: 0.50, role: "Chelator / Water softener", costPerKg: 85, activeMatterPct: 0 },
      { name: "Citric Acid (50% soln) - for pH trimming", percentage: 0.15, role: "pH adjuster to keep formula skin-friendly", costPerKg: 90, activeMatterPct: 0 },
      { name: "Lemon Fragrance", percentage: 0.20, role: "Fragrance", costPerKg: 1800, activeMatterPct: 0 },
      { name: "Tartrazine Yellow Dye", percentage: 0.05, role: "Esthetics", costPerKg: 600, activeMatterPct: 0 },
      { name: "Kathon CG (Preservative)", percentage: 0.10, role: "Preservative", costPerKg: 180, activeMatterPct: 0 },
      { name: "Sodium Chloride (Salt)", percentage: 2.00, role: "Viscosity builder", costPerKg: 12, activeMatterPct: 0 }
    ],
    manufacturingMethod: [
      { order: 1, action: "Charge water into tank. Add LABSA slowly, mixing thoroughly until dissolved.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Standard acid PPE." },
      { order: 2, action: "Slowly add Caustic Soda solution to neutralize LABSA. Monitor pH closely. Target is pH 7.5.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient (heat will rise)", safetyNote: "Wear face shield." },
      { order: 3, action: "Stir in SLES paste. Mix continuously until entirely dissolved, making a uniform, transparent liquid.", mixingTime: "25 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Do not create vortex to prevent air bubbles." },
      { order: 4, action: "Add CAPB, Sodium Citrate, Dye, and Preservative. Mix well.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 5, action: "Trim pH with Citric Acid solution. Lower pH from 7.5 to a mild, skin-neutral 6.8 - 7.1.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 6, action: "Gradually add pre-dissolved salt water (NaCl) under slow stirring. Liquid will thickens up to a beautiful gel state.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Avoid high-speed stirring during thickening to protect gel network." }
    ],
    commonMistakes: [
      "Over-salting (exceeding 2.5% salt) which thins out the liquid and makes it separate or go cloudy.",
      "Failing to trim pH back to 7.0. Leaving it at pH 8.5 can cause extreme dryness and flaking of hands during dishwashing."
    ],
    troubleshootingNotes: [
      "If product develops mold over 3 months: increase formalin or switch to a broad-spectrum cosmetic preservative (Kathon CG or DMDM Hydantoin) and ensure wash water is sterile."
    ],
    packagingCompatibility: "Clear PET bottles are standard, highlighting the bright yellow liquid. Caps must have an airtight pull-push or flip-top closure."
  },
  {
    id: "laundry-powder-standard",
    name: "Classic High-Power Laundry Powder",
    productType: "Laundry Powder",
    grade: "Standard",
    targetCost: 40.00,
    actualCost: 29.50,
    activeMatter: 10.5,
    properties: {
      pH: "10.5 - 11.2 (Highly Alkaline)",
      viscosity: "N/A (Dry Free-flowing powder)",
      foamHeight: "High Foam (for hand wash & bucket wash)",
      cleaningRating: 80,
      ecoRating: 60,
      compatibilityScore: 95
    },
    ingredients: [
      { name: "Sodium Carbonate (Soda Ash Light)", percentage: 35.00, role: "Primary alkaline builder & water softener", costPerKg: 24, activeMatterPct: 0 },
      { name: "LABSA (90% Acid Slurry) - sprayed", percentage: 10.00, role: "Anionic Surfactant / Primary cleansing agent", costPerKg: 135, activeMatterPct: 90 },
      { name: "Sodium Triphosphate (STPP) / Zeolite A", percentage: 12.00, role: "Phosphate builder / Calcium complexation", costPerKg: 55, activeMatterPct: 0 },
      { name: "Sodium Metasilicate", percentage: 3.00, role: "Corrosion inhibitor (protects washing machine drum)", costPerKg: 48, activeMatterPct: 0 },
      { name: "CMC (Carboxymethyl Cellulose) Powder", percentage: 1.00, role: "Anti-soil redeposition polymer", costPerKg: 280, activeMatterPct: 0 },
      { name: "Optical Brightener CBS-X / DMS-X", percentage: 0.15, role: "Whitening agent", costPerKg: 1200, activeMatterPct: 0 },
      { name: "Sodium Sulfate (Anhydrous Glauber's Salt)", percentage: 36.85, role: "Carrier, flow aid, and density regulator", costPerKg: 10, activeMatterPct: 0 },
      { name: "Blue Silica Active Granules", percentage: 1.50, role: "Aesthetic speckles", costPerKg: 65, activeMatterPct: 0 },
      { name: "Perfume (Lemon / Fresh Lemon)", percentage: 0.20, role: "Fragrance", costPerKg: 1500, activeMatterPct: 0 },
      { name: "Sodium Hydroxide (Caustic Soda Flakes) - dry reaction", percentage: 1.30, role: "Reacts with LABSA slurry in dry-neutralization", costPerKg: 45, activeMatterPct: 0 }
    ],
    manufacturingMethod: [
      { order: 1, action: "Charge Soda Ash Light, Sodium Sulfate, and STPP into a dry ribbon blender or horizontal powder mixer. Blend for 5 minutes to achieve complete uniformity.", mixingTime: "5 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Highly dusty! Dust mask, goggles, and heavy-duty gloves are mandatory." },
      { order: 2, action: "Add dry Caustic Soda flakes (or fine powder) and CMC powder to the ribbon blender. Blend thoroughly.", mixingTime: "5 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Wear skin protection." },
      { order: 3, action: "Slowly spray/inject liquid LABSA 90% (acid slurry) through a pressurized atomizing nozzle into the rotating powder bed. The acid slurry undergoes a dry neutralization reaction with the Soda Ash and Caustic Soda, forming active dry Sodium Alkylbenzene Sulfonate directly on the mineral carrier particles. This reaction generates significant chemical heat.", mixingTime: "15 mins", mixingSpeed: "Continuous blending", temperature: "Reaction heat climbs to 55-60°C", safetyNote: "Wear mask to avoid breathing hot chemical fumes." },
      { order: 4, action: "Add Sodium Metasilicate and Optical Brightener CBS-X. Blend continuously until the heat dissipates and the powder is free-flowing and completely dry.", mixingTime: "10 mins", mixingSpeed: "Medium", temperature: "Cooling down", safetyNote: "None" },
      { order: 5, action: "Blend in Blue Silica Speckles and Perfume. Spray perfume over the falling powder cascade to ensure even scent dispersal.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 6, action: "Discharge powder through a sifter (to break up any small lumps) and store in a cooling silo for 4 hours before packaging to prevent thermal caking in bags.", mixingTime: "N/A", mixingSpeed: "Sifting", temperature: "Ambient", safetyNote: "Ensure bagging room has active dust extraction." }
    ],
    commonMistakes: [
      "Adding liquid LABSA too fast, which creates large, sticky, wet brown lumps that do not neutralize completely, leading to acidic pockets in the powder.",
      "Packaging the powder while it is still hot from the neutralization reaction. When sealed hot, moisture evaporates inside the plastic bag, condenses on cooling, and turns the detergent powder into a solid, rock-hard block (caking)."
    ],
    troubleshootingNotes: [
      "If the powder is sticky or damp: increase the proportion of Sodium Sulfate (Glauber's salt) or add 1-2% precipitated silica (or calcium silicate) as a moisture scavenger and free-flow aid."
    ],
    packagingCompatibility: "Laminated plastic pouches (LDPE/BOPP) are required. Must have a high moisture barrier to prevent ambient humidity from triggering caking during storage."
  },
  {
    id: "toilet-cleaner-acidic",
    name: "Heavy-Duty Acidic Toilet Bowl Cleaner",
    productType: "Toilet Cleaner",
    grade: "Standard",
    targetCost: 45.00,
    actualCost: 32.50,
    activeMatter: 4.5,
    properties: {
      pH: "1.0 - 1.5 (Strongly Acidic)",
      viscosity: "800 - 1200 cPs (Shear-thinning gel for clinging action)",
      foamHeight: "Low to Moderate",
      cleaningRating: 90,
      ecoRating: 40,
      compatibilityScore: 85
    },
    ingredients: [
      { name: "DM Water", percentage: 84.70, role: "Solvent carrier", costPerKg: 2, activeMatterPct: 0 },
      { name: "Hydrochloric Acid (HCl 33% Industrial Grade)", percentage: 12.00, role: "Mineral Acid / Scale dissolver & rust remover", costPerKg: 12, activeMatterPct: 33 },
      { name: "Acid Thickener (Cationic Surfactant, e.g., Ethoxylated Amine)", percentage: 2.00, role: "Viscosity builder & Corrosion inhibitor in acid", costPerKg: 280, activeMatterPct: 100 },
      { name: "Methyl Salicylate or Acid-stable Pine Fragrance", percentage: 0.15, role: "Fragrance / Masks heavy acid fumes", costPerKg: 1200, activeMatterPct: 0 },
      { name: "Acid Blue Dye (CI 42090)", percentage: 0.05, role: "Esthetics / Indicator colour", costPerKg: 800, activeMatterPct: 0 },
      { name: "Lauryl Dimethyl Amine Oxide", percentage: 1.10, role: "Foaming agent & degreaser stable in acid", costPerKg: 140, activeMatterPct: 30 }
    ],
    manufacturingMethod: [
      { order: 1, action: "Charge water into an acid-proof FRP (Fiberglass Reinforced Plastic) or glass-lined vessel. Start slow agitation.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Absolutely do NOT use steel, stainless steel, or aluminum reactors. Hydrochloric acid will dissolve them immediately, releasing highly explosive hydrogen gas." },
      { order: 2, action: "Add Acid Thickener slowly into water and mix until completely dissolved and uniform.", mixingTime: "15 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Wear thick rubber gloves, apron, and full face shield." },
      { order: 3, action: "Slowly pour Hydrochloric Acid (HCl) into the water-thickener mixture under continuous slow stirring. The solution will slowly begin to build viscosity as the acid activates the thickener polymer surfactant network.", mixingTime: "20 mins", mixingSpeed: "Slow", temperature: "Slight temperature rise", safetyNote: "DANGER! Massive acid fumes. Local ventilation or exhaust hoods are strictly mandatory. Pour slowly to prevent spitting." },
      { order: 4, action: "Add Acid Blue Dye and Acid-stable Fragrance. Continue slow stirring until the blue color is completely uniform and free of dye specks.", mixingTime: "15 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 5, action: "Measure viscosity and acid strength. Check that product clings to vertical porcelain surfaces. Fill into specialized squeegee-nozzle plastic bottles.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "Ensure packaging line has plastic-shielded machinery." }
    ],
    commonMistakes: [
      "Using standard surfectants like SLES or LABSA to thicken or foam the HCl. LABSA and SLES will immediately decompose or separate in hydrochloric acid, causing the cleaner to turn into a thin, watery liquid with a separated surfactant layer.",
      "Using stainless steel pipes or filling machines. The acid will destroy them in hours, creating heavy iron contamination (making the blue liquid turn black/dark green) and causing severe leaks."
    ],
    troubleshootingNotes: [
      "If viscosity is too low: check hydrochloric acid concentration. If acid strength is too low, the cationic thickener will not fully protonate, failing to build the gel structure. Add small increments of acid thickener (0.1%) to adjust.",
      "If color fades over 1 month: check the dye quality. Only use specialized acid-stable dyes. Standard food dyes are bleached instantly by active hydrochloric acid."
    ],
    packagingCompatibility: "Must be packaged in thick-walled, blow-molded HDPE bottles with child-resistant, directional angle squeegee-neck caps. Absolutely no metal components in caps."
  },
  {
    id: "floor-cleaner-eco",
    name: "Eco-Friendly Botanical Floor Cleaner",
    productType: "Floor Cleaner",
    grade: "Standard",
    targetCost: 40.00,
    actualCost: 28.50,
    activeMatter: 4.8,
    properties: {
      pH: "7.0 - 7.5 (pH Neutral, safe for marble)",
      viscosity: "100 - 300 cPs (Thin liquid for easy dilution)",
      foamHeight: "Low Foam / Rapid collapse (no rinsing needed)",
      cleaningRating: 75,
      ecoRating: 95,
      compatibilityScore: 100
    },
    ingredients: [
      { name: "DM Water", percentage: 91.50, role: "Solvent carrier", costPerKg: 2, activeMatterPct: 0 },
      { name: "APG (Alkyl Polyglucoside - Decyl Glucoside 50%)", percentage: 4.00, role: "Non-ionic bio-surfactant / Biodegradable cleaning", costPerKg: 155, activeMatterPct: 50 },
      { name: "CAPB (30%)", percentage: 2.00, role: "Amphoteric Surfactant / Co-cleanser and foam controller", costPerKg: 95, activeMatterPct: 30 },
      { name: "Lemongrass / Citronella Essential Oil", percentage: 0.30, role: "Natural insect repellent and fresh aroma", costPerKg: 1200, activeMatterPct: 0 },
      { name: "Sodium Gluconate", percentage: 0.50, role: "Eco-chelator / Prevents white water-spots on floor", costPerKg: 120, activeMatterPct: 0 },
      { name: "Kathon CG (Preservative)", percentage: 0.10, role: "Preservative", costPerKg: 250, activeMatterPct: 0 },
      { name: "Polysorbate 20 (Solubilizer)", percentage: 0.60, role: "Solubilizes lemongrass essential oil in water", costPerKg: 210, activeMatterPct: 0 },
      { name: "Natural Green Color (CI 19140 / 42090)", percentage: 1.00, role: "Aesthetics", costPerKg: 50, activeMatterPct: 0 }
    ],
    manufacturingMethod: [
      { order: 1, action: "Charge DM Water into vessel. Start agitator at 100 RPM.", mixingTime: "5 mins", mixingSpeed: "Medium", temperature: "Ambient", safetyNote: "Light lab PPE." },
      { order: 2, action: "In a separate small beaker, premix Lemongrass / Citronella Oil with Polysorbate 20. Stir until crystal clear and fully solubilized.", mixingTime: "10 mins", mixingSpeed: "Manual/Slow", temperature: "Ambient", safetyNote: "Avoid breathing concentrated pure essential oils." },
      { order: 3, action: "Add APG and CAPB slowly to the water tank. Stir until fully clear.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 4, action: "Add Sodium Gluconate and let it dissolve completely.", mixingTime: "5 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 5, action: "Slowly pour the pre-solubilized Lemongrass-Polysorbate oil mixture into the main tank. Stir until the entire batch turns perfectly clear and transparent. No cloudiness should remain.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" },
      { order: 6, action: "Add Preservative and Dye. Stir for a final 10 minutes, verify pH is around 7.0 - 7.5, and package.", mixingTime: "10 mins", mixingSpeed: "Slow", temperature: "Ambient", safetyNote: "None" }
    ],
    commonMistakes: [
      "Failing to pre-solubilize the essential oil in Polysorbate or APG. Adding essential oil directly to the water tank will cause it to float to the top as oily drops, making the floor cleaner muddy or completely separated.",
      "Using anionic surfactants like LABSA or SLES without a non-slip modifier. High levels of SLES will leave a sticky surfactant film on marble, which attracts dirt, leaves foot marks, and can make floor extremely slippery when wet."
    ],
    troubleshootingNotes: [
      "If liquid is hazy or turbid: add a tiny amount of solubilizer (Polysorbate 20 or IPA) to clarify the oil emulsion. Ensure APG used is completely dissolved."
    ],
    packagingCompatibility: "HDPE or translucent PET bottles with measuring dosing caps."
  }
];
