import { parseLifecycle } from '@/features/import';
import { normalizeKey, parseBool, parseNum } from '@/shared/lib/parse';
import type { MonthlySaleInput } from '../model/types';

export class MonthlySalesImportError extends Error {}

const COLUMNS = {
  month: ['month', 'thang', 'period', 'ky'],
  store: ['store', 'storename', 'storecode', 'cuahang', 'chinhanh'],
  sku: ['sku', 'masku', 'mahang', 'masp', 'itemcode'],
  name: ['name', 'ten', 'tensanpham', 'tensp', 'productname'],
  category: ['category', 'nganh', 'nganhhang', 'danhmuc', 'cat'],
  subcat1: ['subcat1', 'subcategory1', 'sub1', 'nganhhangcon1'],
  subcat2: ['subcat2', 'subcategory2', 'sub2', 'nganhhangcon2'],
  revenue: ['revenue', 'sales', 'doanhthu', 'doanhso'],
  units: ['units', 'qty', 'quantity', 'soluong', 'soluongban'],
  gp: ['gp', 'grossprofit', 'profit', 'loinhuangop', 'loinhuan'],
  stock: ['stock', 'currentstock', 'tonkho', 'ton', 'toncuoiky'],
  oosDays: ['oosdays', 'ngayoos', 'ngayhethang', 'songayhethang'],
  lifecycle: ['lifecycle', 'vongdoi', 'trangthai'],
  seasonal: ['seasonal', 'muavu', 'theomua']
} as const;

const REQUIRED_COLUMNS = ['month', 'store', 'sku', 'category', 'revenue', 'units', 'gp', 'stock', 'oosDays'] as const;

function normalizeMonth(value: unknown): string | null {
  const input = String(value ?? '').trim();
  const yearMonth = input.match(/^(\d{4})[-/.](\d{1,2})$/);
  const monthYear = input.match(/^(\d{1,2})[-/.](\d{4})$/);
  const vietnamese = input.match(/^(?:tháng\s*)?(\d{1,2})\s*[-/.]\s*(\d{4})$/i);
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
  const missing = REQUIRED_COLUMNS.filter((key) => !headerMap[key]);
  if (missing.length) {
    throw new MonthlySalesImportError(`Thiếu cột bắt buộc: ${missing.join(', ')}.`);
  }

  const get = (row: Record<string, unknown>, key: keyof typeof COLUMNS) => {
    const header = headerMap[key];
    return header ? row[header] : undefined;
  };
  const rows: MonthlySaleInput[] = [];
  let invalidMonths = 0;
  for (const row of json) {
    const sku = String(get(row, 'sku') ?? '').trim();
    const store = String(get(row, 'store') ?? '').trim();
    if (!sku || !store) continue;
    const month = normalizeMonth(get(row, 'month'));
    if (!month) {
      invalidMonths++;
      continue;
    }
    rows.push({
      month,
      store,
      sku,
      name: String(get(row, 'name') ?? '').trim(),
      category: String(get(row, 'category') ?? '').trim() || 'Chung',
      subcat1: String(get(row, 'subcat1') ?? '').trim(),
      subcat2: String(get(row, 'subcat2') ?? '').trim(),
      revenue: parseNum(get(row, 'revenue')),
      units: parseNum(get(row, 'units')),
      gp: parseNum(get(row, 'gp')),
      stock: parseNum(get(row, 'stock')),
      oosDays: parseNum(get(row, 'oosDays')),
      lifecycle: parseLifecycle(get(row, 'lifecycle')),
      seasonal: parseBool(get(row, 'seasonal'))
    });
  }
  if (!rows.length) {
    throw new MonthlySalesImportError(invalidMonths
      ? 'Không tìm thấy dòng hợp lệ. Cột month dùng định dạng YYYY-MM, ví dụ 2026-03.'
      : 'Không tìm thấy dòng có đủ SKU và cửa hàng.');
  }
  return rows;
}
