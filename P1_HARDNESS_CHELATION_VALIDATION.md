# P1 Water Hardness and Chelation Validation

**Workstream**: P1-02  
**Status**: `PASS`  
**Scope**: Chelator Binding Capacity, CaCO3 Equivalence, and Ion Differentiation  

---

## 1. Audit Scope & Objectives
- Convert water hardness (ppm) into $\text{CaCO}_3$-equivalent molar loads.
- Differentiate Calcium ($Ca^{2+}$) and Magnesium ($Mg^{2+}$) binding affinities.
- Model GLDA, Sodium Citrate, and Sodium Gluconate stoichiometry.
- Prevent theoretical binding capacity from masquerading as experimental protection.

## 2. Mathematical Equations & Units
$$\text{Hardness Load (mol/L)} = \frac{\text{Hardness (mg/L CaCO}_3)}{100.086 \text{ g/mol} \times 1000}$$
$$\text{Chelator Capacity (mol/L)} = \frac{C_{\text{chelator}} \times \text{Stoichiometric Ratio}}{\text{MW}_{\text{chelator}}}$$

## 3. Findings & Implementation
- Chelator Engine correctly calculates molar binding ratios and hardness sequestration capacity.
- Missing purity or stability constants correctly trigger `UNKNOWN` or `INSUFFICIENT_DATA`.

## 4. Test Results
- All soft, moderate, high, and mixed hardness test fixtures passed successfully.
