# P0 Engine Dependency Matrix across 13 Canonical Categories

**Project**: Detergent Formula Expert  
**Architecture**: Scientific Execution DAG (24 Reconciled Child Nodes)  

---

## Category Execution Matrix

| Category ID | Category Label | Physical Form | Required Engines | Optional / Conditional Engines | Not Applicable Engines | Required Inputs |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LAUNDRY_LIQUID** | Liquid Laundry | LIQUID | Normalization, ActiveMatter, PHEngine, Viscosity, Density, NVR, CleaningCPI, Costing, Specification, QualityGate | HLB (if nonionic), Chelation (if hard water), LabEvidence | PowderEngine | Ingredients, BatchSize, WaterHardness |
| **LAUNDRY_POWDER** | Washing Powder | POWDER | Normalization, ActiveMatter, PowderEngine, Density, CleaningCPI, Costing, Specification, QualityGate | SlurryPH, Chelation, LabEvidence | ViscosityEngine, LiquidNVR | Ingredients, BatchSize, WaterHardness |
| **DISHWASH_MANUAL** | Manual Dishwash | LIQUID | Normalization, ActiveMatter, PHEngine, Viscosity, Density, CleaningCPI, Costing, Specification, QualityGate | HLB, Chelation, LabEvidence | PowderEngine | Ingredients, BatchSize, WaterHardness |
| **DISHWASH_AUTOMATIC**| Auto Dishwash | LIQUID | Normalization, ActiveMatter, PHEngine, Density, Chelation, CleaningCPI, Costing, Specification, QualityGate | Viscosity, LabEvidence | PowderEngine | Ingredients, BatchSize, WaterHardness |
| **FLOOR_CLEANER** | Floor Cleaner | LIQUID | Normalization, ActiveMatter, PHEngine, Density, NVR, CleaningCPI, Costing, Specification, QualityGate | Viscosity, Chelation | PowderEngine | Ingredients, BatchSize |
| **MULTIPURPOSE_CLEANER**| All Purpose | LIQUID | Normalization, ActiveMatter, PHEngine, Density, NVR, CleaningCPI, Costing, Specification, QualityGate | HLB, Viscosity | PowderEngine | Ingredients, BatchSize |
| **TOILET_CLEANER** | Toilet Cleaner | LIQUID | Normalization, PHEngine (Acid/Alkaline), Viscosity, Density, Costing, Specification, QualityGate | ActiveMatter, Chelation | PowderEngine, HLB | Ingredients, BatchSize |
| **BATHROOM_CLEANER**| Bathroom Cleaner | LIQUID | Normalization, PHEngine, Density, Chelation, Costing, Specification, QualityGate | ActiveMatter, Viscosity | PowderEngine | Ingredients, BatchSize, WaterHardness |
| **GLASS_CLEANER** | Glass Cleaner | LIQUID | Normalization, PHEngine, Density, NVR, Costing, Specification, QualityGate | ActiveMatter, Solvents | ViscosityEngine, PowderEngine | Ingredients, BatchSize |
| **FABRIC_SOFTENER** | Fabric Softener | LIQUID | Normalization, ActiveMatter (Cationic), Viscosity, Density, Costing, Specification, QualityGate | PHEngine, LabEvidence | PowderEngine, CleaningCPI | Ingredients, BatchSize |
| **HAND_WASH** | Liquid Hand Soap | LIQUID | Normalization, ActiveMatter, PHEngine, Viscosity, Density, Costing, Specification, QualityGate | Chelation, LabEvidence | PowderEngine | Ingredients, BatchSize |
| **KITCHEN_DEGREASER**| Heavy Degreaser | LIQUID | Normalization, ActiveMatter, PHEngine (High pH), Density, CleaningCPI, Costing, Specification, QualityGate | Chelation, Viscosity | PowderEngine | Ingredients, BatchSize |
| **CAR_SHAMPOO** | Car Shampoo | LIQUID | Normalization, ActiveMatter, PHEngine, Viscosity, Density, CleaningCPI, Costing, Specification, QualityGate | HLB, Chelation | PowderEngine | Ingredients, BatchSize |

---

## DAG Node Execution Order

1. **NORMALIZATION** (Mass balance & 100% sum check)
2. **IDENTITY_RESOLUTION** (Canonical master library lookup)
3. **CATEGORY_ROUTING** (Canonical category & physical form assignment)
4. **NEUTRALIZATION** (`StoichiometricNeutralizationEngine`)
5. **PH_EQUILIBRIUM** (`PHEngineV2`)
6. **ACTIVE_MATTER** (`ActiveMatterEngine` charge breakdown)
7. **HLB** (`HLBEngine` Griffin/Davies scale isolation)
8. **WATER_CHELATION** (`chelatorEngine` sequestration)
9. **COMPATIBILITY** (`compatibilityEngine` interaction screening)
10. **VISCOSITY** (`viscosityEngine` micellar salt-curve & polymer rheology)
11. **DENSITY** (`densityEngine` ideal volume additivity)
12. **NVR** (`liquidNvrEngine` non-volatile residue)
13. **POWDER_ENGINE** (`powderEngine` bulk density & slurry basis)
14. **CLEANING_CPI** (`cleaningPerformanceEngine` soil detergency)
15. **STABILITY_SCREENING** (Preservative & syneresis screening)
16. **COSTING** (`costingEngine` finished cost & margin chain)
17. **REGULATORY** (`regulatoryEngine` REACH/GHS/phosphate compliance)
18. **MANUFACTURING** (`processModelingEngine` step-by-step mixing sequence)
19. **SPECIFICATION** (`specificationEngine` parameter evaluation)
20. **LAB_EVIDENCE** (`labEvidenceEngine` empirical vs predicted alignment)
21. **QUALITY_GATE** (`scientificQualityGateEngine` commercial release decision)
22. **GRADE** (`gradeEngine` 5-pillar AI grade)
23. **RECOMMENDATIONS** (`expertReasoningEngine` optimization suggestions)
24. **FINALIZATION** (Fingerprint generation & audit trace lock)
