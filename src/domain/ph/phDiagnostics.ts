/** Small diagnostic helpers shared by the pH engine and scientific DAG. */
export function mergePHWarnings(...groups: Array<string[] | null | undefined>): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const warning of group ?? []) {
      if (typeof warning !== 'string' || !warning.trim() || seen.has(warning)) continue;
      seen.add(warning);
      merged.push(warning);
    }
  }
  return merged;
}
