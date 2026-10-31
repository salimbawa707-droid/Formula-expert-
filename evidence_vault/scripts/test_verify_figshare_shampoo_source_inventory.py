#!/usr/bin/env python3
"""Regression tests for verify_figshare_shampoo_source_inventory.py."""
from __future__ import annotations
import importlib.util, json, tempfile, unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "figshare_verifier", HERE / "verify_figshare_shampoo_source_inventory.py"
)
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)

VALID_CSV = """source_id,source,title_or_file,source_type,license_status,sha256_or_md5,engine_family,applicability,status,next_action
SRC-FIGSHARE-25451878,https://api.figshare.com/v2/articles/25451878,"LiquidFormulationsDataset_2023.json (file 45187180)",published_raw_experiment,CC0_OFFICIAL_API_METADATA_VERIFIED,"official-md5:8898e7b460c71e334f6ece5daebc6a6e;mirror-sha256:3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd",shampoo rheology,not matched,STATUS,action
"""

VALID_TS = """
export const INITIAL_VAULT_STATE = {
  originalUrl: 'https://api.figshare.com/v2/articles/25451878',
  sizeBytes: 1464630,
  sha256Hash: '3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd',
  md5: '8898e7b460c71e334f6ece5daebc6a6e',
};
"""

VALID_MANIFEST = json.dumps({
    "errorsAndLimitations": [
        "Prior user permission response limited network action to GitHub inspection only; external dataset bytes were not retrieved."
    ]
})

class FigshareVerifierTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.reg = self.root / "source-register.csv"
        self.ts = self.root / "initialData.ts"
        self.manifest = self.root / "dataset_integrity_manifest.json"
        self.dataset_dir = self.root / "figshare_25451878"

        self.reg.write_text(VALID_CSV, encoding="utf-8")
        self.ts.write_text(VALID_TS, encoding="utf-8")
        self.manifest.write_text(VALID_MANIFEST, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def run_verify(self):
        return MOD.verify_inventory(
            root_dir=self.root,
            source_register_path=self.reg,
            initial_data_path=self.ts,
            manifest_path=self.manifest,
            dataset_dir=self.dataset_dir,
        )

    def test_1_registry_metadata_matches(self):
        import hashlib
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        main_file = self.dataset_dir / "LiquidFormulationsDataset_2023.json"
        main_file.write_bytes(b"dummy")

        orig_size, orig_md5, orig_sha = MOD.EXPECTED_MAIN_SIZE, MOD.EXPECTED_MAIN_MD5, MOD.EXPECTED_MAIN_SHA256
        dummy_md5 = hashlib.md5(b"dummy").hexdigest()
        dummy_sha = hashlib.sha256(b"dummy").hexdigest()
        MOD.EXPECTED_MAIN_SIZE = 5
        MOD.EXPECTED_MAIN_MD5 = dummy_md5
        MOD.EXPECTED_MAIN_SHA256 = dummy_sha

        synth_csv = VALID_CSV.replace("8898e7b460c71e334f6ece5daebc6a6e", dummy_md5).replace("3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd", dummy_sha)
        synth_ts = VALID_TS.replace("8898e7b460c71e334f6ece5daebc6a6e", dummy_md5).replace("3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd", dummy_sha).replace("1464630", "5")
        self.reg.write_text(synth_csv, encoding="utf-8")
        self.ts.write_text(synth_ts, encoding="utf-8")

        try:
            report = self.run_verify()
            self.assertEqual(report["registry_metadata_status"], "PASS")
            self.assertEqual(report["local_binary_status"], "PASS")
            self.assertEqual(report["errors"], [])
        finally:
            MOD.EXPECTED_MAIN_SIZE, MOD.EXPECTED_MAIN_MD5, MOD.EXPECTED_MAIN_SHA256 = orig_size, orig_md5, orig_sha

    def test_2_registry_metadata_conflicts(self):
        bad_csv = VALID_CSV.replace("8898e7b460c71e334f6ece5daebc6a6e", "11111111111111111111111111111111")
        self.reg.write_text(bad_csv, encoding="utf-8")
        report = self.run_verify()
        self.assertEqual(report["registry_metadata_status"], "FAIL")
        self.assertTrue(any("MD5 mismatch" in err for err in report["errors"]))

    def test_3_dataset_directory_absent_and_documented_unpinned(self):
        report = self.run_verify()
        self.assertEqual(report["registry_metadata_status"], "PASS")
        self.assertEqual(report["local_binary_status"], "UNPINNED_DATASET_ABSENT")
        self.assertTrue(any("Dataset binary directory is absent" in lim for lim in report["limitations"]))
        self.assertTrue(any("binary verification failed closed" in err for err in report["errors"]))

    def test_4_required_binary_missing_from_pinned_inventory(self):
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        report = self.run_verify()
        self.assertEqual(report["local_binary_status"], "FAIL")
        self.assertTrue(any("missing required main file" in err for err in report["errors"]))

    def test_5_file_size_mismatch(self):
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        main_file = self.dataset_dir / "LiquidFormulationsDataset_2023.json"
        main_file.write_bytes(b"short content")
        report = self.run_verify()
        self.assertEqual(report["local_binary_status"], "FAIL")
        self.assertTrue(any("Binary size mismatch" in err for err in report["errors"]))

    def test_6_md5_mismatch(self):
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        main_file = self.dataset_dir / "LiquidFormulationsDataset_2023.json"
        # Write exactly 1464630 bytes of dummy zeroes
        main_file.write_bytes(b"0" * 1464630)
        report = self.run_verify()
        self.assertEqual(report["local_binary_status"], "FAIL")
        self.assertTrue(any("MD5 mismatch" in err for err in report["errors"]))

    def test_7_sha256_mismatch(self):
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        main_file = self.dataset_dir / "LiquidFormulationsDataset_2023.json"
        main_file.write_bytes(b"X" * 1464630)
        report = self.run_verify()
        self.assertEqual(report["local_binary_status"], "FAIL")
        self.assertTrue(any("MD5 mismatch" in err or "SHA-256 mismatch" in err for err in report["errors"]))

    def test_8_all_registered_files_and_checksums_match(self):
        import hashlib
        dummy_bytes = b"dummy"
        dummy_md5 = hashlib.md5(dummy_bytes).hexdigest()
        dummy_sha = hashlib.sha256(dummy_bytes).hexdigest()
        dummy_size = len(dummy_bytes)

        # Update synthetic fixtures to match dummy hashes
        synth_csv = VALID_CSV.replace("8898e7b460c71e334f6ece5daebc6a6e", dummy_md5).replace("3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd", dummy_sha)
        synth_ts = VALID_TS.replace("8898e7b460c71e334f6ece5daebc6a6e", dummy_md5).replace("3a195870782e6fd87bdd7499cbb4fe201d025b2cda05f9eee9fb9477f34b58bd", dummy_sha).replace("1464630", str(dummy_size))

        self.reg.write_text(synth_csv, encoding="utf-8")
        self.ts.write_text(synth_ts, encoding="utf-8")

        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        main_file = self.dataset_dir / "LiquidFormulationsDataset_2023.json"
        main_file.write_bytes(dummy_bytes)

        orig_size, orig_md5, orig_sha = MOD.EXPECTED_MAIN_SIZE, MOD.EXPECTED_MAIN_MD5, MOD.EXPECTED_MAIN_SHA256
        MOD.EXPECTED_MAIN_SIZE = dummy_size
        MOD.EXPECTED_MAIN_MD5 = dummy_md5
        MOD.EXPECTED_MAIN_SHA256 = dummy_sha
        try:
            report = self.run_verify()
            self.assertEqual(report["registry_metadata_status"], "PASS")
            self.assertEqual(report["local_binary_status"], "PASS")
            self.assertEqual(report["errors"], [])
        finally:
            MOD.EXPECTED_MAIN_SIZE, MOD.EXPECTED_MAIN_MD5, MOD.EXPECTED_MAIN_SHA256 = orig_size, orig_md5, orig_sha

    def test_9_invalid_or_incomplete_registry_records(self):
        self.reg.write_text("invalid_csv_header\nfoo,bar\n", encoding="utf-8")
        report = self.run_verify()
        self.assertEqual(report["registry_metadata_status"], "FAIL")
        self.assertTrue(len(report["errors"]) > 0)

    def test_10_missing_metadata_never_interpreted_as_verified_binary_content(self):
        self.ts.write_text("export const empty = {};", encoding="utf-8")
        report = self.run_verify()
        self.assertEqual(report["registry_metadata_status"], "FAIL")
        self.assertNotEqual(report["local_binary_status"], "PASS")

if __name__ == "__main__":
    unittest.main()
