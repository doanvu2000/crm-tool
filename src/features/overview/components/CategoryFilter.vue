<script setup lang="ts">
import { computed } from 'vue';
import { ALL_CATEGORIES, useAnalysisStore } from '@/features/analysis';

const store = useAnalysisStore();
const options = computed(() => [{ value: ALL_CATEGORIES, label: 'Tất cả ngành' }, ...store.categories.map((c) => ({ value: c, label: c }))]);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo ngành hàng">
    <span class="eyebrow mr-1">Ngành hàng</span>
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="chip"
      :aria-pressed="store.category === opt.value"
      @click="store.setCategory(opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>
