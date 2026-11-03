/**
 * Narrowly curated experimental reference inputs.
 *
 * These literature-derived pure-component properties are reference parameters,
 * not finished-formula laboratory validation observations.
 */

export interface PureSurfactantCmcReference {
  evidenceId: string;
  surfactant: string;
  valueMolar: number;
  temperatureC: number;
  method: string;
  materialQualityCode: string;
  methodQualityCode: string;
  evaluationCode: string;
  sourceSymbol: string;
  sourceReferenceCode: string;
  citation: string;
  doi: string;
  datasetCitation: string;
  license: string;
  sourceUrl: string;
  scope: string;
}

/**
 * NIST NSRDS 36 / PSDI record for pure sodium dodecyl sulfate (NIST compound 1).
 * Original source row: 0.0082 M, 25 °C, quality AA, evaluation 1,
 * surface-tension linear-plot method, reference 66007, source symbol T.
 */
export const PURE_SURFACTANT_CMC_REFERENCES: Record<string, PureSurfactantCmcReference> = {
  SLS: {
    evidenceId: 'PSDI-CMC-C1-66007-25C',
    surfactant: 'Sodium dodecyl sulfate (SDS/SLS)',
    valueMolar: 0.0082,
    temperatureC: 25,
    method: 'Surface tension linear plot',
    materialQualityCode: 'A',
    methodQualityCode: 'A',
    evaluationCode: '1',
    sourceSymbol: 'T',
    sourceReferenceCode: '66007',
    citation: 'Elworthy, P. H.; Mysels, K. J. The surface tension of sodium dodecylsulfate solutions and the phase separation model of micelle formation. Journal of Colloid and Interface Science 21(3), 331–347 (1966).',
    doi: '10.1016/0095-8522(66)90017-1',
    datasetCitation: 'Frey, J. G.; Pearman-Kanza, S.; Munday, S.; Allam, T. Critical Micelle Concentration (CMC) Data Collection. PSDI, online, 2024-10-20; accessed 2026-10-20.',
    license: 'CC BY 4.0',
    sourceUrl: 'https://nvlpubs.nist.gov/nistpubs/Legacy/NSRDS/nbsnsrds36.pdf',
    scope: 'Pure-component aqueous SLS reference input at 25 °C only; not a mixed-surfactant or finished-formula validation result.'
  },
  /**
   * NIST NSRDS 36 / PSDI record for pure dimethyldodecylamine oxide (NIST compound 21).
   * Original source row: 2.10 X10-3 M, 27 °C, quality BB, evaluation 3 (selected),
   * turbidity / light-scattering plot, reference 62005 (Herrmann 1962), source symbol T.
   * Independent listing row (reference 64016, 25 °C, heat of dilution): 2.0 X10-3 M.
   * Curated after the open-reference benchmark found the previous unsourced
   * 0.20 mM lauramine-oxide default to be ~10x below both NIST rows.
   */
  AMINE_OXIDE_C12: {
    evidenceId: 'PSDI-CMC-C21-62005-27C',
    surfactant: 'Dimethyldodecylamine oxide (C12 lauramine oxide, DDAO)',
    valueMolar: 0.0021,
    temperatureC: 27,
    method: 'Turbidity plot (light scattering)',
    materialQualityCode: 'B',
    methodQualityCode: 'B',
    evaluationCode: '3',
    sourceSymbol: 'T',
    sourceReferenceCode: '62005',
    citation: 'Herrmann, K. W. Non-ionic–cationic micellar properties of dimethyldodecylamine oxide. Journal of Physical Chemistry 66(2), 295–300 (1962).',
    doi: '10.1021/j100808a025',
    datasetCitation: 'Frey, J. G.; Pearman-Kanza, S.; Munday, S.; Allam, T. Critical Micelle Concentration (CMC) Data Collection. PSDI, online, 2024-10-20; accessed 2026-10-21.',
    license: 'CC BY 4.0',
    sourceUrl: 'https://nvlpubs.nist.gov/nistpubs/Legacy/NSRDS/nbsnsrds36.pdf',
    scope: 'Pure-component aqueous C12 dimethylamine oxide (non-ionic form, no added salt) near 25 °C. Commercial C12-14 lauramine oxide is a homolog blend; the protonated (cationic) form below about pH 5 behaves differently. Not a mixed-surfactant or finished-formula validation result.'
  }
};

export interface OpenBenchmarkMixingBias {
  /** Median of log10(CMC_ideal_Clint) - log10(CMC_measured) over intermediate mole fractions. */
  medianLogBias: number;
  points: number;
  systems: number;
}

/**
 * Observed bias of the ideal Clint mixed-micelle rule against measured binary-surfactant
 * CMC data, grouped by headgroup charge-pair class (keys are alphabetically sorted classes;
 * "zwitterionic" corresponds to the app's "amphoteric" type).
 *
 * Source dataset: Sandia National Laboratories P2SURF, file
 * "Mixture_surfactants_CMC/Case-1_Interpolating CMC at intermediate mole fraction/dataset/updated_CMC-Data-for-mixed-micelle.csv",
 * commit 8aa90b9a9d1b2c51df5ce5ed1e863f81eff3f0e8 (MIT License), compiled from published literature;
 * associated paper DOI 10.1186/s13321-025-01112-2. A verbatim copy with sha256 is stored in
 * evidence_vault/open_reference_benchmarks/cmc_mixed/.
 *
 * Only systems with both pure-component endpoint CMCs measured in the same dataset are used.
 * Charge class is inferred from formal charges on the largest SMILES fragment.
 * Recomputed and drift-checked by src/utils/__tests__/openReferenceBenchmark.regression.test.ts.
 * Informational benchmark statistics only: they do not convert any formula output to LAB_VALIDATED.
 */
export const OPEN_BENCHMARK_IDEAL_MIXING_BIAS: Record<string, OpenBenchmarkMixingBias> = {
  'anionic-anionic': { medianLogBias: 0.01, points: 41, systems: 7 },
  'anionic-cationic': { medianLogBias: 1.17, points: 113, systems: 16 },
  'anionic-nonionic': { medianLogBias: 0.28, points: 89, systems: 16 },
  'anionic-zwitterionic': { medianLogBias: 0.97, points: 11, systems: 3 },
  'cationic-cationic': { medianLogBias: 0.05, points: 31, systems: 5 },
  'cationic-nonionic': { medianLogBias: 0.13, points: 35, systems: 8 },
  'cationic-zwitterionic': { medianLogBias: 0.08, points: 15, systems: 5 },
  'nonionic-nonionic': { medianLogBias: 0.00, points: 12, systems: 2 }
};
