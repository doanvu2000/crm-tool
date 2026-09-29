export const ACCEPTED_FILE = /\.(csv|xlsx|xls)$/i;

/** SheetJS nặng (~400KB) nên chỉ tải khi người dùng thật sự mở file. */
export async function readSheet(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await import('xlsx');
  const workbook = /\.csv$/i.test(file.name)
    ? XLSX.read(await file.text(), { type: 'string' })
    : XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }) : [];
}
