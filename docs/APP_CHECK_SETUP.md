# Firebase App Check — setup and rollout

App Check verifies that each Firebase request comes from **this app running on a
real device/browser**, not from a script, a scraper, or someone who copied the
Firebase API key out of the bundle. A Firebase web API key is not a secret — it
is shipped to every visitor — so App Check is the control that actually protects
your Firestore, Auth and Storage quotas.

Two parts are needed:

1. **Console configuration** (once per project, and once per app platform).
2. **Code** — already implemented in `src/services/firebaseAppCheck.ts` and wired
   up in `src/services/firebaseAuthClient.ts`.

Never turn enforcement on before the code is deployed with a valid site key, or
the production app will start receiving `permission-denied` errors.

---

## 1. Register the web app in Firebase Console

1. Open <https://console.firebase.google.com> and select the project used by
   `VITE_FIREBASE_PROJECT_ID`.
2. Go to **App Check** (left menu, under *Build* / *Release & Monitor*).
3. Open the **Apps** tab and find the **Web** app that matches
   `VITE_FIREBASE_APP_ID`.
4. Click **Register**, choose **reCAPTCHA Enterprise** (recommended) or
   **reCAPTCHA v3**, and follow the link to create the reCAPTCHA key for your
   domain(s):
   - Add every hostname the app is served from, e.g.
     `your-project.web.app`, `your-project.firebaseapp.com`, your custom domain,
     and `localhost` for development.
   - Copy the **site key** (public, starts with `6L...`). The *secret* key is
     only needed if you verify tokens from your own backend — it is not used by
     this app.
5. Paste the site key into the registration dialog and save.

## 2. Configure the app

In `.env` (never commit this file):

```dotenv
VITE_FIREBASE_APP_CHECK_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_APP_CHECK_PROVIDER=recaptcha-enterprise
VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=
VITE_FIREBASE_APP_CHECK_ENABLED=true
```

On Firebase Hosting (or any other host) add the same `VITE_*` variables to the
build environment, then rebuild and redeploy — Vite inlines them at build time,
so a restart alone does not pick them up.

What the code does:

- `initializeAppCheckForApp()` runs immediately after `initializeApp()`, before
  `getAuth()` and `getFirestore()`, so tokens are attached to every request.
- Missing site key → a clear console warning, App Check stays off, the app keeps
  working (safe for local work and CI).
- `VITE_FIREBASE_APP_CHECK_ENABLED=false` → explicit opt-out.
- Token auto-refresh is on, so long sessions stay valid.

## 3. Local development / CI

reCAPTCHA cannot be solved by an automated browser or a headless test run, so
development builds use a debug token:

1. Start the app once with a site key set. The console prints something like
   `App Check debug token: 1234abcd-...`.
2. Register that token: **App Check → Apps → your web app → ⋮ → Manage debug
   tokens → Add debug token**.
3. Put it in `.env` as `VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN=1234abcd-...`.

Debug tokens are per machine. They only work while listed in the console, so
delete them when they are no longer needed and never add one to a production
build.

## 4. Android (Capacitor) build

The Android app is a WebView shell. A reCAPTCHA inside a WebView cannot be
trusted, so the code intentionally **skips** reCAPTCHA on the native platform
and logs a warning instead of sending invalid requests.

For the Android release build, register the Android app under **App Check** with
the **Play Integrity** provider, then add the native App Check plugin:

```bash
bun add @capacitor-firebase/app-check
bun run cap:sync
```

and configure Play Integrity in the Firebase Console (the Android app must be
registered in the project with the correct package name `com.detergentrnd.formulaexpert`
and SHA-256 signing fingerprints). Until that is done, do **not** enforce App
Check for the Android app, or signed-in Android users will be blocked.

## 5. Enforce — only after the new build is live

1. Deploy the build that contains the site key.
2. Open the app in a browser and confirm the console shows
   `[App Check] Initialised with reCAPTCHA Enterprise` and that Firestore reads
   succeed.
3. In **App Check → APIs**, watch the metrics for a day. Requests should be
   mostly *verified*; unverified traffic shows up before enforcement.
4. Enable enforcement one product at a time, starting with the least critical:
   **Cloud Firestore → Enforce**, then **Authentication**, then **Storage**.
5. Re-test sign-in, formula save/load, and the admin dashboard after each step.

## 6. Rollback

If the app breaks after enforcement: **App Check → APIs → your product →
Unenforce**, or set `VITE_FIREBASE_APP_CHECK_ENABLED=false` and redeploy. Both
are instant; no data is lost.

---

## Security notes

- App Check is **not** a replacement for Firestore Security Rules or for the
  server-side `ADMIN_EMAILS` check. Keep all three.
- The reCAPTCHA site key is public; the API key remains public too. What changes
  is that a copied key alone can no longer drive your project's quotas.
- Also restrict the API key in Google Cloud Console (*APIs & Services →
  Credentials → the browser key → Application restrictions → HTTP referrers*)
  and limit it to the Firebase APIs the app actually uses. App Check plus key
  restrictions is the combination that closes audit item *"rotate the exposed
  Firebase key and enable App Check"*.
- Once App Check is enforced, rotate the previously committed Firebase API key.
