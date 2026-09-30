<script setup lang="ts">
import { computed } from 'vue';
import { useAnalysisStore } from '@/features/analysis';

const store = useAnalysisStore();
const options = computed(() => store.categories.map((c) => ({ value: c, label: c })));
const allSelected = computed(() => store.selectedCategories.length === 0);
const selectionLabel = computed(() => allSelected.value ? 'Đang xem tổng tất cả ngành hàng' : `Đang chọn ${store.selectedCategories.length} ngành hàng`);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Chọn ngành hàng để phân tích">
    <span class="eyebrow mr-1">Ngành hàng</span>
    <button
      type="button"
      class="chip"
      :aria-pressed="allSelected"
      :title="allSelected ? 'Đang xem tổng tất cả ngành hàng' : 'Bỏ các ngành đang chọn và xem tổng tất cả ngành hàng'"
      @click="store.selectAllCategories()"
    >Tổng tất cả ngành hàng</button>
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="chip"
      :aria-pressed="store.selectedCategories.includes(opt.value)"
      :title="store.selectedCategories.includes(opt.value) ? `Bỏ chọn ${opt.label}` : `Chọn thêm ${opt.label}`"
      @click="store.toggleCategory(opt.value)"
    >{{ opt.label }}</button>
    <span class="sr-only" aria-live="polite">{{ selectionLabel }}</span>
  </div>
</template>
