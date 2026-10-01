import { downloadCsv } from '@/shared/lib/download';

const HEADER = ['month', 'store', 'sku', 'revenue', 'units'];

export function downloadMonthlySalesTemplate() {
  downloadCsv('monthly_sales_template.csv', [
    HEADER,
    ['2026-03', 'Cửa hàng A', 'SKU001', '1250000', '10'],
    ['2026-03', 'Cửa hàng B', 'SKU001', '980000', '8'],
    ['2026-04', 'Cửa hàng A', 'SKU001', '1430000', '12']
  ]);
}
