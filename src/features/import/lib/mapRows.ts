import type { Lifecycle, SkuInput } from '@/features/analysis';
import { normalizeKey, parseBool, parseNum } from '@/shared/lib/parse';
import { COLUMNS } from './columns';

export class ImportError extends Error {}

const NEW_KEYS = ['new', 'moi', 'spmoi', 'newsku'];
const EOL_KEYS = ['eol', 'endoflife', 'ngung', 'ngungkinhdoanh', 'thaibo'];

export function parseLifecycle(value: unknown): Lifecycle {
  const k = normalizeKey(value);
  if (NEW_KEYS.includes(k)) return 'New';
  if (EOL_KEYS.includes(k)) return 'EOL';
  return 'Active';
}

/** Map header file người dùng sang SkuInput. Ném ImportError nếu thiếu cột bắt buộc. */
export function mapRows(json: Record<string, unknown>[]): SkuInput[] {
  if (!json.length) throw new ImportError('File không có dòng dữ liệu nào.');

  const headers = Object.keys(json[0]);
  const map = new Map<keyof SkuInput, string>();
  for (const col of COLUMNS) {
    const header = headers.find((h) => col.aliases.includes(normalizeKey(h)));
    if (header) map.set(col.key, header);
  }
  const missing = COLUMNS.filter((c) => c.required && !map.has(c.key)).map((c) => c.label);
  if (missing.length) throw new ImportError(`Thiếu cột: ${missing.join(', ')}. Xem mục "Cột dữ liệu cần có".`);

  const get = (row: Record<string, unknown>, key: keyof SkuInput) => {
    const h = map.get(key);
    return h ? row[h] : undefined;
  };

  const rows = json
    .map<SkuInput>((row) => ({
      sku: String(get(row, 'sku') ?? '').trim(),
      name: String(get(row, 'name') ?? '').trim(),
      category: map.has('category') ? String(get(row, 'category') ?? '').trim() || 'Khác' : 'Chung',
      subcat1: String(get(row, 'subcat1') ?? '').trim(),
      subcat2: String(get(row, 'subcat2') ?? '').trim(),
      storeType: String(get(row, 'storeType') ?? '').trim(),
      revenue: parseNum(get(row, 'revenue')),
      revenuePrev: parseNum(get(row, 'revenuePrev')),
      gp: parseNum(get(row, 'gp')),
      units: parseNum(get(row, 'units')),
      unitsPrev: parseNum(get(row, 'unitsPrev')),
      oosDays: parseNum(get(row, 'oosDays')),
      stock: parseNum(get(row, 'stock')),
      lifecycle: parseLifecycle(get(row, 'lifecycle')),
      seasonal: parseBool(get(row, 'seasonal')),
      days: parseNum(get(row, 'days')),
      inStockDays: parseNum(get(row, 'inStockDays')) || undefined,
      notDisplayedDays: parseNum(get(row, 'notDisplayedDays')) || undefined,
      weeklyUnits: String(get(row, 'weeklyUnits') ?? '').split(/[,;|]/).map((v) => parseNum(v)).filter((v) => Number.isFinite(v)),
      promotion: parseBool(get(row, 'promotion'))
    }))
    .filter((r) => r.sku);

  if (!rows.length) throw new ImportError('Không tìm thấy SKU hợp lệ trong file.');
  return rows;
}
