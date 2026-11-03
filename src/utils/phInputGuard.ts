export interface PHInputValidation {
  value: number | null;
  status: 'VALID' | 'INSUFFICIENT_DATA';
  reason?: string;
}

export function validatePHInput(
  value: unknown
): PHInputValidation {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 14
  ) {
    return {
      value: null,
      status: 'INSUFFICIENT_DATA',
      reason: 'PH_UNKNOWN_OR_INVALID'
    };
  }

  return {
    value,
    status: 'VALID'
  };
}
