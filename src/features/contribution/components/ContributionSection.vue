<script setup lang="ts">
import type { AbcMetric, SkuResult } from '@/features/analysis';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import AbcMixChart from './AbcMixChart.vue';
import AbcVelocityMatrix from './AbcVelocityMatrix.vue';
import ExceptionsPanel from './ExceptionsPanel.vue';
import ParetoChart from './ParetoChart.vue';

defineProps<{ rows: readonly SkuResult[]; metric: AbcMetric }>();
</script>

<template>
  <section aria-label="Đóng góp và Core SKU">
    <SectionHeader title="Đóng góp và Core SKU" hint="ABC Pareto" />
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ParetoChart class="lg:col-span-8" :rows="rows" :metric="metric" />
      <AbcMixChart class="lg:col-span-4" :rows="rows" />
      <AbcVelocityMatrix class="lg:col-span-6" :rows="rows" />
      <ExceptionsPanel class="lg:col-span-6" :rows="rows" />
    </div>
  </section>
</template>
