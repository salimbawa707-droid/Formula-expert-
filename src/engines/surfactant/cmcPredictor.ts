/**
 * Fail-closed CMC reference contract. No model is bundled or invoked here.
 * Inject a real verified adapter only after provenance and applicability checks.
 */
export type CmcEvidenceLevel = "PUBLISHED_MODEL" | "ESTIMATED";
export type CmcPrediction =
  | { status: "AVAILABLE"; value: number; unit: "mM"; method: string;
      evidenceLevel: CmcEvidenceLevel; confidence: "high" | "medium" | "low";
      temperature_C: number; warnings: string[]; sourceCitation?: string;
      modelVersion?: string; uncertainty?: number }
  | { status: "UNAVAILABLE"; reason: string; evidenceLevel: "UNKNOWN"; warnings: string[] };

export interface CmcComponent { smiles: string; moleFraction: number }
export interface CmcModelAdapter {
  readonly method: string;
  readonly modelVersion: string;
  predict(components: readonly CmcComponent[], temperature_C: number): Promise<{
    value_mM: number; confidence: "high" | "medium" | "low";
    uncertainty?: number; sourceCitation: string;
  }>;
}
const positiveFinite = (n: number): boolean => Number.isFinite(n) && n > 0;

export function validateCmcInputs(components: readonly CmcComponent[], temperature_C: number): string[] {
  const errors: string[] = [];
  if (!components.length) errors.push("At least one component is required.");
  if (!Number.isFinite(temperature_C) || temperature_C <= -273.15)
    errors.push("temperature_C must be finite and above absolute zero.");
  let sum = 0;
  components.forEach((c, i) => {
    if (!c || typeof c !== "object") {
      errors.push(`Component ${i + 1} must be an object.`);
      return;
    }
    if (typeof c.smiles !== "string" || !c.smiles.trim()) errors.push(`Component ${i + 1} has no SMILES identity.`);
    if (!positiveFinite(c.moleFraction)) errors.push(`Component ${i + 1} moleFraction must be finite and positive.`);
    if (Number.isFinite(c.moleFraction)) sum += c.moleFraction;
  });
  if (components.length && (!Number.isFinite(sum) || Math.abs(sum - 1) > 1e-6))
    errors.push("Component mole fractions must sum to 1 within 1e-6.");
  return errors;
}

export async function predictCMC(
  components: readonly CmcComponent[],
  options: { temperature_C?: number; adapter?: CmcModelAdapter } = {},
): Promise<CmcPrediction> {
  const temperature = options.temperature_C ?? 25;
  const errors = validateCmcInputs(components, temperature);
  if (errors.length) return { status: "UNAVAILABLE", reason: errors.join(" "),
    evidenceLevel: "UNKNOWN", warnings: ["INPUT_VALIDATION_FAILED"] };
  if (!options.adapter) return { status: "UNAVAILABLE",
    reason: "No verified SurfPro/P2SURF inference adapter is configured.",
    evidenceLevel: "UNKNOWN", warnings: ["MODEL_NOT_WIRED", "NO_NUMERICAL_PREDICTION_RETURNED"] };
  try {
    const out = await options.adapter.predict(components, temperature);
    const validConfidence = out.confidence === "high" || out.confidence === "medium" || out.confidence === "low";
    const validAdapterMetadata = typeof options.adapter.method === "string" && options.adapter.method.trim().length > 0 &&
      typeof options.adapter.modelVersion === "string" && options.adapter.modelVersion.trim().length > 0;
    if (!positiveFinite(out.value_mM) || typeof out.sourceCitation !== "string" || !out.sourceCitation.trim() ||
        !validConfidence || !validAdapterMetadata ||
        (out.uncertainty !== undefined && (!Number.isFinite(out.uncertainty) || out.uncertainty < 0))) {
      return { status: "UNAVAILABLE", reason: "Model output failed value/provenance validation.",
        evidenceLevel: "UNKNOWN", warnings: ["MODEL_OUTPUT_REJECTED"] };
    }
    return { status: "AVAILABLE", value: out.value_mM, unit: "mM",
      method: options.adapter.method, evidenceLevel: "PUBLISHED_MODEL",
      confidence: out.confidence, temperature_C: temperature,
      sourceCitation: out.sourceCitation, modelVersion: options.adapter.modelVersion,
      ...(out.uncertainty === undefined ? {} : { uncertainty: out.uncertainty }),
      warnings: ["MODEL_PREDICTION_NOT_LAB_VALIDATED"] };
  } catch {
    return { status: "UNAVAILABLE",
      reason: "Model adapter failed; no fallback number was fabricated.",
      evidenceLevel: "UNKNOWN", warnings: ["MODEL_INFERENCE_FAILED"] };
  }
}

/** Clint ideal mixing estimate. CMC inputs must share the same concentration unit. */
export function clintIdealCMC(cmc1_mM: number, cmc2_mM: number, x1: number): CmcPrediction {
  if (!positiveFinite(cmc1_mM) || !positiveFinite(cmc2_mM))
    return { status: "UNAVAILABLE", reason: "Both CMC values must be finite and positive.",
      evidenceLevel: "UNKNOWN", warnings: ["INVALID_CLINT_INPUT"] };
  if (!Number.isFinite(x1) || x1 <= 0 || x1 >= 1)
    return { status: "UNAVAILABLE", reason: "Mole fraction must be strictly between 0 and 1.",
      evidenceLevel: "UNKNOWN", warnings: ["INVALID_CLINT_INPUT"] };
  const value = 1 / (x1 / cmc1_mM + (1 - x1) / cmc2_mM);
  if (!positiveFinite(value)) return { status: "UNAVAILABLE", reason: "Clint result is invalid.",
    evidenceLevel: "UNKNOWN", warnings: ["CLINT_OUTPUT_REJECTED"] };
  return { status: "AVAILABLE", value, unit: "mM", method: "Clint-Ideal",
    evidenceLevel: "ESTIMATED", confidence: "low", temperature_C: 25,
    warnings: ["IDEAL_MIXING_ASSUMPTION", "NOT_LAB_VALIDATED"] };
}
