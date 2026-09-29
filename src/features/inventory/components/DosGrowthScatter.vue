<script setup lang="ts">
import { computed } from 'vue';
import type { ChartConfiguration, TooltipItem } from 'chart.js';
import { ABC_CLASSES, THRESHOLDS, type SkuResult } from '@/features/analysis';
import ChartCanvas from '@/shared/charts/ChartCanvas.vue';
import { animation, tooltipStyle } from '@/shared/charts/options';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt1, pct } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ChartLegend from '@/shared/ui/ChartLegend.vue';

const props = defineProps<{ rows: readonly SkuResult[] }>();
const palette = usePalette();

// Kẹp trục để vài SKU cực trị không ép phần còn lại dồn vào 1 góc.
const MAX_DOS = 120;
const MIN_GROWTH = -100;
const MAX_GROWTH = 200;

interface Point { x: number; y: number; row: SkuResult }

const legend = computed(() => ABC_CLASSES.map((k, i) => ({ label: `Class ${k}`, color: palette.value.abc[i] })));

const config = computed<ChartConfiguration<'scatter', Point[]>>(() => {
  const p = palette.value;
  const D = THRESHOLDS.dos;
  const tooltipLabel = (ctx: TooltipItem<'scatter'>) => {
    const r = (ctx.raw as Point).row;
    return [
      ` Class ${r.abc} · ${r.velocity}`,
      ` DOS: ${r.dos === Infinity ? 'vô hạn' : `${fmt1(r.dos)} ngày`}`,
      ` Growth: ${pct(r.growth)}`,
      ` Action: ${r.action}`
    ];
  };
  return {
    type: 'scatter',
    data: {
      datasets: ABC_CLASSES.map((k, i) => ({
        label: `Class ${k}`,
        data: props.rows
          .filter((r) => r.abc === k && r.dos != null && r.growth != null)
          .map((r) => ({
            x: Math.min(r.dos as number, MAX_DOS),
            y: Math.max(MIN_GROWTH, Math.min(MAX_GROWTH, (r.growth as number) * 100)),
            row: r
          })),
        backgroundColor: p.abc[i],
        borderColor: p.surface,
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHitRadius: 10,
        // Chấm kẹp ở MAX_DOS nằm đúng mép trục; không clip để khỏi bị cắt nửa.
        clip: false as const
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animation(),
      layout: { padding: { right: 8, top: 8 } },
      plugins: {
        tooltip: {
          ...tooltipStyle(p),
          callbacks: {
            title: (items) => {
              const r = (items[0].raw as Point).row;
              return r.name ? `${r.sku} · ${r.name}` : r.sku;
            },
            label: tooltipLabel
          }
        },
        guideLines: { enabled: true, color: p.muted, x: [D.low, D.healthy, D.high, D.excess], y: [0] }
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: MAX_DOS,
          grid: { color: p.grid },
          border: { color: p.grid },
          ticks: { color: p.muted, stepSize: 15, maxRotation: 0, autoSkip: true, callback: (v) => (v === MAX_DOS ? `≥${v}` : `${v}`) },
          title: { display: true, text: 'DOS (ngày)', color: p.muted }
        },
        y: {
          min: MIN_GROWTH,
          max: MAX_GROWTH,
          grid: { color: p.grid },
          border: { display: false },
          ticks: { color: p.muted, callback: (v) => `${v}%` },
          title: { display: true, text: 'Growth', color: p.muted }
        }
      }
    }
  };
});
</script>

<template>
  <BaseCard title="Tồn kho so với tăng trưởng" subtitle="Mỗi chấm là 1 SKU. Góc phải dưới: tồn cao + suy giảm, cần giảm PO. Vạch đứt: ngưỡng DOS 15 / 30 / 60 / 90">
    <ChartLegend :items="legend" />
    <ChartCanvas :config="config" label="Biểu đồ phân tán DOS và tăng trưởng theo SKU" tall />
  </BaseCard>
</template>
