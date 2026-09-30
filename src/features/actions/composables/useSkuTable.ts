import { computed, ref, watch, type Ref } from 'vue';
import { normalizeKey } from '@/shared/lib/parse';
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef';
import type { ActionGroup, SkuResult } from '@/features/analysis';

export type SortKey = 'sku' | 'category' | 'abc' | 'revenue' | 'gp' | 'ads' | 'adsIndex' | 'stock' | 'dos' | 'oosRate' | 'growth' | 'group';

const TEXT_KEYS: SortKey[] = ['sku', 'category', 'abc', 'group'];
export const PAGE_SIZE = 25;

/** Lọc + sắp xếp + phân trang. Chỉ render PAGE_SIZE dòng để bảng luôn nhẹ dù hàng nghìn SKU. */
export function useSkuTable(rows: Ref<readonly SkuResult[]>, actionFilter: Ref<ActionGroup | 'all'>) {
  const search = useDebouncedRef('', 200);
  const sortKey = ref<SortKey>('revenue');
  const sortDir = ref<1 | -1>(-1);
  const page = ref(1);

  const filtered = computed(() => {
    const q = normalizeKey(search.value);
    let list = rows.value;
    if (actionFilter.value !== 'all') list = list.filter((r) => r.group === actionFilter.value);
    if (q) list = list.filter((r) => normalizeKey(r.sku + r.name).includes(q));
    const k = sortKey.value;
    const d = sortDir.value;
    return [...list].sort((a, b) => {
      const x = a[k];
      const y = b[k];
      if (x == null) return 1;
      if (y == null) return -1;
      if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y, 'vi') * d;
      const nx = Number(x);
      const ny = Number(y);
      if (nx === ny) return 0;
      return (nx > ny ? 1 : -1) * d;
    });
  });

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
  const pageRows = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));

  watch([rows, search, actionFilter], () => (page.value = 1));
  watch(pageCount, (n) => {
    if (page.value > n) page.value = n;
  });

  function toggleSort(key: SortKey) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 1 ? -1 : 1;
    } else {
      sortKey.value = key;
      sortDir.value = TEXT_KEYS.includes(key) ? 1 : -1;
    }
  }

  return { search, actionFilter, sortKey, sortDir, page, pageCount, filtered, pageRows, toggleSort };
}
