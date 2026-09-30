<script setup lang="ts">
import { computed } from 'vue';
import { ACTION_GROUPS, countBy, sumBy, useAnalysisStore, type ActionGroup, type SkuResult } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import { fmt0, pct } from '@/shared/lib/format';
import { MethodInfo } from '@/features/rules';

const props = defineProps<{ rows: readonly SkuResult[]; periodDays: number; source: string }>();
const emit = defineEmits<{ pick: [group: ActionGroup] }>();

const store = useAnalysisStore();
const palette = usePalette();

const groups = computed(() => {
  const counts = countBy(props.rows, 'group', ACTION_GROUPS);
  const total = props.rows.length || 1;
  return ACTION_GROUPS.map((g, i) => ({ group: g, count: counts[i], share: counts[i] / total, color: palette.value.action[i] }));
});

const countOf = (g: ActionGroup) => groups.value.find((x) => x.group === g)?.count ?? 0;

const headline = computed(() => {
  const up = countOf('Tăng PO');
  const cut = countOf('Giảm PO') + countOf('Stop PO / Xả hàng');
  if (!up && !cut) return 'Chưa SKU nào cần đổi lượng PO trong kỳ này.';
  if (!cut) return `${fmt0(up)} SKU cần tăng PO, chưa SKU nào phải cắt giảm.`;
  if (!up) return `${fmt0(cut)} SKU nên giảm hoặc dừng nhập, chưa SKU nào cần tăng.`;
  return `${fmt0(up)} SKU cần tăng PO, ${fmt0(cut)} SKU nên giảm hoặc dừng nhập.`;
});

const detail = computed(() => {
  const revenue = sumBy(props.rows, (r) => r.revenue);
  const core = props.rows.filter((r) => r.isCore);
  const review = countOf('Review');
  const coreText = `${fmt0(core.length)} Core SKU giữ ${pct(revenue ? sumBy(core, (r) => r.revenue) / revenue : 0)} doanh thu`;
  return review ? `${coreText}. ${fmt0(review)} SKU cần review thủ công trước khi đặt hàng.` : `${coreText}.`;
});

// Đổi nguồn dữ liệu thì dựng lại dải để chạy lại hiệu ứng mở rộng.
const stripKey = computed(() => `${props.source}:${props.rows.length}`);
</script>

<template>
  <section class="relative overflow-hidden rounded-2xl border border-line bg-surface" aria-labelledby="decision-title">
    <!-- Dải nhãn kệ: thân vàng + lỗ đục ở mép trái. -->
    <div class="absolute inset-y-0 left-0 w-3 bg-tag sm:w-4" aria-hidden="true">
      <span class="absolute left-1/2 top-5 size-2 -translate-x-1/2 rounded-full bg-canvas sm:size-2.5" />
    </div>

    <div class="py-5 pl-7 pr-4 sm:py-7 sm:pl-10 sm:pr-7">
      <div class="flex items-start justify-between gap-2">
        <p class="eyebrow pt-1.5">Kỳ {{ periodDays }} ngày · {{ fmt0(rows.length) }} SKU · {{ source }}</p>
        <div class="-mr-1.5 -mt-1"><MethodInfo topic="decision" /></div>
      </div>
      <h2 id="decision-title" class="mt-2 max-w-[28ch] text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-balance sm:text-[34px]">
        {{ headline }}
      </h2>
      <p class="mt-2 max-w-prose text-sm text-ink-2">{{ detail }}</p>

      <div :key="stripKey" class="mt-6 flex h-4 gap-0.5 overflow-hidden rounded-full bg-sunken sm:h-5" role="img"
        :aria-label="groups.map((g) => `${g.group}: ${g.count} SKU`).join(', ')">
        <span
          v-for="(g, i) in groups.filter((x) => x.count > 0)"
          :key="g.group"
          class="h-full origin-left"
          :style="{
            flexGrow: g.count,
            flexBasis: 0,
            background: g.color,
            animation: `strip-grow 420ms cubic-bezier(.2,.8,.2,1) ${i * 60}ms both`
          }"
        />
      </div>

      <ul class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <li v-for="g in groups" :key="g.group">
          <button
            type="button"
            class="group flex min-h-11 w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-40"
            :class="store.actionFilter === g.group ? 'border-ink bg-sunken' : 'border-line hover:border-ink-3'"
            :aria-pressed="store.actionFilter === g.group"
            :disabled="!g.count"
            :title="g.count ? `Xem ${g.count} SKU nhóm ${g.group} trong bảng` : undefined"
            @click="emit('pick', g.group)"
          >
            <span class="mt-1.5 inline-block size-2.5 flex-none rounded-[3px]" :style="{ background: g.color }" aria-hidden="true" />
            <span class="min-w-0">
              <span class="block truncate text-[13px] text-ink-2">{{ g.group }}</span>
              <span class="num block text-xl font-semibold leading-tight text-ink">{{ fmt0(g.count) }}</span>
              <span class="num block text-xs text-ink-3">{{ pct(g.share, 0) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>
