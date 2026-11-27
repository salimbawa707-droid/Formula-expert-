# EVD-015 — AI Scientific Scope Review and Rights Quarantine

**Review date:** 2026-11-27  
**Reviewed repository HEAD:** `088101e6edd940205615a91d4025129f75b0eef7`  
**Source:** Bozetine, Ahmed Zaïd, Chitour & Canselier (2008), *Optimization of an Alkylpolyglucoside-Based Dishwashing Detergent Formulation*, Journal of Surfactants and Detergents 11(4), 299–305.  
**DOI:** https://doi.org/10.1007/s11743-008-1089-z  
**Publisher page:** https://aocs.onlinelibrary.wiley.com/doi/10.1007/s11743-008-1089-z  
**Accessible full-text copy inspected:** https://core.ac.uk/download/pdf/12039952.pdf  
**Disposition:** Scientific scope reviewed; commercial reuse/redistribution permission NOT ESTABLISHED; keep quarantined. No repository archive or hash is claimed.

## 1. Rights determination

The publisher page identifies the article and provides a “Read the full text” / shareable-link flow subject to Wiley Online Library Terms and Conditions. The accessible CORE PDF does not itself display a Creative Commons license or a separate reuse grant in the inspected copy. Public readability and CORE hosting are not proof of permission to redistribute, commercially ingest, or archive a copy in this repository.

**Rights disposition:** retain `REVIEW_PENDING_NO_COMMERCIAL_REUSE_GRANT_VERIFIED`; do not promote to a commercially reusable dataset. Article metadata and bounded scientific review may be retained with attribution. Do not commit or redistribute the full text, tables/figures, or extracted numerical dataset for commercial product use unless a valid license or written permission covering that use is obtained.

The publisher page also exposes the article's terms-of-use route. No license text authorizing commercial reuse was verified in this review.

## 2. Experimental system and conditions

The study uses a specific hand-dishwashing formulation DOE with five commercial ingredients:

| Code | Commercial grade | Source-reported identity / concentration |
|---|---|---|
| M | Maranil Paste A55 | Linear sodium alkylbenzenesulfonate; 54–56% pasty |
| T | Texapon NSO | Sodium laureth sulfate; 26.5–27.5% liquid |
| G | Glucopon 600CS UP | C12–C14 alkylpolyglucoside; 50–53% thick liquid |
| D | Dehyton K | Fatty-acid amide derivative with betaine structure; 29–32% pasty |
| NaCl | Sodium chloride | Analytical grade solid; viscosity control |

Study protocol details include:
- Central composite design with **30 runs**, including **four center points**.
- Formula batches prepared at 100 g; pH adjusted to 6.5–7.5 using citric acid.
- Dishwashing test based on ISO 4198 comparative performance guide.
- Test solution: 0.8 mL/L; approximately 25 °C; reported water hardness 280 ppm.
- Soil: vegetable oil mixture (palm and sunflower); 150 µL applied to a 20 cm ceramic plate.
- Plate wash cycle: approximately 30 s including rinse and visual inspection.
- Viscosity: kinematic viscosity at 25 °C using Ubbelohde viscometers, reported in cSt.
- Emulsion stability: turbidity in NTU after a defined oil-emulsification and settling protocol.
- Cloud and clear points measured by cooling/heating observation; stated reproducibility ±1 °C.

These conditions and exact commercial grades are mandatory context. They are not generic LABS/SLES/APG/betaine grade specifications.

## 3. Numerical/model review

The article reports a second-order response-surface model based on the central composite design.

### Plate-cleaning response

The reported plate-number model is:

`Np = 29.37 + 4.50T + 2.33G + 2.33M`

The article reports **R² = 0.47** for predicted versus actual plate number and explicitly discusses substantial unmodeled procedural variability, including uncertainty in the amount of oil deposited on each plate. This is a weak fit for general prediction and must not be represented as a validated universal detergency model.

The ANOVA table reports three linear effects (M, T, G) and four pure-error degrees of freedom. The 30 design runs are DOE observations, not 30 independent external holdout cases.

### Other reported response models

- Kinematic-viscosity response model includes G, G², NaCl, G×D, G×NaCl and D×NaCl terms; reported **R² = 0.92**.
- Turbidity/emulsion-stability response model includes M², D, M×D, D×T, NaCl, T×G and T×NaCl terms; reported **R² = 0.72**.
- Cloud-point model: `tcloud = −1.33 − 0.58T − 0.58D`; reported **R² = 0.73**.
- Cloud/clear-point, viscosity and turbidity are not interchangeable with dynamic foam decay or foam half-life.

### Table 5 — selected limit and compromise formulations

The paper reports the following selected formula percentages and associated response values. Treat these as the paper's selected model/design outcomes, not as a new independent validation set.

| Ingredient | Limit formula wt.% | Compromise formula wt.% |
|---|---:|---:|
| Maranil Paste A55 | 13 | 10 |
| Texapon NSO | 10 | 9 |
| Glucopon 600CS UP | 6 | 5 |
| Dehyton K | 3 | 2 |
| NaCl | 0.9 | 0.9 |

| Response | Limit formula | Compromise formula |
|---|---:|---:|
| Plate number Np | 38.5 | 32.8 |
| Kinematic viscosity | 396 cSt | 190 cSt |
| Turbidity | 14.44 NTU | 12.21 NTU |
| Cloud point | −2.5 °C | −1.6 °C |

The article describes approximately 14% active matter for the limit formula and approximately 11% for the compromise formula. Those values depend on the source commercial-grade assay ranges; they are not transferable to the app's generic ingredient defaults.

## 4. Critical scientific limitations

1. **Supplier-grade dependence is explicitly acknowledged by the authors.** The article states that its models should probably not be applied to similar products from different suppliers because commercial surfactant composition varies with manufacturing process and even batch-to-batch.
2. Plate-number model R² = 0.47 is too weak to support a general-purpose prediction claim.
3. Four center points support an estimate of pure error, not an external validation set.
4. No independent holdout dataset or external replication is established by the inspected article.
5. The paper's Table 5 selected-formula outputs are model/design outcomes and cannot be recycled as independent observed validation labels.
6. Kinematic viscosity in cSt must not be silently relabeled as dynamic viscosity in cP; conversion requires density at the same temperature.
7. Water hardness, oil soil, plate geometry, operator motion, dilution and rinse protocol are part of the response definition.
8. The study is hand-dishwashing only; do not transfer its equations or formula ratios to laundry liquid, washing powder, automatic dishwash, or other categories.
9. This source cannot establish supplier-specific active matter for current catalog grades unless the actual purchased material identity and assay match the source grade.

## 5. Dataset admission and quarantine

| Potential use | Decision |
|---|---|
| Bibliographic/mechanistic reference | ADMIT WITH ATTRIBUTION |
| Internal AI scientific critique of published methods and limitations | ADMIT WITH SOURCE CITATION |
| Commercial redistribution or ingestion of article tables/figures | QUARANTINE — permission not established |
| Treat 30 DOE runs as external holdout validation | REJECT |
| Treat Table 5 predictions as independent observations | REJECT |
| General detergent viscosity/detergency predictor calibration | NOT ELIGIBLE |
| Bounded hand-dishwashing formulation context | REFERENCE ONLY; exact grades and protocol required |

## 6. Closure checklist

- [x] DOI/title/authors/journal/volume/issue/pages reconciled to publisher metadata.
- [x] Accessible full-text copy inspected for experimental design, grade identities, conditions, response definitions and model statistics.
- [x] Poor plate-number fit and supplier/batch transfer warning recorded.
- [x] Table 5 values explicitly bounded as selected model/design outcomes, not external validation.
- [x] Operational rights decision set to quarantine pending a commercial reuse grant.
- [ ] Rights-holder permission or license covering commercial reuse obtained.
- [ ] Exact authorized source bytes archived and SHA-256 pinned, if permitted.
- [ ] Raw replicate data and external validation provenance established (not present in this review).

**Final EVD-015 disposition:** AI scientific scope review CLOSED; rights status remains REVIEW_PENDING / no commercial reuse; source is quarantined from commercial ingestion and model calibration; no external validation credit is allowed.
