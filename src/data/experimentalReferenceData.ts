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
  }
};
