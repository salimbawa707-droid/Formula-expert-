import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CSV_PATH = path.resolve('data/evidence/surfpro/S129_SURFPRO.csv');
const SLICE_PATH = path.resolve('data/evidence/surfpro/surfpro_detergent_experimental_slice_v1.csv');
const STATS_PATH = path.resolve('data/evidence/surfpro/surfpro_inspection_stats.json');

// RFC 4180 compliant CSV parser
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (insideQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function calculateFileChecksums(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const size = fileBuffer.length;
  return { size, md5, sha256 };
}

function runInspection() {
  console.log(`[1] Starting numerical inspection on ${CSV_PATH}...`);
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`File does not exist at ${CSV_PATH}`);
  }

  const fileChecksums = calculateFileChecksums(CSV_PATH);
  console.log(`Byte size: ${fileChecksums.size}`);
  console.log(`MD5: ${fileChecksums.md5}`);
  console.log(`SHA-256: ${fileChecksums.sha256}`);

  const rawText = fs.readFileSync(CSV_PATH, 'utf8');
  const parsedRows = parseCSV(rawText);

  if (parsedRows.length === 0) {
    throw new Error('CSV is empty');
  }

  const header = parsedRows[0];
  const dataRows = parsedRows.slice(1).filter(r => r.length > 1 || (r.length === 1 && r[0].trim().length > 0));

  console.log(`Header columns count: ${header.length}`);
  console.log(`Data records count: ${dataRows.length}`);

  const colIndex = {};
  header.forEach((name, idx) => {
    colIndex[name] = idx;
  });

  // Missing values inspection
  const missingCounts = {};
  header.forEach(h => {
    missingCounts[h] = 0;
  });

  const invalidNumeric = [];
  const inchiKeyCounts = {};
  const smilesCounts = {};
  const duplicateRecords = [];

  let countWithCMC = 0;
  let countWithRefCMC = 0;
  let countWithBothCMCandRef = 0;

  let countWithST = 0;
  let countWithRefST = 0;
  let countWithBothSTandRef = 0;

  let countWithBothProperties = 0;
  let countWithBothPropertiesAndBothRefs = 0;

  const surfactantTypeCounts = {};
  const temperatureDistribution = {};

  dataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2; // 1-indexed, accounting for header

    header.forEach((h, cIdx) => {
      const val = row[cIdx] !== undefined ? row[cIdx].trim() : '';
      if (!val) {
        missingCounts[h]++;
      }
    });

    const smiles = (row[colIndex['SMILES']] || '').trim();
    const inchiKey = (row[colIndex['InChIKey']] || '').trim();
    const sType = (row[colIndex['Surfactant_Type']] || '').trim() || 'UNSPECIFIED';
    surfactantTypeCounts[sType] = (surfactantTypeCounts[sType] || 0) + 1;

    // Duplicates check
    if (inchiKey) {
      if (!inchiKeyCounts[inchiKey]) inchiKeyCounts[inchiKey] = [];
      inchiKeyCounts[inchiKey].push(rowNum);
    }
    if (smiles) {
      if (!smilesCounts[smiles]) smilesCounts[smiles] = [];
      smilesCounts[smiles].push(rowNum);
    }

    // CMC checks
    const cmcStr = (row[colIndex['CMC']] || '').trim();
    const pcmcStr = (row[colIndex['pCMC']] || '').trim();
    const refCmc = (row[colIndex['Ref_CMC']] || '').trim();

    let hasValidCMC = false;
    if (cmcStr) {
      const cmcVal = parseFloat(cmcStr);
      if (isNaN(cmcVal) || cmcVal <= 0) {
        invalidNumeric.push({ rowNum, field: 'CMC', value: cmcStr, error: 'Non-positive or NaN CMC' });
      } else {
        hasValidCMC = true;
      }
    } else if (pcmcStr) {
      const pcmcVal = parseFloat(pcmcStr);
      if (isNaN(pcmcVal)) {
        invalidNumeric.push({ rowNum, field: 'pCMC', value: pcmcStr, error: 'NaN pCMC' });
      } else {
        hasValidCMC = true;
      }
    }

    if (hasValidCMC) countWithCMC++;
    if (refCmc) countWithRefCMC++;
    if (hasValidCMC && refCmc) countWithBothCMCandRef++;

    // Surface tension checks
    const stStr = (row[colIndex['AW_ST_CMC']] || '').trim();
    const refSt = (row[colIndex['Ref_AW_ST_CMC']] || '').trim();

    let hasValidST = false;
    if (stStr) {
      const stVal = parseFloat(stStr);
      if (isNaN(stVal) || stVal <= 0 || stVal > 100) {
        invalidNumeric.push({ rowNum, field: 'AW_ST_CMC', value: stStr, error: 'Physically implausible surface tension' });
      } else {
        hasValidST = true;
      }
    }

    if (hasValidST) countWithST++;
    if (refSt) countWithRefST++;
    if (hasValidST && refSt) countWithBothSTandRef++;

    if (hasValidCMC && hasValidST) countWithBothProperties++;
    if (hasValidCMC && hasValidST && refCmc && refSt) countWithBothPropertiesAndBothRefs++;

    // Temperature distribution
    const tempStr = (row[colIndex['Temp_Celsius']] || '').trim();
    if (tempStr) {
      temperatureDistribution[tempStr] = (temperatureDistribution[tempStr] || 0) + 1;
    } else {
      temperatureDistribution['MISSING'] = (temperatureDistribution['MISSING'] || 0) + 1;
    }
  });

  // Calculate duplicate statistics
  let duplicateInChIKeysCount = 0;
  for (const [key, rows] of Object.entries(inchiKeyCounts)) {
    if (rows.length > 1) {
      duplicateInChIKeysCount++;
      duplicateRecords.push({ inchiKey: key, rows });
    }
  }

  // Detergent class filter definitions
  const detergentClasses = ['anionic', 'non-ionic', 'sugar-based non-ionic', 'zwitterionic', 'gemini anionic', 'gemini zwitterionic'];

  // Test various filters to reproduce / audit the 223 subset
  // Criteria A: Surfactant_Type in detergentClasses AND has CMC AND has ST
  const rowsDetergentBothProperties = [];
  // Criteria B: Criteria A AND has Ref_CMC AND has Ref_AW_ST_CMC
  const rowsDetergentBothPropertiesWithRefs = [];
  // Criteria C: Criteria A AND temperature between 20 and 25
  const rowsDetergentBothPropertiesTemp2025 = [];
  // Criteria D: Criteria B AND temperature between 20 and 25
  const rowsDetergentBothPropertiesWithRefsTemp2025 = [];

  // Excluded counts breakdown for Criteria A
  let excludedNonDetergentClass = 0;
  let excludedMissingCMC = 0;
  let excludedMissingST = 0;

  dataRows.forEach((row, rowIdx) => {
    const sType = (row[colIndex['Surfactant_Type']] || '').trim().toLowerCase();
    const isDetergent = detergentClasses.includes(sType);

    const cmcStr = (row[colIndex['CMC']] || '').trim();
    const pcmcStr = (row[colIndex['pCMC']] || '').trim();
    const hasCMC = Boolean(cmcStr || pcmcStr);

    const stStr = (row[colIndex['AW_ST_CMC']] || '').trim();
    const hasST = Boolean(stStr);

    const refCmc = (row[colIndex['Ref_CMC']] || '').trim();
    const refSt = (row[colIndex['Ref_AW_ST_CMC']] || '').trim();

    const tempStr = (row[colIndex['Temp_Celsius']] || '').trim();
    const tempVal = parseFloat(tempStr);
    const isTemp2025 = !isNaN(tempVal) && tempVal >= 20 && tempVal <= 25;

    if (!isDetergent) {
      excludedNonDetergentClass++;
    } else if (!hasCMC) {
      excludedMissingCMC++;
    } else if (!hasST) {
      excludedMissingST++;
    } else {
      // Meets Criteria A
      rowsDetergentBothProperties.push(row);

      if (refCmc && refSt) {
        rowsDetergentBothPropertiesWithRefs.push(row);
      }
      if (isTemp2025) {
        rowsDetergentBothPropertiesTemp2025.push(row);
      }
      if (refCmc && refSt && isTemp2025) {
        rowsDetergentBothPropertiesWithRefsTemp2025.push(row);
      }
    }
  });

  console.log(`[Inspection Results]`);
  console.log(`- Rows with CMC/pCMC: ${countWithCMC}`);
  console.log(`- Rows with Ref_CMC: ${countWithRefCMC}`);
  console.log(`- Rows with AW_ST_CMC: ${countWithST}`);
  console.log(`- Rows with Ref_AW_ST_CMC: ${countWithRefST}`);
  console.log(`- Rows with BOTH CMC and AW_ST_CMC: ${countWithBothProperties}`);
  console.log(`- Rows with BOTH properties and BOTH references: ${countWithBothPropertiesAndBothRefs}`);
  console.log(`- Detergent-class rows with BOTH properties (Criteria A): ${rowsDetergentBothProperties.length}`);
  console.log(`- Detergent-class rows with BOTH properties & BOTH refs (Criteria B): ${rowsDetergentBothPropertiesWithRefs.length}`);
  console.log(`- Detergent-class rows with BOTH properties & 20-25C (Criteria C): ${rowsDetergentBothPropertiesTemp2025.length}`);
  console.log(`- Detergent-class rows with BOTH properties, BOTH refs & 20-25C (Criteria D): ${rowsDetergentBothPropertiesWithRefsTemp2025.length}`);

  // Create the canonical experimental slice
  // We select Criteria A (detergent class + experimental CMC + experimental AW_ST_CMC)
  // because in SURFPRO, 100% of rows have Ref_CMC, and Ref_AW_ST_CMC is provided or traces to the same primary study.
  const sliceHeader = header;
  const sliceRows = rowsDetergentBothProperties;

  // Format CSV lines with RFC 4180 quoting
  function formatCSVRow(fields) {
    return fields
      .map(field => {
        const str = field === undefined || field === null ? '' : String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');
  }

  const sliceContent = [formatCSVRow(sliceHeader), ...sliceRows.map(r => formatCSVRow(r))].join('\n') + '\n';
  fs.writeFileSync(SLICE_PATH, sliceContent, 'utf8');

  const sliceChecksums = calculateFileChecksums(SLICE_PATH);
  console.log(`[Slice Created]`);
  console.log(`Path: ${SLICE_PATH}`);
  console.log(`Records: ${sliceRows.length}`);
  console.log(`Byte size: ${sliceChecksums.size}`);
  console.log(`SHA-256: ${sliceChecksums.sha256}`);
  console.log(`MD5: ${sliceChecksums.md5}`);

  const inspectionReport = {
    timestamp: new Date().toISOString(),
    sourceFile: {
      path: CSV_PATH,
      sizeBytes: fileChecksums.size,
      md5: fileChecksums.md5,
      sha256: fileChecksums.sha256,
      officialPublishedMd5: 'e5bcd1bbab2fc56717a3cd6a0cf1c152',
      md5Match: fileChecksums.md5 === 'e5bcd1bbab2fc56717a3cd6a0cf1c152',
      totalLines: parsedRows.length,
      dataRecords: dataRows.length,
      columnCount: header.length,
      columns: header,
    },
    missingValues: missingCounts,
    invalidNumericValues: invalidNumeric,
    duplicates: {
      uniqueInChIKeys: Object.keys(inchiKeyCounts).length,
      duplicateInChIKeysCount,
      sampleDuplicates: duplicateRecords.slice(0, 5),
    },
    surfactantTypeDistribution: surfactantTypeCounts,
    temperatureDistribution,
    propertyCounts: {
      withCMC: countWithCMC,
      withRefCMC: countWithRefCMC,
      withBothCMCandRef: countWithBothCMCandRef,
      withST: countWithST,
      withRefST: countWithRefST,
      withBothSTandRef: countWithBothSTandRef,
      withBothProperties: countWithBothProperties,
      withBothPropertiesAndBothRefs: countWithBothPropertiesAndBothRefs,
    },
    filterAnalysis: {
      criteriaA_DetergentBothProperties: rowsDetergentBothProperties.length,
      criteriaB_DetergentBothPropertiesWithRefs: rowsDetergentBothPropertiesWithRefs.length,
      criteriaC_DetergentBothPropertiesTemp2025: rowsDetergentBothPropertiesTemp2025.length,
      criteriaD_DetergentBothPropertiesWithRefsTemp2025: rowsDetergentBothPropertiesWithRefsTemp2025.length,
      exclusionsForCriteriaA: {
        excludedNonDetergentClass,
        excludedMissingCMC,
        excludedMissingST,
      },
    },
    slice: {
      path: SLICE_PATH,
      rowCount: sliceRows.length,
      columnCount: sliceHeader.length,
      sizeBytes: sliceChecksums.size,
      md5: sliceChecksums.md5,
      sha256: sliceChecksums.sha256,
    },
  };

  fs.writeFileSync(STATS_PATH, JSON.stringify(inspectionReport, null, 2), 'utf8');
  console.log(`Inspection report written to ${STATS_PATH}`);
}

runInspection();
