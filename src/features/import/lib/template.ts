import { downloadCsv } from '@/shared/lib/download';
import { TEMPLATE_HEADER } from './columns';
import { generateSampleData } from './sampleData';

export function downloadTemplate() {
  const rows = generateSampleData(2).map((r) => [
    r.sku, r.name, r.category, r.revenue, r.gp, r.units, r.unitsPrev, r.oosDays, r.stock, r.lifecycle, r.seasonal ? 'Y' : 'N'
  ]);
  downloadCsv('sku_template.csv', [TEMPLATE_HEADER, ...rows]);
}
