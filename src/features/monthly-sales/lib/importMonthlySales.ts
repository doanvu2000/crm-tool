import { normalizeKey, parseNum } from '@/shared/lib/parse';
import type { MonthlySaleInput } from '../model/types';

export class MonthlySalesImportError extends Error {}

const COLUMNS = {
  month: ['month', 'thang', 'period', 'ky'],
  store: ['store', 'storename', 'storecode', 'cuahang', 'chinhanh'],
  sku: ['sku', 'masku', 'mahang', 'masp', 'itemcode'],
  revenue: ['revenue', 'sales', 'doanhthu', 'doanhso'],
  units: ['units', 'qty', 'quantity', 'soluong', 'soluongban']
} as const;

function normalizeMonth(value: unknown): string | null {
  const input = String(value ?? '').trim();
  const yearMonth = input.match(/^(\d{4})[-/.](\d{1,2})$/);
  const monthYear = input.match(/^(\d{1,2})[-/.](\d{4})$/);
  const vietnamese = input.match(/^(?:thang\s*)?(\d{1,2})\s*[-/.]\s*(\d{4})$/i);
  const match = yearMonth
    ? { year: Number(yearMonth[1]), month: Number(yearMonth[2]) }
    : (monthYear ?? vietnamese)
      ? { year: Number((monthYear ?? vietnamese)![2]), month: Number((monthYear ?? vietnamese)![1]) }
      : null;
  if (!match || match.month < 1 || match.month > 12) return null;
  return `${match.year}-${String(match.month).padStart(2, '0')}`;
}

/** Map mỗi dòng lịch sử bán hàng theo tháng sang dạng chuẩn dùng bởi biểu đồ. */
export function mapMonthlySales(json: Record<string, unknown>[]): MonthlySaleInput[] {
  if (!json.length) throw new MonthlySalesImportError('File không có dòng dữ liệu nào.');

  const headers = Object.keys(json[0]);
  const headerMap = Object.fromEntries(Object.entries(COLUMNS).map(([key, aliases]) => [
    key,
    headers.find((header) => new Set<string>(aliases).has(normalizeKey(header)))
  ])) as Record<keyof typeof COLUMNS, string | undefined>;
  const missing = Object.entries(headerMap).filter(([, header]) => !header).map(([key]) => key);
  if (missing.length) {
    const labels: Record<string, string> = { month: 'month', store: 'store', sku: 'sku', revenue: 'revenue', units: 'units' };
    throw new MonthlySalesImportError(`Thiếu cột: ${missing.map((key) => labels[key]).join(', ')}.`);
  }

  const rows: MonthlySaleInput[] = [];
  let invalidMonths = 0;
  for (const row of json) {
    const sku = String(row[headerMap.sku!] ?? '').trim();
    const store = String(row[headerMap.store!] ?? '').trim();
    if (!sku || !store) continue;
    const month = normalizeMonth(row[headerMap.month!]);
    if (!month) {
      invalidMonths++;
      continue;
    }
    rows.push({
      month,
      store,
      sku,
      revenue: parseNum(row[headerMap.revenue!]),
      units: parseNum(row[headerMap.units!])
    });
  }
  if (!rows.length) {
    throw new MonthlySalesImportError(invalidMonths
      ? 'Không tìm thấy dòng hợp lệ. Cột month dùng định dạng YYYY-MM, ví dụ 2026-03.'
      : 'Không tìm thấy dòng có đủ SKU và cửa hàng.');
  }
  return rows;
}
