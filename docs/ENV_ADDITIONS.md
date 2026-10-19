# Environment Configuration & Additions — Combined Correction 47

## Critical Production Environment Variables

### 1. Firebase Admin SDK
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Path to or stringified JSON of the Firebase service account credential for server-side cryptographic token verification (`verifyIdToken(token, true)`).
- `GOOGLE_APPLICATION_CREDENTIALS`: Standard GCP service account credentials fallback.
- Note: If unconfigured, the server uses the default Firebase Applet Project ID (`imagined-zone-cv4kj`) for public key cryptographic verification.

### 2. Google Play Developer API (Billing)
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`: Service account key JSON with `https://www.googleapis.com/auth/androidpublisher` scope.
- Note: When unconfigured, the billing verification endpoint safely fails closed (`status: 'UNVERIFIED'`, verification marked `BLOCKED`). Never returns active entitlements based on environment variable presence alone.

### 3. Server Security & Diagnostics
- `PORT`: Optional server listening port. Validated integer between 1 and 65535 (defaults to `3000` for local development and AI Studio preview; binds dynamically when injected by Cloud Run / container runtimes).
- `GEMINI_MODEL`: Optional AI model identifier (defaults to documented verified model `gemini-3.8-flash`).
- `TRUST_PROXY`: Optional reverse proxy trust setting ('true', 'false', hop integer, or subnet; defaults to `1` for single-hop Cloud Run / reverse proxies).
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (defaults to `http://localhost:3000`, `capacitor://localhost`, etc.).
- `NODE_ENV`: Runtime environment (`production`, `development`, `test`). Test bypasses are completely inaccessible in `production`.
