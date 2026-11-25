#!/usr/bin/env python3
"""Regression tests for the AI visual re-audit correction validator."""
import importlib.util
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("reaudit_validator", HERE / "validate_pusic_ai_visual_reaudit.py")
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)

STAINS = ["black_coffee", "red_wine", "cocoa", "blood", "pumpkin_seed_oil", "lipstick", "pureed_tomato", "shoe_cream", "standard_fabric_control"]
CONDITIONS = ["before", "dose_1", "dose_2", "dose_3"]
CORRECTED_ID = "pusic_2006_table_8_dose_2_red_wine"

def fixture():
    production, comparison, audit = [], [], []
    for table in (5, 6, 7, 8):
        for ci, condition in enumerate(CONDITIONS):
            for si, stain in enumerate(STAINS):
                source_id = f"pusic_2006_table_{table}_{condition}_{stain}"
                value = 70.0 + ci + si / 10
                previous = value
                status = "MATCH"
                if source_id == CORRECTED_ID:
                    value, previous, status = 83.35, 81.35, "MISMATCH"
                text = lambda x: f"{x:.2f}"
                common = {"source_id": source_id, "table_number": str(table), "condition_label": condition, "stain_or_control": stain}
                production.append({**common, "measurement_value": text(value)})
                comparison.append({**common, "source_csv_value": text(value), "ai_visual_value": text(value), "comparison_status": "MATCH"})
                audit.append({**common, "production_value_before_correction": text(previous),
                    "ai_visual_value_2026_11_26": text(value), "comparison_status_before_correction": status,
                    "disposition": "CORRECT_PRODUCTION_AND_COMPARISON_LEDGER" if status == "MISMATCH" else "NO_CHANGE",
                    "source_pdf_sha256": MOD.SOURCE_PDF_SHA256, "source_image_git_blob_sha": MOD.SOURCE_IMAGE_BLOB_SHA,
                    "human_review": "false"})
    return production, comparison, audit

class ReauditValidatorTests(unittest.TestCase):
    def test_valid_144_row_correction_ledger_passes(self):
        p, c, a = fixture()
        result = MOD.validate(p, c, a)
        self.assertEqual(result["validation"], "PASS")
        self.assertEqual(result["production_comparison_reaudit_matches"], 144)
        self.assertEqual(result["historical_mismatches_preserved"], 1)
        self.assertEqual(result["corrected_rows"], 1)
        self.assertEqual(result["phase5"], "LOCKED")

    def test_original_wrong_value_cannot_be_reintroduced(self):
        p, c, a = fixture()
        row = next(x for x in p if x["source_id"] == CORRECTED_ID)
        row["measurement_value"] = "81.35"
        self.assertEqual(MOD.validate(p, c, a)["validation"], "FAIL")

    def test_source_hash_change_fails(self):
        p, c, a = fixture()
        a[0]["source_pdf_sha256"] = "0" * 64
        self.assertEqual(MOD.validate(p, c, a)["validation"], "FAIL")

    def test_human_review_cannot_be_fabricated(self):
        p, c, a = fixture()
        a[0]["human_review"] = "true"
        self.assertEqual(MOD.validate(p, c, a)["validation"], "FAIL")

    def test_missing_reaudit_row_fails(self):
        p, c, a = fixture()
        self.assertEqual(MOD.validate(p, c, a[:-1])["validation"], "FAIL")

    def test_duplicate_key_fails(self):
        p, c, a = fixture()
        a[-1]["source_id"] = a[0]["source_id"]
        self.assertEqual(MOD.validate(p, c, a)["validation"], "FAIL")

    def test_ledger_cannot_claim_multiple_source_discrepancies(self):
        p, c, a = fixture()
        a[0]["comparison_status_before_correction"] = "MISMATCH"
        self.assertEqual(MOD.validate(p, c, a)["validation"], "FAIL")

if __name__ == "__main__":
    unittest.main()
