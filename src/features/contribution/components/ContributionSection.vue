<script setup lang="ts">
import { useAnalysisStore, type SkuResult } from '@/features/analysis';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import AbcMixChart from './AbcMixChart.vue';
import AbcVelocityMatrix from './AbcVelocityMatrix.vue';
import ExceptionsPanel from './ExceptionsPanel.vue';
import ParetoChart from './ParetoChart.vue';

defineProps<{ rows: readonly SkuResult[] }>();
const store = useAnalysisStore();
</script>

<template>
  <section aria-label="Đóng góp và Core SKU">
    <SectionHeader title="Đóng góp và Core SKU" hint="ABC Pareto" />
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ParetoChart class="lg:col-span-8" :rows="rows" />
      <AbcMixChart class="lg:col-span-4" :rows="store.crossRows.abc" :active="store.drill.abc" @pick="store.toggleDrill('abc', $event)" />
      <AbcVelocityMatrix
        class="lg:col-span-6"
        :rows="store.matrixRows"
        :active-abc="store.drill.abc"
        :active-velocity="store.drill.velocity"
        @pick="(abc, velocity) => store.setDrillPair({ abc, velocity })"
      />
      <ExceptionsPanel class="lg:col-span-6" :rows="rows" />
    </div>
  </section>
</template>
