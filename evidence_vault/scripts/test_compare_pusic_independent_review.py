import importlib.util
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
        source.append({"source_id": key, "measurement_value": f"{i}.25", "reviewer_1": "source-extractor"})
        review.append({"source_id": key, "independent_transcribed_value": f"{i}.25",
                       "independent_reviewer": "independent-reviewer"})
    return source, review


class IndependentReviewComparisonTests(unittest.TestCase):
    def test_accepts_144_matching_values(self):
        source, review = fixtures()
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "PASS")
        self.assertEqual(result["matched"], 144)

    def test_flags_numeric_mismatch(self):
        source, review = fixtures()
        review[5]["independent_transcribed_value"] = "999"
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(result["mismatch_count"], 1)

    def test_fails_when_review_value_blank(self):
        source, review = fixtures()
        review[0]["independent_transcribed_value"] = ""
        result = module.compare_rows(source, review)
        self.assertEqual(result["validation"], "FAIL")
        self.assertEqual(len(result["missing_review_values"]), 1)

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


if __name__ == "__main__":
    unittest.main()
