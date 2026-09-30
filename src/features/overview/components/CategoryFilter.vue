<script setup lang="ts">
import { computed } from 'vue';
import { useAnalysisStore } from '@/features/analysis';
import { fmt0 } from '@/shared/lib/format';

const store = useAnalysisStore();
const selectedCategory = computed(() => store.selectedCategories.length === 1 ? store.selectedCategories[0] : '');
const subcat1Options = computed(() => [...new Set(
  store.rows
    .filter((row) => row.category === selectedCategory.value && row.subcat1)
    .map((row) => row.subcat1!.trim())
)].sort((a, b) => a.localeCompare(b, 'vi')));
const subcat2Options = computed(() => [...new Set(
  store.rows
    .filter((row) => row.category === selectedCategory.value && row.subcat1 === store.selectedSubcat1 && row.subcat2)
    .map((row) => row.subcat2!.trim())
)].sort((a, b) => a.localeCompare(b, 'vi')));
const selectionLabel = computed(() => [selectedCategory.value, store.selectedSubcat1, store.selectedSubcat2].filter(Boolean).join(' · ') || 'Tổng tất cả ngành hàng');

function selectCategory(event: Event) {
  const category = (event.target as HTMLSelectElement).value;
  store.setCategories(category ? [category] : []);
}

function selectSubcat1(event: Event) {
  store.setSubcat1((event.target as HTMLSelectElement).value);
}

function selectSubcat2(event: Event) {
  store.setSubcat2((event.target as HTMLSelectElement).value);
}
</script>

<template>
  <section class="rounded-2xl border border-line bg-surface p-3 sm:p-4" aria-label="Lọc theo ngành hàng">
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold tracking-tight">Lọc theo ngành hàng</h2>
        <p class="mt-0.5 text-xs text-ink-3">{{ selectionLabel }}</p>
      </div>
      <p class="pill num">{{ fmt0(store.categoryRows.length) }} SKU</p>
    </div>
    <p class="sr-only" aria-live="polite" aria-atomic="true">Phạm vi {{ selectionLabel }}, {{ fmt0(store.categoryRows.length) }} SKU</p>

    <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="min-w-0">
        <label for="category-filter" class="field-label">Ngành hàng</label>
        <select id="category-filter" class="control mt-1" :value="selectedCategory" @change="selectCategory">
          <option value="">Tổng tất cả ngành hàng</option>
          <option v-for="category in store.categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </div>

      <div class="min-w-0">
        <label for="subcat1-filter" class="field-label">Subcat 1</label>
        <select
          id="subcat1-filter"
          class="control mt-1 disabled:cursor-not-allowed disabled:opacity-50"
          :value="store.selectedSubcat1"
          :disabled="!selectedCategory || !subcat1Options.length"
          @change="selectSubcat1"
        >
          <option value="">{{ selectedCategory && !subcat1Options.length ? 'Chưa có Subcat 1' : 'Tất cả Subcat 1' }}</option>
          <option v-for="subcat in subcat1Options" :key="subcat" :value="subcat">{{ subcat }}</option>
        </select>
      </div>

      <div class="min-w-0">
        <label for="subcat2-filter" class="field-label">Subcat 2</label>
        <select
          id="subcat2-filter"
          class="control mt-1 disabled:cursor-not-allowed disabled:opacity-50"
          :value="store.selectedSubcat2"
          :disabled="!store.selectedSubcat1 || !subcat2Options.length"
          @change="selectSubcat2"
        >
          <option value="">{{ store.selectedSubcat1 && !subcat2Options.length ? 'Chưa có Subcat 2' : 'Tất cả Subcat 2' }}</option>
          <option v-for="subcat in subcat2Options" :key="subcat" :value="subcat">{{ subcat }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
