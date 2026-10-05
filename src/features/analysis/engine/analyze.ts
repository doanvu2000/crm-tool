import { assignAbcByCategory } from './abc';
import { decideAction } from './actions';
import { dosStatus, isCoreSku, oosStatus, salesMotion, trendStatus, velocityByAds, velocityByIndex } from './classify';
import { categoryAverageAds, computeBaseMetrics } from './metrics';
import type { AnalysisSettings, SkuContext, SkuInput, SkuResult } from '../model/types';

/** Pipeline thuần (không UI): metrics → ABC theo ngành hàng → phân loại → Action. */
export function analyzeSkus(raw: readonly SkuInput[], settings: AnalysisSettings): SkuResult[] {
  const withMetrics = raw.map((r) => ({ ...r, ...computeBaseMetrics(r, settings.periodDays) }));
  const catAds = categoryAverageAds(withMetrics);
  const ranked = assignAbcByCategory(withMetrics, settings.cutA, settings.cutB);

  return ranked.map((r) => {
    const avg = catAds.get(r.category) ?? 0;
    const adsIndex = avg > 0 ? r.ads / avg : 0;
    const ctx: SkuContext = {
      ...r,
      adsIndex,
      velocity: settings.basis === 'index' ? velocityByIndex(adsIndex) : velocityByAds(r.ads),
      dosStatus: dosStatus(r.dos),
      oosStatus: oosStatus(r.oosRate),
      trend: trendStatus(r.growth),
      isNew: r.lifecycle === 'New' || (r.unitsPrev <= 0 && r.units > 0),
      isCore: isCoreSku({ ...r, adsIndex }),
      salesMotion: salesMotion(r, raw, settings.periodDays).motion,
      nonMovingThresholdDays: salesMotion(r, raw, settings.periodDays).thresholdDays,
      weeklySalesEven: salesMotion(r, raw, settings.periodDays).weeklyEven
    };
    return { ...ctx, ...decideAction(ctx) };
  });
}
