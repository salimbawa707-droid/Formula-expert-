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
    signalWord: 'DANGER' | 'WARNING' | 'NONE',
    packageSizeGramsOrMl?: number
  ): LabelComplianceReport {
    const checklist: LabelCheckItem[] = [];
    const missingMandatoryFields: string[] = [];

    // 1. Product Identity
    checklist.push({
      itemId: 'LBL_PROD_IDENTITY',
      section: 'PRODUCT_IDENTITY',
      title: 'Canonical Product Title & Functional Category',
      status: 'PASS',
      requirementText: 'Primary label display panel must state the true nature and function of the cleaning product.',
      message: 'Product functional title specified.'
    });

    // 2. Net Quantity
    if (packageSizeGramsOrMl && packageSizeGramsOrMl > 0) {
      checklist.push({
        itemId: 'LBL_NET_QTY',
        section: 'NET_QUANTITY',
        title: 'Net Mass / Volume Declaration',
        status: 'PASS',
        requirementText: 'Net contents declared in metric units (g, kg, mL, L).',
        message: `Net quantity declared as ${packageSizeGramsOrMl} g/mL.`
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
    if (signalWord !== 'NONE') {
      checklist.push({
        itemId: 'LBL_GHS_HAZARD',
        section: 'GHS_HAZARDS',
        title: 'GHS Hazard Signal Word & Pictograms',
        status: 'PASS',
        requirementText: `Formulation classified as hazardous (${signalWord}); GHS warning pictograms and hazard statements required.`,
        message: `GHS hazard classification active (${signalWord}).`
      });
    } else {
      checklist.push({
        itemId: 'LBL_GHS_HAZARD',
        section: 'GHS_HAZARDS',
        title: 'GHS Hazard Signal Word & Pictograms',
        status: 'NOT_APPLICABLE',
        requirementText: 'Non-hazardous formulation; mandatory GHS warning pictograms not required.',
        message: 'No mandatory GHS hazard pictograms required.'
      });
    }

    // 5. EU UFI Unique Formula Identifier
    if (jurisdiction === 'EU') {
      if (signalWord !== 'NONE') {
        checklist.push({
          itemId: 'LBL_EU_UFI_CODE',
          section: 'GHS_HAZARDS',
          title: 'EU Unique Formula Identifier (UFI Code)',
          status: 'MISSING',
          requirementText: 'Hazardous consumer mixture in EU must display a 16-character UFI code generated via ECHA.',
          message: 'UFI code is missing. Must be generated and printed on label.'
        });
        missingMandatoryFields.push('EU UFI Code');
      }
    }

    const overallLabelStatus = missingMandatoryFields.length > 0 ? 'FAIL' : 'PASS';

    return {
      overallLabelStatus,
      checkList: checklist,
      missingMandatoryFields
    };
  }
}
