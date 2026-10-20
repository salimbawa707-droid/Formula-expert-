# Internal Empirical Lab Methods

## Finished liquid density by calibrated pycnometer

Method ID: `INTERNAL-LIQUID-DENSITY-PYCNOMETER`  
Protocol version: `INTERNAL-LIQUID-DENSITY-PYCNOMETER-v1`  
Reported property: finished-product density in `g/cm³` (numerically equivalent to `g/mL`).

This is a documented internal procedure, not an ASTM or ISO method. It is scoped to homogeneous finished liquid products. It is not a powder bulk-density method and must not be used for separated phases or samples that cannot be filled without entrained air. Record any conditioning used; reject the result if conditioning changes composition or phase state.

1. Confirm the pycnometer volume and balance calibration are current and traceable. Record the pycnometer and balance IDs in the lab record.
2. Homogenize the finished sample using a recorded, composition-preserving procedure. Remove visible entrained air without heating or evaporating the product.
3. Equilibrate the sample and clean, dry pycnometer to `25.0°C ± 0.5°C`; record the sample temperature.
4. Weigh the empty pycnometer, fill it without bubbles, wipe its exterior, and weigh it. Use the calibrated volume at the test temperature to calculate `density = net sample mass / calibrated volume`.
5. Perform three independent fills. Record each result, the mean, standard deviation, sample ID, date, operator, instrument IDs, and raw evidence reference. Store the three individual readings in `replicateValues`; `measuredValue` is their mean.

The app accepts only `g/cm³`, `g/cm3`, or `g/mL` for this method and requires the protocol version, instrument identity, triplicate readings, and a mean matching the recorded result. The empirical evaluation target's `0.015 g/cm³` threshold is a model-comparison tolerance, not a universal product release specification. Product release limits must be set by the manufacturer for the applicable product and jurisdiction.

## Anionic active matter by ISO 2271

Method ID: `ISO-2271`; reference: ISO 2271:1989. The official ISO scope is direct two-phase titration for anionic-active matter; the method is not applicable when cationic surface-active agents are present. The app therefore requires a controlled formula/BOM reference declaring `ANIONIC_ONLY`. Mixed, cationic, and unknown surfactant scope is rejected for this method. The output must be recorded as `Anionic Active Matter` or `Active Matter` in mass percent, with the relative molecular mass assumption and the raw laboratory record retained.

Use the licensed standard and the laboratory's applicable safety procedures. Record the known relative molecular mass used, apparatus identity, mass-percent result, formula/BOM scope reference, and raw evidence. An identified reviewer must accept the anionic-only scope and record the review date before an observation becomes eligible. This repository records method identity and eligibility gates; it does not reproduce the standard's procedure. ISO's public scope/status page: <https://www.iso.org/standard/7094.html>.
