import type { SkuResult } from '@/features/analysis';
import { downloadCsv, type CsvRow } from '@/shared/lib/download';

const HEADER = [
  'SKU', 'Tên', 'Ngành', 'ABC', 'Tỷ trọng', 'Doanh thu', 'GP', 'Units', 'Units kỳ trước', 'ADS', 'ADS Index', 'Tốc độ',
  'Tồn', 'DOS', 'Trạng thái tồn', 'OOS Rate', 'Trạng thái OOS', 'Growth', 'Xu hướng', 'Lifecycle', 'Core',
  'Nhóm Action', 'Action', 'Điều kiện kích hoạt'
];

const dosCell = (dos: number | null) => (dos === Infinity ? 'inf' : dos == null ? '' : dos.toFixed(1));

export function exportAnalysisCsv(rows: readonly SkuResult[], filename = 'sku_analysis.csv') {
  const body: CsvRow[] = rows.map((r) => [
    r.sku, r.name, r.category, r.abc, `${(r.share * 100).toFixed(2)}%`, r.revenue, r.gp, r.units, r.unitsPrev,
    r.ads.toFixed(2), `${(r.adsIndex * 100).toFixed(0)}%`, r.velocity, r.stock, dosCell(r.dos), r.dosStatus,
    `${(r.oosRate * 100).toFixed(1)}%`, r.oosStatus, r.growth == null ? '' : `${(r.growth * 100).toFixed(1)}%`,
    r.trend, r.lifecycle, r.isCore ? 'Y' : '', r.group, r.action, r.reasons.join(' | ')
  ]);
  downloadCsv(filename, [HEADER, ...body]);
}
