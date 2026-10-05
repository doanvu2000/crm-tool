import { describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { analyzeSkus } from './analyze';
import { assignAbc } from './abc';
import { comparePrevious } from './metrics';
import { dosStatus, oosStatus, trendStatus, velocityByAds } from './classify';
import { DEFAULT_SETTINGS } from '../model/thresholds';
import { useAnalysisStore } from '../store/analysisStore';
import type { SkuInput } from '../model/types';

const sku = (over: Partial<SkuInput>): SkuInput => ({
  sku: 'X',
  name: '',
  category: 'Cat',
  revenue: 100,
  revenuePrev: 0,
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
  it('SKU vắt qua ngưỡng A vẫn là A', () => {
    const rows = [sku({ sku: 'a', revenue: 70 }), sku({ sku: 'b', revenue: 20 }), sku({ sku: 'c', revenue: 6 }), sku({ sku: 'd', revenue: 4 })];
    const out = assignAbc(rows, 0.8, 0.95);
    expect(out.map((r) => r.abc)).toEqual(['A', 'A', 'B', 'C']);
  });

  it('doanh thu 0 luôn là C', () => {
    const out = assignAbc([sku({ sku: 'z', revenue: 0 })], 0.8, 0.95);
    expect(out[0].abc).toBe('C');
  });
});

describe('analyzeSkus', () => {
  it('xếp ABC độc lập theo từng ngành hàng', () => {
    const rows = analyzeSkus([
      sku({ sku: 'a1', category: 'A', revenue: 70 }),
      sku({ sku: 'a2', category: 'A', revenue: 30 }),
      sku({ sku: 'b1', category: 'B', revenue: 20 }),
      sku({ sku: 'b2', category: 'B', revenue: 10 })
    ], DEFAULT_SETTINGS);
    expect(rows.map((r) => [r.sku, r.abc, r.rank])).toEqual([
      ['a1', 'A', 1], ['a2', 'B', 2], ['b1', 'A', 1], ['b2', 'A', 2]
    ]);
  });

  it('ADS loại ngày OOS và Severe OOS được ưu tiên bổ sung', () => {
    const [r] = analyzeSkus([sku({ units: 200, oosDays: 10, stock: 50, days: 30 })], DEFAULT_SETTINGS);
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
    const rows = analyzeSkus([sku({ sku: 'core', revenue: 1000, units: 1200, stock: 600 }), sku({ sku: 'small', revenue: 1, units: 30 })], DEFAULT_SETTINGS);
    const core = rows.find((r) => r.sku === 'core')!;
    expect(core.isCore).toBe(true);
    expect(core.reasons[0]).toBe('Core SKU');
  });

  it('Overstock không bán thì Stop PO', () => {
    const [r] = analyzeSkus([sku({ units: 0, unitsPrev: 10, stock: 100 })], DEFAULT_SETTINGS);
    expect(r.dos).toBe(Infinity);
    expect(r.group).toBe('Stop PO / Xả hàng');
  });

  it('phân loại Fast theo top 25% peer và yêu cầu bán đều từng tuần', () => {
    const rows = analyzeSkus([
      sku({ sku: 'fast', storeType: 'Mini', subcat1: 'Nước', units: 280, days: 28, weeklyUnits: [70, 70, 70, 70] }),
      sku({ sku: 'slow-1', storeType: 'Mini', subcat1: 'Nước', units: 56, days: 28, weeklyUnits: [56, 0, 0, 0] }),
      sku({ sku: 'slow-2', storeType: 'Mini', subcat1: 'Nước', units: 70, days: 28, weeklyUnits: [18, 17, 18, 17] }),
      sku({ sku: 'slow-3', storeType: 'Mini', subcat1: 'Nước', units: 84, days: 28, weeklyUnits: [21, 21, 21, 21] })
    ], DEFAULT_SETTINGS);
    expect(rows.find((r) => r.sku === 'fast')?.salesMotion).toBe('Fast');
    expect(rows.find((r) => r.sku === 'slow-1')?.salesMotion).toBe('Slow');
  });

  it('gắn cờ Non-moving theo số ngày thực sự có hàng và bỏ ngày chưa bày bán', () => {
    const [row] = analyzeSkus([sku({ category: 'Đồ uống bảo quản lạnh', units: 0, days: 30, inStockDays: 20, notDisplayedDays: 5 })], DEFAULT_SETTINGS);
    expect(row.nonMovingThresholdDays).toBe(14);
    expect(row.salesMotion).toBe('Non-moving');
  });
});

describe('lọc ngành hàng', () => {
  it('chọn nhiều ngành hoặc quay lại tổng tất cả ngành hàng', () => {
    setActivePinia(createPinia());
    const store = useAnalysisStore();
    store.setData([sku({ sku: 'a', category: 'A' }), sku({ sku: 'b', category: 'B' }), sku({ sku: 'c', category: 'C' })], 'test');

    expect(store.selectedCategories).toEqual([]);
    expect(store.categoryRows).toHaveLength(3);

    store.toggleCategory('A');
    store.toggleCategory('C');
    expect(store.selectedCategories).toEqual(['A', 'C']);
    expect(store.categoryRows.map((r) => r.category)).toEqual(['A', 'C']);

    store.selectAllCategories();
    expect(store.selectedCategories).toEqual([]);
    expect(store.categoryRows).toHaveLength(3);
  });
});

describe('so với kỳ trước', () => {
  it('thiếu doanh thu kỳ trước thì ước tính theo giá kỳ này, toàn bộ thay đổi do số lượng', () => {
    const c = comparePrevious(sku({ revenue: 1000, units: 100, unitsPrev: 120 }));
    expect(c.prevRevenueEstimated).toBe(true);
    expect(c.prevRevenue).toBe(1200);
    expect(c.revenueDelta).toBe(-200);
    expect(c.unitsChange).toBeCloseTo(-1 / 6);
    expect(c.volumeEffect).toBe(-200);
    expect(c.priceEffect).toBe(0);
  });

  it('có doanh thu kỳ trước thì tách thay đổi do số lượng và do giá', () => {
    const c = comparePrevious(sku({ revenue: 1100, revenuePrev: 1200, units: 100, unitsPrev: 120 }));
    expect(c.prevRevenueEstimated).toBe(false);
    expect(c.revenueDelta).toBe(-100);
    expect(c.revenueGrowth).toBeCloseTo(-100 / 1200);
    expect(c.volumeEffect).toBe(-200);
    expect(c.priceEffect).toBe(100);
  });

  it('SKU mới không có kỳ trước', () => {
    const c = comparePrevious(sku({ revenue: 500, units: 50, unitsPrev: 0 }));
    expect(c.prevRevenue).toBe(0);
    expect(c.revenueGrowth).toBeNull();
    expect(c.unitsChange).toBeNull();
  });
});

describe('bảng Rule', () => {
  it('id không trùng và Action khớp bảng Rule', async () => {
    const { ACTION_RULES } = await import('../model/actionRules');
    expect(new Set(ACTION_RULES.map((r) => r.id)).size).toBe(ACTION_RULES.length);
    const rows = analyzeSkus(
      [
        sku({ sku: 'eol', lifecycle: 'EOL' }),
        sku({ sku: 'crit', stock: 10 }),
        sku({ sku: 'over', stock: 100000 }),
        sku({ sku: 'new', unitsPrev: 0, stock: 50 })
      ],
      DEFAULT_SETTINGS
    );
    const byId = new Map(ACTION_RULES.map((r) => [r.id, r]));
    for (const r of rows) {
      const rule = byId.get(r.rule)!;
      expect(rule.group).toBe(r.group);
      expect(rule.action).toBe(r.action);
    }
    expect(rows.find((r) => r.sku === 'eol')?.rule).toBe('eol-stock');
    expect(rows.find((r) => r.sku === 'crit')?.rule).toBe('critical');
    expect(rows.find((r) => r.sku === 'over')?.rule).toBe('overstock');
    expect(rows.find((r) => r.sku === 'new')?.rule).toBe('new-replenish');
  });
});
