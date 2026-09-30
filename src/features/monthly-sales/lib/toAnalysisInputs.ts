import type { SkuInput } from '@/features/analysis';
import type { MonthlySaleInput } from '../model/types';

interface MonthlyAggregate {
  sku: string;
  name: string;
  category: string;
  subcat1: string;
  subcat2: string;
  revenue: number;
  units: number;
  gp: number;
  stock: number;
  oosDays: number;
  storeIds: Set<string>;
  lifecycle: MonthlySaleInput['lifecycle'];
  seasonal: boolean;
}

function previousMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  return value === 1 ? `${year - 1}-12` : `${year}-${String(value - 1).padStart(2, '0')}`;
}

function daysInMonth(month: string) {
  const [year, value] = month.split('-').map(Number);
  return new Date(Date.UTC(year, value, 0)).getUTCDate();
}

function aggregateBySku(rows: readonly MonthlySaleInput[], month: string, selectedStores: ReadonlySet<string>) {
  const aggregated = new Map<string, MonthlyAggregate>();
  for (const row of rows) {
    if (row.month !== month || !selectedStores.has(row.store)) continue;
    const current = aggregated.get(row.sku) ?? {
      sku: row.sku,
      name: row.name,
      category: row.category,
      subcat1: row.subcat1 ?? '',
      subcat2: row.subcat2 ?? '',
      revenue: 0,
      units: 0,
      gp: 0,
      stock: 0,
      oosDays: 0,
      storeIds: new Set<string>(),
      lifecycle: row.lifecycle,
      seasonal: false
    };
    current.revenue += row.revenue;
    current.units += row.units;
    current.gp += row.gp;
    current.stock += row.stock;
    current.oosDays += row.oosDays;
    current.storeIds.add(row.store);
    current.seasonal ||= row.seasonal;
    if (row.lifecycle === 'EOL' || (row.lifecycle === 'New' && current.lifecycle === 'Active')) current.lifecycle = row.lifecycle;
    if (!current.name && row.name) current.name = row.name;
    if (!current.subcat1 && row.subcat1) current.subcat1 = row.subcat1;
    if (!current.subcat2 && row.subcat2) current.subcat2 = row.subcat2;
    aggregated.set(row.sku, current);
  }
  return aggregated;
}

/** Tạo một dòng phân tích trên SKU, cộng gộp các cửa hàng đang chọn và so với tháng liền trước. */
export function toAnalysisInputs(
  rows: readonly MonthlySaleInput[],
  month: string,
  selectedStores: readonly string[]
): SkuInput[] {
  if (!month || !selectedStores.length) return [];
  const selected = new Set(selectedStores);
  const current = aggregateBySku(rows, month, selected);
  const previous = aggregateBySku(rows, previousMonth(month), selected);
  const days = daysInMonth(month);

  return [...current.values()].map((row) => ({
    ...row,
    revenuePrev: previous.get(row.sku)?.revenue ?? 0,
    unitsPrev: previous.get(row.sku)?.units ?? 0,
    oosDays: row.oosDays / row.storeIds.size,
    days,
    storeCount: row.storeIds.size
  }));
}
