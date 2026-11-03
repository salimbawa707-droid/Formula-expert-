import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("compare_pusic_independent_review.py")
SPEC = importlib.util.spec_from_file_location("pusic_review_compare", SCRIPT)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def fixtures():
    source = []
    review = []
    for i in range(144):
        key = f"record_{i:03d}"
        source.append({
            "source_id": key,
            "table_number": "5",
            "table_cell": f"Table 5 / row 1 / col {i}",
            "fabric": "cotton",
            "detergent_form": "powder",
            "condition_label": "before",
            "dosage_value": "",
            "dosage_unit": "",
            "stain_or_control": "black_coffee",
            "measurement_name": "R460_nm",
            "measurement_value": f"{i}.25",
            "reviewer_1": "source-extractor",
        })
        review.append({
            "source_id": key,
            "table_number": "5",
            "table_cell": f"Table 5 / row 1 / col {i}",
            "fabric": "cotton",
            "detergent_form": "powder",
            "condition_label": "before",
            "dosage_value": "",
            "dosage_unit": "",
            "stain_or_control": "black_coffee",
            "measurement_name": "R460_nm",
            "independent_transcribed_value": f"{i}.25",
            "independent_reviewer": "independent-reviewer",
            "review_date": "2026-10-23",
            "protocol_version": "1.0.0",
            "discrepancy_flag": "",
            "discrepancy_notes": "",
        })
    return source, review


class IndependentReviewComparisonTests(unittest.TestCase):
    def test_accepts_144_matching_values(self):
        source, review = fixtures()
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "PASS")
        self.assertEqual(result["matched"], 144)
        self.assertEqual(result["mismatch_count"], 0)
        self.assertEqual(result["expected_records"], 144)
        self.assertEqual(result["reviewed_records"], 144)
        self.assertEqual(result["phase4b"], "OPEN")
        self.assertEqual(result["phase5"], "LOCKED")
        self.assertIn("FINAL OUTCOME: PASS", result["human_readable_summary"])

    def test_flags_numeric_mismatch(self):
        source, review = fixtures()
        review[5]["independent_transcribed_value"] = "999.0"
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(result["mismatch_count"], 1)
        self.assertEqual(result["mismatches"][0]["source_id"], "record_005")
        self.assertEqual(result["mismatches"][0]["independent_value"], "999.0")
        self.assertTrue(any("numeric transcription mismatches" in e for e in result["errors"]))

    def test_fails_when_review_value_blank(self):
        source, review = fixtures()
        review[0]["independent_transcribed_value"] = ""
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(len(result["missing_review_values"]), 1)
        self.assertTrue(any("review values are blank" in e for e in result["errors"]))

    def test_fails_when_reviewer_identity_missing(self):
        source, review = fixtures()
        review[0]["independent_reviewer"] = ""
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertTrue(any("independent_reviewer is blank" in e for e in result["errors"]))

    def test_fails_when_same_person_claimed_as_independent_reviewer(self):
        source, review = fixtures()
        review[0]["independent_reviewer"] = "SOURCE-EXTRACTOR"
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertTrue(any("not independent" in e for e in result["errors"]))

    def test_fails_duplicate_source_id(self):
        source, review = fixtures()
        source[1]["source_id"] = source[0]["source_id"]
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertTrue(any("duplicate source_id in source CSV" in e for e in result["errors"]))

    def test_fails_missing_records(self):
        source, review = fixtures()
        del review[-1]  # 143 records instead of 144
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertTrue(any("source IDs missing from review worksheet" in e for e in result["errors"]))

    def test_fails_extra_records(self):
        source, review = fixtures()
        extra = dict(review[0])
        extra["source_id"] = "unexpected_record_999"
        review.append(extra)
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertTrue(any("unknown source IDs in review worksheet" in e for e in result["errors"]))

    def test_fails_unreadable_records(self):
        source, review = fixtures()
        review[3]["independent_transcribed_value"] = "UNREADABLE"
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(result["unreadable_count"], 1)
        self.assertIn("record_003", result["unreadable_records"])
        self.assertTrue(any("unreadable/illegible" in e for e in result["errors"]))

    def test_fails_unresolved_flag(self):
        source, review = fixtures()
        review[4]["discrepancy_flag"] = "UNRESOLVED"
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(result["unresolved_count"], 1)
        self.assertIn("record_004", result["unresolved_records"])
        self.assertTrue(any("unresolved discrepancies" in e for e in result["errors"]))

    def test_fails_invalid_review_date_format(self):
        source, review = fixtures()
        review[0]["review_date"] = "10/23/2026"  # Not ISO YYYY-MM-DD
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertTrue(any("review_date must be formatted as YYYY-MM-DD" in e for e in result["errors"]))

    def test_accepts_valid_iso_review_date(self):
        source, review = fixtures()
        for r in review:
            r["review_date"] = "2026-10-23"
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "PASS")
        self.assertEqual(result["review_dates"], ["2026-10-23"])

    def test_fail_closed_status_and_phase_locks(self):
        source, review = fixtures()
        review[0]["independent_transcribed_value"] = ""
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(result["phase4b"], "OPEN")
        self.assertEqual(result["phase5"], "LOCKED")
        self.assertFalse(result["lab_validated"])

    def test_reproducibility_of_comparison(self):
        source, review = fixtures()
        res1 = module.compare_rows(source, review)
        res2 = module.compare_rows(source, review)
        # Verify deterministic values
        self.assertEqual(res1["matched"], res2["matched"])
        self.assertEqual(res1["validation"], res2["validation"])
        self.assertEqual(res1["mismatch_count"], res2["mismatch_count"])
        self.assertEqual(res1["errors"], res2["errors"])

    def test_reconciliation_csv_export(self):
        source, review = fixtures()
        review[1]["independent_transcribed_value"] = "99.9"  # Mismatch
        review[2]["independent_transcribed_value"] = "UNREADABLE"
        review[3]["independent_transcribed_value"] = ""  # Pending

        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp_path = Path(tmp.name)

        try:
            module.export_reconciliation_csv(source, review, tmp_path)
            rows = module.read_csv(str(tmp_path))
            self.assertEqual(len(rows), 144)
            self.assertEqual(rows[0]["match_status"], "MATCHED")
            self.assertEqual(rows[0]["reconciliation_resolution"], "VERIFIED_MATCH")
            self.assertEqual(rows[1]["match_status"], "MISMATCH")
            self.assertEqual(rows[1]["reconciliation_resolution"], "DISCREPANCY_REQUIRES_SOURCE_ARBITRATION")
            self.assertEqual(rows[2]["match_status"], "UNREADABLE")
            self.assertEqual(rows[3]["match_status"], "PENDING_SECOND_REVIEW")
        finally:
            if tmp_path.exists():
                tmp_path.unlink()


if __name__ == "__main__":
    unittest.main()

