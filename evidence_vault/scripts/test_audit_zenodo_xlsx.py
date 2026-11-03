"""Fail-closed CLI checks for the Zenodo XLSX audit."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("audit_zenodo_xlsx.py")
NAMES = [
    "Supplementary_SolutionFlowCurves.xlsx",
    "Supplementary_FilmThickness_v1.xlsx",
    "Supplementary_BubbleSizes_v1.xlsx",
    "Supplementary_RheometerData_v2.xlsx",
]


class AuditCliTests(unittest.TestCase):
    def run_audit(self, folder):
        proc = subprocess.run(
            [sys.executable, str(SCRIPT), str(folder)],
            check=True, capture_output=True, text=True,
        )
        return json.loads(proc.stdout)

    def test_missing_files_are_blocked(self):
        with tempfile.TemporaryDirectory() as temp:
            report = self.run_audit(temp)
        self.assertTrue(all(item["status"] == "BLOCKED" for item in report["files"]))

    def test_malformed_workbook_fails_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            (Path(temp) / NAMES[0]).write_bytes(b"not an xlsx archive")
            report = self.run_audit(temp)
        first = report["files"][0]
        self.assertEqual(first["status"], "FAIL")
        self.assertEqual(first["parser"]["result"], "FAIL")

    def test_real_workbook_manifest_counts_reconcile(self):
        # Optional path argument lets CI or a maintainer point this check at the
        # repository's canonical workbook directory; default is the local raw set.
        source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads"
        if not all((source / name).is_file() for name in NAMES):
            self.skipTest("canonical source workbooks are not available to this test run")
        report = self.run_audit(source)
        self.assertTrue(all(item["status"] == "PARSED" for item in report["files"]))
        for item in report["files"]:
            self.assertTrue(item["repo_expected_sha256_match"])
            self.assertTrue(item["zenodo_md5_match"])
            self.assertTrue(all(sheet["max_row"] > 0 and sheet["max_column"] > 0
                                for sheet in item["parser"]["sheets"]))


if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])

