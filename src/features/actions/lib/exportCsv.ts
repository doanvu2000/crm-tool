import type { SkuResult } from '@/features/analysis';
import { downloadCsv, type CsvRow } from '@/shared/lib/download';

const HEADER = [
  'SKU', 'Tên', 'Ngành', 'Subcat 1', 'Subcat 2', 'ABC', 'Tỷ trọng', 'Doanh thu', 'Doanh thu kỳ trước', 'Chênh lệch doanh thu', 'Growth doanh thu', 'Do số lượng', 'Do giá', 'GP', 'Units', 'Units kỳ trước', 'ADS', 'ADS Index', 'Tốc độ',
  'Tồn', 'DOS', 'Trạng thái tồn', 'OOS Rate', 'Trạng thái OOS', 'Growth', 'Xu hướng', 'Lifecycle', 'Core',
  'Nhóm Action', 'Action', 'Điều kiện kích hoạt'
];

const dosCell = (dos: number | null) => (dos === Infinity ? 'inf' : dos == null ? '' : dos.toFixed(1));

export function exportAnalysisCsv(rows: readonly SkuResult[], filename = 'sku_analysis.csv') {
  const body: CsvRow[] = rows.map((r) => [
    r.sku, r.name, r.category, r.subcat1 ?? '', r.subcat2 ?? '', r.abc, `${(r.share * 100).toFixed(2)}%`, r.revenue,
    Math.round(r.prevRevenue) + (r.prevRevenueEstimated ? ' (ước tính)' : ''), Math.round(r.revenueDelta),
    r.revenueGrowth == null ? '' : `${(r.revenueGrowth * 100).toFixed(1)}%`, Math.round(r.volumeEffect), Math.round(r.priceEffect),
    r.gp, r.units, r.unitsPrev,
    r.ads.toFixed(2), `${(r.adsIndex * 100).toFixed(0)}%`, r.velocity, r.stock, dosCell(r.dos), r.dosStatus,
    `${(r.oosRate * 100).toFixed(1)}%`, r.oosStatus, r.growth == null ? '' : `${(r.growth * 100).toFixed(1)}%`,
    r.trend, r.lifecycle, r.isCore ? 'Y' : '', r.group, r.action, r.reasons.join(' | ')
  ]);
  downloadCsv(filename, [HEADER, ...body]);
}
