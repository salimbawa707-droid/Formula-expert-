#!/usr/bin/env python3
"""Regression tests for the Round-5 generator provenance contract audit."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from round22_round5_generator_provenance_audit import inspect_contract, GENERATOR_HEADERS, COMMITTED_HEADERS

GENERATOR_FIXTURE = r'''
const TARGET_DIR = path.resolve("data/evidence/zenodo_18961871");
publishedAuthorSummary: { source: "Allgood & Jones (2026)", reportedCount: 212 }
const csvLedger = "filename,sheet_name,total_rows,header_rows,metadata_rows,blank_rows,computed_valid_observations";
computedValidObs++;
'''


class Round5GeneratorProvenanceTests(unittest.TestCase):
    def test_detects_generator_path_schema_and_reported_metadata_mismatch(self):
        result = inspect_contract(GENERATOR_FIXTURE, COMMITTED_HEADERS)
        self.assertEqual(result["generator_target_dir"], "data/evidence/zenodo_18961871")
        self.assertFalse(result["writes_to_canonical_ledger_directory"])
        self.assertFalse(result["generator_schema_matches_committed_ledger"])
        self.assertTrue(result["author_reported_counts_are_metadata"])
        self.assertTrue(result["generator_computes_numeric_bearing_rows"])
        self.assertFalse(result["generator_derives_historical_27982_from_row_membership"])
        self.assertFalse(result["generator_contract_reproduces_committed_ledger"])

    def test_matching_path_and_schema_with_row_metric_passes_contract(self):
        fixture = (
            'const TARGET_DIR = path.resolve("evidence_vault/datasets/zenodo_18961871"); '
            'const csvLedger = "filename,sheet_name,total_rows,header_rows,metadata_rows,blank_rows,computed_valid_observations"; '
            'computedValidObs++;'
        )
        result = inspect_contract(fixture, GENERATOR_HEADERS)
        self.assertTrue(result["writes_to_canonical_ledger_directory"])
        self.assertTrue(result["generator_schema_matches_committed_ledger"])
        self.assertFalse(result["author_reported_counts_are_metadata"])
        self.assertTrue(result["generator_contract_reproduces_committed_ledger"])

    def test_missing_target_directory_is_not_accepted(self):
        result = inspect_contract("const TARGET_DIR = process.cwd();", COMMITTED_HEADERS)
        self.assertIsNone(result["generator_target_dir"])
        self.assertFalse(result["generator_contract_reproduces_committed_ledger"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
