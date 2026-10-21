#!/usr/bin/env python3
import sys
import unittest
from pathlib import Path

from evaluate_water_reference import evaluate


class WaterReferenceEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workbook = Path(sys.argv[1])
        del sys.argv[1]
        cls.result = evaluate(cls.workbook)

    def test_baseline_statistics_are_not_model_validation(self):
        self.assertEqual(self.result["status"], "DESCRIPTIVE_BASELINE_ONLY_NO_MODEL_VALIDATION")
        self.assertEqual(self.result["baseline_comparison"]["classification"], "DESCRIPTIVE_BASELINE_COMPARISON_NOT_MODEL_VALIDATION")
        self.assertIsNone(self.result["model_validation_metrics"])
        self.assertEqual(self.result["matching"]["eligible_for_direct_formula_prediction_validation"], 0)
        self.assertFalse(self.result["matching"]["formula_inputs_available_for_detergent_samples"])

    def test_verified_water_source_rows_and_grouped_metrics(self):
        self.assertEqual(len(self.result["lineage"]), 42)
        self.assertEqual(self.result["baseline_comparison"]["pointwise_correlated_flow_curve_rows"]["n"], 42)
        self.assertEqual(self.result["baseline_comparison"]["curve_means_grouped_by_source_sample_label"]["n"], 3)
        self.assertEqual(self.result["matching"]["detergent_formula_rows_excluded"], 168)
        self.assertEqual(self.result["matching"]["comparability"], "descriptive_only_temperature_not_matched")

    def test_units_and_lineage_are_preserved(self):
        first = self.result["lineage"][0]
        self.assertEqual(first["source_row"], 3)
        self.assertEqual(first["observed_viscosity_cP"], first["observed_viscosity_Pa_s"] * 1000.0)
        self.assertEqual(self.result["source"]["sha256"], "90ee8648151c2df423355650db1f82420317a53d4d3de1717ea9d4b34b61d590")


if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]], verbosity=2)



