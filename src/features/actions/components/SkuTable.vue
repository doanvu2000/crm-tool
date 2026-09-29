<script setup lang="ts">
import { computed, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import { ABC_CLASSES, ACTION_GROUPS, useAnalysisStore, type SkuResult } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, fmt1, money, pct } from '@/shared/lib/format';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ColorDot from '@/shared/ui/ColorDot.vue';
import { PAGE_SIZE, useSkuTable, type SortKey } from '../composables/useSkuTable';
import { exportAnalysisCsv } from '../lib/exportCsv';

const props = defineProps<{ rows: readonly SkuResult[] }>();
const palette = usePalette();
const { actionFilter } = storeToRefs(useAnalysisStore());
const { search, sortKey, sortDir, page, pageCount, filtered, pageRows, toggleSort } = useSkuTable(toRef(props, 'rows'), actionFilter);

const COLUMNS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'abc', label: 'ABC' },
  { key: 'revenue', label: 'Doanh thu', num: true },
  { key: 'ads', label: 'ADS', num: true },
  { key: 'adsIndex', label: 'Index', num: true },
  { key: 'stock', label: 'Tồn', num: true },
  { key: 'dos', label: 'DOS', num: true },
  { key: 'oosRate', label: 'OOS', num: true },
  { key: 'growth', label: 'Growth', num: true },
  { key: 'group', label: 'Action' }
];

const ariaSort = (key: SortKey) => (sortKey.value !== key ? 'none' : sortDir.value === 1 ? 'ascending' : 'descending');
const abcColor = (r: SkuResult) => palette.value.abc[ABC_CLASSES.indexOf(r.abc)];
const actionColor = (r: SkuResult) => palette.value.action[ACTION_GROUPS.indexOf(r.group)];

const pageInfo = computed(() => {
  const total = filtered.value.length;
  if (!total) return '0 SKU';
  const from = (page.value - 1) * PAGE_SIZE + 1;
  const to = Math.min(page.value * PAGE_SIZE, total);
  return `${fmt0(from)} đến ${fmt0(to)} / ${fmt0(total)} SKU`;
});

const cell = 'border-t border-line px-3 py-2.5 align-top';
const numCell = `${cell} num whitespace-nowrap text-right`;
const sub = 'text-xs text-ink-3';
</script>

<template>
  <BaseCard title="Chi tiết SKU" subtitle="Mỗi Action kèm điều kiện số liệu đã kích hoạt Rule">
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        type="search"
        placeholder="Tìm theo mã hoặc tên SKU"
        aria-label="Tìm SKU"
        class="control min-w-0 flex-[1_1_200px]"
      />
      <select v-model="actionFilter" aria-label="Lọc theo Action" class="control min-w-0 flex-[0_1_200px]">
        <option value="all">Tất cả Action</option>
        <option v-for="g in ACTION_GROUPS" :key="g" :value="g">{{ g }}</option>
      </select>
      <button type="button" class="btn" :disabled="!filtered.length" @click="exportAnalysisCsv(filtered)">
        <AppIcon name="download" class="size-4" />
        Xuất CSV
      </button>
    </div>

    <!-- Mobile: bảng 11 cột không đọc nổi, đổi sang thẻ; sort chuyển thành select vì không có header. -->
    <div class="mb-2 flex items-center gap-2 sm:hidden">
      <label for="sku-sort" class="field-label flex-none">Sắp xếp</label>
      <select
        id="sku-sort"
        class="control"
        :value="sortKey"
        @change="toggleSort(($event.target as HTMLSelectElement).value as SortKey)"
      >
        <option v-for="col in COLUMNS" :key="col.key" :value="col.key">{{ col.label }}</option>
      </select>
      <button
        type="button"
        class="btn flex-none px-3"
        :aria-label="sortDir === 1 ? 'Đang tăng dần, bấm để giảm dần' : 'Đang giảm dần, bấm để tăng dần'"
        @click="toggleSort(sortKey)"
      >{{ sortDir === 1 ? '▲' : '▼' }}</button>
    </div>
    <ul class="grid gap-2 sm:hidden">
      <li v-for="r in pageRows" :key="r.sku" class="rounded-xl border border-line p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="num text-sm font-semibold text-ink">{{ r.sku }}</span>
              <span v-if="r.isCore" class="pill bg-tag! text-tag-ink!">Core</span>
              <span class="pill"><ColorDot :color="abcColor(r)" />{{ r.abc }}</span>
            </div>
            <div class="mt-0.5 truncate text-xs text-ink-3">{{ r.name }} · {{ r.category }}</div>
          </div>
          <span class="num flex-none text-sm text-ink-2">{{ money(r.revenue) }}</span>
        </div>
        <div class="mt-2.5 flex items-center gap-1.5">
          <ColorDot :color="actionColor(r)" />
          <span class="text-sm font-medium text-ink">{{ r.action }}</span>
        </div>
        <p class="mt-0.5 text-xs leading-snug text-ink-3">{{ r.reasons.join(' · ') }}</p>
        <dl class="mt-2.5 grid grid-cols-4 gap-2 border-t border-line pt-2.5 text-xs">
          <div><dt class="text-ink-3">ADS</dt><dd class="num text-ink">{{ fmt1(r.ads) }}</dd></div>
          <div><dt class="text-ink-3">DOS</dt><dd class="num text-ink">{{ r.dos === Infinity ? '∞' : fmt1(r.dos) }}</dd></div>
          <div><dt class="text-ink-3">OOS</dt><dd class="num text-ink">{{ pct(r.oosRate, 0) }}</dd></div>
          <div><dt class="text-ink-3">Growth</dt><dd class="num text-ink">{{ pct(r.growth, 0) }}</dd></div>
        </dl>
      </li>
      <li v-if="!pageRows.length" class="rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink-3">
        Không có SKU khớp bộ lọc. Đổi từ khoá hoặc chọn "Tất cả Action".
      </li>
    </ul>

    <div class="hidden overflow-x-auto rounded-xl border border-line sm:block">
      <table class="w-full min-w-[880px] border-collapse text-[13px]">
        <thead>
          <tr>
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              :aria-sort="ariaSort(col.key)"
              class="sticky top-0 whitespace-nowrap bg-sunken px-3 py-2.5 font-medium text-ink-2"
              :class="col.num ? 'text-right' : 'text-left'"
            >
              <button type="button" class="inline-flex min-h-8 items-center gap-1 rounded" @click="toggleSort(col.key)">
                {{ col.label }}
                <span class="inline-block w-2.5 text-[10px]" aria-hidden="true">{{ sortKey === col.key ? (sortDir === 1 ? '▲' : '▼') : '' }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pageRows" :key="r.sku" class="transition-colors hover:bg-sunken">
            <td :class="cell">
              <div class="flex items-center gap-1.5">
                <span class="num font-medium text-ink">{{ r.sku }}</span>
                <span v-if="r.isCore" class="pill bg-tag! text-tag-ink!">Core</span>
              </div>
              <div :class="sub">{{ r.name }}<template v-if="r.name"> · </template>{{ r.category }}</div>
            </td>
            <td :class="cell"><span class="pill"><ColorDot :color="abcColor(r)" />{{ r.abc }}</span></td>
            <td :class="numCell">{{ money(r.revenue) }}</td>
            <td :class="numCell">{{ fmt1(r.ads) }}<div :class="[sub, 'font-sans']">{{ r.velocity }}</div></td>
            <td :class="numCell">{{ pct(r.adsIndex, 0) }}</td>
            <td :class="numCell">{{ fmt0(r.stock) }}</td>
            <td :class="numCell">{{ r.dos === Infinity ? '∞' : fmt1(r.dos) }}<div :class="[sub, 'font-sans']">{{ r.dosStatus }}</div></td>
            <td :class="numCell">{{ pct(r.oosRate, 0) }}</td>
            <td :class="numCell">{{ pct(r.growth, 0) }}<div :class="[sub, 'font-sans']">{{ r.trend }}</div></td>
            <td :class="[cell, 'min-w-64']">
              <span class="pill"><ColorDot :color="actionColor(r)" />{{ r.group }}</span>
              <div class="mt-1 font-medium text-ink">{{ r.action }}</div>
              <div class="mt-0.5 text-xs leading-snug text-ink-3">{{ r.reasons.join(' · ') }}</div>
            </td>
          </tr>
          <tr v-if="!pageRows.length">
            <td :colspan="COLUMNS.length" :class="[cell, 'py-8 text-center text-ink-3']">
              Không có SKU khớp bộ lọc. Đổi từ khoá hoặc chọn "Tất cả Action".
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-3">
      <span class="num" aria-live="polite">{{ pageInfo }}</span>
      <div class="flex items-center gap-2">
        <button type="button" class="btn sm:min-h-9" :disabled="page <= 1" @click="page--">Trang trước</button>
        <span class="num">{{ page }} / {{ pageCount }}</span>
        <button type="button" class="btn sm:min-h-9" :disabled="page >= pageCount" @click="page++">Trang sau</button>
      </div>
    </div>
  </BaseCard>
</template>
