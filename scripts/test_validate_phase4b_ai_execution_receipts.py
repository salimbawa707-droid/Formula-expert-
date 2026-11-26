#!/usr/bin/env python3
"""Negative and positive tests for Phase 4B AI execution receipt validation."""
from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from validate_phase4b_ai_execution_receipts import validate_pair


class ExecutionReceiptTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.vault = self.root / "evidence_vault" / "ai_review"
        self.vault.mkdir(parents=True)
        self.pair = {"pass_a": self._pass("A", "SOURCE_FIRST_TRANSCRIPTION", "10:00:00Z"),
                     "pass_b": self._pass("B", "INDEPENDENT_SOURCE_RECHECK", "10:10:00Z")}
        self.pair["pass_b"]["started_at"] = "2026-11-26T10:10:00Z"
        self.pair["pass_b"]["completed_at"] = "2026-11-26T10:12:00Z"
        self.pair["pass_a"]["started_at"] = "2026-11-26T10:00:00Z"
        self.pair["pass_a"]["completed_at"] = "2026-11-26T10:05:00Z"
        # Both passes pin identical source and protocol bytes.
        for name, content in (("manifest.json", b'{"source":"pinned"}'),
                              ("protocol.md", b"protocol v2")):
            self._write("shared/" + name, content)
        for label in ("A", "B"):
            record = self.pair["pass_" + label.lower()]
            for field, content in (
                ("prompt", (label + " prompt").encode()),
                ("bundle", json.dumps({"included_artifacts": [] if label == "A" else ["evidence_vault/ai_review/shared/manifest.json"]}).encode()),
                ("result", (label + " result").encode()),
                ("receipt", json.dumps({"execution_id": label, "session_id": "session-" + label}).encode()),
            ):
                ref = f"evidence_vault/ai_review/{label.lower()}/{field}.dat"
                self._write(ref.removeprefix("evidence_vault/ai_review/"), content)
                record[field + "_ref"] = ref
                record[field + "_sha256"] = hashlib.sha256(content).hexdigest()
        for label in ("A", "B"):
            record = self.pair["pass_" + label.lower()]
            record["source_manifest_ref"] = "evidence_vault/ai_review/shared/manifest.json"
            record["source_manifest_sha256"] = self._hash(b'{"source":"pinned"}')
            record["protocol_ref"] = "evidence_vault/ai_review/shared/protocol.md"
            record["protocol_sha256"] = self._hash(b"protocol v2")

    def tearDown(self):
        self.tmp.cleanup()

    def _write(self, rel, content):
        path = self.vault / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    @staticmethod
    def _hash(content):
        return hashlib.sha256(content).hexdigest()

    def _pass(self, label, method, start):
        return {
            "method": method, "execution_id": "exec-" + label, "session_id": "session-" + label,
            "model": "declared-model", "started_at": "2026-11-26T" + start,
            "completed_at": "2026-11-26T10:02:00Z",
            "source_manifest_ref": "", "source_manifest_sha256": "",
            "protocol_ref": "", "protocol_sha256": "",
            "prompt_ref": "", "prompt_sha256": "",
            "input_bundle_ref": "", "input_bundle_sha256": "",
            "result_ref": "", "result_sha256": "",
            "receipt_ref": "", "receipt_sha256": "",
        }

    def test_valid_receipts_and_hashes_pass(self):
        self.assertEqual(validate_pair(self.pair, self.root), [])

    def test_same_execution_id_fails(self):
        self.pair["pass_b"]["execution_id"] = self.pair["pass_a"]["execution_id"]
        self.assertTrue(any("distinct execution_id" in e for e in validate_pair(self.pair, self.root)))

    def test_same_session_id_fails(self):
        self.pair["pass_b"]["session_id"] = self.pair["pass_a"]["session_id"]
        self.assertTrue(any("distinct session_id" in e for e in validate_pair(self.pair, self.root)))

    def test_pass_b_before_pass_a_completion_fails(self):
        self.pair["pass_b"]["started_at"] = "2026-11-26T10:04:00Z"
        self.assertTrue(any("after Pass A is complete" in e for e in validate_pair(self.pair, self.root)))

    def test_pass_b_bundle_containing_pass_a_result_fails(self):
        record = self.pair["pass_b"]
        bundle = json.dumps({"included_artifacts": [self.pair["pass_a"]["result_ref"]]}).encode()
        ref = self.vault / record["input_bundle_ref"].removeprefix("evidence_vault/ai_review/")
        ref.write_bytes(bundle)
        record["input_bundle_sha256"] = self._hash(bundle)
        self.assertTrue(any("includes Pass A result" in e for e in validate_pair(self.pair, self.root)))

    def test_tampered_receipt_fails(self):
        record = self.pair["pass_b"]
        ref = self.vault / record["receipt_ref"].removeprefix("evidence_vault/ai_review/")
        ref.write_text('{"tampered":true}')
        self.assertTrue(any("SHA-256 mismatch" in e for e in validate_pair(self.pair, self.root)))

    def test_path_traversal_fails(self):
        self.pair["pass_b"]["result_ref"] = "evidence_vault/ai_review/../../outside"
        self.assertTrue(any("unsafe artifact reference" in e or "outside" in e for e in validate_pair(self.pair, self.root)))

    def test_passes_must_share_same_source_manifest(self):
        self.pair["pass_b"]["source_manifest_sha256"] = "0" * 64
        self.assertTrue(any("share pinned source_manifest_sha256" in e for e in validate_pair(self.pair, self.root)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
