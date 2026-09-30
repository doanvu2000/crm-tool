<script setup lang="ts">
import { computed } from 'vue';
import { ABC_CLASSES, THRESHOLDS, VELOCITY_LEVELS, type AbcClass, type SkuResult, type Velocity } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, pct } from '@/shared/lib/format';
import BaseCard from '@/shared/ui/BaseCard.vue';
import InsightBox from '@/shared/ui/InsightBox.vue';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[]; activeAbc?: string | null; activeVelocity?: string | null }>();
const emit = defineEmits<{ pick: [abc: AbcClass, velocity: Velocity] }>();
const isActive = (i: number, j: number) => props.activeAbc === ABC_CLASSES[i] && props.activeVelocity === VELOCITY_LEVELS[j];
const dimmed = (i: number, j: number) => !!(props.activeAbc && props.activeVelocity) && !isActive(i, j);
const palette = usePalette();

const matrix = computed(() => {
  const counts = ABC_CLASSES.map((a) => VELOCITY_LEVELS.map((v) => props.rows.filter((r) => r.abc === a && r.velocity === v).length));
  const max = Math.max(1, ...counts.flat());
  const p = palette.value;
  return counts.map((row, i) =>
    row.map((n, j) => {
      const step = n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.999));
      return { n, bg: p.heat[step], ink: p.heatInk[step], core: i === 0 && j === 0, title: `Class ${ABC_CLASSES[i]} · ${VELOCITY_LEVELS[j]}: ${n} SKU` };
    })
  );
});

const coreCount = computed(() => props.rows.filter((r) => r.isCore).length);
const excluded = computed(() => Math.max(0, matrix.value[0][0].n - coreCount.value));
const C = THRESHOLDS.core;
</script>

<template>
  <BaseCard title="Ma trận ABC x Tốc độ bán" subtitle="Số SKU mỗi ô. Viền xanh ngọc: vùng ứng viên Core SKU">
    <template #info><MethodInfo topic="matrix" /></template>
    <div>
      <table class="w-full table-fixed border-separate border-spacing-1 text-[13px]">
        <thead>
          <tr>
            <th class="muted w-16 p-1 text-left font-medium sm:w-20">ABC</th>
            <th v-for="v in VELOCITY_LEVELS" :key="v" class="muted p-1 font-medium leading-tight">{{ v }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in matrix" :key="ABC_CLASSES[i]">
            <th scope="row" class="muted p-1 text-left font-medium">Class {{ ABC_CLASSES[i] }}</th>
            <td v-for="(cell, j) in row" :key="j" class="p-0">
              <button
                type="button"
                class="num w-full rounded-lg px-1 py-3 text-center font-semibold transition-[opacity,box-shadow]"
                :class="[cell.core && 'outline-2 -outline-offset-2 outline-tag', isActive(i, j) && 'ring-2 ring-ink ring-offset-2 ring-offset-surface', dimmed(i, j) && 'opacity-35']"
                :style="{ background: cell.bg, color: cell.ink }"
                :title="`${cell.title}. Bấm để lọc mọi bảng`"
                :aria-pressed="isActive(i, j)"
                @click="emit('pick', ABC_CLASSES[i], VELOCITY_LEVELS[j])"
              >{{ cell.n }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <InsightBox>
      <b>{{ fmt0(coreCount) }} Core SKU</b> đạt đủ điều kiện (A, ADS ≥ {{ C.minAds }}, ADS Index ≥ {{ pct(C.minAdsIndex, 0) }}, OOS ≤ {{ pct(C.maxOosRate, 0) }}).
      <template v-if="excluded"> {{ fmt0(excluded) }} SKU A-Fast còn lại bị loại do OOS cao, ADS Index thấp hoặc EOL.</template>
    </InsightBox>
  </BaseCard>
</template>
