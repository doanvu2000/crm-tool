import { defineStore } from 'pinia';
import { computed, markRaw, ref, shallowRef } from 'vue';
import { analyzeSkus } from '../engine/analyze';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../model/thresholds';
import type { ActionGroup, AnalysisSettings, SkuInput, SkuResult } from '../model/types';

export const ALL_CATEGORIES = 'all';

export const useAnalysisStore = defineStore('analysis', () => {
  // shallowRef + markRaw: hàng nghìn SKU không cần deep reactivity, tránh proxy chậm và Chart.js đọc proxy.
  const raw = shallowRef<readonly SkuInput[]>([]);
  const original = shallowRef<readonly SkuInput[]>([]);
  const sourceLabel = ref('');
  const settings = ref<AnalysisSettings>({ ...DEFAULT_SETTINGS });
  const category = ref<string>(ALL_CATEGORIES);
  // Dùng chung giữa thẻ quyết định (hero) và bảng SKU: bấm nhóm trên hero thì bảng lọc theo.
  const actionFilter = ref<ActionGroup | 'all'>('all');

  const rows = computed<readonly SkuResult[]>(() => markRaw(analyzeSkus(raw.value, settings.value)));
  const hasData = computed(() => raw.value.length > 0);
  const categories = computed(() => [...new Set(rows.value.map((r) => r.category))].sort((a, b) => a.localeCompare(b, 'vi')));
  const visibleRows = computed<readonly SkuResult[]>(() =>
    category.value === ALL_CATEGORIES ? rows.value : markRaw(rows.value.filter((r) => r.category === category.value))
  );

  const editedIndexes = computed(() => {
    const out: number[] = [];
    raw.value.forEach((r, i) => {
      if (r !== original.value[i]) out.push(i);
    });
    return out;
  });
  const editedCount = computed(() => editedIndexes.value.length);
  const baselineRows = computed<readonly SkuResult[]>(() =>
    editedCount.value ? markRaw(analyzeSkus(original.value, settings.value)) : rows.value
  );

  function setData(data: SkuInput[], label: string) {
    raw.value = markRaw(data);
    original.value = raw.value;
    sourceLabel.value = label;
    category.value = ALL_CATEGORIES;
    actionFilter.value = 'all';
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
    if (raw.value[index] === original.value[index]) return;
    const copy = raw.value.slice();
    copy[index] = original.value[index];
    raw.value = markRaw(copy);
  }

  function resetAll() {
    raw.value = original.value;
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

  return {
    raw, original, sourceLabel, settings, category, actionFilter,
    rows, hasData, categories, visibleRows, editedIndexes, editedCount, baselineRows,
    setData, updateRow, resetRow, resetAll, updateSettings, setCategory, setActionFilter
  };
});
