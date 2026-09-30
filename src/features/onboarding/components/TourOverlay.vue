<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAnalysisStore } from '@/features/analysis';
import { useIsNarrow } from '@/shared/composables/useMediaQuery';
import AppIcon from '@/shared/ui/AppIcon.vue';
import { findTarget, useTour } from '../composables/useTour';

const PAD = 8;
const GAP = 14;
const EDGE = 12;
const HEADER = 128;

const store = useAnalysisStore();
const { seen, phase, steps, index, active, step, isLast, start, next, prev, finish, skipAll } = useTour();
const narrow = useIsNarrow();

const hole = ref<{ top: number; left: number; width: number; height: number } | null>(null);
const popEl = ref<HTMLElement>();
const titleEl = ref<HTMLElement>();
const popSize = ref({ w: 360, h: 220 });
const viewport = ref({ w: window.innerWidth, h: window.innerHeight });
let raf = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function measure() {
  viewport.value = { w: window.innerWidth, h: window.innerHeight };
  const el = step.value ? findTarget(step.value.target) : null;
  if (el) {
    const r = el.getBoundingClientRect();
    const top = Math.max(r.top, HEADER - PAD);
    const bottom = Math.min(r.bottom, window.innerHeight - EDGE);
    hole.value = { top: top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: Math.max(bottom - top, 0) + PAD * 2 };
  } else {
    hole.value = null;
  }
  if (popEl.value) {
    const p = popEl.value.getBoundingClientRect();
    popSize.value = { w: p.width, h: p.height };
  }
}

function schedule() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(measure);
}

async function show() {
  if (!active.value || !step.value) return;
  await nextTick();
  const el = findTarget(step.value.target);
  if (!el) return next();
  const tall = el.offsetHeight > window.innerHeight * 0.55;
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: tall ? 'start' : 'center' });
  schedule();
  titleEl.value?.focus({ preventScroll: true });
}

watch([active, index], show);

const popStyle = computed(() => {
  const h = hole.value;
  const { w, h: ph } = popSize.value;
  const vw = viewport.value.w;
  const vh = viewport.value.h;
  if (narrow.value) {
    const targetLow = h ? h.top + h.height / 2 > vh / 2 : false;
    return targetLow ? { top: `${HEADER}px`, left: `${EDGE}px`, right: `${EDGE}px` } : { bottom: `${EDGE}px`, left: `${EDGE}px`, right: `${EDGE}px` };
  }
  if (!h) return { top: `${(vh - ph) / 2}px`, left: `${(vw - w) / 2}px` };
  const below = h.top + h.height + GAP;
  const above = h.top - GAP - ph;
  const top = below + ph <= vh - EDGE ? below : above >= HEADER ? above : Math.max(HEADER, vh - ph - EDGE);
  const left = Math.min(Math.max(h.left, EDGE), vw - w - EDGE);
  return { top: `${top}px`, left: `${left}px` };
});

const holeStyle = computed(() => {
  const h = hole.value;
  if (!h) return { top: '50%', left: '50%', width: '0px', height: '0px' };
  return { top: `${h.top}px`, left: `${h.left}px`, width: `${h.width}px`, height: `${h.height}px` };
});

function primary() {
  if (step.value?.cta) {
    findTarget(step.value.target)?.click();
    finish();
    return;
  }
  next();
}

function onKey(e: KeyboardEvent) {
  if (!active.value) return;
  const tag = (e.target as HTMLElement | null)?.tagName;
  const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
  if (e.key === 'Escape') finish();
  else if (!typing && e.key === 'ArrowRight') next();
  else if (!typing && e.key === 'ArrowLeft') prev();
}

watch(
  () => store.hasData,
  (has) => {
    if (!has || seen.value.data) return;
    if (phase.value === 'intro') finish();
    clearTimeout(timer);
    timer = setTimeout(() => start('data'), 700);
  }
);

onMounted(() => {
  window.addEventListener('scroll', schedule, { capture: true, passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('keydown', onKey);
  if (!store.hasData && !seen.value.intro) timer = setTimeout(() => start('intro'), 500);
  else if (store.hasData && !seen.value.data) timer = setTimeout(() => start('data'), 700);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  clearTimeout(timer);
  window.removeEventListener('scroll', schedule, { capture: true });
  window.removeEventListener('resize', schedule);
  document.removeEventListener('keydown', onKey);
});
</script>

<template>
  <Teleport to="body">
    <template v-if="active && step">
      <div
        class="pointer-events-none fixed z-[60] rounded-2xl outline-2 outline-tag transition-[top,left,width,height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        :style="{ ...holeStyle, boxShadow: '0 0 0 200vmax rgb(11 17 23 / 0.55)' }"
        aria-hidden="true"
      >
        <span class="num absolute -top-3 left-4 inline-flex h-6 items-center gap-1.5 rounded-md bg-tag pl-1.5 pr-2 text-xs font-semibold text-tag-ink">
          <span class="size-1.5 rounded-full bg-canvas" />
          {{ index + 1 }} / {{ steps.length }}
        </span>
      </div>

      <div
        ref="popEl"
        :key="`${phase}:${index}`"
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        class="fixed z-[61] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:w-[380px]"
        :style="{ ...popStyle, animation: 'tour-in 220ms cubic-bezier(.2,.8,.2,1) both' }"
      >
        <div class="absolute inset-y-0 left-0 w-3 bg-tag" aria-hidden="true">
          <span class="absolute left-1/2 top-4 size-1.5 -translate-x-1/2 rounded-full bg-canvas" />
        </div>
        <div class="py-4 pl-7 pr-4">
          <div class="flex items-start justify-between gap-3">
            <p class="eyebrow">Hướng dẫn · {{ index + 1 }}/{{ steps.length }}</p>
            <button type="button" class="-mr-2 -mt-2 grid size-9 place-items-center rounded-lg text-ink-3 hover:text-ink" aria-label="Đóng hướng dẫn" @click="finish">
              <AppIcon name="close" class="size-4" />
            </button>
          </div>
          <h2 id="tour-title" ref="titleEl" tabindex="-1" class="text-[17px] focus:outline-none font-semibold leading-snug tracking-tight">{{ step.title }}</h2>
          <p id="tour-body" class="mt-1.5 text-sm leading-relaxed text-ink-2">{{ step.body }}</p>

          <div class="mt-3 flex gap-1" aria-hidden="true">
            <span v-for="(_, i) in steps" :key="i" class="h-1 flex-1 rounded-full" :class="i <= index ? 'bg-ink' : 'bg-line'" />
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" class="min-h-11 rounded-lg px-1 text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline sm:min-h-9" @click="skipAll">
              Bỏ qua hướng dẫn
            </button>
            <div class="flex gap-2">
              <button v-if="index > 0" type="button" class="btn whitespace-nowrap px-3 sm:min-h-9" @click="prev">Quay lại</button>
              <button v-if="step.cta" type="button" class="btn whitespace-nowrap px-3 sm:min-h-9" @click="finish">Để sau</button>
              <button type="button" class="btn btn-primary whitespace-nowrap px-3.5 sm:min-h-9" @click="primary">
                {{ step.cta ?? (isLast ? 'Xong' : 'Tiếp') }}
                <AppIcon v-if="!isLast || step.cta" name="arrow-right" class="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Teleport>
</template>
