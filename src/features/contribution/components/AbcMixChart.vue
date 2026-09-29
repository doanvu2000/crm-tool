<script setup lang="ts">
import { computed } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import { ABC_CLASSES, type SkuResult } from '@/features/analysis';
import ChartCanvas from '@/shared/charts/ChartCanvas.vue';
import { animation, categoryAxis, tooltipStyle, valueAxis } from '@/shared/charts/options';
import { usePalette } from '@/shared/composables/usePalette';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ChartLegend from '@/shared/ui/ChartLegend.vue';

const props = defineProps<{ rows: readonly SkuResult[] }>();
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
  return {
    type: 'bar',
    data: {
      labels: ABC_CLASSES.map((k) => `Class ${k}`),
      datasets: [
        { label: '% số SKU', data: byClass.map((g) => (g.length / n) * 100), backgroundColor: p.compare[0], ...bar },
        { label: '% đóng góp', data: byClass.map((g) => (g.reduce((s, r) => s + r.share, 0) / total) * 100), backgroundColor: p.compare[1], ...bar }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animation(),
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
    <ChartLegend :items="legend" />
    <ChartCanvas :config="config" label="Cơ cấu ABC theo số SKU và đóng góp" tall />
  </BaseCard>
</template>
