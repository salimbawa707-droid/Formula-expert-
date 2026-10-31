# P1 Changelog

**Project**: Detergent Formula Expert  
**Version**: 2.5.0-P1  
**Date**: October 31, 2026  

---

## Changes in P1
1. **Stoichiometric Neutralization & pH (P1-01)**: Validated equivalent weights, commercial purity scaling, and iterative PHEngine V2 convergence without arbitrary fallbacks.
2. **Water Hardness & Chelation (P1-02)**: Implemented CaCO3-equivalent hardness conversion, calcium/magnesium load differentiation, and stoichiometry for GLDA, sodium citrate, and sodium gluconate.
3. **Viscosity Model Validation (P1-03)**: Restricted Brookfield viscosity models to valid empirical domains with explicit out-of-domain rejection.
4. **CPI Validation (P1-04)**: Established rigorous multi-factor scoring provenance and separated software predictions from empirical lab trials.
5. **13 Product Categories (P1-05)**: Configured comprehensive execution profiles for all 13 canonical categories, isolating liquid and powder pathways.
6. **Evidence Governance**: Enforced rigorous review status and provenance tracking in the Evidence Vault and Lab Evidence pipelines.
