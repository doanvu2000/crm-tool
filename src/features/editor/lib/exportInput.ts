import type { SkuInput } from '@/features/analysis';
import { downloadCsv } from '@/shared/lib/download';

const HEADER = ['sku', 'name', 'category', 'revenue', 'revenue_prev', 'gp', 'units', 'units_prev', 'oos_days', 'stock', 'lifecycle', 'seasonal', 'days'];

export function exportInputCsv(rows: readonly SkuInput[], filename = 'sku_input_da_sua.csv') {
  downloadCsv(filename, [
    HEADER,
    ...rows.map((r) => [
      r.sku, r.name, r.category, r.revenue, r.revenuePrev, r.gp, r.units, r.unitsPrev, r.oosDays, r.stock, r.lifecycle, r.seasonal ? 'Y' : 'N', r.days || ''
    ])
  ]);
}
