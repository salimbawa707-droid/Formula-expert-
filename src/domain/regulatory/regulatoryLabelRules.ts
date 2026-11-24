/**
 * ============================================================================
 * P2 — LABEL COMPLIANCE CHECKLIST ENGINE
 * ============================================================================
 * Evaluates mandatory packaging label requirements per jurisdiction.
 * Output: PASS, FAIL, MISSING, NOT_APPLICABLE, REVIEW_REQUIRED.
 * ============================================================================
 */

import { LabelCheckItem, LabelComplianceReport, RegulatoryJurisdictionId } from './types';
import { EvaluatedChemicalIngredient } from './regulatoryIngredientRules';

export class LabelComplianceEngine {
  public static evaluateLabelRequirements(
    jurisdiction: RegulatoryJurisdictionId,
    _ingredients: EvaluatedChemicalIngredient[],
    signalWord: 'DANGER' | 'WARNING' | 'NONE' | 'UNDETERMINED',
    packageSizeGramsOrMl?: number
  ): LabelComplianceReport {
    const checklist: LabelCheckItem[] = [];
    const missingMandatoryFields: string[] = [];

    // 1. Product Identity
    checklist.push({
      itemId: 'LBL_PROD_IDENTITY',
      section: 'PRODUCT_IDENTITY',
      title: 'Canonical Product Title & Functional Category',
      status: 'REVIEW_REQUIRED',
      requirementText: 'Primary label display panel must state the true nature and function of the cleaning product.',
      message: 'Formula category is not a rendered label artifact; verify the actual pack artwork and legal product description.'
    });

    // 2. Net Quantity
    if (packageSizeGramsOrMl && packageSizeGramsOrMl > 0) {
      checklist.push({
        itemId: 'LBL_NET_QTY',
        section: 'NET_QUANTITY',
        title: 'Net Mass / Volume Declaration',
        status: 'REVIEW_REQUIRED',
        requirementText: 'Net contents declared in metric units (g, kg, mL, L).',
        message: `Target net quantity ${packageSizeGramsOrMl} g/mL supplied; verify that the approved value appears correctly on final artwork and meets metrology requirements.`
      });
    } else {
      checklist.push({
        itemId: 'LBL_NET_QTY',
        section: 'NET_QUANTITY',
        title: 'Net Mass / Volume Declaration',
        status: 'MISSING',
        requirementText: 'Net contents declaration is mandatory on consumer retail packaging.',
        message: 'Package size / net quantity is missing. Specified net contents required.'
      });
      missingMandatoryFields.push('Net Quantity Declaration');
    }

    // 3. India Legal Metrology Declarations
    if (jurisdiction === 'INDIA') {
      checklist.push({
        itemId: 'LBL_IND_LEGAL_METROLOGY_MRP',
        section: 'METROLOGY_MRP',
        title: 'Maximum Retail Price (MRP incl. taxes)',
        status: 'REVIEW_REQUIRED',
        requirementText: 'Maximum Retail Price (MRP) in INR inclusive of all taxes must be printed on the retail pack.',
        message: 'MRP declaration template present; final pricing verification required prior to printing.'
      });
      checklist.push({
        itemId: 'LBL_IND_LEGAL_METROLOGY_MFR',
        section: 'MANUFACTURER_LEGAL',
        title: 'Manufacturer / Packer Legal Identity & Consumer Care',
        status: 'REVIEW_REQUIRED',
        requirementText: 'Name, complete address of manufacturer/packer, and consumer care phone/email required by Legal Metrology Rules 2011.',
        message: 'Manufacturer & consumer care details must be verified.'
      });
    }

    // 4. GHS Hazard Labeling
    if (signalWord === 'DANGER' || signalWord === 'WARNING') {
      checklist.push({
        itemId: 'LBL_GHS_HAZARD',
        section: 'GHS_HAZARDS',
        title: 'GHS Hazard Signal Word & Pictograms',
        status: 'REVIEW_REQUIRED',
        requirementText: `Screening indicates a potential hazardous classification (${signalWord}); applicable pictograms and statements must be confirmed from a complete mixture classification.`,
        message: 'A signal word alone is not a completed GHS label review; verify mixture classification and final artwork.'
      });
    } else {
      checklist.push({
        itemId: 'LBL_GHS_HAZARD',
        section: 'GHS_HAZARDS',
        title: 'GHS Hazard Signal Word & Pictograms',
        status: 'REVIEW_REQUIRED',
        requirementText: 'GHS hazard classification must be completed before deciding whether hazard pictograms are not applicable.',
        message: 'No signal word was produced by the limited screening engine; this is not proof that the mixture is non-hazardous.'
      });
    }

    // 5. EU UFI Unique Formula Identifier
    if (jurisdiction === 'EU') {
      if (signalWord === 'DANGER' || signalWord === 'WARNING') {
        checklist.push({
          itemId: 'LBL_EU_UFI_CODE',
          section: 'GHS_HAZARDS',
          title: 'EU Unique Formula Identifier (UFI Code)',
          status: 'MISSING',
          requirementText: 'Hazardous consumer mixture in EU must display a 16-character UFI code generated via ECHA.',
          message: 'A hazardous mixture signal is present, but no UFI value was supplied for final label verification.'
        });
        missingMandatoryFields.push('EU UFI Code');
      } else {
        checklist.push({
          itemId: 'LBL_EU_UFI_CODE',
          section: 'GHS_HAZARDS',
          title: 'EU Unique Formula Identifier (UFI Code)',
          status: 'REVIEW_REQUIRED',
          requirementText: 'UFI applicability depends on a complete CLP mixture hazard classification and product/use scope.',
          message: 'UFI applicability is undetermined because this engine has not completed a verified CLP mixture classification. Do not assume UFI is not required.'
        });
      }
    }

    const hasUnverifiedLabelItems = checklist.some(item => item.status === 'REVIEW_REQUIRED');
    const overallLabelStatus = missingMandatoryFields.length > 0 ? 'FAIL' : hasUnverifiedLabelItems ? 'REVIEW_REQUIRED' : 'PASS';

    return {
      overallLabelStatus,
      checkList: checklist,
      missingMandatoryFields
    };
  }
}
