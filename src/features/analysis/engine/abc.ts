import type { AbcAssignment, SkuInput } from '../model/types';

/** Sales của CVS = doanh thu bán thực tế, là chỉ số duy nhất để xếp ABC. */
export function salesValue(r: SkuInput): number {
  return Math.max(0, r.revenue);
}

/**
 * Pareto: SKU vào class A khi phần tích luỹ TRƯỚC nó còn dưới cutA,
 * nên SKU vắt qua ngưỡng A vẫn thuộc A.
 */
export function assignAbc<T extends SkuInput>(rows: T[], cutA: number, cutB: number): (T & AbcAssignment)[] {
  const total = rows.reduce((s, r) => s + salesValue(r), 0);
  const sorted = [...rows].sort((a, b) => salesValue(b) - salesValue(a));
  let cum = 0;
  return sorted.map((r, i) => {
    const value = salesValue(r);
    const before = cum;
    const share = total > 0 ? value / total : 0;
    cum += share;
    const abc = value <= 0 ? 'C' : before < cutA ? 'A' : before < cutB ? 'B' : 'C';
    return { ...r, share, cumShare: cum, rank: i + 1, abc };
  });
}

/**
 * ABC chỉ có ý nghĩa khi so SKU trong cùng ngành hàng. Mỗi ngành được xếp
 * doanh thu, tỷ trọng và hạng riêng trước khi ghép lại cho các màn hình.
 */
export function assignAbcByCategory<T extends SkuInput>(rows: T[], cutA: number, cutB: number): (T & AbcAssignment)[] {
  const byCategory = new Map<string, T[]>();
  for (const row of rows) {
    const group = byCategory.get(row.category);
    if (group) group.push(row);
    else byCategory.set(row.category, [row]);
  }
  return [...byCategory.values()].flatMap((group) => assignAbc(group, cutA, cutB));
}
