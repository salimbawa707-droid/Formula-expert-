#!/usr/bin/env python3
"""Regression controls for the ENG-002 ideal Clint benchmark.

Synthetic rows in unit tests are equation/policy fixtures only; never scientific evidence.
"""
from __future__ import annotations

import importlib.util
import math
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("benchmark_clint_cmc.py")
SPEC = importlib.util.spec_from_file_location("benchmark_clint_cmc", SCRIPT)
benchmark = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(benchmark)


def row(smile_a, xa, smile_b, xb, log_cmc):
    return {
        "smile_A": smile_a,
        "mol_fraction_A": str(xa),
        "smile_B": smile_b,
        "mol_fraction_B": str(xb),
        "logCMC": str(log_cmc),
    }


class ClintBenchmarkTests(unittest.TestCase):
    def test_hand_checkable_clint_equation(self):
        self.assertAlmostEqual(benchmark.clint_cmc(0.5, 1.0, 0.5, 4.0), 1.6)
        self.assertAlmostEqual(benchmark.clint_cmc(0.5, 10.0, 0.5, 100.0), 18.1818181818, places=8)

    def test_fraction_sum_tolerance_normalizes_reported_values(self):
        got = benchmark.clint_cmc(0.666, 10.0, 0.333, 100.0)
        x1, x2 = 0.666 / 0.999, 0.333 / 0.999
        expected = 1.0 / (x1 / 10.0 + x2 / 100.0)
        self.assertAlmostEqual(got, expected)
        with self.assertRaises(ValueError):
            benchmark.clint_cmc(0.6, 10.0, 0.3, 100.0)

    def test_invalid_and_nonpositive_inputs_are_rejected(self):
        for args in [
            (-0.1, 10.0, 1.1, 100.0),
            (0.5, 0.0, 0.5, 100.0),
            (0.5, 10.0, 0.5, -1.0),
            (float("nan"), 10.0, 0.5, 100.0),
        ]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                benchmark.clint_cmc(*args)

    def test_logarithmic_cmc_is_converted_before_linear_equation(self):
        c1, c2 = 10 ** 2.0, 10 ** 4.0
        predicted = benchmark.clint_cmc(0.5, c1, 0.5, c2)
        self.assertAlmostEqual(predicted, 198.0198019802, places=8)
        self.assertAlmostEqual(math.log10(predicted), math.log10(198.0198019802), places=10)

    def test_missing_endpoint_blocks_all_pairs_without_imputation(self):
        source = [
            row("A-[O-]", 1, "B-[N+]", 0, 1.0),
            row("A-[O-]", 0.5, "B-[N+]", 0.5, 1.2),
        ]
        ledger, systems, result = benchmark.analyze_rows(source, "fixture")
        self.assertEqual(result["counts"]["eligible_mixture_observations"], 0)
        self.assertEqual(systems[0]["exclusion_reason"], "MISSING_PURE_ENDPOINT_COMPONENT_2")
        self.assertTrue(all(r["decision"] == "EXCLUDED" for r in ledger))
        self.assertTrue(all(r["prediction_cmc_uM"] in ("", None) for r in ledger))

    def test_source_row_lineage_and_endpoints_are_not_scored(self):
        source = [
            row("A-[O-]", 1, "B-[N+]", 0, 1.0),
            row("A-[O-]", 0, "B-[N+]", 1, 2.0),
            row("A-[O-]", 0.5, "B-[N+]", 0.5, 1.2),
        ]
        ledger, systems, result = benchmark.analyze_rows(source, "fixture")
        by_id = {r["source_record_id"]: r for r in ledger}
        self.assertEqual(by_id["P2SURF-ROW-000001"]["row_role"], "PURE_ENDPOINT_INPUT")
        self.assertEqual(by_id["P2SURF-ROW-000001"]["decision"], "NOT_SCORED_ENDPOINT_INPUT")
        mixture = by_id["P2SURF-ROW-000003"]
        self.assertEqual(mixture["source_csv_row"], 4)
        self.assertEqual(mixture["endpoint_component_1_record_id"], "P2SURF-ROW-000001")
        self.assertEqual(mixture["endpoint_component_2_record_id"], "P2SURF-ROW-000002")
        self.assertEqual(mixture["decision"], "INCLUDED")
        self.assertEqual(result["counts"]["eligible_endpoint_rows_not_scored"], 2)
        self.assertEqual(result["counts"]["eligible_mixture_observations"], 1)

    def test_duplicate_composition_blocks_system_without_pseudoreplicates(self):
        source = [
            row("A-[O-]", 1, "B-[N+]", 0, 1.0),
            row("A-[O-]", 0, "B-[N+]", 1, 2.0),
            row("A-[O-]", 0.5, "B-[N+]", 0.5, 1.2),
            row("A-[O-]", 0.5, "B-[N+]", 0.5, 1.3),
        ]
        ledger, systems, result = benchmark.analyze_rows(source, "fixture")
        self.assertEqual(result["counts"]["eligible_mixture_observations"], 0)
        self.assertEqual(systems[0]["exclusion_reason"], "DUPLICATE_OR_AMBIGUOUS_COMPOSITION_NO_REPLICATE_ID")
        self.assertTrue(all(r["decision"] == "EXCLUDED" for r in ledger))

    def test_reversed_component_order_uses_one_system_group(self):
        source = [
            row("A-[O-]", 1, "B-[N+]", 0, 1.0),
            row("A-[O-]", 0, "B-[N+]", 1, 2.0),
            row("B-[N+]", 0.25, "A-[O-]", 0.75, 1.2),
        ]
        _, systems, result = benchmark.analyze_rows(source, "fixture")
        self.assertEqual(len(systems), 1)
        self.assertEqual(result["counts"]["binary_systems"], 1)
        self.assertEqual(result["counts"]["eligible_mixture_observations"], 1)

    def test_real_source_hash_counts_and_outputs(self):
        digest = benchmark.verify_dataset_hash()
        source = benchmark.read_source_rows()
        ledger, systems, result = benchmark.analyze_rows(source, digest)
        self.assertEqual(digest, "f269e73d3cdf35e064ee253295d1cf990322cc845d62a4f8bd2414ca21dd0b24")
        self.assertEqual(result["counts"]["source_rows_inspected"], 979)
        self.assertEqual(result["counts"]["nonbinary_same_smiles_rows"], 480)
        self.assertEqual(result["counts"]["binary_systems"], 65)
        self.assertEqual(result["counts"]["systems_with_both_single_endpoints"], 62)
        self.assertEqual(result["counts"]["systems_excluded_missing_endpoint"], 3)
        self.assertEqual(result["counts"]["eligible_endpoint_rows_not_scored"], 124)
        self.assertEqual(result["counts"]["eligible_mixture_observations"], 347)
        self.assertEqual(result["counts"]["composition_sum_rounding_rows"], 4)
        self.assertEqual(result["counts"]["exact_duplicate_source_rows"], 0)
        self.assertEqual(len(ledger), 979)
        self.assertEqual(len(systems), 65)
        benchmark.check_outputs(ledger, systems, result)

    def test_no_claim_of_unseen_system_holdout_or_maturity_promotion(self):
        _, _, result = benchmark.analyze_rows(benchmark.read_source_rows(), benchmark.verify_dataset_hash())
        self.assertFalse(result["status"]["lab_validated"])
        self.assertFalse(result["status"]["pristine_untouched_test"])
        self.assertEqual(result["status"]["phase4b"], "OPEN")
        self.assertEqual(result["status"]["phase5"], "LOCKED")
        self.assertIn("No system or external holdout", result["method"]["evaluation_design"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
