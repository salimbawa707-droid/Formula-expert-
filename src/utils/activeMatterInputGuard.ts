export interface ActiveMatterValidation {
  value: number | null;
  status: 'VALID' | 'INSUFFICIENT_DATA';
  reason?: string;
}

export function validateActiveMatterInput(
  value: unknown
): ActiveMatterValidation {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    return {
      value: null,
      status: 'INSUFFICIENT_DATA',
      reason: 'ACTIVE_MATTER_UNKNOWN_OR_INVALID'
    };
  }

  return {
    value,
    status: 'VALID'
  };
}
