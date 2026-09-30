<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ABC_CLASSES, ACTION_GROUPS, LIFECYCLES, countBy, useAnalysisStore, type Lifecycle, type SkuInput } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, fmt1 } from '@/shared/lib/format';
import { parseNum } from '@/shared/lib/parse';
import AppIcon from '@/shared/ui/AppIcon.vue';
import BaseCard from '@/shared/ui/BaseCard.vue';
import ColorDot from '@/shared/ui/ColorDot.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import { EDITOR_PAGE_SIZE, useInputEditor, type EditorRow } from '../composables/useInputEditor';
import { EDIT_COLUMNS, type EditColumn } from '../lib/editColumns';
import { exportInputCsv } from '../lib/exportInput';
import CellInput from './CellInput.vue';

const store = useAnalysisStore();
const { raw, rows, baselineRows, editedCount, sourceLabel } = storeToRefs(store);
const palette = usePalette();
const { search, onlyEdited, page, pageCount, filtered, pageRows } = useInputEditor();
const tableEl = ref<HTMLElement>();

const actionColor = (g: string) => palette.value.action[ACTION_GROUPS.indexOf(g as (typeof ACTION_GROUPS)[number])];
const abcColor = (c: string) => palette.value.abc[ABC_CLASSES.indexOf(c as (typeof ABC_CLASSES)[number])];

const impact = computed(() => {
  const now = countBy(rows.value, 'group', ACTION_GROUPS);
  const before = countBy(baselineRows.value, 'group', ACTION_GROUPS);
  return ACTION_GROUPS.map((group, i) => ({ group, now: now[i], before: before[i], delta: now[i] - before[i], color: palette.value.action[i] }));
});

const movedCount = computed(() => {
  const before = new Map(baselineRows.value.map((r) => [r.sku, r.group]));
  return rows.value.filter((r) => before.has(r.sku) && before.get(r.sku) !== r.group).length;
});

const isEdited = (row: EditorRow, key: keyof SkuInput) => row.input[key] !== row.base[key];

function commit(row: EditorRow, col: EditColumn, value: string) {
  if (col.kind === 'number') return store.updateRow(row.index, { [col.key]: Math.max(0, parseNum(value)) });
  const text = value.trim();
  store.updateRow(row.index, { [col.key]: col.key === 'category' ? text || 'Khác' : text });
}

const setLifecycle = (row: EditorRow, e: Event) => store.updateRow(row.index, { lifecycle: (e.target as HTMLSelectElement).value as Lifecycle });
const setSeasonal = (row: EditorRow, e: Event) => store.updateRow(row.index, { seasonal: (e.target as HTMLInputElement).checked });

async function focusBelow(pos: number, col: number) {
  await nextTick();
  const el = tableEl.value?.querySelector<HTMLInputElement>(`[data-cell="${pos + 1}:${col}"]`);
  if (el) {
    el.focus();
    el.select();
  }
}

function resetAll() {
  if (!editedCount.value) return;
  if (window.confirm(`Khôi phục ${fmt0(editedCount.value)} SKU đã sửa về số liệu trong file gốc?`)) store.resetAll();
}

const pageInfo = computed(() => {
  const total = filtered.value.length;
  if (!total) return '0 SKU';
  const from = (page.value - 1) * EDITOR_PAGE_SIZE + 1;
  return `${fmt0(from)} đến ${fmt0(Math.min(page.value * EDITOR_PAGE_SIZE, total))} / ${fmt0(total)} SKU`;
});

const dosText = (dos: number | null | undefined) => (dos === Infinity ? '∞' : fmt1(dos));
const cell = 'border-t border-line px-1.5 py-1 align-middle';
</script>

<template>
  <section aria-label="Dữ liệu đầu vào">
    <SectionHeader title="Dữ liệu đầu vào" :hint="`${fmt0(raw.length)} SKU · ${sourceLabel}`" />

    <BaseCard
      title="Sửa số liệu, Action tính lại ngay"
      subtitle="Bấm vào ô để sửa. Enter xuống dòng dưới, Esc huỷ. Mọi chart và bảng phía trên cập nhật theo số mới."
    >
      <div data-tour="input" class="mb-4 rounded-xl border px-3.5 py-3" :class="editedCount ? 'border-edit/50 bg-edit/5' : 'border-dashed border-line'" aria-live="polite">
        <p class="text-[13px] text-ink-2">
          <template v-if="editedCount">
            <b class="font-semibold text-edit">{{ fmt0(editedCount) }} SKU đã sửa</b>,
            {{ fmt0(movedCount) }} SKU đổi nhóm Action so với file gốc:
          </template>
          <template v-else>Chưa sửa ô nào. Sửa 1 ô bất kỳ, thay đổi số SKU theo từng nhóm Action hiện ở đây.</template>
        </p>
        <ul class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <li v-for="g in impact" :key="g.group" class="flex items-center gap-2 text-[13px]">
            <span class="inline-block size-2.5 flex-none rounded-[3px]" :style="{ background: g.color }" aria-hidden="true" />
            <span class="min-w-0 truncate text-ink-2">{{ g.group }}</span>
            <span class="num ml-auto flex-none text-ink">
              <template v-if="g.delta">
                <span class="text-ink-3">{{ fmt0(g.before) }}</span>
                <span class="mx-0.5 text-ink-3" aria-hidden="true">→</span>
                <span class="sr-only">thành</span>
                <b class="font-semibold">{{ fmt0(g.now) }}</b>
                <span class="ml-1 text-xs font-semibold text-edit">{{ g.delta > 0 ? '+' : '−' }}{{ Math.abs(g.delta) }}</span>
              </template>
              <b v-else class="font-semibold">{{ fmt0(g.now) }}</b>
            </span>
          </li>
        </ul>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <input
          v-model="search"
          type="search"
          placeholder="Tìm theo mã, tên hoặc ngành"
          aria-label="Tìm SKU trong dữ liệu đầu vào"
          class="control min-w-0 flex-[1_1_220px]"
        />
        <button type="button" class="chip inline-flex items-center gap-1.5" :aria-pressed="onlyEdited" :disabled="!editedCount && !onlyEdited" @click="onlyEdited = !onlyEdited">
          <AppIcon name="edit" class="size-4" />
          Chỉ SKU đã sửa
          <span class="num">{{ fmt0(editedCount) }}</span>
        </button>
        <button type="button" class="btn" :disabled="!editedCount" @click="resetAll">
          <AppIcon name="undo" class="size-4" />
          Khôi phục file gốc
        </button>
        <button type="button" class="btn" @click="exportInputCsv(raw)">
          <AppIcon name="download" class="size-4" />
          Tải CSV đã sửa
        </button>
      </div>

      <div ref="tableEl" class="overflow-x-auto rounded-xl border border-line">
        <table class="w-full min-w-[1320px] border-collapse text-[13px]">
          <thead>
            <tr class="bg-sunken text-ink-2">
              <th scope="col" class="sticky left-0 z-10 bg-sunken px-3 py-2.5 text-left font-medium">SKU</th>
              <th
                v-for="col in EDIT_COLUMNS"
                :key="col.key"
                scope="col"
                class="whitespace-nowrap px-3 py-2.5 font-medium"
                :class="[col.width, col.kind === 'number' ? 'text-right' : 'text-left']"
              >{{ col.label }}</th>
              <th scope="col" class="min-w-52 px-3 py-2.5 text-left font-medium">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, pos) in pageRows" :key="row.index" class="group">
              <th scope="row" :class="[cell, 'sticky left-0 z-10 min-w-28 whitespace-nowrap bg-surface px-3 text-left font-normal']">
                <div class="flex items-center gap-1.5">
                  <span v-if="row.edited" class="size-1.5 flex-none rounded-full bg-edit" aria-hidden="true" />
                  <span class="num font-medium text-ink">{{ row.input.sku }}</span>
                </div>
                <button
                  v-if="row.edited"
                  type="button"
                  class="mt-0.5 inline-flex min-h-6 items-center gap-1 rounded text-xs text-ink-3 hover:text-ink"
                  :aria-label="`Khôi phục ${row.input.sku} về file gốc`"
                  @click="store.resetRow(row.index)"
                >
                  <AppIcon name="undo" class="size-3" />
                  Khôi phục
                </button>
              </th>
              <td v-for="(col, c) in EDIT_COLUMNS" :key="col.key" :class="cell">
                <select
                  v-if="col.kind === 'lifecycle'"
                  :value="row.input.lifecycle"
                  :aria-label="`${col.label} của ${row.input.sku}`"
                  class="h-9 w-full rounded-lg border bg-transparent px-1.5 text-base hover:border-ink-3 sm:text-[13px]"
                  :class="isEdited(row, 'lifecycle') ? 'border-edit/70 bg-edit/5 font-semibold' : 'border-transparent'"
                  @change="setLifecycle(row, $event)"
                >
                  <option v-for="l in LIFECYCLES" :key="l" :value="l">{{ l }}</option>
                </select>
                <label v-else-if="col.kind === 'bool'" class="flex h-9 cursor-pointer items-center justify-center rounded-lg border" :class="isEdited(row, 'seasonal') ? 'border-edit/70 bg-edit/5' : 'border-transparent'">
                  <input type="checkbox" class="size-4 accent-current" :checked="row.input.seasonal" :aria-label="`${row.input.sku} là hàng mùa vụ`" @change="setSeasonal(row, $event)" />
                </label>
                <CellInput
                  v-else
                  :value="row.input[col.key] as string | number"
                  :numeric="col.kind === 'number'"
                  :edited="isEdited(row, col.key)"
                  :label="`${col.label} của ${row.input.sku}`"
                  :cell-id="`${pos}:${c}`"
                  @commit="commit(row, col, $event)"
                  @next="focusBelow(pos, c)"
                />
              </td>
              <td :class="[cell, 'px-3']">
                <div
                  v-if="row.result"
                  :key="`${row.result.group}:${row.result.abc}:${row.result.dosStatus}`"
                  :style="row.edited ? { animation: 'cell-flash 900ms ease-out' } : undefined"
                  class="-mx-1.5 rounded-lg px-1.5 py-0.5"
                >
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="pill"><ColorDot :color="actionColor(row.result.group)" />{{ row.result.group }}</span>
                    <span class="pill"><ColorDot :color="abcColor(row.result.abc)" />{{ row.result.abc }}</span>
                    <span class="num text-xs text-ink-3">DOS {{ dosText(row.result.dos) }}</span>
                  </div>
                  <p v-if="row.before && row.before.group !== row.result.group" class="mt-0.5 text-xs text-ink-3">
                    Trước khi sửa: <s>{{ row.before.group }}</s>
                  </p>
                </div>
              </td>
            </tr>
            <tr v-if="!pageRows.length">
              <td :colspan="EDIT_COLUMNS.length + 2" class="border-t border-line py-8 text-center text-ink-3">
                {{ onlyEdited ? 'Chưa có SKU nào đã sửa khớp từ khoá.' : 'Không có SKU khớp từ khoá. Thử mã SKU hoặc tên ngành khác.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-3">
        <span class="num">{{ pageInfo }}</span>
        <div class="flex items-center gap-2">
          <button type="button" class="btn sm:min-h-9" :disabled="page <= 1" @click="page--">Trang trước</button>
          <span class="num">{{ page }} / {{ pageCount }}</span>
          <button type="button" class="btn sm:min-h-9" :disabled="page >= pageCount" @click="page++">Trang sau</button>
        </div>
      </div>
    </BaseCard>
  </section>
</template>
