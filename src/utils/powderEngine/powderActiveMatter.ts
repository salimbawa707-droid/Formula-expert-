import { ClassifiedIngredient, PowderActiveMatterReport } from './types';

export function calculatePowderActiveMatter(classifiedIngredients: ClassifiedIngredient[]): PowderActiveMatterReport {
  let anionicActive = 0;
  let nonionicActive = 0;
  let amphotericActive = 0;
  let cationicActive = 0;
  
  const unresolvedIngredients: string[] = [];
  const breakdown: PowderActiveMatterReport['breakdown'] = [];

  classifiedIngredients.forEach((ing) => {
    if (!ing.isSurfactant) return;

    const inputPct = ing.inputPercentage;
    const gradePct = ing.activeMatterPct;

    if (gradePct === undefined || gradePct === null || isNaN(gradePct) || gradePct <= 0) {
      unresolvedIngredients.push(ing.name);
      return;
    }

    const activeContribution = Number(((inputPct * gradePct) / 100).toFixed(4));

    if (ing.functionalClass === 'Anionic Surfactant') {
      anionicActive += activeContribution;
    } else if (ing.functionalClass === 'Nonionic Surfactant') {
      nonionicActive += activeContribution;
    } else if (ing.functionalClass === 'Amphoteric Surfactant') {
      amphotericActive += activeContribution;
    } else if (ing.functionalClass === 'Cationic Surfactant') {
      cationicActive += activeContribution;
    }

    breakdown.push({
      name: ing.name,
      inputPct: Number(inputPct.toFixed(2)),
      gradePct: Number(gradePct.toFixed(1)),
      activeContributionPct: Number(activeContribution.toFixed(2)),
      calculationBasis: `${inputPct.toFixed(2)}% as-is × ${gradePct.toFixed(1)}% active grade = ${activeContribution.toFixed(2)}% 100%-active`,
      functionalClass: ing.functionalClass
    });
  });

  const totalSurfactantActive = anionicActive + nonionicActive + amphotericActive + cationicActive;
  const hasInsufficientData = unresolvedIngredients.length > 0;

  return {
    totalSurfactantActivePct: Number(totalSurfactantActive.toFixed(2)),
    anionicActivePct: Number(anionicActive.toFixed(2)),
    nonionicActivePct: Number(nonionicActive.toFixed(2)),
    amphotericActivePct: Number(amphotericActive.toFixed(2)),
    cationicActivePct: Number(cationicActive.toFixed(2)),
    hasInsufficientData,
    unresolvedIngredients,
    breakdown,
    source: hasInsufficientData ? 'INSUFFICIENT_DATA' : 'CALCULATED'
  };
}
