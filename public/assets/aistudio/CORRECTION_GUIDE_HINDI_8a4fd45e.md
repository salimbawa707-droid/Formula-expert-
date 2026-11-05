# Detergent Formula Expert — A-to-Z Correction Guide (Hindi/Hinglish)

**Audit date:** 4 November 2026  
**Project version in source ZIP:** 2.5.0  
**Important:** This guide describes code changes made in this correction package. It is not a production, Android, chemical-safety, or laboratory certification.

## 1. Sabse pehle kya badla?

| File | Correction | Kyon zaroori tha |
|---|---|---|
| `server.ts` | AI endpoints par authentication, endpoint-specific rate limits aur bounded JSON body parsers | Unauthenticated requests se Gemini cost abuse aur oversized-body resource exhaustion ka risk kam karna |
| `server.ts` | Chat, label OCR aur ingredient research inputs ke size/type checks | Invalid ya excessive input ko AI call se pehle reject karna |
| `server.ts` | Client response se raw internal error messages hataye | Server paths, provider details ya unexpected internals leak hone ka risk kam karna |
| `server.ts` | `/api/ai/apply-verified-ingredient` ab AI research ko `UNVERIFIED` / `AI_RESEARCH_PENDING_REVIEW` mark karta hai | Sirf client body ya AI output ke basis par data ko manufacturer-verified kehna galat tha |
| `server.ts` | `/api/ai/analyze-recommend` route add kiya | Frontend is endpoint ko call karta tha, lekin server route missing tha |
| `server.ts` | `/api/billing/verify-purchase` route add kiya | Frontend purchase verification endpoint call karta tha; server ab verified identity se user binding karta hai aur verification fail hone par entitlement grant nahi karta |
| `server.ts` | Request parser errors ke liye JSON 400/413 response | Malformed/oversized request ke liye predictable response |
| `src/components/ChemicalEncyclopedia.tsx` | `dangerouslySetInnerHTML` hataya; SVG ko encoded `data:image/svg+xml` ke roop mein `<img>` context mein render kiya | SVG ko HTML DOM ke andar inject karne ka XSS risk kam karna |
| `package.json` | Node.js engine `>=22.6.0`; `start`/`dev` mein `--experimental-strip-types`; static correction test script | `.ts` server entrypoint ke runtime ko explicit banana aur supported Node runtime specify karna |
| `scripts/verify-correction-static.mjs` | Repeatable static source regression checks | Future changes ke baad kuch security controls accidentally remove na hon |

## 2. Google AI Studio mein corrections kaise apply karein?

### Recommended method — poora corrected project use karna
1. Is ZIP ko apne computer par extract karein.
2. Extracted project mein `Formula-expert--main/` folder ke andar saari files dekhein.
3. Google AI Studio ke project/workspace mein **same relative paths** par corrected files copy karein. Sabse important:
   - `server.ts`
   - `src/components/ChemicalEncyclopedia.tsx`
   - `package.json`
   - `scripts/verify-correction-static.mjs`
   - nayi Markdown reports
4. Agar aapka AI Studio workspace GitHub se connected hai, pehle alag branch/backup banayein; seedha production `main` overwrite na karein.
5. Purane `.env` ya credentials ko ZIP se copy na karein. Secret values sirf secure environment/secrets settings mein configure karein.
6. `package.json` scripts mein `test:correction-static` available hona chahiye.
7. Supported Node.js runtime **22.6.0 ya newer** use karein. Agar AI Studio ka deployment runtime is version ko support nahi karta, server startup command ko us runtime ke mutabik adjust karna hoga—`node server.ts` bina TypeScript stripping ke na use karein.
8. Project build/test karke preview aur Android app ke API calls ko verify karein.

> Google AI Studio ke exact interface/workspace options account aur project setup ke mutabik badal sakte hain. Isliye guide file paths aur source changes batati hai; har account ke UI button ka guarantee nahi deti.

## 3. Authentication aur API configuration

AI endpoints ab Bearer-token authentication require karte hain:
- `/api/ai/chat`
- `/api/ai/analyze-label`
- `/api/ai/research-ingredient`
- `/api/ai/apply-verified-ingredient`
- `/api/ai/analyze-recommend`
- `/api/billing/verify-purchase`

Frontend ka `src/services/apiBase.ts` Firebase token aur, fallback ke taur par, Supabase session token attach karne ki koshish karta hai. Production mein verify karein ki sign-in ke baad request ke saath valid `Authorization: Bearer ...` header ja raha hai. Authentication provider/server configuration missing ho to endpoint fail-closed ho sakta hai; security bypass karke public access enable na karein.

### Rate limits
Initial per-process limits:
- AI chat: 20 requests/minute/IP
- Label analysis: 8 requests/minute/IP
- Ingredient research: 10 requests/minute/IP
- Apply researched ingredient: 20 requests/minute/IP
- Formula recommendations: 10 requests/minute/IP
- Purchase verification: 10 requests/minute/IP

Ye in-memory limits hain. Multi-instance/serverless deployment mein shared store (Redis ya equivalent) lagana chahiye. Reverse proxy ke peeche deploy karte waqt Express `trust proxy` ko sirf trusted proxy topology ke hisaab se configure karein; arbitrary forwarded headers ko blindly trust na karein.

## 4. Label OCR upload

`/api/ai/analyze-label` ab:
- sirf `image/jpeg`, `image/png`, `image/webp` accept karta hai;
- JSON request body ko 12 MB tak limit karta hai;
- base64 input ko validate karta hai;
- file name ko basename/length se constrain karta hai;
- request limit aur rate limit apply karta hai.

Frontend agar image ko 12 MB JSON payload se bada encode karta hai, to image ko client-side resize/compress karein ya future mein signed object-storage upload workflow implement karein. SVG upload is endpoint ke liye allowed nahi hai.

## 5. AI research aur scientific provenance

`/api/ai/apply-verified-ingredient` ka historical naam compatibility ke liye abhi bhi wahi hai, lekin endpoint ka output **automatically verified nahi** hai. Returned ingredient provenance:
- `sourceType: AI_RESEARCH_PENDING_REVIEW`
- `verificationStatus: UNVERIFIED`
- notes mein original manufacturer TDS/COA se independent comparison ki requirement

AI output, Google Search grounding, ya client-provided `sourceUrl` apne aap manufacturer verification ka proof nahi hai. Kisi parameter ko VERIFIED promote karne se pehle actual primary source, exact grade, value, units, date/version aur reviewer record check karein.

## 6. SVG/XSS correction

`src/components/ChemicalEncyclopedia.tsx` mein SVG ko `dangerouslySetInnerHTML` se inject nahi kiya jata. Ab encoded SVG `<img>` context mein load hota hai. Future code mein untrusted HTML/SVG ko `dangerouslySetInnerHTML` ke through render na karein. Agar SVG ko inline DOM mein render karna kabhi required ho, to maintained SVG sanitizer aur strict allowlist ke saath alag security review karein.

## 7. Run kiye gaye checks

Correction package banate waqt ye checks run kiye gaye:
- `node scripts/verify-correction-static.mjs` — PASS
- `node --experimental-strip-types --check server.ts` — PASS (syntax check only)
- `node --check public/sw.js` — PASS
- `node --check scripts/verify-correction-static.mjs` — PASS
- ZIP mein obvious `.env`, service-account JSON, private key ya keystore filename scan — koi match nahi mila.

Ye checks **full application build/test ka replacement nahi** hain. Source ZIP mein `node_modules` included nahi tha aur is environment mein Bun executable run nahi ho saka, isliye existing Bun regression suites, Vite production build, runtime integration tests aur Android APK build execute nahi kiye gaye.

## 8. Google Play billing

Naya `/api/billing/verify-purchase` endpoint:
- authenticated user UID ko token se leta hai, request body se nahi;
- canonical package name server-side use karta hai;
- product ID ko `serverSecurity.ts` ke allowlist ke through validate karta hai;
- official Google Play Developer API verification aur durable grant store ko call karta hai;
- credentials/store verification unavailable ya unsuccessful ho to fail-closed rehta hai aur entitlement grant nahi karta.

Deployment se pehle server secrets mein `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` (JSON content ya secure file path, project implementation ke mutabik) ya supported `GOOGLE_APPLICATION_CREDENTIALS` configure karein. Google Play Console mein service account permissions, package name aur subscription product IDs ko verify karein. Client-side purchase state ko paid entitlement ka proof na samjhein.

## 9. Corrections ke baad bhi kya baaki hai?

`REMAINING_ISSUES.md` ko dekhein. Khaas taur par:
- `/api/account` DELETE ab authenticated request ko explicit HTTP 501 ke saath fail-closed karta hai aur clearly batata hai ki koi data delete nahi hua. Full provider-aware deletion abhi implement nahi hai; isko provider identity, database cascade/retention policy aur data-erasure requirements samajhkar hi implement karein.
- Existing chemical models/coefficients ko independent lab datasets se validate karna baaki hai.
- Pušić R460 source rows ki independent human second review aur measured water-hardness evidence jaise gates ko software tests se replace nahi kiya ja sakta.
- Android debug APK aur release signing build is correction session mein verify nahi hua.

## 10. Future regression check

Project root mein:
```bash
node scripts/verify-correction-static.mjs
```
Ya package script se:
```bash
npm run test:correction-static
```
Static check source patterns verify karta hai; ye authentication token validity, Gemini API calls, Google Play receipts, build output, Android behavior ya chemistry validate nahi karta.
