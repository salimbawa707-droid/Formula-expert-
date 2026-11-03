/**
 * ============================================================================
 * P2 — REGULATORY CANONICAL RULE REGISTRY (SSOT)
 * ============================================================================
 * Evidence-backed, verified statutory rule database for India, EU, US, and Global.
 *
 * Strict Forensic Controls:
 * - IS 869 false disinfectant mapping completely removed (IS 869 is Ethylene Dichloride).
 * - IS 7983 Succession Chain verified:
 *     IS 7983:1994 (First Revision, withdrawn 2026-09-12)
 *     IS 7983:2026 (Second Revision, notified 2026-03-16, effective 2026-03-12, CURRENT)
 * - IS 4955:2020 verified as FIFTH Revision (NOT Sixth) + Amendment 1 (June 2024).
 * - EU Detergent Regulation temporal framework:
 *     Regulation (EC) No 648/2004 (Repealed 2029-09-23; Article 36 transitional regime)
 *     Regulation (EU) 2026/405 (In force 2026-03-22, general application 2029-09-23)
 * - 5-Level Evidence Hierarchy enforced; zero AI-generated summaries.
 * ============================================================================
 */

import { RegulatoryRule } from './types';

export const CANONICAL_REGULATORY_RULES: RegulatoryRule[] = [
  // --------------------------------------------------------------------------
  // INDIA JURISDICTION RULES
  // --------------------------------------------------------------------------
  {
    ruleId: 'RULE_IND_BIS_STPP_PHOSPHATE',
    standardOrRegulationNumber: 'IS 4955:2020',
    jurisdiction: 'INDIA',
    authority: 'Bureau of Indian Standards (BIS)',
    regulationName: 'Household Laundry Detergent Powders — Specification (Fifth Revision, Amendment 1:2024)',
    regulationIdentifier: 'IS 4955:2020 Clause 5.2',
    version: '2020',
    revisionNumber: 'Fifth Revision',
    amendmentNumber: 'Amendment 1',
    amendmentYear: 2024,
    status: 'CURRENT',
    effectiveFrom: '2020-09-01',
    productCategories: ['LAUNDRY_POWDER'], // Strictly LAUNDRY_POWDER
    ingredientScope: ['STPP', 'Sodium Tripolyphosphate', 'Phosphate'],
    chemicalIdentifiers: {
      casNumbers: ['7758-29-4'],
      canonicalIds: ['sodium_tripolyphosphate', 'stpp']
    },
    concentrationThresholds: {
      maxPercentage: 2.5,
      unit: 'WEIGHT_PCT',
      basis: 'FORMULA_TOTAL',
      inclusive: true
    },
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'CRITICAL',
    requirementText: 'Phosphate (expressed as P2O5) in household laundry detergent powders shall not exceed 2.5% by mass of total phosphates to prevent aquatic eutrophication.',
    remediationGuidance: 'Replace STPP with eco-friendly builders such as Sodium Citrate, GLDA, MGDA, or Zeolite 4A.',
    sourceOrganization: 'Bureau of Indian Standards (BIS)',
    sourceURL: 'https://standardsbis.bsbedge.com/',
    evidenceId: 'EVID_IND_BIS_4955_2020_P2O5',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_STANDARDS_BODY',
    evidenceReference: 'IS 4955:2020 (Fifth Revision, incorporating Amendment No. 1 June 2024) Clause 5.2 Environmental Requirements',
    verifiedBy: 'BIS Technical Committee PCD 03 / Forensic Metrology Audit',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_IND_BIS_13080_LIQUID_DETERGENT',
    standardOrRegulationNumber: 'IS 13080:2021',
    jurisdiction: 'INDIA',
    authority: 'Bureau of Indian Standards (BIS)',
    regulationName: 'Liquid Detergents for Household Laundry Use — Specification (IS 13080:2021)',
    regulationIdentifier: 'IS 13080:2021 Clause 4.1',
    version: '2021',
    revisionNumber: 'First Revision',
    status: 'CURRENT',
    effectiveFrom: '2021-03-01',
    productCategories: ['LAUNDRY_LIQUID'], // Strictly LAUNDRY_LIQUID
    ingredientScope: ['Active Matter', 'Total Active Matter', 'Surfactant'],
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'HIGH',
    requirementText: 'Liquid detergents for household laundry use shall comply with minimum active matter thresholds and stability requirements under IS 13080.',
    remediationGuidance: 'Verify active surfactant concentration and formulation physical stability at ambient and cold storage conditions.',
    sourceOrganization: 'Bureau of Indian Standards (BIS)',
    sourceURL: 'https://standardsbis.bsbedge.com/',
    evidenceId: 'EVID_IND_BIS_13080_2021',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_STANDARDS_BODY',
    evidenceReference: 'IS 13080:2021 Clause 4.1 Specification for Liquid Detergents',
    verifiedBy: 'BIS Technical Committee PCD 03 / Forensic Metrology Audit',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_IND_BIS_7983_1994',
    standardOrRegulationNumber: 'IS 7983:1994',
    jurisdiction: 'INDIA',
    authority: 'Bureau of Indian Standards (BIS)',
    regulationName: 'Toilet Cleaner, Liquid — Specification (First Revision)',
    regulationIdentifier: 'IS 7983:1994',
    version: '1994',
    revisionNumber: 'First Revision',
    status: 'WITHDRAWN', // Officially withdrawn on 12 September 2026; superseded by IS 7983:2026
    effectiveFrom: '1994-04-01',
    withdrawalDate: '2026-09-12',
    supersededBy: 'IS 7983:2026',
    productCategories: ['TOILET_CLEANER'],
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'VOLUNTARY_PROGRAM',
    severity: 'HIGH',
    requirementText: 'IS 7983:1994 First Revision was withdrawn on 12 September 2026 and superseded by IS 7983:2026 Second Revision. Valid for historical audits prior to 12 September 2026.',
    remediationGuidance: 'Transition finished product certification to successor standard IS 7983:2026 Second Revision.',
    sourceOrganization: 'Bureau of Indian Standards (BIS)',
    sourceURL: 'https://standardsbis.bsbedge.com/',
    evidenceId: 'EVID_IND_BIS_7983_1994',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_STANDARDS_BODY',
    evidenceReference: 'Gazette of India Notification 16 March 2026 / BIS Withdrawal Notice 12 September 2026',
    verifiedBy: 'Bureau of Indian Standards (BIS) Chemical Department PCD 03',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_IND_BIS_7983_2025_UNVERIFIED',
    standardOrRegulationNumber: 'IS 7983:2025',
    jurisdiction: 'INDIA',
    authority: 'Bureau of Indian Standards (BIS)',
    regulationName: 'Unverified Citation — Liquid Toilet Cleaner (No Published Gazette Record in BIS Register)',
    regulationIdentifier: 'IS 7983:2025 (Unverified Citation)',
    version: '2025',
    revisionNumber: 'Unverified Citation',
    status: 'NOT_VERIFIED',
    effectiveFrom: '',
    productCategories: ['TOILET_CLEANER'],
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'VOLUNTARY_PROGRAM',
    severity: 'HIGH',
    requirementText: 'No published gazetted Indian Standard IS 7983:2025 exists in the Bureau of Indian Standards register. Status is NOT_VERIFIED; cannot infer draft, precursor, or superseded status without primary BIS evidence.',
    remediationGuidance: 'Reference verified Bureau of Indian Standards gazetted publication IS 7983:2026 Second Revision (effective 12 March 2026).',
    sourceOrganization: 'Bureau of Indian Standards (BIS)',
    sourceURL: 'https://standardsbis.bsbedge.com/',
    evidenceId: 'EVID_IND_BIS_7983_2025_UNVERIFIED',
    evidenceLevel: 5,
    evidenceType: 'UNVERIFIED_WEB_SOURCE',
    evidenceReference: 'Unverified — No published Gazette record in BIS Register; status is NOT_VERIFIED',
    verifiedBy: 'Bureau of Indian Standards (BIS) Registry Audit',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'NOT_VERIFIED'
  },
  {
    ruleId: 'RULE_IND_BIS_7983_TOILET_CLEANER',
    standardOrRegulationNumber: 'IS 7983:2026',
    jurisdiction: 'INDIA',
    authority: 'Bureau of Indian Standards (BIS)',
    regulationName: 'Liquid Toilet Cleaner — Hydrochloric Acid Based — Specification (Second Revision)',
    regulationIdentifier: 'IS 7983:2026 Clause 4',
    version: '2026',
    revisionNumber: 'Second Revision',
    status: 'CURRENT', // Effective 12 March 2026; sole active standard post 12 September 2026
    effectiveFrom: '2026-03-12',
    supersedes: 'IS 7983:1994',
    productCategories: ['TOILET_CLEANER'],
    ingredientScope: ['Hydrochloric Acid', 'HCl', 'Acid Total'],
    chemicalIdentifiers: {
      casNumbers: ['7647-01-0'],
      canonicalIds: ['hydrochloric_acid', 'muriatic_acid']
    },
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'VOLUNTARY_PROGRAM',
    severity: 'HIGH',
    requirementText: 'Hydrochloric acid based liquid toilet cleaners shall comply with active acidity (as HCl), viscosity, and performance specifications per IS 7983:2026 Second Revision.',
    remediationGuidance: 'Formulate with hydrochloric acid within specified acidity range, acid-stable surfactant thickener, and corrosion inhibitors.',
    sourceOrganization: 'Bureau of Indian Standards (BIS)',
    sourceURL: 'https://standardsbis.bsbedge.com/',
    evidenceId: 'EVID_IND_BIS_7983_2026',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_STANDARDS_BODY',
    evidenceReference: 'Gazette of India Notification 16 March 2026 (Effective 12 March 2026) IS 7983:2026 Second Revision',
    verifiedBy: 'Bureau of Indian Standards (BIS) Chemical Department PCD 03',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_IND_METROLOGY_DECLARATION',
    standardOrRegulationNumber: 'Legal Metrology (Packaged Commodities) Rules 2011',
    jurisdiction: 'INDIA',
    authority: 'Department of Legal Metrology',
    regulationName: 'Legal Metrology (Packaged Commodities) Rules 2011 — Mandatory Packaged Commodity Declarations',
    regulationIdentifier: 'G.S.R. 426(E) Rule 6',
    version: '2011-03',
    status: 'CURRENT',
    effectiveFrom: '2011-04-01',
    productCategories: ['ALL_CLEANERS'],
    requirementType: 'LABEL_REQUIRED',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'HIGH',
    requirementText: 'Pre-packaged retail commodities must display Net Quantity, Maximum Retail Price (MRP incl. taxes), Consumer Care Contact, and Manufacturer/Packer Address.',
    remediationGuidance: 'Ensure all 4 statutory Legal Metrology declarations are legibly printed on the consumer packaging label.',
    sourceOrganization: 'Department of Consumer Affairs, Government of India',
    sourceURL: 'https://consumeraffairs.nic.in/legal-metrology',
    evidenceId: 'EVID_IND_LEGAL_METROLOGY_2011',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'G.S.R. 426(E) as amended',
    verifiedBy: 'Department of Consumer Affairs Legal Register',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },

  // --------------------------------------------------------------------------
  // EUROPEAN UNION JURISDICTION RULES
  // --------------------------------------------------------------------------
  {
    ruleId: 'RULE_EU_DETERGENT_PHOSPHATE_BAN',
    standardOrRegulationNumber: 'Regulation (EC) No 648/2004 / Regulation (EU) No 259/2012',
    jurisdiction: 'EU',
    authority: 'European Chemicals Agency (ECHA) / European Commission',
    regulationName: 'Detergents Regulation (EC) No 648/2004 amended by (EU) No 259/2012',
    regulationIdentifier: 'Regulation (EU) No 259/2012 Annex VIa',
    version: '2012-03',
    status: 'CURRENT', // Applicable for ordinary compliance before 2029-09-23; repealed from 2029-09-23 subject to Art 36
    effectiveFrom: '2013-06-30',
    entryIntoForceDate: '2004-04-20',
    applicationDate: '2005-10-08',
    repealDate: '2029-09-23',
    supersededBy: 'Regulation (EU) 2026/405',
    transitionalProvisions: 'Article 36: Grandfathered stock placed on market before 2029-09-23 may continue indefinitely; stock placed between 2029-09-23 and 2030-09-23 sellable until 2030-09-23.',
    productCategories: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_AUTOMATIC'],
    ingredientScope: ['STPP', 'Sodium Tripolyphosphate', 'Phosphate'],
    chemicalIdentifiers: {
      casNumbers: ['7758-29-4', '10101-89-0'],
      canonicalIds: ['sodium_tripolyphosphate', 'stpp']
    },
    concentrationThresholds: {
      maxPercentage: 0.5,
      unit: 'G_PER_DOSAGE',
      basis: 'FINISHED_PRODUCT',
      inclusive: false
    },
    requirementType: 'PROHIBITED',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'CRITICAL',
    requirementText: 'Consumer laundry detergents placed on the EU market shall not contain total phosphorus >= 0.5 grams per standard washing machine dose (under Regulation (EC) No 648/2004 framework).',
    remediationGuidance: 'Completely eliminate inorganic sodium tripolyphosphate (STPP) from EU consumer laundry formulas.',
    sourceOrganization: 'Publications Office of the European Union (EUR-Lex)',
    sourceURL: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02004R0648-20150601',
    evidenceId: 'EVID_EU_REG_259_2012',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'Regulation (EU) No 259/2012 Annex VIa',
    verifiedBy: 'EUR-Lex Official Journal of the European Union',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_EU_REG_2026_405_DETERGENTS',
    standardOrRegulationNumber: 'Regulation (EU) 2026/405',
    jurisdiction: 'EU',
    authority: 'European Parliament and Council of the European Union',
    regulationName: 'Regulation (EU) 2026/405 on Detergents and Surfactants',
    regulationIdentifier: 'Regulation (EU) 2026/405',
    version: '2026-02',
    status: 'IN_FORCE_BUT_NOT_YET_GENERALLY_APPLICABLE', // In force 2026-03-22; general application 2029-09-23
    effectiveFrom: '2029-09-23',
    entryIntoForceDate: '2026-03-22',
    applicationDate: '2029-09-23',
    supersedes: 'Regulation (EC) No 648/2004',
    transitionalProvisions: 'Article 36 transitional regime applies for products compliant with 648/2004.',
    productCategories: ['ALL_CLEANERS'],
    requirementType: 'DOCUMENTATION_REQUIRED',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'HIGH',
    requirementText: 'Regulation (EU) 2026/405 repeals and modernizes Regulation (EC) No 648/2004, introducing Digital Product Passports (DPP), updated surfactant biodegradability criteria, and streamlined digital labelling. In force from 22 March 2026; generally applicable from 23 September 2029.',
    remediationGuidance: 'Prepare formulation technical dossier for Digital Product Passport (DPP) integration and verify surfactant ultimate biodegradation data under OECD 301.',
    sourceOrganization: 'Publications Office of the European Union (EUR-Lex)',
    sourceURL: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R0405',
    evidenceId: 'EVID_EU_REG_2026_405',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'Official Journal of the European Union Regulation (EU) 2026/405 (Document date 2026-02-11)',
    verifiedBy: 'European Commission DG GROW / EUR-Lex Official Journal',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_EU_REACH_NPE_BAN',
    standardOrRegulationNumber: 'Regulation (EC) No 1907/2006 (REACH) Annex XVII Entry 46',
    jurisdiction: 'EU',
    authority: 'European Chemicals Agency (ECHA)',
    regulationName: 'EU REACH Regulation (EC) No 1907/2006 Annex XVII Entry 46',
    regulationIdentifier: 'REACH Annex XVII Entry 46a',
    version: '2016-01',
    status: 'CURRENT',
    effectiveFrom: '2021-02-03',
    productCategories: ['ALL_CLEANERS'],
    ingredientScope: ['Nonylphenol Ethoxylate', 'NPE', 'NPE-9', 'Nonylphenol'],
    chemicalIdentifiers: {
      casNumbers: ['9016-45-9', '26027-38-3', '25154-52-3'],
      canonicalIds: ['npe_9', 'nonylphenol_ethoxylate']
    },
    concentrationThresholds: {
      maxPercentage: 0.1,
      unit: 'WEIGHT_PCT',
      basis: 'FORMULA_TOTAL',
      inclusive: false
    },
    requirementType: 'PROHIBITED',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'CRITICAL',
    requirementText: 'Nonylphenol ethoxylates (NPE) shall not be placed on the EU market in cleaning products in concentrations equal to or greater than 0.1% by weight.',
    remediationGuidance: 'Substitute NPE-9 with eco-friendly Alcohol Ethoxylates (e.g. C12-14 Pareth-7) or Alkyl Polyglucosides (APG 0810).',
    sourceOrganization: 'European Chemicals Agency (ECHA)',
    sourceURL: 'https://echa.europa.eu/substances-restricted-under-reach',
    evidenceId: 'EVID_EU_REACH_NPE_ENTRY46',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'REACH Annex XVII Entry 46a (Commission Regulation (EU) 2016/26)',
    verifiedBy: 'ECHA Restricted Substances Register',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_EU_CLP_UFI_REQUIREMENT',
    standardOrRegulationNumber: 'Regulation (EC) No 1272/2008 (CLP) Annex VIII',
    jurisdiction: 'EU',
    authority: 'ECHA Poison Centres',
    regulationName: 'CLP Regulation (EC) No 1272/2008 Annex VIII — Unique Formula Identifier',
    regulationIdentifier: 'CLP Annex VIII Article 45',
    version: '2021-01',
    status: 'CURRENT',
    effectiveFrom: '2021-01-01',
    productCategories: ['ALL_CLEANERS'],
    requirementType: 'UFI_REQUIRED',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'HIGH',
    requirementText: 'Consumer chemical mixtures classified as health or physical hazards placed on the EU market must carry a 16-character Unique Formula Identifier (UFI) code on the label.',
    remediationGuidance: 'Generate a 16-character UFI code via ECHA Generator and print it legibly on the primary product label.',
    sourceOrganization: 'European Chemicals Agency (ECHA)',
    sourceURL: 'https://poisoncentres.echa.europa.eu/',
    evidenceId: 'EVID_EU_CLP_ANNEX_VIII_UFI',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'CLP Annex VIII (Commission Regulation (EU) 2017/542)',
    verifiedBy: 'ECHA Poison Centres Authority',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },

  // --------------------------------------------------------------------------
  // UNITED STATES JURISDICTION RULES
  // --------------------------------------------------------------------------
  {
    ruleId: 'RULE_US_CARB_LAUNDRY_VOC',
    standardOrRegulationNumber: '17 CCR § 94509(a)',
    jurisdiction: 'US_CARB',
    authority: 'California Air Resources Board (CARB)',
    regulationName: 'California Consumer Products VOC Regulation',
    regulationIdentifier: '17 CCR § 94509(a)',
    version: '2023-01',
    status: 'CURRENT',
    effectiveFrom: '2023-01-01',
    productCategories: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER'],
    ingredientScope: ['Ethanol', 'Isopropyl Alcohol', 'Acetone', 'Volatile Solvents'],
    chemicalIdentifiers: {
      casNumbers: ['64-17-5', '67-63-0', '67-64-1']
    },
    concentrationThresholds: {
      maxPercentage: 8.0,
      unit: 'WEIGHT_PCT',
      basis: 'FORMULA_TOTAL',
      inclusive: true
    },
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'HIGH',
    requirementText: 'Consumer liquid laundry detergents sold in California shall not exceed 8.0% volatile organic compounds (VOC) by weight.',
    remediationGuidance: 'Reduce short-chain alcohol solvents or substitute with exempt bio-glycols (Glycerin, Propanediol).',
    sourceOrganization: 'California Air Resources Board',
    sourceURL: 'https://ww2.arb.ca.gov/our-work/programs/consumer-products',
    evidenceId: 'EVID_US_CARB_17CCR94509',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'California Code of Regulations Title 17 Section 94509',
    verifiedBy: 'State of California Office of Administrative Law',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_US_NY_STATE_14_DIOXANE',
    standardOrRegulationNumber: 'NY ECL § 37-0117',
    jurisdiction: 'US_STATE_NY',
    authority: 'New York Department of Environmental Conservation',
    regulationName: 'New York Environmental Conservation Law § 37-0117',
    regulationIdentifier: 'ECL § 37-0117',
    version: '2022-12',
    status: 'CURRENT',
    effectiveFrom: '2022-12-31',
    productCategories: ['LAUNDRY_LIQUID', 'LAUNDRY_POWDER', 'DISHWASH_MANUAL', 'FLOOR_CLEANER'],
    ingredientScope: ['SLES', 'Sodium Laureth Sulfate', 'Ethoxylated Surfactants'],
    chemicalIdentifiers: {
      casNumbers: ['68585-34-2', '9004-82-4', '123-91-1'],
      canonicalIds: ['sles_28', 'sles_70', '1_4_dioxane']
    },
    concentrationThresholds: {
      maxPercentage: 0.0001, // 1 ppm
      unit: 'PPM',
      basis: 'FINISHED_PRODUCT',
      inclusive: true
    },
    requirementType: 'CONCENTRATION_LIMIT',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'CRITICAL',
    requirementText: 'No household cleansing product shall be distributed or sold in New York State if it contains 1,4-dioxane in excess of 1 ppm (part per million).',
    remediationGuidance: 'Use vacuum-stripped low-dioxane SLES grades (< 5 ppm in raw material) or non-ethoxylated APG surfactants.',
    sourceOrganization: 'New York Department of Environmental Conservation',
    sourceURL: 'https://www.dec.ny.gov/chemical/121658.html',
    evidenceId: 'EVID_US_NY_ECL_37_0117',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_OFFICIAL_LEGISLATION',
    evidenceReference: 'New York Environmental Conservation Law Article 37 Section 37-0117',
    verifiedBy: 'New York State Legislature and DEC',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },
  {
    ruleId: 'RULE_US_EPA_SAFER_CHOICE_VOLUNTARY',
    standardOrRegulationNumber: 'EPA Safer Choice Master Criteria Section 3',
    jurisdiction: 'US_FEDERAL',
    authority: 'US Environmental Protection Agency (EPA)',
    regulationName: 'EPA Safer Choice Standard for Cleaning Products (Voluntary Program)',
    regulationIdentifier: 'EPA Safer Choice Master Criteria Section 3',
    version: '2020-05',
    status: 'CURRENT',
    effectiveFrom: '2020-05-01',
    productCategories: ['ALL_CLEANERS'],
    requirementType: 'VOLUNTARY_CERTIFICATION',
    mandatoryOrVoluntary: 'VOLUNTARY_PROGRAM',
    severity: 'INFORMATIONAL',
    requirementText: 'Voluntary ecolabel certification requiring all surfactant ingredients to meet rapid biodegradation (OECD 301) and low aquatic toxicity thresholds.',
    remediationGuidance: 'Voluntary program for eco-brand recognition. Not a mandatory legal compliance gate.',
    sourceOrganization: 'US Environmental Protection Agency',
    sourceURL: 'https://www.epa.gov/saferchoice/standard',
    evidenceId: 'EVID_US_EPA_SAFER_CHOICE_VOLUNTARY',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_STANDARDS_BODY',
    evidenceReference: 'EPA Safer Choice Standard Revision 2020',
    verifiedBy: 'EPA Safer Choice Program Office',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  },

  // --------------------------------------------------------------------------
  // GLOBAL UN GHS BASELINE RULES
  // --------------------------------------------------------------------------
  {
    ruleId: 'RULE_GLOBAL_GHS_CORROSIVE_PH',
    standardOrRegulationNumber: 'UN GHS Rev 9 Chapter 3.2.2.4',
    jurisdiction: 'GLOBAL_UN_GHS',
    authority: 'United Nations Sub-Committee on GHS',
    regulationName: 'UN Globally Harmonized System of Classification and Labelling of Chemicals (Rev 9)',
    regulationIdentifier: 'UN GHS Rev 9 Chapter 3.2.2.4',
    version: 'Rev 9',
    status: 'CURRENT',
    effectiveFrom: '2021-07-01',
    productCategories: ['ALL_CLEANERS'],
    requirementType: 'LABEL_REQUIRED',
    mandatoryOrVoluntary: 'MANDATORY',
    severity: 'CRITICAL',
    requirementText: 'Formulations with pH <= 2.0 or pH >= 11.5 are presumed corrosive to skin (Category 1) without testing, requiring GHS05 Corrosion pictogram and DANGER signal word.',
    remediationGuidance: 'Buffer formulation pH between 4.0 and 10.0 to prevent Category 1 skin/eye corrosion classification.',
    sourceOrganization: 'United Nations Economic Commission for Europe (UNECE)',
    sourceURL: 'https://unece.org/transport/dangerous-goods/un-ghs-rev9-2021',
    evidenceId: 'EVID_GLOBAL_UN_GHS_REV9_PH',
    evidenceLevel: 1,
    evidenceType: 'PRIMARY_STANDARDS_BODY',
    evidenceReference: 'ST/SG/AC.10/30/Rev.9 Chapter 3.2',
    verifiedBy: 'UN Sub-Committee of Experts on the GHS',
    lastVerifiedAt: '2026-10-07',
    verificationStatus: 'VERIFIED_PRIMARY_SOURCE'
  }
];

export class RegulatoryRuleRegistryEngine {
  public static getRulesForJurisdiction(jurisdiction: string): RegulatoryRule[] {
    return CANONICAL_REGULATORY_RULES.filter(
      r => r.jurisdiction === jurisdiction || r.jurisdiction === 'GLOBAL_UN_GHS'
    );
  }

  public static getAllRules(): RegulatoryRule[] {
    return CANONICAL_REGULATORY_RULES;
  }
}
