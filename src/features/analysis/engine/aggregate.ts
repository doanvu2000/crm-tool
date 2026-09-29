export function countBy<T, K extends keyof T>(rows: readonly T[], key: K, order: readonly T[K][]): number[] {
  const counts = new Map<T[K], number>(order.map((k) => [k, 0]));
  for (const r of rows) {
    const v = r[key];
    if (counts.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return order.map((k) => counts.get(k) ?? 0);
}

export const sumBy = <T>(rows: readonly T[], pick: (r: T) => number) => rows.reduce((s, r) => s + pick(r), 0);
