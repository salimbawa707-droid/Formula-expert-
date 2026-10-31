# P1 Product Category Validation Matrix

**Workstream**: P1-05  
**Status**: `PASS`  
**Scope**: All 13 Canonical Product Categories Scientific Routing & Execution Profiles  

---

## 1. Matrix Overview
All 13 canonical product categories are fully defined with explicit execution profiles, separating liquid and powder pathways and marking unsupported engines as `NOT_APPLICABLE`.

| Category ID | Product Name | Primary Form | Required Engines | Prohibited / N/A Engines |
| :--- | :--- | :--- | :--- | :--- |
| `LAUNDRY_LIQUID` | Liquid Laundry Detergent | Liquid | Active, pH, Viscosity, NVR, Chelation | Powder Slurry Engine |
| `LAUNDRY_POWDER` | Laundry Detergent Powder | Powder | Active, Powder Engine, Bulk Density | Liquid Viscosity, NVR |
| `DISHWASH_MANUAL` | Manual Dishwash Liquid | Liquid | Active, pH, Viscosity, Foaming | Powder Engine |
| `DISHWASH_AUTOMATIC` | Auto Dishwasher Detergent | Powder/Tab | Active, Builder, pH | Liquid Viscosity |
| `FLOOR_CLEANER` | Floor Cleaner | Liquid | Active, pH, Viscosity | Powder Engine |
| `MULTIPURPOSE_CLEANER`| Multipurpose Surface Cleaner | Liquid | Active, pH, Viscosity | Powder Engine |
| `TOILET_CLEANER` | Acidic Toilet Bowl Cleaner | Liquid | Active, pH, Viscosity | Powder Engine |
| `BATHROOM_CLEANER` | Bathroom Cleaner | Liquid | Active, pH, Viscosity | Powder Engine |
| `GLASS_CLEANER` | Streak-Free Glass Cleaner | Liquid | Active, pH, Solvent | Viscosity, Powder Engine |
| `FABRIC_SOFTENER` | Cationic Fabric Softener | Liquid | Cationic Active, pH, Viscosity | Anionic Surfactant Checks |
| `HAND_WASH` | Liquid Hand Wash | Liquid | Active, pH, Viscosity, Skin pH | Powder Engine |
| `KITCHEN_DEGREASER` | Heavy-Duty Degreaser | Liquid | Active, Alkaline pH, Solvent | Powder Engine |
| `CAR_SHAMPOO` | Automotive Wash Shampoo | Liquid | Active, pH, Foaming | Powder Engine |

## 2. Test Results
- All category routing tests and negative constraints passed with 100% success.
