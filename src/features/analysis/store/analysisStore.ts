import { defineStore } from 'pinia';
import { computed, markRaw, ref, shallowRef } from 'vue';
import { analyzeSkus } from '../engine/analyze';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../model/thresholds';
import type { ActionGroup, AnalysisSettings, SkuInput, SkuResult } from '../model/types';

export const ALL_CATEGORIES = 'all';

export const DRILL_FIELDS = ['group', 'abc', 'velocity', 'dosStatus', 'oosStatus', 'trend'] as const;
export type DrillField = (typeof DRILL_FIELDS)[number];
export type DrillFilter = Partial<Record<DrillField, string>>;

export const DRILL_LABEL: Record<DrillField, string> = {
  group: 'Action',
  abc: 'ABC',
  velocity: 'Tốc độ bán',
  dosStatus: 'DOS',
  oosStatus: 'OOS',
  trend: 'Xu hướng'
};

export const useAnalysisStore = defineStore('analysis', () => {
  // shallowRef + markRaw: hàng nghìn SKU không cần deep reactivity, tránh proxy chậm và Chart.js đọc proxy.
  const raw = shallowRef<readonly SkuInput[]>([]);
  const original = shallowRef<readonly SkuInput[]>([]);
  const removed = shallowRef<ReadonlySet<number>>(new Set());
  const sourceLabel = ref('');
  const settings = ref<AnalysisSettings>({ ...DEFAULT_SETTINGS });
  const category = ref<string>(ALL_CATEGORIES);
  const drill = ref<DrillFilter>({});
  const actionFilter = computed<ActionGroup | 'all'>({
    get: () => (drill.value.group as ActionGroup | undefined) ?? 'all',
    set: (v) => setDrill('group', v === 'all' ? null : v)
  });

  const activeRaw = computed<readonly SkuInput[]>(() =>
    removed.value.size ? markRaw(raw.value.filter((_, i) => !removed.value.has(i))) : raw.value
  );
  const rows = computed<readonly SkuResult[]>(() => markRaw(analyzeSkus(activeRaw.value, settings.value)));
  const hasData = computed(() => raw.value.length > 0);
  const categories = computed(() => [...new Set(rows.value.map((r) => r.category))].sort((a, b) => a.localeCompare(b, 'vi')));
  const categoryRows = computed<readonly SkuResult[]>(() =>
    category.value === ALL_CATEGORIES ? rows.value : markRaw(rows.value.filter((r) => r.category === category.value))
  );

  const applyDrill = (list: readonly SkuResult[], skip: readonly DrillField[]) => {
    const active = (Object.entries(drill.value) as [DrillField, string][]).filter(([f]) => !skip.includes(f));
    if (!active.length) return list;
    return markRaw(list.filter((r) => active.every(([f, v]) => r[f] === v)));
  };

  const visibleRows = computed<readonly SkuResult[]>(() => applyDrill(categoryRows.value, []));
  const crossRows = computed(() => {
    const out = {} as Record<DrillField, readonly SkuResult[]>;
    for (const f of DRILL_FIELDS) out[f] = f in drill.value ? applyDrill(categoryRows.value, [f]) : visibleRows.value;
    return out;
  });
  const matrixRows = computed(() =>
    'abc' in drill.value || 'velocity' in drill.value ? applyDrill(categoryRows.value, ['abc', 'velocity']) : visibleRows.value
  );
  const hasDrill = computed(() => Object.keys(drill.value).length > 0);

  const editedIndexes = computed(() => {
    const out: number[] = [];
    raw.value.forEach((r, i) => {
      if (r !== original.value[i] || removed.value.has(i)) out.push(i);
    });
    return out;
  });
  const editedCount = computed(() => editedIndexes.value.length);
  const removedCount = computed(() => removed.value.size);
  const baselineRows = computed<readonly SkuResult[]>(() =>
    editedCount.value ? markRaw(analyzeSkus(original.value, settings.value)) : rows.value
  );

  function setData(data: SkuInput[], label: string) {
    raw.value = markRaw(data);
    original.value = raw.value;
    removed.value = new Set();
    sourceLabel.value = label;
    category.value = ALL_CATEGORIES;
    drill.value = {};
  }

  function updateRow(index: number, patch: Partial<SkuInput>) {
    const current = raw.value[index];
    if (!current) return;
    const next = { ...current, ...patch };
    const base = original.value[index];
    const same = (Object.keys(next) as (keyof SkuInput)[]).every((k) => next[k] === base[k]);
    const copy = raw.value.slice();
    copy[index] = same ? base : next;
    raw.value = markRaw(copy);
  }

  function resetRow(index: number) {
    restoreRow(index);
    if (raw.value[index] === original.value[index]) return;
    const copy = raw.value.slice();
    copy[index] = original.value[index];
    raw.value = markRaw(copy);
  }

  function removeRow(index: number) {
    if (removed.value.has(index)) return;
    removed.value = new Set(removed.value).add(index);
  }

  function restoreRow(index: number) {
    if (!removed.value.has(index)) return;
    const next = new Set(removed.value);
    next.delete(index);
    removed.value = next;
  }

  function resetAll() {
    raw.value = original.value;
    removed.value = new Set();
  }

  function updateSettings(patch: Partial<AnalysisSettings>) {
    settings.value = sanitizeSettings({ ...settings.value, ...patch });
  }

  function setCategory(next: string) {
    category.value = next;
  }

  function setActionFilter(next: ActionGroup | 'all') {
    actionFilter.value = next;
  }

  function setDrill(field: DrillField, value: string | null) {
    const next = { ...drill.value };
    if (value == null) delete next[field];
    else next[field] = value;
    drill.value = next;
  }

  function toggleDrill(field: DrillField, value: string) {
    setDrill(field, drill.value[field] === value ? null : value);
  }

  function setDrillPair(patch: DrillFilter) {
    const same = (Object.entries(patch) as [DrillField, string][]).every(([f, v]) => drill.value[f] === v);
    const next = { ...drill.value };
    for (const [f, v] of Object.entries(patch) as [DrillField, string][]) {
      if (same) delete next[f];
      else next[f] = v;
    }
    drill.value = next;
  }

  function clearDrill() {
    drill.value = {};
  }

  return {
    raw, original, removed, activeRaw, sourceLabel, settings, category, actionFilter, drill,
    rows, hasData, categories, categoryRows, visibleRows, crossRows, matrixRows, hasDrill, editedIndexes, editedCount, removedCount, baselineRows,
    setData, updateRow, resetRow, removeRow, restoreRow, resetAll, updateSettings, setCategory, setActionFilter, setDrill, toggleDrill, setDrillPair, clearDrill
  };
});
