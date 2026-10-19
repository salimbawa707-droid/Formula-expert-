export type ValidationSourceType =
  | 'OPEN_SOURCE_REPOSITORY'
  | 'OFFICIAL_API_DOCUMENTATION'
  | 'OFFICIAL_STANDARD'
  | 'OFFICIAL_LAB_DIRECTORY'
  | 'TEST_GUIDELINE';

export type SourceUseStatus =
  | 'REFERENCE_ONLY'
  | 'METHOD_METADATA_ONLY'
  | 'INTEGRATION_PRESENT'
  | 'EXPERT_REVIEW_REQUIRED';

export interface ValidationSourceRecord {
  id: string;
  name: string;
  url: string;
  sourceType: ValidationSourceType;
  licenseOrAccess: string;
  versionOrDate: string;
  relevantUse: string;
  limitations: string[];
  verificationDate: string;
  status: SourceUseStatus;
}

/**
 * Curated discovery and method metadata only. A source entry never proves that
 * a finished formula passed testing. Standard text and acceptance limits must
 * be entered only from an authorized, reviewed copy of the applicable method.
 */
export const LAB_VALIDATION_SOURCES: ValidationSourceRecord[] = [
  {
    id: 'SRC-ISO-4316', name: 'ISO 4316 pH of aqueous solutions of surface-active agents',
    url: 'https://www.iso.org/standard/5350.html', sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted standard; use an authorized copy.', versionOrDate: '1977; current status requires confirmation before use.',
    relevantUse: 'Potential pH method reference for aqueous detergent solutions after applicability review.',
    limitations: ['Does not establish product acceptance limits. Confirm latest status and exact scope.'], verificationDate: '2026-10-19', status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-ASTM-D1172', name: 'ASTM D1172 pH of aqueous solutions of soaps and detergents',
    url: 'https://store.astm.org/d1172-15r24.html', sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted standard; use an authorized copy.', versionOrDate: 'D1172-15(2024), active listing checked 2026-10-19.',
    relevantUse: 'Potential pH method reference for detergent aqueous solutions.',
    limitations: ['Method conditions and product specification must be reviewed; no universal pH limit.'], verificationDate: '2026-10-19', status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-ISO-2271', name: 'ISO 2271 anionic-active matter direct two-phase titration',
    url: 'https://www.iso.org/standard/7094.html', sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted standard; use an authorized copy.', versionOrDate: '1989; current listing under review as checked 2026-10-19.',
    relevantUse: 'Potential manual/mechanical direct two-phase method for applicable anionic active matter.',
    limitations: ['Not a total-active method for all surfactants; check current status and scope.'], verificationDate: '2026-10-19', status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-ASTM-D1681', name: 'ASTM D1681 synthetic anionic active by cationic titration',
    url: 'https://store.astm.org/d1681-92r97.html', sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted standard; use an authorized copy.', versionOrDate: 'D1681-92(1997) listing checked 2026-10-19.',
    relevantUse: 'Potential titration reference for applicable synthetic anionic actives.',
    limitations: ['Old edition listing; verify current status, applicability and scope before use.'], verificationDate: '2026-10-19', status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-ASTM-D2024', name: 'ASTM D2024 cloud point of nonionic surfactants',
    url: 'https://store.astm.org/products-services/standards-and-publications/standards/soap-standards-and-polish-standards.html', sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted standard; use an authorized copy.', versionOrDate: 'Current catalog checked 2026-10-19.',
    relevantUse: 'Cloud-point measurement for nonionic surfactants only; included to document and prevent the previous chelation misreference.',
    limitations: ['Not a chelation-capacity method.'], verificationDate: '2026-10-19', status: 'REFERENCE_ONLY',
  },
  {
    id: 'SRC-OPENMIX',
    name: 'OpenMix computational formulation science',
    url: 'https://github.com/vijayvkrishnan/openmix',
    sourceType: 'OPEN_SOURCE_REPOSITORY',
    licenseOrAccess: 'Apache-2.0 (repository license; verify individual data/model licenses separately)',
    versionOrDate: 'Repository reports v0.3.0; verify release before use',
    relevantUse: 'Architecture and computational formulation research reference only.',
    limitations: ['Not a detergent laboratory method or proof of finished-product performance.', 'Its cited shampoo dataset is outside this cleaning-product validation scope.'],
    verificationDate: '2026-10-19',
    status: 'REFERENCE_ONLY',
  },
  {
    id: 'SRC-RDKIT',
    name: 'RDKit',
    url: 'https://github.com/rdkit/rdkit',
    sourceType: 'OPEN_SOURCE_REPOSITORY',
    licenseOrAccess: 'BSD-3-Clause for the repository; check bundled component notices',
    versionOrDate: 'Repository default branch checked 2026-10-19',
    relevantUse: 'Molecular identity and cheminformatics descriptors; already present through the app RDKit adapter.',
    limitations: ['Molecular descriptors do not validate a mixture, detergent performance, safety, or finished-formula lab results.'],
    verificationDate: '2026-10-19',
    status: 'INTEGRATION_PRESENT',
  },
  {
    id: 'SRC-PUBCHEM-PUGREST',
    name: 'PubChem PUG REST API documentation',
    url: 'https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest',
    sourceType: 'OFFICIAL_API_DOCUMENTATION',
    licenseOrAccess: 'API usage policy applies; API documentation is not a blanket license for every contributed datum',
    versionOrDate: 'Documentation last updated 2026-09-15',
    relevantUse: 'Chemical registry identity lookups; rate limit requests to no more than 5 per second and honor dynamic throttling.',
    limitations: ['Registry records are not test results for formulated products; do not infer active matter or grade from a name match.'],
    verificationDate: '2026-10-19',
    status: 'METHOD_METADATA_ONLY',
  },
  {
    id: 'SRC-DEEPCHEM',
    name: 'DeepChem',
    url: 'https://github.com/deepchem/deepchem',
    sourceType: 'OPEN_SOURCE_REPOSITORY',
    licenseOrAccess: 'MIT for DeepChem source; each dataset/model has its own terms',
    versionOrDate: 'Repository default branch checked 2026-10-19',
    relevantUse: 'Potential future modeling framework if detergent-specific, licensed, independently split observations become available.',
    limitations: ['Python/ML stack does not fit the current TypeScript runtime directly.', 'A model or generic chemical dataset cannot substitute for laboratory evidence.'],
    verificationDate: '2026-10-19',
    status: 'REFERENCE_ONLY',
  },
  {
    id: 'SRC-SOAP-CALC',
    name: 'soap-calc',
    url: 'https://github.com/mikewolfd/soap-calc',
    sourceType: 'OPEN_SOURCE_REPOSITORY',
    licenseOrAccess: 'MIT according to current pyproject metadata',
    versionOrDate: 'Package metadata v0.2.3; verify current release',
    relevantUse: 'Soap saponification and recipe calculation reference.',
    limitations: ['Soap-making chemistry is not a validated method for synthetic detergent powder/liquid testing.'],
    verificationDate: '2026-10-19',
    status: 'REFERENCE_ONLY',
  },
  {
    id: 'SRC-BIS-IS4955',
    name: 'BIS IS 4955:2020 Household Laundry Detergent Powders',
    url: 'https://standards.bis.gov.in/',
    sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Official standard text is controlled/purchasable; do not reproduce clauses without authorization.',
    versionOrDate: 'IS 4955:2020, fifth revision; BIS page lists Amendment 1 (2024) and review in 2024.',
    relevantUse: 'Powder product specification and applicable test-plan discovery only after review of the current authorized standard.',
    limitations: ['Powder-specific; does not automatically apply to liquid detergents.', 'No acceptance limit is encoded from the catalog metadata.'],
    verificationDate: '2026-10-19',
    status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-BIS-LIMS',
    name: 'BIS Laboratory Search for IS 4955',
    url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=4955',
    sourceType: 'OFFICIAL_LAB_DIRECTORY',
    licenseOrAccess: 'Public search listing; verify scope, accreditation and validity with BIS/lab before engagement.',
    versionOrDate: 'Live directory checked 2026-10-19',
    relevantUse: 'Find a laboratory listing for IS 4955 powder tests.',
    limitations: ['Directory listing is not proof that a specific lab has current accreditation for every requested test.', 'Availability and fees can change.'],
    verificationDate: '2026-10-19',
    status: 'REFERENCE_ONLY',
  },
  {
    id: 'SRC-ISO-2870',
    name: 'ISO 2870:2009 Anionic-active matter under acid conditions',
    url: 'https://www.iso.org/standard/45657.html',
    sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted standard; purchase and use an authorized copy.',
    versionOrDate: 'Edition 3 (2009); ISO records it as confirmed in 2022 and current when checked 2026-10-19.',
    relevantUse: 'Method reference for specified hydrolysable/non-hydrolysable anionic actives where in scope.',
    limitations: ['Not a universal total-active method for every surfactant class or formula.', 'Exact procedure and applicability require authorized standard review.'],
    verificationDate: '2026-10-19',
    status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-ASTM-D4265',
    name: 'ASTM D4265 stain removal performance in home laundering',
    url: 'https://store.astm.org/d4265-21.html',
    sourceType: 'OFFICIAL_STANDARD',
    licenseOrAccess: 'Paid copyrighted ASTM guide; purchase and use an authorized copy.',
    versionOrDate: 'Supplied D4265-21 page identifies D4265-25 as active (checked 2026-10-19).',
    relevantUse: 'Diagnostic comparative stain-removal screening for home-laundry products.',
    limitations: ['ASTM states controlled results do not have a confirmed correlation to consumer rankings.', 'Use current edition; do not copy method text or invent universal limits.'],
    verificationDate: '2026-10-19',
    status: 'EXPERT_REVIEW_REQUIRED',
  },
  {
    id: 'SRC-OECD-TG301',
    name: 'OECD Test Guideline 301 Ready Biodegradability',
    url: 'https://www.oecd.org/en/publications/test-no-301-ready-biodegradability_9789264070349-en.html',
    sourceType: 'TEST_GUIDELINE',
    licenseOrAccess: 'OECD publication; official guideline is available for download subject to OECD terms.',
    versionOrDate: '1992 guideline; six aerobic aqueous screening methods.',
    relevantUse: 'Biodegradability test-method reference when an expert selects a method appropriate to the test substance.',
    limitations: ['A chemical screening guideline does not by itself establish finished-formula environmental compliance.', 'Mixture composition and method suitability need expert review.'],
    verificationDate: '2026-10-19',
    status: 'EXPERT_REVIEW_REQUIRED',
  },
];
