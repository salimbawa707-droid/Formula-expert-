#!/usr/bin/env python3
"""Reproduce the ENG-002 ideal Clint component-level benchmark on P2SURF.

This consumes only the already archived CSV and checks its existing manifest hash.
It does not download data, tune parameters, or mark a finished formula validated.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BENCH = ROOT / "evidence_vault" / "open_reference_benchmarks"
RELATIVE_DATA = "cmc_mixed/p2surf_binary_mixture_cmc.csv"
MANIFEST_PATH = BENCH / "data-manifest.json"
UPSTREAM_COMMIT = "8aa90b9a9d1b2c51df5ce5ed1e863f81eff3f0e8"
FRACTION_SUM_TOLERANCE = 0.00101
LEDGER_PATH = BENCH / "cmc_mixed" / "ideal_clint_pair_ledger.csv"
SYSTEM_PATH = BENCH / "cmc_mixed" / "ideal_clint_per_system_metrics.csv"
RESULT_PATH = BENCH / "cmc_mixed" / "ideal_clint_benchmark_result.json"

LEDGER_FIELDS = [
    "source_file", "source_commit", "source_record_id", "source_csv_row", "system_id",
    "row_role", "component_1_smiles", "component_2_smiles", "source_smile_A",
    "source_mol_fraction_A", "source_smile_B", "source_mol_fraction_B", "fraction_sum",
    "normalized_x1", "normalized_x2", "source_logCMC", "source_unit", "observed_cmc_uM",
    "endpoint_component_1_record_id", "endpoint_component_2_record_id",
    "pure_cmc_component_1_uM", "pure_cmc_component_2_uM", "prediction_cmc_uM",
    "prediction_log10_uM", "prediction_unit", "decision", "exclusion_reason", "lineage_note",
]
SYSTEM_FIELDS = [
    "system_id", "component_1_smiles", "component_2_smiles", "pair_class",
    "source_row_count", "endpoint_component_1_record_id", "endpoint_component_2_record_id",
    "eligible_observation_count", "eligibility", "exclusion_reason", "mae_uM",
    "rmse_uM", "mean_signed_error_uM", "mae_log10", "mean_signed_error_log10",
]


def normalized_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def verify_dataset_hash(data_path: Path = BENCH / RELATIVE_DATA) -> str:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    entry = next((d for d in manifest["datasets"] if d["path"] == RELATIVE_DATA), None)
    if entry is None:
        raise ValueError(f"Dataset path missing from existing manifest: {RELATIVE_DATA}")
    actual = normalized_sha256(data_path)
    expected = entry["sha256"]
    if actual != expected:
        raise ValueError(f"P2SURF SHA-256 mismatch: expected {expected}, got {actual}")
    return actual


def clint_cmc(x1: float, cmc1: float, x2: float, cmc2: float, tolerance: float = FRACTION_SUM_TOLERANCE) -> float:
    """Ideal Clint CMC in the supplied linear concentration unit."""
    vals = (x1, cmc1, x2, cmc2)
    if not all(math.isfinite(v) for v in vals):
        raise ValueError("fractions and endpoint CMC values must be finite")
    if cmc1 <= 0 or cmc2 <= 0:
        raise ValueError("pure-component CMC endpoints must be positive")
    if x1 < 0 or x2 < 0 or x1 > 1 or x2 > 1:
        raise ValueError("mole fractions must lie in [0, 1]")
    total = x1 + x2
    if total <= 0 or abs(total - 1.0) > tolerance:
        raise ValueError(f"mole-fraction sum must be within {tolerance} of one")
    x1, x2 = x1 / total, x2 / total
    return 1.0 / (x1 / cmc1 + x2 / cmc2)


def charge_class(smiles: str) -> str:
    """Match the existing app benchmark's formal-charge classification."""
    main = max(smiles.split("."), key=len)
    positive = "+]" in main
    negative = "-]" in main
    if positive and negative:
        return "zwitterionic"
    if positive:
        return "cationic"
    if negative:
        return "anionic"
    return "nonionic"


def read_source_rows(path: Path = BENCH / RELATIVE_DATA) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    required = {"smile_A", "mol_fraction_A", "smile_B", "mol_fraction_B", "logCMC"}
    if not rows or not required.issubset(rows[0].keys()):
        raise ValueError("P2SURF CSV is empty or required source columns are missing")
    return rows


def _metrics(records: list[dict]) -> dict:
    if not records:
        return {
            "observation_count": 0, "mae_uM": None, "rmse_uM": None,
            "mean_signed_error_uM": None, "mae_log10": None,
            "mean_signed_error_log10": None,
        }
    errors = [r["prediction_uM"] - r["observation_uM"] for r in records]
    log_errors = [math.log10(r["prediction_uM"]) - r["source_logCMC"] for r in records]
    return {
        "observation_count": len(records),
        "mae_uM": sum(abs(e) for e in errors) / len(errors),
        "rmse_uM": math.sqrt(sum(e * e for e in errors) / len(errors)),
        "mean_signed_error_uM": sum(errors) / len(errors),
        "mae_log10": sum(abs(e) for e in log_errors) / len(log_errors),
        "mean_signed_error_log10": sum(log_errors) / len(log_errors),
    }


def analyze_rows(source_rows: list[dict[str, str]], source_sha256: str) -> tuple[list[dict], list[dict], dict]:
    """Create a row-preserving ledger, grouped metrics, and reproducible summary."""
    systems: dict[str, dict] = {}
    self_rows = []
    parsed_rows = []
    exact_signatures = Counter()

    for index, raw in enumerate(source_rows, start=1):
        record = dict(raw)
        record["record_number"] = index
        record["csv_row"] = index + 1
        signature = tuple(raw.get(k, "") for k in ("smile_A", "mol_fraction_A", "smile_B", "mol_fraction_B", "logCMC"))
        exact_signatures[signature] += 1
        if raw["smile_A"] == raw["smile_B"]:
            self_rows.append(record)
            continue

        smiles1, smiles2 = sorted((raw["smile_A"], raw["smile_B"]))
        try:
            fa, fb, log_value = (float(raw[k]) for k in ("mol_fraction_A", "mol_fraction_B", "logCMC"))
            finite = all(math.isfinite(v) for v in (fa, fb, log_value))
            x1, x2 = (fa, fb) if smiles1 == raw["smile_A"] else (fb, fa)
        except (TypeError, ValueError):
            fa = fb = log_value = x1 = x2 = math.nan
            finite = False
        key = f"{smiles1}||{smiles2}"
        item = {
            "raw": record, "smiles1": smiles1, "smiles2": smiles2, "x1": x1, "x2": x2,
            "log": log_value, "finite": finite, "key": key,
        }
        parsed_rows.append(item)
        systems.setdefault(key, {"smiles1": smiles1, "smiles2": smiles2, "rows": []})["rows"].append(item)

    sorted_keys = sorted(systems)
    system_ids = {key: f"P2S-{i:03d}" for i, key in enumerate(sorted_keys, start=1)}
    exact_duplicate_count = sum(max(0, n - 1) for n in exact_signatures.values())
    scored_by_system: dict[str, list[dict]] = defaultdict(list)
    endpoint_refs: dict[str, tuple] = {}
    system_rows: list[dict] = []
    blocked_reason: dict[str, str] = {}

    for key in sorted_keys:
        system = systems[key]
        group = system["rows"]
        x1_endpoints = [item for item in group if item["x1"] == 1.0 and item["x2"] == 0.0]
        x2_endpoints = [item for item in group if item["x2"] == 1.0 and item["x1"] == 0.0]
        invalid = [
            item for item in group
            if (not item["finite"]) or item["x1"] < 0 or item["x1"] > 1 or item["x2"] < 0 or item["x2"] > 1
            or abs(item["x1"] + item["x2"] - 1.0) > FRACTION_SUM_TOLERANCE
        ]
        compositions = Counter((item["x1"], item["x2"]) for item in group)
        duplicates = any(n > 1 for n in compositions.values())
        reason = ""
        if invalid:
            reason = "INVALID_SOURCE_FRACTIONS_OR_LOG_CMC"
        elif len(x1_endpoints) == 0 or len(x2_endpoints) == 0:
            reason = "MISSING_PURE_ENDPOINT_COMPONENT_" + ("1" if len(x1_endpoints) == 0 else "2")
        elif len(x1_endpoints) != 1 or len(x2_endpoints) != 1 or duplicates:
            reason = "DUPLICATE_OR_AMBIGUOUS_COMPOSITION_NO_REPLICATE_ID"

        sid = system_ids[key]
        pair_class = "-".join(sorted((charge_class(system["smiles1"]), charge_class(system["smiles2"]))))
        cmc1 = cmc2 = None
        ep1 = ep2 = None
        if not reason:
            ep1, ep2 = x1_endpoints[0], x2_endpoints[0]
            try:
                cmc1, cmc2 = 10.0 ** ep1["log"], 10.0 ** ep2["log"]
                if not all(math.isfinite(c) and c > 0 for c in (cmc1, cmc2)):
                    raise ValueError("endpoint conversion is non-positive or non-finite")
            except (OverflowError, ValueError):
                reason = "INVALID_OR_NONPOSITIVE_PURE_ENDPOINT_CMC"
                cmc1 = cmc2 = None
                ep1 = ep2 = None

        if reason:
            blocked_reason[key] = reason
        else:
            prospective = []
            for item in group:
                if item is ep1 or item is ep2:
                    continue
                total = item["x1"] + item["x2"]
                nx1, nx2 = item["x1"] / total, item["x2"] / total
                try:
                    observed = 10.0 ** item["log"]
                    prediction = clint_cmc(nx1, cmc1, nx2, cmc2)
                    if not math.isfinite(observed) or observed <= 0:
                        raise ValueError("measured CMC conversion is non-positive or non-finite")
                except (OverflowError, ValueError):
                    reason = "INVALID_OR_NONPOSITIVE_CMC_CONVERSION"
                    break
                prospective.append({
                    "prediction_uM": prediction, "observation_uM": observed,
                    "source_logCMC": item["log"], "source_record_number": item["raw"]["record_number"],
                    "pair_class": pair_class,
                })
            if reason:
                blocked_reason[key] = reason
                cmc1 = cmc2 = None
                ep1 = ep2 = None
            else:
                endpoint_refs[key] = (ep1, ep2, cmc1, cmc2)
                scored_by_system[sid].extend(prospective)

        if key in blocked_reason:
            reason = blocked_reason[key]
        records = scored_by_system.get(sid, [])
        refs = endpoint_refs.get(key, (None, None, None, None))
        ep1, ep2, cmc1, cmc2 = refs
        system_metrics = _metrics(records)
        system_metrics.pop("observation_count")
        system_rows.append({
            "system_id": sid, "component_1_smiles": system["smiles1"], "component_2_smiles": system["smiles2"],
            "pair_class": pair_class, "source_row_count": len(group),
            "endpoint_component_1_record_id": f"P2SURF-ROW-{ep1['raw']['record_number']:06d}" if ep1 else "",
            "endpoint_component_2_record_id": f"P2SURF-ROW-{ep2['raw']['record_number']:06d}" if ep2 else "",
            "eligible_observation_count": len(records), "eligibility": "ELIGIBLE" if records and not reason else "EXCLUDED",
            "exclusion_reason": reason, **system_metrics,
        })

    ledger: list[dict] = []
    for record in self_rows:
        ledger.append(_ledger_row(record, None, "NON_BINARY_SINGLE_COMPONENT_RECORD", "EXCLUDED",
                                  "Same SMILES in both source component fields; not a binary mixture system."))
    for item in parsed_rows:
        key = item["key"]
        sid = system_ids[key]
        status_reason = blocked_reason.get(key, "")
        refs = endpoint_refs.get(key)
        is_endpoint1 = item["x1"] == 1.0 and item["x2"] == 0.0
        is_endpoint2 = item["x2"] == 1.0 and item["x1"] == 0.0
        if refs and (is_endpoint1 or is_endpoint2):
            role, decision = "PURE_ENDPOINT_INPUT", "NOT_SCORED_ENDPOINT_INPUT"
            row_reason = "Pure-component endpoint is an equation input, never a mixed-CMC target."
        elif status_reason:
            role = "UNPAIRED_PURE_ENDPOINT" if is_endpoint1 or is_endpoint2 else "MIXTURE_OBSERVATION"
            decision, row_reason = "EXCLUDED", status_reason
        else:
            role, decision, row_reason = "MIXTURE_OBSERVATION", "INCLUDED", ""
        record_assign = {
            "system_id": sid, "component_1_smiles": item["smiles1"], "component_2_smiles": item["smiles2"],
            "normalized_x1": item["x1"] / (item["x1"] + item["x2"]) if item["finite"] and item["x1"] + item["x2"] > 0 else None,
            "normalized_x2": item["x2"] / (item["x1"] + item["x2"]) if item["finite"] and item["x1"] + item["x2"] > 0 else None,
            "row_role": role, "decision": decision, "exclusion_reason": row_reason,
        }
        if refs:
            ep1, ep2, cmc1, cmc2 = refs
            record_assign.update({
                "endpoint_component_1_record_id": ep1["raw"]["record_number"],
                "endpoint_component_2_record_id": ep2["raw"]["record_number"],
                "pure_cmc_component_1_uM": cmc1, "pure_cmc_component_2_uM": cmc2,
            })
        else:
            group = systems[key]["rows"]
            ends1 = [x for x in group if x["x1"] == 1.0 and x["x2"] == 0.0]
            ends2 = [x for x in group if x["x2"] == 1.0 and x["x1"] == 0.0]
            record_assign.update({
                "endpoint_component_1_record_id": ends1[0]["raw"]["record_number"] if ends1 else "",
                "endpoint_component_2_record_id": ends2[0]["raw"]["record_number"] if ends2 else "",
                "pure_cmc_component_1_uM": 10.0 ** ends1[0]["log"] if ends1 and ends1[0]["finite"] else None,
                "pure_cmc_component_2_uM": 10.0 ** ends2[0]["log"] if ends2 and ends2[0]["finite"] else None,
            })
        if decision == "INCLUDED":
            scored = next(x for x in scored_by_system[sid] if x["source_record_number"] == item["raw"]["record_number"])
            record_assign.update({
                "prediction_cmc_uM": scored["prediction_uM"],
                "prediction_log10_uM": math.log10(scored["prediction_uM"]),
            })
        ledger.append(_ledger_row(item["raw"], record_assign, role, decision, row_reason, item))

    ledger.sort(key=lambda row: int(row["source_record_id"].split("-")[-1]))
    all_scored = [record for sid in scored_by_system for record in scored_by_system[sid]]
    eligible_systems = [row for row in system_rows if row["eligible_observation_count"] > 0]
    pooled = _metrics(all_scored)
    macro_keys = ("mae_uM", "rmse_uM", "mean_signed_error_uM", "mae_log10", "mean_signed_error_log10")
    macro = {key: sum(row[key] for row in eligible_systems) / len(eligible_systems) for key in macro_keys}
    class_summary = []
    for pair_class in sorted({r["pair_class"] for r in all_scored}):
        class_rows = [r for sid in scored_by_system for r in scored_by_system[sid] if r["pair_class"] == pair_class]
        class_system_ids = {row["system_id"] for row in system_rows if row["pair_class"] == pair_class and row["eligible_observation_count"] > 0}
        class_summary.append({"pair_class": pair_class, "system_groups": len(class_system_ids), **_metrics(class_rows)})

    same_smiles_count = len(self_rows)
    missing_systems = [
        {"system_id": row["system_id"], "rows": row["source_row_count"], "reason": row["exclusion_reason"]}
        for row in system_rows if row["exclusion_reason"].startswith("MISSING_PURE_ENDPOINT")
    ]
    rounded_rows = sum(
        1 for item in parsed_rows if item["key"] in endpoint_refs
        and abs((item["x1"] + item["x2"]) - 1.0) > 1e-12
    )
    counts = {
        "source_rows_inspected": len(source_rows),
        "nonbinary_same_smiles_rows": same_smiles_count,
        "binary_systems": len(systems),
        "binary_source_rows": len(source_rows) - same_smiles_count,
        "systems_with_both_single_endpoints": len(eligible_systems),
        "systems_excluded_missing_endpoint": len(missing_systems),
        "rows_in_systems_missing_endpoint": sum(row["rows"] for row in missing_systems),
        "eligible_endpoint_rows_not_scored": 2 * len(eligible_systems),
        "eligible_mixture_observations": len(all_scored),
        "composition_sum_rounding_rows": rounded_rows,
        "exact_duplicate_source_rows": exact_duplicate_count,
        "invalid_systems": sum(row["exclusion_reason"] == "INVALID_SOURCE_FRACTIONS_OR_LOG_CMC" for row in system_rows),
        "ambiguous_duplicate_systems": sum(row["exclusion_reason"] == "DUPLICATE_OR_AMBIGUOUS_COMPOSITION_NO_REPLICATE_ID" for row in system_rows),
    }
    result = {
        "benchmark_id": "ENG-002-CLINT-P2SURF-v1",
        "benchmark_scope": "Component-level ideal Clint equation benchmark within systems with observed pure endpoints; not finished detergent formula validation.",
        "source": {
            "file": f"evidence_vault/open_reference_benchmarks/{RELATIVE_DATA}",
            "upstream_commit": UPSTREAM_COMMIT,
            "sha256": source_sha256,
            "hash_basis": "SHA-256 after CRLF-to-LF normalization; checked against the pre-existing data-manifest.json.",
            "columns": ["smile_A", "mol_fraction_A", "smile_B", "mol_fraction_B", "logCMC"],
            "unit": "log10(CMC / uM)",
        },
        "method": {
            "equation": "CMC_mix = 1 / (x1/CMC1 + x2/CMC2)",
            "endpoint_source": "Pure-component endpoint rows from the same P2SURF system, at component mole fraction 1 and 0.",
            "conversion": "CMC_uM = 10 ** log10_CMC_uM; prediction is in uM; log error is log10(prediction_uM) - source_logCMC.",
            "fraction_sum_tolerance": FRACTION_SUM_TOLERANCE,
            "fraction_rule": "Validate the two reported source fractions then normalize each by their reported sum; preserve raw values in the ledger.",
            "grouping": "Exact unordered source-SMILES pair; no chemical canonicalization. Group IDs follow sorted pair order.",
            "duplicate_rule": "Duplicate endpoint/composition records block the system because replicate identity is not given.",
            "baseline": "No second baseline used; no independent baseline was pre-specified for this equation benchmark.",
            "evaluation_design": "Within-system interpolation using same-system measured pure endpoints as equation inputs. No system or external holdout; source experiment/study identifiers are absent.",
        },
        "counts": counts,
        "metrics": {
            "pooled_observation_level": {**pooled, "error_sign": "prediction minus observation", "linear_unit": "uM", "log_unit": "log10 ratio"},
            "macro_mean_of_eligible_system_metrics": macro,
            "eligible_system_groups": len(eligible_systems),
            "scored_observations": len(all_scored),
            "by_pair_class": class_summary,
        },
        "exclusions": {
            "same_smiles_nonbinary_rows": same_smiles_count,
            "missing_endpoint_systems": missing_systems,
            "eligible_pure_endpoint_rows": "Equation inputs only; never scored as mixed observations.",
            "other_rows": counts["eligible_endpoint_rows_not_scored"] + sum(row["rows"] for row in missing_systems),
        },
        "status": {
            "engine_maturity": "MODEL_PREDICTION",
            "benchmark_result": "COMPONENT_LEVEL_REFERENCE_BENCHMARK",
            "empirical_calibration": "NOT_ESTABLISHED",
            "lab_validated": False,
            "pristine_untouched_test": False,
            "phase4b": "OPEN",
            "phase5": "LOCKED",
        },
        "limitations": [
            "P2SURF is a literature compilation; the CSV does not carry primary-study identifiers or method details for individual rows.",
            "The high-level calculateMixedCMC catalog does not map every P2SURF SMILES to app ingredient defaults; this benchmark exercises the ideal equation with measured same-system endpoints.",
            "Measured pure endpoints are equation inputs from the same system; this is not an independent unseen-system holdout.",
            "Experimental conditions are heterogeneous and are not fully specified in the CSV.",
            "The mixed-CMC benchmark has already been reported and regression-tested in this repository; this is not a pristine untouched test set.",
            "No confidence intervals or second-baseline comparison were calculated.",
        ],
    }
    return ledger, system_rows, result


def _ledger_row(raw: dict, assignment: dict | None, role: str, decision: str, reason: str, item: dict | None = None) -> dict:
    a = assignment or {}
    try:
        observed = 10.0 ** float(raw["logCMC"])
        fraction_sum = float(raw["mol_fraction_A"]) + float(raw["mol_fraction_B"])
    except (ValueError, TypeError, OverflowError):
        observed = fraction_sum = None
    return {
        "source_file": f"evidence_vault/open_reference_benchmarks/{RELATIVE_DATA}",
        "source_commit": UPSTREAM_COMMIT,
        "source_record_id": f"P2SURF-ROW-{int(raw['record_number']):06d}",
        "source_csv_row": raw["csv_row"],
        "system_id": a.get("system_id", ""),
        "row_role": role,
        "component_1_smiles": a.get("component_1_smiles", raw["smile_A"]),
        "component_2_smiles": a.get("component_2_smiles", raw["smile_B"]),
        "source_smile_A": raw["smile_A"],
        "source_mol_fraction_A": raw["mol_fraction_A"],
        "source_smile_B": raw["smile_B"],
        "source_mol_fraction_B": raw["mol_fraction_B"],
        "fraction_sum": fraction_sum,
        "normalized_x1": a.get("normalized_x1"),
        "normalized_x2": a.get("normalized_x2"),
        "source_logCMC": raw["logCMC"],
        "source_unit": "log10(CMC/uM)",
        "observed_cmc_uM": observed,
        "endpoint_component_1_record_id": (
            f"P2SURF-ROW-{int(a['endpoint_component_1_record_id']):06d}" if a.get("endpoint_component_1_record_id") not in (None, "") else ""
        ),
        "endpoint_component_2_record_id": (
            f"P2SURF-ROW-{int(a['endpoint_component_2_record_id']):06d}" if a.get("endpoint_component_2_record_id") not in (None, "") else ""
        ),
        "pure_cmc_component_1_uM": a.get("pure_cmc_component_1_uM"),
        "pure_cmc_component_2_uM": a.get("pure_cmc_component_2_uM"),
        "prediction_cmc_uM": a.get("prediction_cmc_uM"),
        "prediction_log10_uM": a.get("prediction_log10_uM"),
        "prediction_unit": "uM",
        "decision": decision,
        "exclusion_reason": reason,
        "lineage_note": "Record ID is a deterministic 1-based data-record position; source CSV has no original record identifier.",
    }


def _csv_text(fields: list[str], rows: list[dict]) -> str:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="raise", lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue()


def _write_outputs(ledger: list[dict], system_rows: list[dict], result: dict) -> None:
    LEDGER_PATH.write_text(_csv_text(LEDGER_FIELDS, ledger), encoding="utf-8", newline="")
    SYSTEM_PATH.write_text(_csv_text(SYSTEM_FIELDS, system_rows), encoding="utf-8", newline="")
    RESULT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="")


def _numeric_equal(a, b) -> bool:
    if a in (None, "") and b in (None, ""):
        return True
    try:
        av, bv = float(a), float(b)
    except (TypeError, ValueError):
        return a == b
    if math.isnan(av) or math.isnan(bv):
        return False
    return math.isclose(av, bv, rel_tol=2e-12, abs_tol=2e-10)


def _assert_rows_match(path: Path, expected: list[dict], fields: list[str]) -> None:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        actual = list(csv.DictReader(handle))
    if len(actual) != len(expected):
        raise ValueError(f"{path.name}: expected {len(expected)} rows, found {len(actual)}")
    for index, (got, want) in enumerate(zip(actual, expected), start=1):
        for field in fields:
            if not _numeric_equal(got.get(field, ""), want.get(field, "")):
                raise ValueError(f"{path.name} row {index}, field {field}: expected {want.get(field)!r}, got {got.get(field)!r}")


def check_outputs(ledger: list[dict], system_rows: list[dict], result: dict) -> None:
    _assert_rows_match(LEDGER_PATH, ledger, LEDGER_FIELDS)
    _assert_rows_match(SYSTEM_PATH, system_rows, SYSTEM_FIELDS)
    actual = json.loads(RESULT_PATH.read_text(encoding="utf-8"))
    if actual != result:
        # JSON numeric serialization can vary by runtime; compare recursively with numeric tolerance.
        _assert_json_equal(actual, result, "$")


def _assert_json_equal(actual, expected, path: str) -> None:
    if isinstance(expected, dict):
        if not isinstance(actual, dict) or set(actual) != set(expected):
            raise ValueError(f"{path}: JSON object keys differ")
        for key in expected:
            _assert_json_equal(actual[key], expected[key], f"{path}.{key}")
    elif isinstance(expected, list):
        if not isinstance(actual, list) or len(actual) != len(expected):
            raise ValueError(f"{path}: JSON list length differs")
        for index, (a, e) in enumerate(zip(actual, expected)):
            _assert_json_equal(a, e, f"{path}[{index}]")
    elif isinstance(expected, (int, float)) and not isinstance(expected, bool):
        if not _numeric_equal(actual, expected):
            raise ValueError(f"{path}: expected {expected!r}, got {actual!r}")
    elif actual != expected:
        raise ValueError(f"{path}: expected {expected!r}, got {actual!r}")


def run(write: bool = False) -> dict:
    digest = verify_dataset_hash()
    ledger, system_rows, result = analyze_rows(read_source_rows(), digest)
    if write:
        _write_outputs(ledger, system_rows, result)
    else:
        check_outputs(ledger, system_rows, result)
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--write", action="store_true", help="regenerate the committed ledger, per-system table, and JSON")
    mode.add_argument("--check", action="store_true", help="verify source hash and committed outputs (default)")
    args = parser.parse_args()
    result = run(write=args.write)
    print(json.dumps({
        "source_rows": result["counts"]["source_rows_inspected"],
        "eligible_system_groups": result["counts"]["systems_with_both_single_endpoints"],
        "eligible_mixture_observations": result["counts"]["eligible_mixture_observations"],
        "pooled_mae_uM": result["metrics"]["pooled_observation_level"]["mae_uM"],
        "sha256": result["source"]["sha256"],
        "mode": "write" if args.write else "check",
    }, indent=2))


if __name__ == "__main__":
    main()
