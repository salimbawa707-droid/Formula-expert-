import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("compare_pusic_ai_source_review.py")
SPEC = importlib.util.spec_from_file_location("pusic_ai_source_review", SCRIPT)
review = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(review)


def fixture_rows():
    production = []
    transcript = []
    stains = [
        "black_coffee", "red_wine", "cocoa", "blood", "pumpkin_seed_oil",
        "lipstick", "pureed_tomato", "shoe_cream", "standard_fabric_control",
    ]
    conditions = ["before", "dose_1", "dose_2", "dose_3"]
    for table in (5, 6, 7, 8):
        for condition in conditions:
            for stain in stains:
                key = (str(table), condition, stain)
                value = "42.5"
                source_id = f"t{table}_{condition}_{stain}"
                production.append({
                    "table_number": key[0],
                    "condition_label": key[1],
                    "stain_or_control": key[2],
                    "source_id": source_id,
                    "measurement_value": value,
                })
                transcript.append({
                    "table_number": key[0],
                    "condition_label": key[1],
                    "stain_or_control": key[2],
                    "source_id": source_id,
                    "source_pdf_sha256": review.EXPECTED_PDF_SHA256,
                    "ai_model": "Codex GPT-6",
                    "review_method": review.EXPECTED_METHOD,
                    "ai_source_transcribed_value": value,
                    "production_value": value,
                    "comparison_status": "MATCH",
                    "human_review": "false",
                })
    return production, transcript


class AiSourceReviewTests(unittest.TestCase):
    def test_accepts_144_exact_ai_source_matches_without_claiming_human_review(self):
        production, transcript = fixture_rows()
        report = review.compare_rows(production, transcript, review.EXPECTED_PDF_SHA256)
        self.assertEqual(report["validation"], "PASS")
        self.assertEqual(report["matches"], 144)
        self.assertFalse(report["human_review"])
        self.assertFalse(report["lab_validated"])
        self.assertEqual(report["phase4b"], "OPEN")
        self.assertEqual(report["phase5"], "LOCKED")

    def test_rejects_numeric_mismatch(self):
        production, transcript = fixture_rows()
        transcript[0]["ai_source_transcribed_value"] = "42.6"
        report = review.compare_rows(production, transcript, review.EXPECTED_PDF_SHA256)
        self.assertEqual(report["validation"], "FAIL")
        self.assertEqual(len(report["mismatches"]), 1)

    def test_rejects_missing_reading(self):
        production, transcript = fixture_rows()
        report = review.compare_rows(production, transcript[:-1], review.EXPECTED_PDF_SHA256)
        self.assertEqual(report["validation"], "FAIL")
        self.assertTrue(any("Expected 144 AI readings" in error for error in report["errors"]))

    def test_rejects_human_review_claim(self):
        production, transcript = fixture_rows()
        transcript[0]["human_review"] = "true"
        report = review.compare_rows(production, transcript, review.EXPECTED_PDF_SHA256)
        self.assertEqual(report["validation"], "FAIL")
        self.assertTrue(any("must not claim human review" in error for error in report["errors"]))

    def test_rejects_tampered_recorded_production_value(self):
        production, transcript = fixture_rows()
        transcript[0]["production_value"] = "999"
        report = review.compare_rows(production, transcript, review.EXPECTED_PDF_SHA256)
        self.assertEqual(report["validation"], "FAIL")
        self.assertTrue(any("production_value differs" in error for error in report["errors"]))

    def test_rejects_wrong_ai_model(self):
        production, transcript = fixture_rows()
        transcript[0]["ai_model"] = "Human reviewer"
        report = review.compare_rows(production, transcript, review.EXPECTED_PDF_SHA256)
        self.assertEqual(report["validation"], "FAIL")
        self.assertTrue(any("AI model provenance" in error for error in report["errors"]))

    def test_rejects_wrong_source_pdf_hash(self):
        production, transcript = fixture_rows()
        report = review.compare_rows(production, transcript, "0" * 64)
        self.assertEqual(report["validation"], "FAIL")
        self.assertTrue(any("SHA-256" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
