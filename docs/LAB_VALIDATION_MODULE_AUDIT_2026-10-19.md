# Formula Expert lab validation audit and implementation plan

Audit date: 2026-10-19. Scope: detergent powder and liquid products only. Hair shampoo is excluded; car shampoo remains a vehicle-cleaning category.

## Existing implementation found

- The app already has a LIMS domain, sample/batch/test/measurement records, powder/liquid method routing, instrument registry, hash-chain audit trail, evidence promotion checks, a lab notebook UI, and formula-version snapshots.
- RDKit is already in the app dependency graph and an RDKit adapter/test suite exists.
- The LIMS UI currently initializes a made-up batch/sample/operator and uses fabricated target/actual batch weights. New batches also hard-code 1000 kg target and 995 kg actual.
- LIMS state is React component state. Measurements, formulas, batches, tests, corrections, and audit records do not survive a page reload.
- Ingredient mapping silently substitutes active matter `100%` and cost `1.0` when missing. That violates the requirement to preserve unknown ingredient data.
- The LIMS UI exposes only canonical reference instruments, while the measurement recorder rejects reference/demo instruments and accepts only user-registered instruments. The screen therefore does not offer a working path to record a real measurement.
- Measurement capture hard-codes 25°C and does not record pH sample concentration, dilution water quality, uncertainty, or raw evidence attachment.
- Canonical methods include numeric acceptance limits that are not sourced to a controlled product specification. Those limits must not drive pass/fail decisions.
- Test-method metadata lacks an explicit acceptance-criteria review state, controls, sample preparation, and source linkage. Source registry work is added in `src/domain/lims/sourceRegistry.ts`.

## Research-link audit

The reviewed links are recorded in the source registry with individual usage limits. In brief: OpenMix, DeepChem and soap-calc are software research references, not detergent laboratory proof; RDKit is already integrated and supplies molecule-level tooling only; PubChem PUG REST is an identity/property source with rate limits, not a formulated-product evidence source. BIS IS 4955:2020 is for household laundry detergent powders and has a 2024 amendment listed; its controlled standard text is not free to reproduce. The BIS lab directory is a discovery listing, not a guarantee of current test-specific accreditation. ISO 2870:2009 remains current after 2022 confirmation and is paid. The supplied ASTM D4265-21 page identifies D4265-25 as active; ASTM describes the method as diagnostic screening and says no confirmed correlation to consumer ranking. OECD TG 301 describes six ready-biodegradability screening methods; method fit for a finished detergent mixture needs expert review.

## Incremental implementation plan

1. Preserve existing LIMS architecture and add a reviewed source registry; keep reference sources distinct from observations of a finished formula.
2. Remove demo measurements/batches and fabricated ingredient assumptions. Require explicit real batch size, operator, ingredient active matter when known, and physical instrument/calibration metadata.
3. Make LIMS persistence durable using the existing IndexedDB/Dexie layer, with append-only audit events and formula-hash versioning.
4. Add the requested six formula validation statuses as a separate workflow status, derived fail-closed from calculation, missing-data, test, evidence and reviewer states.
5. Extend powder/liquid test plans with protocol fields and explicit `NEEDS_EXPERT_REVIEW` acceptance criteria until a controlled, applicable specification is attached. Do not encode unverified limits. Source records now link methods to the relevant references; chelation's ASTM D2024 mismatch is explicitly recorded.
6. Add a cleaning-product validation checklist across chemical quality, performance, stability/quality, and safety/environment. This is planning guidance, not a test pass or claim; car shampoo has no registered validated hard-surface performance method yet.
7. Add focused unit/regression coverage and run available typecheck/build/test commands. Do not claim actual lab validation from software tests.

## Remaining external work

The app cannot perform physical testing, verify a lab's current scope, or obtain paid BIS/ISO/ASTM documents by itself. A competent reviewer must select authorized methods, controls and product-specific limits. Real formula validation still requires actual measurements, instrument certificates, evidence attachments and authorized human review. LIMS data currently persists in the local browser profile's IndexedDB, not in a shared/server-backed laboratory record system; it must not be treated as controlled multi-user record retention.
