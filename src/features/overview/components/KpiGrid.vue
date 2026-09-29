<script setup lang="ts">
import { computed } from 'vue';
import { sumBy, type SkuResult } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, money, pct } from '@/shared/lib/format';
import ColorDot from '@/shared/ui/ColorDot.vue';

const props = defineProps<{ rows: readonly SkuResult[] }>();
const palette = usePalette();

// Số lượng theo nhóm Action đã nằm ở thẻ quyết định, ở đây chỉ giữ chỉ số nền.
const tiles = computed(() => {
  const rows = props.rows;
  const p = palette.value;
  const n = rows.length;
  const revenue = sumBy(rows, (r) => r.revenue);
  const classA = rows.filter((r) => r.abc === 'A');
  const core = rows.filter((r) => r.isCore);
  const over = rows.filter((r) => r.dosStatus === 'Excess' || r.dosStatus === 'Overstock');
  const avgOos = n ? sumBy(rows, (r) => r.oosRate) / n : 0;
  const severe = rows.filter((r) => r.oosStatus === 'Severe OOS').length;
  const share = (list: readonly SkuResult[]) => pct(revenue ? sumBy(list, (r) => r.revenue) / revenue : 0);

  return [
    { label: 'Doanh thu', value: money(revenue), note: `GP ${money(sumBy(rows, (r) => r.gp))}`, color: p.ink },
    { label: 'Tổng SKU', value: fmt0(n), note: `${fmt0(new Set(rows.map((r) => r.category)).size)} ngành hàng`, color: p.muted },
    { label: 'SKU class A', value: fmt0(classA.length), note: `${share(classA)} doanh thu`, color: p.abc[0] },
    { label: 'Core SKU', value: fmt0(core.length), note: `${share(core)} doanh thu`, color: p.abc[1] },
    { label: 'Dư tồn (DOS > 60)', value: fmt0(over.length), note: `${fmt0(sumBy(over, (r) => r.stock))} sp đang tồn`, color: p.dos[4] },
    { label: 'OOS trung bình', value: pct(avgOos), note: `${fmt0(severe)} SKU Severe OOS`, color: p.oos[3] }
  ];
});
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
    <div v-for="t in tiles" :key="t.label" class="card p-4! sm:p-4!">
      <div class="flex items-center gap-1.5 text-[13px] text-ink-2">
        <ColorDot :color="t.color" />
        <span class="truncate">{{ t.label }}</span>
      </div>
      <div :title="t.value" class="mt-2 truncate text-2xl font-semibold leading-tight tracking-tight sm:text-[26px]">{{ t.value }}</div>
      <div class="num mt-0.5 truncate text-xs text-ink-3" :title="t.note">{{ t.note }}</div>
    </div>
  </div>
</template>
