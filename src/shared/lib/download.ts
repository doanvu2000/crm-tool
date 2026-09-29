export type CsvRow = (string | number | boolean | null | undefined)[];

const csvCell = (v: CsvRow[number]) => {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export const toCsv = (rows: CsvRow[]) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

/** BOM để Excel mở UTF-8 đúng tiếng Việt. */
export function downloadCsv(filename: string, rows: CsvRow[]) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
