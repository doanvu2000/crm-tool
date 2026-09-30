<script setup lang="ts">
import { computed } from 'vue';
import { useIsNarrow } from '@/shared/composables/useMediaQuery';
import { usePalette } from '@/shared/composables/usePalette';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ChartCanvas from './ChartCanvas.vue';
import { countBarConfig } from './options';
import type { ChartPalette } from './palette';

type PaletteKey = 'velocity' | 'dos' | 'oos' | 'trend' | 'action';

const props = defineProps<{
  title: string;
  subtitle?: string;
  labels: readonly string[];
  data: number[];
  colorKey: PaletteKey;
  horizontal?: boolean;
  tall?: boolean;
  active?: string | null;
  pickable?: boolean;
}>();
const emit = defineEmits<{ pick: [label: string] }>();

const palette = usePalette();
// Màn hẹp: nhãn trục X của bar dọc phải xoay chéo mới vừa, nên chuyển sang bar ngang cho dễ đọc.
const narrow = useIsNarrow();
const config = computed(() => {
  const p: ChartPalette = palette.value;
  return countBarConfig(p, props.labels, props.data, p[props.colorKey], props.horizontal || narrow.value, props.active ?? null, props.pickable ? (l) => emit('pick', l) : undefined);
});
</script>

<template>
  <BaseCard :title="title" :subtitle="subtitle">
    <template v-if="$slots.info" #info><slot name="info" /></template>
    <ChartCanvas :config="config" :label="pickable ? `${title}. Bấm 1 cột để lọc mọi bảng theo nhóm đó` : title" :tall="tall" />
    <div v-if="pickable" class="sr-only flex flex-wrap gap-1.5 focus-within:not-sr-only focus-within:mt-2" role="group" :aria-label="`Lọc theo ${title}`">
      <button
        v-for="(l, i) in labels"
        :key="l"
        type="button"
        class="rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-40"
        :class="active === l ? 'border-ink bg-ink text-canvas' : 'border-line text-ink-2 hover:border-ink-3 hover:text-ink'"
        :aria-pressed="active === l"
        :disabled="!data[i] && active !== l"
        @click="emit('pick', l)"
      >{{ l }}</button>
    </div>
  </BaseCard>
</template>
