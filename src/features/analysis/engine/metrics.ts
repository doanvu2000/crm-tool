import { THRESHOLDS } from '../model/thresholds';
import type { BaseMetrics, SkuInput } from '../model/types';

/** Selling Days = số ngày của kỳ trừ ngày OOS, nên ADS đã loại ảnh hưởng thiếu hàng. */
export function computeBaseMetrics(r: SkuInput, periodDays: number): BaseMetrics {
  const days = r.days > 0 ? r.days : periodDays;
  const oosDays = Math.min(Math.max(r.oosDays, 0), days);
  const sellingDays = days - oosDays;
  const availableDays = Math.max(0, (r.inStockDays ?? sellingDays) - Math.max(0, r.notDisplayedDays ?? 0));
  const ads = availableDays > 0 ? r.units / availableDays : 0;
  const oosRate = days > 0 ? oosDays / days : 0;
  const expectedDemand = ads * days;
  // Severe OOS: số bán thực không phản ánh nhu cầu, so kỳ trước bằng nhu cầu dự kiến.
  const demandBase = oosRate > THRESHOLDS.oos.critical ? expectedDemand : r.units;
  const growth = r.unitsPrev > 0 ? (demandBase - r.unitsPrev) / r.unitsPrev : null;
  const dos = ads > 0 ? r.stock / ads : r.stock > 0 ? Infinity : null;
  return { days, sellingDays, availableDays, ads, oosRate, expectedDemand, growth, dos, ...comparePrevious(r) };
}

export function comparePrevious(r: SkuInput) {
  const price = r.units > 0 ? r.revenue / r.units : 0;
  const prevRevenueEstimated = !(r.revenuePrev > 0) && r.unitsPrev > 0;
  const prevRevenue = r.revenuePrev > 0 ? r.revenuePrev : prevRevenueEstimated ? r.unitsPrev * price : 0;
  const prevPrice = r.unitsPrev > 0 ? prevRevenue / r.unitsPrev : price;
  const unitsDelta = r.units - r.unitsPrev;
  const revenueDelta = r.revenue - prevRevenue;
  const volumeEffect = unitsDelta * prevPrice;
  return {
    prevRevenue,
    prevRevenueEstimated,
    unitsDelta,
    unitsChange: r.unitsPrev > 0 ? unitsDelta / r.unitsPrev : null,
    revenueDelta,
    revenueGrowth: prevRevenue > 0 ? revenueDelta / prevRevenue : null,
    volumeEffect,
    priceEffect: revenueDelta - volumeEffect
  };
}

/** ADS trung bình theo ngành hàng, mẫu số của ADS Index. */
export function categoryAverageAds(rows: { category: string; ads: number }[]): Map<string, number> {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const a = acc.get(r.category) ?? { sum: 0, n: 0 };
    a.sum += r.ads;
    a.n += 1;
    acc.set(r.category, a);
  }
  return new Map([...acc].map(([k, v]) => [k, v.sum / v.n]));
}
