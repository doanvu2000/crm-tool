import { defineStore } from 'pinia';
import { computed, markRaw, ref, shallowRef } from 'vue';
import { analyzeSkus } from '../engine/analyze';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../model/thresholds';
import type { ActionGroup, AnalysisSettings, SkuInput, SkuResult } from '../model/types';
import { loadSavedAnalysis, saveAnalysis } from './analysisPersistence';

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
  // Mảng rỗng nghĩa là tổng tất cả ngành hàng. Mảng nhỏ này chỉ phục vụ UI
  // filter nên có thể reactive bình thường; dữ liệu SKU vẫn giữ shallowRef.
  const selectedCategories = ref<string[]>([]);
  const selectedSubcat1 = ref('');
  const selectedSubcat2 = ref('');
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
  const categoryRows = computed<readonly SkuResult[]>(() => {
    if (selectedCategories.value.length === 0 && !selectedSubcat1.value && !selectedSubcat2.value) return rows.value;
    const scoped = selectedCategories.value.length === 0
      ? rows.value
      : rows.value.filter((r) => selectedCategories.value.includes(r.category));
    return markRaw(scoped.filter((r) =>
      (!selectedSubcat1.value || r.subcat1 === selectedSubcat1.value) &&
      (!selectedSubcat2.value || r.subcat2 === selectedSubcat2.value)
    ));
  });

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

  let persistTimer: ReturnType<typeof setTimeout> | undefined;
  function persistData(delay = 0) {
    if (persistTimer) clearTimeout(persistTimer);
    if (delay > 0) {
      persistTimer = setTimeout(() => {
        persistTimer = undefined;
        persistData();
      }, delay);
      return;
    }
    saveAnalysis({
      raw: [...raw.value],
      original: [...original.value],
      removed: [...removed.value],
      sourceLabel: sourceLabel.value,
      settings: { ...settings.value }
    });
  }

  async function restoreSavedData() {
    const saved = await loadSavedAnalysis();
    if (!saved) return;
    raw.value = markRaw(saved.raw);
    original.value = markRaw(saved.original);
    removed.value = new Set(saved.removed.filter((index) => Number.isInteger(index) && index >= 0 && index < saved.raw.length));
    sourceLabel.value = saved.sourceLabel;
    const restoredSettings = saved.settings && typeof saved.settings === 'object'
      ? { ...DEFAULT_SETTINGS, ...saved.settings }
      : { ...DEFAULT_SETTINGS };
    if (restoredSettings.basis !== 'ads' && restoredSettings.basis !== 'index') restoredSettings.basis = DEFAULT_SETTINGS.basis;
    settings.value = sanitizeSettings(restoredSettings);
  }

  function setData(data: SkuInput[], label: string) {
    raw.value = markRaw(data);
    original.value = raw.value;
    removed.value = new Set();
    sourceLabel.value = label;
    selectedCategories.value = [];
    selectedSubcat1.value = '';
    selectedSubcat2.value = '';
    drill.value = {};
    persistData();
  }

  function setDerivedData(data: SkuInput[], label: string) {
    raw.value = markRaw(data);
    original.value = raw.value;
    removed.value = new Set();
    sourceLabel.value = label;
    const availableCategories = new Set(data.map((row) => row.category));
    selectedCategories.value = selectedCategories.value.filter((category) => availableCategories.has(category));
    const scoped = selectedCategories.value.length
      ? data.filter((row) => selectedCategories.value.includes(row.category))
      : data;
    const availableSubcat1 = new Set(scoped.map((row) => row.subcat1).filter(Boolean));
    if (selectedSubcat1.value && !availableSubcat1.has(selectedSubcat1.value)) {
      selectedSubcat1.value = '';
      selectedSubcat2.value = '';
    } else if (selectedSubcat2.value && !scoped.some((row) => row.subcat1 === selectedSubcat1.value && row.subcat2 === selectedSubcat2.value)) {
      selectedSubcat2.value = '';
    }
    persistData();
  }

  function updateRow(index: number, patch: Partial<SkuInput>) {
    const current = raw.value[index];
    if (!current) return;
    const next = { ...current, ...patch };
    const base = original.value[index];
    const same = (Object.keys(next) as (keyof SkuInput)[]).every((k) =>
      next[k] === base[k] || ((k === 'subcat1' || k === 'subcat2') && !next[k] && !base[k])
    );
    const copy = raw.value.slice();
    copy[index] = same ? base : next;
    raw.value = markRaw(copy);
    persistData(250);
  }

  function resetRow(index: number) {
    restoreRow(index);
    if (raw.value[index] === original.value[index]) return;
    const copy = raw.value.slice();
    copy[index] = original.value[index];
    raw.value = markRaw(copy);
    persistData();
  }

  function removeRow(index: number) {
    if (removed.value.has(index)) return;
    removed.value = new Set(removed.value).add(index);
    persistData();
  }

  function restoreRow(index: number) {
    if (!removed.value.has(index)) return;
    const next = new Set(removed.value);
    next.delete(index);
    removed.value = next;
    persistData();
  }

  function resetAll() {
    raw.value = original.value;
    removed.value = new Set();
    persistData();
  }

  function updateSettings(patch: Partial<AnalysisSettings>) {
    settings.value = sanitizeSettings({ ...settings.value, ...patch });
    persistData();
  }

  function setCategories(next: readonly string[]) {
    const valid = new Set(categories.value);
    selectedCategories.value = [...new Set(next)].filter((category) => valid.has(category));
    selectedSubcat1.value = '';
    selectedSubcat2.value = '';
  }

  function setSubcat1(value: string) {
    selectedSubcat1.value = value;
    selectedSubcat2.value = '';
  }

  function setSubcat2(value: string) {
    selectedSubcat2.value = value;
  }

  function toggleCategory(category: string) {
    const next = selectedCategories.value.includes(category)
      ? selectedCategories.value.filter((value) => value !== category)
      : [...selectedCategories.value, category];
    setCategories(next);
  }

  function selectAllCategories() {
    setCategories([]);
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
    raw, original, removed, activeRaw, sourceLabel, settings, selectedCategories, selectedSubcat1, selectedSubcat2, actionFilter, drill,
    rows, hasData, categories, categoryRows, visibleRows, crossRows, matrixRows, hasDrill, editedIndexes, editedCount, removedCount, baselineRows,
    setData, setDerivedData, restoreSavedData, updateRow, resetRow, removeRow, restoreRow, resetAll, updateSettings, setCategories, setSubcat1, setSubcat2, toggleCategory, selectAllCategories, setActionFilter, setDrill, toggleDrill, setDrillPair, clearDrill
  };
});
