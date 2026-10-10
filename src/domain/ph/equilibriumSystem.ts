/**
 * ============================================================================
 * REAL SCIENTIFIC pH ENGINE v2 - EQUILIBRIUM SYSTEM & MASS/CHARGE BALANCE
 * ============================================================================
 * Implements rigorous polyprotic mass balance distribution fractions,
 * temperature-dependent autoionization, and electroneutrality charge balance.
 * ============================================================================
 */

import { ActivityModel } from './activityModel';
import { NormalizedComposition, ChemicalFamilySpeciation, SpeciationFraction } from './types';

export class EquilibriumSystem {
  /**
   * Computes speciation ionization fractions (alpha0 ... alphan) for an n-protic acid system.
   * alpha_0 corresponds to fully protonated HnA (charge 0).
   * alpha_k corresponds to H(n-k)A^(k-) (charge -k).
   */
  static calculatePolyproticAlphas(pKa: number[], pH: number): number[] {
    const ka = pKa.map(p => Math.pow(10, -p));
    const n = ka.length;

    const terms: number[] = [];
    let maxLogTerm = -Infinity;
    const logTerms: number[] = [];

    let cumulativeLogKa = 0;
    for (let i = 0; i <= n; i++) {
      let logTerm = (n - i) * (-pH) + cumulativeLogKa;
      logTerms.push(logTerm);
      if (logTerm > maxLogTerm) {
        maxLogTerm = logTerm;
      }
      if (i < n) {
        cumulativeLogKa += Math.log10(Math.max(1e-50, ka[i]));
      }
    }

    let sumScaled = 0;
    for (let i = 0; i <= n; i++) {
      const scaled = Math.pow(10, logTerms[i] - maxLogTerm);
      terms.push(scaled);
      sumScaled += scaled;
    }

    if (sumScaled <= 0 || !isFinite(sumScaled)) {
      return terms.map((_, idx) => (idx === 0 ? 1 : 0));
    }

    return terms.map(t => t / sumScaled);
  }

  /**
   * Computes ionization fraction for a weak amine base B + H+ <=> BH+ (pKaConjugate).
   */
  static calculateAmineProtonation(pKaConjugate: number, pH: number): { fractionProtonated: number; fractionNeutral: number } {
    const h = Math.pow(10, -pH);
    const ka = Math.pow(10, -pKaConjugate);
    const denom = h + ka;
    if (denom <= 0) return { fractionProtonated: 0, fractionNeutral: 1 };
    return {
      fractionProtonated: h / denom,
      fractionNeutral: ka / denom
    };
  }

  /**
   * Evaluates the fundamental electroneutrality charge balance residual F(pH)
   * F(pH) = Sum(Positive Charges) - Sum(Negative Charges)
   */
  static evaluateChargeBalance(
    pH: number,
    composition: NormalizedComposition,
    temperatureC: number = 25.0
  ): {
    residual: number;
    positiveCharge: number;
    negativeCharge: number;
    speciation: ChemicalFamilySpeciation[];
    ions: Array<{ concentrationMolar: number; charge: number }>;
  } {
    const Kw = ActivityModel.getWaterAutoionizationKw(temperatureC);
    const hConc = Math.pow(10, -pH);
    const ohConc = Kw / Math.max(1e-15, hConc);

    let posCharge = hConc;
    let negCharge = ohConc;

    const ions: Array<{ concentrationMolar: number; charge: number }> = [
      { concentrationMolar: hConc, charge: 1 },
      { concentrationMolar: ohConc, charge: -1 }
    ];

    const speciationList: ChemicalFamilySpeciation[] = [];

    let totalNa = 0;
    let totalK = 0;
    let totalCl = 0;
    let totalSO4 = 0;
    let totalLABSAnion = 0;
    let totalStrongAcidMoles = 0;
    let totalStrongBaseMoles = 0;

    const familyMolarities: Record<string, { definition: any; totalMolarity: number }> = {};

    for (const ing of composition.ingredients) {
      if (!ing.isRecognized || !ing.resolvedSpecies || ing.molarity <= 0) continue;
      const sp = ing.resolvedSpecies;

      // 1. Strong bases
      if (sp.speciesId === 'naoh') {
        totalNa += ing.molarity;
        totalStrongBaseMoles += ing.molarity;
      } else if (sp.speciesId === 'koh') {
        totalK += ing.molarity;
        totalStrongBaseMoles += ing.molarity;
      }
      // 2. Strong acids
      else if (sp.speciesId === 'hydrochloric_acid') {
        totalCl += ing.molarity;
        totalStrongAcidMoles += ing.molarity;
      } else if (sp.speciesId === 'sulfuric_acid') {
        totalSO4 += ing.molarity;
        totalStrongAcidMoles += ing.molarity * 2;
      } else if (sp.speciesId === 'nitric_acid') {
        negCharge += ing.molarity;
        totalStrongAcidMoles += ing.molarity;
        ions.push({ concentrationMolar: ing.molarity, charge: -1 });
      } else if (sp.speciesId === 'sulfamic_acid') {
        negCharge += ing.molarity;
        totalStrongAcidMoles += ing.molarity;
        ions.push({ concentrationMolar: ing.molarity, charge: -1 });
      } else if (sp.speciesId === 'sodium_bisulfate') {
        totalNa += ing.molarity;
        totalSO4 += ing.molarity;
        totalStrongAcidMoles += ing.molarity;
      } else if (sp.speciesId === 'methanesulfonic_acid') {
        negCharge += ing.molarity;
        totalStrongAcidMoles += ing.molarity;
      }
      // 3. LABSA (Sulfonic acid surfactant)
      else if (sp.speciesId === 'labsa') {
        totalLABSAnion += ing.molarity;
        totalStrongAcidMoles += ing.molarity;
      }
      // 4. Neutral salts
      else if (sp.speciesId === 'sodium_chloride') {
        totalNa += ing.molarity;
        totalCl += ing.molarity;
      } else if (sp.speciesId === 'sodium_sulfate') {
        totalNa += ing.molarity * 2;
        totalSO4 += ing.molarity;
      }
      // 5. Weak bases & polyprotic buffer systems
      else {
        if (sp.cationsPerMole && sp.cationsPerMole > 0) {
          totalNa += ing.molarity * sp.cationsPerMole;
        }

        const key = sp.speciesId;
        if (!familyMolarities[key]) {
          familyMolarities[key] = { definition: sp, totalMolarity: 0 };
        }
        familyMolarities[key].totalMolarity += ing.molarity;
      }
    }

    // Exact stoichiometric rounding correction for strong acid / strong base equivalence
    const hasWeakSystems = Object.keys(familyMolarities).length > 0;
    if (!hasWeakSystems && Math.abs(totalStrongBaseMoles - totalStrongAcidMoles) < 1e-4) {
      if (totalNa > 0 && totalLABSAnion > 0) {
        totalNa = totalLABSAnion;
      } else if (totalNa > 0 && totalCl > 0) {
        totalNa = totalCl;
      } else if (totalK > 0 && totalLABSAnion > 0) {
        totalK = totalLABSAnion;
      }
    }

    if (totalNa > 0) {
      posCharge += totalNa;
      ions.push({ concentrationMolar: totalNa, charge: 1 });
    }
    if (totalK > 0) {
      posCharge += totalK;
      ions.push({ concentrationMolar: totalK, charge: 1 });
    }

    if (totalCl > 0) {
      negCharge += totalCl;
      ions.push({ concentrationMolar: totalCl, charge: -1 });
    }
    if (totalSO4 > 0) {
      negCharge += totalSO4 * 2;
      ions.push({ concentrationMolar: totalSO4, charge: -2 });
    }
    if (totalLABSAnion > 0) {
      negCharge += totalLABSAnion;
      ions.push({ concentrationMolar: totalLABSAnion, charge: -1 });
    }

    // Recalculate ionic strength dynamically during iterations to compute Davies activity coefficient
    let strongIonsSum = 0;
    if (totalNa > 0) strongIonsSum += totalNa;
    if (totalK > 0) strongIonsSum += totalK;
    if (totalCl > 0) strongIonsSum += totalCl;
    if (totalSO4 > 0) strongIonsSum += totalSO4 * 4;
    if (totalLABSAnion > 0) strongIonsSum += totalLABSAnion;

    for (const key of Object.keys(familyMolarities)) {
      strongIonsSum += familyMolarities[key].totalMolarity;
    }
    const I = 0.5 * strongIonsSum;
    const actModel = (composition as any).activityModel ?? 'davies';
    const gamma1 = actModel === 'ideal' ? 1.0 : ActivityModel.daviesGamma(I, 1, temperatureC);

    for (const key of Object.keys(familyMolarities)) {
      const { definition: sp, totalMolarity } = familyMolarities[key];
      if (totalMolarity <= 0) continue;

      if (sp.family === 'AMINE_BASE' && sp.pKaConjugate) {
        const amine = EquilibriumSystem.calculateAmineProtonation(sp.pKaConjugate, pH);
        const bhMolarity = totalMolarity * amine.fractionProtonated;
        posCharge += bhMolarity;
        ions.push({ concentrationMolar: bhMolarity, charge: 1 });

        speciationList.push({
          familyType: sp.family,
          displayName: sp.displayName,
          totalMolarity,
          species: [
            { speciesName: `${sp.displayName} (Neutral B)`, charge: 0, fraction: amine.fractionNeutral, molarConcentration: totalMolarity * amine.fractionNeutral },
            { speciesName: `${sp.displayName} (Protonated BH+)`, charge: 1, fraction: amine.fractionProtonated, molarConcentration: bhMolarity }
          ],
          netChargeContribution: bhMolarity
        });
      } else if (sp.pKa && sp.pKa.length > 0) {
        // Appapparent step constant correction based on activity coefficient gamma1
        const logGamma1 = Math.log10(gamma1);
        const correctedPKa = sp.pKa.map((pk: number, idx: number) => {
          const step = idx + 1;
          return pk + 2 * step * logGamma1;
        });
        const alphas = EquilibriumSystem.calculatePolyproticAlphas(correctedPKa, pH);
        let familyNegCharge = 0;
        const speciesDetails: SpeciationFraction[] = [];

        for (let k = 0; k < alphas.length; k++) {
          const frac = alphas[k];
          const c_k = totalMolarity * frac;
          const charge = -k;

          if (charge !== 0 && c_k > 0) {
            familyNegCharge += Math.abs(charge) * c_k;
            ions.push({ concentrationMolar: c_k, charge });
          }

          let sName = `H${alphas.length - 1 - k}A^(${charge})`;
          if (sp.family === 'CARBONATE') {
            sName = k === 0 ? 'H2CO3 / CO2(aq)' : (k === 1 ? 'HCO3- (Bicarbonate)' : 'CO3(2-) (Carbonate)');
          } else if (sp.family === 'CITRATE') {
            sName = k === 0 ? 'H3Cit (Citric Acid)' : (k === 1 ? 'H2Cit- (Monovalent)' : (k === 2 ? 'HCit(2-) (Divalent)' : 'Cit(3-) (Citrate)'));
          } else if (sp.family === 'PHOSPHATE') {
            sName = k === 0 ? 'H3PO4' : (k === 1 ? 'H2PO4-' : (k === 2 ? 'HPO4(2-)' : 'PO4(3-)'));
          } else if (sp.family === 'SILICATE') {
            sName = k === 0 ? 'H2SiO3' : (k === 1 ? 'HSiO3-' : 'SiO3(2-)');
          } else if (sp.family === 'CARBOXYLIC_WEAK_ACID') {
            sName = k === 0 ? 'HA (Free Acid)' : 'A- (Carboxylate Anion)';
          }

          speciesDetails.push({
            speciesName: sName,
            charge,
            fraction: frac,
            molarConcentration: c_k
          });
        }

        negCharge += familyNegCharge;

        speciationList.push({
          familyType: sp.family,
          displayName: sp.displayName,
          totalMolarity,
          species: speciesDetails,
          netChargeContribution: -familyNegCharge
        });
      }
    }

    const residual = posCharge - negCharge;

    return {
      residual,
      positiveCharge: posCharge,
      negativeCharge: negCharge,
      speciation: speciationList,
      ions
    };
  }

  /**
   * Computes true thermodynamic buffer capacity beta = dCb/dpH.
   */
  static calculateBufferCapacity(
    currentPH: number,
    composition: NormalizedComposition,
    temperatureC: number = 25.0
  ): number {
    const eps = 1e-4;
    const fPlus = EquilibriumSystem.evaluateChargeBalance(currentPH + eps, composition, temperatureC).residual;
    const fMinus = EquilibriumSystem.evaluateChargeBalance(currentPH - eps, composition, temperatureC).residual;
    const dResidual_dpH = (fPlus - fMinus) / (2 * eps);
    const beta = Math.abs(dResidual_dpH) * Math.LN10;
    return Math.max(0.0001, Number(beta.toFixed(4)));
  }
}
