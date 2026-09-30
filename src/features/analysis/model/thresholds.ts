import type { AnalysisSettings } from './types';

/**
 * Baseline Pilot theo "Nguyên tắc xây dựng Analysis.md".
 * Hiệu chỉnh ngưỡng theo ngành hàng chỉ sửa ở đây, engine + UI đọc chung.
 */
export const THRESHOLDS = {
  velocityAds: { fast: 20, normal: 15, slowAbove: 5 },
  velocityIndex: { fast: 1, normal: 0.7, slow: 0.3 },
  dos: { criticalLow: 7, low: 15, healthy: 30, high: 60, excess: 90 },
  oos: { healthy: 0.05, warning: 0.1, critical: 0.2 },
  growth: { strong: 0.2, growth: 0.05, stableLow: -0.05, decline: -0.2 },
  core: { minAds: 20, minAdsIndex: 0.7, maxOosRate: 0.1 },
  newSkuReplenishMaxDos: 15
} as const;

export const DEFAULT_SETTINGS: AnalysisSettings = {
  basis: 'ads',
  periodDays: 56,
  cutA: 0.7,
  cutB: 0.9
};

export function sanitizeSettings(s: AnalysisSettings): AnalysisSettings {
  const cutA = Math.min(0.99, Math.max(0.01, s.cutA || DEFAULT_SETTINGS.cutA));
  const cutB = Math.min(1, Math.max(cutA + 0.01, s.cutB || DEFAULT_SETTINGS.cutB));
  const periodDays = Math.min(366, Math.max(1, Math.round(s.periodDays) || DEFAULT_SETTINGS.periodDays));
  return { ...s, cutA, cutB, periodDays };
}
