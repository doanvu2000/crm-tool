import { TEMPLATE_HEADER } from './columns';
import { generateSampleData } from './sampleData';

export async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const rows = generateSampleData(6).map((r) => [
    r.sku, r.name, r.category, r.subcat1 ?? '', r.subcat2 ?? '', r.storeType ?? '', r.revenue, r.revenuePrev, r.gp, r.units, r.unitsPrev, r.oosDays, r.stock, r.lifecycle, r.seasonal ? 'Y' : 'N', r.days || '', r.inStockDays ?? '', r.notDisplayedDays ?? '', (r.weeklyUnits ?? []).join('|'), r.promotion ? 'Y' : 'N'
  ]);
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADER, ...rows]);
  sheet['!autofilter'] = { ref: sheet['!ref']! };
  XLSX.utils.book_append_sheet(workbook, sheet, 'SKU Analysis');

  const blob = new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'sku_template.xlsx';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
