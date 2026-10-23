import importlib.util
import math
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("validate_pusic_2006_r460.py")
SPEC = importlib.util.spec_from_file_location("pusic_validator", SCRIPT)
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


def make_rows():
    rows = []
    table_map = validator.EXPECTED_BY_TABLE
    for table, (fabric, form, unit, doses) in table_map.items():
        for condition in ("before", "dose_1", "dose_2", "dose_3"):
            for stain in sorted(validator.STAINS):
                dosage = "" if condition == "before" else str(
                    doses[{"dose_1": 0, "dose_2": 1, "dose_3": 2}[condition]]
                )
                dosage_unit = "" if condition == "before" else unit
                rows.append({
                    "source_id": "PUSIC2006",
                    "paper_citation": "Pusic et al. (2006), Tekstil 55(1), 11-18",
                    "publisher_url": "https://www.tekstil.hist.hr/index.php/tekstil/article/view/3174",
                    "pdf_url": "https://tekstil.hist.hr/index.php/tekstil/article/download/3174/3174/3174",
                    "printed_page": "13",
                    "table_number": str(table),
                    "table_cell": "fixture",
                    "fabric": fabric,
                    "detergent_form": form,
                    "condition_label": condition,
                    "dosage_value": dosage,
                    "dosage_unit": dosage_unit,
                    "stain_or_control": stain,
                    "measurement_name": "R460_nm",
                    "measurement_value": "42.5",
                    "measurement_unit_status": "UNIT_UNSPECIFIED_IN_SOURCE_TABLE",
                    "transcription_status": "SOURCE_BACKED",
                    "reviewer_1": "reviewer-a",
                    "reviewer_2": "reviewer-b",
                    "review_match": "true",
                    "anomaly_flag": "",
                    "notes": "",
                })
    return rows


class PusicValidationTests(unittest.TestCase):
    def test_accepts_complete_structurally_valid_fixture(self):
        self.assertEqual(validator.validate_rows(make_rows()), [])

    def test_rejects_missing_row(self):
        errors = validator.validate_rows(make_rows()[:-1])
        self.assertTrue(any("expected exactly 144" in e for e in errors))

    def test_rejects_duplicate_key(self):
        rows = make_rows()
        rows[-1] = dict(rows[0])
        errors = validator.validate_rows(rows)
        self.assertTrue(any("duplicate table/condition/stain key" in e for e in errors))

    def test_rejects_fabricated_percent_unit(self):
        rows = make_rows()
        rows[0]["measurement_unit_status"] = "percent"
        errors = validator.validate_rows(rows)
        self.assertTrue(any("unit must remain unspecified" in e for e in errors))

    def test_rejects_baseline_zero_dosage(self):
        rows = make_rows()
        rows[0]["dosage_value"] = "0"
        errors = validator.validate_rows(rows)
        self.assertTrue(any("baseline condition must have null/blank dosage_value" in e for e in errors))

    def test_rejects_incorrect_dose_for_table(self):
        rows = make_rows()
        target = next(r for r in rows if r["table_number"] == "5" and r["condition_label"] == "dose_1")
        target["dosage_value"] = "35"
        errors = validator.validate_rows(rows)
        self.assertTrue(any("dose_1 dosage for table 5 must be 30" in e for e in errors))

    def test_requires_independent_review_of_every_row(self):
        rows = make_rows()
        rows[3]["review_match"] = "false"
        errors = validator.validate_rows(rows)
        self.assertTrue(any("second review gate not met" in e for e in errors))

    def test_rejects_same_person_claimed_as_both_reviewers(self):
        rows = make_rows()
        rows[0]["reviewer_2"] = rows[0]["reviewer_1"]
        errors = validator.validate_rows(rows)
        self.assertTrue(any("different identity" in e for e in errors))
        self.assertTrue(any("second review gate not met" in e for e in errors))

    def test_rejects_nonfinite_measurement(self):
        rows = make_rows()
        rows[0]["measurement_value"] = "nan"
        errors = validator.validate_rows(rows)
        self.assertTrue(any("finite numeric reading" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
