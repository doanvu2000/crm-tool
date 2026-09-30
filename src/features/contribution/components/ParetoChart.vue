<script setup lang="ts">
import { computed } from 'vue';
import type { ChartConfiguration } from 'chart.js';
import { ABC_CLASSES, useAnalysisStore, type SkuResult } from '@/features/analysis';
import ChartCanvas from '@/shared/charts/ChartCanvas.vue';
import { animation, categoryAxis, tooltipStyle, valueAxis } from '@/shared/charts/options';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, pct } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ChartLegend from '@/shared/ui/ChartLegend.vue';
import InsightBox from '@/shared/ui/InsightBox.vue';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[] }>();
const store = useAnalysisStore();
const palette = usePalette();
const combinedCategories = computed(() => store.selectedCategories.length !== 1);

// Chuẩn hoá tích luỹ trong tập đang lọc; class ABC vẫn giữ theo Sales của ngành hàng.
const points = computed(() => {
  const list = [...props.rows].sort((a, b) => b.revenue - a.revenue);
  const total = list.reduce((s, r) => s + r.revenue, 0) || 1;
  let cum = 0;
  return list.map((r) => {
    const share = r.revenue / total;
    cum += share;
    return { r, share, cum };
  });
});

const legend = computed(() => ABC_CLASSES.map((k, i) => ({ label: `Class ${k}`, color: palette.value.abc[i] })));

const config = computed<ChartConfiguration<'bar'>>(() => {
  const p = palette.value;
  const pts = points.value;
  const dense = pts.length > 60;
  return {
    type: 'bar',
    data: {
      labels: pts.map((x) => x.r.sku),
      datasets: [{
        data: pts.map((x) => +(x.cum * 100).toFixed(2)),
        backgroundColor: pts.map((x) => p.abc[ABC_CLASSES.indexOf(x.r.abc)]),
        borderRadius: dense ? 0 : 3,
        borderSkipped: false,
        barPercentage: 1,
        categoryPercentage: dense ? 1 : 0.85
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: animation(),
      plugins: {
        tooltip: {
          ...tooltipStyle(p),
          callbacks: {
            title: (items) => {
              const r = pts[items[0].dataIndex].r;
              const name = r.name ? `${r.sku} · ${r.name}` : r.sku;
              return combinedCategories.value ? `${name} · ${r.category}` : name;
            },
            label: (ctx) => {
              const x = pts[ctx.dataIndex];
              return [` Class ${x.r.abc}`, ` Tỷ trọng: ${pct(x.share)}`, ` Tích luỹ: ${pct(x.cum)}`];
            }
          }
        }
      },
      scales: {
        x: { ...categoryAxis(p), ticks: { ...categoryAxis(p).ticks, display: pts.length <= 30, autoSkip: true, maxRotation: 0 } },
        y: { ...valueAxis(p), max: 100, ticks: { ...valueAxis(p).ticks, callback: (v) => `${v}%` } }
      }
    }
  };
});

const summary = computed(() => {
  const a = points.value.filter((x) => x.r.abc === 'A');
  return {
    count: a.length,
    countPct: points.value.length ? a.length / points.value.length : 0,
    share: a.reduce((s, x) => s + x.share, 0)
  };
});
</script>

<template>
  <BaseCard
    title="Pareto doanh thu"
    :subtitle="combinedCategories ? 'Tổng hợp Sales theo SKU của các ngành đã chọn. Class ABC vẫn xếp riêng theo ngành.' : 'Tỷ trọng Sales tích luỹ theo SKU, xếp giảm dần trong ngành hàng đang xem'"
  >
    <template #info><MethodInfo topic="pareto" /></template>
    <ChartLegend :items="legend" />
    <ChartCanvas :config="config" label="Biểu đồ Pareto đóng góp theo SKU" tall />
    <InsightBox>
      <b>{{ fmt0(summary.count) }} SKU nhóm A</b> ({{ pct(summary.countPct) }} số SKU) tạo <b>{{ pct(summary.share) }}</b> doanh thu.
    </InsightBox>
  </BaseCard>
</template>
