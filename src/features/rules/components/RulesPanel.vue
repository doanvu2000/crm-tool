<script setup lang="ts">
import { computed } from 'vue';
import { ACTION_GROUPS, ACTION_RULES, THRESHOLDS as T, useAnalysisStore, type AnalysisSettings } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, pct } from '@/shared/lib/format';
import ColorDot from '@/shared/ui/ColorDot.vue';
import { abcRule, compareRule, coreRule, dosRule, oosRule, trendRule, velocityRule } from '../lib/methods';

const props = defineProps<{ settings: AnalysisSettings }>();
const store = useAnalysisStore();
const palette = usePalette();

const rules = computed(() => {
  const s = props.settings;
  return [
    { title: 'ABC', text: abcRule(s, store.rows.length) },
    { title: 'ADS', text: `Units Sold / Selling Days. Selling Days = kỳ ${s.periodDays} ngày trừ số ngày OOS, nên ADS đã loại ảnh hưởng thiếu hàng.` },
    { title: 'ADS Index', text: 'SKU ADS / ADS trung bình của ngành hàng.' },
    { title: 'Tốc độ bán', text: velocityRule(s) },
    { title: 'Core SKU', text: coreRule() },
    { title: 'DOS', text: `Tồn / ADS. ${dosRule()}` },
    { title: 'OOS', text: `OOS Days / Total Days. ${oosRule()} Severe OOS: Growth dùng nhu cầu dự kiến = ADS x số ngày của kỳ.` },
    { title: 'Growth', text: `(Kỳ hiện tại - kỳ trước) / kỳ trước. ${trendRule()}` },
    { title: 'So với kỳ trước', text: compareRule() },
    { title: 'New SKU', text: `Lifecycle = New, hoặc kỳ trước không bán mà kỳ này có bán. Bổ sung khi DOS ≤ ${T.newSkuReplenishMaxDos}, còn lại theo dõi.` }
  ];
});

const counts = computed(() => {
  const m = new Map<string, number>();
  for (const r of store.visibleRows) m.set(r.rule, (m.get(r.rule) ?? 0) + 1);
  return m;
});

const groupColor = (g: string) => palette.value.action[ACTION_GROUPS.indexOf(g as (typeof ACTION_GROUPS)[number])];
const cell = 'border-t border-line px-3 py-2 align-top';
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

    <h3 class="card-title mt-6">Bảng Rule ra Action</h3>
    <p class="card-sub">
      Xét từ trên xuống, Rule đầu tiên khớp quyết định Action. Cột SKU đếm trên {{ fmt0(store.visibleRows.length) }} SKU đang xem.
      Core SKU vẫn đi theo bảng này, chỉ thêm nhãn Core vào lý do.
    </p>
    <div class="overflow-x-auto rounded-xl border border-line">
      <table class="w-full min-w-[760px] border-collapse text-[13px]">
        <thead class="bg-sunken text-ink-2">
          <tr>
            <th scope="col" class="px-3 py-2 text-left font-medium">#</th>
            <th scope="col" class="px-3 py-2 text-left font-medium">Nhóm xét</th>
            <th scope="col" class="px-3 py-2 text-left font-medium">Điều kiện</th>
            <th scope="col" class="px-3 py-2 text-left font-medium">Action</th>
            <th scope="col" class="px-3 py-2 text-right font-medium">SKU</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in ACTION_RULES" :key="r.id" :class="counts.get(r.id) ? '' : 'text-ink-3'">
            <td :class="[cell, 'num text-ink-3']">{{ i + 1 }}</td>
            <td :class="[cell, 'whitespace-nowrap']">{{ r.stage }}</td>
            <td :class="cell">{{ r.when }}</td>
            <td :class="cell">
              <span class="pill"><ColorDot :color="groupColor(r.group)" />{{ r.group }}</span>
              <div class="mt-0.5" :class="counts.get(r.id) ? 'text-ink' : ''">{{ r.action }}</div>
            </td>
            <td :class="[cell, 'num text-right']">{{ fmt0(counts.get(r.id) ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-2 text-xs text-ink-3">Severe OOS: OOS &gt; {{ pct(T.oos.critical, 0) }}. Ngưỡng DOS: {{ T.dos.criticalLow }} / {{ T.dos.low }} / {{ T.dos.healthy }} / {{ T.dos.high }} / {{ T.dos.excess }} ngày.</p>
  </details>
</template>
