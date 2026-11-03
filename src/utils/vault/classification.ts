export const RowType = {
  HEADER: 'HEADER',
  METADATA: 'METADATA',
  BLANK: 'BLANK',
  NUMERIC_DATA: 'NUMERIC_DATA',
  MIXED_DATA: 'MIXED_DATA',
  AMBIGUOUS: 'AMBIGUOUS'
} as const;

export type RowTypeValue = typeof RowType[keyof typeof RowType];

export function classifyRow(row: any[], rowIndex: number, _totalRows?: number): RowTypeValue {
  // 1. BLANK
  if (row.every(c => c === null || c === '' || c === undefined)) return RowType.BLANK;

  // 2. NUMERIC_DATA
  const numericCells = row.filter(c => typeof c === 'number' && !isNaN(c));
  const textCells = row.filter(c => typeof c === 'string' && c.trim() !== '');

  if (numericCells.length > 0 && textCells.length === 0) return RowType.NUMERIC_DATA;
  if (numericCells.length > 0 && textCells.length > 0) return RowType.MIXED_DATA;

  // 3. HEADER/METADATA
  const firstCellStr = String(row[0] || '').toLowerCase();
  if (rowIndex < 5 && /sample|test|shear|radius|time|contents|units|name/i.test(firstCellStr)) {
    return RowType.HEADER;
  }

  return RowType.METADATA;
}
