#!/usr/bin/env python3
"""Validate auditable evidence for two-pass Phase 4B AI review.

Receipts establish integrity of declared files and chronology. They do not
cryptographically prove that an AI provider isolated model context.
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from pathlib import Path, PurePosixPath


ALLOWED_PREFIX = "evidence_vault/ai_review/"
HASH_RE = re.compile(r"^[a-f0-9]{64}$")


def _time(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError("timestamp must be a string")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include a timezone")
    return parsed


def _path(root: Path, ref: str) -> Path:
    if not isinstance(ref, str) or not ref.startswith(ALLOWED_PREFIX):
        raise ValueError(f"reference outside {ALLOWED_PREFIX}: {ref!r}")
    posix = PurePosixPath(ref)
    if any(part in ("", ".", "..") for part in posix.parts) or "\\" in ref:
        raise ValueError(f"unsafe artifact reference: {ref}")
    target = (root / Path(*posix.parts)).resolve()
    allowed = (root / "evidence_vault" / "ai_review").resolve()
    if target != allowed and allowed not in target.parents:
        raise ValueError(f"artifact path escapes review vault: {ref}")
    return target


def _verify_file(root: Path, ref: str, expected: str) -> bytes:
    if not isinstance(expected, str) or not HASH_RE.fullmatch(expected):
        raise ValueError(f"invalid SHA-256 for {ref}")
    target = _path(root, ref)
    if not target.is_file():
        raise ValueError(f"missing artifact: {ref}")
    content = target.read_bytes()
    actual = hashlib.sha256(content).hexdigest()
    if actual != expected:
        raise ValueError(f"SHA-256 mismatch: {ref}")
    return content


def validate_pair(pair: dict, root_dir: str | Path) -> list[str]:
    errors: list[str] = []
    root = Path(root_dir).resolve()
    if not isinstance(pair, dict) or set(pair) != {"pass_a", "pass_b"}:
        return ["pair must contain exactly pass_a and pass_b"]
    a, b = pair["pass_a"], pair["pass_b"]
    if not isinstance(a, dict) or not isinstance(b, dict):
        return ["each pass must be an object"]

    required = (
        "method", "execution_id", "session_id", "model", "started_at", "completed_at",
        "source_manifest_ref", "source_manifest_sha256", "protocol_ref", "protocol_sha256",
        "prompt_ref", "prompt_sha256", "input_bundle_ref", "input_bundle_sha256",
        "result_ref", "result_sha256", "receipt_ref", "receipt_sha256",
    )
    for label, record, expected_method in (
        ("pass_a", a, "SOURCE_FIRST_TRANSCRIPTION"),
        ("pass_b", b, "INDEPENDENT_SOURCE_RECHECK"),
    ):
        for field in required:
            if not isinstance(record.get(field), str) or not record[field].strip():
                errors.append(f"{label}.{field} is required")
        if record.get("method") != expected_method:
            errors.append(f"{label}.method must be {expected_method}")

    if errors:
        return errors

    for field in ("execution_id", "session_id"):
        if a[field] == b[field]:
            errors.append(f"Pass A and Pass B must have distinct {field} values")

    try:
        a_start, a_end = _time(a["started_at"]), _time(a["completed_at"])
        b_start, b_end = _time(b["started_at"]), _time(b["completed_at"])
        if a_end < a_start:
            errors.append("Pass A completion precedes its start")
        if b_end < b_start:
            errors.append("Pass B completion precedes its start")
        if b_start < a_end:
            errors.append("Pass B must start after Pass A is complete")
    except (ValueError, TypeError) as exc:
        errors.append(f"invalid pass chronology: {exc}")

    for field in ("source_manifest_ref", "source_manifest_sha256",
                  "protocol_ref", "protocol_sha256"):
        if a[field] != b[field]:
            errors.append(f"Pass A and Pass B must share pinned {field}")

    if a["result_ref"] == b["result_ref"] or a["result_sha256"] == b["result_sha256"]:
        errors.append("Pass A and Pass B must have distinct result artifacts and hashes")

    loaded: dict[tuple[str, str], bytes] = {}
    for label, record in (("pass_a", a), ("pass_b", b)):
        for ref_field, hash_field in (
            ("source_manifest_ref", "source_manifest_sha256"),
            ("protocol_ref", "protocol_sha256"),
            ("prompt_ref", "prompt_sha256"),
            ("input_bundle_ref", "input_bundle_sha256"),
            ("result_ref", "result_sha256"),
            ("receipt_ref", "receipt_sha256"),
        ):
            try:
                loaded[(label, ref_field)] = _verify_file(
                    root, record[ref_field], record[hash_field]
                )
            except (ValueError, OSError) as exc:
                errors.append(f"{label}: {exc}")

    for label in ("pass_a", "pass_b"):
        bundle = loaded.get((label, "input_bundle_ref"))
        if bundle is not None:
            try:
                parsed = json.loads(bundle)
                included = parsed.get("included_artifacts")
                if not isinstance(included, list) or not all(isinstance(x, str) for x in included):
                    errors.append(f"{label} input bundle must declare included_artifacts as a string list")
                elif label == "pass_b" and a["result_ref"] in included:
                    errors.append("Pass B input bundle includes Pass A result; blinding claim is invalid")
            except (json.JSONDecodeError, AttributeError):
                errors.append(f"{label} input bundle is not a valid JSON object")

    # These checks audit declared receipts; they are not cryptographic attestation
    # of the model provider's hidden context or actual execution environment.
    return errors


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("pair_json", type=Path)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    args = parser.parse_args()
    pair = json.loads(args.pair_json.read_text(encoding="utf-8"))
    errors = validate_pair(pair, args.root)
    result = {
        "status": "PASS" if not errors else "FAIL",
        "errors": errors,
        "evidence_boundary": "Auditable declared process receipts; not cryptographic proof of model-context isolation.",
    }
    print(json.dumps(result, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
