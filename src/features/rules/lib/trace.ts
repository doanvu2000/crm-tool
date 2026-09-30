import { ACTION_RULES, THRESHOLDS as T, metricValue, type AnalysisSettings, type SkuResult } from '@/features/analysis';
import { fmt0, fmt1, pct } from '@/shared/lib/format';
import { METRIC_LABEL } from './methods';

export interface TraceCheck {
  text: string;
  pass: boolean;
}

export interface TraceStep {
  title: string;
  formula: string;
  result: string;
  checks?: TraceCheck[];
}

const dosValue = (r: SkuResult) => (r.dos === Infinity ? '∞' : r.dos == null ? 'N/A' : `${fmt1(r.dos)} ngày`);

function velocityWhy(r: SkuResult, s: AnalysisSettings) {
  if (s.basis === 'index') {
    const I = T.velocityIndex;
    const v = r.adsIndex;
    if (v >= I.fast) return `Index ${pct(v, 0)} ≥ ${pct(I.fast, 0)}`;
    if (v >= I.normal) return `Index ${pct(v, 0)} từ ${pct(I.normal, 0)} đến dưới ${pct(I.fast, 0)}`;
    if (v >= I.slow) return `Index ${pct(v, 0)} từ ${pct(I.slow, 0)} đến dưới ${pct(I.normal, 0)}`;
    return `Index ${pct(v, 0)} < ${pct(I.slow, 0)}`;
  }
  const A = T.velocityAds;
  const v = r.ads;
  if (v >= A.fast) return `ADS ${fmt1(v)} ≥ ${A.fast}`;
  if (v >= A.normal) return `ADS ${fmt1(v)} từ ${A.normal} đến dưới ${A.fast}`;
  if (v > A.slowAbove) return `ADS ${fmt1(v)} trên ${A.slowAbove}, dưới ${A.normal}`;
  return `ADS ${fmt1(v)} ≤ ${A.slowAbove}`;
}

function dosWhy(r: SkuResult) {
  const D = T.dos;
  if (r.dos == null) return 'Không bán, không tồn';
  if (r.dos === Infinity) return 'ADS = 0 mà còn tồn';
  const limit = [D.criticalLow, D.low, D.healthy, D.high, D.excess].find((x) => (r.dos as number) <= x);
  return limit != null ? `${fmt1(r.dos)} ≤ ${limit}` : `${fmt1(r.dos)} > ${D.excess}`;
}

function oosWhy(r: SkuResult) {
  const O = T.oos;
  if (r.oosRate <= O.healthy) return `${pct(r.oosRate)} ≤ ${pct(O.healthy, 0)}`;
  if (r.oosRate <= O.warning) return `${pct(r.oosRate)} ≤ ${pct(O.warning, 0)}`;
  if (r.oosRate <= O.critical) return `${pct(r.oosRate)} ≤ ${pct(O.critical, 0)}`;
  return `${pct(r.oosRate)} > ${pct(O.critical, 0)}`;
}

function trendWhy(r: SkuResult) {
  const G = T.growth;
  const g = r.growth;
  if (g == null) return 'Kỳ trước không bán';
  if (g > G.strong) return `${pct(g)} > ${pct(G.strong, 0)}`;
  if (g >= G.growth) return `${pct(g)} ≥ ${pct(G.growth, 0)}`;
  if (g > G.stableLow) return `${pct(g)} trong khoảng ${pct(G.stableLow, 0)} đến ${pct(G.growth, 0)}`;
  if (g >= G.decline) return `${pct(g)} ≥ ${pct(G.decline, 0)}`;
  return `${pct(g)} < ${pct(G.decline, 0)}`;
}

export function traceSku(r: SkuResult, s: AnalysisSettings, categoryAds: number | null): TraceStep[] {
  const oosDays = r.days - r.sellingDays;
  const severe = r.oosRate > T.oos.critical;
  const before = r.cumShare - r.share;
  const ruleIndex = ACTION_RULES.findIndex((x) => x.id === r.rule);
  const rule = ACTION_RULES[ruleIndex];

  return [
    {
      title: 'Kỳ bán hàng',
      formula: `Kỳ ${r.days} ngày - ${fmt0(oosDays)} ngày OOS`,
      result: `Selling Days = ${fmt0(r.sellingDays)}`
    },
    {
      title: 'ADS và tốc độ bán',
      formula: `${fmt0(r.units)} sp / ${fmt0(r.sellingDays)} ngày`,
      result: `ADS ${fmt1(r.ads)} sp/ngày. ${velocityWhy(r, s)} → ${r.velocity}`
    },
    {
      title: 'ADS Index',
      formula: categoryAds ? `${fmt1(r.ads)} / ADS trung bình ngành ${r.category} ${fmt1(categoryAds)}` : `ADS trung bình ngành ${r.category} = 0`,
      result: `Index ${pct(r.adsIndex, 0)}`
    },
    {
      title: 'ABC',
      formula: `${METRIC_LABEL[s.metric]} ${fmt0(metricValue(r, s.metric))} = ${pct(r.share, 2)} tổng, hạng ${fmt0(r.rank)}. Tích luỹ trước SKU này ${pct(before, 1)}`,
      result: before < s.cutA && r.share > 0
        ? `${pct(before, 1)} < ${pct(s.cutA, 0)} → A`
        : before < s.cutB && r.share > 0
          ? `${pct(before, 1)} từ ${pct(s.cutA, 0)} đến dưới ${pct(s.cutB, 0)} → B`
          : r.share > 0 ? `${pct(before, 1)} ≥ ${pct(s.cutB, 0)} → C` : `${METRIC_LABEL[s.metric]} = 0 → C`
    },
    {
      title: 'DOS',
      formula: `Tồn ${fmt0(r.stock)} / ADS ${fmt1(r.ads)}`,
      result: `DOS ${dosValue(r)}. ${dosWhy(r)} → ${r.dosStatus}`
    },
    {
      title: 'OOS Rate',
      formula: `${fmt0(oosDays)} ngày OOS / ${r.days} ngày`,
      result: `${oosWhy(r)} → ${r.oosStatus}`
    },
    {
      title: 'Growth',
      formula: r.unitsPrev > 0
        ? `(${severe ? `nhu cầu dự kiến ${fmt0(r.expectedDemand)} (Severe OOS)` : `${fmt0(r.units)} sp`} - ${fmt0(r.unitsPrev)} sp kỳ trước) / ${fmt0(r.unitsPrev)}`
        : 'Kỳ trước không bán',
      result: `${trendWhy(r)} → ${r.trend}`
    },
    {
      title: 'Core SKU',
      formula: 'Đủ cả 5 điều kiện',
      result: r.isCore ? 'Là Core SKU' : 'Không phải Core SKU',
      checks: [
        { text: `Class A (đang ${r.abc})`, pass: r.abc === 'A' },
        { text: `ADS ≥ ${T.core.minAds} (đang ${fmt1(r.ads)})`, pass: r.ads >= T.core.minAds },
        { text: `ADS Index ≥ ${pct(T.core.minAdsIndex, 0)} (đang ${pct(r.adsIndex, 0)})`, pass: r.adsIndex >= T.core.minAdsIndex },
        { text: `OOS ≤ ${pct(T.core.maxOosRate, 0)} (đang ${pct(r.oosRate)})`, pass: r.oosRate <= T.core.maxOosRate },
        { text: `Không phải EOL (đang ${r.lifecycle})`, pass: r.lifecycle !== 'EOL' }
      ]
    },
    {
      title: 'Nhóm xét trước',
      formula: 'EOL → New SKU → Seasonal → Severe OOS, khớp nhóm nào thì không xét DOS',
      result: [r.lifecycle === 'EOL' && 'EOL', r.isNew && 'New SKU', r.seasonal && 'Seasonal', severe && 'Severe OOS'].filter(Boolean).join(', ') || 'Không thuộc nhóm nào, xét theo DOS',
      checks: [
        { text: `Lifecycle = EOL (đang ${r.lifecycle})`, pass: r.lifecycle === 'EOL' },
        { text: 'New SKU (Lifecycle = New hoặc kỳ trước không bán)', pass: r.isNew },
        { text: 'Hàng mùa vụ', pass: r.seasonal },
        { text: `Severe OOS (> ${pct(T.oos.critical, 0)})`, pass: severe }
      ]
    },
    {
      title: 'Rule quyết định',
      formula: rule ? `Rule ${ruleIndex + 1} (${rule.stage}): ${rule.when}` : r.rule,
      result: `${r.group}: ${r.action}. Số liệu: ${r.reasons.join(' · ')}`
    }
  ];
}
