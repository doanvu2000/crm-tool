import { NON_MOVING_THRESHOLDS, SALES_MOTION_THRESHOLDS, THRESHOLDS as T } from '../model/thresholds';
import type { AbcClass, DosStatus, Lifecycle, OosStatus, SalesMotion, SkuInput, Trend, Velocity } from '../model/types';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const NON_NUMERIC_THRESHOLDS = Object.keys(NON_MOVING_THRESHOLDS)
  .sort((a, b) => normalize(b).length - normalize(a).length)
  .filter((key) => !/^\d/.test(key))
  .map((key) => ({ normalized: normalize(key), days: NON_MOVING_THRESHOLDS[key as keyof typeof NON_MOVING_THRESHOLDS] }));

export function nonMovingThresholdDays(r: Pick<SkuInput, 'category' | 'subcat1' | 'subcat2'>): number | null {
  const candidates = [r.subcat2, r.subcat1, r.category].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    const code = candidate.match(/^\s*(\d{2,6})/)?.[1];
    if (code) {
      for (let length = code.length - (code.length % 2); length >= 2; length -= 2) {
        const threshold = NON_MOVING_THRESHOLDS[code.slice(0, length) as keyof typeof NON_MOVING_THRESHOLDS];
        if (threshold != null) return threshold;
      }
    }
    const normalizedCandidate = normalize(candidate);
    const match = NON_NUMERIC_THRESHOLDS.find((item) => normalizedCandidate.includes(item.normalized));
    if (match) return match.days;
  }
  return null;
}

export function weeklySalesEven(weeklyUnits?: readonly number[]): boolean | null {
  if (!weeklyUnits || weeklyUnits.length < 2) return null;
  return weeklyUnits.every((units) => Number.isFinite(units) && units > 0);
}

type SalesMotionRow = Pick<SkuInput, 'sku' | 'category' | 'subcat1' | 'subcat2' | 'storeType' | 'inStockDays' | 'notDisplayedDays' | 'weeklyUnits' | 'units' | 'oosDays' | 'days' | 'lifecycle' | 'seasonal' | 'promotion'>;
type SalesMotionResult = { motion: SalesMotion; thresholdDays: number | null; weeklyEven: boolean | null };

const salesMotionPeerKey = (r: SalesMotionRow) => `${normalize(r.subcat2 || r.subcat1 || r.category)}|${normalize(r.storeType || 'unknown')}`;

/** Index peer ranks once so a dataset with many SKUs does not rescan and sort each cohort per row. */
export function createSalesMotionClassifier(peerRows: readonly SalesMotionRow[], periodDays: number) {
  const cohorts = new Map<string, { size: number; rankBySku: Map<string, number> }>();
  const peersByCohort = new Map<string, { row: SalesMotionRow; ads: number; index: number }[]>();

  peerRows.forEach((row, index) => {
    if (row.units <= 0 || row.lifecycle !== 'Active' || row.seasonal || row.promotion) return;
    const key = salesMotionPeerKey(row);
    const peers = peersByCohort.get(key) ?? [];
    const base = row.days > 0 ? row.days : periodDays;
    const available = Math.max(1, (row.inStockDays ?? Math.max(1, base - Math.max(0, row.oosDays))) - Math.max(0, row.notDisplayedDays ?? 0));
    peers.push({ row, ads: row.units / available, index });
    peersByCohort.set(key, peers);
  });

  for (const [key, peers] of peersByCohort) {
    peers.sort((a, b) => b.ads - a.ads || a.index - b.index);
    const rankBySku = new Map<string, number>();
    peers.forEach(({ row }, index) => {
      // Preserve findIndex semantics for duplicate SKU codes in the same cohort.
      if (!rankBySku.has(row.sku)) rankBySku.set(row.sku, index + 1);
    });
    cohorts.set(key, { size: peers.length, rankBySku });
  }

  return (r: SalesMotionRow): SalesMotionResult => {
    const thresholdDays = nonMovingThresholdDays(r);
    const baseDays = r.days > 0 ? r.days : periodDays;
    const availableDays = Math.max(0, (r.inStockDays ?? Math.max(0, baseDays - Math.max(0, r.oosDays))) - Math.max(0, r.notDisplayedDays ?? 0));
    if (r.lifecycle === 'New' || r.seasonal || r.promotion) return { motion: 'Unknown', thresholdDays, weeklyEven: weeklySalesEven(r.weeklyUnits) };
    if (thresholdDays != null && r.units <= 0 && availableDays >= thresholdDays) return { motion: 'Non-moving', thresholdDays, weeklyEven: weeklySalesEven(r.weeklyUnits) };
    const weeklyEven = weeklySalesEven(r.weeklyUnits);
    if (weeklyEven === false || r.units <= 0) return { motion: r.units > 0 ? 'Slow' : 'Unknown', thresholdDays, weeklyEven };

    const cohort = cohorts.get(salesMotionPeerKey(r));
    if (!cohort || cohort.size < SALES_MOTION_THRESHOLDS.minimumPeers) return { motion: 'Unknown', thresholdDays, weeklyEven };
    const rank = cohort.rankBySku.get(r.sku) ?? 0;
    return { motion: rank > 0 && rank <= Math.ceil(cohort.size * SALES_MOTION_THRESHOLDS.fastPeerShare) ? 'Fast' : 'Slow', thresholdDays, weeklyEven };
  };
}

export function salesMotion(r: SalesMotionRow, peerRows: readonly SalesMotionRow[], periodDays: number): SalesMotionResult {
  return createSalesMotionClassifier(peerRows, periodDays)(r);
}

export function velocityByAds(ads: number): Velocity {
  if (ads >= T.velocityAds.fast) return 'Fast';
  if (ads >= T.velocityAds.normal) return 'Normal';
  if (ads > T.velocityAds.slowAbove) return 'Slow';
  return 'Very Slow';
}

export function velocityByIndex(index: number): Velocity {
  if (index >= T.velocityIndex.fast) return 'Fast';
  if (index >= T.velocityIndex.normal) return 'Normal';
  if (index >= T.velocityIndex.slow) return 'Slow';
  return 'Very Slow';
}

export function dosStatus(dos: number | null): DosStatus {
  if (dos == null) return 'N/A';
  if (dos <= T.dos.criticalLow) return 'Critical Low';
  if (dos <= T.dos.low) return 'Low';
  if (dos <= T.dos.healthy) return 'Healthy';
  if (dos <= T.dos.high) return 'High';
  if (dos <= T.dos.excess) return 'Excess';
  return 'Overstock';
}

export function oosStatus(rate: number): OosStatus {
  if (rate <= T.oos.healthy) return 'Healthy';
  if (rate <= T.oos.warning) return 'Warning';
  if (rate <= T.oos.critical) return 'Critical';
  return 'Severe OOS';
}

export function trendStatus(growth: number | null): Trend {
  if (growth == null) return 'N/A';
  if (growth > T.growth.strong) return 'Strong Growth';
  if (growth >= T.growth.growth) return 'Growth';
  if (growth > T.growth.stableLow) return 'Stable';
  if (growth >= T.growth.decline) return 'Decline';
  return 'Sharp Decline';
}

/** Core SKU: A + ADS Fast + ADS Index từ Normal trở lên + OOS thấp, không tính EOL. */
export function isCoreSku(r: { abc: AbcClass; ads: number; adsIndex: number; oosRate: number; lifecycle: Lifecycle }): boolean {
  return (
    r.abc === 'A' &&
    r.ads >= T.core.minAds &&
    r.adsIndex >= T.core.minAdsIndex &&
    r.oosRate <= T.core.maxOosRate &&
    r.lifecycle !== 'EOL'
  );
}
