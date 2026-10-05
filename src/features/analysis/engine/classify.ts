import { NON_MOVING_THRESHOLDS, SALES_MOTION_THRESHOLDS, THRESHOLDS as T } from '../model/thresholds';
import type { AbcClass, DosStatus, Lifecycle, OosStatus, SalesMotion, SkuInput, Trend, Velocity } from '../model/types';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function nonMovingThresholdDays(r: Pick<SkuInput, 'category' | 'subcat1' | 'subcat2'>): number | null {
  const candidates = [r.subcat2, r.subcat1, r.category].filter((value): value is string => Boolean(value));
  const keys = Object.keys(NON_MOVING_THRESHOLDS).sort((a, b) => normalize(b).length - normalize(a).length);
  for (const candidate of candidates) {
    const code = candidate.match(/^\s*(\d{2,6})/)?.[1];
    if (code) {
      for (let length = code.length - (code.length % 2); length >= 2; length -= 2) {
        const threshold = NON_MOVING_THRESHOLDS[code.slice(0, length) as keyof typeof NON_MOVING_THRESHOLDS];
        if (threshold != null) return threshold;
      }
    }
    const key = keys.find((item) => !/^\d/.test(item) && normalize(candidate).includes(normalize(item)));
    if (key) return NON_MOVING_THRESHOLDS[key as keyof typeof NON_MOVING_THRESHOLDS];
  }
  return null;
}

export function weeklySalesEven(weeklyUnits?: readonly number[]): boolean | null {
  if (!weeklyUnits || weeklyUnits.length < 2) return null;
  return weeklyUnits.every((units) => Number.isFinite(units) && units > 0);
}

export function salesMotion(r: Pick<SkuInput, 'sku' | 'category' | 'subcat1' | 'subcat2' | 'storeType' | 'inStockDays' | 'notDisplayedDays' | 'weeklyUnits' | 'units' | 'oosDays' | 'days' | 'lifecycle' | 'seasonal' | 'promotion'>, peerRows: readonly typeof r[], periodDays: number): { motion: SalesMotion; thresholdDays: number | null; weeklyEven: boolean | null } {
  const thresholdDays = nonMovingThresholdDays(r);
  const baseDays = r.days > 0 ? r.days : periodDays;
  const availableDays = Math.max(0, (r.inStockDays ?? Math.max(0, baseDays - Math.max(0, r.oosDays))) - Math.max(0, r.notDisplayedDays ?? 0));
  if (r.lifecycle === 'New' || r.seasonal || r.promotion) return { motion: 'Unknown', thresholdDays, weeklyEven: weeklySalesEven(r.weeklyUnits) };
  if (thresholdDays != null && r.units <= 0 && availableDays >= thresholdDays) return { motion: 'Non-moving', thresholdDays, weeklyEven: weeklySalesEven(r.weeklyUnits) };
  const weeklyEven = weeklySalesEven(r.weeklyUnits);
  if (weeklyEven === false || r.units <= 0) return { motion: r.units > 0 ? 'Slow' : 'Unknown', thresholdDays, weeklyEven };
  const peerKey = (x: typeof r) => `${normalize(x.subcat2 || x.subcat1 || x.category)}|${normalize(x.storeType || 'unknown')}`;
  const peers = peerRows.filter((x) => peerKey(x) === peerKey(r) && x.units > 0 && x.lifecycle === 'Active' && !x.seasonal && !x.promotion).map((x) => {
    const base = x.days > 0 ? x.days : periodDays;
    const available = Math.max(1, (x.inStockDays ?? Math.max(1, base - Math.max(0, x.oosDays))) - Math.max(0, x.notDisplayedDays ?? 0));
    return { row: x, ads: x.units / available };
  }).sort((a, b) => b.ads - a.ads);
  const rank = peers.findIndex((x) => x.row.sku === r.sku) + 1;
  if (peers.length < SALES_MOTION_THRESHOLDS.minimumPeers) return { motion: 'Unknown', thresholdDays, weeklyEven };
  return { motion: rank > 0 && rank <= Math.ceil(peers.length * SALES_MOTION_THRESHOLDS.fastPeerShare) ? 'Fast' : 'Slow', thresholdDays, weeklyEven };
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
