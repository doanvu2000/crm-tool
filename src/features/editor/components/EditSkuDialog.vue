<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { ABC_CLASSES, ACTION_GROUPS, LIFECYCLES, useAnalysisStore, type Lifecycle, type SkuInput } from '@/features/analysis';
import { SkuTrace } from '@/features/rules';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, fmt1, money, pct, signedPct } from '@/shared/lib/format';
import AppIcon from '@/shared/ui/AppIcon.vue';
import ColorDot from '@/shared/ui/ColorDot.vue';
import type { EditorRow } from '../composables/useInputEditor';
import { EDIT_COLUMNS, EDIT_GROUPS, parseEdit } from '../lib/editColumns';
import CellInput from './CellInput.vue';

const props = defineProps<{ row: EditorRow | null; position: string; hasPrev: boolean; hasNext: boolean }>();
const emit = defineEmits<{ close: []; prev: []; next: [] }>();

const store = useAnalysisStore();
const palette = usePalette();
const dialog = ref<HTMLDialogElement>();
const traced = ref(false);

const colOf = (key: keyof SkuInput) => EDIT_COLUMNS.find((c) => c.key === key)!;
const groups = computed(() => EDIT_GROUPS.map((g) => ({ title: g.title, cols: g.keys.map(colOf) })));

const isEdited = (key: keyof SkuInput) => !!props.row && props.row.input[key] !== props.row.base[key];
const baseText = (key: keyof SkuInput) => {
  const v = props.row?.base[key];
  if (typeof v === 'boolean') return v ? 'Có' : 'Không';
  return typeof v === 'number' ? fmt1(v) : String(v ?? '');
};

const actionColor = (g: string) => palette.value.action[ACTION_GROUPS.indexOf(g as (typeof ACTION_GROUPS)[number])];
const abcColor = (c: string) => palette.value.abc[ABC_CLASSES.indexOf(c as (typeof ABC_CLASSES)[number])];

function commit(key: keyof SkuInput, value: string) {
  if (props.row) store.updateRow(props.row.index, parseEdit(colOf(key), value));
}

const setLifecycle = (e: Event) => props.row && store.updateRow(props.row.index, { lifecycle: (e.target as HTMLSelectElement).value as Lifecycle });
const setSeasonal = (e: Event) => props.row && store.updateRow(props.row.index, { seasonal: (e.target as HTMLInputElement).checked });

function toggleRemove() {
  if (!props.row) return;
  if (props.row.removed) store.restoreRow(props.row.index);
  else store.removeRow(props.row.index);
}

const r = computed(() => props.row?.result);
const moved = computed(() => !!props.row?.before && !!r.value && props.row.before.group !== r.value.group);

watch(
  () => props.row?.index,
  async (i) => {
    await nextTick();
    if (i != null && !dialog.value?.open) dialog.value?.showModal();
    if (i == null && dialog.value?.open) dialog.value.close();
  }
);
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="edit-title"
    class="m-auto max-h-[92dvh] w-[min(920px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-[rgb(11_17_23/0.55)]"
    @close="emit('close')"
    @click.self="dialog?.close()"
  >
    <div v-if="row" class="flex max-h-[92dvh] flex-col">
      <header class="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div class="min-w-0">
          <p class="eyebrow">Sửa SKU · {{ position }}</p>
          <h2 id="edit-title" class="num mt-1 flex items-center gap-2 text-lg font-semibold">
            <span v-if="row.edited && !row.removed" class="size-2 rounded-full bg-edit" aria-hidden="true" />
            <span :class="row.removed && 'line-through opacity-60'">{{ row.input.sku }}</span>
            <span v-if="row.removed" class="pill">Đã xoá</span>
          </h2>
          <p class="truncate text-[13px] text-ink-3">{{ row.input.name }}<template v-if="row.input.name"> · </template>{{ row.input.category }}</p>
        </div>
        <div class="flex flex-none items-center gap-1">
          <button type="button" class="grid size-10 place-items-center rounded-lg text-ink-3 hover:text-ink disabled:opacity-30" aria-label="SKU trước" :disabled="!hasPrev" @click="emit('prev')">
            <AppIcon name="arrow-right" class="size-5 rotate-180" />
          </button>
          <button type="button" class="grid size-10 place-items-center rounded-lg text-ink-3 hover:text-ink disabled:opacity-30" aria-label="SKU sau" :disabled="!hasNext" @click="emit('next')">
            <AppIcon name="arrow-right" class="size-5" />
          </button>
          <button type="button" class="grid size-10 place-items-center rounded-lg text-ink-3 hover:text-ink" aria-label="Đóng" @click="dialog?.close()">
            <AppIcon name="close" class="size-5" />
          </button>
        </div>
      </header>

      <div class="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <fieldset :disabled="row.removed" class="grid content-start gap-5 disabled:opacity-50">
          <div v-for="g in groups" :key="g.title">
            <h3 class="eyebrow mb-2">{{ g.title }}</h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div v-for="col in g.cols" :key="col.key" class="grid content-start gap-1" :class="col.key === 'name' && 'col-span-2 sm:col-span-3'">
                <label :for="`edit-${col.key}`" class="field-label">{{ col.label }}</label>
                <select
                  v-if="col.kind === 'lifecycle'"
                  :id="`edit-${col.key}`"
                  class="control"
                  :class="isEdited('lifecycle') && 'border-edit/70! bg-edit/5! font-semibold'"
                  :value="row.input.lifecycle"
                  @change="setLifecycle"
                >
                  <option v-for="l in LIFECYCLES" :key="l" :value="l">{{ l }}</option>
                </select>
                <label
                  v-else-if="col.kind === 'bool'"
                  class="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm"
                  :class="isEdited('seasonal') ? 'border-edit/70 bg-edit/5 font-semibold' : 'border-line bg-sunken'"
                >
                  <input :id="`edit-${col.key}`" type="checkbox" class="size-4" :checked="row.input.seasonal" @change="setSeasonal" />
                  Hàng mùa vụ
                </label>
                <CellInput
                  v-else
                  field
                  :input-id="`edit-${col.key}`"
                  :value="row.input[col.key] as string | number"
                  :numeric="col.kind === 'number'"
                  :edited="isEdited(col.key)"
                  :label="col.label"
                  @commit="commit(col.key, $event)"
                />
                <span v-if="isEdited(col.key)" class="num text-xs text-ink-3">Gốc: {{ baseText(col.key) }}</span>
              </div>
            </div>
          </div>
        </fieldset>

        <aside class="grid content-start gap-3" aria-live="polite">
          <p class="eyebrow">Kết quả</p>
          <div v-if="r" :key="`${r.group}:${r.abc}:${r.dosStatus}`" class="rounded-xl border border-line p-3" :style="row.edited ? { animation: 'cell-flash 900ms ease-out' } : undefined">
            <span class="pill"><ColorDot :color="actionColor(r.group)" />{{ r.group }}</span>
            <p class="mt-1.5 text-sm font-semibold text-ink">{{ r.action }}</p>
            <p class="mt-0.5 text-xs leading-snug text-ink-3">{{ r.reasons.join(' · ') }}</p>
            <p v-if="moved" class="mt-1.5 text-xs text-ink-3">Trước khi sửa: <s>{{ row.before?.group }}</s></p>
          </div>
          <p v-else class="rounded-xl border border-dashed border-line p-3 text-sm text-ink-3">SKU đã xoá khỏi phân tích. Bấm "Khôi phục SKU" để tính lại.</p>

          <dl v-if="r" class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg bg-sunken px-2.5 py-2"><dt class="text-ink-3">ABC</dt><dd class="mt-0.5 flex items-center gap-1 font-semibold text-ink"><ColorDot :color="abcColor(r.abc)" />{{ r.abc }}<span v-if="r.isCore" class="pill ml-1 bg-tag! text-tag-ink!">Core</span></dd></div>
            <div class="rounded-lg bg-sunken px-2.5 py-2"><dt class="text-ink-3">ADS</dt><dd class="num mt-0.5 font-semibold text-ink">{{ fmt1(r.ads) }} · {{ r.velocity }}</dd></div>
            <div class="rounded-lg bg-sunken px-2.5 py-2"><dt class="text-ink-3">DOS</dt><dd class="num mt-0.5 font-semibold text-ink">{{ r.dos === Infinity ? '∞' : fmt1(r.dos) }} · {{ r.dosStatus }}</dd></div>
            <div class="rounded-lg bg-sunken px-2.5 py-2"><dt class="text-ink-3">OOS</dt><dd class="num mt-0.5 font-semibold text-ink">{{ pct(r.oosRate, 0) }} · {{ r.oosStatus }}</dd></div>
            <div class="rounded-lg bg-sunken px-2.5 py-2"><dt class="text-ink-3">Growth SL</dt><dd class="num mt-0.5 font-semibold text-ink">{{ pct(r.growth, 0) }} · {{ r.trend }}</dd></div>
            <div class="rounded-lg bg-sunken px-2.5 py-2"><dt class="text-ink-3">Doanh thu</dt><dd class="num mt-0.5 font-semibold text-ink">{{ money(r.revenue) }} · {{ signedPct(r.revenueGrowth, 0) }}</dd></div>
          </dl>

          <button v-if="r" type="button" class="btn justify-center" @click="traced = true">
            <AppIcon name="info" class="size-4" />
            Xem từng bước tính
          </button>
          <p class="num text-xs text-ink-3">Hạng ABC {{ r ? fmt0(r.rank) : '-' }} / {{ fmt0(store.rows.length) }} SKU</p>
        </aside>
      </div>

      <footer class="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
        <button
          type="button"
          class="btn"
          :class="!row.removed && 'text-red-700 dark:text-red-400'"
          @click="toggleRemove"
        >
          <AppIcon :name="row.removed ? 'undo' : 'trash'" class="size-4" />
          {{ row.removed ? 'Khôi phục SKU' : 'Xoá SKU khỏi phân tích' }}
        </button>
        <div class="flex gap-2">
          <button v-if="row.edited && !row.removed" type="button" class="btn" @click="store.resetRow(row.index)">
            <AppIcon name="undo" class="size-4" />
            Về số gốc
          </button>
          <button type="button" class="btn btn-primary" @click="dialog?.close()">Xong</button>
        </div>
      </footer>
    </div>
    <SkuTrace :row="traced ? r ?? null : null" @close="traced = false" />
  </dialog>
</template>
