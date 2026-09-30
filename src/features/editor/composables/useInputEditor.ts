import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAnalysisStore, type SkuInput, type SkuResult } from '@/features/analysis';
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef';
import { normalizeKey } from '@/shared/lib/parse';

export const EDITOR_PAGE_SIZE = 25;

export interface EditorRow {
  index: number;
  input: SkuInput;
  base: SkuInput;
  edited: boolean;
  result?: SkuResult;
  before?: SkuResult;
}

const bySku = (rows: readonly SkuResult[]) => {
  const map = new Map<string, SkuResult>();
  for (const r of rows) if (!map.has(r.sku)) map.set(r.sku, r);
  return map;
};

export function useInputEditor() {
  const store = useAnalysisStore();
  const { raw, original, rows, baselineRows, editedIndexes } = storeToRefs(store);

  const search = useDebouncedRef('', 200);
  const onlyEdited = ref(false);
  const page = ref(1);

  const resultMap = computed(() => bySku(rows.value));
  const beforeMap = computed(() => bySku(baselineRows.value));
  const editedSet = computed(() => new Set(editedIndexes.value));

  const filtered = computed(() => {
    const q = normalizeKey(search.value);
    const out: number[] = [];
    raw.value.forEach((r, i) => {
      if (onlyEdited.value && !editedSet.value.has(i)) return;
      if (q && !normalizeKey(r.sku + r.name + r.category).includes(q)) return;
      out.push(i);
    });
    return out;
  });

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / EDITOR_PAGE_SIZE)));

  const pageRows = computed<EditorRow[]>(() =>
    filtered.value.slice((page.value - 1) * EDITOR_PAGE_SIZE, page.value * EDITOR_PAGE_SIZE).map((index) => {
      const input = raw.value[index];
      const edited = editedSet.value.has(index);
      return {
        index,
        input,
        base: original.value[index],
        edited,
        result: resultMap.value.get(input.sku),
        before: edited ? beforeMap.value.get(input.sku) : undefined
      };
    })
  );

  watch([search, onlyEdited, () => original.value], () => (page.value = 1));
  watch(pageCount, (n) => {
    if (page.value > n) page.value = n;
  });

  return { search, onlyEdited, page, pageCount, filtered, pageRows };
}
