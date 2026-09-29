import { describe, expect, it } from 'vitest';
import { analyzeSkus } from './analyze';
import { assignAbc } from './abc';
import { dosStatus, oosStatus, trendStatus, velocityByAds } from './classify';
import { DEFAULT_SETTINGS } from '../model/thresholds';
import type { SkuInput } from '../model/types';

const sku = (over: Partial<SkuInput>): SkuInput => ({
  sku: 'X',
  name: '',
  category: 'Cat',
  revenue: 100,
  gp: 20,
  units: 300,
  unitsPrev: 300,
  oosDays: 0,
  stock: 200,
  lifecycle: 'Active',
  seasonal: false,
  days: 0,
  ...over
});

describe('classify', () => {
  it('phân loại ADS theo ngưỡng liên tục', () => {
    expect(velocityByAds(20)).toBe('Fast');
    expect(velocityByAds(19.5)).toBe('Normal');
    expect(velocityByAds(5.5)).toBe('Slow');
    expect(velocityByAds(5)).toBe('Very Slow');
  });

  it('DOS, OOS, Growth đúng biên', () => {
    expect(dosStatus(7)).toBe('Critical Low');
    expect(dosStatus(30)).toBe('Healthy');
    expect(dosStatus(Infinity)).toBe('Overstock');
    expect(dosStatus(null)).toBe('N/A');
    expect(oosStatus(0.1)).toBe('Warning');
    expect(oosStatus(0.21)).toBe('Severe OOS');
    expect(trendStatus(0.2)).toBe('Growth');
    expect(trendStatus(-0.21)).toBe('Sharp Decline');
    expect(trendStatus(null)).toBe('N/A');
  });
});

describe('assignAbc', () => {
  it('SKU vắt qua ngưỡng 80% vẫn là A', () => {
    const rows = [sku({ sku: 'a', revenue: 70 }), sku({ sku: 'b', revenue: 20 }), sku({ sku: 'c', revenue: 6 }), sku({ sku: 'd', revenue: 4 })];
    const out = assignAbc(rows, 'revenue', 0.8, 0.95);
    expect(out.map((r) => r.abc)).toEqual(['A', 'A', 'B', 'C']);
  });

  it('doanh thu 0 luôn là C', () => {
    const out = assignAbc([sku({ sku: 'z', revenue: 0 })], 'revenue', 0.8, 0.95);
    expect(out[0].abc).toBe('C');
  });
});

describe('analyzeSkus', () => {
  it('ADS loại ngày OOS và Severe OOS được ưu tiên bổ sung', () => {
    const [r] = analyzeSkus([sku({ units: 200, oosDays: 10, stock: 50 })], DEFAULT_SETTINGS);
    expect(r.ads).toBe(10);
    expect(r.oosStatus).toBe('Severe OOS');
    expect(r.group).toBe('Tăng PO');
    expect(r.reasons.join(' ')).toContain('OOS');
  });

  it('EOL luôn Stop PO trước mọi rule khác', () => {
    const [r] = analyzeSkus([sku({ lifecycle: 'EOL', stock: 10, units: 900 })], DEFAULT_SETTINGS);
    expect(r.group).toBe('Stop PO / Xả hàng');
  });

  it('Core SKU cần A, ADS ≥ 20, Index ≥ 70%, OOS ≤ 10%', () => {
    const rows = analyzeSkus([sku({ sku: 'core', revenue: 1000, units: 900, stock: 600 }), sku({ sku: 'small', revenue: 1, units: 30 })], DEFAULT_SETTINGS);
    const core = rows.find((r) => r.sku === 'core')!;
    expect(core.isCore).toBe(true);
    expect(core.reasons[0]).toBe('Core SKU');
  });

  it('Overstock không bán thì Stop PO', () => {
    const [r] = analyzeSkus([sku({ units: 0, unitsPrev: 10, stock: 100 })], DEFAULT_SETTINGS);
    expect(r.dos).toBe(Infinity);
    expect(r.group).toBe('Stop PO / Xả hàng');
  });
});
