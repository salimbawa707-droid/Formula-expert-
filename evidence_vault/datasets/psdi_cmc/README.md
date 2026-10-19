# PSDI historical CMC collection

## Attribution and license

Frey, Jeremy G.; Pearman-Kanza, Samantha; Munday, Samuel; Allam, Thomas (2024), *Critical Micelle Concentration (CMC) Data Collection*, Physical Sciences Data Infrastructure (PSDI), accessed 2026-10-19: [resource record](https://resources.psdi.ac.uk/data/a7c82670-d2e2-46c6-920a-74294289aa34). The PSDI resource record declares Open Access and CC BY 4.0; the [PSDI-UK/psdi-datasets repository README](https://github.com/PSDI-UK/psdi-datasets/blob/main/README.md) also states CC-BY-4.0. Underlying reference: NIST, *Critical Micelle Concentrations of Aqueous Surfactant Systems*, NBS NSRDS 36, [DOI 10.6028/NBS.NSRDS.36](https://doi.org/10.6028/NBS.NSRDS.36).

These source files are copied from the PSDI repository's `CMC_DataSets/` folder without edits. Keep this attribution and CC BY 4.0 notice with any redistribution or derived use.

## Inventory and initial structural audit

- `NIST_Table_of_Critical_Micelle_Concentration_Values.csv`: 4,990 data rows; fields include compound number, source CMC text, normalized value/unit slots, temperature, method, author/reference codes, and evaluation metadata.
- `CMC_Compounds.csv`: 719 compound rows with name, IUPAC, SMILES, molecular weights, and a method/provenance field.
- In the 4,990-row measurement file, 4,559 rows have numeric `CMC Value 1`; the first-unit field uses codes `M`, `D`, `W`, `P`, `N`, or blank. The code meanings for non-`M` values are not resolved here; no unit conversion was performed.
- The source also has free-text `CMC` cells and reference codes. Preserve all fields; do not parse date-like/reference codes as concentrations or collapse multiple measurement methods/temperatures into one value.
- The compound file explicitly labels some identities/weights as `LLM initial name and weight`. One visible candidate identity inconsistency is “SODIUM OCTYL 1 SULFATE” paired with IUPAC “sodium;2-ethylhexyl sulfate” and a branched structure. Treat compound identity matching as unresolved until checked against the original NIST references.

## Use gate

This is an openly licensed literature-derived data collection, not a new app laboratory campaign. Archive only for provenance-preserving research. Do not load values into ingredient master data, calibrate a model, or claim engine validation until individual compound identity, unit code, source reference, method, temperature, and record quality are resolved. The dataset's AI-assisted extraction history is documented on the [PSDI resource page](https://resources.psdi.ac.uk/data/a7c82670-d2e2-46c6-920a-74294289aa34).
