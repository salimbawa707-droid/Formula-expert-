# Phase 4B AI execution receipt protocol v2

## Required per-pass record

Each pass must pin and retain the exact source manifest, protocol, prompt, input bundle, result artifact, and execution receipt. Each referenced file is stored under `evidence_vault/ai_review/` and SHA-256 is recomputed from its committed bytes.

Required metadata per pass:
- method, model identity, unique execution ID, unique session ID;
- timezone-aware start and completion timestamps;
- source-manifest, protocol, prompt, input-bundle, result, and receipt paths plus SHA-256 hashes.

## Blinding and chronology rules

1. Pass A is `SOURCE_FIRST_TRANSCRIPTION`; Pass B is `INDEPENDENT_SOURCE_RECHECK`.
2. Execution IDs and session IDs must differ.
3. Pass B must start after Pass A has completed.
4. Both passes must pin the same source manifest and protocol bytes.
5. Pass B's recorded input bundle must not include Pass A's result artifact.
6. Result artifacts must be distinct. Missing files, unsafe paths, hash mismatch, malformed bundles, or chronology violations fail closed.

## Evidence boundary

The validator verifies committed artifact integrity and declared process metadata. It does **not** cryptographically prove that a model provider's hidden context excluded Pass A, nor does it prove that the declared execution actually occurred. A provider-side signed execution attestation or trusted isolated execution boundary would be needed for that stronger claim. Do not describe these receipts as cryptographic proof of model-context isolation.

This protocol does not replace Phase 4B scientific acceptance criteria, source-rights review, raw numeric accounting, independent sample lineage, or the Phase 5 gate.
