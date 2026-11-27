# EVD-014 — AI Scientific Scope Review and Rights Revalidation

**Review date:** 2026-11-27  
**Reviewed repository HEAD:** `499d692da77b4ee0e32026075fd5cedc58a03504`  
**Source:** Asano et al. (2025), *Study of Foam in Dishwashing Detergents: Effect of Nonionic Surfactant Addition on Foam Formation*, Journal of Oleo Science 74(4), 377–384.  
**DOI:** https://doi.org/10.5650/jos.ess24197  
**Official publisher PDF:** https://www.jstage.jst.go.jp/article/jos/74/4/74_ess24197/_pdf/-char/en  
**Disposition:** Article-level rights and scientific scope reviewed; repository byte archival/hash pin remain OPEN.

## 1. Rights and identity

The publisher PDF identifies the title, authors, journal, issue, pages and DOI. Its final page (PDF page 8, printed page 384) explicitly states **CC BY 4.0 (Attribution 4.0 International)** and allows sharing and adaptation, including commercial use, with attribution. The article-level rights review is therefore CLOSED subject to attribution and indication of modifications.

This license finding applies to the article itself. It does not automatically license separately hosted raw data, third-party material, supplier product documentation or content excluded from the article license.

The official J-STAGE PDF was readable during this review, but binary download into the repository environment failed. No archived bytes or SHA-256 are claimed. Keep `downloadStatus: NOT_DOWNLOADED` until exact publisher bytes are committed and hashed.

## 2. Experimental system and method boundary

- Primary mixture: AES (Shinorin SPE-1250) and DDAO (CADENAX DM12D-W).
- Nonionic additives: C12MEA(2) and C12AE(20); Table 3 additionally reports C12AE(35).
- Other model-composition components include ethanol, SAS, PEG, citrate acid and hydrotropic agent.
- Commercial AES, AE and MEA grades had broad EO distributions; average EO units were assumed as representative physical-property values.
- Dynamic surface tension: maximum bubble-pressure method (SITA t60), 25 °C.
- CMC surface tension: Wilhelmy method (KRÜSS K12), pH 7.5 in 100 mM phosphate buffer, 25 °C.
- Micellar relaxation: 1H-NMR, 30 °C; AES+DDAO total 3 mM; nonionic 0–3 mM; pH 7.5.
- Model-composition dilution: 0.7 wt.% in soft water; reported Ca2+ = 0.53 mM.

Measured/derived observables include maximum dynamic-surface-tension decrease rate, CMC, DDAO protonation/dissociation behavior and micellar relaxation time T2*. These are not direct foam-height/time or foam half-life measurements.

## 3. Published numerical transcription

### Table 2 — maximum dynamic surface-tension decrease rate

Unit: mN m−1 s−1; model composition at 25 °C.

| Nonionic material | Reported value |
|---|---:|
| C12MEA(2) | 832 |
| C12AE(5) | 491 |
| C12AE(7) | 518 |
| C12AE(10) | 498 |
| C12AE(15) | 550 |
| C12AE(20) | 560 |

These are published table entries, not replicate-level observations. Do not synthesize replicate rows.

### Table 3 — nonionic-only dynamic-surface-tension rate

Unit: mN m−1 s−1.

| Nonionic material | 0.1 mM, 25 °C | 1.0 mM, 42 °C |
|---|---:|---:|
| C12MEA(2) | 2 | 201 |
| C12AE(20) | 8 | 198 |
| C12AE(35) | 34 | 1240 |

Concentration and temperature both differ between columns; do not attribute the between-column difference to either variable alone.

### Additional reported values

- Mixed AES/DDAO CMC at DDAO mole fraction 0.5, pH 7.5, 25 °C: **0.09 mM**.
- Total surfactant concentration for the pH-dependent dynamic-surface-tension study: **9 mM**.
- DDAO-only pKa: **4.6**.
- Apparent DDAO pKa in AES/DDAO at DDAO mole fraction 0.5: **7.4**.
- Near pH 7 in that AES/DDAO system: approximately 60% protonated and 40% deprotonated DDAO.

All values retain the exact system, method and condition scope. They are not universal constants for commercial amine-oxide grades, arbitrary water hardness or finished formulations.

## 4. Scientific interpretation and limits

1. The paper supports a bounded mechanism hypothesis: AES–DDAO electrostatic association changes DDAO protonation behavior; C12MEA(2) increased the dynamic adsorption-rate indicator in the studied mixture.
2. C12AE(20) increased micellar molecular mobility more strongly but did not show the same pH-dependent dynamic adsorption-rate response as C12MEA(2) in this system.
3. The authors explicitly state that only two nonionic types were compared; this is not an exhaustive nonionic-surfactant survey.
4. The `(dγt/dt)max` indicator is a dynamic interfacial adsorption/foam-formation proxy. It is not direct foam stability, drainage half-life, foam-height decay, cleaning score or finished-product performance.
5. The model chassis, commercial grades, phosphate buffer, soft-water calcium level, temperature and methods must remain attached to every extracted datum.
6. Nothing in this paper validates the app's general-purpose foam predictor, mixed-CMC engine, finished-formula cleaning model or any of the 13 product categories.

## 5. Dataset admission

| Potential use | Decision |
|---|---|
| Article-level mechanistic reference for AES/DDAO/nonionic interaction | ADMIT WITH SCOPE |
| Source-attributed published table values | ADMIT WITH SOURCE/PAGE/CONDITION METADATA |
| Raw replicate training data | NOT AVAILABLE FROM THIS REVIEW |
| Foam height/time or half-life calibration | NOT ELIGIBLE |
| Finished detergent formula prediction validation | NOT ELIGIBLE |
| Commercial-grade supplier specification evidence | NOT ELIGIBLE |

This record cannot satisfy BLK-002 and cannot be counted as matched finished-formula prediction/observation pairs.

## 6. Closure checklist

- [x] DOI, title, authors, journal, issue and page range match the publisher PDF.
- [x] Article-level CC BY 4.0 statement located on final PDF page.
- [x] Methods, measured variables, units and conditions reviewed.
- [x] Tables 2 and 3 transcribed with distinct conditions preserved.
- [x] Finished-formula validation scope explicitly rejected.
- [ ] Exact publisher PDF bytes archived in repository.
- [ ] SHA-256 computed from archived bytes and recorded in the source register.
- [ ] Row-level uncertainty extraction (only if the application needs the published table points).

**Final EVD-014 disposition:** article-level rights review CLOSED; source/method review CLOSED within the scope above; byte archival and hash pin OPEN; finished-formula validation contribution NOT ELIGIBLE.
