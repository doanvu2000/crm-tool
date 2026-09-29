import type { AbcAssignment, AbcMetric, SkuInput } from '../model/types';

export function metricValue(r: SkuInput, metric: AbcMetric): number {
  const v = metric === 'gp' ? r.gp : metric === 'units' ? r.units : r.revenue;
  return Math.max(0, v);
}

/**
 * Pareto: SKU vào class A khi phần tích luỹ TRƯỚC nó còn dưới cutA,
 * nên SKU vắt qua ngưỡng 80% vẫn thuộc A.
 */
export function assignAbc<T extends SkuInput>(rows: T[], metric: AbcMetric, cutA: number, cutB: number): (T & AbcAssignment)[] {
  const total = rows.reduce((s, r) => s + metricValue(r, metric), 0);
  const sorted = [...rows].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  let cum = 0;
  return sorted.map((r, i) => {
    const value = metricValue(r, metric);
    const before = cum;
    const share = total > 0 ? value / total : 0;
    cum += share;
    const abc = value <= 0 ? 'C' : before < cutA ? 'A' : before < cutB ? 'B' : 'C';
    return { ...r, share, cumShare: cum, rank: i + 1, abc };
  });
}
