# Detergent Formula Expert

Detergent Formula Expert is a React and TypeScript application for detergent and cleaning-product formulation, ingredient research, scientific calculations, laboratory evidence workflows, and related operations. Its production frontend is built with Vite.

## Requirements

- [Bun](https://bun.sh/) (the repository uses `bun.lock`)
- A current desktop browser for the web app
- For Android builds, the Android project and Android SDK tooling

## Run locally

```sh
bun install --frozen-lockfile
bun run dev
```

Vite serves the development app on port 3000. The development server binds to all interfaces for container and device access; keep it on a trusted network. Vite's hostname checks remain enabled.

## Build and preview

```sh
bun run build
bun run preview
```

The build output is written to `dist/`. The preview server is for local review; configure your own production hosting and security controls before deployment.

## Checks

Run the focused Phase 6 regression suite:

```sh
bun run test:phase6
```

Run all registered TypeScript regressions:

```sh
bun run test:all
```

The GitHub Actions workflow runs the production build, both TypeScript regression commands, and evidence-vault guardrails. The checked-in full-suite report is historical and records failed assertions; rerun the suite on the release commit and resolve any failures before treating that report as a clean release gate.

## Configuration

The app supports environment-based Firebase client settings through `VITE_FIREBASE_*` variables. Native Android API calls also require `VITE_API_BASE_URL` to point to the deployed backend. Vite exposes `VITE_*` values to browser code, so never put private keys, service-account credentials, or other server secrets in them.

Firebase web API keys identify a client project; they are not authorization controls. Restrict the key in Firebase/Google Cloud and enforce access through Firebase Authentication, Firestore Security Rules, and server-side authorization.

## Scientific and laboratory use

Calculated and predicted values are decision-support outputs. They do not establish that a finished product passed a laboratory test, meets a specification, is safe, or complies with a regulation. Use the applicable reviewed method, qualified laboratory, and independent evidence review before making those claims. The evidence workflow intentionally keeps some datasets and validation phases blocked until their review requirements are met.

## Repository notes

- Main frontend code is under `src/`.
- The Android project is under `android/`.
- Evidence datasets, audit reports, and their validation scripts are under `evidence_vault/`.
- The project does not currently declare an open-source license. No license should be assumed for reuse or redistribution.
