#!/usr/bin/env python3
"""Policy and schema regression checks for the Task 3 evidence audit.

These tests use small in-memory policy fixtures only; they are not scientific data.
"""
from __future__ import annotations
import csv
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets"

def commercial_clear(candidate):
    return candidate.get("dataset_level_license") not in ("", "UNKNOWN", "UNVERIFIED") and candidate.get("commercial_reuse", "").startswith("PERMITTED")

def evaluation_eligible(row):
    required = ("input_match", "condition_match", "provenance_lineage", "group_leakage_control", "engine_available", "license_gate", "holdout_status")
    if row.get("engine_available", "").startswith("NO"):
        return False
    if row.get("license_gate", "").startswith("UNKNOWN") or row.get("license_gate", "").startswith("NOT"):
        return False
    if row.get("input_match", "").startswith("NO") or row.get("input_match", "").startswith("NOT"):
        return False
    if row.get("condition_match", "").startswith("NOT") or row.get("condition_match", "").startswith("HETEROGENEOUS"):
        return False
    if any(not row.get(k) or row[k].lower() in ("unknown", "not inspected", "not available", "none") for k in required[2:4]):
        return False
    return row.get("holdout_status") == "INDEPENDENT_GROUP_HOLDOUT_READY"

class Task3AuditPolicyTests(unittest.TestCase):
    def setUp(self):
        with (DATA / "public_dataset_candidates.csv").open(encoding="utf-8", newline="") as f:
            self.candidates = list(csv.DictReader(f))
        with (DATA / "engine_dataset_applicability_matrix.csv").open(encoding="utf-8", newline="") as f:
            self.matrix = list(csv.DictReader(f))
        self.manifest = json.loads((DATA / "dataset_integrity_manifest.json").read_text(encoding="utf-8"))

    def test_unknown_license_is_not_commercially_cleared(self):
        c = next(x for x in self.candidates if x["candidate_id"] == "DS-FOAM-10226823")
        self.assertEqual(c["commercial_reuse"], "UNKNOWN")
        self.assertFalse(commercial_clear(c))
        self.assertFalse(commercial_clear({"dataset_level_license": "UNVERIFIED", "commercial_reuse": "PERMITTED"}))

    def test_missing_formula_inputs_block_pairing(self):
        row = {"input_match": "NO_FORMULA_INPUTS", "condition_match": "MATCHED", "provenance_lineage": "traceable", "group_leakage_control": "grouped", "engine_available": "YES", "license_gate": "CC_BY", "holdout_status": "INDEPENDENT_GROUP_HOLDOUT_READY"}
        self.assertFalse(evaluation_eligible(row))

    def test_unit_conversion_must_be_explicit_and_dimensionally_valid(self):
        conversions = {("Pa*s", "mPa*s"): 1000.0, ("cP", "mPa s"): 1.0}
        self.assertEqual(conversions[("Pa*s", "mPa*s")], 1000.0)
        self.assertNotIn(("mm", "mL/min"), conversions)
        self.assertNotIn(("log10(uM)", "cP"), conversions)

    def test_derived_observation_requires_parent_and_transformation_lineage(self):
        derived = {"observation_kind": "DERIVED", "parent_observation_id": "", "transformation": "pixel conversion"}
        self.assertFalse(derived["parent_observation_id"] and derived["transformation"])
        derived["parent_observation_id"] = "source-row-1"
        self.assertTrue(derived["parent_observation_id"] and derived["transformation"])

    def test_duplicate_rows_and_shared_groups_are_not_independent(self):
        observations = [{"id": "a", "group": "curve-1"}, {"id": "a", "group": "curve-1"}, {"id": "b", "group": "curve-1"}]
        self.assertEqual(len({x["id"] for x in observations}), 2)
        self.assertEqual(len({x["group"] for x in observations}), 1)
        self.assertNotEqual(len(observations), len({x["group"] for x in observations}))

    def test_unavailable_engine_cannot_pass_gate(self):
        row = {"input_match": "MATCHED", "condition_match": "MATCHED", "provenance_lineage": "traceable", "group_leakage_control": "grouped", "engine_available": "NO", "license_gate": "CC_BY", "holdout_status": "INDEPENDENT_GROUP_HOLDOUT_READY"}
        self.assertFalse(evaluation_eligible(row))
        foam = next(x for x in self.matrix if x["engine_id"] == "ENG-005")
        self.assertEqual(foam["engine_available"], "NO")
        self.assertFalse(evaluation_eligible(foam))

    def test_hash_and_parser_status_are_truthful(self):
        self.assertEqual(self.manifest["newlyDownloadedFiles"], [])
        self.assertEqual(self.manifest["externalCandidateFileStatus"], "DOWNLOAD_NOT_VERIFIED")
        self.assertEqual(self.manifest["newHashes"], [])
        self.assertEqual(self.manifest["parserResults"]["externalCandidateFiles"], "NOT_RUN_NOT_DOWNLOADED")

    def test_no_metrics_without_matched_evidence(self):
        self.assertEqual(self.manifest["evaluationMetrics"]["task3NewMetrics"], "NONE")
        self.assertEqual(self.manifest["phase4b"], "OPEN")
        self.assertEqual(self.manifest["phase5"], "LOCKED")
        self.assertFalse(any(r["eligibility"] == "ELIGIBLE_FOR_HELD_OUT_EVALUATION" for r in self.matrix))

    def test_every_candidate_has_explicit_license_and_reuse_status(self):
        self.assertTrue(self.candidates)
        for c in self.candidates:
            self.assertTrue(c["dataset_level_license"])
            self.assertTrue(c["commercial_reuse"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
