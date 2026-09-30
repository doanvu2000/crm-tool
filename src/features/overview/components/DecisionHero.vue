<script setup lang="ts">
import { computed } from 'vue';
import { ABC_CLASSES, sumBy, useAnalysisStore, type AbcClass, type SkuResult } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, pct } from '@/shared/lib/format';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[]; categories: readonly string[]; source: string }>();
const emit = defineEmits<{ pick: [abc: AbcClass] }>();

const store = useAnalysisStore();
const palette = usePalette();

const groups = computed(() => {
  const sales = sumBy(props.rows, (r) => r.revenue);
  const detail: Record<AbcClass, { label: string; action: string }> = {
    A: { label: 'Phải có', action: 'Ưu tiên hàng, hạn chế OOS' },
    B: { label: 'Nên có', action: 'Duy trì và tìm cơ hội tăng bán' },
    C: { label: 'Cân nhắc có', action: 'Giảm đầu tư, xem xét tiếp tục bán' }
  };
  return ABC_CLASSES.map((abc, i) => {
    const rows = props.rows.filter((row) => row.abc === abc);
    return { abc, ...detail[abc], count: rows.length, share: sales ? sumBy(rows, (row) => row.revenue) / sales : 0, color: palette.value.abc[i] };
  });
});

const scope = computed(() => {
  if (!props.categories.length) return 'tổng tất cả ngành hàng';
  if (props.categories.length === 1) return `ngành ${props.categories[0]}`;
  return `${props.categories.length} ngành hàng đã chọn`;
});
const headline = computed(() => `Ưu tiên ABC của ${scope.value}`);
const detail = computed(() => props.categories.length === 1
  ? 'Sales xác định nhóm A, B, C. Các chỉ số tồn kho, OOS và ngoại lệ chỉ được dùng để quyết định hành động sau đó.'
  : 'Kết quả đang tổng hợp theo phạm vi đã chọn. Mỗi SKU vẫn giữ class ABC được xếp riêng trong ngành hàng của nó.');
</script>

<template>
  <section class="relative overflow-hidden rounded-2xl border border-line bg-surface" aria-labelledby="decision-title">
    <!-- Dải nhãn kệ teal + lỗ đục ở mép trái. -->
    <div class="absolute inset-y-0 left-0 w-3 bg-tag sm:w-4" aria-hidden="true">
      <span class="absolute left-1/2 top-5 size-2 -translate-x-1/2 rounded-full bg-canvas sm:size-2.5" />
    </div>

    <div class="py-5 pl-7 pr-4 sm:py-7 sm:pl-10 sm:pr-7">
      <div class="flex items-start justify-between gap-2">
        <p class="eyebrow pt-1.5">Sales · Rolling 8 tuần · {{ fmt0(rows.length) }} SKU · {{ source }}</p>
        <div class="-mr-1.5 -mt-1"><MethodInfo topic="decision" /></div>
      </div>
      <h2 id="decision-title" class="mt-2 max-w-[28ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance sm:text-[34px]">
        {{ headline }}
      </h2>
      <p class="mt-2 max-w-prose text-sm text-ink-2">{{ detail }}</p>

      <div class="mt-6 flex h-4 gap-0.5 overflow-hidden rounded-full bg-sunken sm:h-5" role="img"
        :aria-label="groups.map((g) => `Nhóm ${g.abc}: ${g.count} SKU`).join(', ')">
        <span
          v-for="g in groups.filter((x) => x.count > 0)"
          :key="g.abc"
          class="h-full origin-left"
          :style="{
            flexGrow: g.share || g.count,
            flexBasis: 0,
            background: g.color
          }"
        />
      </div>

      <ul class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <li v-for="g in groups" :key="g.abc">
          <button
            type="button"
            class="group flex min-h-11 w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-40"
            :class="store.drill.abc === g.abc ? 'border-ink bg-sunken' : 'border-line hover:border-ink-3'"
            :aria-pressed="store.drill.abc === g.abc"
            :disabled="!g.count"
            :title="g.count ? `Lọc ${g.count} SKU nhóm ${g.abc}` : undefined"
            @click="emit('pick', g.abc)"
          >
            <span class="mt-1.5 inline-block size-2.5 flex-none rounded-[3px]" :style="{ background: g.color }" aria-hidden="true" />
            <span class="min-w-0">
              <span class="block truncate text-[13px] text-ink-2">{{ g.abc }} · {{ g.label }}</span>
              <span class="num block text-xl font-semibold leading-tight text-ink">{{ fmt0(g.count) }}</span>
              <span class="block truncate text-xs text-ink-3">{{ pct(g.share, 0) }} DT · {{ g.action }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
