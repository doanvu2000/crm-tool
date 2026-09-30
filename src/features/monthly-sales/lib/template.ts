import { downloadCsv } from '@/shared/lib/download';

const HEADER = ['month', 'store', 'sku', 'name', 'category', 'subcat1', 'subcat2', 'revenue', 'units', 'gp', 'stock', 'oos_days', 'lifecycle', 'seasonal'];

export function downloadMonthlySalesTemplate() {
  downloadCsv('monthly_sales_template.csv', [
    HEADER,
    ['2026-03', 'Cửa hàng A', 'SKU001', 'Sữa tươi 1L', 'Sữa', 'Sữa nước', 'Sữa tươi', '1250000', '10', '210000', '35', '0', 'Active', 'N'],
    ['2026-03', 'Cửa hàng B', 'SKU001', 'Sữa tươi 1L', 'Sữa', 'Sữa nước', 'Sữa tươi', '980000', '8', '165000', '27', '1', 'Active', 'N'],
    ['2026-04', 'Cửa hàng A', 'SKU001', 'Sữa tươi 1L', 'Sữa', 'Sữa nước', 'Sữa tươi', '1430000', '12', '245000', '32', '0', 'Active', 'N']
  ]);
}
