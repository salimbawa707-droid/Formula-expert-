import fs from 'node:fs';
import path from 'node:path';
import { buildEng002CatalogEligibilityReport } from '../../src/utils/eng002InputProvenance';
import { getIngredientCmcData } from '../../src/utils/calculators';

const root = process.cwd();
const jsonPath = path.join(root, 'evidence_vault/datasets/eng002_catalog_eligibility_report.json');
const csvPath = path.join(root, 'evidence_vault/datasets/eng002_surfactant_input_provenance.csv');
const base = buildEng002CatalogEligibilityReport();
const report = {
  ...base,
  sourceCommit: 'fc0cf2c4412f532c4c3a4c1b4c10cd382f540d94',
  auditScope: 'All canonical catalog entries whose category contains Surfactant, as present at the audited starting main SHA.',
  records: base.records.map(record => {
    const legacy = getIngredientCmcData(record.displayName);
    const source = legacy?.referenceEvidence;
    const supportedCatalogRecord = record.eligibility === 'PARTIALLY_SUPPORTED';
    const sourceApplies = supportedCatalogRecord && source?.evidenceId === 'PSDI-CMC-C1-66007-25C';
    const broadDdaoOnly = source?.evidenceId === 'PSDI-CMC-C21-62005-27C' && !supportedCatalogRecord;
    const cmcProvenance = sourceApplies ? 'SOURCE_BACKED' : broadDdaoOnly ? 'UNKNOWN' : legacy?.dataProvenance ?? 'UNKNOWN';
    const legacyApplicability = sourceApplies
      ? 'APPLICABLE_TO_EXACT_SDS_ACTIVE_COMPONENT_ONLY'
      : broadDdaoOnly
        ? 'NOT_APPLICABLE_TO_UNSPECIFIED_C12_14_OR_COMMERCIAL_AMINE_OXIDE'
        : legacy
          ? 'HEURISTIC_SCREENING_ONLY; EXCLUDED_FROM_APP_PREDICTION'
          : 'NO_CMC_VALUE';
    const rawMaterialType = record.rawMaterialIdentityType === 'SINGLE_SUBSTANCE'
      ? 'PURE_SINGLE_SUBSTANCE'
      : /liquid|solution|paste|concentrate/i.test(record.displayName)
        ? 'COMMERCIAL_SOLUTION_OR_BLEND'
        : record.rawMaterialIdentityType === 'MULTI_COMPONENT_MIXTURE' || record.rawMaterialIdentityType === 'PROPRIETARY_BLEND' || record.rawMaterialIdentityType === 'COMMERCIAL_UVCB'
          ? record.rawMaterialIdentityType
          : 'COMMERCIAL_OR_UNSPECIFIED_GRADE_RAW_MATERIAL';
    return {
      ...record,
      decisionReason: sourceApplies ? 'SDS component reference; catalog active matter lacks lot-specific assay evidence.' : 'No applicable traceable pure-CMC and molecular-weight pair; blocked from app prediction.',
      rawMaterialType,
      activeMatterDefinition: record.activeMatterDefaultPct === null
        ? 'UNKNOWN'
        : 'Catalog activeDefault percentage; as-supplied raw material active matter basis is not lot-specific assay evidence.',
      activeMatterClassification: record.activeMatterDefaultPct === null ? 'UNKNOWN' : 'HEURISTIC_SCREENING',
      legacyNameMappedCmcMmolL: legacy?.cmcMolar ?? null,
      legacyNameMappedMolecularWeightGPerMol: legacy?.standardMw ?? null,
      legacyCmcProvenance: cmcProvenance,
      legacyCmcApplicability: legacyApplicability,
      referenceEvidenceId: source?.evidenceId ?? null,
      referenceCitation: source?.citation ?? null,
      referenceDoi: source?.doi ?? null,
      datasetCitation: source?.datasetCitation ?? null,
      sourceRecord: source?.sourceReferenceCode ?? null,
      sourceTemperatureC: source?.temperatureC ?? null,
      sourceMethod: source?.method ?? null,
      sourceSolvent: source ? 'Aqueous' : 'UNKNOWN',
      sourceIonicStrength: source?.evidenceId === 'PSDI-CMC-C21-62005-27C' ? 'No added salt stated in curated scope' : source ? 'Not reported in curated reference record' : 'UNKNOWN',
      sourceReuseTerms: source?.license ?? 'UNKNOWN_OR_NOT_APPLICABLE',
      transformationHistory: sourceApplies
        ? 'Source CMC 0.0082 mol/L × 1000 = 8.2 mmol/L; molecular weight read from PSDI CMC_Compounds.csv compound 1 (288.3 g/mol; lookup field 288.38); ppm output is mmol/L × g/mol = mg/L assuming dilute aqueous density. No fitted parameter.'
        : source
          ? 'Source value is retained for provenance only; this catalog identity is not admitted to app-facing prediction.'
          : legacy
            ? 'Legacy embedded name heuristic; no source transformation/citation recorded; excluded from app-facing prediction.'
            : 'No supported CMC transformation available.'
    };
  }),
  limitations: [
    'The 162 records are canonical catalog surfactants, not 162 independently verified chemical substances.',
    'Catalog activeDefault values and provenance labels do not constitute lot-specific CoA/assay evidence.',
    'The eight partial entries are SLS/SDS catalog grades with exact CAS 151-21-3 and a source-backed pure-component reference; calculation remains conditional on explicit formula dose and active matter inputs.',
    'The formula calculator never consumes the historical heuristic CMC/MW mappings for app-facing predictions.',
    'P2SURF Task 4 verifies the Clint equation on same-system measured endpoints only. It does not verify catalog identity mapping, commercial active matter, defaults, or finished detergent formulas.',
    'The application gate checks presence of an active-matter evidence ID and URL/location, but does not fetch or validate the source contents; an auditor must verify the linked assay/CoA.',
    'No empirical accuracy, confidence intervals, or lab validation are inferred from these records.'
  ]
};

const csvColumns = [
  'canonicalIngredientId','displayName','category','casNumber','inciName','rawMaterialType','rawMaterialIdentityType',
  'activeMatterDefaultPct','activeMatterDefinition','activeMatterClassification','molecularWeightGPerMol','molecularWeightProvenance',
  'pureCmcValue','pureCmcUnit','pureCmcTemperatureC','pureCmcMethod','pureCmcProvenance','legacyNameMappedCmcMmolL',
  'legacyNameMappedMolecularWeightGPerMol','legacyCmcProvenance','legacyCmcApplicability','referenceEvidenceId',
  'sourceRecord','referenceCitation','referenceDoi','datasetCitation','sourceSolvent','sourceIonicStrength','sourceReuseTerms',
  'transformationHistory','eligibility','decisionReason'
];
const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};
const csv = [csvColumns.join(','), ...report.records.map(record => csvColumns.map(column => csvEscape((record as any)[column])).join(','))].join('\n') + '\n';
const json = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--write')) {
  fs.writeFileSync(jsonPath, json, 'utf8');
  fs.writeFileSync(csvPath, csv, 'utf8');
  console.log(JSON.stringify({ mode: 'write', catalogRecordCount: report.catalogRecordCount, counts: report.counts }));
} else {
  const committedJson = fs.readFileSync(jsonPath, 'utf8');
  const committedCsv = fs.readFileSync(csvPath, 'utf8');
  if (committedJson !== json || committedCsv !== csv) {
    console.error('ENG-002 catalog provenance artifacts do not match current catalog/source inputs. Run with --write and review the diff.');
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ mode: 'check', catalogRecordCount: report.catalogRecordCount, counts: report.counts }));
  }
}
