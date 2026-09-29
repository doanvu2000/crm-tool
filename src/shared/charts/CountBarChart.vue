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
}>();

const palette = usePalette();
// Màn hẹp: nhãn trục X của bar dọc phải xoay chéo mới vừa, nên chuyển sang bar ngang cho dễ đọc.
const narrow = useIsNarrow();
const config = computed(() => {
  const p: ChartPalette = palette.value;
  return countBarConfig(p, props.labels, props.data, p[props.colorKey], props.horizontal || narrow.value);
});
</script>

<template>
  <BaseCard :title="title" :subtitle="subtitle">
    <ChartCanvas :config="config" :label="title" :tall="tall" />
  </BaseCard>
</template>
