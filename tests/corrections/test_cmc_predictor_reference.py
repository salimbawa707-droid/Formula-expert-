"""Guardrail tests for correction package source and license metadata gate."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src/engines/surfactant/cmcPredictor.ts"
SCRIPT = ROOT / "scripts/validation/check_dataset_licenses.py"

class CorrectionSafetyTests(unittest.TestCase):
    def test_predictor_is_fail_closed_and_not_fabricating_placeholders(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn('"UNAVAILABLE"', source)
        self.assertIn('"MODEL_NOT_WIRED"', source)
        self.assertIn('"MODEL_PREDICTION_NOT_LAB_VALIDATED"', source)
        self.assertNotIn('"PUBLISHED_MODEL" | "ESTIMATED" | "LAB_VALIDATED"', source)
        self.assertIn("validConfidence", source)
        self.assertIn("validAdapterMetadata", source)
        self.assertIn("typeof c.smiles !== \"string\"", source)
        self.assertNotIn("value: 1.0, // mM — placeholder", source)
        self.assertNotIn("value: 1.2,", source)

    def test_clint_validates_values_and_fraction(self):
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("positiveFinite(cmc1_mM)", source)
        self.assertIn("positiveFinite(cmc2_mM)", source)
        self.assertIn("x1 <= 0 || x1 >= 1", source)

    def load_checker(self):
        spec = importlib.util.spec_from_file_location("license_checker", SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_license_match_is_exact_and_requires_source_url(self):
        checker = self.load_checker()
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "manifest.json"
            p.write_text('[{"name":"valid","license_id":"CC-BY-4.0","source_url":"https://example.org/license"}]', encoding="utf-8")
            self.assertEqual(checker.check_manifest(p), [])
            p.write_text('[{"name":"substring","license_id":"not-CC-BY-4.0-ish","source_url":"https://example.org"}]', encoding="utf-8")
            self.assertTrue(checker.check_manifest(p))
            p.write_text('[{"name":"no-url","license_id":"MIT"}]', encoding="utf-8")
            self.assertTrue(checker.check_manifest(p))

if __name__ == "__main__":
    unittest.main()
