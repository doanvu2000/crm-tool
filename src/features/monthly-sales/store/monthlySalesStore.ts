import { defineStore } from 'pinia';
import { computed, markRaw, ref, shallowRef } from 'vue';
import type { MonthlySaleInput } from '../model/types';
import { loadMonthlySales, saveMonthlySales } from './monthlySalesPersistence';

export const useMonthlySalesStore = defineStore('monthlySales', () => {
  const rows = shallowRef<readonly MonthlySaleInput[]>([]);
  const sourceLabel = ref('');
  const selectedStores = ref<string[]>([]);
  const stores = computed(() => [...new Set(rows.value.map((row) => row.store))].sort((a, b) => a.localeCompare(b, 'vi')));
  const months = computed(() => [...new Set(rows.value.map((row) => row.month))].sort());
  const hasData = computed(() => rows.value.length > 0);

  function setData(data: MonthlySaleInput[], label: string) {
    rows.value = markRaw(data);
    sourceLabel.value = label;
    selectedStores.value = [...new Set(data.map((row) => row.store))].sort((a, b) => a.localeCompare(b, 'vi'));
    saveMonthlySales({ rows: [...data], sourceLabel: label });
  }

  async function restoreSavedData() {
    const saved = await loadMonthlySales();
    if (!saved) return;
    rows.value = markRaw(saved.rows);
    sourceLabel.value = saved.sourceLabel;
    selectedStores.value = [...new Set(saved.rows.map((row) => row.store))].sort((a, b) => a.localeCompare(b, 'vi'));
  }

  function toggleStore(store: string) {
    selectedStores.value = selectedStores.value.includes(store)
      ? selectedStores.value.filter((item) => item !== store)
      : [...selectedStores.value, store];
  }

  function selectAllStores() {
    selectedStores.value = [...stores.value];
  }

  function clearStores() {
    selectedStores.value = [];
  }

  return { rows, sourceLabel, selectedStores, stores, months, hasData, setData, restoreSavedData, toggleStore, selectAllStores, clearStores };
});
