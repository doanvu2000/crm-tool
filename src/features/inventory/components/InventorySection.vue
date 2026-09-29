<script setup lang="ts">
import { computed } from 'vue';
import {
  DOS_LEVELS,
  OOS_LEVELS,
  THRESHOLDS,
  TREND_LEVELS,
  VELOCITY_LEVELS,
  countBy,
  type SkuResult,
  type VelocityBasis
} from '@/features/analysis';
import CountBarChart from '@/shared/charts/CountBarChart.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import DosGrowthScatter from './DosGrowthScatter.vue';

const props = defineProps<{ rows: readonly SkuResult[]; basis: VelocityBasis }>();

const velocitySubtitle = computed(() => {
  if (props.basis === 'index') {
    const I = THRESHOLDS.velocityIndex;
    return `ADS Index: Fast ≥ ${I.fast * 100}%, Normal ${I.normal * 100} đến ${I.fast * 100}%, Slow ${I.slow * 100} đến ${I.normal * 100}%, Very Slow < ${I.slow * 100}%`;
  }
  const A = THRESHOLDS.velocityAds;
  return `ADS (sp/ngày): Fast ≥ ${A.fast}, Normal ${A.normal} đến ${A.fast - 1}, Slow ${A.slowAbove + 1} đến ${A.normal - 1}, Very Slow ≤ ${A.slowAbove}`;
});

const counts = computed(() => ({
  velocity: countBy(props.rows, 'velocity', VELOCITY_LEVELS),
  dos: countBy(props.rows, 'dosStatus', DOS_LEVELS),
  oos: countBy(props.rows, 'oosStatus', OOS_LEVELS),
  trend: countBy(props.rows, 'trend', TREND_LEVELS)
}));
</script>

<template>
  <section aria-label="Tốc độ bán, tồn kho và availability">
    <SectionHeader title="Tốc độ bán, tồn kho và availability" hint="ADS · DOS · OOS · Growth" />
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <CountBarChart title="Tốc độ bán hàng" :subtitle="velocitySubtitle" :labels="VELOCITY_LEVELS" :data="counts.velocity" color-key="velocity" />
      <CountBarChart title="Tình trạng tồn kho (DOS)" subtitle="DOS = Tồn hiện tại / ADS" :labels="DOS_LEVELS" :data="counts.dos" color-key="dos" />
      <CountBarChart title="OOS Rate" subtitle="OOS Days / Total Days" :labels="OOS_LEVELS" :data="counts.oos" color-key="oos" />
      <CountBarChart title="Xu hướng bán hàng" subtitle="Kỳ hiện tại so với kỳ trước" :labels="TREND_LEVELS" :data="counts.trend" color-key="trend" />
      <DosGrowthScatter class="md:col-span-2" :rows="rows" />
    </div>
  </section>
</template>
