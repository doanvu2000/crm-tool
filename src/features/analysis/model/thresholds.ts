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

/** Baseline for the three-month SKU review pilot, sourced from the Lark guideline. */
export const PILOT_THRESHOLDS = {
  abc: { a: 0.8, b: 0.95 },
  growth: { strong: 0.2, growth: 0.05, decline: -0.05, sharpDecline: -0.2 },
  marginIndex: { high: 1.2, healthy: 1, low: 0.8 },
  priceIndex: { premium: 1.3, midHigh: 1, midLow: 0.7 },
  stockDays: { veryLow: 7, low: 15, healthy: 30, high: 60 },
  status: { coreGrowthFloor: -0.05, growthAtRiskFloor: 0.2, growthAtRiskMaxStockDays: 15, overstockStockDaysFloor: 60, lowMarginCeiling: 0.8, declineCeiling: -0.2, slowExcessGrowthCeiling: -0.05 },
  periodDays: 90
} as const;

export const SALES_MOTION_THRESHOLDS = {
  fastPeerShare: 0.25,
  minimumPeers: 4
} as const;

export const NON_MOVING_THRESHOLDS = {
  '01': 5,
  '02': 3,
  '03': 7,
  '04': 14,
  '05': 28,
  '06': 28,
  '08': 28,
  '09': 28,
  '0901': 28,
  '0902': 28,
  '0904': 84,
  '0905': 84,
  '10': 28,
  '11': 56,
  '12': 42,
  '13': 28,
  '14': 42,
  '15': 42,
  '17': 84,
  '18': 90,
  '19': 56,
  '20': 90,
  '21': 56,
  '2103': 90,
  '22': 56,
  '23': 90,
  '24': 56,
  '2402': 90,
  '2404': 90,
  '25': 28,
  '2502': 90,
  '26': 56,
  '2602': 84,
  'đồ uống pha chế tại chỗ': 5,
  'món ăn chế biến tại chỗ': 3,
  'thực phẩm bảo quản lạnh': 7,
  'đồ uống bảo quản lạnh': 14,
  'thực phẩm đông lạnh': 28,
  'kem và đá': 28,
  'đồ uống nhiệt độ thường': 28,
  'rượu bia': 28,
  'rượu châu á': 84,
  'rượu tây': 84,
  'rượu pha chế sẵn': 28,
  'sữa và bánh nhiệt độ thường': 28,
  'thực phẩm tiện lợi': 56,
  'kẹo và chocolate': 42,
  'snack giòn/phồng': 28,
  'bánh ngọt và bánh quy': 42,
  'bánh ngọt & bánh quy': 42,
  'đồ ăn vặt': 42,
  'lương thực, dầu và gia vị khô': 84,
  'lương thực, dầu & gia vị khô': 84,
  'mỹ phẩm': 90,
  'dầu gội, tắm, rửa mặt, răng miệng': 56,
  'chăm sóc sức khỏe và kế hoạch hóa gia đình': 90,
  'giấy, vệ sinh phụ nữ và đồ dệt may': 56,
  'sản phẩm bông giấy': 56,
  'đồ dệt may': 90,
  'chất giặt tẩy và vệ sinh gia đình': 56,
  'đồ gia dụng, đồ dùng một lần, đồ mưa': 90,
  'đồ gia dụng tạp hóa': 90,
  'văn phòng phẩm, đồ chơi, pin, phụ kiện số': 56,
  'thuốc lá và đồ phụ thuốc lá': 28,
  'đồ phụ thuốc lá': 90,
  'chăm sóc thú cưng': 56,
  'vệ sinh thú cưng': 84
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
