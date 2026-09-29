<script setup lang="ts">
import { computed } from 'vue';
import { THRESHOLDS as T, type AnalysisSettings } from '@/features/analysis';
import { pct } from '@/shared/lib/format';

const props = defineProps<{ settings: AnalysisSettings }>();

const METRIC_LABEL = { revenue: 'doanh thu', gp: 'GP', units: 'số lượng' } as const;

const rules = computed(() => {
  const s = props.settings;
  const D = T.dos;
  const G = T.growth;
  return [
    { title: 'ABC', text: `Xếp SKU giảm dần theo ${METRIC_LABEL[s.metric]}. A: tích luỹ đến ${pct(s.cutA, 0)}, B: đến ${pct(s.cutB, 0)}, C: phần còn lại. Tính trên toàn bộ dữ liệu, không đổi theo bộ lọc ngành.` },
    { title: 'ADS', text: 'Units Sold / Selling Days. Selling Days = số ngày của kỳ trừ số ngày OOS, nên ADS đã loại ảnh hưởng thiếu hàng.' },
    { title: 'ADS Index', text: 'SKU ADS / ADS trung bình của ngành hàng.' },
    { title: 'Core SKU', text: `Class A, ADS ≥ ${T.core.minAds}, ADS Index ≥ ${pct(T.core.minAdsIndex, 0)}, OOS ≤ ${pct(T.core.maxOosRate, 0)}, không phải EOL.` },
    { title: 'DOS', text: `Tồn / ADS. ≤${D.criticalLow} Critical Low, đến ${D.low} Low, đến ${D.healthy} Healthy, đến ${D.high} High, đến ${D.excess} Excess, >${D.excess} Overstock.` },
    { title: 'OOS', text: `OOS Days / Total Days. >${pct(T.oos.critical, 0)} là Severe: Growth dùng nhu cầu dự kiến = ADS x số ngày của kỳ.` },
    { title: 'Growth', text: `(Kỳ hiện tại - kỳ trước) / kỳ trước. >${pct(G.strong, 0)} Strong, từ ${pct(G.growth, 0)} Growth, ${pct(G.stableLow, 0)} đến ${pct(G.growth, 0)} Stable, từ ${pct(G.decline, 0)} Decline, thấp hơn là Sharp Decline.` },
    { title: 'Thứ tự Rule', text: 'EOL → New SKU → Seasonal → Severe OOS → DOS kết hợp ABC, tốc độ bán, xu hướng. Rule đầu tiên khớp quyết định Action.' }
  ];
});
</script>

<template>
  <details class="card mt-10">
    <summary class="flex min-h-8 cursor-pointer items-center text-[15px] font-semibold">Quy tắc đang áp dụng</summary>
    <div class="mt-3 grid gap-2.5 text-[13px] text-ink-2 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="rule in rules" :key="rule.title" class="rounded-xl bg-sunken px-3 py-2.5">
        <b class="mb-0.5 block font-semibold text-ink">{{ rule.title }}</b>
        {{ rule.text }}
      </div>
    </div>
  </details>
</template>
