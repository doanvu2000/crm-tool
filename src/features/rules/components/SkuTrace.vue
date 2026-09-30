<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { ACTION_GROUPS, useAnalysisStore, type SkuResult } from '@/features/analysis';
import { usePalette } from '@/shared/composables/usePalette';
import AppIcon from '@/shared/ui/AppIcon.vue';
import ColorDot from '@/shared/ui/ColorDot.vue';
import { traceSku } from '../lib/trace';

const props = defineProps<{ row: SkuResult | null }>();
const emit = defineEmits<{ close: [] }>();

const store = useAnalysisStore();
const palette = usePalette();
const dialog = ref<HTMLDialogElement>();

const live = computed(() => (props.row ? store.rows.find((r) => r.sku === props.row!.sku) ?? props.row : null));
const categoryPath = computed(() => live.value ? [live.value.category, live.value.subcat1, live.value.subcat2].filter(Boolean).join(' / ') : '');

const categoryAds = computed(() => {
  const r = live.value;
  if (!r) return null;
  const same = store.rows.filter((x) => x.category === r.category);
  return same.length ? same.reduce((s, x) => s + x.ads, 0) / same.length : null;
});

const steps = computed(() => (live.value ? traceSku(live.value, store.settings, categoryAds.value) : []));
const groupColor = computed(() => (live.value ? palette.value.action[ACTION_GROUPS.indexOf(live.value.group)] : ''));

watch(
  () => props.row,
  async (r) => {
    await nextTick();
    if (r && !dialog.value?.open) dialog.value?.showModal();
    if (!r && dialog.value?.open) dialog.value.close();
  }
);
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="trace-title"
    class="m-auto max-h-[88dvh] w-[min(640px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-[rgb(11_17_23/0.55)]"
    @close="emit('close')"
    @click.self="dialog?.close()"
  >
    <div v-if="live" class="flex max-h-[88dvh] flex-col">
      <header class="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div class="min-w-0">
          <p class="eyebrow">Cách tính từng bước</p>
          <h2 id="trace-title" class="num mt-1 text-lg font-semibold">{{ live.sku }}</h2>
          <p class="truncate text-[13px] text-ink-3" :title="categoryPath">{{ live.name }}<template v-if="live.name"> · </template>{{ categoryPath }}</p>
        </div>
        <button type="button" class="grid size-10 flex-none place-items-center rounded-lg text-ink-3 hover:text-ink" aria-label="Đóng" @click="dialog?.close()">
          <AppIcon name="close" class="size-5" />
        </button>
      </header>

      <ol class="grid gap-2 overflow-y-auto px-5 py-4">
        <li v-for="(s, i) in steps" :key="s.title" class="grid grid-cols-[1.75rem_1fr] gap-x-2 rounded-xl px-3 py-2.5" :class="i === steps.length - 1 ? 'border border-ink' : 'bg-sunken'">
          <span class="num pt-px text-xs font-semibold text-ink-3">{{ i + 1 }}</span>
          <div class="min-w-0">
            <p class="text-[13px] font-semibold text-ink">{{ s.title }}</p>
            <p class="num mt-0.5 text-xs text-ink-3">{{ s.formula }}</p>
            <ul v-if="s.checks" class="mt-1.5 grid gap-0.5 text-xs">
              <li v-for="c in s.checks" :key="c.text" class="flex items-start gap-1.5" :class="c.pass ? 'text-ink' : 'text-ink-3'">
                <span class="w-3 flex-none font-semibold" aria-hidden="true">{{ c.pass ? '✓' : '✕' }}</span>
                <span><span class="sr-only">{{ c.pass ? 'Đạt: ' : 'Không đạt: ' }}</span>{{ c.text }}</span>
              </li>
            </ul>
            <p class="mt-1 text-sm text-ink">
              <ColorDot v-if="i === steps.length - 1" :color="groupColor" class="mr-1 align-middle" />{{ s.result }}
            </p>
          </div>
        </li>
      </ol>
    </div>
  </dialog>
</template>
