
export interface ActiveMatterValidation {
  value: number | null;
  status: 'VALID' | 'INSUFFICIENT_DATA';
  reason?: string;
}

export function validateActiveMatterInput(
  value: unknown
): ActiveMatterValidation {
  // Form fields and serialized JSON may carry numeric values as strings.
  // Accept only non-empty numeric strings; never coerce empty strings, booleans,
  // null, NaN, or out-of-range values into a valid assay.
  const normalized = typeof value === 'number'
    ? value
    : (typeof value === 'string' && value.trim() !== '' ? Number(value.trim()) : NaN);

  if (
    !Number.isFinite(normalized) ||
    normalized < 0 ||
    normalized > 100
  ) {
    return {
      value: null,
      status: 'INSUFFICIENT_DATA',
      reason: 'ACTIVE_MATTER_UNKNOWN_OR_INVALID'
    };
  }

  return {
    value: normalized,
    status: 'VALID'
  };
}
