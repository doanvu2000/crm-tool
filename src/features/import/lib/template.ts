import { downloadCsv } from '@/shared/lib/download';
import { TEMPLATE_HEADER } from './columns';
import { generateSampleData } from './sampleData';

export function downloadTemplate() {
  const rows = generateSampleData(6).map((r) => [
    r.sku, r.name, r.category, r.subcat1 ?? '', r.subcat2 ?? '', r.storeType ?? '', r.revenue, r.revenuePrev, r.gp, r.units, r.unitsPrev, r.oosDays, r.stock, r.lifecycle, r.seasonal ? 'Y' : 'N', r.days || '', r.inStockDays ?? '', r.notDisplayedDays ?? '', (r.weeklyUnits ?? []).join('|'), r.promotion ? 'Y' : 'N'
  ]);
  downloadCsv('sku_template.csv', [TEMPLATE_HEADER, ...rows]);
}
