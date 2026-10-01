import type { PilotSkuInput } from '@/features/analysis';
import { normalizeKey, parseNum } from '@/shared/lib/parse';

const fields = {
  sku: ['sku', 'masp', 'masku', 'itemcode', 'productcode'],
  name: ['name', 'productname', 'tensanpham', 'product'],
  category: ['category', 'nganhhang', 'nganh', 'danhmuc'],
  sellingPrice: ['sellingprice', 'giaban', 'asp', 'averageprice'],
  inventoryQty: ['inventoryqty', 'endingstockqty', 'stock', 'tonkho', 'soluongton'],
  inventoryValue: ['inventoryvalue', 'endinginventoryvalue', 'tonkhogiatri', 'giatritonkho'],
  openingInventoryValue: ['openinginventoryvalue', 'beginninginventoryvalue', 'tondaikygiatri'],
  cogs3m: ['cogs3m', 'cogs', 'costofgoodssold', 'giavon']
} as const;

const monthlyAliases = (kind: 'salesqty' | 'revenue' | 'profit', month: number) => {
  const m = `m${month}`;
  if (kind === 'salesqty') return [`salesqty${m}`, `qty${m}`, `units${m}`, `sales${m}qty`, `soluongban${m}`];
  if (kind === 'revenue') return [`revenue${m}`, `sales${m}`, `sales${m}value`, `doanhthu${m}`];
  return [`profit${m}`, `grossprofit${m}`, `loinhuangop${m}`, `profitm${month}`];
};

const find = (row: Record<string, unknown>, names: readonly string[]) => {
  const wanted = new Set(names.map(normalizeKey));
  const entry = Object.entries(row).find(([key]) => wanted.has(normalizeKey(key)));
  return entry?.[1];
};

export function mapPilotRows(rows: Record<string, unknown>[]): PilotSkuInput[] {
  const mapped: PilotSkuInput[] = [];
  for (const row of rows) {
    const sku = String(find(row, fields.sku) ?? '').trim();
    if (!sku) continue;
    const monthQty = [1, 2, 3].map((month) => find(row, monthlyAliases('salesqty', month)));
    const monthRevenue = [1, 2, 3].map((month) => find(row, monthlyAliases('revenue', month)));
    const monthProfit = [1, 2, 3].map((month) => find(row, monthlyAliases('profit', month)));
    const hasMonthlyColumns = monthQty.some((v) => v !== undefined) || monthRevenue.some((v) => v !== undefined);
    const monthlyAvailable = monthQty.every((v) => v !== undefined) && monthRevenue.every((v) => v !== undefined);
    if (hasMonthlyColumns && !monthlyAvailable) {
      throw new Error('Để tính Growth, cần đủ cột doanh số lượng và doanh thu cho cả M1, M2, M3.');
    }
    const aggregateQty = find(row, ['salesqty3m', 'salesqty', 'units', 'soluongban']);
    const aggregateRevenue = find(row, ['revenue3m', 'revenue', 'doanhthu', 'salesvalue']);
    const aggregateProfit = find(row, ['profit3m', 'profit', 'grossprofit', 'loinhuangop']);
    const salesQty = (monthlyAvailable ? monthQty : [undefined, undefined, aggregateQty]).map(parseNum) as [number, number, number];
    const revenue = (monthlyAvailable ? monthRevenue : [undefined, undefined, aggregateRevenue]).map(parseNum) as [number, number, number];
    const profit = (monthProfit.some((v) => v !== undefined) ? monthProfit : [undefined, undefined, aggregateProfit]).map(parseNum) as [number, number, number];
    mapped.push({
      sku,
      name: String(find(row, fields.name) ?? '').trim() || sku,
      category: String(find(row, fields.category) ?? '').trim() || 'Chưa phân ngành',
      salesQty,
      revenue,
      profit,
      monthlyAvailable,
      sellingPrice: parseNum(find(row, fields.sellingPrice)),
      inventoryQty: parseNum(find(row, fields.inventoryQty)),
      inventoryValue: parseNum(find(row, fields.inventoryValue)),
      openingInventoryValue: find(row, fields.openingInventoryValue) === undefined ? null : parseNum(find(row, fields.openingInventoryValue)),
      cogs3m: parseNum(find(row, fields.cogs3m))
    });
  }
  if (mapped.length === 0) throw new Error('Không tìm thấy dòng có mã SKU. Kiểm tra lại tên cột SKU.');
  return mapped;
}

export function downloadPilotTemplate() {
  const header = [
    'sku', 'name', 'category', 'sales_qty_m1', 'sales_qty_m2', 'sales_qty_m3',
    'revenue_m1', 'revenue_m2', 'revenue_m3', 'profit_m1', 'profit_m2', 'profit_m3',
    'selling_price', 'inventory_qty', 'inventory_value', 'opening_inventory_value', 'cogs_3m'
  ];
  const blob = new Blob([`\uFEFF${header.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'sku-pilot-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}
