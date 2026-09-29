import { THRESHOLDS as T } from '../model/thresholds';
import type { AbcClass, DosStatus, Lifecycle, OosStatus, Trend, Velocity } from '../model/types';

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
