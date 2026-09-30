<script setup lang="ts">
import { computed } from 'vue';
import { ALL_CATEGORIES, DRILL_LABEL, useAnalysisStore, type DrillField } from '@/features/analysis';
import { fmt0 } from '@/shared/lib/format';
import AppIcon from '@/shared/ui/AppIcon.vue';

const store = useAnalysisStore();

const chips = computed(() => (Object.entries(store.drill) as [DrillField, string][]).map(([field, value]) => ({ field, label: DRILL_LABEL[field], value })));
const hasCategory = computed(() => store.category !== ALL_CATEGORIES);

function clearAll() {
  store.clearDrill();
  store.setCategory(ALL_CATEGORIES);
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5" role="region" aria-label="Bộ lọc đang áp dụng" aria-live="polite">
    <span class="eyebrow mr-1">Đang lọc</span>
    <button
      v-if="hasCategory"
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink py-1 pl-3 pr-2 text-[13px] text-canvas"
      :aria-label="`Bỏ lọc ngành ${store.category}`"
      @click="store.setCategory(ALL_CATEGORIES)"
    >
      <span class="opacity-70">Ngành:</span> {{ store.category }}
      <AppIcon name="close" class="size-3.5" />
    </button>
    <button
      v-for="c in chips"
      :key="c.field"
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink py-1 pl-3 pr-2 text-[13px] text-canvas"
      :aria-label="`Bỏ lọc ${c.label} ${c.value}`"
      @click="store.setDrill(c.field, null)"
    >
      <span class="opacity-70">{{ c.label }}:</span> {{ c.value }}
      <AppIcon name="close" class="size-3.5" />
    </button>
    <span class="num ml-1 text-xs text-ink-3">{{ fmt0(store.visibleRows.length) }} / {{ fmt0(store.rows.length) }} SKU</span>
    <button type="button" class="ml-auto min-h-9 rounded-lg px-2 text-[13px] text-ink-2 underline-offset-4 hover:text-ink hover:underline" @click="clearAll">
      Xoá lọc
    </button>
  </div>
</template>
