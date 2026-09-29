<script setup lang="ts">
import Chart from 'chart.js/auto';
import type { ChartConfiguration } from 'chart.js';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

type AnyChartConfig = ChartConfiguration<any, any, any>;

const props = defineProps<{ config: AnyChartConfig; label: string; tall?: boolean }>();

const wrapper = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const chart = shallowRef<Chart | null>(null);
let observer: IntersectionObserver | null = null;

function create() {
  if (!canvas.value) return;
  chart.value?.destroy();
  chart.value = new Chart(canvas.value, props.config);
}

// Chart ngoài viewport chưa khởi tạo để lần render đầu không nghẽn main thread.
onMounted(() => {
  if (!('IntersectionObserver' in window) || !wrapper.value) return create();
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer?.disconnect();
        observer = null;
        create();
      }
    },
    { rootMargin: '200px' }
  );
  observer.observe(wrapper.value);
});

// Cùng loại chart thì cập nhật tại chỗ, không dựng lại canvas (tránh nháy khi lọc / đổi theme).
watch(
  () => props.config,
  (next) => {
    const current = chart.value;
    if (!current) return;
    // Đổi loại chart hoặc hướng trục (bar dọc ↔ ngang) thì scale khác hẳn, dựng lại cho chắc.
    if ((current.config as AnyChartConfig).type !== next.type || (current.options.indexAxis ?? 'x') !== (next.options?.indexAxis ?? 'x')) return create();
    current.data = next.data;
    current.options = next.options ?? {};
    current.update();
  }
);

onBeforeUnmount(() => {
  observer?.disconnect();
  chart.value?.destroy();
  chart.value = null;
});
</script>

<template>
  <div ref="wrapper" :class="tall ? 'chart-box-tall' : 'chart-box'">
    <canvas ref="canvas" role="img" :aria-label="label" />
  </div>
</template>
