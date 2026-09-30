<script setup lang="ts">
import { computed } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import { ABC_CLASSES, type AbcClass, type SkuResult } from '@/features/analysis';
import ChartCanvas from '@/shared/charts/ChartCanvas.vue';
import { animation, categoryAxis, tooltipStyle, valueAxis } from '@/shared/charts/options';
import { usePalette } from '@/shared/composables/usePalette';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ChartLegend from '@/shared/ui/ChartLegend.vue';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[]; active?: string | null }>();
const emit = defineEmits<{ pick: [abc: AbcClass] }>();
const palette = usePalette();

const legend = computed(() => [
  { label: '% số SKU', color: palette.value.compare[0] },
  { label: '% đóng góp', color: palette.value.compare[1] }
]);

const config = computed<ChartConfiguration<'bar'>>(() => {
  const p = palette.value;
  const n = props.rows.length || 1;
  const total = props.rows.reduce((s, r) => s + r.share, 0) || 1;
  const byClass = ABC_CLASSES.map((k) => props.rows.filter((r) => r.abc === k));
  const bar = { borderRadius: 4, borderSkipped: false, maxBarThickness: 36 } as const;
  const fade = (c: string) => ABC_CLASSES.map((k) => (!props.active || props.active === k ? c : c + '40'));
  return {
    type: 'bar',
    data: {
      labels: ABC_CLASSES.map((k) => `Class ${k}`),
      datasets: [
        { label: '% số SKU', data: byClass.map((g) => (g.length / n) * 100), backgroundColor: fade(p.compare[0]), ...bar },
        { label: '% đóng góp', data: byClass.map((g) => (g.reduce((s, r) => s + r.share, 0) / total) * 100), backgroundColor: fade(p.compare[1]), ...bar }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animation(),
      onClick: (_e, els) => {
        if (els.length) emit('pick', ABC_CLASSES[els[0].index]);
      },
      onHover: (e, els) => {
        const t = e.native?.target as HTMLElement | undefined;
        if (t) t.style.cursor = els.length ? 'pointer' : 'default';
      },
      plugins: {
        tooltip: { ...tooltipStyle(p), callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}%` } }
      },
      scales: {
        x: categoryAxis(p),
        y: { ...valueAxis(p), max: 100, ticks: { ...valueAxis(p).ticks, callback: (v) => `${v}%` } }
      }
    }
  };
});
</script>

<template>
  <BaseCard title="Cơ cấu ABC" subtitle="% số SKU so với % đóng góp">
    <template #info><MethodInfo topic="abcMix" /></template>
    <ChartLegend :items="legend" />
    <ChartCanvas :config="config" label="Cơ cấu ABC theo số SKU và đóng góp. Bấm 1 class để lọc mọi bảng" tall />
    <div class="sr-only flex flex-wrap gap-1.5 focus-within:not-sr-only focus-within:mt-2" role="group" aria-label="Lọc theo class ABC">
      <button
        v-for="k in ABC_CLASSES"
        :key="k"
        type="button"
        class="rounded-full border px-2.5 py-1 text-xs"
        :class="active === k ? 'border-ink bg-ink text-canvas' : 'border-line text-ink-2'"
        :aria-pressed="active === k"
        @click="emit('pick', k)"
      >Class {{ k }}</button>
    </div>
  </BaseCard>
</template>
