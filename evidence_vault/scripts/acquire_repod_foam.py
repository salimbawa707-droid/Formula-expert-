#!/usr/bin/env python3
"""Acquire and audit the CC BY 4.0 RepOD foam dataset from its official Dataverse API.

This dataset is auxiliary mechanistic evidence for foam formation/decay, not a
laundry-detergent formula validation set. The script writes the source ODS file,
a normalized CSV per worksheet, and a manifest containing byte hashes and parser
statistics. It never assigns LAB_VALIDATED.
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "evidence_vault" / "datasets" / "repod_foam"
SOURCE_URL = "https://repod.icm.edu.pl/api/access/datafile/48206"
LANDING_URL = "https://repod.icm.edu.pl/dataset.xhtml?persistentId=doi%3A10.18150%2FMKCDUM"
DOI = "10.18150/MKCDUM"
EXPECTED_FILENAME = "DFA_data.ods"
EXPECTED_MD5 = "9bee2b49dd1a55822203e10641694c46"
LICENSE = "CC BY 4.0"
NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}
MAX_REPEATED_CELLS = 100000
MAX_REPEATED_ROWS = 100000
MAX_EXPANDED_ROW_WIDTH = 100000


def expanded_count(raw: str | None, limit: int, label: str) -> int:
    if raw is None:
        return 1
    try:
        count = int(raw)
    except ValueError as exc:
        raise ValueError(f"Invalid {label}: {raw!r}") from exc
    if count < 1 or count > limit:
        raise ValueError(f"Unsafe {label}: {count}")
    return count


def cell_value(cell: ET.Element) -> object:
    value_type = cell.attrib.get(f"{{{NS['office']}}}value-type", "")
    if value_type in ("float", "currency", "percentage"):
        raw = cell.attrib.get(f"{{{NS['office']}}}value")
        if raw is not None:
            try:
                return float(raw)
            except ValueError:
                pass
    if value_type == "boolean":
        return cell.attrib.get(f"{{{NS['office']}}}boolean-value", "")
    if value_type == "date":
        return cell.attrib.get(f"{{{NS['office']}}}date-value", "")
    if value_type == "time":
        return cell.attrib.get(f"{{{NS['office']}}}time-value", "")
    paragraphs = [
        "".join(p.itertext())
        for p in cell.findall(".//text:p", NS)
    ]
    if paragraphs:
        return "\n".join(paragraphs)
    return ""


def parse_ods(path: Path, out_dir: Path) -> list[dict]:
    with zipfile.ZipFile(path) as zf:
        bad = zf.testzip()
        if bad:
            raise ValueError(f"ODS ZIP CRC failed at {bad}")
        if "content.xml" not in zf.namelist():
            raise ValueError("ODS is missing content.xml")
        root = ET.fromstring(zf.read("content.xml"))

    spreadsheet = root.find(".//office:spreadsheet", NS)
    if spreadsheet is None:
        raise ValueError("ODS contains no office:spreadsheet")
    results = []
    for table in spreadsheet.findall("table:table", NS):
        sheet_name = table.attrib.get(f"{{{NS['table']}}}name", "Sheet")
        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", sheet_name).strip("._") or "Sheet"
        csv_path = out_dir / f"{safe_name}.csv"
        row_count = 0
        max_cols = 0
        nonempty_rows = 0
        numeric_cells = 0
        text_cells = 0
        blank_cells = 0
        with csv_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            for row in table.findall("table:table-row", NS):
                row_repeat = expanded_count(
                    row.attrib.get(f"{{{NS['table']}}}number-rows-repeated"),
                    MAX_REPEATED_ROWS,
                    "repeated row count",
                )
                values = []
                for cell in list(row):
                    if cell.tag not in (
                        f"{{{NS['table']}}}table-cell",
                        f"{{{NS['table']}}}covered-table-cell",
                    ):
                        continue
                    repeat = expanded_count(
                        cell.attrib.get(f"{{{NS['table']}}}number-columns-repeated"),
                        MAX_REPEATED_CELLS,
                        "repeated column count",
                    )
                    value = cell_value(cell)
                    values.extend([value] * repeat)
                    if len(values) > MAX_EXPANDED_ROW_WIDTH:
                        raise ValueError(f"Unusually wide row in {sheet_name}")
                # ODS writers may encode thousands of trailing blank columns as a
                # repeated empty cell. Trim only trailing empty padding; preserve
                # blank columns that occur before a later non-empty cell.
                while values and values[-1] == "":
                    values.pop()
                if not values:
                    continue
                max_cols = max(max_cols, len(values))
                if any(v != "" for v in values):
                    nonempty_rows += row_repeat
                for value in values:
                    if value == "":
                        blank_cells += row_repeat
                    elif isinstance(value, (int, float)):
                        numeric_cells += row_repeat
                    else:
                        text_cells += row_repeat
                # ODS repeated rows are semantically repeated values; preserve them.
                for _ in range(row_repeat):
                    writer.writerow(values)
                    row_count += 1
                    if row_count > MAX_REPEATED_ROWS:
                        raise ValueError(f"Unusually large sheet in {sheet_name}")
        results.append({
            "sheetName": sheet_name,
            "csvFile": str(csv_path.relative_to(ROOT)),
            "dataRowsIncludingBlankRows": row_count,
            "nonEmptyRows": nonempty_rows,
            "columnCount": max_cols,
            "numericCells": numeric_cells,
            "textCells": text_cells,
            "blankCells": blank_cells,
            "rowCountSemantics": "expanded worksheet rows; NOT independent experimental observation count",
        })
    return results


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    raw_dir = OUT / "raw"
    csv_dir = OUT / "normalized"
    raw_dir.mkdir(exist_ok=True)
    csv_dir.mkdir(exist_ok=True)
    raw_path = raw_dir / EXPECTED_FILENAME

    request = urllib.request.Request(
        SOURCE_URL,
        headers={"User-Agent": "DetergentFormulaExpert-Phase4B/1.0"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        raw = response.read(20 * 1024 * 1024 + 1)
    if len(raw) > 20 * 1024 * 1024:
        raise SystemExit("Downloaded file exceeds the 20 MiB safety limit.")
    if not raw.startswith(b"PK\x03\x04"):
        raise SystemExit("Official endpoint did not return an ODS ZIP payload.")
    md5 = hashlib.md5(raw).hexdigest()
    sha256 = hashlib.sha256(raw).hexdigest()
    if md5 != EXPECTED_MD5:
        raise SystemExit(f"MD5 mismatch: source={md5}, official-page={EXPECTED_MD5}")

    raw_path.write_bytes(raw)
    sheets = parse_ods(raw_path, csv_dir)
    manifest = {
        "datasetId": "DS-REPOD-FOAM-MKCDUM",
        "title": "Foamability and foam stability — polyelectrolyte/surfactant mixture",
        "authors": "Dominik Kosior",
        "year": 2024,
        "doi": DOI,
        "landingPage": LANDING_URL,
        "downloadUrl": SOURCE_URL,
        "license": LICENSE,
        "licenseSource": LANDING_URL,
        "accessedAtUtc": datetime.now(timezone.utc).isoformat(),
        "sourceFile": str(raw_path.relative_to(ROOT)),
        "sourceBytes": len(raw),
        "md5": md5,
        "sha256": sha256,
        "parser": "Python standard library ZIP/XML parser; ODS expanded rows normalized to CSV",
        "sheets": sheets,
        "intendedUse": "Auxiliary mechanistic foamability/stability evidence only; systems are PGA/LAE and PLL/rhamnolipid mixtures, not commercial laundry-detergent formula validation.",
        "labValidationStatus": "NOT_LAB_VALIDATED",
        "engineEligibility": "NOT_ELIGIBLE_FOR_ENG005_UNTIL_EXECUTABLE_PREDICTOR_AND_INPUT/CONDITION_MATCHING_EXIST",
        "publication": {
            "doi": "10.3390/min14111110",
            "source": "Kosior et al., Minerals 14(11), 1110 (2024)",
            "DFA100_sample_volume": "50 cm3",
            "air_flow": "0.5 dm3/min for 20 s",
            "room_temperature": "21 ± 3 °C",
            "typical_pH": "5.6–6.0 unless otherwise stated",
            "replicates": "Paper states each measurement was repeated at least three times; per-row replicate counts/raw replicate values are not included in workbook.",
        },
        "unitAudit": {
            "PGA_LAE_concentration": "Workbook label c LAE [mol/L], observed range 1e-6 to 1e-3 mol/L.",
            "PLL_RH_concentration": "Workbook label c RH [mol/L] conflicts with values 0.1–600 and publication mg/dm3 ranges; flag as probable mg/L but do not silently relabel or convert.",
            "Vmax": "Workbook says Maximum foam volume and Vmax [mL], while paper describes maximum foam height; source-variable meaning unresolved.",
            "foam_half_lifetime": "t [sec] as workbook-labelled.",
            "bickerman_foaminess": "Σ [sec] as workbook-labelled.",
            "foam_production": "f [sec2/mm] as workbook-labelled.",
        },
        "groupingAudit": {
            "PGA_LAE_concentration_levels": 10,
            "PLL_RH_concentration_levels": 13,
            "polyelectrolyte_conditions": ["0", "100 mg/L"],
            "standardDeviationAvailableFor": ["Vmax", "foam half-lifetime"],
            "standardDeviationMissingFor": ["Bickerman foaminess", "foam production"],
            "missingStandardDeviationsAreNotZero": True,
            "rawReplicateRowsAvailable": False,
            "replicateCountPerRow": None,
            "independentObservationCount": None,
            "additionalPH10RHRowMapping": "Publication discusses pH 10 RH measurements; exact workbook row mapping unresolved.",
        },
        "numericalValidationReadiness": "DEFICIENT",
        "engineEligibility": [],
        "limitations": [
            "Different polyelectrolyte/surfactant systems from standard laundry detergent formulas.",
            "Do not treat worksheet rows, time points, or repeated values as independent physical experiments.",
            "Keep experimental variables, concentration units, replicates, and sample groups traceable before any model comparison.",
            "Do not impute blank standard-deviation cells for Sigma or foam production as zero.",
            "No matched commercial detergent formula inputs/predictions; ENG-005 is unavailable and domain applicability is insufficient.",
        ],
    }
    manifest_path = OUT / "data-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "DOWNLOADED_AND_PARSED",
        "sourceBytes": len(raw),
        "md5": md5,
        "sha256": sha256,
        "sheetCount": len(sheets),
        "sheets": sheets,
        "manifest": str(manifest_path.relative_to(ROOT)),
        "labValidationStatus": manifest["labValidationStatus"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"DATA_ACQUISITION_FAILED: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
