import React, { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

interface HLBGlossaryProps {
  collapsible?: boolean;
}

export const HLBGlossary = React.memo(function HLBGlossary({ collapsible = false }: HLBGlossaryProps) {
  const [isOpen, setIsOpen] = useState(!collapsible);

  const content = (
    <div className="space-y-4 text-xs text-gray-700 leading-relaxed text-left">
      {/* Introduction to HLB Physics */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50/50 p-4 rounded-xl border border-teal-100/80 space-y-3">
        <h5 className="font-extrabold text-[#0f766e] text-sm flex items-center gap-1.5">
          🧬 The Physics of Hydrophilic-Lipophilic Balance (HLB)
        </h5>
        <p className="text-gray-600">
          The <strong>Hydrophilic-Lipophilic Balance (HLB)</strong>, formulated by William C. Griffin in 1949, is an empirical numerical system ranging from <strong>0 to 20</strong> used to characterize a surfactant's affinity for oil (lipophilic) or water (hydrophilic). Understanding the HLB of surfactant molecules is critical for achieving thermodynamic and kinetic stability in emulsion chemistry and cleaning formulations.
        </p>
        <p className="text-gray-600">
          At the boundary between oil and water, surfactant molecules orient themselves based on their polarity. The matching of a surfactant blend's HLB with the <strong>Required HLB (rHLB)</strong> of the target lipid phase minimizes the interfacial tension (<span className="font-mono">γ_ow</span>), resulting in a highly stable film surrounding the dispersed droplets. This structural barrier prevents macroscopic phase separation.
        </p>
      </div>

      {/* Grid of Key Scientific Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
          <span className="font-bold text-[#0f766e] text-xs uppercase block tracking-wider">
            🧪 Emulsion Stability Mechanisms
          </span>
          <p className="text-gray-600 text-[11px]">
            Emulsions are thermodynamically unstable systems that split into separate phases to minimize surface free energy. Emulsifiers with appropriate HLB values stabilize them by:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-gray-600 text-[11px]">
            <li>
              <strong>Steric Hindrance:</strong> Hydrophilic chains (such as polyethylene oxide in Tween surfactants) extend into the aqueous phase, creating a physical barrier that prevents droplets from coalescing upon collision.
            </li>
            <li>
              <strong>Interfacial Tension Reduction:</strong> By packing tightly at the liquid-liquid interface, surfactants lower the energy required to disperse one phase inside another.
            </li>
            <li>
              <strong>Marangoni Effect:</strong> Localized surfactant concentration gradients along the droplet interface resist deformation and prevent droplet rupture during agitation.
            </li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
          <span className="font-bold text-amber-800 text-xs uppercase block tracking-wider">
            ⚠️ Breakdown Modes under Mismatched HLB
          </span>
          <p className="text-gray-600 text-[11px]">
            When the HLB value of the formulation is not balanced with the oil phase, the system collapses through these consecutive stages:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-gray-600 text-[11px]">
            <li>
              <strong>Flocculation:</strong> Weak attraction causes droplets to form clusters, although individual droplet boundaries remain intact.
            </li>
            <li>
              <strong>Coalescence:</strong> Interfacial film ruptures, causing small droplets to merge into larger ones. This process is irreversible.
            </li>
            <li>
              <strong>Creaming / Sedimentation:</strong> Density differences cause dispersed oil droplets to rise to the top (creaming) or heavy particles to sink (sedimentation).
            </li>
            <li>
              <strong>Ostwald Ripening:</strong> Diffusional mass transfer where smaller oil droplets dissolve into the continuous phase and redeposit onto larger droplets.
            </li>
          </ul>
        </div>
      </div>

      {/* Ideal HLB Values Reference Table */}
      <div className="space-y-2">
        <span className="font-bold text-gray-800 text-xs uppercase block tracking-wider flex items-center gap-1.5">
          📊 Reference Matrix: Ideal HLB Ranges for Detergent & Cleaning Applications
        </span>
        <div className="border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <th className="p-2.5">Application / System Type</th>
                <th className="p-2.5 text-center">Ideal HLB Range</th>
                <th className="p-2.5">Emulsion Class / Behavior</th>
                <th className="p-2.5">Chemical Mechanics & Example Agents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600 bg-white">
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Anti-foaming Agents</td>
                <td className="p-2.5 text-center font-bold text-amber-800 font-mono bg-amber-50/25">1.0 – 3.0</td>
                <td className="p-2.5">Oil-soluble defoamers</td>
                <td className="p-2.5">Displace foaming surfactants from air-water interface to collapse foam lamellae. (e.g., silicone oils, high-molecular fatty alcohols).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Water-in-Oil (W/O) Emulsifiers</td>
                <td className="p-2.5 text-center font-bold text-orange-800 font-mono bg-orange-50/25">3.0 – 6.0</td>
                <td className="p-2.5">Lipophilic emulsion stabilizer</td>
                <td className="p-2.5">Coats water droplets inside continuous oil phase. (e.g., Sorbitan Oleate (Span 80), Glyceryl Monostearate, Lecithin). Common in water-resistant polishes and heavy industrial grease.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Glass & Window Cleaners (Wetting)</td>
                <td className="p-2.5 text-center font-bold text-teal-800 font-mono bg-teal-50/25">7.0 – 9.0</td>
                <td className="p-2.5">Surface-tension reducers</td>
                <td className="p-2.5">Reduces contact angle on solid surfaces for quick, streak-free evaporation. Essential in glass cleaners, hard-surface disinfectants, and agricultural sprays. (e.g., ethoxylated alcohols (LAE-3), Span 20).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Oil-in-Water (O/W) Emulsifiers</td>
                <td className="p-2.5 text-center font-bold text-blue-800 font-mono bg-blue-50/25">8.0 – 16.0</td>
                <td className="p-2.5">Hydrophilic emulsion stabilizer</td>
                <td className="p-2.5">Encloses oil droplets in a continuous water medium. Stabilizes silicone polishes, car waxes, moisturizing lotions, and furniture finishes. (e.g., Polysorbate 60, PEG-40 Hydrogenated Castor Oil).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Fabric Softeners & Conditioning</td>
                <td className="p-2.5 text-center font-bold text-pink-800 font-mono bg-pink-50/25">9.0 – 12.0</td>
                <td className="p-2.5">Cationic adsorption coats</td>
                <td className="p-2.5">Adsorb onto fabrics, forming lubricating lipid monolayers that reduce friction and static. (e.g., Esterquats, Imidazolinium methosulfates, Alkyl Dimethyl Ammonium Chlorides).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Automatic Dishwasher Detergents (ADD)</td>
                <td className="p-2.5 text-center font-bold text-yellow-800 font-mono bg-yellow-50/25">11.0 – 12.5</td>
                <td className="p-2.5">Low-foaming soil dispersants</td>
                <td className="p-2.5">Prevents foam-induced pump cavitation while lifting grease and food residues in high-temperature automatic systems. (e.g., EO/PO block copolymers, low-foam non-ionics).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Standard Laundry Detergents</td>
                <td className="p-2.5 text-center font-bold text-[#0f766e] font-mono bg-teal-50/30">12.0 – 15.0</td>
                <td className="p-2.5">Micellar detergent cleaners</td>
                <td className="p-2.5">Forms spherical micelles that trap and suspend grease, sebum, and soot in fabric/surface cleaning. (e.g., LABSA, SLES-2EO, Nonylphenol Ethoxylate (NP-9), Linear Alcohol Ethoxylate (LAE-9)).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Floor Cleaners & Disinfectants</td>
                <td className="p-2.5 text-center font-bold text-emerald-800 font-mono bg-emerald-50/25">11.0 – 13.0</td>
                <td className="p-2.5">High-wetting surface soil emulsifiers</td>
                <td className="p-2.5">Ensures uniform spreading over tiles/stones while lifting dust and coupling pine oil or quats for disinfection. (e.g., SLES, CDE, Lauryl Alcohol Ethoxylate (7EO)).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Manual Dishwash Liquids</td>
                <td className="p-2.5 text-center font-bold text-sky-800 font-mono bg-sky-50/25">13.0 – 15.0</td>
                <td className="p-2.5">Hyper-foaming grease cutters</td>
                <td className="p-2.5">Maintains highly stable flash foam and powerful micellar grease-emulsification even under heavy food fat soil loads. (e.g., SLES (70%), CAPB, Alkyl Polyglucosides (APGs), Cocamide DEA).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Car Wash Shampoos & High-Glide Foam</td>
                <td className="p-2.5 text-center font-bold text-indigo-800 font-mono bg-indigo-50/25">12.5 – 14.0</td>
                <td className="p-2.5">High-lubricity soil suspenders</td>
                <td className="p-2.5">Creates thick, lubricating high-glide foam blanketing to float dirt off automotive clear-coats without scratching. (e.g., AOS-92, SLES, CAPB).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Heavy-Duty Degreasers</td>
                <td className="p-2.5 text-center font-bold text-red-800 font-mono bg-red-50/25">12.5 – 14.5</td>
                <td className="p-2.5">Alkaline-coupled grease emulsifiers</td>
                <td className="p-2.5">Blends of highly active non-ionics designed to strip polymerized greases and motor oil in alkaline systems. (e.g., Decyl Glucoside, C12-15 Alcohol Ethoxylates (7EO-9EO)).</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-gray-900">Solubilizers & Fragrance Coupling</td>
                <td className="p-2.5 text-center font-bold text-purple-800 font-mono bg-purple-50/25">15.0 – 18.0</td>
                <td className="p-2.5">Hydrophilic fragrance solubilizers</td>
                <td className="p-2.5">Solubilizes highly hydrophobic essential oils and fragrances into clear, transparent micellar waters. (e.g., Polysorbate 20 (Tween 20), PEG-60 Hydrogenated Castor Oil, Cocamide DEA).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Calculations of Blending */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
        <h6 className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#0f766e]" /> Mathematical Verification: Griffin's Surfactant Blending Formula
        </h6>
        <p className="text-gray-600 mb-2">
          Often, a single surfactant cannot hit the precise required HLB of a lipid phase. Formulators blend a low-HLB (lipophilic) surfactant and a high-HLB (hydrophilic) surfactant to achieve the exact target balance. The blended HLB is calculated as the weighted average:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-center">
          <div className="bg-white p-3 rounded-lg border border-gray-100 font-mono text-[11px]">
            <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">HLB of Surfactant Mixture</span>
            <span className="font-extrabold text-[#0f766e] text-sm">HLB_blend = (W_A × HLB_A + W_B × HLB_B) / (W_A + W_B)</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-100 font-mono text-[11px]">
            <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">Weight Pct of Surfactant A (f_A)</span>
            <span className="font-extrabold text-[#0f766e] text-sm">f_A = (HLB_target - HLB_B) / (HLB_A - HLB_B) × 100</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <div className="bg-white border border-teal-600/30 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-teal-50/50 to-white hover:from-teal-50/80 transition-all text-left"
          id="hlb-glossary-toggle-btn"
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-teal-50 text-[#0f766e] rounded-lg">
              <BookOpen size={16} />
            </span>
            <div>
              <h4 className="font-extrabold text-[#0f766e] text-sm">📘 Glossary of HLB & Emulsion Stability</h4>
              <p className="text-[10px] text-gray-500">Learn the science of Hydrophilic-Lipophilic Balance in cleaning chemistry.</p>
            </div>
          </div>
          <div className="text-[#0f766e] font-semibold text-xs flex items-center gap-1">
            {isOpen ? "Collapse" : "Expand Glossary"}
            <span className="transform transition-transform duration-200">
              {isOpen ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {isOpen && (
          <div className="p-5 border-t border-gray-100 bg-white animate-fade-in">
            {content}
          </div>
        )}
      </div>
    );
  }

  return content;
});

export default HLBGlossary;
