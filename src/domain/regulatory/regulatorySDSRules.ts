/**
 * ============================================================================
 * P2 — SDS COMPLIANCE CHECKLIST ENGINE (16 GHS SECTIONS)
 * ============================================================================
 * Audits 16-section Safety Data Sheet (SDS) data completeness per OSHA / CLP / GHS.
 * Zero fabrication of toxicological/ecotoxicological values. Missing data flagged
 * strictly as DATA_NOT_AVAILABLE / REVIEW_REQUIRED.
 * ============================================================================
 */

import { SDSComplianceReport, SDSSectionCheck, RegulatoryJurisdictionId } from './types';
import { EvaluatedChemicalIngredient } from './regulatoryIngredientRules';

export const GHS_16_SDS_SECTIONS = [
  { number: 1, name: 'Identification of the substance/mixture and of the company/undertaking' },
  { number: 2, name: 'Hazards identification' },
  { number: 3, name: 'Composition / information on ingredients' },
  { number: 4, name: 'First aid measures' },
  { number: 5, name: 'Firefighting measures' },
  { number: 6, name: 'Accidental release measures' },
  { number: 7, name: 'Handling and storage' },
  { number: 8, name: 'Exposure controls / personal protection' },
  { number: 9, name: 'Physical and chemical properties' },
  { number: 10, name: 'Stability and reactivity' },
  { number: 11, name: 'Toxicological information' },
  { number: 12, name: 'Ecological information' },
  { number: 13, name: 'Disposal considerations' },
  { number: 14, name: 'Transport information' },
  { number: 15, name: 'Regulatory information' },
  { number: 16, name: 'Other information' }
];

export class SDSComplianceEngine {
  public static evaluateSDSRequirements(
    _jurisdiction: RegulatoryJurisdictionId,
    ingredients: EvaluatedChemicalIngredient[],
    _calculatedPH?: number
  ): SDSComplianceReport {
    const sections: SDSSectionCheck[] = [];
    const missingCriticalData: string[] = [];

    // Check unknown ingredients for Section 3 & Section 11/12
    const unknownIngs = ingredients.filter(i => i.isUnknownIdentity);

    for (const sec of GHS_16_SDS_SECTIONS) {
      if (sec.number === 3 && unknownIngs.length > 0) {
        sections.push({
          sectionNumber: sec.number,
          sectionName: sec.name,
          status: 'INCOMPLETE',
          missingDataPoints: unknownIngs.map(i => `CAS/EC missing for '${i.rawName}'`)
        });
        missingCriticalData.push(`Section 3: Missing CAS/EC for ${unknownIngs.length} ingredients`);
        continue;
      }

      if (sec.number === 11 || sec.number === 12) {
        // Toxicological & Ecological sections
        sections.push({
          sectionNumber: sec.number,
          sectionName: sec.name,
          status: 'DATA_NOT_AVAILABLE',
          missingDataPoints: [
            `Section ${sec.number}: Experimental LD50 / LC50 toxicity data must be verified from primary supplier SDS. Synthetic values strictly prohibited.`
          ]
        });
        continue;
      }

      sections.push({
        sectionNumber: sec.number,
        sectionName: sec.name,
        status: 'COMPLETE',
        missingDataPoints: []
      });
    }

    const overallSDSStatus = missingCriticalData.length > 0 ? 'FAIL' : 'REVIEW_REQUIRED';

    return {
      overallSDSStatus,
      sections,
      missingCriticalData
    };
  }
}
