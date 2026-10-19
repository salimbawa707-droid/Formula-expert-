# RepOD CMC conductivity data

## Attribution and license

Balicki, Sebastian (2026), “Pomiary konduktometryczne wyznaczające CMC dla wieloładunkowych surfaktantów kationowych,” RepOD, version 1.0, DOI: [10.18150/IMF2OE](https://doi.org/10.18150/IMF2OE). The dataset record and each of the three raw files identify the license as [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Related publication: Balicki et al. (2026), [Experimental Design and Optimization of Dispersion Systems in Fine and Specialty Chemical Fabrication](https://doi.org/10.3390/molecules31101617).

The raw files are preserved unchanged. `repod_cmc_measurements.csv` is a derived transcription with source file, row index, and line number retained. It carries the same attribution and CC BY 4.0 terms.

## Contents and integrity

- Three raw concentration-series files; the source reports 79, 79, and 44 measurement rows (202 total).
- `repod_cmc_measurements.csv`: normalized 202-row CSV. Numeric readings and source units are preserved; missing metadata stays blank.
- `normalize_repod_cmc.mjs`: offline reproducibility script. It checks the source MD5 values before generating the normalized CSV.
- `data-manifest.json`: file byte counts and MD5/SHA-256 checksums.

## Scope and limitations

The source labels columns as concentration `C [mM]`, dilution volume `V [mL]`, and `conductivity [mS]`. The reported `mS` label is preserved verbatim; no cell constant is supplied in these files, so the data are not converted to specific conductivity. The files do not specify temperature, solvent/matrix composition, instrument/electrode, cell constant, replicate identifiers, or uncertainty. No CMC breakpoint has been calculated from these curves here. Keep these records as external published measurements; they are not internal lab observations and do not validate detergent-cleaning performance or general detergent formulations. Use for an engine benchmark only after the missing method conditions and target output are matched.
