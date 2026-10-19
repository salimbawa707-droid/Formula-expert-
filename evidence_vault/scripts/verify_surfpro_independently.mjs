import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CANONICAL_CSV = path.resolve('data/evidence/surfpro/S129_SURFPRO.csv');
const SLICE_CSV = path.resolve('data/evidence/surfpro/surfpro_detergent_experimental_slice_v1.csv');
const STATS_JSON = path.resolve('data/evidence/surfpro/surfpro_inspection_stats.json');
const DISCREPANCY_CSV = path.resolve('data/evidence/surfpro/surfpro_37_reference_discrepancies.csv');
const AUDIT_JSON = path.resolve('data/evidence/surfpro/surfpro_independent_audit_stats.json');

// RFC 4180 compliant CSV parser written independently
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        field += c;
        i++;
        continue;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (c === ',') {
        row.push(field);
        field = '';
        i++;
        continue;
      } else if (c === '\r') {
        if (i + 1 < text.length && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
        continue;
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
        continue;
      } else {
        field += c;
        i++;
        continue;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  return { size: buf.length, md5, sha256 };
}

function runAudit() {
  console.log('=== [1] PHYSICAL ARTIFACT EXISTENCE & INTEGRITY AUDIT ===');
  const filesToCheck = [
    { name: 'Canonical Master CSV', path: CANONICAL_CSV },
    { name: 'Experimental Slice CSV', path: SLICE_CSV },
    { name: 'Inspection Stats JSON', path: STATS_JSON },
    { name: 'Initial Inspection Script', path: path.resolve('scripts/inspect_surfpro.mjs') },
    { name: 'Inspection Report Markdown', path: path.resolve('PHASE4B_SURFPRO_NUMERICAL_INSPECTION_REPORT.md') },
    { name: 'Dataset Register Update Markdown', path: path.resolve('PHASE4B_SURFPRO_DATASET_REGISTER_UPDATE.md') },
  ];

  const fileStatus = {};
  for (const f of filesToCheck) {
    const exists = fs.existsSync(f.path);
    if (!exists) {
      console.error(`FATAL: File missing at ${f.path}`);
      process.exit(1);
    }
    const stat = fs.statSync(f.path);
    fileStatus[f.name] = { path: f.path, sizeBytes: stat.size };
    console.log(`[PASS] ${f.name}: ${stat.size} bytes`);
  }

  console.log('\n=== [2] INDEPENDENT CHECKSUM RECALCULATION ===');
  const canonicalHashes = hashFile(CANONICAL_CSV);
  const sliceHashes = hashFile(SLICE_CSV);

  const officialZenodoMD5 = 'e5bcd1bbab2fc56717a3cd6a0cf1c152';
  const expectedCanonicalSHA256 = '316a136630ab08097454518231b952c78d65773a125627ae38d874b889b8d841';
  const expectedSliceSHA256 = '687dc5cdd5dea832f8ac04803f0ecdd34dc64b9abbf505e7c9be2a6fe55fdef8';

  console.log(`Canonical CSV Size: ${canonicalHashes.size} bytes (Expected: 799214)`);
  console.log(`Canonical CSV MD5:  ${canonicalHashes.md5}`);
  console.log(`  - Match with Zenodo Published MD5 (${officialZenodoMD5}): ${canonicalHashes.md5 === officialZenodoMD5}`);
  console.log(`Canonical CSV SHA256: ${canonicalHashes.sha256}`);
  console.log(`  - Match with Reported SHA256: ${canonicalHashes.sha256 === expectedCanonicalSHA256}`);

  console.log(`Slice CSV Size: ${sliceHashes.size} bytes (Expected: 121004)`);
  console.log(`Slice CSV MD5:  ${sliceHashes.md5}`);
  console.log(`Slice CSV SHA256: ${sliceHashes.sha256}`);
  console.log(`  - Match with Reported Slice SHA256: ${sliceHashes.sha256 === expectedSliceSHA256}`);

  console.log('\n=== [3] INDEPENDENT PARSING & FILTER RE-EXECUTION ===');
  const rawCanonical = fs.readFileSync(CANONICAL_CSV, 'utf8');
  const canonicalRows = parseCSV(rawCanonical);
  const header = canonicalRows[0];
  const allData = canonicalRows.slice(1).filter(r => r.length > 1 || (r.length === 1 && r[0].trim().length > 0));

  console.log(`Total parsed lines: ${canonicalRows.length}`);
  console.log(`Header columns: ${header.length}`);
  console.log(`Data records: ${allData.length}`);

  const col = name => header.indexOf(name);

  // Reimplementation of filtering criteria step-by-step
  // Allowed detergent classes
  const detergentClasses = [
    'anionic',
    'non-ionic',
    'sugar-based non-ionic',
    'zwitterionic',
    'gemini anionic',
    'gemini zwitterionic',
  ];

  let step0_total = allData.length; // 1624
  let step1_classFiltered = [];
  let step1_excludedNonDetergent = [];

  for (const r of allData) {
    const st = (r[col('Surfactant_Type')] || '').trim().toLowerCase();
    if (detergentClasses.includes(st)) {
      step1_classFiltered.push(r);
    } else {
      step1_excludedNonDetergent.push(r);
    }
  }

  let step2_cmcFiltered = [];
  let step2_excludedMissingCMC = [];

  for (const r of step1_classFiltered) {
    const cmc = (r[col('CMC')] || '').trim();
    const pcmc = (r[col('pCMC')] || '').trim();
    const num = parseFloat(cmc);
    if ((cmc && !isNaN(num) && num > 0) || (pcmc && !isNaN(parseFloat(pcmc)))) {
      step2_cmcFiltered.push(r);
    } else {
      step2_excludedMissingCMC.push(r);
    }
  }

  let step3_stFiltered = [];
  let step3_excludedMissingST = [];

  for (const r of step2_cmcFiltered) {
    const st = (r[col('AW_ST_CMC')] || '').trim();
    const num = parseFloat(st);
    if (st && !isNaN(num) && num > 0) {
      step3_stFiltered.push(r);
    } else {
      step3_excludedMissingST.push(r);
    }
  }

  console.log(`Filtering Funnel Audit:`);
  console.log(`- Step 0: Total raw records entering: ${step0_total}`);
  console.log(`- Step 1: Detergent class filter retained: ${step1_classFiltered.length} (Excluded non-detergent: ${step1_excludedNonDetergent.length})`);
  console.log(`- Step 2: Valid measured CMC filter retained: ${step2_cmcFiltered.length} (Excluded missing/invalid CMC: ${step2_excludedMissingCMC.length})`);
  console.log(`- Step 3: Valid measured AW_ST_CMC filter retained: ${step3_stFiltered.length} (Excluded missing/invalid ST: ${step3_excludedMissingST.length})`);

  // Temperature check across retained 223
  const tempMap = {};
  for (const r of step3_stFiltered) {
    const t = (r[col('Temp_Celsius')] || '').trim();
    tempMap[t] = (tempMap[t] || 0) + 1;
  }
  console.log(`Temperature distribution across retained ${step3_stFiltered.length} records:`, tempMap);

  // Validate the slice on disk matches step3_stFiltered exactly
  const rawSlice = fs.readFileSync(SLICE_CSV, 'utf8');
  const parsedSlice = parseCSV(rawSlice);
  const sliceData = parsedSlice.slice(1).filter(r => r.length > 1 || (r.length === 1 && r[0].trim().length > 0));
  console.log(`Slice on disk records: ${sliceData.length}`);
  console.log(`Does slice match filtered rows count? ${sliceData.length === step3_stFiltered.length}`);

  console.log('\n=== [4] INVESTIGATION OF THE 37 REFERENCE DISCREPANCIES ===');
  // Identify records in step3_stFiltered where Ref_CMC is non-empty, but Ref_AW_ST_CMC is empty
  const discrepancyRows = [];

  for (const r of step3_stFiltered) {
    const refCmc = (r[col('Ref_CMC')] || '').trim();
    const refSt = (r[col('Ref_AW_ST_CMC')] || '').trim();
    const subRefSt = (r[col('SubRef_AW_ST_CMC')] || '').trim();
    const subRefCmc = (r[col('SubRef_CMC')] || '').trim();
    const refPi = (r[col('Ref_Pi_CMC')] || '').trim();

    if (refCmc && !refSt) {
      // Investigate secondary provenance columns
      let classification = 'TRACEABLE_ONE_PROPERTY_ONLY';
      let provenanceNotes = 'Ref_AW_ST_CMC is blank. Primary reference for CMC is documented in Ref_CMC.';

      if (subRefSt) {
        classification = 'TRACEABLE_BOTH_PROPERTIES';
        provenanceNotes = `Ref_AW_ST_CMC blank, but secondary reference SubRef_AW_ST_CMC is present: ${subRefSt}`;
      } else if (refPi) {
        classification = 'TRACEABLE_BOTH_PROPERTIES';
        provenanceNotes = `Ref_AW_ST_CMC blank, but surface pressure Ref_Pi_CMC provides direct citation: ${refPi}`;
      }

      discrepancyRows.push({
        index: (r[col('Index')] || '').trim(),
        preferredName: (r[col('Preferred_Name')] || r[col('IUPAC_Name')] || '').trim(),
        surfactantType: (r[col('Surfactant_Type')] || '').trim(),
        inchiKey: (r[col('InChIKey')] || '').trim(),
        smiles: (r[col('SMILES')] || '').trim(),
        cmc: (r[col('CMC')] || '').trim(),
        pcmc: (r[col('pCMC')] || '').trim(),
        cmcUnit: 'mol/L',
        awStCmc: (r[col('AW_ST_CMC')] || '').trim(),
        stUnit: 'mN/m',
        tempCelsius: (r[col('Temp_Celsius')] || '').trim(),
        refCmc: refCmc,
        refAwStCmc: refSt,
        subRefCmc: subRefCmc,
        subRefAwStCmc: subRefSt,
        refPiCmc: refPi,
        classification,
        provenanceNotes,
      });
    }
  }

  console.log(`Discrepancy count (Ref_CMC populated, Ref_AW_ST_CMC empty): ${discrepancyRows.length}`);

  const classificationCounts = {};
  for (const row of discrepancyRows) {
    classificationCounts[row.classification] = (classificationCounts[row.classification] || 0) + 1;
  }
  console.log(`Discrepancy Classifications:`, classificationCounts);

  // Write out discrepancy CSV
  function escapeCSV(val) {
    const s = val === undefined || val === null ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const discrepancyHeaders = [
    'Index',
    'Preferred_Name',
    'Surfactant_Type',
    'InChIKey',
    'SMILES',
    'CMC',
    'CMC_Unit',
    'pCMC',
    'AW_ST_CMC',
    'ST_Unit',
    'Temp_Celsius',
    'Ref_CMC',
    'Ref_AW_ST_CMC',
    'SubRef_CMC',
    'SubRef_AW_ST_CMC',
    'Ref_Pi_CMC',
    'Classification',
    'Provenance_Notes',
  ];

  const discrepancyCSVContent = [
    discrepancyHeaders.join(','),
    ...discrepancyRows.map(r =>
      [
        r.index,
        r.preferredName,
        r.surfactantType,
        r.inchiKey,
        r.smiles,
        r.cmc,
        r.cmcUnit,
        r.pcmc,
        r.awStCmc,
        r.stUnit,
        r.tempCelsius,
        r.refCmc,
        r.refAwStCmc,
        r.subRefCmc,
        r.subRefAwStCmc,
        r.refPiCmc,
        r.classification,
        r.provenanceNotes,
      ].map(escapeCSV).join(',')
    ),
  ].join('\n') + '\n';

  fs.writeFileSync(DISCREPANCY_CSV, discrepancyCSVContent, 'utf8');
  console.log(`Wrote 37 discrepancy records to ${DISCREPANCY_CSV}`);

  console.log('\n=== [5] REVIEW OF ENG-002 EQUATIONS & VALIDATION READINESS ===');
  console.log('ENG-002: SurfactantMicellizationEngine');
  console.log('Documented core equation: Rubingh Regular Solution Theory (RST):');
  console.log('  1 / CMC_mix = sum(x_i / (f_i * CMC_i))');
  console.log('  ln(f_1) = beta * (1 - alpha_1)^2,  ln(f_2) = beta * alpha_1^2');
  console.log('Critical Finding:');
  console.log('  1. In Rubingh RST, pure-component CMC values (CMC_i) are INPUTS, not model predictions.');
  console.log('  2. SurfPro records single-surfactant equilibrium measurements.');
  console.log('  3. SurfPro does NOT contain binary/ternary mixed surfactant CMC series with varying mole fractions (x_i).');
  console.log('  4. Therefore, SurfPro can serve as a reference library for pure-component baseline inputs (CMC_i and gamma_cmc),');
  console.log('     but CANNOT validate mixed surfactant synergy or the Rubingh interaction parameter (beta).');
  console.log('  5. Data leakage status: NOT_FULLY_ASSESSED. (Formula-expert- historical code may have utilized published');
  console.log('     literature values for typical CMC constants of LAS, SLES, etc.)');

  const auditResult = {
    timestamp: new Date().toISOString(),
    auditScope: 'Round 2 Independent Forensic Audit of SurfPro Artifacts',
    physicalArtifacts: fileStatus,
    checksums: {
      canonical: {
        path: CANONICAL_CSV,
        size: canonicalHashes.size,
        md5: canonicalHashes.md5,
        sha256: canonicalHashes.sha256,
        zenodoMd5Match: canonicalHashes.md5 === officialZenodoMD5,
        sha256Match: canonicalHashes.sha256 === expectedCanonicalSHA256,
      },
      slice: {
        path: SLICE_CSV,
        size: sliceHashes.size,
        md5: sliceHashes.md5,
        sha256: sliceHashes.sha256,
        sha256Match: sliceHashes.sha256 === expectedSliceSHA256,
      },
    },
    funnelAudit: {
      step0_rawRecords: step0_total,
      step1_classRetained: step1_classFiltered.length,
      step1_classExcluded: step1_excludedNonDetergent.length,
      step2_cmcRetained: step2_cmcFiltered.length,
      step2_cmcExcluded: step2_excludedMissingCMC.length,
      step3_stRetained: step3_stFiltered.length,
      step3_stExcluded: step3_excludedMissingST.length,
      confirmedSubsetCount: step3_stFiltered.length,
      temperatureDistribution: tempMap,
    },
    discrepancyInvestigation: {
      totalDiscrepancies: discrepancyRows.length,
      classifications: classificationCounts,
      csvExportPath: DISCREPANCY_CSV,
    },
    engine002ValidationAssessment: {
      predictedProperties: ['mixedCMC', 'micelleComposition (alpha_i)', 'synergyIndex'],
      requiredInputParameters: ['pureComponentCMCs (CMC_i)', 'moleFractions (x_i)', 'rubinghInteractionBeta'],
      surfProCompatibility: 'PARTIAL_INPUT_REFERENCE_ONLY',
      limitations: [
        'SurfPro contains pure single-surfactant data; does not contain mixed binary/ternary titration series.',
        'Rubingh interaction parameter (beta) requires binary mixture experimental isotherms which are absent in SURFPRO.',
        'Single-surfactant measurements can only validate pure-component baseline lookup tables or QSPR models, not mixture thermodynamics.',
      ],
      dataLeakageStatus: 'NOT_FULLY_ASSESSED',
    },
    conclusion: {
      phase4BStatus: 'ACTIVE / OPEN',
      phase5Status: 'STRICTLY LOCKED',
      labValidatedClassification: 'PROHIBITED',
    },
  };

  fs.writeFileSync(AUDIT_JSON, JSON.stringify(auditResult, null, 2), 'utf8');
  console.log(`\nAudit result saved to ${AUDIT_JSON}`);
}

runAudit();
